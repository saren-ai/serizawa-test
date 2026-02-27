"use client";

import { useState } from "react";

// All 34 tropes as seed data (mirrors what's in the DB migration)
const TROPE_ENTRIES = [
  { term: "Wise Mystic Mentor", def: "Moderate archetype. −0.10. Register: teachable. The Miyagi borderline case. Depth saves it; pure cryptic wisdom dispensing sinks it.", id: "T001" },
  { term: "Dragon Lady", def: "Major sexualization trope. −0.25. Register: trigger. Alluring, manipulative, exoticized. Sexuality as threat. Still very much alive.", id: "T002" },
  { term: "Silent Enforcer", def: "Moderate archetype. −0.10. Register: teachable. Stoic competence without interiority. Katana's ZIP code.", id: "T003" },
  { term: "Default Martial Artist", def: "Moderate archetype. −0.10. Register: teachable. Skill assignment without narrative basis.", id: "T004" },
  { term: "Samurai / Ninja Assumption", def: "Major cultural reduction. −0.25. Register: dual. Starts teachable, becomes mockery when a modern salaryman inexplicably knows kenjutsu.", id: "T005" },
  { term: "Exotic Sexual Object", def: "Major sexualization. −0.25. Register: trigger. Fetishized otherness as primary characterization.", id: "T007" },
  { term: "Comedic Accent Gag", def: "Moderate appearance/accent. −0.10. Register: dual. Accent deployed for othering or humor. Starts mockery, lands trigger.", id: "T008" },
  { term: "Asian Buck Teeth", def: "Major appearance. −0.25. Register: trigger. Legacy caricature. No redemptive reading exists. Full stop.", id: "T009" },
  { term: "Gratuitous Kimono Drop", def: "Minor cultural reduction. −0.05. Register: mockery. Shallow costume cameo unmoored from context.", id: "T010" },
  { term: "Salaryman Flatness", def: "Minor role limitation. −0.05. Register: teachable. Defined entirely by overworked office drone trope.", id: "T011" },
  { term: "Technological Savant Automaton", def: "Moderate archetype. −0.10. Register: teachable. Emotionless logic machine. Every 90s cyberpunk film's 'Japanese hacker'.", id: "T012" },
  { term: "The Houseboy", def: "Major archetype. −0.25. Register: trigger. Domestic servitude coding. Racial and gender dimensions intersect nastily.", id: "T013" },
  { term: "Interchangeable Asian Cultures", def: "Major cultural reduction. −0.25. Register: trigger. Japanese character with Chinese customs, Korean food, vaguely pan-Asian accent.", id: "T014" },
  { term: "Gaijin in Japan", def: "Minor cultural reduction. −0.05. Register: mockery. White protagonist arrives in Japan, immediately becomes the most important person in the room.", id: "T015" },
  { term: "Tokyo Is the Center of the Universe", def: "Minor cultural reduction. −0.05. Register: mockery. All of Japan is Tokyo. Osaka weeps.", id: "T016" },
  { term: "Japandering", def: "Minor cultural reduction. −0.05. Register: mockery. Western celebrity doing baffling Japanese ads.", id: "T017" },
  { term: "Japan Takes Over the World", def: "Moderate cultural reduction. −0.10. Register: teachable. Yellow Peril's economic anxiety cousin. Very 1980s.", id: "T018" },
  { term: "WWII Soldier Doesn't Know War Is Over", def: "Moderate cultural reduction. −0.10. Register: dual. Hiroo Onoda territory. Starts mockery, lands teachable.", id: "T019" },
  { term: "Geisha Stereotype", def: "Major sexualization. −0.25. Register: dual. Submission and service as feminine ideal.", id: "T020" },
  { term: "Yamato Nadeshiko", def: "Moderate sexualization. −0.10. Register: teachable. The 'ideal Japanese woman' — demure, devoted, self-sacrificing.", id: "T021" },
  { term: "Mighty Whitey and Mellow Yellow", def: "Major sexualization. −0.25. Register: trigger. White male protagonist + devoted Japanese woman. Madama Butterfly's Hollywood grandchildren.", id: "T022" },
  { term: "Engrish / Japanese Ranguage", def: "Moderate appearance/accent. −0.10. Register: dual. Mangled English as comedy.", id: "T023" },
  { term: "Ching Chong", def: "Major appearance/accent. −0.25. Register: trigger. Onomatopoeic mockery of East Asian languages.", id: "T024" },
  { term: '"Ah, So."', def: "Moderate appearance/accent. −0.10. Register: dual. Specific phrase deployed as Japanese accent shorthand.", id: "T025" },
  { term: "All Asians Wear Conical Straw Hats", def: "Minor appearance/accent. −0.05. Register: mockery. It's 2024. And yet.", id: "T026" },
  { term: "Asian Airhead", def: "Moderate role limitation. −0.10. Register: dual. Ditzy, shallow, accent-adjacent.", id: "T027" },
  { term: "Asian and Nerdy", def: "Minor role limitation. −0.05. Register: teachable. Model minority stereotype wearing a pocket protector.", id: "T028" },
  { term: "Asian Babymama", def: "Moderate role limitation. −0.10. Register: trigger. Exists to produce mixed-race children for the white protagonist's storyline.", id: "T029" },
  { term: "Asian Drivers", def: "Minor role limitation. −0.05. Register: mockery. Deeply stupid.", id: "T030" },
  { term: "Inscrutable Oriental", def: "Moderate role limitation. −0.10. Register: dual. Deliberate inscrutability as characterization.", id: "T031" },
  { term: "Japanese Politeness as Characterization", def: "Minor role limitation. −0.05. Register: teachable. Politeness so exaggerated it replaces personality.", id: "T032" },
  { term: "Asian Cleaver Fever", def: "Minor role limitation. −0.05. Register: dual. Specific prop-as-menace coding.", id: "T033" },
  { term: "Yellowface", def: "Major identity/casting. −0.25. Register: trigger. Non-Asian actor in Asian role. Primary Wall of Shame admission criterion.", id: "T034" },
  { term: "Whitey Playing Hāfu", def: "Moderate identity/casting. −0.10. Register: trigger. White or non-Japanese actor playing mixed Japanese heritage.", id: "T035" },
  { term: "Yellow Peril", def: "Major identity/casting. −0.25. Register: trigger. Systemic threat framing. The ideological foundation of half this list.", id: "T036" },
  { term: "Asian Speekee Engrish", def: "Moderate identity/casting. −0.10. Register: dual. Broader than Engrish — systemic accent mockery as characterization.", id: "T037" },
];

const RULE_ENTRIES = [
  { term: "Serizawa Test", def: "The five-question scoring framework for evaluating Japanese character representation in Western media.", id: "DEF001" },
  { term: "FinalScore", def: "Q1 + Q2 + Q3_final + Q4. Range 0.00–10.00. Always DECIMAL(4,2).", id: "DEF002" },
  { term: "Penalty Cap", def: "min(TropePenalty, 0.30 × BaseScore). Prevents Q3 from going below zero on otherwise strong portrayals.", id: "DEF003" },
  { term: "Subversion Bonus", def: "+0.10 per subverted trope. Maximum +0.25 total. Subversion ≠ softening — the narrative must explicitly invoke and then challenge the trope.", id: "DEF004" },
  { term: "Bayesian Average", def: "(v × R + m × C) / (v + m) where m=5. Prevents low-sample outliers from dominating the leaderboard.", id: "DEF005" },
  { term: "Japanifornia", def: "The tonal register of the Serizawa Test. Academically rigorous. Pop-culturally fluent. Occasionally merciless.", id: "DEF006" },
  { term: "Q4c Test", def: "The Serizawa '54 test. Named for Dr. Ishirō Serizawa's Oxygen Destroyer — an irreversible decision that permanently changes the story's conditions. Characters who never make such a decision score 0 on Q4c.", id: "DEF007" },
];

type GlossaryEntry = { term: string; def: string; id: string };

export default function GlossaryPage() {
  const [query, setQuery] = useState("");

  const allEntries: GlossaryEntry[] = [...RULE_ENTRIES, ...TROPE_ENTRIES].sort((a, b) =>
    a.term.localeCompare(b.term)
  );

  const filtered = query.trim()
    ? allEntries.filter(
        (e) =>
          e.term.toLowerCase().includes(query.toLowerCase()) ||
          e.def.toLowerCase().includes(query.toLowerCase())
      )
    : allEntries;

  // Group by first letter for A-Z
  const grouped = filtered.reduce((acc, entry) => {
    const letter = entry.term[0]?.toUpperCase() ?? "#";
    if (!acc[letter]) acc[letter] = [];
    acc[letter].push(entry);
    return acc;
  }, {} as Record<string, GlossaryEntry[]>);

  return (
    <main className="min-h-screen px-4 py-10" style={{ backgroundColor: "var(--color-ink-950, #0A0705)" }}>
      <div className="max-w-[720px] mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-5xl mb-0.5" style={{ fontFamily: "var(--font-display)", color: "var(--color-washi-100)" }}>GLOSSARY</h1>
          <p className="text-lg" style={{ fontFamily: "var(--font-jp)", color: "var(--color-washi-400)" }}>用語集</p>
          <p className="text-xs mt-2" style={{ color: "var(--color-washi-400)" }}>
            {allEntries.length} terms — all 34 tropes + scoring definitions + framework concepts
          </p>
        </div>

        {/* Search */}
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search terms and definitions…"
          className="w-full px-4 py-3 text-sm rounded-xl border outline-none mb-8"
          style={{ backgroundColor: "var(--color-ink-800)", borderColor: "var(--color-ink-600)", color: "var(--color-washi-100)", fontFamily: "var(--font-body)", borderRadius: "var(--radius-md)" }}
          onFocus={(e) => (e.target.style.borderColor = "var(--color-vermillion-500)")}
          onBlur={(e) => (e.target.style.borderColor = "var(--color-ink-600)")}
        />

        {/* Entries */}
        <div className="space-y-6">
          {Object.entries(grouped)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([letter, entries]) => (
              <div key={letter}>
                <h2 className="text-xs uppercase tracking-widest mb-3 pb-1 border-b" style={{ color: "var(--color-vermillion-500)", fontFamily: "var(--font-mono)", borderColor: "var(--color-ink-700)" }}>
                  {letter}
                </h2>
                <div className="space-y-2">
                  {entries.map((entry) => (
                    <div key={entry.id} className="p-4 rounded-xl border" style={{ backgroundColor: "var(--color-ink-800)", borderColor: "var(--color-ink-600)", borderRadius: "var(--radius-md)" }}>
                      <p className="text-sm font-medium mb-1" style={{ color: "var(--color-washi-100)", fontFamily: "var(--font-body)" }}>{entry.term}</p>
                      <p className="text-xs leading-relaxed" style={{ color: "var(--color-washi-400)" }}>{entry.def}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
        </div>
      </div>
    </main>
  );
}
