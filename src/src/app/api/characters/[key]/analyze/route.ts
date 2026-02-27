import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { getCachedAnalysis, setCachedAnalysis } from "@/lib/cache";
import { anonymousLimiter, userLimiter } from "@/lib/ratelimit";
import { normalizeCharacterKey } from "@/lib/characters";
import { computeScores } from "@/lib/scoring";
import { validateAnalysisSchema, RecoverableAnalysisError } from "@/lib/analysis/validate";
import { persistAnalysis } from "@/lib/analysis/persist";
import { createClient } from "@/lib/supabase/server";
import type { MediaType } from "@/lib/supabase/types";

// Anthropic is long-running — cannot use edge runtime
export const runtime = "nodejs";
export const maxDuration = 60;

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
  timeout: 25_000,
  maxRetries: 0, // We handle retries ourselves in the route loop — SDK retries compound to 3× timeout
});

// 🐢→🐇 TEMP: using Haiku during UX dev (3–8s vs Sonnet's 20–25s).
// Switch back to "claude-sonnet-4-20250514" before bulk-caching common characters.
const MODEL = "claude-haiku-4-5-20251001";
const MAX_TOKENS = 8192;

interface AnalyzeBody {
  characterName: string;
  mediaTitle: string;
  mediaType?: MediaType;
  era?: string | null;
  genderFlag?: string | null;
  additionalContext?: string | null;
}

/**
 * POST /api/characters/[key]/analyze
 *
 * Full analysis flow per serizawa-prompt-template-v1.md §3:
 * 1. Cache check (no rate limit hit on cache)
 * 2. Rate limit (3/min anon, 10/min logged-in)
 * 3. Fetch active prompt_template from DB
 * 4. Build user message from template
 * 5. Call Claude (retry once on parse failure)
 * 6. Validate schema
 * 7. Recompute scores server-side (NEVER trust model math)
 * 8. Persist to Supabase
 * 9. Cache result
 * 10. Return
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ key: string }> }
) {
  const { key } = await params;
  const startTime = Date.now();

  let body: AnalyzeBody;
  try {
    body = await request.json() as AnalyzeBody;
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { characterName, mediaTitle, mediaType = "film", era, genderFlag, additionalContext } = body;

  if (!characterName?.trim() || !mediaTitle?.trim()) {
    return NextResponse.json(
      { error: "characterName and mediaTitle are required" },
      { status: 400 }
    );
  }

  const characterKey = normalizeCharacterKey(characterName, mediaTitle);

  // --- 1. Cache check (Redis → Supabase) ---
  const cached = await getCachedAnalysis(characterKey);
  if (cached) {
    return NextResponse.json({ ...cached, fromCache: true });
  }

  // Check Supabase for an existing analysis (survives Redis TTL expiry)
  const supabase = await createClient();
  const existing = await lookupExistingAnalysis(supabase, characterKey);
  if (existing) {
    await setCachedAnalysis(characterKey, existing);
    return NextResponse.json({ ...existing, fromCache: true });
  }

  // --- 2. Rate limiting ---
  const { data: { user } } = await supabase.auth.getUser();
  const isAdmin = !!(user && await isUserAdmin(supabase));

  // Skip rate limiting in local development
  const isDev = process.env.NODE_ENV === "development";

  if (!isAdmin && !isDev) {
    const identifier = user?.id ?? getAnonymousIdentifier(request);
    const limiter = user ? userLimiter : anonymousLimiter;

    // Fail-open: if Redis is unreachable, allow the request through
    let rateLimitResult: { success: boolean; limit: number; remaining: number; reset: number };
    try {
      rateLimitResult = await limiter.limit(identifier);
    } catch {
      rateLimitResult = { success: true, limit: 0, remaining: 0, reset: 0 };
    }

    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: "Rate limit exceeded. Please wait before running another analysis." },
        {
          status: 429,
          headers: {
            "X-RateLimit-Limit": String(rateLimitResult.limit),
            "X-RateLimit-Remaining": String(rateLimitResult.remaining),
            "X-RateLimit-Reset": String(rateLimitResult.reset),
            "Retry-After": String(Math.ceil((rateLimitResult.reset - Date.now()) / 1000)),
          },
        }
      );
    }
  }

  // --- 3. Fetch active prompt template ---
  const { data: template } = await (supabase as unknown as {
    from: (t: string) => {
      select: (q: string) => {
        eq: (c: string, v: boolean) => {
          single: () => Promise<{ data: { id: string; system_prompt: string; user_message_template: string } | null }>;
        };
      };
    };
  })
    .from("prompt_templates")
    .select("id, system_prompt, user_message_template")
    .eq("is_active", true)
    .single();

  if (!template) {
    return NextResponse.json(
      { error: "No active prompt template found. Contact admin." },
      { status: 503 }
    );
  }

  // --- 4. Build user message ---
  const userMessage = buildUserMessage(template.user_message_template, {
    CHARACTER_NAME: characterName,
    MEDIA_TITLE: mediaTitle,
    MEDIA_TYPE: mediaType,
    ERA: era ?? null,
    GENDER_FLAG: genderFlag ?? null,
    ADDITIONAL_CONTEXT: additionalContext ?? null,
  });

  // --- 5. Call Claude (retry once on parse failure) ---
  let parsed: Record<string, unknown>;
  let rawResponse = "";

  for (let attempt = 1; attempt <= 2; attempt++) {
    let response: Awaited<ReturnType<typeof anthropic.messages.create>>;
    try {
      response = await anthropic.messages.create({
        model: MODEL,
        max_tokens: MAX_TOKENS,
        system: template.system_prompt,
        messages: [{ role: "user", content: userMessage }],
      });
    } catch (err) {
      const isTimeout =
        err instanceof Error &&
        (err.name === "APIConnectionTimeoutError" || err.message.includes("timed out"));
      console.error("[analyze] Anthropic error (attempt", attempt, "):", {
        name: err instanceof Error ? err.name : "unknown",
        message: err instanceof Error ? err.message : String(err),
        status: (err as Record<string, unknown>)?.status,
      });
      if (isTimeout) {
        return NextResponse.json(
          { error: "Analysis timed out. Claude is under load — please try again in a moment." },
          { status: 408 }
        );
      }
      throw err;
    }

    rawResponse = response.content[0]?.type === "text" ? response.content[0].text : "";

    try {
      // Extract JSON object — Claude may wrap in markdown fencing or add commentary
      const firstBrace = rawResponse.indexOf("{");
      const lastBrace = rawResponse.lastIndexOf("}");
      const jsonText = firstBrace >= 0 && lastBrace > firstBrace
        ? rawResponse.slice(firstBrace, lastBrace + 1)
        : rawResponse.trim();
      parsed = JSON.parse(jsonText) as Record<string, unknown>;
      break;
    } catch (parseErr) {
      console.error(`[analyze] JSON parse failed (attempt ${attempt}). stop_reason=${response.stop_reason} tokens=${response.usage.output_tokens}/${MAX_TOKENS}`, parseErr instanceof Error ? parseErr.message : "");
      if (attempt === 2) {
        return NextResponse.json(
          { error: "Analysis failed after retry. Claude's response was not valid JSON. Please try again." },
          { status: 422 }
        );
      }
      // Retry with identical prompt
    }
  }

  // --- 6. Validate schema ---
  try {
    validateAnalysisSchema(parsed!);
  } catch (err) {
    if (err instanceof RecoverableAnalysisError) {
      return NextResponse.json(
        { error: `Analysis validation failed: ${err.message}` },
        { status: 422 }
      );
    }
    throw err;
  }

  // --- 7. Server-side score recomputation (MANDATORY — never trust model math) ---
  // Inject Q5 sub_scores onto the q5 object that Claude already returned,
  // so computeScores sees parsed.q5.sub_scores (not a separate q5_scored key).
  const q5Obj = (parsed! as Record<string, unknown>)["q5"] as Record<string, unknown> | undefined;
  if (q5Obj && !q5Obj["sub_scores"]) {
    q5Obj["sub_scores"] = { "5a_framing_dignity": 1.00, "5b_peer_engagement": 1.00, "5c_cultural_framing": 1.00 };
  }
  const scoring = computeScores(parsed! as Parameters<typeof computeScores>[0]);

  // Overwrite model's scoring object with server-computed values
  (parsed! as Record<string, unknown>)["scoring"] = {
    base_score: scoring.baseScore,
    trope_penalty_raw: scoring.q3.tropePenaltyRaw,
    trope_penalty_capped: scoring.q3.penaltyCap,
    trope_bonus: scoring.q3.tropeBonus,
    final_score: scoring.finalScore,
    grade: scoring.grade,
    grade_label: scoring.gradeLabel,
  };

  const processingDurationMs = Date.now() - startTime;

  // --- 8. Persist to Supabase ---
  let persistResult;
  try {
    persistResult = await persistAnalysis({
      characterName,
      mediaTitle,
      mediaType,
      era: era ?? null,
      genderFlag: genderFlag ?? null,
      parsed: parsed!,
      scoring,
      promptTemplateVersion: template.id,
      modelVersion: MODEL,
      processingDurationMs,
      rawPrompt: userMessage,
      rawResponse,
    });
  } catch (err) {
    console.error("[analyze] Persist failed:", err);
    // Return the analysis even if persist fails — user gets their result
    const result = buildResult(parsed!, scoring, characterKey, false);
    return NextResponse.json({ ...result, fromCache: false, persistError: true });
  }

  // --- 9. Cache result ---
  const result = buildResult(parsed!, scoring, persistResult.characterKey, false);
  await setCachedAnalysis(characterKey, result);

  // --- 10. Return ---
  return NextResponse.json({ ...result, fromCache: false });
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function buildUserMessage(
  template: string,
  vars: Record<string, string | null>
): string {
  let message = template;
  for (const [key, value] of Object.entries(vars)) {
    if (value) {
      message = message.replace(`{{${key}}}`, value);
      // Handle Handlebars-style conditionals {{#if KEY}}...{{/if}}
      const ifPattern = new RegExp(`\\{\\{#if ${key}\\}\\}([\\s\\S]*?)\\{\\{/if\\}\\}`, "g");
      message = message.replace(ifPattern, "$1");
    } else {
      // Remove entire {{#if KEY}}...{{/if}} block if value is null
      const ifPattern = new RegExp(`\\{\\{#if ${key}\\}\\}[\\s\\S]*?\\{\\{/if\\}\\}`, "g");
      message = message.replace(ifPattern, "");
    }
  }
  return message.trim();
}

function getAnonymousIdentifier(request: NextRequest): string {
  // Use a combination of forwarded IP headers — no IP storage per PRD §17
  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() ?? "anonymous";
  return `anon:${ip}`;
}

async function isUserAdmin(
  supabase: Awaited<ReturnType<typeof createClient>>
): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const { data } = await (supabase as unknown as {
    from: (t: string) => {
      select: (q: string) => {
        eq: (c: string, v: string) => {
          single: () => Promise<{ data: { is_admin: boolean } | null }>;
        };
      };
    };
  })
    .from("users")
    .select("is_admin")
    .eq("id", user.id)
    .single();

  return data?.is_admin ?? false;
}

function buildResult(
  parsed: Record<string, unknown>,
  scoring: ReturnType<typeof computeScores>,
  characterKey: string,
  fromCache: boolean
): Record<string, unknown> {
  return {
    characterKey,
    characterName: parsed["character_name"],
    mediaTitle: parsed["media_title"],
    rubricVersion: parsed["rubric_version"],
    promptTemplateVersion: parsed["prompt_template_version"],
    q1: {
      score: scoring.q1,
      subScores: (parsed["q1"] as Record<string, unknown>)["sub_scores"],
      rationale: (parsed["q1"] as Record<string, unknown>)["rationale"],
      register: (parsed["q1"] as Record<string, unknown>)["register"],
    },
    q2: {
      score: scoring.q2,
      subScores: (parsed["q2"] as Record<string, unknown>)["sub_scores"],
      rationale: (parsed["q2"] as Record<string, unknown>)["rationale"],
      register: (parsed["q2"] as Record<string, unknown>)["register"],
    },
    q3: {
      score: scoring.q3.score,
      detectedTropes: (parsed["q3"] as Record<string, unknown>)["detected_tropes"],
      tropePenaltyRaw: scoring.q3.tropePenaltyRaw,
      penaltyCap: scoring.q3.penaltyCap,
      tropeBonus: scoring.q3.tropeBonus,
      rationale: (parsed["q3"] as Record<string, unknown>)["rationale"],
      register: (parsed["q3"] as Record<string, unknown>)["register"],
    },
    q4: {
      score: scoring.q4,
      subScores: (parsed["q4"] as Record<string, unknown>)["sub_scores"],
      irreversibleDecision: (parsed["q4"] as Record<string, unknown>)["irreversible_decision_description"],
      rationale: (parsed["q4"] as Record<string, unknown>)["rationale"],
      register: (parsed["q4"] as Record<string, unknown>)["register"],
    },
    q5: parsed["q5"],
    scoring: {
      baseScore: scoring.baseScore,
      tropePenaltyRaw: scoring.q3.tropePenaltyRaw,
      penaltyCap: scoring.q3.penaltyCap,
      tropeBonus: scoring.q3.tropeBonus,
      finalScore: scoring.finalScore,
      grade: scoring.grade,
      gradeLabel: scoring.gradeLabel,
    },
    suggestions: parsed["suggestions"],
    summary: parsed["summary"],
    confidence: parsed["confidence"],
    confidenceNotes: parsed["confidence_notes"],
    fromCache,
  };
}

async function lookupExistingAnalysis(
  supabase: Awaited<ReturnType<typeof createClient>>,
  characterKey: string
): Promise<Record<string, unknown> | null> {
  try {
    const sb = supabase as unknown as {
      from: (t: string) => {
        select: (q: string) => {
          eq: (c: string, v: string) => {
            single: () => Promise<{ data: Record<string, unknown> | null; error: unknown }>;
          };
        };
      };
    };

    const { data: char } = await sb
      .from("characters")
      .select("id, character_key, latest_analysis_id")
      .eq("character_key", characterKey)
      .single();

    if (!char?.latest_analysis_id) return null;

    const { data: analysis } = await sb
      .from("analyses")
      .select("*")
      .eq("id", char.latest_analysis_id as string)
      .single();

    if (!analysis) return null;

    return {
      characterKey,
      characterName: analysis.character_name ?? characterKey.split("|")[0],
      mediaTitle: analysis.media_title ?? characterKey.split("|")[1],
      rubricVersion: analysis.rubric_version,
      promptTemplateVersion: analysis.prompt_template_version,
      q1: { score: analysis.q1_score, rationale: analysis.q1_rationale, register: analysis.q1_register },
      q2: { score: analysis.q2_score, rationale: analysis.q2_rationale, register: analysis.q2_register },
      q3: { score: analysis.q3_score, rationale: analysis.q3_rationale, register: analysis.q3_register, detectedTropes: analysis.tropes },
      q4: { score: analysis.q4_score, rationale: analysis.q4_rationale, register: analysis.q4_register },
      q5: { flag: analysis.q5_flag, notes: analysis.q5_notes, score: analysis.q5_score, rationale: analysis.q5_rationale, register: analysis.q5_register },
      scoring: {
        baseScore: analysis.base_score,
        tropePenaltyRaw: analysis.trope_penalty_raw,
        penaltyCap: analysis.trope_penalty_capped,
        tropeBonus: analysis.trope_bonus,
        finalScore: analysis.final_score,
        grade: analysis.grade,
        gradeLabel: analysis.grade_label,
      },
      suggestions: analysis.suggestions,
      summary: analysis.summary,
      confidence: analysis.confidence,
      confidenceNotes: analysis.confidence_notes,
      fromCache: false,
    };
  } catch {
    return null;
  }
}
