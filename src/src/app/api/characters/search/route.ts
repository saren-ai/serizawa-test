import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "edge";

/**
 * GET /api/characters/search?q=miyagi&limit=10
 *
 * Autocomplete search across character name + media title.
 * Returns up to `limit` results (default 10, max 20).
 * No auth required.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim() ?? "";
  const limit = Math.min(
    parseInt(searchParams.get("limit") ?? "10", 10) || 10,
    20
  );

  if (!q || q.length < 1) {
    return NextResponse.json({ results: [] });
  }

  const supabase = await createClient();

  // Search character name and joined media title using ILIKE
  type SearchRow = {
    character_key: string;
    name: string;
    latest_final_score: number | null;
    latest_grade: string | null;
    q5_flag: string | null;
    character_image_url: string | null;
    media_properties: {
      title: string;
      media_type: string | null;
      release_year: number | null;
    } | null;
  };

  const { data, error } = await (supabase as ReturnType<typeof import("@supabase/supabase-js")["createClient"]>)
    .from("characters")
    .select(
      `
      character_key,
      name,
      latest_final_score,
      latest_grade,
      q5_flag,
      character_image_url,
      media_properties!inner (
        title,
        media_type,
        release_year
      )
    `
    )
    .or(`name.ilike.%${q}%,media_properties.title.ilike.%${q}%`)
    .not("latest_analysis_id", "is", null)
    .order("lookup_count", { ascending: false })
    .limit(limit) as unknown as { data: SearchRow[] | null; error: { message: string } | null };

  if (error) {
    console.error("[search] Supabase error:", error.message);
    return NextResponse.json({ results: [] }, { status: 500 });
  }

  const results = (data ?? []).map((row) => ({
    characterKey: row.character_key,
    name: row.name,
    mediaTitle: row.media_properties?.title ?? "",
    mediaType: row.media_properties?.media_type ?? null,
    releaseYear: row.media_properties?.release_year ?? null,
    finalScore: row.latest_final_score,
    grade: row.latest_grade,
    q5Flag: row.q5_flag,
    imageUrl: row.character_image_url,
  }));

  return NextResponse.json(
    { results },
    {
      headers: {
        // Short cache — results change as new analyses are added
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
      },
    }
  );
}
