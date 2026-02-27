import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "edge";

type VoteValue = "agree" | "disagree" | "indifferent";
type Rule = "q1" | "q2" | "q3" | "q4";

interface VoteBody {
  rule: Rule;
  vote: VoteValue;
}

/**
 * POST /api/analysis/[id]/vote
 *
 * Upsert a vote for a specific rule on an analysis.
 * Auth required — anonymous visitors cannot vote.
 * Critics' votes (is_critic = true) count 3× in community scoring.
 * One vote per user per analysis per rule (upsert on conflict).
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: analysisId } = await params;
  const supabase = await createClient();

  // Auth check
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json(
      { error: "Authentication required to vote." },
      { status: 401 }
    );
  }

  let body: VoteBody;
  try {
    body = await request.json() as VoteBody;
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { rule, vote } = body;

  const validRules: Rule[] = ["q1", "q2", "q3", "q4"];
  const validVotes: VoteValue[] = ["agree", "disagree", "indifferent"];

  if (!validRules.includes(rule)) {
    return NextResponse.json({ error: `Invalid rule: ${rule}` }, { status: 400 });
  }
  if (!validVotes.includes(vote)) {
    return NextResponse.json({ error: `Invalid vote value: ${vote}` }, { status: 400 });
  }

  // Verify analysis exists
  const { data: analysis } = await (supabase as unknown as {
    from: (t: string) => {
      select: (q: string) => {
        eq: (c: string, v: string) => {
          single: () => Promise<{ data: { id: string } | null }>;
        };
      };
    };
  })
    .from("analyses")
    .select("id")
    .eq("id", analysisId)
    .single();

  if (!analysis) {
    return NextResponse.json({ error: "Analysis not found" }, { status: 404 });
  }

  // Check if user is a critic (for 3× weighting)
  const { data: userProfile } = await (supabase as unknown as {
    from: (t: string) => {
      select: (q: string) => {
        eq: (c: string, v: string) => {
          single: () => Promise<{ data: { is_critic: boolean } | null }>;
        };
      };
    };
  })
    .from("users")
    .select("is_critic")
    .eq("id", user.id)
    .single();

  const isCritic = userProfile?.is_critic ?? false;

  // Upsert vote (one per user per analysis per rule)
  const { error: upsertError } = await (supabase as unknown as {
    from: (t: string) => {
      upsert: (v: Record<string, unknown>, opts: Record<string, unknown>) => Promise<{ error: { message: string } | null }>;
    };
  })
    .from("votes")
    .upsert(
      {
        analysis_id: analysisId,
        user_id: user.id,
        rule,
        vote,
        is_critic: isCritic,
      },
      { onConflict: "analysis_id,user_id,rule" }
    );

  if (upsertError) {
    console.error("[vote] Upsert error:", upsertError.message);
    return NextResponse.json({ error: "Failed to record vote" }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    rule,
    vote,
    isCritic,
    weight: isCritic ? 3 : 1,
  });
}

/**
 * DELETE /api/analysis/[id]/vote?rule=q1
 *
 * Remove a vote (change to neutral / withdraw).
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: analysisId } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const rule = new URL(request.url).searchParams.get("rule") as Rule | null;
  if (!rule) {
    return NextResponse.json({ error: "rule query param required" }, { status: 400 });
  }

  await (supabase as unknown as {
    from: (t: string) => {
      delete: () => {
        eq: (c: string, v: string) => {
          eq: (c: string, v: string) => {
            eq: (c: string, v: string) => Promise<unknown>;
          };
        };
      };
    };
  })
    .from("votes")
    .delete()
    .eq("analysis_id", analysisId)
    .eq("user_id", user.id)
    .eq("rule", rule);

  return NextResponse.json({ success: true });
}
