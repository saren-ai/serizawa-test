/**
 * Schema validation for Claude's JSON response.
 * Throws RecoverableAnalysisError if any required fields are missing.
 * PRD §F1.3, serizawa-prompt-template-v1.md §3
 */

export class RecoverableAnalysisError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RecoverableAnalysisError";
  }
}

/** Minimal required fields before persistence. */
export function validateAnalysisSchema(parsed: unknown): void {
  if (typeof parsed !== "object" || parsed === null) {
    throw new RecoverableAnalysisError("Response is not a JSON object");
  }

  const p = parsed as Record<string, unknown>;

  const requiredTopLevel = [
    "character_name",
    "media_title",
    "rubric_version",
    "prompt_template_version",
    "q1",
    "q2",
    "q3",
    "q4",
    "q5",
    "scoring",
    "suggestions",
    "summary",
    "confidence",
  ];

  for (const field of requiredTopLevel) {
    if (!(field in p) || p[field] === null || p[field] === undefined) {
      throw new RecoverableAnalysisError(`Missing required field: ${field}`);
    }
  }

  // Q1 sub-scores
  const q1 = p["q1"] as Record<string, unknown>;
  if (!q1.sub_scores || typeof q1.sub_scores !== "object") {
    throw new RecoverableAnalysisError("Missing q1.sub_scores");
  }
  const q1s = q1.sub_scores as Record<string, unknown>;
  for (const k of ["1a_goal_independence", "1b_moral_complexity", "1c_emotional_interiority"]) {
    if (typeof q1s[k] !== "number") {
      throw new RecoverableAnalysisError(`Missing or non-numeric q1.sub_scores.${k}`);
    }
  }

  // Q2 sub-scores
  const q2 = p["q2"] as Record<string, unknown>;
  if (!q2.sub_scores || typeof q2.sub_scores !== "object") {
    throw new RecoverableAnalysisError("Missing q2.sub_scores");
  }
  const q2s = q2.sub_scores as Record<string, unknown>;
  for (const k of ["2a_explicit_identity", "2b_cultural_accuracy", "2c_internalized_heritage"]) {
    if (typeof q2s[k] !== "number") {
      throw new RecoverableAnalysisError(`Missing or non-numeric q2.sub_scores.${k}`);
    }
  }

  // Q3 detected_tropes (array, may be empty)
  const q3 = p["q3"] as Record<string, unknown>;
  if (!Array.isArray(q3.detected_tropes)) {
    throw new RecoverableAnalysisError("q3.detected_tropes must be an array");
  }

  // Q4 sub-scores
  const q4 = p["q4"] as Record<string, unknown>;
  if (!q4.sub_scores || typeof q4.sub_scores !== "object") {
    throw new RecoverableAnalysisError("Missing q4.sub_scores");
  }
  const q4s = q4.sub_scores as Record<string, unknown>;
  for (const k of ["4a_plot_counterfactual", "4b_emotional_counterfactual", "4c_irreversible_decision"]) {
    if (typeof q4s[k] !== "number") {
      throw new RecoverableAnalysisError(`Missing or non-numeric q4.sub_scores.${k}`);
    }
  }

  // Q5 flag
  const q5 = p["q5"] as Record<string, unknown>;
  const validFlags = ["authentic", "approximate", "yellowface", "not_applicable", "unknown"];
  if (!validFlags.includes(q5.flag as string)) {
    throw new RecoverableAnalysisError(
      `Invalid q5.flag: ${q5.flag}. Must be one of: ${validFlags.join(", ")}`
    );
  }
}
