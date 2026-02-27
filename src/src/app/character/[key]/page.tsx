import { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { BaseballCard } from "@/components/card/BaseballCard";
import { RuleCard } from "@/components/results/RuleCard";
import type { Character, Analysis, MediaProperty, DetectedTrope } from "@/lib/supabase/types";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type CharacterRow = Character & {
  media_properties: MediaProperty | null;
  analyses: Analysis | null;
};

// ---------------------------------------------------------------------------
// generateMetadata
// ---------------------------------------------------------------------------

export async function generateMetadata({
  params,
}: {
  params: Promise<{ key: string }>;
}): Promise<Metadata> {
  const { key } = await params;
  const supabase = await createClient();

  const { data } = await (supabase as unknown as {
    from: (t: string) => {
      select: (q: string) => {
        eq: (c: string, v: string) => {
          single: () => Promise<{ data: { name: string; latest_final_score: number | null; latest_grade: string | null; media_properties: { title: string } | null } | null }>;
        };
      };
    };
  })
    .from("characters")
    .select("name, latest_final_score, latest_grade, media_properties(title)")
    .eq("character_key", key)
    .single();

  if (!data) {
    return { title: "Character not found" };
  }

  const title = `${data.name} — Serizawa Test`;
  const description = data.latest_final_score
    ? `${data.name} from ${data.media_properties?.title ?? "Unknown"} scored ${data.latest_final_score.toFixed(2)}/10 (Grade: ${data.latest_grade}) on the Serizawa Test.`
    : `Analyze ${data.name} using the Serizawa Test framework.`;

  const ogImageUrl = `/api/og/${key}.png`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [{ url: ogImageUrl, width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImageUrl],
    },
  };
}

// ---------------------------------------------------------------------------
// Sub-score labels
// ---------------------------------------------------------------------------

const Q1_LABELS: Record<string, string> = {
  "1a_goal_independence":    "1a — Goal independence",
  "1b_moral_complexity":     "1b — Moral complexity",
  "1c_emotional_interiority": "1c — Emotional interiority",
};
const Q2_LABELS: Record<string, string> = {
  "2a_explicit_identity":    "2a — Explicit identity",
  "2b_cultural_accuracy":    "2b — Cultural accuracy",
  "2c_internalized_heritage": "2c — Internalized heritage",
};
const Q4_LABELS: Record<string, string> = {
  "4a_plot_counterfactual":       "4a — Plot counterfactual",
  "4b_emotional_counterfactual":  "4b — Emotional counterfactual",
  "4c_irreversible_decision":     "4c — Irreversible decision",
};

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function CharacterPage({
  params,
}: {
  params: Promise<{ key: string }>;
}) {
  const { key } = await params;
  const supabase = await createClient();

  const { data: characterRaw, error } = await (supabase as unknown as {
    from: (t: string) => {
      select: (q: string) => {
        eq: (c: string, v: string) => {
          single: () => Promise<{ data: CharacterRow | null; error: { message: string } | null }>;
        };
      };
    };
  })
    .from("characters")
    .select(`
      *,
      media_properties (*),
      analyses!latest_analysis_id (
        id,
        q1_score, q1_rationale,
        q2_score, q2_rationale,
        q3_score, q3_rationale,
        q4_score, q4_rationale,
        q5_flag, q5_notes,
        base_score, trope_penalty, trope_bonus,
        final_score, grade,
        tropes, subversions, suggestions, summary,
        rubric_version, model_version, prompt_template_version,
        processing_duration_ms, created_at
      )
    `)
    .eq("character_key", key)
    .single();

  if (error || !characterRaw) {
    notFound();
  }

  const character = characterRaw as CharacterRow;
  const analysis = character.analyses;
  const media = character.media_properties;

  if (!analysis) {
    // Character exists but has no analysis yet (edge case — redir to analyze)
    notFound();
  }

  const detectedTropes: DetectedTrope[] = (analysis.tropes as DetectedTrope[]) ?? [];

  // Parse sub-scores (stored as JSONB in analyses)
  // In practice, sub-scores are stored in q1_score etc., but the detailed breakdown
  // isn't persisted separately yet — show the aggregate scores for now
  const q1SubScores = null; // TODO: store sub-scores in analyses table
  const q2SubScores = null;
  const q4SubScores = null;

  const gradeLabel = getGradeLabel(analysis.grade ?? "F");

  return (
    <main
      className="min-h-screen"
      style={{ backgroundColor: "var(--color-ink-950)" }}
    >
      <div className="max-w-[1080px] mx-auto px-4 py-8 lg:py-12">
        {/* Breadcrumb ghost pill */}
        <nav className="mb-6">
          <a
            href="/"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs border transition-colors"
            style={{
              backgroundColor: "var(--color-ink-800)",
              borderColor: "var(--color-ink-600)",
              color: "var(--color-washi-400)",
              fontFamily: "var(--font-body)",
              borderRadius: "9999px",
            }}
          >
            ← Analyze another
          </a>
        </nav>

        <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 items-start">
          {/* Left column — sticky baseball card */}
          <div className="lg:sticky lg:top-8 flex-shrink-0">
            <BaseballCard
              characterName={character.name}
              mediaTitle={media?.title ?? "Unknown"}
              finalScore={analysis.final_score ?? 0}
              grade={analysis.grade ?? "F"}
              gradeLabel={gradeLabel}
              q5Flag={analysis.q5_flag ?? "unknown"}
              q5ActorName={null}
              detectedTropes={detectedTropes}
              summary={analysis.summary ?? ""}
              imageUrl={character.character_image_url}
              flippable={true}
              defaultFlipped={false}
            />

            {/* Share + Re-analyze actions */}
            <div className="mt-4 flex gap-2">
              <a
                href={`/api/characters/${key}/share`}
                className="flex-1 py-2 text-center text-xs rounded-full border"
                style={{
                  borderColor: "var(--color-ink-600)",
                  color: "var(--color-washi-400)",
                  fontFamily: "var(--font-body)",
                  borderRadius: "9999px",
                }}
              >
                Share
              </a>
              <a
                href={`/analyze/${key}?name=${encodeURIComponent(character.name)}&media=${encodeURIComponent(media?.title ?? "")}`}
                className="flex-1 py-2 text-center text-xs rounded-full border"
                style={{
                  borderColor: "var(--color-ink-600)",
                  color: "var(--color-washi-400)",
                  fontFamily: "var(--font-body)",
                  borderRadius: "9999px",
                }}
              >
                Re-analyze
              </a>
            </div>
          </div>

          {/* Right column — rule cards + details */}
          <div className="flex-1 min-w-0 space-y-3">
            {/* Character header */}
            <div className="mb-6">
              <h1
                className="text-3xl lg:text-4xl"
                style={{
                  fontFamily: "var(--font-display)",
                  color: "var(--color-washi-100)",
                }}
              >
                {character.name.toUpperCase()}
              </h1>
              <p
                className="text-base mt-1"
                style={{ color: "var(--color-washi-400)" }}
              >
                {media?.title ?? "Unknown"}{media?.release_year ? ` (${media.release_year})` : ""}
                {media?.media_type ? ` · ${media.media_type.replace("_", " ")}` : ""}
              </p>

              {/* Summary */}
              <p
                className="text-sm mt-4 leading-relaxed"
                style={{ color: "var(--color-washi-300)", fontFamily: "var(--font-body)" }}
              >
                {analysis.summary}
              </p>
            </div>

            {/* Q1 */}
            {analysis.q1_score !== null && (
              <RuleCard
                rule="Q1"
                score={analysis.q1_score}
                rationale={analysis.q1_rationale ?? ""}
                register="teachable"
                subScores={q1SubScores}
                subScoreLabels={Q1_LABELS}
              />
            )}

            {/* Q2 */}
            {analysis.q2_score !== null && (
              <RuleCard
                rule="Q2"
                score={analysis.q2_score}
                rationale={analysis.q2_rationale ?? ""}
                register="teachable"
                subScores={q2SubScores}
                subScoreLabels={Q2_LABELS}
              />
            )}

            {/* Q3 with trope pills */}
            {analysis.q3_score !== null && (
              <div>
                <RuleCard
                  rule="Q3"
                  score={analysis.q3_score}
                  rationale={analysis.q3_rationale ?? ""}
                  register="teachable"
                  subScores={null}
                />
                {/* Trope pills below Q3 card */}
                {detectedTropes.length > 0 && (
                  <div className="mt-2 px-2">
                    <div className="flex flex-wrap gap-1.5">
                      {detectedTropes.map((trope) => (
                        <TropePill key={trope.id} trope={trope} />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Q4 */}
            {analysis.q4_score !== null && (
              <RuleCard
                rule="Q4"
                score={analysis.q4_score}
                rationale={analysis.q4_rationale ?? ""}
                register="teachable"
                subScores={q4SubScores}
                subScoreLabels={Q4_LABELS}
              />
            )}

            {/* Suggestions */}
            {analysis.suggestions && (
              <div
                className="rounded-xl border p-5 mt-4"
                style={{
                  backgroundColor: "var(--color-ink-800)",
                  borderColor: "var(--color-ink-600)",
                  borderRadius: "var(--radius-md)",
                }}
              >
                <h3
                  className="text-xs uppercase tracking-widest mb-3"
                  style={{ color: "var(--color-washi-400)", fontFamily: "var(--font-mono)" }}
                >
                  Suggestions for improvement
                </h3>
                <p
                  className="text-sm leading-relaxed whitespace-pre-wrap"
                  style={{ color: "var(--color-washi-300)" }}
                >
                  {analysis.suggestions}
                </p>
              </div>
            )}

            {/* Metadata footer */}
            <div
              className="pt-4 border-t text-xs flex flex-wrap gap-x-4 gap-y-1"
              style={{
                borderColor: "var(--color-ink-700)",
                color: "var(--color-washi-400)",
                fontFamily: "var(--font-mono)",
              }}
            >
              <span>Rubric: {analysis.rubric_version}</span>
              <span>Template: {analysis.prompt_template_version}</span>
              <span>Model: {analysis.model_version}</span>
              {analysis.processing_duration_ms && (
                <span>Processing: {(analysis.processing_duration_ms / 1000).toFixed(1)}s</span>
              )}
              <span>Analyzed: {new Date(analysis.created_at).toLocaleDateString()}</span>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

// ---------------------------------------------------------------------------
// Trope pill (server component)
// ---------------------------------------------------------------------------

const REGISTER_COLORS_SERVER: Record<string, string> = {
  trigger:   "trope-pill-trigger",
  teachable: "trope-pill-teachable",
  mockery:   "trope-pill-mockery",
  dual:      "trope-pill-dual",
};

function TropePill({ trope }: { trope: DetectedTrope }) {
  const registerKey = trope.register.includes("→") ? "dual"
    : trope.register.toLowerCase();
  const cls = REGISTER_COLORS_SERVER[registerKey] ?? "trope-pill-teachable";

  return (
    <span
      className={`trope-pill ${cls}`}
      title={trope.evidence}
    >
      {trope.name}
      {trope.subverted && <span className="ml-1 opacity-60 text-[10px]">↩</span>}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Grade label helper
// ---------------------------------------------------------------------------

function getGradeLabel(grade: string): string {
  const labels: Record<string, string> = {
    "A+": "Load-bearing",
    "A":  "Strong pass",
    "B":  "Present but underwritten",
    "C":  "Ornamental",
    "D":  "Prop with lines",
    "F":  "Wall of Shame candidate",
  };
  return labels[grade] ?? "Unknown";
}
