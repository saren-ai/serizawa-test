"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";

interface RuleCardProps {
  rule: "Q1" | "Q2" | "Q3" | "Q4";
  score: number;
  rationale: string;
  register: string;
  subScores?: Record<string, number> | null;
  /** Labels for each sub-score */
  subScoreLabels?: Record<string, string>;
}

const RULE_META: Record<string, { title: string; jp: string; maxScore: number }> = {
  Q1: { title: "Human Individuality", jp: "人間的個性",     maxScore: 2 },
  Q2: { title: "Japanese Identity",    jp: "日本人のアイデンティティ", maxScore: 2 },
  Q3: { title: "Avoidance of Tropes",  jp: "有害なトロープの回避",   maxScore: 2 },
  Q4: { title: "Narrative Impact",     jp: "物語への影響",  maxScore: 2 },
};

const REGISTER_BADGE: Record<string, { label: string; emoji: string; color: string }> = {
  trigger:   { label: "Trigger Warning",   emoji: "🚨", color: "#F5856E" },
  teachable: { label: "Teachable Moment",  emoji: "📚", color: "#7EC8E3" },
  mockery:   { label: "Ruthless Mockery",  emoji: "😂", color: "#F5C842" },
  dual:      { label: "Dual Register",     emoji: "😂→🚨", color: "#C39BD3" },
};

export function RuleCard({ rule, score, rationale, register, subScores, subScoreLabels }: RuleCardProps) {
  const [open, setOpen] = useState(false);
  const meta = RULE_META[rule];
  const pct = (score / meta.maxScore) * 100;
  const registerKey = register.includes("→") ? "dual" : register.toLowerCase();
  const reg = REGISTER_BADGE[registerKey];

  return (
    <div
      className="rounded-xl border overflow-hidden"
      style={{
        backgroundColor: "var(--color-ink-800)",
        borderColor: "var(--color-ink-600)",
        borderRadius: "var(--radius-md)",
      }}
    >
      {/* Header — always visible, click to expand */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-4 px-5 py-4 text-left"
        aria-expanded={open}
        aria-controls={`${rule}-detail`}
      >
        {/* Rule label */}
        <div className="flex-shrink-0 w-8 text-center">
          <span
            className="text-xs font-bold"
            style={{ color: "var(--color-washi-400)", fontFamily: "var(--font-mono)" }}
          >
            {rule}
          </span>
        </div>

        {/* Title + bar */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1.5">
            <p
              className="text-sm font-medium truncate"
              style={{ color: "var(--color-washi-100)", fontFamily: "var(--font-body)" }}
            >
              {meta.title}
            </p>
            <span
              className="ml-3 flex-shrink-0 text-sm font-semibold"
              style={{ color: "var(--color-washi-100)", fontFamily: "var(--font-mono)" }}
            >
              {score.toFixed(2)}
            </span>
          </div>
          {/* Progress bar */}
          <div className="score-bar-track">
            <motion.div
              className="score-bar-fill"
              initial={{ width: 0 }}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" }}
            />
          </div>
        </div>

        {/* Register badge */}
        {reg && (
          <span
            className="flex-shrink-0 text-sm"
            title={reg.label}
            style={{ color: reg.color }}
          >
            {reg.emoji}
          </span>
        )}

        {/* Chevron */}
        <motion.div
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="flex-shrink-0"
        >
          <ChevronDown
            size={16}
            style={{ color: "var(--color-washi-400)" }}
          />
        </motion.div>
      </button>

      {/* Expandable detail */}
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            id={`${rule}-detail`}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            style={{ overflow: "hidden" }}
          >
            <div
              className="px-5 pb-5 pt-1"
              style={{
                borderTop: `1px solid var(--color-ink-700)`,
              }}
            >
              {/* Sub-scores (Q1, Q2, Q4 only — Q3 uses trope pills) */}
              {subScores && subScoreLabels && Object.keys(subScores).length > 0 && (
                <div className="mb-3 space-y-1.5">
                  {Object.entries(subScores).map(([key, val]) => (
                    <div key={key} className="flex items-center justify-between">
                      <span
                        className="text-xs"
                        style={{ color: "var(--color-washi-400)", fontFamily: "var(--font-body)" }}
                      >
                        {subScoreLabels[key] ?? key}
                      </span>
                      <span
                        className="text-xs"
                        style={{ color: "var(--color-washi-300)", fontFamily: "var(--font-mono)" }}
                      >
                        {(val as number).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* Rationale */}
              <p
                className="text-sm leading-relaxed"
                style={{ color: "var(--color-washi-300)", fontFamily: "var(--font-body)" }}
              >
                {rationale}
              </p>

              {/* Register label */}
              {reg && (
                <p
                  className="text-xs mt-2"
                  style={{ color: reg.color, fontFamily: "var(--font-mono)" }}
                >
                  {reg.emoji} {reg.label}
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
