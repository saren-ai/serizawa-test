import { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Transparency — 透明性",
  description: "How the Serizawa Test works. Rubric, trope taxonomy, model versions, audit log.",
};

export const revalidate = 3600; // 1h ISR

export default async function TransparencyPage() {
  const supabase = await createClient();

  // Fetch model versions for the audit log
  const { data: models } = await (supabase as unknown as {
    from: (t: string) => {
      select: (q: string) => {
        order: (c: string, opts: Record<string, unknown>) => Promise<{
          data: Array<{ model_name: string; provider: string; released_at: string; prompt_template_version: string; is_current: boolean; notes: string | null }> | null
        }>;
      };
    };
  })
    .from("model_versions")
    .select("model_name, provider, released_at, prompt_template_version, is_current, notes")
    .order("released_at", { ascending: false });

  return (
    <main className="min-h-screen px-4 py-10" style={{ backgroundColor: "var(--color-ink-950)" }}>
      <div className="max-w-[720px] mx-auto space-y-10">
        {/* Header */}
        <div>
          <h1 className="text-5xl mb-0.5" style={{ fontFamily: "var(--font-display)", color: "var(--color-washi-100)" }}>TRANSPARENCY</h1>
          <p className="text-lg" style={{ fontFamily: "var(--font-jp)", color: "var(--color-washi-400)" }}>透明性</p>
          <p className="text-sm mt-3 max-w-lg" style={{ color: "var(--color-washi-400)" }}>
            Every score on this site is auditable. This page documents how the Serizawa Test works,
            what model is running, and what version of the rubric scored each character.
          </p>
        </div>

        {/* Section: The Rubric */}
        <Section title="The Rubric" jp="評価基準">
          <div className="space-y-4 text-sm" style={{ color: "var(--color-washi-300)" }}>
            <p>The Serizawa Five consists of five evaluation criteria. Q1–Q4 are each scored 0.00–2.00. Q5 is a flag only — it never appears in the final score.</p>
            <RubricRow rule="Q1" title="Human Individuality" jp="人間的個性" weights="1a: 40% · 1b: 35% · 1c: 25%"
              desc="Does this character have goals, flaws, and an inner life independent of their ethnicity?" />
            <RubricRow rule="Q2" title="Distinctly Japanese Identity" jp="日本人のアイデンティティ" weights="2a: 35% · 2b: 35% · 2c: 30%"
              desc="Is Japaneseness expressed through psychology and specificity — not props and pan-Asian blur?" />
            <RubricRow rule="Q3" title="Avoidance of Harmful Tropes" jp="有害なトロープの回避" weights="Base: 2.00 — penalties, cap, bonus"
              desc="Q3 starts at 2.00. Detected tropes subtract penalties. Penalty cap = min(raw, 30%×BaseScore). Subversions earn +0.10 each (max +0.25)." />
            <RubricRow rule="Q4" title="Narrative Impact" jp="物語への影響" weights="4a: 40% · 4b: 35% · 4c: 25%"
              desc="Is this character load-bearing, or narrative furniture? 4c = irreversibility test." />
            <RubricRow rule="Q5" title="Production Authenticity Flag" jp="制作の真正性" weights="Not scored"
              desc="authentic / approximate / yellowface / not_applicable / unknown. Never in the FinalScore." />
          </div>
        </Section>

        {/* Section: Scoring Math */}
        <Section title="Scoring Algorithm" jp="採点アルゴリズム">
          <pre
            className="text-xs leading-relaxed overflow-x-auto p-4 rounded-xl"
            style={{ backgroundColor: "var(--color-ink-800)", color: "var(--color-washi-300)", fontFamily: "var(--font-mono)", borderRadius: "var(--radius-md)" }}
          >{`BaseScore     = Q1 + Q2 + 2.00 + Q4   (Q3 base before penalties)
TropePenalty  = Σ penalties for distinct detected tropes
PenaltyCap    = min(TropePenalty, 0.30 × BaseScore)
TropeBonus    = Σ subversion bonuses (max 0.25)
Q3_final      = max(0.00, 2.00 − PenaltyCap + TropeBonus)
FinalScore    = Q1 + Q2 + Q3_final + Q4
FinalScore    = round(clamp(FinalScore, 0.00, 10.00), 2)

Grade bands:
  ≥8.50 → A+ (Load-bearing)
  ≥7.50 → A  (Strong pass)
  ≥6.50 → B  (Present but underwritten)
  ≥5.50 → C  (Ornamental)
  ≥4.50 → D  (Prop with lines)
  <4.50 → F  (Wall of Shame candidate)`}</pre>
          <p className="text-xs mt-3" style={{ color: "var(--color-washi-400)" }}>
            Server-side recomputation is mandatory. The model&apos;s own arithmetic is never trusted.
          </p>
        </Section>

        {/* Section: Model Version Log */}
        <Section title="Model Version Log" jp="モデルバージョンログ">
          <div className="space-y-2">
            {(models ?? []).map((m) => (
              <div key={m.model_name} className="flex items-center justify-between px-4 py-3 rounded-xl border" style={{ backgroundColor: "var(--color-ink-800)", borderColor: m.is_current ? "rgba(240,165,0,0.3)" : "var(--color-ink-600)", borderRadius: "var(--radius-md)" }}>
                <div>
                  <p className="text-sm font-medium" style={{ color: m.is_current ? "var(--color-gold-400)" : "var(--color-washi-100)" }}>
                    {m.model_name} {m.is_current && <span className="text-[10px] ml-1 opacity-60">(active)</span>}
                  </p>
                  <p className="text-xs" style={{ color: "var(--color-washi-400)" }}>{m.provider} · template {m.prompt_template_version} · {new Date(m.released_at).getFullYear()}</p>
                </div>
              </div>
            ))}
          </div>
        </Section>

        {/* Section: Dispute + Rule Suggestion links */}
        <Section title="Submit a Change" jp="変更を提出する">
          <p className="text-sm mb-4" style={{ color: "var(--color-washi-400)" }}>
            The rubric is a living document. Disputes, new trope submissions, and rule change suggestions are reviewed by the admin team and community critics.
          </p>
          <div className="flex flex-wrap gap-3">
            <a href="/#dispute" className="px-4 py-2 text-sm rounded-full border" style={{ borderColor: "var(--color-ink-600)", color: "var(--color-washi-300)", borderRadius: "9999px" }}>
              Submit a dispute
            </a>
            <a href="/#new-trope" className="px-4 py-2 text-sm rounded-full border" style={{ borderColor: "var(--color-ink-600)", color: "var(--color-washi-300)", borderRadius: "9999px" }}>
              Propose a new trope
            </a>
            <a href="/#rule-change" className="px-4 py-2 text-sm rounded-full border" style={{ borderColor: "var(--color-ink-600)", color: "var(--color-washi-300)", borderRadius: "9999px" }}>
              Suggest a rule change
            </a>
          </div>
        </Section>
      </div>
    </main>
  );
}

function Section({ title, jp, children }: { title: string; jp: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-4 border-b pb-2" style={{ borderColor: "var(--color-ink-700)" }}>
        <h2 className="text-2xl" style={{ fontFamily: "var(--font-display)", color: "var(--color-washi-100)" }}>{title}</h2>
        <p className="text-sm" style={{ fontFamily: "var(--font-jp)", color: "var(--color-washi-400)" }}>{jp}</p>
      </div>
      {children}
    </div>
  );
}

function RubricRow({ rule, title, jp, weights, desc }: { rule: string; title: string; jp: string; weights: string; desc: string }) {
  return (
    <div className="p-4 rounded-xl" style={{ backgroundColor: "var(--color-ink-800)", borderRadius: "var(--radius-md)" }}>
      <div className="flex items-center gap-3 mb-1">
        <span className="text-xs font-bold" style={{ color: "var(--color-vermillion-500)", fontFamily: "var(--font-mono)" }}>{rule}</span>
        <span className="text-sm font-medium" style={{ color: "var(--color-washi-100)" }}>{title}</span>
        <span className="text-xs" style={{ fontFamily: "var(--font-jp)", color: "var(--color-washi-400)" }}>{jp}</span>
      </div>
      <p className="text-xs mb-1" style={{ color: "var(--color-washi-400)", fontFamily: "var(--font-mono)" }}>{weights}</p>
      <p className="text-xs" style={{ color: "var(--color-washi-300)" }}>{desc}</p>
    </div>
  );
}
