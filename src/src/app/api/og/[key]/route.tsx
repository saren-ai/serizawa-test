import { ImageResponse } from "@vercel/og";
import { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { computeGrade } from "@/lib/scoring";

export const runtime = "edge";

const GRADE_COLORS: Record<string, string> = {
  "A+": "#F5BC3A",
  "A":  "#6FCF97",
  "B":  "#A8E6BE",
  "C":  "#F5C842",
  "D":  "#F0A86B",
  "F":  "#F5856E",
};

type AnalysisRow = {
  final_score: number;
  grade: string;
  q1_score: number;
  q2_score: number;
  q3_score: number;
  q4_score: number;
  q5_flag: string;
  tropes: { id: string; name: string }[] | null;
};

type CharRow = {
  name: string;
  media_properties: { title: string; release_year: number | null } | null;
  analyses: AnalysisRow | null;
};

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ key: string }> }
) {
  const { key } = await params;
  const characterKey = decodeURIComponent(key.replace(/\.png$/, ""));

  const supabase = createAdminClient();
  const db = supabase as unknown as {
    from: (t: string) => {
      select: (q: string) => {
        eq: (col: string, val: string) => {
          single: () => Promise<{ data: unknown; error: unknown }>;
        };
      };
    };
  };

  const { data } = await db
    .from("characters")
    .select("name, media_properties(title, release_year), analyses(final_score, grade, q1_score, q2_score, q3_score, q4_score, q5_flag, tropes)")
    .eq("character_key", characterKey)
    .single();

  const char = data as CharRow | null;
  const analysis = char?.analyses;
  const media = char?.media_properties;

  const name = char?.name ?? characterKey;
  const mediaTitle = media?.title ?? "";
  const finalScore = analysis?.final_score ?? 0;
  const grade = analysis?.grade ?? computeGrade(finalScore);
  const gradeColor = GRADE_COLORS[grade] ?? "#999";
  const q5 = analysis?.q5_flag ?? "unknown";
  const tropes = analysis?.tropes?.slice(0, 3) ?? [];

  const rules = [
    { label: "Q1", score: analysis?.q1_score ?? 0 },
    { label: "Q2", score: analysis?.q2_score ?? 0 },
    { label: "Q3", score: analysis?.q3_score ?? 0 },
    { label: "Q4", score: analysis?.q4_score ?? 0 },
  ];

  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          width: "1200px",
          height: "630px",
          backgroundColor: "#0D0F13",
          fontFamily: "sans-serif",
          padding: "48px",
          gap: "48px",
          alignItems: "center",
        }}
      >
        {/* Left: Baseball card visual */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            width: "320px",
            height: "480px",
            backgroundColor: "#1A1D25",
            borderRadius: "24px",
            border: `3px solid ${gradeColor}`,
            padding: "24px",
            flexShrink: 0,
          }}
        >
          {/* Grade badge */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "80px",
              height: "80px",
              borderRadius: "50%",
              backgroundColor: gradeColor + "22",
              border: `3px solid ${gradeColor}`,
              marginBottom: "20px",
            }}
          >
            <span style={{ fontSize: "36px", fontWeight: 900, color: gradeColor }}>{grade}</span>
          </div>

          <span style={{ fontSize: "22px", fontWeight: 700, color: "#F0EDE8", textAlign: "center", marginBottom: "8px" }}>{name}</span>
          <span style={{ fontSize: "14px", color: "#8A8580", textAlign: "center", marginBottom: "24px" }}>{mediaTitle}</span>

          {/* Score */}
          <span style={{ fontSize: "48px", fontWeight: 900, color: "#F0EDE8", letterSpacing: "-1px" }}>
            {finalScore.toFixed(2)}
          </span>
          <span style={{ fontSize: "11px", color: "#8A8580", marginTop: "4px" }}>/ 10.00</span>

          {/* Q5 flag */}
          {q5 === "yellowface" && (
            <div style={{ display: "flex", marginTop: "16px", backgroundColor: "rgba(230,55,30,0.15)", borderRadius: "9999px", padding: "4px 12px" }}>
              <span style={{ fontSize: "11px", color: "#E6371E" }}>⚠ YELLOWFACE</span>
            </div>
          )}
        </div>

        {/* Right: Score breakdown */}
        <div style={{ display: "flex", flexDirection: "column", flex: 1, gap: "20px" }}>
          {/* Header */}
          <div style={{ display: "flex", flexDirection: "column", gap: "4px", marginBottom: "8px" }}>
            <span style={{ fontSize: "13px", color: "#8A8580", letterSpacing: "0.15em", textTransform: "uppercase" }}>
              SERIZAWA TEST
            </span>
            <span style={{ fontSize: "32px", fontWeight: 900, color: "#F0EDE8" }}>ANALYSIS RESULTS</span>
            <span style={{ fontSize: "14px", color: "#8A8580" }}>セリザワテスト</span>
          </div>

          {/* Rule bars */}
          {rules.map(({ label, score }) => {
            const pct = Math.round((score / 2) * 100);
            return (
              <div key={label} style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ fontSize: "13px", color: "#C0BDB8", fontWeight: 600 }}>{label}</span>
                  <span style={{ fontSize: "13px", color: "#F0EDE8", fontFamily: "monospace" }}>{score.toFixed(2)}</span>
                </div>
                <div style={{ display: "flex", width: "100%", height: "8px", backgroundColor: "#1A1D25", borderRadius: "4px" }}>
                  <div style={{ width: `${pct}%`, height: "8px", backgroundColor: gradeColor, borderRadius: "4px" }} />
                </div>
              </div>
            );
          })}

          {/* Trope pills */}
          {tropes.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginTop: "8px" }}>
              {tropes.map((t) => (
                <div key={t.id} style={{ display: "flex", backgroundColor: "#1A1D25", borderRadius: "9999px", padding: "4px 12px", border: "1px solid #2A2D35" }}>
                  <span style={{ fontSize: "11px", color: "#C0BDB8" }}>{t.name}</span>
                </div>
              ))}
            </div>
          )}

          {/* Watermark */}
          <div style={{ display: "flex", marginTop: "auto", gap: "4px", alignItems: "center" }}>
            <span style={{ fontSize: "12px", color: "#4A4D55" }}>serizawatest.com</span>
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      headers: {
        "Cache-Control": "public, max-age=86400, s-maxage=86400",
      },
    }
  );
}
