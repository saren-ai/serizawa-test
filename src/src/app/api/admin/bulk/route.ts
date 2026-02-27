import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/roles";
import { createAdminClient } from "@/lib/supabase/server";
import { randomUUID } from "crypto";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json() as { items: Array<{ characterName: string; mediaTitle: string; releaseYear?: number; mediaType?: string }> };
  const { items } = body;

  if (!Array.isArray(items) || items.length === 0) {
    return NextResponse.json({ error: "No items" }, { status: 400 });
  }

  if (items.length > 200) {
    return NextResponse.json({ error: "Max 200 items per job" }, { status: 400 });
  }

  const jobId = randomUUID();
  const supabase = createAdminClient();
  const db = supabase as unknown as {
    from: (t: string) => {
      insert: (data: unknown) => Promise<{ error: unknown }>;
    };
  };

  // Create bulk_jobs record
  const { error: jobError } = await db.from("bulk_jobs").insert({
    id: jobId,
    total_items: items.length,
    processed_items: 0,
    status: "pending",
  });

  if (jobError) {
    return NextResponse.json({ error: "Failed to create job" }, { status: 500 });
  }

  // Create bulk_items records
  const bulkItems = items.map((item, i) => ({
    job_id: jobId,
    position: i,
    character_name: item.characterName,
    media_title: item.mediaTitle,
    release_year: item.releaseYear ?? null,
    media_type: item.mediaType ?? null,
    status: "pending",
  }));

  const { error: itemsError } = await db.from("bulk_items").insert(bulkItems);

  if (itemsError) {
    return NextResponse.json({ error: "Failed to create items" }, { status: 500 });
  }

  // Kick off processing via Edge Function (fire-and-forget)
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  void fetch(`${supabaseUrl}/functions/v1/process-bulk-job`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${serviceKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ jobId }),
  }).catch(() => {/* fire-and-forget */});

  return NextResponse.json({ jobId }, { status: 201 });
}
