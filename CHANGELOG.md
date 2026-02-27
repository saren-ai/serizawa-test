# Serizawa Test — Rubric Changelog

All rubric version changes are logged here. Version numbers follow semantic versioning:
`MAJOR.MINOR.PATCH` — breaking changes / new criteria / clarifications and fixes.

Every analysis record stores the `rubric_version` and `prompt_template_version` that produced it,
enabling longitudinal comparison across rubric changes.

---

## [0.2.1] — Session 2 UX Polish — 2026-02-27

**Prompt template:** `ptv_1` *(unchanged)*
**Status:** Current

### Changed
- **Grade badge contrast:** Background opacity raised to 40–60%, text now white,
  backdrop blur added. Readable on any portrait background.
- **"Japanifornia Says..."** replaces "Suggestions for improvement" — displays the
  2–3 sentence verdict instead of multi-bullet recommendations.
- **Q1 rule card opens by default** — teaches users that rule cards are expandable.
- **Share button moved to upper-right** — sits opposite the breadcrumb pill.
- **Floating pill bar:** true viewport centering, pill-shaped hover state with
  frosted wash, animated JP tooltips via Framer Motion.
- **Search pill → Home:** No separate `/search` page. Home IS the search interface.

### Added
- **Supabase DB lookup in analysis flow:** Existing analyses return instantly without
  touching Claude. Redis cache → DB lookup → Claude (only if new).
- **Character portrait images:** 6 initial portraits in `/public/characters/`.
  Static image map in `character-images.ts` with key variant matching.
- **GitHub issue templates:** new-trope, trope-dispute, rule-change, glossary-term.
- **SECURITY.md:** Responsible disclosure policy.

### Fixed
- **JSON extraction:** Changed from regex fence-stripping to first `{` / last `}`
  extraction. Claude adds commentary after JSON that broke the old regex.
- **Q5 sub_scores injection:** Was writing to `parsed["q5_scored"]` (wrong key).
  Now injects directly onto `parsed["q5"].sub_scores` where `computeScores` reads it.
- **Anthropic SDK retries:** Set `maxRetries: 0` — SDK's default 2 retries compounded
  the 25s timeout into 75s hangs. We handle retries in our own loop.
- **MAX_TOKENS:** Raised from 2000 → 8192. Full analysis was truncating.
- **Prompt caching beta removed:** Caused compatibility issues with Haiku 4.5.

---

## [0.2.0] — Session 2 — 2026-02-27

**Prompt template:** `ptv_2` *(pending — analyses still running on ptv_1)*
**Status:** Current

### Changed

#### Q5 — Promoted from Flag to Scored Criterion
Q5 was previously a binary flag: "Is the character played by a Japanese or Japanese-American actor?"
It is now a **fully scored criterion**: **Narrative Dignity & Gaze**.

| Sub-criterion | Weight | Core question |
|---|---|---|
| 5a Gaze & Framing | 40% | Is the camera / narrative gaze respectful, or exoticizing? |
| 5b Agency & Dignity | 35% | Does the character act with self-determination, or are they acted upon? |
| 5c Sexual Objectification Avoidance | 25% | Is the character sexualized in ways that reduce them to their ethnicity or body? |

Q5 scores are **not averaged into FinalScore** by default — they are displayed alongside
Q1–Q4 as a companion criterion. The FinalScore formula (Q1–Q4 weighted average ± trope
adjustments) is unchanged. Q5 produces its own score, grade, and rationale.

**Rationale:** The original casting flag was a binary that couldn't capture nuance.
A Japanese-American actor can still be directed through an exoticizing gaze. A non-Japanese
actor can deliver a portrayal of genuine dignity. The gaze criterion captures what matters.

#### Grade Bands — Expanded to 13-Tier System
The original 6-tier system (A+/A/B/C/D/F) has been replaced with a 13-tier system
matching conventional high school grading:

| Score (0–10 internal) | Display (0–100) | Grade |
|---|---|---|
| ≥ 9.70 | ≥ 97 | A+ |
| 9.30–9.69 | 93–96 | A |
| 9.00–9.29 | 90–92 | A− |
| 8.70–8.99 | 87–89 | B+ |
| 8.30–8.69 | 83–86 | B |
| 8.00–8.29 | 80–82 | B− |
| 7.70–7.99 | 77–79 | C+ |
| 7.30–7.69 | 73–76 | C |
| 7.00–7.29 | 70–72 | C− |
| 6.00–6.99 | 60–69 | D |
| 5.00–5.99 | 50–59 | D− |
| < 5.00 | < 50 | F |

**Hall of Fame threshold:** FinalScore ≥ 9.30 (was ≥ 8.50)
**Wall of Shame threshold:** FinalScore < 6.00 (was < 4.50)

#### Score Display — 0–100 Scale
All user-facing scores now display on a 0–100 scale for intuitive reading.
Internal calculations remain on the 0–10 weighted decimal system (DECIMAL(4,2)).
Per-question scores display on 0–20 (each question max 2.00 internally).
No data migration required — display conversion is applied at render time.

### Added

#### Bulk Import System
- `/admin/bulk-import` UI: CSV upload, live status board, per-item progress
- `/api/admin/bulk` POST: Creates `bulk_jobs` and `bulk_items` records
- `/api/admin/bulk/[jobId]` GET: Job status polling
- `/api/cron/bulk` GET: Vercel cron handler (1 item/min), requires `CRON_SECRET`
- `vercel.json`: Cron schedule for bulk processor
- Database tables: `bulk_jobs`, `bulk_items`

#### Infrastructure Improvements
- **Prompt caching:** Anthropic `prompt-caching-2024-07-31` beta enabled on system prompt.
  Reduces latency significantly on repeated analyses (~40% faster after cache warms).
- **Rate limiting fail-open:** Redis errors in production no longer block analyses.
  In development, rate limiting is bypassed entirely.
- **Error specificity:** API route now returns 400/408/422/503 with distinct messages.
  Loading screen displays specific errors immediately without retry loops.

### Fixed
- **Model deprecation:** Migrated from `claude-3-5-haiku-20241022` (EOL Feb 19 2026)
  to `claude-haiku-4-5-20251001` (Haiku 4.5).
- **Key encoding bug:** `%7C`-encoded pipe characters in route params now decoded
  before Supabase queries. Eliminated 404s on direct URL navigation.
- **Analysis persist failures:** Column name mismatches (`trope_penalty` vs
  `trope_penalty_raw`/`_capped`, missing `grade_label`, `confidence`, `confidence_notes`)
  corrected in `/lib/analysis/persist.ts`.
- **Supabase join fragility:** Replaced complex `analyses!latest_analysis_id` join
  with two sequential queries on the character results page.

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
