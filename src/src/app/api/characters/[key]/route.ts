import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { Character, Analysis, MediaProperty } from "@/lib/supabase/types";

export const runtime = "edge";

type CharacterWithDetails = Character & {
  media_properties: MediaProperty | null;
  analyses: Analysis | null;
};

type VoteRow = { rule: string; vote: string; is_critic: boolean };

/**
 * GET /api/characters/[key]
 *
 * Returns full character data + latest analysis + media property.
 * Increments view_count (fire-and-forget).
 * No auth required.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ key: string }> }
) {
  const { key } = await params;

  if (!key) {
    return NextResponse.json({ error: "Missing character key" }, { status: 400 });
  }

  const supabase = await createClient();

  // Supabase returns complex join types as unknown — cast explicitly
  const { data: characterRaw, error: charError } = await (supabase as unknown as {
    from: (t: string) => {
      select: (q: string) => {
        eq: (col: string, val: string) => {
          single: () => Promise<{ data: CharacterWithDetails | null; error: { message: string } | null }>;
        };
      };
    };
  })
    .from("characters")
    .select(`
      *,
      media_properties (*),
      analyses!latest_analysis_id (
        id,
        q1_score, q1_rationale,
        q2_score, q2_rationale,
        q3_score, q3_rationale,
        q4_score, q4_rationale,
        q5_flag, q5_notes,
        base_score, trope_penalty, trope_bonus,
        final_score, grade,
        tropes, subversions, suggestions, summary,
        rubric_version, model_version, prompt_template_version,
        processing_duration_ms, created_at
      )
    `)
    .eq("character_key", key)
    .single();

  if (charError || !characterRaw) {
    return NextResponse.json({ error: "Character not found" }, { status: 404 });
  }

  const character = characterRaw as CharacterWithDetails;

  // Increment view_count — fire and forget
  void (supabase as unknown as { from: (t: string) => { update: (v: Record<string, unknown>) => { eq: (c: string, v: string) => Promise<unknown> } } })
    .from("characters")
    .update({ view_count: (character.view_count ?? 0) + 1 })
    .eq("character_key", key);

  // Fetch community vote aggregates for the latest analysis
  const { data: votes } = await (supabase as unknown as {
    from: (t: string) => {
      select: (q: string) => {
        eq: (col: string, val: string) => Promise<{ data: VoteRow[] | null }>;
      };
    };
  })
    .from("votes")
    .select("rule, vote, is_critic")
    .eq("analysis_id", character.latest_analysis_id ?? "");

  const communityScores =
    votes && votes.length > 0 ? computeCommunityScores(votes) : null;

  return NextResponse.json(
    { character: { ...character, communityScores } },
    {
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
      },
    }
  );
}

// ---------------------------------------------------------------------------
// Community score aggregation (PRD §9.3)
// ---------------------------------------------------------------------------

interface RuleScores {
  audienceScore: number | null;
  criticScore: number | null;
  audienceVoteCount: number;
  criticVoteCount: number;
}

const RULES = ["q1", "q2", "q3", "q4"] as const;
const VOTE_VALUE: Record<string, number> = { agree: 1, indifferent: 0, disagree: -1 };
const MIN_VOTES = 3;
const CRITIC_WEIGHT = 3;

function computeCommunityScores(votes: VoteRow[]): Record<string, RuleScores> {
  const result: Record<string, RuleScores> = {};

  for (const rule of RULES) {
    const ruleVotes = votes.filter((v) => v.rule === rule);
    const audienceVotes = ruleVotes.filter((v) => !v.is_critic);
    const criticVotes = ruleVotes.filter((v) => v.is_critic);

    result[rule] = {
      audienceScore:
        audienceVotes.length >= MIN_VOTES
          ? computeWeightedScore(audienceVotes, 1)
          : null,
      criticScore:
        criticVotes.length >= MIN_VOTES
          ? computeWeightedScore(criticVotes, CRITIC_WEIGHT)
          : null,
      audienceVoteCount: audienceVotes.length,
      criticVoteCount: criticVotes.length,
    };
  }

  return result;
}

function computeWeightedScore(votes: VoteRow[], weight: number): number {
  const total = votes.reduce((sum, v) => sum + (VOTE_VALUE[v.vote] ?? 0) * weight, 0);
  const maxPossible = votes.length * weight;
  if (maxPossible === 0) return 0;
  // Normalise to 0–2 range matching Q score range
  return Math.round(((total / maxPossible + 1) / 2) * 200) / 100;
}
