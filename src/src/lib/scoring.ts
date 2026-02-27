/**
 * Serizawa Test — Scoring Engine
 *
 * ALL scoring logic lives here and ONLY here (architecture rule).
 * All functions are pure — no DB calls, no network, no side effects.
 * Server-side recomputation is MANDATORY — never trust model math.
 *
 * PRD §8.1–8.6, serizawa-prompt-template-v1.md §3
 */

import type { DetectedTrope, Grade } from "@/lib/supabase/types";

// ---------------------------------------------------------------------------
// Precision helper
// ---------------------------------------------------------------------------

/** Round to exactly 2 decimal places (DECIMAL(4,2) in Postgres). */
function r2(value: number): number {
  return Math.round(value * 100) / 100;
}

// ---------------------------------------------------------------------------
// Sub-score interfaces
// ---------------------------------------------------------------------------

export interface Q1SubScores {
  "1a_goal_independence": number;
  "1b_moral_complexity": number;
  "1c_emotional_interiority": number;
}

export interface Q2SubScores {
  "2a_explicit_identity": number;
  "2b_cultural_accuracy": number;
  "2c_internalized_heritage": number;
}

export interface Q4SubScores {
  "4a_plot_counterfactual": number;
  "4b_emotional_counterfactual": number;
  "4c_irreversible_decision": number;
}

export interface Q5SubScores {
  "5a_framing_dignity": number;
  "5b_peer_engagement": number;
  "5c_cultural_framing": number;
}

export interface Q3Result {
  score: number;
  tropePenaltyRaw: number;
  penaltyCap: number;
  tropeBonus: number;
}

export interface ScoringResult {
  q1: number;
  q2: number;
  q3: Q3Result;
  q4: number;
  q5: number;
  baseScore: number;
  finalScore: number;
  grade: Grade;
  gradeLabel: string;
}

// ---------------------------------------------------------------------------
// Q1 — Human Individuality (weights: 40 / 35 / 25)
// ---------------------------------------------------------------------------

export function computeQ1Score(subScores: Q1SubScores): number {
  return r2(
    subScores["1a_goal_independence"] * 0.40 +
    subScores["1b_moral_complexity"]  * 0.35 +
    subScores["1c_emotional_interiority"] * 0.25
  );
}

// ---------------------------------------------------------------------------
// Q2 — Distinctly Japanese Identity (weights: 35 / 35 / 30)
// ---------------------------------------------------------------------------

export function computeQ2Score(subScores: Q2SubScores): number {
  return r2(
    subScores["2a_explicit_identity"]   * 0.35 +
    subScores["2b_cultural_accuracy"]   * 0.35 +
    subScores["2c_internalized_heritage"] * 0.30
  );
}

// ---------------------------------------------------------------------------
// Q4 — Narrative Impact (weights: 40 / 35 / 25)
// ---------------------------------------------------------------------------

export function computeQ4Score(subScores: Q4SubScores): number {
  return r2(
    subScores["4a_plot_counterfactual"]      * 0.40 +
    subScores["4b_emotional_counterfactual"] * 0.35 +
    subScores["4c_irreversible_decision"]    * 0.25
  );
}

// ---------------------------------------------------------------------------
// Q5 — Narrative Dignity & Gaze (weights: 40 / 35 / 25)
//
// Does the narrative apparatus — camera, script, other characters' reactions,
// cultural framing — treat the Japanese character as a subject or a spectacle?
// Distinct from Q1 (the character's own inner life) because this measures how
// the *story itself* looks at them.
// ---------------------------------------------------------------------------

export function computeQ5Score(subScores: Q5SubScores): number {
  return r2(
    subScores["5a_framing_dignity"]  * 0.40 +
    subScores["5b_peer_engagement"]  * 0.35 +
    subScores["5c_cultural_framing"] * 0.25
  );
}

// ---------------------------------------------------------------------------
// Q3 — Avoidance of Harmful Tropes (base 2.00, penalty cap, subversion bonus)
// ---------------------------------------------------------------------------

const Q3_BASE = 2.00;
const PENALTY_CAP_RATE = 0.30;
const SUBVERSION_BONUS_PER_INSTANCE = 0.10;
const MAX_TOTAL_BONUS = 0.25;

/**
 * Compute Q3 score from detected tropes.
 *
 * BaseScore is required to compute the 30% penalty cap correctly —
 * cap = min(rawPenalty, 0.30 × BaseScore).
 * BaseScore must be computed BEFORE Q3 penalties are applied (uses Q3_BASE=2.00).
 */
export function computeQ3Score(
  detectedTropes: DetectedTrope[],
  baseScore: number
): Q3Result {
  // Deduplicate by trope ID (never penalise the same trope twice)
  const seen = new Set<string>();
  const unique = detectedTropes.filter((t) => {
    if (seen.has(t.id)) return false;
    seen.add(t.id);
    return true;
  });

  const tropePenaltyRaw = r2(
    unique.reduce((sum, t) => sum + t.penalty, 0)
  );

  const penaltyCap = r2(
    Math.min(tropePenaltyRaw, PENALTY_CAP_RATE * baseScore)
  );

  const subversionCount = unique.filter((t) => t.subverted).length;
  const tropeBonus = r2(
    Math.min(subversionCount * SUBVERSION_BONUS_PER_INSTANCE, MAX_TOTAL_BONUS)
  );

  const score = r2(
    Math.max(0, Q3_BASE - penaltyCap + tropeBonus)
  );

  return { score, tropePenaltyRaw, penaltyCap, tropeBonus };
}

// ---------------------------------------------------------------------------
// Base score (Q3 uses its base=2.00 before penalties — PRD §8.6)
// ---------------------------------------------------------------------------

/**
 * BaseScore = Q1 + Q2 + 2.00 (Q3 base) + Q4 + Q5
 * Must be computed BEFORE applying Q3 penalty cap.
 */
export function computeBaseScore(q1: number, q2: number, q4: number, q5: number): number {
  return r2(q1 + q2 + Q3_BASE + q4 + q5);
}

// ---------------------------------------------------------------------------
// Final score
// ---------------------------------------------------------------------------

export function computeFinalScore(
  q1: number,
  q2: number,
  q3: number,
  q4: number,
  q5: number
): number {
  return r2(Math.max(0, Math.min(10, q1 + q2 + q3 + q4 + q5)));
}

// ---------------------------------------------------------------------------
// Grade bands (PRD §8.7)
// ---------------------------------------------------------------------------

// Grade bands match standard US high school scale on the 0–100 display range.
// Raw values = display ÷ 10 (scores stored as DECIMAL(4,2) on 0–10 scale).
const GRADE_BANDS: Array<{ min: number; grade: Grade; label: string }> = [
  { min: 9.70, grade: "A+", label: "Load-bearing" },
  { min: 9.30, grade: "A",  label: "Strong pass" },
  { min: 9.00, grade: "A-", label: "Solid pass" },
  { min: 8.70, grade: "B+", label: "Passes with distinction" },
  { min: 8.30, grade: "B",  label: "Present but underwritten" },
  { min: 8.00, grade: "B-", label: "Passes with caveats" },
  { min: 7.70, grade: "C+", label: "Ornamental with moments" },
  { min: 7.30, grade: "C",  label: "Ornamental" },
  { min: 7.00, grade: "C-", label: "Mostly decorative" },
  { min: 6.70, grade: "D+", label: "Prop with lines" },
  { min: 6.30, grade: "D",  label: "Background with dialogue" },
  { min: 6.00, grade: "D-", label: "Background extra" },
  { min: 0.00, grade: "F",  label: "Wall of Shame candidate" },
];

export function computeGrade(finalScore: number): Grade {
  for (const band of GRADE_BANDS) {
    if (finalScore >= band.min) return band.grade;
  }
  return "F";
}

export function computeGradeLabel(grade: Grade): string {
  return GRADE_BANDS.find((b) => b.grade === grade)?.label ?? "Wall of Shame candidate";
}

// ---------------------------------------------------------------------------
// Confidence-weighted leaderboard score (Bayesian average — PRD §8.6)
// ---------------------------------------------------------------------------

const BAYESIAN_M = 5; // minimum threshold analyses before score stabilises

/**
 * Bayesian average: (v × R + m × C) / (v + m)
 *
 * Pulls a character's score toward the global mean (C) until they have
 * at least m=5 analyses, preventing low-sample outliers from dominating.
 *
 * @param finalScore - Character's current FinalScore (R)
 * @param analysisCount - Number of analyses run for this character (v)
 * @param globalMean - Mean FinalScore across all characters (C)
 */
export function computeWeightedLeaderboardScore(
  finalScore: number,
  analysisCount: number,
  globalMean: number
): number {
  if (analysisCount <= 0) return r2(globalMean);
  return r2(
    (analysisCount * finalScore + BAYESIAN_M * globalMean) /
    (analysisCount + BAYESIAN_M)
  );
}

// ---------------------------------------------------------------------------
// Wall of Shame / Hall of Fame eligibility (PRD §10.3, §10.4)
// ---------------------------------------------------------------------------

/**
 * Wall of Shame: FinalScore < 6.00 (F grade, display <60)
 * OR (q5_flag = 'yellowface' AND at least one Major trope detected).
 */
export function isWallOfShameEligible(
  finalScore: number,
  q5Flag: string | null,
  detectedTropes: DetectedTrope[]
): boolean {
  if (finalScore < 6.00) return true;
  if (
    q5Flag === "yellowface" &&
    detectedTropes.some((t) => t.severity === "major")
  ) {
    return true;
  }
  return false;
}

/**
 * Hall of Fame: FinalScore >= 9.30 (A, display ≥93) AND analysis_count >= 5.
 */
export function isHallOfFameEligible(
  finalScore: number,
  analysisCount: number
): boolean {
  return finalScore >= 9.30 && analysisCount >= 5;
}

// ---------------------------------------------------------------------------
// Full scoring pipeline — convenience function for the analysis API
// ---------------------------------------------------------------------------

/**
 * Recompute all scores from raw model sub-scores.
 * Returns the complete scoring result ready for Postgres persistence.
 *
 * This is the function called in the analysis API route to overwrite
 * the model's own `scoring` object.
 */
export function computeScores(parsed: {
  q1: { sub_scores: Q1SubScores };
  q2: { sub_scores: Q2SubScores };
  q3: { detected_tropes: DetectedTrope[] };
  q4: { sub_scores: Q4SubScores };
  q5: { sub_scores: Q5SubScores };
}): ScoringResult {
  const q1 = computeQ1Score(parsed.q1.sub_scores);
  const q2 = computeQ2Score(parsed.q2.sub_scores);
  const q4 = computeQ4Score(parsed.q4.sub_scores);
  const q5 = computeQ5Score(parsed.q5.sub_scores);

  const baseScore = computeBaseScore(q1, q2, q4, q5);
  const q3Result = computeQ3Score(parsed.q3.detected_tropes, baseScore);

  const finalScore = computeFinalScore(q1, q2, q3Result.score, q4, q5);
  const grade = computeGrade(finalScore);
  const gradeLabel = computeGradeLabel(grade);

  return { q1, q2, q3: q3Result, q4, q5, baseScore, finalScore, grade, gradeLabel };
}
