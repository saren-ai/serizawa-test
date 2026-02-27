"use client";

import { useState, useEffect, useCallback } from "react";
import { displayScore, displayQScore } from "@/lib/display";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import type { Grade } from "@/lib/supabase/types";

interface CharacterData {
  characterKey: string;
  name: string;
  mediaTitle: string;
  finalScore: number;
  grade: Grade;
  q1Score: number;
  q2Score: number;
  q3Score: number;
  q4Score: number;
  q5Flag: string;
  detectedTropes: { id: string; name: string }[];
}

const GRADE_COLORS: Record<Grade, string> = {
  "A+": "#F5BC3A", "A":  "#6FCF97", "A-": "#8DD9AB",
  "B+": "#7EC8E3", "B":  "#A8D8EA", "B-": "#BDE3EF",
  "C+": "#F5C842", "C":  "#F5D06B", "C-": "#F5DB8E",
  "D+": "#F0A86B", "D":  "#F0B888", "D-": "#F0C8A5",
  "F":  "#F5856E",
};

const RULES = [
  { key: "q1", label: "Q1 — Human Individuality", jp: "人間的個性" },
  { key: "q2", label: "Q2 — Japanese Identity",   jp: "日本人のアイデンティティ" },
  { key: "q3", label: "Q3 — Trope Avoidance",     jp: "トロープの回避" },
  { key: "q4", label: "Q4 — Narrative Impact",    jp: "物語への影響" },
];

export default function ComparePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const keysParam = searchParams.get("keys") ?? "";
  const initialKeys = keysParam ? keysParam.split(",").filter(Boolean).slice(0, 3) : [];

  const [characterKeys, setCharacterKeys] = useState<string[]>(initialKeys);
  const [characters, setCharacters] = useState<(CharacterData | null)[]>([null, null, null]);
  const [addQuery, setAddQuery] = useState("");
  const [addResults, setAddResults] = useState<{ characterKey: string; name: string; mediaTitle: string }[]>([]);
  const [addLoading, setAddLoading] = useState(false);

  const fetchCharacter = useCallback(async (key: string): Promise<CharacterData | null> => {
    try {
      const res = await fetch(`/api/characters/${encodeURIComponent(key)}`);
      if (!res.ok) return null;
      const data = await res.json() as { character: Record<string, unknown> };
      const c = data.character;
      const analysis = c["analyses"] as Record<string, unknown> | null;
      if (!analysis) return null;
      return {
        characterKey: c["character_key"] as string,
        name: c["name"] as string,
        mediaTitle: (c["media_properties"] as { title: string } | null)?.title ?? "",
        finalScore: (analysis["final_score"] as number) ?? 0,
        grade: (analysis["grade"] as Grade) ?? "F",
        q1Score: (analysis["q1_score"] as number) ?? 0,
        q2Score: (analysis["q2_score"] as number) ?? 0,
        q3Score: (analysis["q3_score"] as number) ?? 0,
        q4Score: (analysis["q4_score"] as number) ?? 0,
        q5Flag: (analysis["q5_flag"] as string) ?? "unknown",
        detectedTropes: ((analysis["tropes"] as { id: string; name: string }[]) ?? []).map(t => ({ id: t.id, name: t.name })),
      };
    } catch {
      return null;
    }
  }, []);

  useEffect(() => {
    const fetchAll = async () => {
      const results = await Promise.all(
        [0, 1, 2].map((i) =>
          characterKeys[i] ? fetchCharacter(characterKeys[i]) : Promise.resolve(null)
        )
      );
      setCharacters(results);
    };
    void fetchAll();
  }, [characterKeys, fetchCharacter]);

  const searchForAdd = useCallback(async (q: string) => {
    if (!q.trim()) { setAddResults([]); return; }
    setAddLoading(true);
    try {
      const res = await fetch(`/api/characters/search?q=${encodeURIComponent(q)}&limit=5`);
      const data = await res.json() as { results: { characterKey: string; name: string; mediaTitle: string }[] };
      setAddResults(data.results ?? []);
    } finally {
      setAddLoading(false);
    }
  }, []);

  const addCharacter = (key: string) => {
    const nextKeys = [...characterKeys];
    const emptySlot = nextKeys.findIndex((k, i) => !k || !characters[i]);
    if (emptySlot === -1) return; // all 3 slots full
    if (nextKeys[emptySlot] !== undefined) {
      nextKeys[emptySlot] = key;
    } else {
      nextKeys.push(key);
    }
    setCharacterKeys(nextKeys);
    setAddQuery("");
    setAddResults([]);
    router.replace(`/compare?keys=${nextKeys.join(",")}`, { scroll: false });
  };

  const removeCharacter = (index: number) => {
    const nextKeys = characterKeys.filter((_, i) => i !== index);
    setCharacterKeys(nextKeys);
    router.replace(nextKeys.length ? `/compare?keys=${nextKeys.join(",")}` : "/compare", { scroll: false });
  };

  // Find shared tropes (appear in ≥2 characters)
  const allTropeIds = characters.flatMap((c) => c?.detectedTropes.map(t => t.id) ?? []);
  const tropeCounts = allTropeIds.reduce((acc, id) => ({ ...acc, [id]: (acc[id] ?? 0) + 1 }), {} as Record<string, number>);
  const sharedTropeIds = new Set(Object.entries(tropeCounts).filter(([, n]) => n >= 2).map(([id]) => id));

  const hasAny = characters.some(Boolean);

  return (
    <main className="min-h-screen px-4 py-10" style={{ backgroundColor: "var(--color-ink-950)" }}>
      <div className="max-w-[1080px] mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl mb-0.5" style={{ fontFamily: "var(--font-display)", color: "var(--color-washi-100)" }}>COMPARE</h1>
          <p style={{ fontFamily: "var(--font-jp)", color: "var(--color-washi-400)" }}>比較</p>
        </div>

        {/* 3-column character grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {[0, 1, 2].map((i) => {
            const c = characters[i];
            return (
              <div key={i} className="rounded-xl border p-4" style={{ backgroundColor: "var(--color-ink-800)", borderColor: "var(--color-ink-600)", borderRadius: "var(--radius-md)" }}>
                {c ? (
                  <div>
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <p className="text-sm font-medium" style={{ color: "var(--color-washi-100)" }}>{c.name}</p>
                        <p className="text-xs" style={{ color: "var(--color-washi-400)" }}>{c.mediaTitle}</p>
                      </div>
                      <button onClick={() => removeCharacter(i)} className="text-xs px-2 py-1 rounded opacity-40 hover:opacity-100" style={{ color: "var(--color-washi-400)" }}>✕</button>
                    </div>
                    <p className="text-3xl mb-2" style={{ fontFamily: "var(--font-display)", color: GRADE_COLORS[c.grade] }}>{c.grade}</p>
                    <p className="text-lg" style={{ fontFamily: "var(--font-mono)", color: "var(--color-washi-100)" }}>{displayScore(c.finalScore)}</p>
                    <Link href={`/character/${c.characterKey}`} className="text-xs mt-2 block" style={{ color: "var(--color-vermillion-400)" }}>View analysis →</Link>
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <p className="text-xs" style={{ color: "var(--color-washi-400)" }}>Slot {i + 1}</p>
                    <p className="text-xs mt-1" style={{ color: "var(--color-washi-400)", opacity: 0.5 }}>Search below to add</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Rule comparison bars (aligned horizontally) */}
        {hasAny && (
          <div className="mb-8 rounded-xl border p-5" style={{ backgroundColor: "var(--color-ink-800)", borderColor: "var(--color-ink-600)", borderRadius: "var(--radius-md)" }}>
            <h2 className="text-xs uppercase tracking-widest mb-4" style={{ color: "var(--color-washi-400)", fontFamily: "var(--font-mono)" }}>Rule breakdown</h2>
            <div className="space-y-5">
              {RULES.map(({ key, label }) => (
                <div key={key}>
                  <p className="text-xs mb-2" style={{ color: "var(--color-washi-400)", fontFamily: "var(--font-body)" }}>{label}</p>
                  <div className="grid grid-cols-3 gap-3">
                    {[0, 1, 2].map((i) => {
                      const c = characters[i];
                      const score = c ? (c[`${key}Score` as keyof CharacterData] as number) : 0;
                      const pct = c ? (score / 2) * 100 : 0;
                      return (
                        <div key={i}>
                          <div className="score-bar-track">
                            <div className="score-bar-fill" style={{ width: `${pct}%` }} />
                          </div>
                          <p className="text-[10px] mt-1" style={{ color: c ? "var(--color-washi-300)" : "var(--color-ink-600)", fontFamily: "var(--font-mono)" }}>
                            {c ? displayQScore(score as number) : "—"}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Shared tropes */}
        {sharedTropeIds.size > 0 && (
          <div className="mb-8 rounded-xl border p-5" style={{ backgroundColor: "var(--color-ink-800)", borderColor: "rgba(155,89,182,0.4)", borderRadius: "var(--radius-md)" }}>
            <h2 className="text-xs uppercase tracking-widest mb-3" style={{ color: "#C39BD3", fontFamily: "var(--font-mono)" }}>Shared tropes</h2>
            <div className="flex flex-wrap gap-2">
              {Array.from(sharedTropeIds).map((id) => {
                const name = characters.flatMap(c => c?.detectedTropes ?? []).find(t => t.id === id)?.name ?? id;
                return (
                  <span key={id} className="px-2.5 py-1 rounded-full text-xs" style={{ backgroundColor: "rgba(155,89,182,0.15)", border: "1px solid rgba(155,89,182,0.4)", color: "#C39BD3", fontFamily: "var(--font-body)", borderRadius: "9999px" }}>
                    {name}
                  </span>
                );
              })}
            </div>
          </div>
        )}

        {/* Add character search */}
        {characterKeys.length < 3 && (
          <div>
            <h2 className="text-xs uppercase tracking-widest mb-3" style={{ color: "var(--color-washi-400)", fontFamily: "var(--font-mono)" }}>Add a character</h2>
            <div className="relative">
              <input
                type="search"
                value={addQuery}
                onChange={(e) => { setAddQuery(e.target.value); void searchForAdd(e.target.value); }}
                placeholder="Search by name or media title…"
                className="w-full px-4 py-2.5 text-sm rounded-xl border outline-none"
                style={{ backgroundColor: "var(--color-ink-800)", borderColor: "var(--color-ink-600)", color: "var(--color-washi-100)", fontFamily: "var(--font-body)", borderRadius: "var(--radius-md)" }}
                onFocus={(e) => (e.target.style.borderColor = "var(--color-vermillion-500)")}
                onBlur={(e) => (e.target.style.borderColor = "var(--color-ink-600)")}
              />
              {addLoading && <div className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: "var(--color-vermillion-500) transparent var(--color-vermillion-500) var(--color-vermillion-500)" }} />}
            </div>
            {addResults.length > 0 && (
              <div className="mt-2 rounded-xl border overflow-hidden" style={{ backgroundColor: "var(--color-ink-700)", borderColor: "var(--color-ink-600)", borderRadius: "var(--radius-md)" }}>
                {addResults.map((r) => (
                  <button key={r.characterKey} onClick={() => addCharacter(r.characterKey)} className="w-full flex items-center justify-between px-4 py-3 hover:bg-ink-600 text-left border-b last:border-b-0" style={{ borderColor: "var(--color-ink-600)" }}>
                    <div>
                      <p className="text-sm" style={{ color: "var(--color-washi-100)" }}>{r.name}</p>
                      <p className="text-xs" style={{ color: "var(--color-washi-400)" }}>{r.mediaTitle}</p>
                    </div>
                    <span className="text-xs" style={{ color: "var(--color-vermillion-400)" }}>Add +</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
