import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

export const runtime = "edge";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ key: string }> }
) {
  const { key } = await params;
  const characterKey = decodeURIComponent(key);
  const supabase = createAdminClient();

  const db = supabase as unknown as {
    from: (t: string) => {
      update: (data: unknown) => {
        eq: (col: string, val: string) => Promise<{ error: unknown }>;
      };
      select: (q: string) => {
        eq: (col: string, val: string) => {
          single: () => Promise<{ data: unknown; error: unknown }>;
        };
      };
      rpc?: (fn: string, args: Record<string, unknown>) => Promise<{ data: unknown; error: unknown }>;
    };
    rpc: (fn: string, args: Record<string, unknown>) => Promise<{ data: unknown; error: unknown }>;
  };

  // Increment share_count server-side
  const { error } = await (supabase as unknown as { rpc: (fn: string, args: Record<string, unknown>) => Promise<{ error: unknown }> }).rpc("increment_share_count", {
    p_character_key: characterKey,
  });

  if (error) {
    // Fallback: raw update (fire-and-forget error)
    void db.from("characters").update({ share_count: 1 }).eq("character_key", characterKey);
  }

  const origin = process.env.NEXT_PUBLIC_SITE_URL ?? "https://serizawatest.com";
  const url = `${origin}/character/${encodeURIComponent(characterKey)}`;
  const ogImage = `${origin}/api/og/${encodeURIComponent(characterKey)}.png`;

  return NextResponse.json({
    url,
    ogImage,
    twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(`I just ran the Serizawa Test on this character. The results are…interesting. 👀\n`)}&url=${encodeURIComponent(url)}`,
    embedCode: `<iframe src="${origin}/embed/character/${encodeURIComponent(characterKey)}" width="340" height="520" frameborder="0" style="border-radius:16px;"></iframe>`,
  });
}
