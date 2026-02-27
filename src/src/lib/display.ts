/**
 * Display helpers — all scores are stored as DECIMAL(4,2) on a 0–10 scale.
 * We multiply by 10 for display to give a 0–100 scale that's more intuitive.
 *
 * Never apply these before persisting to the DB or passing to scoring functions.
 */

/** Final score (0–10 raw) → "58.3" displayed on 0–100 scale */
export function displayScore(raw: number, decimals = 1): string {
  return (raw * 10).toFixed(decimals);
}

/** Per-question score (0–2 raw) → "14.5" displayed on 0–20 scale */
export function displayQScore(raw: number, decimals = 1): string {
  return (raw * 10).toFixed(decimals);
}

/** Per-question max (always 2 raw → 20 display) */
export const Q_MAX_DISPLAY = 20;

/** Final score max display */
export const SCORE_MAX_DISPLAY = 100;

/** Grade band cutoffs in DISPLAY units (×10 of the raw cutoffs) */
export const GRADE_CUTOFFS_DISPLAY: Record<string, number> = {
  "A+": 97,
  "A":  93,
  "A-": 90,
  "B+": 87,
  "B":  83,
  "B-": 80,
  "C+": 77,
  "C":  73,
  "C-": 70,
  "D+": 67,
  "D":  63,
  "D-": 60,
  "F":   0,
};
