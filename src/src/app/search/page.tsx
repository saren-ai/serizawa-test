"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import type { Grade } from "@/lib/supabase/types";

interface SearchResult {
  characterKey: string;
  name: string;
  mediaTitle: string;
  mediaType: string | null;
  releaseYear: number | null;
  finalScore: number | null;
  grade: Grade | null;
  q5Flag: string | null;
  imageUrl: string | null;
}

const GRADE_COLORS: Record<string, string> = {
  "A+": "#F5BC3A", "A": "#6FCF97", "B": "#A8E6BE",
  "C": "#F5C842", "D": "#F0A86B", "F": "#F5856E",
};

const MEDIA_FILTERS = [
  { key: "all",       label: "All" },
  { key: "film",      label: "Film" },
  { key: "tv_series", label: "TV" },
  { key: "animation", label: "Animation" },
  { key: "comics",    label: "Comics" },
  { key: "game",      label: "Games" },
];

export default function SearchPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialQ = searchParams.get("q") ?? "";

  const [query, setQuery] = useState(initialQ);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [mediaFilter, setMediaFilter] = useState("all");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const doSearch = useCallback(async (q: string) => {
    if (!q.trim()) {
      setResults([]);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/characters/search?q=${encodeURIComponent(q)}&limit=20`);
      const data = await res.json() as { results: SearchResult[] };
      setResults(data.results ?? []);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      void doSearch(query);
      // Update URL
      const url = query ? `/search?q=${encodeURIComponent(query)}` : "/search";
      router.replace(url, { scroll: false });
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, doSearch, router]);

  // Initial search if q param present
  useEffect(() => {
    if (initialQ) void doSearch(initialQ);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = results.filter(
    (r) => mediaFilter === "all" || r.mediaType === mediaFilter
  );

  return (
    <main className="min-h-screen px-4 py-10" style={{ backgroundColor: "var(--color-ink-950)" }}>
      <div className="max-w-[960px] mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-4xl mb-0.5" style={{ fontFamily: "var(--font-display)", color: "var(--color-washi-100)" }}>
            SEARCH
          </h1>
          <p style={{ fontFamily: "var(--font-jp)", color: "var(--color-washi-400)" }}>検索</p>
        </div>

        {/* Search input */}
        <div className="relative mb-4">
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by character name or media title…"
            autoFocus
            className="w-full px-4 py-3 text-base rounded-xl border outline-none"
            style={{
              backgroundColor: "var(--color-ink-800)",
              borderColor: "var(--color-ink-600)",
              color: "var(--color-washi-100)",
              fontFamily: "var(--font-body)",
              borderRadius: "var(--radius-md)",
            }}
            onFocus={(e) => (e.target.style.borderColor = "var(--color-vermillion-500)")}
            onBlur={(e) => (e.target.style.borderColor = "var(--color-ink-600)")}
          />
          {loading && (
            <div
              className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"
              style={{ color: "var(--color-vermillion-500)" }}
            />
          )}
        </div>

        {/* Media type filter pills */}
        <div className="flex flex-wrap gap-2 mb-6">
          {MEDIA_FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setMediaFilter(f.key)}
              className="px-3 py-1 rounded-full text-xs border transition-all"
              style={{
                backgroundColor: mediaFilter === f.key ? "var(--color-ink-600)" : "transparent",
                borderColor: "var(--color-ink-600)",
                color: mediaFilter === f.key ? "var(--color-washi-100)" : "var(--color-washi-400)",
                borderRadius: "9999px",
              }}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Results */}
        {filtered.length === 0 && query.trim() && !loading ? (
          <div className="text-center py-16">
            <p className="text-xl mb-2" style={{ fontFamily: "var(--font-display)", color: "var(--color-washi-400)" }}>
              NO RESULTS
            </p>
            <p className="text-sm mb-4" style={{ color: "var(--color-washi-400)" }}>
              &ldquo;{query}&rdquo; hasn&apos;t been analyzed yet.
            </p>
            <a
              href={`/?name=${encodeURIComponent(query)}`}
              className="inline-block px-5 py-2.5 rounded-full text-sm font-medium"
              style={{
                backgroundColor: "var(--color-vermillion-500)",
                color: "var(--color-washi-100)",
                borderRadius: "9999px",
              }}
            >
              Run the Serizawa Test on &ldquo;{query}&rdquo; →
            </a>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((r) => {
              const gradeColor = r.grade ? (GRADE_COLORS[r.grade] ?? "#B8A99A") : "#B8A99A";
              return (
                <Link
                  key={r.characterKey}
                  href={`/character/${r.characterKey}`}
                  className="flex items-center gap-4 px-4 py-3 rounded-xl border transition-all hover:scale-[1.01]"
                  style={{
                    backgroundColor: "var(--color-ink-800)",
                    borderColor: "var(--color-ink-600)",
                    borderRadius: "var(--radius-md)",
                    textDecoration: "none",
                  }}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium" style={{ color: "var(--color-washi-100)" }}>{r.name}</p>
                    <p className="text-xs" style={{ color: "var(--color-washi-400)" }}>
                      {r.mediaTitle}{r.releaseYear ? ` (${r.releaseYear})` : ""}
                      {r.mediaType ? ` · ${r.mediaType.replace("_", " ")}` : ""}
                    </p>
                  </div>
                  {r.finalScore !== null && r.grade && (
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-sm" style={{ color: gradeColor, fontFamily: "var(--font-mono)" }}>
                        {r.finalScore.toFixed(2)}
                      </span>
                      <span className="text-base" style={{ color: gradeColor, fontFamily: "var(--font-display)" }}>
                        {r.grade}
                      </span>
                    </div>
                  )}
                </Link>
              );
            })}
          </div>
        )}

        {/* Empty state when no query */}
        {!query.trim() && (
          <div className="text-center py-16">
            <p className="text-sm" style={{ color: "var(--color-washi-400)" }}>
              Type a character name or media title to search
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
