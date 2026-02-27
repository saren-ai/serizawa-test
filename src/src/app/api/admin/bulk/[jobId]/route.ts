import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/roles";
import { createAdminClient } from "@/lib/supabase/server";

export const runtime = "edge";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { jobId } = await params;
  const supabase = createAdminClient();
  const db = supabase as unknown as {
    from: (t: string) => {
      select: (q: string) => {
        eq: (col: string, val: string) => {
          single: () => Promise<{ data: unknown; error: unknown }>;
          order: (col: string, opts?: Record<string, unknown>) => Promise<{ data: unknown[] | null; error: unknown }>;
        };
      };
    };
  };

  const { data: job } = await db.from("bulk_jobs").select("*").eq("id", jobId).single();
  if (!job) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { data: items } = await db.from("bulk_items").select("character_name, media_title, status, final_score, grade, error_message").eq("job_id", jobId).order("position");

  return NextResponse.json({
    job,
    items: (items ?? []).map((i: unknown) => {
      const item = i as Record<string, unknown>;
      return {
        characterName: item.character_name,
        mediaTitle: item.media_title,
        status: item.status,
        finalScore: item.final_score,
        grade: item.grade,
        error: item.error_message,
      };
    }),
  });
}
