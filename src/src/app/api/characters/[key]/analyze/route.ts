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

export const runtime = "nodejs";
export const maxDuration = 60;

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
  timeout: 25_000,
  maxRetries: 0,
});

// 🐢→🐇 TEMP: using Haiku during UX dev (3–8s vs Sonnet's 20–25s).
// Switch back to "claude-sonnet-4-20250514" before bulk-caching common characters.
const MODEL = "claude-haiku-4-5-20251001";
const MAX_TOKENS = 8192;

let cachedTemplate: { id: string; system_prompt: string; user_message_template: string; fetchedAt: number } | null = null;
const TEMPLATE_TTL_MS = 300_000; // 5 min in-memory cache

interface AnalyzeBody {
  characterName: string;
  mediaTitle: string;
  mediaType?: MediaType;
  era?: string | null;
  genderFlag?: string | null;
  additionalContext?: string | null;
}

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

  // --- Phase 1: Parallel cache + DB + auth checks ---
  const supabase = await createClient();
  const [cached, existing, { data: { user } }] = await Promise.all([
    getCachedAnalysis(characterKey),
    lookupExistingAnalysis(supabase, characterKey),
    supabase.auth.getUser(),
  ]);

  if (cached) {
    return NextResponse.json({ ...cached, fromCache: true });
  }
  if (existing) {
    setCachedAnalysis(characterKey, existing).catch(() => {});
    return NextResponse.json({ ...existing, fromCache: true });
  }

  // --- Phase 2: Rate limit + prompt template (parallel) ---
  const isDev = process.env.NODE_ENV === "development";
  const isAdmin = !!(user && await isUserAdminFast(supabase, user.id));

  const [rateLimitErr, template] = await Promise.all([
    (!isAdmin && !isDev)
      ? checkRateLimit(user?.id ?? getAnonymousIdentifier(request), !!user)
      : Promise.resolve(null),
    getPromptTemplate(supabase),
  ]);

  if (rateLimitErr) return rateLimitErr;

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

  // --- 8. Build result immediately, persist + cache in background ---
  const result = buildResult(parsed!, scoring, characterKey, false);

  // Fire persist + cache in parallel — don't block the response
  const persistPromise = persistAnalysis({
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
  }).catch((err) => console.error("[analyze] Persist failed:", err));

  const cachePromise = setCachedAnalysis(characterKey, result).catch(() => {});

  // Wait for both but don't let failures block the response
  await Promise.allSettled([persistPromise, cachePromise]);

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
  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() ?? "anonymous";
  return `anon:${ip}`;
}

async function isUserAdminFast(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string
): Promise<boolean> {
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
    .eq("id", userId)
    .single();

  return data?.is_admin ?? false;
}

async function checkRateLimit(
  identifier: string,
  isLoggedIn: boolean
): Promise<NextResponse | null> {
  const limiter = isLoggedIn ? userLimiter : anonymousLimiter;
  let result: { success: boolean; limit: number; remaining: number; reset: number };
  try {
    result = await limiter.limit(identifier);
  } catch {
    return null; // fail-open
  }
  if (!result.success) {
    return NextResponse.json(
      { error: "Rate limit exceeded. Please wait before running another analysis." },
      {
        status: 429,
        headers: {
          "X-RateLimit-Limit": String(result.limit),
          "X-RateLimit-Remaining": String(result.remaining),
          "X-RateLimit-Reset": String(result.reset),
          "Retry-After": String(Math.ceil((result.reset - Date.now()) / 1000)),
        },
      }
    );
  }
  return null;
}

async function getPromptTemplate(
  supabase: Awaited<ReturnType<typeof createClient>>
): Promise<{ id: string; system_prompt: string; user_message_template: string } | null> {
  if (cachedTemplate && Date.now() - cachedTemplate.fetchedAt < TEMPLATE_TTL_MS) {
    return cachedTemplate;
  }
  const { data } = await (supabase as unknown as {
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

  if (data) {
    cachedTemplate = { ...data, fetchedAt: Date.now() };
  }
  return data;
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
