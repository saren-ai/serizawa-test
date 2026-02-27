"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import type { Grade, Q5Flag, DetectedTrope } from "@/lib/supabase/types";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface BaseballCardProps {
  characterName: string;
  mediaTitle: string;
  finalScore: number;
  grade: Grade;
  gradeLabel: string;
  q5Flag: Q5Flag;
  q5ActorName?: string | null;
  detectedTropes: DetectedTrope[];
  summary: string;
  imageUrl?: string | null;
  /** Whether to show the flip button (true on results page, false in comparison grid) */
  flippable?: boolean;
  /** Start face-down (showing score side) */
  defaultFlipped?: boolean;
}

// ---------------------------------------------------------------------------
// Grade styling
// ---------------------------------------------------------------------------

const GRADE_COLORS: Record<Grade, { bg: string; text: string; border: string }> = {
  "A+": { bg: "rgba(240,165,0,0.15)", text: "#F5BC3A", border: "rgba(240,165,0,0.5)" },
  "A":  { bg: "rgba(39,174,96,0.15)",  text: "#6FCF97", border: "rgba(39,174,96,0.5)" },
  "B":  { bg: "rgba(46,204,113,0.10)", text: "#A8E6BE", border: "rgba(46,204,113,0.4)" },
  "C":  { bg: "rgba(243,156,18,0.10)", text: "#F5C842", border: "rgba(243,156,18,0.4)" },
  "D":  { bg: "rgba(230,126,34,0.10)", text: "#F0A86B", border: "rgba(230,126,34,0.4)" },
  "F":  { bg: "rgba(231,76,60,0.20)",  text: "#F5856E", border: "rgba(231,76,60,0.6)" },
};

const Q5_COLORS: Record<Q5Flag, { text: string; border: string; bg: string }> = {
  authentic:      { text: "#6FCF97", border: "rgba(39,174,96,0.4)",  bg: "rgba(39,174,96,0.15)" },
  approximate:    { text: "#F5C842", border: "rgba(243,156,18,0.4)", bg: "rgba(243,156,18,0.1)" },
  yellowface:     { text: "#F5856E", border: "rgba(231,76,60,0.6)",  bg: "rgba(231,76,60,0.2)" },
  not_applicable: { text: "#B8A99A", border: "rgba(184,169,154,0.3)", bg: "transparent" },
  unknown:        { text: "#B8A99A", border: "rgba(184,169,154,0.3)", bg: "transparent" },
};

const Q5_LABELS: Record<Q5Flag, string> = {
  authentic: "Authentic casting",
  approximate: "Approximate casting",
  yellowface: "⚠ Yellowface",
  not_applicable: "N/A — non-live-action",
  unknown: "Casting unknown",
};

const REGISTER_COLORS: Record<string, { text: string; border: string; bg: string }> = {
  trigger:   { text: "#F5856E", border: "rgba(231,76,60,0.4)",   bg: "rgba(231,76,60,0.12)" },
  teachable: { text: "#7EC8E3", border: "rgba(52,152,219,0.4)",  bg: "rgba(52,152,219,0.10)" },
  mockery:   { text: "#F5C842", border: "rgba(243,156,18,0.4)",  bg: "rgba(243,156,18,0.10)" },
  dual:      { text: "#C39BD3", border: "rgba(155,89,182,0.4)",  bg: "rgba(155,89,182,0.10)" },
};

// ---------------------------------------------------------------------------
// Score count-up hook
// ---------------------------------------------------------------------------

function useCountUp(target: number, duration = 800): string {
  const [current, setCurrent] = useState(0);
  const preferReducedMotion = useReducedMotion();

  useEffect(() => {
    if (preferReducedMotion) {
      setCurrent(target);
      return;
    }
    const start = performance.now();
    const tick = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // Ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setCurrent(eased * target);
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [target, duration, preferReducedMotion]);

  return current.toFixed(2);
}

// ---------------------------------------------------------------------------
// Card face — Front (character portrait + name)
// ---------------------------------------------------------------------------

function CardFront({
  characterName,
  mediaTitle,
  imageUrl,
  grade,
}: {
  characterName: string;
  mediaTitle: string;
  imageUrl?: string | null;
  grade: Grade;
}) {
  const gradeStyle = GRADE_COLORS[grade];

  return (
    <div
      className="absolute inset-0 flex flex-col"
      style={{
        backgroundColor: "var(--color-ink-800)",
        borderRadius: "var(--radius-xl)",
        padding: "20px",
        backfaceVisibility: "hidden",
      }}
    >
      {/* Header — grade badge + title */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <p
            className="text-[10px] uppercase tracking-widest mb-0.5"
            style={{ color: "var(--color-washi-400)", fontFamily: "var(--font-mono)" }}
          >
            Serizawa Test
          </p>
          <p
            className="text-[10px]"
            style={{ color: "var(--color-washi-400)", fontFamily: "var(--font-jp)" }}
          >
            芹沢テスト
          </p>
        </div>
        <div
          className="px-2.5 py-1 rounded-full text-xs font-bold"
          style={{
            backgroundColor: gradeStyle.bg,
            color: gradeStyle.text,
            border: `1px solid ${gradeStyle.border}`,
            fontFamily: "var(--font-display)",
            fontSize: "20px",
            lineHeight: 1,
            padding: "4px 12px",
          }}
        >
          {grade}
        </div>
      </div>

      {/* Portrait area */}
      <div
        className="flex-1 flex items-center justify-center rounded-lg mb-4"
        style={{
          backgroundColor: "var(--color-ink-700)",
          borderRadius: "var(--radius-lg)",
          minHeight: 240,
          overflow: "hidden",
        }}
      >
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageUrl}
            alt={`${characterName} portrait`}
            className="w-full h-full object-cover"
            style={{ borderRadius: "var(--radius-lg)" }}
          />
        ) : (
          <div className="text-center px-4">
            <div
              className="text-5xl mb-2 opacity-20"
              style={{ fontFamily: "var(--font-display)" }}
            >
              {characterName[0]?.toUpperCase()}
            </div>
            <p
              className="text-xs opacity-30"
              style={{ color: "var(--color-washi-400)", fontFamily: "var(--font-jp)" }}
            >
              肖像
            </p>
          </div>
        )}
      </div>

      {/* Character name */}
      <div>
        <h2
          className="text-2xl leading-tight"
          style={{
            fontFamily: "var(--font-display)",
            color: "var(--color-washi-100)",
            letterSpacing: "0.02em",
          }}
        >
          {characterName.toUpperCase()}
        </h2>
        <p
          className="text-xs mt-0.5"
          style={{ color: "var(--color-washi-400)", fontFamily: "var(--font-body)" }}
        >
          {mediaTitle}
        </p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Card face — Back (score + tropes + Q5)
// ---------------------------------------------------------------------------

function CardBack({
  finalScore,
  grade,
  gradeLabel,
  q5Flag,
  q5ActorName,
  detectedTropes,
  summary,
}: {
  finalScore: number;
  grade: Grade;
  gradeLabel: string;
  q5Flag: Q5Flag;
  q5ActorName?: string | null;
  detectedTropes: DetectedTrope[];
  summary: string;
}) {
  const displayScore = useCountUp(finalScore, 900);
  const gradeStyle = GRADE_COLORS[grade];
  const q5Style = Q5_COLORS[q5Flag];

  return (
    <div
      className="absolute inset-0 flex flex-col overflow-hidden"
      style={{
        backgroundColor: "var(--color-ink-800)",
        borderRadius: "var(--radius-xl)",
        padding: "20px",
        backfaceVisibility: "hidden",
        transform: "rotateY(180deg)",
      }}
    >
      {/* Score display */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <span
            className="text-[42px] leading-none"
            style={{
              fontFamily: "var(--font-mono)",
              color: "var(--color-washi-100)",
            }}
          >
            {displayScore}
          </span>
          <span
            className="text-sm ml-2"
            style={{ color: "var(--color-washi-400)", fontFamily: "var(--font-mono)" }}
          >
            / 10
          </span>
        </div>
        <div
          className="text-right"
          style={{ fontFamily: "var(--font-display)" }}
        >
          <div
            className="text-4xl"
            style={{ color: gradeStyle.text }}
          >
            {grade}
          </div>
          <div
            className="text-[10px] mt-0.5"
            style={{ color: "var(--color-washi-400)", fontFamily: "var(--font-body)" }}
          >
            {gradeLabel}
          </div>
        </div>
      </div>

      {/* Q5 flag */}
      <div className="mb-3">
        <span
          className="inline-flex items-center px-2.5 py-1 rounded-full text-xs"
          style={{
            backgroundColor: q5Style.bg,
            color: q5Style.text,
            border: `1px solid ${q5Style.border}`,
            fontFamily: "var(--font-body)",
            borderRadius: "9999px",
          }}
        >
          {Q5_LABELS[q5Flag]}
          {q5ActorName && ` — ${q5ActorName}`}
        </span>
      </div>

      {/* Summary */}
      <p
        className="text-xs leading-relaxed mb-3 flex-shrink-0"
        style={{
          color: "var(--color-washi-300)",
          fontFamily: "var(--font-body)",
          display: "-webkit-box",
          WebkitLineClamp: 3,
          WebkitBoxOrient: "vertical",
          overflow: "hidden",
        }}
      >
        {summary}
      </p>

      {/* Trope pills — scrollable */}
      {detectedTropes.length > 0 && (
        <div className="flex-1 overflow-y-auto min-h-0">
          <p
            className="text-[10px] uppercase tracking-widest mb-2"
            style={{ color: "var(--color-washi-400)", fontFamily: "var(--font-mono)" }}
          >
            Detected tropes ({detectedTropes.length})
          </p>
          <div className="flex flex-wrap gap-1.5">
            {detectedTropes.map((trope) => {
              const registerKey = trope.register.includes("→")
                ? "dual"
                : trope.register.toLowerCase();
              const style =
                REGISTER_COLORS[registerKey] ?? REGISTER_COLORS.teachable;
              return (
                <span
                  key={trope.id}
                  className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px]"
                  style={{
                    backgroundColor: style.bg,
                    color: style.text,
                    border: `1px solid ${style.border}`,
                    fontFamily: "var(--font-body)",
                    borderRadius: "9999px",
                  }}
                  title={trope.evidence}
                >
                  {trope.register.split("→")[0]?.trim()} {trope.name}
                  {trope.subverted && (
                    <span className="ml-1 opacity-60">↩</span>
                  )}
                </span>
              );
            })}
          </div>
        </div>
      )}

      {/* Flip hint */}
      <p
        className="text-[10px] text-center mt-2"
        style={{ color: "var(--color-washi-400)", opacity: 0.5, fontFamily: "var(--font-mono)" }}
      >
        tap to flip
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function BaseballCard(props: BaseballCardProps) {
  const {
    characterName,
    mediaTitle,
    finalScore,
    grade,
    gradeLabel,
    q5Flag,
    q5ActorName,
    detectedTropes,
    summary,
    imageUrl,
    flippable = true,
    defaultFlipped = false,
  } = props;

  const [flipped, setFlipped] = useState(defaultFlipped);
  const preferReducedMotion = useReducedMotion();
  const buttonRef = useRef<HTMLButtonElement>(null);

  const handleFlip = () => {
    if (!flippable) return;
    setFlipped((f) => !f);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleFlip();
    }
  };

  return (
    <div
      style={{ width: 340, height: 520, perspective: "1200px", flexShrink: 0 }}
      role={flippable ? "region" : undefined}
      aria-label={flippable ? `${characterName} card — click to ${flipped ? "see portrait" : "see score"}` : undefined}
    >
      <motion.div
        style={{
          width: "100%",
          height: "100%",
          position: "relative",
          transformStyle: "preserve-3d",
          cursor: flippable ? "pointer" : "default",
        }}
        animate={{ rotateY: flipped ? 180 : 0 }}
        transition={
          preferReducedMotion
            ? { duration: 0 }
            : { type: "spring", stiffness: 80, damping: 18 }
        }
        onClick={handleFlip}
        onKeyDown={handleKeyDown}
      >
        {/* Drop shadow overlay */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            borderRadius: "var(--radius-xl)",
            boxShadow: "0 20px 60px rgba(0,0,0,0.6), 0 4px 16px rgba(192,57,43,0.15)",
          }}
        />

        <CardFront
          characterName={characterName}
          mediaTitle={mediaTitle}
          imageUrl={imageUrl}
          grade={grade}
        />

        <CardBack
          finalScore={finalScore}
          grade={grade}
          gradeLabel={gradeLabel}
          q5Flag={q5Flag}
          q5ActorName={q5ActorName}
          detectedTropes={detectedTropes}
          summary={summary}
        />
      </motion.div>

      {/* Accessible flip button (screen reader) */}
      {flippable && (
        <button
          ref={buttonRef}
          onClick={handleFlip}
          className="sr-only focus:not-sr-only focus:block focus:mt-2 focus:px-4 focus:py-2 focus:rounded-full focus:text-sm"
          style={{
            backgroundColor: "var(--color-vermillion-500)",
            color: "var(--color-washi-100)",
          }}
          aria-pressed={flipped}
        >
          {flipped ? "Show portrait side" : "Show score side"}
        </button>
      )}
    </div>
  );
}
