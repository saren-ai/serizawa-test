"use client";

import { useState, useCallback } from "react";

type BulkItemStatus = "pending" | "processing" | "done" | "error";

interface BulkItem {
  characterName: string;
  mediaTitle: string;
  releaseYear?: number;
  mediaType?: string;
  status: BulkItemStatus;
  error?: string;
  finalScore?: number;
  grade?: string;
}

export default function BulkImportPage() {
  const [csvText, setCsvText] = useState("");
  const [items, setItems] = useState<BulkItem[]>([]);
  const [running, setRunning] = useState(false);
  const [jobId, setJobId] = useState<string | null>(null);

  const parseCSV = (text: string): BulkItem[] => {
    const lines = text.trim().split("\n").filter(Boolean);
    if (!lines.length) return [];
    // Skip header if it looks like one
    const start = lines[0].toLowerCase().includes("character") || lines[0].toLowerCase().includes("name") ? 1 : 0;
    return lines.slice(start).map((line) => {
      const [characterName = "", mediaTitle = "", releaseYearStr = "", mediaType = ""] = line.split(",").map((c) => c.trim().replace(/^"|"$/g, ""));
      const releaseYear = releaseYearStr ? parseInt(releaseYearStr) : undefined;
      return { characterName, mediaTitle, releaseYear: releaseYear && !isNaN(releaseYear) ? releaseYear : undefined, mediaType: mediaType || undefined, status: "pending" };
    }).filter((i) => i.characterName && i.mediaTitle);
  };

  const handleFileDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      setCsvText(text);
      setItems(parseCSV(text));
    };
    reader.readAsText(file);
  }, []);

  const handleCSVChange = (text: string) => {
    setCsvText(text);
    setItems(parseCSV(text));
  };

  const runBulk = async () => {
    if (!items.length || running) return;
    setRunning(true);

    // Create job via API
    const res = await fetch("/api/admin/bulk", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items: items.map((i) => ({ characterName: i.characterName, mediaTitle: i.mediaTitle, releaseYear: i.releaseYear, mediaType: i.mediaType })) }),
    });

    if (!res.ok) {
      setRunning(false);
      return;
    }

    const { jobId: id } = await res.json() as { jobId: string };
    setJobId(id);

    // Poll for status
    const poll = async () => {
      const statusRes = await fetch(`/api/admin/bulk/${id}`);
      if (!statusRes.ok) return;
      const data = await statusRes.json() as { items: Array<{ characterName: string; status: BulkItemStatus; finalScore?: number; grade?: string; error?: string }> };
      setItems((prev) =>
        prev.map((item) => {
          const updated = data.items.find((d) => d.characterName === item.characterName && item.status !== "done");
          return updated ? { ...item, ...updated } : item;
        })
      );
      const allDone = data.items.every((d) => d.status === "done" || d.status === "error");
      if (!allDone) setTimeout(() => void poll(), 2000);
      else setRunning(false);
    };
    void poll();
  };

  const pendingCount = items.filter((i) => i.status === "pending").length;
  const doneCount = items.filter((i) => i.status === "done").length;
  const errorCount = items.filter((i) => i.status === "error").length;
  const processingCount = items.filter((i) => i.status === "processing").length;

  return (
    <main className="min-h-screen px-4 py-10" style={{ backgroundColor: "var(--color-ink-950)" }}>
      <div className="max-w-[800px] mx-auto">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-1">
            <a href="/admin" className="text-xs" style={{ color: "var(--color-vermillion-400)" }}>← Admin</a>
          </div>
          <h1 className="text-4xl mb-0.5" style={{ fontFamily: "var(--font-display)", color: "var(--color-washi-100)" }}>BULK IMPORT</h1>
          <p style={{ fontFamily: "var(--font-jp)", color: "var(--color-washi-400)" }}>一括インポート</p>
        </div>

        {/* CSV Drop Zone */}
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleFileDrop}
          className="rounded-xl border-2 border-dashed p-8 text-center mb-6 cursor-pointer"
          style={{ borderColor: "var(--color-ink-600)", borderRadius: "var(--radius-md)" }}
        >
          <p className="text-sm mb-2" style={{ color: "var(--color-washi-300)" }}>Drop a CSV file here, or paste below</p>
          <p className="text-xs" style={{ color: "var(--color-washi-400)" }}>Format: character_name, media_title, release_year, media_type</p>
        </div>

        <textarea
          value={csvText}
          onChange={(e) => handleCSVChange(e.target.value)}
          rows={8}
          placeholder={`Mr. Miyagi, The Karate Kid, 1984, film\nKatana, Arrow, 2013, tv_series`}
          className="w-full px-4 py-3 text-xs rounded-xl border outline-none mb-6 resize-none"
          style={{ backgroundColor: "var(--color-ink-800)", borderColor: "var(--color-ink-600)", color: "var(--color-washi-100)", fontFamily: "var(--font-mono)", borderRadius: "var(--radius-md)" }}
          onFocus={(e) => (e.target.style.borderColor = "var(--color-vermillion-500)")}
          onBlur={(e) => (e.target.style.borderColor = "var(--color-ink-600)")}
        />

        {/* Stats + run button */}
        {items.length > 0 && (
          <div className="flex items-center gap-4 mb-6">
            <div className="flex gap-4 text-xs" style={{ fontFamily: "var(--font-mono)" }}>
              <span style={{ color: "var(--color-washi-400)" }}>{items.length} total</span>
              {processingCount > 0 && <span style={{ color: "var(--color-gold-400)" }}>{processingCount} running</span>}
              {doneCount > 0 && <span style={{ color: "#6FCF97" }}>{doneCount} done</span>}
              {errorCount > 0 && <span style={{ color: "var(--color-vermillion-500)" }}>{errorCount} errors</span>}
            </div>
            <button
              onClick={() => void runBulk()}
              disabled={running || pendingCount === 0}
              className="ml-auto px-6 py-2 text-sm rounded-full"
              style={{
                backgroundColor: running ? "var(--color-ink-700)" : "var(--color-vermillion-500)",
                color: "var(--color-washi-100)",
                borderRadius: "9999px",
                opacity: running ? 0.6 : 1,
              }}
            >
              {running ? "Running…" : `Run ${pendingCount} analyses`}
            </button>
          </div>
        )}

        {jobId && (
          <p className="text-xs mb-4" style={{ color: "var(--color-washi-400)", fontFamily: "var(--font-mono)" }}>Job: {jobId}</p>
        )}

        {/* Item list */}
        {items.length > 0 && (
          <div className="space-y-2">
            {items.map((item, i) => (
              <div key={i} className="flex items-center gap-4 px-4 py-3 rounded-xl border" style={{ backgroundColor: "var(--color-ink-800)", borderColor: item.status === "error" ? "rgba(230,55,30,0.3)" : item.status === "done" ? "rgba(111,207,151,0.2)" : "var(--color-ink-600)", borderRadius: "var(--radius-md)" }}>
                <StatusDot status={item.status} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm truncate" style={{ color: "var(--color-washi-100)" }}>{item.characterName}</p>
                  <p className="text-xs" style={{ color: "var(--color-washi-400)" }}>{item.mediaTitle}{item.releaseYear ? ` (${item.releaseYear})` : ""}</p>
                  {item.error && <p className="text-xs mt-0.5" style={{ color: "var(--color-vermillion-500)" }}>{item.error}</p>}
                </div>
                {item.grade && (
                  <div className="text-right">
                    <p className="text-lg" style={{ fontFamily: "var(--font-display)", color: "var(--color-washi-100)" }}>{item.grade}</p>
                    {item.finalScore !== undefined && <p className="text-xs" style={{ color: "var(--color-washi-400)", fontFamily: "var(--font-mono)" }}>{item.finalScore.toFixed(2)}</p>}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

function StatusDot({ status }: { status: BulkItemStatus }) {
  const colors: Record<BulkItemStatus, string> = {
    pending: "var(--color-washi-400)",
    processing: "var(--color-gold-400)",
    done: "#6FCF97",
    error: "var(--color-vermillion-500)",
  };
  return (
    <div
      className="w-2 h-2 rounded-full shrink-0"
      style={{ backgroundColor: colors[status], animation: status === "processing" ? "pulse 1s ease-in-out infinite" : "none" }}
    />
  );
}
