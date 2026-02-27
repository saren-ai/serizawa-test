# Serizawa Test — Rubric Changelog

All rubric version changes are logged here. Version numbers follow semantic versioning:
`MAJOR.MINOR.PATCH` — breaking changes / new criteria / clarifications and fixes.

Every analysis record stores the `rubric_version` and `prompt_template_version` that produced it,
enabling longitudinal comparison across rubric changes.

---

## [0.1.0] — PRD v03

**Prompt template:** `ptv_1`  
**Status:** Current

### Added
- Sub-criteria expansion for Q1, Q2, and Q4 with explicit weighting
  - Q1: 1a Goal Independence (40%) / 1b Moral Complexity (35%) / 1c Emotional Interiority (25%)
  - Q2: 2a Explicit Identity (35%) / 2b Cultural Accuracy (35%) / 2c Internalized Heritage (30%)
  - Q4: 4a Plot Counterfactual (40%) / 4b Emotional Counterfactual (35%) / 4c Irreversible Decision (25%)
- Q5 Production Authenticity Flag separated from scored rules — flag only, never averaged into FinalScore
- Three-tier scoring system: AI Score / Critic Score / Audience Score
- 34-entry Trope Taxonomy v01 across 6 categories
- Tonal Register System: 🚨 Trigger Warning / 📚 Teachable Moment / 😂 Ruthless Mockery
- Confidence-weighted leaderboard using Bayesian average (m=5)
- Wall of Shame and Hall of Fame eligibility criteria
- GitHub wiki integration with auto-generated and manual pages
- Subversion bonus (+0.10 per instance, max +0.25) for demonstrated trope deconstruction
- 30% penalty cap on Q3 trope penalties (relative to BaseScore)
- `summary` field (2–3 sentence Japanifornia verdict for social sharing)
- `confidence` field (high / medium / low) with notes on uncertainty
- Calibration anchors: Mr. Miyagi, Mr. Yunioshi, Psylocke (1990s / 2020s)

### Changed
- Q3 base score restructured as a starting value (2.00) modified by penalties/bonuses
  rather than a direct scored criterion

---

## [0.0.1] — PRD v02

**Prompt template:** *(pre-ptv_1)*  
**Status:** Superseded

### Added
- Initial five-rule framework: Q1 Human Individuality, Q2 Distinctly Japanese Identity,
  Q3 Avoidance of Harmful Tropes, Q4 Narrative Impact, Q5 Production Authenticity
- Basic 0–2 scoring per rule with 0–10 total
- Initial trope list (subset of v01 taxonomy)

---

## Versioning Policy

- **PATCH** (0.1.x): Clarifications to existing criteria, edge case guidance, wording fixes.
  No score changes expected for most characters.
- **MINOR** (0.x.0): New sub-criteria, new tropes, weighting adjustments.
  May produce score changes. Old analyses retain original version tag.
- **MAJOR** (x.0.0): Structural framework change. Triggers full re-evaluation recommendation
  and prominent version-change notice on all pre-change analyses.

When the rubric changes, the prompt template version increments (ptv_1 → ptv_2).
Old prompt templates are never modified — all prior analyses remain linked to their
original template version permanently.
