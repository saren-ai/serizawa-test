import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "edge";

interface TropeSubmitBody {
  name: string;
  category: string;
  severity: "minor" | "moderate" | "major";
  rationale: string;
  exampleMedia?: string | null;
}

/**
 * POST /api/tropes/submit
 *
 * Submit a new trope for consideration in the taxonomy.
 * Auth required. Minimum 50 chars rationale.
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  let body: TropeSubmitBody;
  try {
    body = await request.json() as TropeSubmitBody;
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { name, category, severity, rationale, exampleMedia } = body;

  if (!name?.trim() || !category?.trim() || !severity) {
    return NextResponse.json(
      { error: "name, category, and severity are required" },
      { status: 400 }
    );
  }

  if (!rationale || rationale.trim().length < 50) {
    return NextResponse.json(
      { error: "Rationale must be at least 50 characters." },
      { status: 400 }
    );
  }

  const valid = ["minor", "moderate", "major"];
  if (!valid.includes(severity)) {
    return NextResponse.json({ error: "Invalid severity" }, { status: 400 });
  }

  const { error } = await (supabase as unknown as {
    from: (t: string) => {
      insert: (v: Record<string, unknown>) => Promise<{ error: { message: string } | null }>;
    };
  })
    .from("trope_submissions")
    .insert({
      name: name.trim(),
      category: category.trim(),
      severity,
      rationale: rationale.trim(),
      example_media: exampleMedia?.trim() ?? null,
      submitted_by: user.id,
      status: "pending",
    });

  if (error) {
    return NextResponse.json({ error: "Failed to submit trope" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
