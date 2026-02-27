import Link from "next/link";
import type { Grade, Q5Flag } from "@/lib/supabase/types";

interface CharacterCardProps {
  characterKey: string;
  name: string;
  mediaTitle: string;
  releaseYear?: number | null;
  finalScore: number;
  grade: Grade;
  q5Flag?: Q5Flag | null;
  imageUrl?: string | null;
  /** Variant: 'shame' shows pulsing red border, 'fame' shows gold border */
  variant?: "default" | "shame" | "fame";
}

const GRADE_TEXT: Record<Grade, string> = {
  "A+": "#F5BC3A",
  "A":  "#6FCF97",
  "B":  "#A8E6BE",
  "C":  "#F5C842",
  "D":  "#F0A86B",
  "F":  "#F5856E",
};

export function CharacterCard({
  characterKey,
  name,
  mediaTitle,
  releaseYear,
  finalScore,
  grade,
  q5Flag,
  imageUrl,
  variant = "default",
}: CharacterCardProps) {
  const borderColor =
    variant === "shame"
      ? "rgba(231,76,60,0.5)"
      : variant === "fame"
      ? "rgba(240,165,0,0.5)"
      : "var(--color-ink-600)";

  const gradeColor = GRADE_TEXT[grade] ?? "#B8A99A";

  return (
    <Link
      href={`/character/${characterKey}`}
      className="block rounded-xl border transition-all hover:scale-[1.02] hover:shadow-lg"
      style={{
        backgroundColor: "var(--color-ink-800)",
        borderColor,
        borderRadius: "var(--radius-lg)",
        textDecoration: "none",
        ...(variant === "shame" ? {
          animation: "shame-pulse 3s ease-in-out infinite",
        } : {}),
      }}
    >
      {/* Image */}
      <div
        className="w-full aspect-[3/4] overflow-hidden"
        style={{
          borderRadius: "var(--radius-lg) var(--radius-lg) 0 0",
          backgroundColor: "var(--color-ink-700)",
        }}
      >
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageUrl}
            alt={name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center"
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "48px",
              color: "var(--color-washi-400)",
              opacity: 0.3,
            }}
          >
            {name[0]?.toUpperCase()}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-3">
        <div className="flex items-start justify-between gap-2 mb-1">
          <p
            className="text-sm font-medium leading-tight line-clamp-1"
            style={{ color: "var(--color-washi-100)", fontFamily: "var(--font-body)" }}
          >
            {name}
          </p>
          <span
            className="text-sm font-bold flex-shrink-0"
            style={{ color: gradeColor, fontFamily: "var(--font-display)", fontSize: "16px" }}
          >
            {grade}
          </span>
        </div>
        <p
          className="text-xs line-clamp-1"
          style={{ color: "var(--color-washi-400)", fontFamily: "var(--font-body)" }}
        >
          {mediaTitle}{releaseYear ? ` (${releaseYear})` : ""}
        </p>
        <p
          className="text-xs mt-1"
          style={{ color: gradeColor, fontFamily: "var(--font-mono)" }}
        >
          {finalScore.toFixed(2)}
        </p>
      </div>
    </Link>
  );
}
