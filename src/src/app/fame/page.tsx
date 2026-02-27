import { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { CharacterCard } from "@/components/character/CharacterCard";
import type { Grade, Q5Flag } from "@/lib/supabase/types";

export const metadata: Metadata = {
  title: "Hall of Fame — 殿堂",
  description: "Load-bearing Japanese characters in Western media. Earned their place.",
};

interface FameRow {
  character_key: string;
  name: string;
  latest_final_score: number;
  latest_grade: Grade;
  q5_flag: Q5Flag | null;
  character_image_url: string | null;
  media_properties: { title: string; release_year: number | null } | null;
}

export const revalidate = 300;

export default async function HallOfFamePage() {
  const supabase = await createClient();

  const { data } = await (supabase as unknown as {
    from: (t: string) => {
      select: (q: string) => {
        eq: (c: string, v: boolean) => {
          not: (c: string, op: string, v: unknown) => {
            order: (c: string, opts: Record<string, unknown>) => {
              limit: (n: number) => Promise<{ data: FameRow[] | null }>;
            };
          };
        };
      };
    };
  })
    .from("characters")
    .select("character_key, name, latest_final_score, latest_grade, q5_flag, character_image_url, media_properties(title, release_year)")
    .eq("hall_of_fame", true)
    .not("latest_analysis_id", "is", null)
    .order("latest_final_score", { ascending: false })
    .limit(50);

  const entries = (data ?? []) as FameRow[];

  return (
    <main
      className="min-h-screen px-4 py-10"
      style={{ backgroundColor: "var(--color-ink-950)" }}
    >
      <div className="max-w-[1080px] mx-auto">
        {/* Header — gold gradient */}
        <div className="mb-10">
          <h1
            className="text-5xl mb-1"
            style={{
              fontFamily: "var(--font-display)",
              background: "linear-gradient(135deg, #F0A500 0%, #F5BC3A 50%, #FDE9A8 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            HALL OF FAME
          </h1>
          <p
            className="text-lg mb-1"
            style={{ fontFamily: "var(--font-jp)", color: "var(--color-washi-400)" }}
          >
            殿堂
          </p>
          <p
            className="text-sm max-w-lg"
            style={{ color: "var(--color-washi-400)" }}
          >
            Japanese characters in Western media who earned A+ scores and 5+ independent analyses.
            Load-bearing. Specific. Irreplaceable.
          </p>
        </div>

        {/* Eligibility note */}
        <div
          className="mb-8 p-4 rounded-xl border text-sm"
          style={{
            backgroundColor: "rgba(240,165,0,0.08)",
            borderColor: "rgba(240,165,0,0.3)",
            color: "var(--color-washi-300)",
            borderRadius: "var(--radius-md)",
          }}
        >
          <strong style={{ color: "var(--color-gold-400)" }}>Admission criteria:</strong>{" "}
          FinalScore ≥ 8.50 (Grade A+) across at least 5 independent analyses.
          The bar is high because it should be.
        </div>

        {/* Grid */}
        {entries.length === 0 ? (
          <div className="text-center py-20">
            <p
              className="text-2xl mb-2"
              style={{ fontFamily: "var(--font-display)", color: "var(--color-washi-400)" }}
            >
              THE HALL AWAITS
            </p>
            <p className="text-sm" style={{ color: "var(--color-washi-400)" }}>
              Run 5+ analyses on your favorite characters and see who makes the cut.
            </p>
            <a
              href="/"
              className="inline-block mt-4 px-5 py-2.5 rounded-full text-sm font-medium"
              style={{
                backgroundColor: "var(--color-gold-500)",
                color: "var(--color-ink-950)",
                borderRadius: "9999px",
              }}
            >
              Run an analysis →
            </a>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {entries.map((entry) => (
              <CharacterCard
                key={entry.character_key}
                characterKey={entry.character_key}
                name={entry.name}
                mediaTitle={entry.media_properties?.title ?? "Unknown"}
                releaseYear={entry.media_properties?.release_year}
                finalScore={entry.latest_final_score}
                grade={entry.latest_grade}
                q5Flag={entry.q5_flag}
                imageUrl={entry.character_image_url}
                variant="fame"
              />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
