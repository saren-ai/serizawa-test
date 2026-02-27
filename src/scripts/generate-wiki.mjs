// Nightly wiki generator — runs in CI, pulls from Supabase, writes markdown
import { createClient } from "@supabase/supabase-js";
import { writeFileSync, mkdirSync } from "fs";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

mkdirSync("wiki-output", { recursive: true });

// --- Trope Taxonomy ---
const { data: tropes } = await supabase
  .from("tropes")
  .select("id, name, category, severity, rationale, register_tag")
  .order("category")
  .order("name");

const tropeRows = (tropes ?? [])
  .map((t) => `| ${t.id} | ${t.name} | ${t.category} | ${t.severity} | ${t.register_tag ?? "—"} |`)
  .join("\n");

writeFileSync(
  "wiki-output/Trope-Taxonomy.md",
  `# Trope Taxonomy\n\n_Last updated: ${new Date().toISOString().slice(0, 10)}_\n\n| ID | Name | Category | Severity | Register |\n|---|---|---|---|---|\n${tropeRows}\n`
);

// --- Model Version Log ---
const { data: models } = await supabase
  .from("model_versions")
  .select("model_name, provider, released_at, prompt_template_version, is_current, notes")
  .order("released_at", { ascending: false });

const modelRows = (models ?? [])
  .map((m) => `| ${m.model_name} | ${m.provider} | ${m.released_at?.slice(0, 10)} | ${m.prompt_template_version} | ${m.is_current ? "✓" : ""} |`)
  .join("\n");

writeFileSync(
  "wiki-output/Model-Version-Log.md",
  `# Model Version Log\n\n| Model | Provider | Released | Prompt Template | Active |\n|---|---|---|---|---|\n${modelRows}\n`
);

// --- Grade Distribution ---
const { data: gradeDist } = await supabase
  .from("analyses")
  .select("grade");

const counts = (gradeDist ?? []).reduce((acc, row) => {
  acc[row.grade] = (acc[row.grade] ?? 0) + 1;
  return acc;
}, {});

const total = Object.values(counts).reduce((a, b) => a + b, 0);
const gradeRows = Object.entries(counts)
  .sort(([a], [b]) => a.localeCompare(b))
  .map(([g, n]) => `| ${g} | ${n} | ${total ? ((n / total) * 100).toFixed(1) : 0}% |`)
  .join("\n");

writeFileSync(
  "wiki-output/Grade-Distribution.md",
  `# Grade Distribution\n\n_Total analyses: ${total}_\n\n| Grade | Count | % |\n|---|---|---|\n${gradeRows}\n`
);

// --- Hall of Fame ---
const { data: hof } = await supabase
  .from("characters")
  .select("name, character_key, analyses(final_score, grade)")
  .eq("hall_of_fame", true)
  .order("name");

const hofRows = (hof ?? [])
  .map((c) => {
    const a = Array.isArray(c.analyses) ? c.analyses[0] : c.analyses;
    return `| [${c.name}](/character/${c.character_key}) | ${a?.grade ?? "?"} | ${a?.final_score?.toFixed(2) ?? "?"} |`;
  })
  .join("\n");

writeFileSync(
  "wiki-output/Hall-of-Fame.md",
  `# Hall of Fame\n\n| Character | Grade | Score |\n|---|---|---|\n${hofRows || "_No entries yet._"}\n`
);

// --- Wall of Shame ---
const { data: wos } = await supabase
  .from("characters")
  .select("name, character_key, analyses(final_score, grade)")
  .eq("wall_of_shame", true)
  .order("name");

const wosRows = (wos ?? [])
  .map((c) => {
    const a = Array.isArray(c.analyses) ? c.analyses[0] : c.analyses;
    return `| [${c.name}](/character/${c.character_key}) | ${a?.grade ?? "?"} | ${a?.final_score?.toFixed(2) ?? "?"} |`;
  })
  .join("\n");

writeFileSync(
  "wiki-output/Wall-of-Shame.md",
  `# Wall of Shame\n\n| Character | Grade | Score |\n|---|---|---|\n${wosRows || "_No entries yet._"}\n`
);

console.log("Wiki pages generated.");
