import { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { CharacterCard } from "@/components/character/CharacterCard";
import type { Grade, Q5Flag } from "@/lib/supabase/types";

export const metadata: Metadata = {
  title: "Wall of Shame — 恥の壁",
  description: "Characters that failed the Serizawa Test. Documented. Named. Searchable.",
};

interface ShameRow {
  character_key: string;
  name: string;
  latest_final_score: number;
  latest_grade: Grade;
  q5_flag: Q5Flag | null;
  character_image_url: string | null;
  media_properties: { title: string; release_year: number | null } | null;
}

export const revalidate = 300; // 5-minute ISR

export default async function WallOfShamePage() {
  const supabase = await createClient();

  const { data } = await (supabase as unknown as {
    from: (t: string) => {
      select: (q: string) => {
        eq: (c: string, v: boolean) => {
          not: (c: string, op: string, v: unknown) => {
            order: (c: string, opts: Record<string, unknown>) => {
              limit: (n: number) => Promise<{ data: ShameRow[] | null }>;
            };
          };
        };
      };
    };
  })
    .from("characters")
    .select("character_key, name, latest_final_score, latest_grade, q5_flag, character_image_url, media_properties(title, release_year)")
    .eq("wall_of_shame", true)
    .not("latest_analysis_id", "is", null)
    .order("latest_final_score", { ascending: true })
    .limit(50);

  const entries = (data ?? []) as ShameRow[];

  return (
    <main
      className="min-h-screen px-4 py-10"
      style={{ backgroundColor: "var(--color-ink-950)" }}
    >
      <div className="max-w-[1080px] mx-auto">
        {/* Header */}
        <div className="mb-10">
          <h1
            className="text-5xl mb-1"
            style={{
              fontFamily: "var(--font-display)",
              color: "var(--color-vermillion-500)",
            }}
          >
            WALL OF SHAME
          </h1>
          <p
            className="text-lg mb-1"
            style={{ fontFamily: "var(--font-jp)", color: "var(--color-washi-400)" }}
          >
            恥の壁
          </p>
          <p
            className="text-sm max-w-lg"
            style={{ color: "var(--color-washi-400)" }}
          >
            Characters that failed the Serizawa Test. Scores below 4.50, or yellowface with major tropes.
            Not a joke. A public record.
          </p>
        </div>

        {/* Eligibility note */}
        <div
          className="mb-8 p-4 rounded-xl border text-sm"
          style={{
            backgroundColor: "rgba(231,76,60,0.08)",
            borderColor: "rgba(231,76,60,0.3)",
            color: "var(--color-washi-300)",
            borderRadius: "var(--radius-md)",
          }}
        >
          <strong style={{ color: "var(--color-vermillion-400)" }}>Admission criteria:</strong>{" "}
          FinalScore &lt; 4.50 (Grade F), or confirmed yellowface with at least one Major trope.
          Disputes reviewed by the community.
        </div>

        {/* Grid */}
        {entries.length === 0 ? (
          <div className="text-center py-20">
            <p
              className="text-2xl mb-2"
              style={{ fontFamily: "var(--font-display)", color: "var(--color-washi-400)" }}
            >
              THE WALL IS EMPTY
            </p>
            <p className="text-sm" style={{ color: "var(--color-washi-400)" }}>
              Run more analyses and let the scores decide.
            </p>
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
                variant="shame"
              />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
