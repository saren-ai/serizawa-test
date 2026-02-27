/**
 * Persist a completed, server-scored analysis to Supabase.
 * Handles upsert of media_properties, characters, analyses, and analysis_raw.
 * Returns the persisted analysis ID and character ID.
 */

import { createAdminClient } from "@/lib/supabase/server";
import { normalizeCharacterKey } from "@/lib/characters";
import {
  isWallOfShameEligible,
  isHallOfFameEligible,
} from "@/lib/scoring";
import type { DetectedTrope, Q5Flag, MediaType, Grade } from "@/lib/supabase/types";

interface AnalysisInput {
  characterName: string;
  mediaTitle: string;
  mediaType: MediaType;
  era: string | null;
  genderFlag: string | null;
  parsed: Record<string, unknown>;
  scoring: {
    q1: number;
    q2: number;
    q3: {
      score: number;
      tropePenaltyRaw: number;
      penaltyCap: number;
      tropeBonus: number;
    };
    q4: number;
    q5: number;
    baseScore: number;
    finalScore: number;
    grade: Grade;
    gradeLabel: string;
  };
  promptTemplateVersion: string;
  modelVersion: string;
  processingDurationMs: number;
  rawPrompt: string;
  rawResponse: string;
}

interface PersistResult {
  analysisId: string;
  characterId: string;
  characterKey: string;
}

type SupabaseAdminClient = ReturnType<typeof createAdminClient>;

async function upsertMediaProperty(
  supabase: SupabaseAdminClient,
  mediaTitle: string,
  mediaType: MediaType,
  releaseYear: number | null
): Promise<string> {
  const existing = await (supabase as unknown as {
    from: (t: string) => {
      select: (q: string) => {
        eq: (c: string, v: string) => { single: () => Promise<{ data: { id: string } | null }> };
      };
    };
  })
    .from("media_properties")
    .select("id")
    .eq("title", mediaTitle)
    .single();

  if (existing.data?.id) return existing.data.id;

  const decade = releaseYear
    ? `${Math.floor(releaseYear / 10) * 10}s`
    : null;

  const { data: inserted } = await (supabase as unknown as {
    from: (t: string) => {
      insert: (v: Record<string, unknown>) => {
        select: (q: string) => { single: () => Promise<{ data: { id: string } | null }> };
      };
    };
  })
    .from("media_properties")
    .insert({ title: mediaTitle, media_type: mediaType, release_year: releaseYear, decade })
    .select("id")
    .single();

  if (!inserted?.id) throw new Error("Failed to insert media_property");
  return inserted.id;
}

export async function persistAnalysis(input: AnalysisInput): Promise<PersistResult> {
  const supabase = createAdminClient();
  const { parsed, scoring, characterName, mediaTitle, mediaType } = input;
  const characterKey = normalizeCharacterKey(characterName, mediaTitle);

  const q5 = parsed["q5"] as { flag: Q5Flag; actor_name?: string; actor_heritage?: string; notes?: string };
  const q3Data = parsed["q3"] as { detected_tropes: DetectedTrope[] };
  const detectedTropes: DetectedTrope[] = q3Data.detected_tropes ?? [];

  // Extract release year from era if present
  const releaseYear = input.era
    ? parseInt(input.era.match(/\d{4}/)?.[0] ?? "", 10) || null
    : null;

  // 1. Upsert media property
  const mediaPropertyId = await upsertMediaProperty(
    supabase,
    mediaTitle,
    mediaType,
    releaseYear
  );

  // 2. Upsert character (insert or update)
  const wallOfShame = isWallOfShameEligible(scoring.finalScore, q5.flag, detectedTropes);
  const hallOfFame = false; // HOF requires ≥5 analyses — set by a separate job

  const characterData = {
    character_key: characterKey,
    name: characterName,
    media_property_id: mediaPropertyId,
    gender_flag: input.genderFlag,
    q5_flag: q5.flag,
    wall_of_shame: wallOfShame,
    hall_of_fame: hallOfFame,
    first_analyzed_at: new Date().toISOString(),
  };

  const { data: character } = await (supabase as unknown as {
    from: (t: string) => {
      upsert: (v: Record<string, unknown>, opts: Record<string, unknown>) => {
        select: (q: string) => { single: () => Promise<{ data: { id: string; lookup_count: number } | null }> };
      };
    };
  })
    .from("characters")
    .upsert(characterData, {
      onConflict: "character_key",
      ignoreDuplicates: false,
    })
    .select("id, lookup_count")
    .single();

  if (!character?.id) throw new Error("Failed to upsert character");

  // 3. Insert analysis
  const q1Data = parsed["q1"] as { sub_scores: Record<string, number>; rationale: string; register: string };
  const q2Data = parsed["q2"] as { sub_scores: Record<string, number>; rationale: string; register: string };
  const q4Data = parsed["q4"] as { sub_scores: Record<string, number>; rationale: string; register: string };
  const q5ScoreData = parsed["q5_scored"] as { sub_scores: Record<string, number>; rationale: string; register: string } | undefined;
  const q3Full = parsed["q3"] as { rationale: string; register: string };
  const q5Full = parsed["q5"] as { flag: Q5Flag; notes?: string };

  const confidence = parsed["confidence"] as string | undefined;
  const analysisData = {
    character_id: character.id,
    q1_score: scoring.q1,
    q1_rationale: q1Data.rationale,
    q1_register: q1Data.register ?? null,
    q2_score: scoring.q2,
    q2_rationale: q2Data.rationale,
    q2_register: q2Data.register ?? null,
    q3_score: scoring.q3.score,
    q3_rationale: q3Full.rationale,
    q3_register: q3Full.register ?? null,
    q4_score: scoring.q4,
    q4_rationale: q4Data.rationale,
    q4_register: q4Data.register ?? null,
    q5_score: scoring.q5,
    q5_rationale: q5ScoreData?.rationale ?? null,
    q5_register: q5ScoreData?.register ?? null,
    q5_flag: q5Full.flag,
    q5_notes: q5Full.notes ?? null,
    base_score: scoring.baseScore,
    trope_penalty_raw: scoring.q3.tropePenaltyRaw,
    trope_penalty_capped: scoring.q3.penaltyCap,
    trope_bonus: scoring.q3.tropeBonus,
    final_score: scoring.finalScore,
    grade: scoring.grade,
    grade_label: scoring.gradeLabel,
    tropes: detectedTropes,
    subversions: null,
    suggestions: parsed["suggestions"] as string,
    summary: parsed["summary"] as string,
    confidence: confidence ?? null,
    confidence_notes: parsed["confidence_notes"] as string ?? null,
    rubric_version: parsed["rubric_version"] as string,
    model_version: input.modelVersion,
    prompt_template_version: input.promptTemplateVersion,
    processing_duration_ms: input.processingDurationMs,
  };

  const { data: analysis, error: analysisError } = await (supabase as unknown as {
    from: (t: string) => {
      insert: (v: Record<string, unknown>) => {
        select: (q: string) => { single: () => Promise<{ data: { id: string } | null; error: { message: string; code: string } | null }> };
      };
    };
  })
    .from("analyses")
    .insert(analysisData)
    .select("id")
    .single();

  if (analysisError) console.error("[persist] Analysis insert error:", analysisError.code, analysisError.message);
  if (!analysis?.id) throw new Error(`Failed to insert analysis: ${analysisError?.message ?? "unknown"}`);

  // 4–6: Run raw insert, character update, and HOF check in parallel
  const rawInsertPromise = (supabase as unknown as {
    from: (t: string) => { insert: (v: Record<string, unknown>) => Promise<unknown> };
  })
    .from("analysis_raw")
    .insert({
      analysis_id: analysis.id,
      raw_prompt: input.rawPrompt,
      raw_response: input.rawResponse,
    });

  const characterUpdatePromise = (supabase as unknown as {
    from: (t: string) => {
      update: (v: Record<string, unknown>) => { eq: (c: string, v: string) => Promise<unknown> };
    };
  })
    .from("characters")
    .update({
      latest_analysis_id: analysis.id,
      latest_final_score: scoring.finalScore,
      latest_grade: scoring.grade,
      q5_flag: q5.flag,
      wall_of_shame: wallOfShame,
      lookup_count: (character.lookup_count ?? 0) + 1,
    })
    .eq("id", character.id);

  const hofCheckPromise = (async () => {
    const { count } = await (supabase as unknown as {
      from: (t: string) => {
        select: (q: string, opts: Record<string, unknown>) => {
          eq: (c: string, v: string) => Promise<{ count: number | null }>;
        };
      };
    })
      .from("analyses")
      .select("id", { count: "exact" })
      .eq("character_id", character.id);

    if (count && isHallOfFameEligible(scoring.finalScore, count)) {
      await (supabase as unknown as {
        from: (t: string) => {
          update: (v: Record<string, unknown>) => { eq: (c: string, v: string) => Promise<unknown> };
        };
      })
        .from("characters")
        .update({ hall_of_fame: true })
        .eq("id", character.id);
    }
  })();

  await Promise.all([rawInsertPromise, characterUpdatePromise, hofCheckPromise]);

  return { analysisId: analysis.id, characterId: character.id, characterKey };
}
