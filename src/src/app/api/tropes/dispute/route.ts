import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "edge";

interface DisputeBody {
  analysisId: string;
  tropeId: string;
  reason: string;
  suggestedPenalty?: number | null;
}

/**
 * POST /api/tropes/dispute
 *
 * Submit a trope detection dispute for an analysis.
 * Auth required. Minimum 50 chars rationale.
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  let body: DisputeBody;
  try {
    body = await request.json() as DisputeBody;
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { analysisId, tropeId, reason, suggestedPenalty } = body;

  if (!analysisId || !tropeId) {
    return NextResponse.json(
      { error: "analysisId and tropeId are required" },
      { status: 400 }
    );
  }

  if (!reason || reason.trim().length < 50) {
    return NextResponse.json(
      { error: "Rationale must be at least 50 characters." },
      { status: 400 }
    );
  }

  const { error } = await (supabase as unknown as {
    from: (t: string) => {
      insert: (v: Record<string, unknown>) => Promise<{ error: { message: string } | null }>;
    };
  })
    .from("trope_disputes")
    .insert({
      analysis_id: analysisId,
      trope_id: tropeId,
      reason: reason.trim(),
      suggested_penalty: suggestedPenalty ?? null,
      submitted_by: user.id,
      status: "pending",
    });

  if (error) {
    return NextResponse.json({ error: "Failed to submit dispute" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
