import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "edge";

interface RuleSuggestBody {
  rule: "Q1" | "Q2" | "Q3" | "Q4" | "Q5" | "General";
  suggestion: string;
  rationale: string;
}

/**
 * POST /api/rules/suggest
 *
 * Submit a rule change suggestion.
 * Auth required. Minimum 50 chars rationale.
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  let body: RuleSuggestBody;
  try {
    body = await request.json() as RuleSuggestBody;
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { rule, suggestion, rationale } = body;

  if (!rule || !suggestion?.trim()) {
    return NextResponse.json(
      { error: "rule and suggestion are required" },
      { status: 400 }
    );
  }

  if (!rationale || rationale.trim().length < 50) {
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
    .from("rule_suggestions")
    .insert({
      affected_rule: rule,
      suggestion_text: suggestion.trim(),
      rationale: rationale.trim(),
      submitted_by: user.id,
      status: "pending",
    });

  if (error) {
    return NextResponse.json({ error: "Failed to submit suggestion" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
