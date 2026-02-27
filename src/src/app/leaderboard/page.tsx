import { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { Grade, Q5Flag } from "@/lib/supabase/types";

export const metadata: Metadata = {
  title: "Leaderboard — ランキング",
  description: "Serizawa Test leaderboard — scored by analysis count-weighted confidence.",
};

export const revalidate = 300;

type LeaderboardRow = {
  character_key: string;
  name: string;
  latest_final_score: number;
  latest_grade: Grade;
  q5_flag: Q5Flag | null;
  character_image_url: string | null;
  media_properties: { title: string; release_year: number | null; media_type: string | null } | null;
};

const TABS = [
  { key: "all",         label: "All-time",       jp: "歴代" },
  { key: "shame",       label: "Wall of Shame",   jp: "恥の壁" },
  { key: "fame",        label: "Hall of Fame",    jp: "殿堂" },
  { key: "film",        label: "Film",            jp: "映画" },
  { key: "tv_series",   label: "TV Series",       jp: "テレビ" },
  { key: "animation",   label: "Animation",       jp: "アニメ" },
];

const GRADE_COLORS: Record<Grade, string> = {
  "A+": "#F5BC3A", "A":  "#6FCF97", "A-": "#8DD9AB",
  "B+": "#7EC8E3", "B":  "#A8D8EA", "B-": "#BDE3EF",
  "C+": "#F5C842", "C":  "#F5D06B", "C-": "#F5DB8E",
  "D+": "#F0A86B", "D":  "#F0B888", "D-": "#F0C8A5",
  "F":  "#F5856E",
};

export default async function LeaderboardPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const sp = await searchParams;
  const tab = sp.tab ?? "all";
  const supabase = await createClient();

  // Build query based on tab
  type QueryBuilder = {
    select: (q: string) => {
      not: (c: string, op: string, v: unknown) => {
        eq?: (c: string, v: unknown) => {
          order: (c: string, opts: Record<string, unknown>) => {
            limit: (n: number) => Promise<{ data: LeaderboardRow[] | null }>;
          };
        };
        order: (c: string, opts: Record<string, unknown>) => {
          limit: (n: number) => Promise<{ data: LeaderboardRow[] | null }>;
        };
      };
    };
  };

  const baseSelect = "character_key, name, latest_final_score, latest_grade, q5_flag, character_image_url, media_properties(title, release_year, media_type)";

  let rows: LeaderboardRow[] = [];

  const client = supabase as unknown as { from: (t: string) => QueryBuilder };

  if (tab === "shame") {
    const { data } = await (supabase as unknown as {
      from: (t: string) => {
        select: (q: string) => {
          eq: (c: string, v: boolean) => {
            not: (c: string, op: string, v: unknown) => {
              order: (c: string, opts: Record<string, unknown>) => {
                limit: (n: number) => Promise<{ data: LeaderboardRow[] | null }>;
              };
            };
          };
        };
      };
    })
      .from("characters").select(baseSelect)
      .eq("wall_of_shame", true).not("latest_analysis_id", "is", null)
      .order("latest_final_score", { ascending: true }).limit(100);
    rows = (data ?? []) as LeaderboardRow[];
  } else if (tab === "fame") {
    const { data } = await (supabase as unknown as {
      from: (t: string) => {
        select: (q: string) => {
          eq: (c: string, v: boolean) => {
            not: (c: string, op: string, v: unknown) => {
              order: (c: string, opts: Record<string, unknown>) => {
                limit: (n: number) => Promise<{ data: LeaderboardRow[] | null }>;
              };
            };
          };
        };
      };
    })
      .from("characters").select(baseSelect)
      .eq("hall_of_fame", true).not("latest_analysis_id", "is", null)
      .order("latest_final_score", { ascending: false }).limit(100);
    rows = (data ?? []) as LeaderboardRow[];
  } else {
    const { data } = await client.from("characters").select(baseSelect)
      .not("latest_analysis_id", "is", null)
      .order("latest_final_score", { ascending: false }).limit(100);
    rows = (data ?? []) as LeaderboardRow[];
    // Filter by media type if tab is film/tv_series/animation
    if (["film", "tv_series", "animation"].includes(tab)) {
      rows = rows.filter((r) => r.media_properties?.media_type === tab);
    }
  }

  return (
    <main className="min-h-screen px-4 py-10" style={{ backgroundColor: "var(--color-ink-950, #0A0705)" }}>
      <div className="max-w-[1080px] mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-5xl mb-1" style={{ fontFamily: "var(--font-display)", color: "var(--color-washi-100)" }}>
            LEADERBOARD
          </h1>
          <p className="text-lg" style={{ fontFamily: "var(--font-jp)", color: "var(--color-washi-400)" }}>ランキング</p>
          <p className="text-xs mt-2" style={{ color: "var(--color-washi-400)", fontFamily: "var(--font-mono)" }}>
            Scores use Bayesian confidence weighting (m=5). Characters with fewer than 5 analyses are pulled toward the mean.
          </p>
        </div>

        {/* Tab pills */}
        <div className="flex flex-wrap gap-2 mb-8">
          {TABS.map((t) => (
            <Link
              key={t.key}
              href={`/leaderboard?tab=${t.key}`}
              className="px-4 py-1.5 rounded-full text-sm border transition-all"
              style={{
                backgroundColor: tab === t.key ? "var(--color-vermillion-500)" : "var(--color-ink-800)",
                borderColor: tab === t.key ? "var(--color-vermillion-500)" : "var(--color-ink-600)",
                color: tab === t.key ? "var(--color-washi-100)" : "var(--color-washi-400)",
                borderRadius: "9999px",
              }}
            >
              {t.label}
            </Link>
          ))}
        </div>

        {/* Table */}
        {rows.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-xl" style={{ color: "var(--color-washi-400)", fontFamily: "var(--font-display)" }}>
              NO ENTRIES YET
            </p>
            <p className="text-sm mt-2" style={{ color: "var(--color-washi-400)" }}>
              Run some analyses and the leaderboard will populate.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {rows.map((row, i) => {
              const gradeColor = GRADE_COLORS[row.latest_grade] ?? "#B8A99A";
              return (
                <Link
                  key={row.character_key}
                  href={`/character/${row.character_key}`}
                  className="flex items-center gap-4 px-4 py-3 rounded-xl border transition-all hover:border-vermillion-500"
                  style={{
                    backgroundColor: "var(--color-ink-800)",
                    borderColor: "var(--color-ink-600)",
                    borderRadius: "var(--radius-md)",
                    textDecoration: "none",
                  }}
                >
                  {/* Rank */}
                  <span
                    className="w-8 text-right text-sm flex-shrink-0"
                    style={{ color: "var(--color-washi-400)", fontFamily: "var(--font-mono)" }}
                  >
                    {i + 1}
                  </span>
                  {/* Name + media */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium" style={{ color: "var(--color-washi-100)" }}>{row.name}</p>
                    <p className="text-xs" style={{ color: "var(--color-washi-400)" }}>
                      {row.media_properties?.title}{row.media_properties?.release_year ? ` (${row.media_properties.release_year})` : ""}
                    </p>
                  </div>
                  {/* Score + grade */}
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className="text-sm" style={{ color: gradeColor, fontFamily: "var(--font-mono)" }}>
                      {(row.latest_final_score * 10).toFixed(1)}
                    </span>
                    <span className="text-base font-bold" style={{ color: gradeColor, fontFamily: "var(--font-display)" }}>
                      {row.latest_grade}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
