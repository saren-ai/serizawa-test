import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { normalizeCharacterKey } from "@/lib/characters";

export const runtime = "nodejs";
export const maxDuration = 300;

// Vercel Cron: runs every minute to process pending bulk items one at a time
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();
  const db = supabase as unknown as {
    from: (t: string) => {
      select: (q: string) => {
        eq: (col: string, val: unknown) => {
          order: (col: string, opts?: Record<string, unknown>) => {
            limit: (n: number) => {
              single: () => Promise<{ data: unknown; error: unknown }>;
            };
          };
        };
      };
      update: (data: unknown) => {
        eq: (col: string, val: unknown) => Promise<{ error: unknown }>;
      };
    };
  };

  // Grab next pending item across all jobs
  const { data: item } = await db
    .from("bulk_items")
    .select("id, job_id, character_name, media_title, release_year, media_type")
    .eq("status", "pending")
    .order("created_at")
    .limit(1)
    .single();

  if (!item) {
    return NextResponse.json({ message: "No pending items" });
  }

  const row = item as { id: string; job_id: string; character_name: string; media_title: string; release_year: number | null; media_type: string | null };

  // Mark as processing
  await db.from("bulk_items").update({ status: "processing" }).eq("id", row.id);

  try {
    const characterKey = normalizeCharacterKey(row.character_name, row.media_title);
    const origin = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

    // Trigger analysis via internal API
    const analysisRes = await fetch(`${origin}/api/characters/${encodeURIComponent(characterKey)}/analyze`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-admin-cron": process.env.CRON_SECRET ?? "",
      },
      body: JSON.stringify({
        characterName: row.character_name,
        mediaTitle: row.media_title,
        releaseYear: row.release_year,
        mediaType: row.media_type,
        skipRateLimit: true,
      }),
    });

    if (!analysisRes.ok) {
      const errText = await analysisRes.text();
      await db.from("bulk_items").update({ status: "error", error_message: errText.slice(0, 200) }).eq("id", row.id);
    } else {
      const result = await analysisRes.json() as { finalScore?: number; grade?: string };
      await db.from("bulk_items").update({
        status: "done",
        final_score: result.finalScore,
        grade: result.grade,
        character_key: characterKey,
      }).eq("id", row.id);
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    await db.from("bulk_items").update({ status: "error", error_message: msg.slice(0, 200) }).eq("id", row.id);
  }

  // Update job progress counter
  await (supabase as unknown as { rpc: (fn: string, args: Record<string, unknown>) => Promise<unknown> }).rpc("increment_job_progress", { p_job_id: row.job_id });

  return NextResponse.json({ processed: row.character_name });
}
