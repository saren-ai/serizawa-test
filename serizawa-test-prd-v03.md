# Serizawa Test — Product Requirements Document v03

**Document Status:** Draft v03  
**Owner:** Saren (Product Manager / Jr. Dev)  
**Supersedes:** PRD v02  
**Review Cadence:** Weekly or after each material framework change  
**Target MVP Ship Date:** +2 weeks from PRD approval  
**License:** Creative Commons CC BY — open usage with attribution  
**Tone:** Academically rigorous. Pop-culturally witty. Transparently non-institutional.  
*"For entertainment & insight, not peer-reviewed research."*

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Mission & Voice](#2-mission--voice)
3. [Problem Statement & Context](#3-problem-statement--context)
4. [Goals & Non-Goals (MVP v00)](#4-goals--non-goals-mvp-v00)
5. [Success Metrics](#5-success-metrics)
6. [User Segments & Primary JTBD](#6-user-segments--primary-jtbd)
7. [Use Cases & Top Tasks](#7-use-cases--top-tasks)
8. [The Serizawa Framework](#8-the-serizawa-framework)
   - 8.1 [The Serizawa Five — Scoring Rules](#81-the-serizawa-five--scoring-rules)
   - 8.2 [Sub-Criteria Expansion](#82-sub-criteria-expansion)
   - 8.3 [Q5 Production Authenticity Flag](#83-q5-production-authenticity-flag)
   - 8.4 [Trope Taxonomy v01](#84-trope-taxonomy-v01)
   - 8.5 [Tonal Register System](#85-tonal-register-system)
   - 8.6 [Scoring Algorithm](#86-scoring-algorithm)
   - 8.7 [Grade Bands](#87-grade-bands)
9. [Scoring Tiers — Three Parallel Scores](#9-scoring-tiers--three-parallel-scores)
10. [Leaderboard Architecture](#10-leaderboard-architecture)
11. [Functional Requirements](#11-functional-requirements)
12. [GitHub Wiki Integration](#12-github-wiki-integration)
13. [Non-Functional Requirements](#13-non-functional-requirements)
14. [Data Model](#14-data-model)
15. [AI Governance & Quality](#15-ai-governance--quality)
16. [User Flows](#16-user-flows)
17. [Privacy & Compliance](#17-privacy--compliance)
18. [Analytics Plan](#18-analytics-plan)
19. [Risks & Mitigations](#19-risks--mitigations)
20. [Release Plan](#20-release-plan)
21. [Technical Architecture](#21-technical-architecture)
22. [Future Roadmap](#22-future-roadmap)
23. [Glossary](#23-glossary)
24. [Appendices](#24-appendices)

---

## 1. Executive Summary

Accurate evaluation of Japanese / Japanese-American / Nikkei character representation in Western-produced media is currently fragmented, subjective, and slow. Public discourse on Asian representation has intensified since 2020, yet no lightweight, data-backed, community-participatory tool exists to transform qualitative debate into structured, reproducible signals.

The **Serizawa Test** provides a reproducible 0–10 weighted AI-assisted scoring framework — named for Dr. Ishirō Serizawa from the 1954 film *Godzilla* — the brooding scientist whose decision ends the story. Not a sidekick. Not comic relief. Not decorative. Load-bearing.

The tool combines AI analysis, community validation, trope detection, and a three-tier scoring system (AI / Critics / Audience) to produce defensible, auditable, entertaining character evaluations with longitudinal tracking. Built in public, licensed CC BY, and designed to inspire as much conversation as it resolves.

---

## 2. Mission & Voice

### 2.1 Mission

To create an open, transparent, community-enriched standard for evaluating Japanese character representation in Western media — rigorous enough to survive academic scrutiny, funny enough to go viral, and proud enough to mean it.

Final goal: progress in representation. Getting there via education, community, and the occasional ruthless public mockery of Mr. Yunioshi.

### 2.2 The Japanifornia Voice

Three registers, used intentionally and labeled transparently:

| Register | Symbol | When to use | Tone |
|---|---|---|---|
| Trigger Warning | 🚨 | Genuine harm. Pain is real before mockery is earned. | Direct, serious, caring |
| Teachable Moment | 📚 | Usually unintentional. Ignorance, not malice. Most common. | Curious, educational, non-accusatory |
| Ruthless Mockery | 😂 | So dumb, so lazy, so thoroughly deserving. | Full Japanifornia energy |

Many tropes carry dual registers (😂→🚨). "Ah, so." is funny to mock — and the person it's aimed at knows exactly why it isn't. That tension *is* the teachable moment.

### 2.3 Lineage & Credits

The Serizawa Test builds on a tradition of diagnostic representation frameworks:

- **Bechdel Test** (1985) — Alison Bechdel / Liz Wallace — gender representation baseline
- **Mako Mori Test** (2013) — Tumblr user "Chaila" — female narrative arc independence
- **Sexy Lamp Test** — Kelly Sue DeConnick — character replaceability
- **Vito Russo Test** — GLAAD — LGBTQ+ narrative necessity
- **DuVernay Test** (2016) — Manohla Dargis — people of color as fully realized lives
- **Latif Sisters Test** (2016) — Nadia & Leila Latif / The Guardian — five-question POC framework
- **Dr. Ishirō Serizawa** — 1954 *Godzilla* — the standard we name ourselves after

---

## 3. Problem Statement & Context

**Core Problem:** Japanese-American community members, media fans, researchers, and creators lack a standardized, transparent, and explainable method to evaluate the authenticity and agency of Japanese heritage characters in Western media — leading to repetitive, subjective debates and limited longitudinal insight.

**Why Now:** Surge in Asian representation discourse post-2020. Need to move beyond raw sentiment and isolated think pieces toward structured, open, community-enriched datasets and comparative analytics.

**Consequences of Status Quo:** Fragmented anecdotes, echo-chamber debates, difficulty educating creators, no aggregated trope trend visibility.

**Opportunity:** Provide an open CC BY, continuously improving rubric capturing AI + community consensus signals. Become a canonical dataset for future cross-media comparative analysis.

**Scope:** Western-produced media only. Japanese / Japanese-American / Nikkei characters. All eras from 1940s propaganda through present day.

---

## 4. Goals & Non-Goals (MVP v00)

### 4.1 Must Ship

1. Single-character AI analysis via the Serizawa Five with decimal scoring and weighted trope penalties producing Final Score (0–10)
2. Three-tier scoring display: AI Score + Critic Score + Audience Score
3. Supabase persistence: character records, analyses, user accounts (optional), votes, trope submissions & disputes, rule suggestions
4. Confidence-weighted leaderboard with multiple views including Wall of Shame
5. Comparative analysis: side-by-side view of up to 3 characters
6. Transparency page: rubric definitions, trope taxonomy, model/version log, monthly audit results, contribution forms
7. Community interaction: voting per rule, trope submission & dispute, rule modification proposals
8. Admin bulk import interface (secured) to enqueue character analyses
9. Historical data capture: timestamped analyses for longitudinal tracking
10. GitHub wiki integration: public repository with auto-generated taxonomy/stats and manual editorial pages
11. Accessibility baseline (WCAG 2.1 AA), English-only UI
12. Glossary page with community submission capability

### 4.2 Stretch Goals

- Historical delta indicators (trajectory arrows on leaderboard)
- Per-character community consensus score display (agreement %)
- Wall of Shame character essays (editorial, manual)
- Hall of Fame character essays (editorial, manual)

### 4.3 Explicit Non-Goals (v00)

- Multi-language UI (Japanese localization — future)
- Predictive trend modeling / forecasting
- Cross-ethnicity frameworks (modular adaptation — future)
- Full statistical downloadable exports (CSV/JSON) — internal Supabase access only
- Real-time public API for third parties
- Sophisticated visual analytics dashboards

---

## 5. Success Metrics

| Category | Metric | Definition | Target (30 days post-launch) |
|---|---|---|---|
| Adoption | Unique characters analyzed | Distinct character+media keys | 300 |
| Engagement | Avg. votes per character | Sum of vote events / characters | ≥5 |
| Quality | AI ↔ Human agreement rate | % rule scores where community consensus matches AI within ±0.25 | ≥80% |
| Community | Trope submissions accepted | New tropes added post-user suggestion | ≥10 |
| Transparency | Monthly audit completion | Audit published on Transparency page | 100% |
| Virality | Wall of Shame shares | Share events on Wall of Shame entries | ≥50 |
| Wiki | GitHub stars | Public repo stars | ≥25 |

*No client tracking scripts. No IP collection. All counts server-side.*

---

## 6. User Segments & Primary JTBD

| Priority | Segment | Primary JTBD | MVP Value |
|---|---|---|---|
| 1 | Japanese-American community / media fans | "I want a credible but fun yardstick to validate or challenge perceptions of character portrayal." | Fast AI score + voting/dispute |
| 2 | Film & media fans of Asian American cinema | "I want to compare characters and join community interpretation." | Comparative analysis + trope taxonomy |
| 3 | Creators / writers | "I want to learn what good representation structurally looks like." | Rule explanations + suggestions |
| 4 | Academically curious / researchers | "I want reliable, versioned data I can reference." | Transparency + version logging + GitHub wiki |

---

## 7. Use Cases & Top Tasks

1. **Evaluate a character** → Input name + media → AI analysis → scores + rule explanations + detected tropes + register tags
2. **Vote / validate** → Logged-in user agrees/disagrees per rule → builds Audience Score layer
3. **Critic review** → Verified reviewer scores independently → builds Critic Score layer
4. **Dispute tropes** → Flag misclassified trope → admin review queue
5. **Submit new trope** → Title, category, description, example, TVTropes reference
6. **Suggest rule change** → Rule ID, rationale, evidence links
7. **Compare characters** → Select up to 3 → side-by-side scoring deltas + trope overlaps
8. **Browse leaderboard** → Multiple views: all-time, by era, by media type, Wall of Shame
9. **Browse glossary** → Search terms, submit new entries
10. **Admin bulk import** → Upload CSV → sequential processing → status page

---

## 8. The Serizawa Framework

### 8.1 The Serizawa Five — Scoring Rules

Five public-facing questions. Each scores 0–2 in decimal increments via weighted sub-criteria. Total base score = 0–10. Q5 is a production flag, not a scored rule.

| Rule | Name | Core question |
|---|---|---|
| Q1 | Human Individuality | Is this character a fully realized human being with goals, flaws, and interior life independent of their ethnicity? |
| Q2 | Distinctly Japanese Identity | Is Japaneseness expressed through psychology and specificity rather than props, aesthetics, and pan-Asian blur? |
| Q3 | Avoidance of Harmful Tropes | Does the portrayal avoid — or actively subvert — the Serizawa Trope Taxonomy? |
| Q4 | Narrative Impact | Is this character load-bearing, or are they narrative furniture? |
| Q5 | Ethnic Authenticity *(flag only)* | Is the character portrayed by a Japanese or Japanese-American actor in live action? |

---

### 8.2 Sub-Criteria Expansion

#### Q1 — Human Individuality

*Domain: Narrative Weight*

| Sub-criterion | Weight | Notes |
|---|---|---|
| 1a. Has at least one goal unrelated to serving another character | 40% | Fails if entire motivation is "protect / guide / avenge the protagonist" |
| 1b. Permitted to be wrong, petty, or morally complicated | 35% | The Miyagi chores test. Flawless ethnic representatives are props with better PR |
| 1c. Experiences emotion the narrative takes seriously | 25% | Not comic relief grief, not stoic non-reaction — actual interiority |

*Register note:* Failure on 1b is almost always 📚 — writers thinking they're being respectful by making the Japanese character noble and perfect.

---

#### Q2 — Distinctly Japanese Identity

*Domain: Cultural Representation*

| Sub-criterion | Weight | Notes |
|---|---|---|
| 2a. Identity is explicitly Japanese, not vaguely "Asian" | 35% | Interchangeable Asian Cultures detector |
| 2b. Cultural references are specific and accurate, not aesthetic shorthand | 35% | The kimono drop test. The sushi cameo test. The cherry blossom establishing shot test |
| 2c. Japanese heritage expressed through history, psychology, or relationships — not objects | 30% | Difference between Miyagi's internment trauma and a character who just owns a katana |

*Register note:* 2b failures are almost always 📚 — lazy research, not malice. 2a failures that erase Japanese identity into generic Asian are 🚨 when deliberate, 📚 when ignorant.

---

#### Q3 — Avoidance of Harmful Tropes

*Domain: Harm Register — interfaces directly with trope taxonomy*

Q3 base score starts at **2.00**. Each detected trope applies its penalty. A subversion bonus applies when a trope is demonstrably deconstructed rather than simply avoided.

| Condition | Score adjustment |
|---|---|
| No tropes detected | 2.00 |
| Minor trope | −0.05 each |
| Moderate trope | −0.10 each |
| Major trope | −0.25 each |
| Trope actively subverted with narrative intent | +0.10 bonus (max +0.25 total) |
| 30% penalty cap applies | floor at 0.00 |

*Example:* Miyagi's karate-as-life-philosophy subverts All Asians Know Martial Arts. That's worth the bonus. His presence as wise mentor without that subversion would not be.

---

#### Q4 — Narrative Impact

*Domain: Narrative Weight*

| Sub-criterion | Weight | Notes |
|---|---|---|
| 4a. Removing the character meaningfully changes the plot's outcome | 40% | The counterfactual test |
| 4b. Removing the character meaningfully changes the emotional resolution | 35% | Katana fails here. Miyagi is devastating here |
| 4c. The character makes at least one irreversible decision | 25% | Serizawa '54 dropping the Oxygen Destroyer. Irreversibility = agency |

*UI callout for 4c = 0:* "This character never makes a decision the story can't take back. That's not a character — that's a plot device."

---

### 8.3 Q5 Production Authenticity Flag

Displayed separately from the 0–10 score. Never averaged into FinalScore. Always shown prominently on the character detail page.

| Flag | Condition | UI treatment | Wall of Shame eligible |
|---|---|---|---|
| ✅ Authentic | Japanese or Japanese-American actor in Japanese role | Green badge | No |
| ⚠️ Approximate | Asian actor of non-Japanese heritage in Japanese role | Yellow badge with note | No |
| 🚨 Yellowface | Non-Asian actor in Japanese role | Red badge | Yes (with Major trope) |

**Wall of Shame eligibility:** 🚨 Yellowface flag **plus** at least one Major trope detection. Yellowface alone (in an otherwise respectful portrayal) warrants the flag but not the Wall.

---

### 8.4 Trope Taxonomy v01

34 entries across 6 categories. Each entry carries a tonal register tag — 🚨 Trigger Warning, 📚 Teachable Moment, 😂 Ruthless Mockery, or dual-register for nuanced cases.

#### Category 1: Archetype

| ID | Name | Severity | Register | Penalty | TVTropes slug | Japanifornia note |
|---|---|---|---|---|---|---|
| T001 | Wise Mystic Mentor | Moderate | 📚 | −0.10 | wise_old_master | The Miyagi borderline case. Depth saves it; pure cryptic wisdom dispensing sinks it |
| T003 | Silent Enforcer | Moderate | 📚 | −0.10 | strong_silent_type | Stoic competence without interiority. Katana's ZIP code |
| T004 | Default Martial Artist | Moderate | 📚 | −0.10 | martial_arts_dojo | Skill assignment without narrative basis. Did anyone ask if they wanted to do karate? |
| T012 | Technological Savant Automaton | Moderate | 📚 | −0.10 | the_savant | Emotionless logic machine. Every 90s cyberpunk film's "Japanese hacker" |
| T013 | The Houseboy | Major | 🚨 | −0.25 | manservant | Domestic servitude coding. Racial and gender dimensions intersect nastily here |

#### Category 2: Cultural Reduction

| ID | Name | Severity | Register | Penalty | TVTropes slug | Japanifornia note |
|---|---|---|---|---|---|---|
| T005 | Samurai / Ninja Assumption | Major | 📚→😂 | −0.25 | samurai / ninja | Starts 📚, becomes 😂 when a modern salaryman inexplicably knows kenjutsu |
| T010 | Gratuitous Kimono Drop | Minor | 😂 | −0.05 | kimono | Shallow costume cameo unmoored from context. The cherry blossom establishing shot of clothing |
| T014 | Interchangeable Asian Cultures | Major | 🚨 | −0.25 | interchangeable_asian_cultures | Japanese character with Chinese customs, Korean food, vaguely pan-Asian accent. Do your homework |
| T015 | Gaijin in Japan | Minor | 😂 | −0.05 | gaijin | White protagonist arrives in Japan, immediately becomes the most important person in the room |
| T016 | Tokyo Is the Center of the Universe | Minor | 😂 | −0.05 | tokyo_is_the_center_of_the_universe | All of Japan is Tokyo. Osaka weeps. Okinawa has entered the chat |
| T017 | Japandering | Minor | 😂 | −0.05 | japandering | Western celebrity doing baffling Japanese ads. Not always harmful but deeply, beautifully weird |
| T018 | Japan Takes Over the World | Moderate | 📚 | −0.10 | japan_takes_over_the_world | Yellow Peril's economic anxiety cousin. Very 1980s. Still occasionally dusted off |
| T019 | WWII Soldier Doesn't Know War Is Over | Moderate | 😂→📚 | −0.10 | — | Hiroo Onoda territory. Starts 😂, lands 📚 when you learn the actual history |

#### Category 3: Sexualization

| ID | Name | Severity | Register | Penalty | TVTropes slug | Japanifornia note |
|---|---|---|---|---|---|---|
| T002 | Dragon Lady | Major | 🚨 | −0.25 | dragon_lady | Alluring, manipulative, exoticized. Sexuality as threat. Still very much alive |
| T007 | Exotic Sexual Object | Major | 🚨 | −0.25 | exotic_beauty | Fetishized otherness as primary characterization. The camera lingers, the character evaporates |
| T020 | Geisha Stereotype | Major | 🚨→📚 | −0.25 | geisha | Submission and service as feminine ideal. Doesn't require a literal geisha — the affect is enough |
| T021 | Yamato Nadeshiko | Moderate | 📚 | −0.10 | yamato_nadeshiko | The "ideal Japanese woman" — demure, devoted, self-sacrificing. Positive framing that's still a cage |
| T022 | Mighty Whitey and Mellow Yellow | Major | 🚨 | −0.25 | mighty_whitey_and_mellow_yellow | White male protagonist + devoted Japanese woman. Madama Butterfly's Hollywood grandchildren |

#### Category 4: Appearance / Accent / Language

| ID | Name | Severity | Register | Penalty | TVTropes slug | Japanifornia note |
|---|---|---|---|---|---|---|
| T008 | Comedic Accent Gag | Moderate | 😂→🚨 | −0.10 | funny_accent | Accent deployed for othering or humor. Starts 😂 in the room, lands 🚨 on the person it's about |
| T009 | Asian Buck Teeth | Major | 🚨 | −0.25 | buck_teeth | Legacy caricature. No redemptive reading exists. Full stop |
| T023 | Engrish / Japanese Ranguage | Moderate | 😂→🚨 | −0.10 | engrish | Mangled English as comedy. The 😂 is the tell — it's laughing *at*, not *with* |
| T024 | Ching Chong | Major | 🚨 | −0.25 | ching_chong | Onomatopoeic mockery of East Asian languages. No register ambiguity here |
| T025 | "Ah, So." | Moderate | 😂→🚨 | −0.10 | — | Specific phrase deployed as Japanese accent shorthand. So lazy it's almost impressive. Almost |
| T026 | All Asians Wear Conical Straw Hats | Minor | 😂 | −0.05 | conical_hat | It's 2024. And yet |

#### Category 5: Role Limitation

| ID | Name | Severity | Register | Penalty | TVTropes slug | Japanifornia note |
|---|---|---|---|---|---|---|
| T011 | Salaryman Flatness | Minor | 📚 | −0.05 | salaryman | Defined entirely by overworked office drone trope. Surprisingly common in prestige drama |
| T027 | Asian Airhead | Moderate | 😂→🚨 | −0.10 | asian_airhead | Ditzy, shallow, accent-adjacent. The kawaii pipeline misused |
| T028 | Asian and Nerdy | Minor | 📚 | −0.05 | asian_and_nerdy | Model minority stereotype wearing a pocket protector. Low severity, cumulative damage |
| T029 | Asian Babymama | Moderate | 🚨 | −0.10 | asian_babymama | Exists to produce mixed-race children for the white protagonist's storyline. See T022 |
| T030 | Asian Drivers | Minor | 😂 | −0.05 | asian_drivers | Deeply stupid. Gets the 😂 register and a raised eyebrow |
| T031 | Inscrutable Oriental | Moderate | 📚→🚨 | −0.10 | inscrutable_oriental | Deliberate inscrutability as characterization. Otherness as personality. Older than Hollywood |
| T032 | Japanese Politeness as Characterization | Minor | 📚 | −0.05 | japanese_politeness | Politeness so exaggerated it replaces personality. Courtesy without humanity |
| T033 | Asian Cleaver Fever | Minor | 😂→🚨 | −0.05 | — | Specific prop-as-menace coding. Rare but worth tracking |

#### Category 6: Identity / Casting / Systemic

| ID | Name | Severity | Register | Penalty | TVTropes slug | Japanifornia note |
|---|---|---|---|---|---|---|
| T034 | Yellowface | Major | 🚨 | −0.25 | yellowface | Non-Asian actor in Asian role. Primary Wall of Shame admission criterion |
| T035 | Whitey Playing Hāfu | Moderate | 🚨 | −0.10 | — | White or non-Japanese actor playing mixed Japanese heritage. Same spectrum, different severity |
| T036 | Yellow Peril | Major | 🚨 | −0.25 | yellow_peril | Systemic threat framing. The ideological foundation of half this list |
| T037 | Asian Speekee Engrish | Moderate | 😂→🚨 | −0.10 | speekee_engrish | Broader than T023 — systemic accent mockery as characterization |

---

### 8.5 Tonal Register System

Every trope detection in the UI displays its register tag with a brief explanation. The register informs how the finding is written in the AI analysis output, how it's displayed in the results card, and how it's written in the GitHub wiki.

**Register display logic:**
- 🚨 findings: serious tone, harm acknowledged before any mockery, trigger warning header
- 📚 findings: educational framing, historical context, creator-focused language
- 😂 findings: full Japanifornia energy, but never punching down — we're mocking the trope, not the culture
- Dual-register (e.g., 😂→🚨): leads with the 😂 for accessibility, lands the 🚨 for honesty

---

### 8.6 Scoring Algorithm

```
// Base score
BaseScore = Q1 + Q2 + Q3 + Q4   // range: 0.00–10.00

// Q3 trope penalty calculation
TropePenalty = Σ severityPenalty for each distinct detected trope
  Minor:    −0.05
  Moderate: −0.10
  Major:    −0.25

// Subversion bonus (applied to Q3)
TropeBonus = Σ subversion bonuses (max +0.25 total)
  Demonstrated subversion: +0.10 per instance

// Penalty cap
PenaltyCap = min(TropePenalty, 0.30 × BaseScore)

// Final score
FinalScore = round(BaseScore - PenaltyCap + TropeBonus, 2)

// Confidence-weighted leaderboard score
// Bayesian average — prevents low-sample outliers dominating rankings
m = 5  // minimum threshold analyses
C = global mean FinalScore across all characters
v = number of analyses for this character
R = character's current FinalScore
WeightedLeaderboardScore = (v × R + m × C) / (v + m)
```

---

### 8.7 Grade Bands

| Score | Grade | Label |
|---|---|---|
| ≥8.50 | A+ | Load-bearing |
| 7.50–8.49 | A | Strong pass |
| 6.50–7.49 | B | Present but underwritten |
| 5.50–6.49 | C | Ornamental |
| 4.50–5.49 | D | Prop with lines |
| <4.50 | F | Wall of Shame candidate |

---

## 9. Scoring Tiers — Three Parallel Scores

Three scores displayed simultaneously on every character detail page. Community scores never overwrite or replace the AI score. The AI score is the canonical, auditable, versionable baseline. Community scores are the conversation around it.

| Score | Label | Who contributes | How calculated |
|---|---|---|---|
| 🤖 AI Score | "Serizawa AI" | Claude analysis | Serizawa algorithm — fully automated |
| 🎓 Critic Score | "Community Critics" | Verified reviewers | Weighted average of critic rule votes |
| 👥 Audience Score | "Audience" | All logged-in users | Weighted average of all user rule votes |

### 9.1 Critic Verification

Users earn Critic status by meeting any of the following:

- Submitted 3+ accepted tropes to the taxonomy
- Had 5+ trope disputes resolved in their favor
- Admin invitation (researchers, journalists, community figures)

### 9.2 Score Gap as Feature

The gap between AI Score and Community Scores is intentional signal, not noise. When AI scores a character A– and the community scores F, the dispute mechanism should surface it prominently. These divergences are the most interesting data the tool produces.

### 9.3 Voting Architecture

Logged-in users vote per rule: **agree / disagree / indifferent**. Critic votes carry 3× weight in Critic Score calculation. Audience votes carry 1× weight. Minimum 3 votes before any community score is displayed.

---

## 10. Leaderboard Architecture

### 10.1 Confidence Weighting

All leaderboard rankings use the Bayesian-averaged WeightedLeaderboardScore (see §8.6) to prevent low-sample outliers from dominating rankings.

### 10.2 Leaderboard Views

| View | Description | Sort |
|---|---|---|
| 🏆 All-time best | Confidence-weighted, all eras | WeightedLeaderboardScore desc |
| 📈 Most improved | Biggest positive score trajectory | Delta asc (most improvement first) |
| 🗓️ By era | Filter by decade of primary depiction | WeightedLeaderboardScore desc within era |
| 🎬 By media type | Film / TV / comics / games | WeightedLeaderboardScore desc within type |
| 🔥 Most analyzed | Pure popularity signal | lookup_count desc |
| 💀 Wall of Shame | Lowest scores + Yellowface flagged | FinalScore asc; Yellowface flag required for top entries |

### 10.3 Wall of Shame

Wall of Shame eligibility: FinalScore < 4.50 (F grade) **or** 🚨 Yellowface flag + at least one Major trope.

The Wall of Shame is the tool's primary viral surface. Initial seed entries:

- Mr. Yunioshi — *Breakfast at Tiffany's* (1961) — Mickey Rooney
- Sakini — *The Teahouse of the August Moon* (1956) — Marlon Brando
- Mr. Asano — *A Majority of One* (1961) — Alec Guinness
- Hana-Ogi — *Sayonara* (1957) — Ricardo Montalban
- Lucy Dell / Yoko Mori — *My Geisha* (1962) — Shirley MacLaine
- Mr. Moto — various (1937–1939) — Peter Lorre
- Various — *McHale's Navy* — Tim Conway
- Various — NBC Bob Hope Special (1964) — Bob Hope, Tony Randall, Martha Raye, Jack Jones

Marvel 1940s propaganda era characters to be catalogued separately as a Wall of Shame subcategory.

### 10.4 Hall of Fame

Hall of Fame eligibility: FinalScore ≥ 8.50 (A+ grade) with ≥5 analyses.

Initial seed entries to evaluate:

- Mr. Miyagi — *The Karate Kid* (1984) — Pat Morita
- Dr. Ishirō Serizawa — *Godzilla* (1954)
- Mako Mori — *Pacific Rim* (2013) — Rinko Kikuchi

---

## 11. Functional Requirements

### F1 Character Analysis Engine

| ID | Requirement | Acceptance Criteria |
|---|---|---|
| F1.1 | Input form | Character name + media title; optional: era/decade, media type, character gender flag (for register display) |
| F1.2 | AI request | Single POST to Claude Sonnet 4 with structured prompt; includes rubric version + model version |
| F1.3 | Response parse | Valid JSON: per-rule score, per-rule rationale, detected tropes (IDs + severity + register), subversion notes, suggestions, Q5 flag |
| F1.4 | Scoring computation | System computes Q1–Q4 BaseScore, TropePenalty, TropeBonus, PenaltyCap, FinalScore, Grade, WeightedLeaderboardScore |
| F1.5 | Persistence | Record inserted in Supabase with unique characterKey; versioned if exists |
| F1.6 | Rate limiting | 3 new analyses/minute anonymous; 10/minute logged-in |
| F1.7 | Bulk runner | Admin CSV upload (character, media); sequential processing; status page |
| F1.8 | Rule suggestion form | Fields: Rule ID, proposed change, rationale (min 50 chars), evidence links |
| F1.9 | Caching | 24-hour cache on identical characterKey to avoid redundant AI calls |

### F2 Database & Persistence

Tables: `characters`, `analyses`, `tropes`, `trope_submissions`, `rule_suggestions`, `votes`, `users`, `bulk_jobs`, `bulk_items`, `audit_logs`, `model_versions`, `media_properties`, `character_associations`, `character_shares`, `glossary_terms`, `critic_applications`

### F3 Comparative View

- Search autocomplete for existing characters
- Side-by-side table: all rule scores, FinalScore, Grade, Q5 flag, detected tropes with overlap highlight
- Delta indicator vs. highest-scoring character per rule
- Up to 3 characters simultaneously

### F4 Transparency Page

- Current rubric version with full sub-criteria
- Trope taxonomy v-current with all fields
- Model version log (modelName, provider, released_at, promptTemplateVersion)
- Last monthly audit summary
- Open polls (if any)
- Submission forms: rule change, new trope, new glossary term
- Link to GitHub wiki

### F5 Voting, Disputes & Critic System

- Rule cards show AI score + rationale + three-tier score display
- Voting buttons: agree / disagree / indifferent (login required)
- Dispute button on each detected trope → modal (reason text)
- Critic application form (criteria displayed)
- Admin critic approval queue

### F6 Authentication

- Optional Google / Apple via Supabase Auth
- Anonymous: run analyses (rate limited), view data
- Logged-in: voting, submissions, disputes
- Critic: elevated vote weight, editorial submissions
- Admin: full access

### F7 Admin Console

- Approve / reject trope submissions and rule suggestions
- Critic application approval
- Bulk job upload and status
- Internal CSV export of analyses
- Wall of Shame / Hall of Fame manual curation flags

### F8 List & Detail Views

| ID | Requirement | Acceptance Criteria |
|---|---|---|
| F8.1 | Character list | Paginated grid (20/page): name, media, FinalScore, Grade badge, Q5 flag, thumbnail |
| F8.2 | Baseball card detail | Character image, three-tier scores, rule breakdown, trope badges with register icons, Q5 flag, sharing buttons, trajectory arrow |
| F8.3 | Media property pages | All characters from same media with comparative scoring |
| F8.4 | Character lookup | Autocomplete returns existing analyses before offering "Analyze New" |
| F8.5 | Wall of Shame page | Dedicated view, sorted by damage, Yellowface highlighted, seed entries pre-loaded |
| F8.6 | Hall of Fame page | Dedicated view, sorted by score, editorial essay links |
| F8.7 | Leaderboard page | All six views (§10.2) with tab navigation |

### F9 Social Sharing & Embedding

| ID | Requirement | Acceptance Criteria |
|---|---|---|
| F9.1 | Baseball card embed | MediaWiki-compatible iframe with responsive sizing |
| F9.2 | Social sharing | Open Graph + Twitter Cards with character image and score |
| F9.3 | Share URL | Clean URLs: `/character/[character-key]` |
| F9.4 | Share analytics | Platform share counts, no personal data |

### F10 Glossary

| ID | Requirement | Acceptance Criteria |
|---|---|---|
| F10.1 | Glossary page | Searchable A–Z index of terms: representation concepts, trope names, test names, Japanese cultural terms |
| F10.2 | Term detail | Definition, examples, register tag if applicable, related tropes, source links |
| F10.3 | Community submission | Logged-in users submit new terms; admin approval queue |
| F10.4 | Seed content | All 34 tropes, all 5 rules, key test names (Bechdel, Mako Mori, etc.), key Japanese terms used in analyses |

---

## 12. GitHub Wiki Integration

### 12.1 Repository Structure

```
github.com/japanifornia/serizawa-test/
├── README.md                    ← app link, quick-start, CC BY license
├── LICENSE                      ← CC BY 4.0 full text
├── CONTRIBUTING.md              ← how to submit tropes, dispute, propose rules
├── CHANGELOG.md                 ← rubric version history
└── wiki/
    ├── Home.md                  ← mission, lineage, credits
    ├── The-Serizawa-Five.md     ← question rationale, sub-criteria, scoring logic
    ├── Trope-Taxonomy.md        ← AUTO-GENERATED nightly
    ├── Tonal-Register-Guide.md  ← 🚨 📚 😂 explained
    ├── Scoring-Algorithm.md     ← formula, grade bands, confidence weighting
    ├── Model-Version-Log.md     ← AUTO-GENERATED nightly
    ├── Grade-Distribution.md    ← AUTO-GENERATED nightly
    ├── Worked-Examples.md       ← top 5 + bottom 5 AUTO-GENERATED; essays manual
    ├── Wall-of-Shame/
    │   ├── Index.md             ← AUTO-GENERATED
    │   ├── Mr-Yunioshi.md       ← manual essay
    │   ├── Marlon-Brando-Sakini.md  ← manual essay
    │   └── [others].md
    ├── Hall-of-Fame/
    │   ├── Index.md             ← AUTO-GENERATED
    │   ├── Mr-Miyagi.md         ← manual essay
    │   └── [others].md
    ├── Era-Guides/
    │   ├── 1940s-Propaganda-Era.md   ← manual
    │   ├── 1950s-1960s-Yellowface.md ← manual
    │   ├── 1980s-Martial-Arts-Boom.md ← manual
    │   └── Post-2020-Reckoning.md    ← manual
    ├── Credits-and-Influences.md    ← manual
    └── How-to-Contribute.md         ← manual
```

### 12.2 Auto-Generation

GitHub Action runs nightly, pulling from Supabase and committing updated markdown files.

**Auto-generated pages:** Trope Taxonomy, Model Version Log, Grade Distribution statistics, Worked Examples index (top/bottom 5 by score), Wall of Shame index, Hall of Fame index.

**Trigger:** Nightly cron + on-demand webhook from admin console (e.g., after bulk import completes).

### 12.3 Bidirectional Linking

- App Transparency page → links to all wiki sections
- Wiki Home → links to live app
- Every trope in the app UI → links to its wiki taxonomy entry
- Every character result → links to its wiki worked example (if one exists)

### 12.4 Contribution via GitHub Issues

Trope submissions and rule suggestions made via the app are mirrored to GitHub Issues via webhook, enabling the open-source community to participate without needing an app account. Issue templates provided for: new trope submission, rule change proposal, worked example request.

---

## 13. Non-Functional Requirements

| Category | Requirement | Target |
|---|---|---|
| Performance | New analysis response time | ≤30s p95 |
| Performance | Page load time | ≤2s p95 |
| Performance | API response (non-AI) | ≤500ms p95 |
| Availability | Single-region initial | Best-effort |
| Accessibility | WCAG 2.1 AA | Pass manual audit |
| Security | HTTPS, Supabase auth tokens, role-based admin | ✔ |
| Privacy | No IP storage, no client tracking scripts, minimal PII | ✔ |
| Observability | Server logs (analysis success/failure counts), admin audit logs | ✔ |
| Model Governance | Monthly 20-sample human audit; version logging | ✔ |

---

## 14. Data Model

### Core Schema

```sql
-- Media properties
CREATE TABLE media_properties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(200) NOT NULL,
  media_type VARCHAR(50),        -- film, tv_series, comics, animation, game
  release_year INTEGER,
  decade VARCHAR(10),            -- '1940s', '1950s', etc. for era filtering
  genre VARCHAR(100),
  country_of_origin VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Characters
CREATE TABLE characters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  character_key VARCHAR(300) UNIQUE NOT NULL,
  name VARCHAR(200) NOT NULL,
  media_property_id UUID REFERENCES media_properties(id),
  character_image_url TEXT,
  gender_flag VARCHAR(20),       -- for register display logic
  first_analyzed_at TIMESTAMP,
  latest_analysis_id UUID,
  latest_final_score DECIMAL(4,2),
  latest_grade VARCHAR(2),
  q5_flag VARCHAR(20),           -- authentic, approximate, yellowface
  wall_of_shame BOOLEAN DEFAULT FALSE,
  hall_of_fame BOOLEAN DEFAULT FALSE,
  lookup_count INTEGER DEFAULT 0,
  view_count INTEGER DEFAULT 0,
  share_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Analyses
CREATE TABLE analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  character_id UUID REFERENCES characters(id),
  q1_score DECIMAL(3,2), q1_rationale TEXT,
  q2_score DECIMAL(3,2), q2_rationale TEXT,
  q3_score DECIMAL(3,2), q3_rationale TEXT,
  q4_score DECIMAL(3,2), q4_rationale TEXT,
  q5_flag VARCHAR(20),   q5_notes TEXT,
  base_score DECIMAL(4,2),
  trope_penalty DECIMAL(4,2),
  trope_bonus DECIMAL(4,2),
  final_score DECIMAL(4,2),
  grade VARCHAR(2),
  tropes JSONB,                  -- array of {id, name, severity, register}
  subversions JSONB,             -- array of {trope_id, description}
  suggestions TEXT,
  rubric_version VARCHAR(20),
  model_version VARCHAR(50),
  prompt_template_version VARCHAR(20),
  processing_duration_ms INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Three-tier votes
CREATE TABLE votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  analysis_id UUID REFERENCES analyses(id),
  user_id UUID REFERENCES users(id),
  rule VARCHAR(5),               -- q1, q2, q3, q4
  vote VARCHAR(20),              -- agree, disagree, indifferent
  is_critic BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(analysis_id, user_id, rule)
);

-- Trope taxonomy
CREATE TABLE tropes (
  id VARCHAR(10) PRIMARY KEY,    -- T001, T002, etc.
  name VARCHAR(100) NOT NULL,
  category VARCHAR(50),
  description TEXT,
  register VARCHAR(20),          -- trigger, teachable, mockery, dual
  severity VARCHAR(10),          -- minor, moderate, major
  penalty DECIMAL(3,2),
  tvtropes_slug VARCHAR(100),
  japanifornia_note TEXT,
  source_ref TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Glossary
CREATE TABLE glossary_terms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  term VARCHAR(100) NOT NULL,
  definition TEXT NOT NULL,
  examples TEXT,
  register VARCHAR(20),
  related_tropes TEXT[],
  source_links TEXT[],
  status VARCHAR(20) DEFAULT 'pending',  -- pending, accepted, rejected
  submitted_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Critic applications
CREATE TABLE critic_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  rationale TEXT,
  status VARCHAR(20) DEFAULT 'pending',
  reviewed_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Character Key Normalization

```javascript
function normalizeCharacterKey(characterName, mediaTitle) {
  const normalize = (str) => str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '_')
    .substring(0, 100);
  return `${normalize(characterName)}|${normalize(mediaTitle)}`;
}

// Examples:
// "Mr. Miyagi" + "The Karate Kid (1984)" → "mr_miyagi|the_karate_kid_1984"
// "Psylocke" + "X-Men Comics" → "psylocke|x_men_comics"
```

---

## 15. AI Governance & Quality

### Logged Metadata

Every analysis records: `analysis_id`, `characterKey`, `rubricVersion`, `modelName`, `modelVersionDate`, `promptTemplateVersion`, `processing_duration_ms`

### Monthly Audit Workflow

Random sample of 20 analyses → expert rescoring → compute agreement per rule and overall → publish summary (precision, disagreement rationale categories) on Transparency page and GitHub wiki.

### Drift Threshold

<80% rule agreement or <95% FinalScore within ±0.25 triggers prompt review and potential rubric clarification.

### User Feedback Loop

Disputes categorized: false positive trope, missed trope, score inflation, score deflation. Metrics included in monthly audit.

### Raw Data Storage

Raw AI prompt and raw response stored in secured `analysis_raw` table for audit purposes (not publicly accessible).

---

## 16. User Flows

1. **Anonymous analysis:** Home → character/media input → submit → loading → results (scores + tropes + register tags + suggestions + Q5 flag) → prompt to login for voting
2. **Voting (logged-in):** Results page rule card → agree/disagree/indifferent → optimistic UI update → community score recalculates
3. **Critic review:** Critic logs in → navigates to character → scores each rule independently → Critic Score updates
4. **Trope dispute:** Trope pill → dispute button → modal (reason) → submit → confirmation → admin queue
5. **New trope submission:** Transparency page or glossary → form → validation → pending status
6. **Glossary contribution:** Glossary page → submit term → form → pending moderation
7. **Comparative view:** Search/autocomplete → add to comparison deck (max 3) → dynamic table
8. **Leaderboard browse:** Leaderboard page → tab to view → click character → detail page
9. **Wall of Shame browse:** Wall of Shame page → entries sorted by damage → click for full baseball card + essay link
10. **Bulk import (admin):** Upload CSV → parse preview → confirm → processing queue → progress list

---

## 17. Privacy & Compliance

**Data collected:** Character and media inputs, analysis scores and rationales, trope detections, user-submitted feedback, optional auth email, votes, glossary submissions.

**Not collected:** IP addresses, geolocation, third-party tracking cookies, behavioral analytics.

**Storage:** All persisted in Supabase (managed Postgres). Retention indefinite until framework revision requires migration.

**User control:** Users can request deletion of their submissions and votes (manual Phase 1).

**Disclaimer:** Displayed on every results page — *"The Serizawa Test is an interpretive tool for entertainment and cultural discussion. It is not an academically peer-reviewed instrument. Use scores directionally; always consult source material."*

---

## 18. Analytics Plan

Aggregate counts via server-side DB queries only. No client instrumentation. Weekly script snapshots metrics to `audit_logs`. High-level stats published on Transparency page: characters analyzed, top 10 by lookup, most disputed trope, Wall of Shame vs. Hall of Fame ratio, three-tier score divergence leaderboard.

---

## 19. Risks & Mitigations

| Risk | Impact | Likelihood | Mitigation |
|---|---|---|---|
| AI hallucinated character details | Mis-scoring | Medium | "Verify source material" disclaimer on all results; user dispute mechanism |
| Community brigading on votes | Skewed consensus | Low–Med | Rate-limit votes per user per day; outlier monitoring |
| Trope taxonomy bloat | Complexity / noise | Medium | Moderation queue; ≥3 supporting votes for acceptance |
| Wall of Shame legal sensitivity | Reputation | Low | All entries are public figures in public works; entertainment disclaimer prominent |
| Deadline risk (solo dev) | Scope slip | High | Freeze scope after PRD approval; stretch items explicitly optional |
| Model drift | Reduced agreement | Medium | Monthly audits + version logging |
| Score misinterpretation as academic authority | Reputation | Low | Prominent entertainment disclaimer; GitHub wiki explains methodology |
| Critic tier gaming | Inflated status | Low | Admin approval required; criteria transparent |
| GitHub wiki auto-generation failures | Stale data | Low | GitHub Action monitoring; manual fallback |

---

## 20. Release Plan

| Week | Milestones |
|---|---|
| 0–0.5 | Finalize PRD, Supabase schema, auth integration, prompt templates, GitHub repo init |
| 0.5–1 | Core analysis flow (F1), persistence, results UI, trope taxonomy seed, Q5 flag display |
| 1–1.5 | Three-tier voting, disputes, submissions, comparative view, transparency page, glossary seed |
| 1.5–2 | Leaderboard (all views), Wall of Shame page, Hall of Fame page, admin console, bulk import |
| 2 | GitHub wiki manual pages authored, auto-generation Action deployed, accessibility pass, soft launch |
| Week 3–4 | Trajectory arrows, consensus delta visualization, Wall of Shame seed essays, initial audit |

---

## 21. Technical Architecture

### Frontend

**Next.js 14** with App Router — SSR for SEO, built-in API routes, TypeScript, social sharing optimization.  
**UI:** Tailwind CSS + Headless UI (accessibility compliance)  
**State:** React Query (server state) + Zustand (client state)

### Backend

**Serverless API Routes** via Next.js  
**Database:** Supabase (PostgreSQL) with Row Level Security  
**Auth:** Supabase Auth (Google/Apple OAuth)  
**Storage:** Supabase Storage (character images)  
**Background Jobs:** Vercel Cron + Supabase Edge Functions (bulk processing, nightly wiki sync)  
**Cache:** Upstash Redis (24-hour analysis cache)

### AI Integration

**Provider:** Anthropic Claude Sonnet 4 (`claude-sonnet-4-20250514`)  
**Prompt versioning:** Stored in `prompt_templates` table  
**Response format:** Structured JSON — rule scores, rationales, trope detections with IDs and register tags, Q5 flag, suggestions  
**Fallback:** Graceful degradation with cached analysis display

### Deployment

**Platform:** Vercel  
**Environments:** Production, Staging, Development  
**CDN:** Vercel Edge Network  
**Monitoring:** Vercel Analytics + Supabase Dashboard  
**Backup:** Daily Supabase backups, 30-day retention

### API Endpoints

```
/api/
├── characters/
│   ├── search              GET  autocomplete
│   ├── [key]               GET  character details + all scores
│   ├── [key]/analyze       POST trigger new analysis
│   └── [key]/share         POST log share event
├── analysis/
│   ├── [id]/vote           POST rule voting
│   └── bulk                POST admin bulk upload
├── leaderboard/
│   ├── top                 GET  confidence-weighted all-time
│   ├── wall-of-shame       GET  lowest scores + yellowface
│   ├── hall-of-fame        GET  highest scores
│   ├── most-improved       GET  trajectory delta
│   └── most-analyzed       GET  lookup count
├── glossary/
│   ├── search              GET  term search
│   └── submit              POST new term submission
└── admin/
    ├── moderate            GET/POST trope + rule moderation
    ├── critics             GET/POST critic applications
    └── analytics           GET  aggregate stats
```

### Component Architecture

```
components/
├── character/
│   ├── CharacterCard.tsx          baseball card
│   ├── CharacterList.tsx          grid with filters
│   ├── CharacterSearch.tsx        autocomplete
│   └── CharacterEmbed.tsx         MediaWiki wrapper
├── analysis/
│   ├── AnalysisForm.tsx           input + validation
│   ├── AnalysisResults.tsx        three-tier scores + voting
│   ├── RuleCard.tsx               individual rule with voting
│   └── TropePill.tsx              trope badge with register icon + dispute
├── scores/
│   ├── ThreeTierDisplay.tsx       AI / Critics / Audience
│   ├── ScoreBadge.tsx             grade display
│   └── TrajectoryArrow.tsx        delta indicator
├── leaderboard/
│   ├── LeaderboardTabs.tsx        six-view navigation
│   ├── WallOfShame.tsx            dedicated shame display
│   └── HallOfFame.tsx             dedicated fame display
├── glossary/
│   ├── GlossaryIndex.tsx          A–Z searchable
│   └── TermDetail.tsx             full term page
└── layout/
    ├── Header.tsx                 nav + search
    ├── Footer.tsx                 links + disclaimer
    └── SEOHead.tsx                meta tags + OG
```

### SEO & Social

```html
<meta property="og:title" 
  content="Mr. Miyagi (The Karate Kid) — Serizawa Score: 8.8/10 · Grade A" />
<meta property="og:description" 
  content="AI analysis of Japanese character representation with community validation. 
           Tropes detected: All Asians Know Martial Arts (subverted). Q5: ✅ Authentic." />
<meta property="og:image" content="/api/og/character/mr_miyagi|the_karate_kid_1984.png" />
<meta name="twitter:card" content="summary_large_image" />
```

Dynamic OG image generation via `@vercel/og`: character name + three-tier scores + grade + Q5 flag + Serizawa Test branding.

---

## 22. Future Roadmap

1. Historical tracking visuals (time-series per character — trajectory over rubric versions)
2. Consensus-adjusted score variant (optional toggle)
3. Batch public API (admin-controlled, CC BY attribution required)
4. Extended media types (video games, animation, manga)
5. Cross-ethnicity adaptation framework (modular rule sets — Korean, Chinese, South Asian)
6. Japanese localization
7. Predictive trend modeling (ML on trope occurrence over time)
8. Academic export format (structured citation-ready data)

---

## 23. Glossary

| Term | Definition |
|---|---|
| Agency | Character initiates meaningful actions that influence narrative outcome |
| Authenticity (Cultural) | Presence of accurate, contextually appropriate Japanese cultural elements integrated organically, not as ornamental exoticism |
| Baseball Card | Character detail view displaying scores, tropes, Q5 flag, and sharing options |
| Confidence-Weighted Score | Bayesian-averaged score that pulls toward the global mean until sufficient analyses exist — prevents low-sample outliers dominating leaderboards |
| Critic Score | Aggregate score from verified community reviewers; displayed alongside AI Score |
| Dispute | User-submitted claim that a detected trope or rule score is inaccurate |
| Final Score | BaseScore minus capped TropePenalty plus TropeBonus; range 0.00–10.00 |
| Hall of Fame | Characters scoring A+ (≥8.50) with ≥5 analyses |
| Nikkei | Japanese emigrants and their descendants living outside Japan |
| Q5 Flag | Production authenticity indicator: Authentic / Approximate / Yellowface — displayed separately, never averaged into FinalScore |
| Register | Tonal treatment tag: 🚨 Trigger Warning / 📚 Teachable Moment / 😂 Ruthless Mockery |
| Severity | Assessed impact level of a detected trope: Minor / Moderate / Major |
| Subversion Bonus | Score addition when a character demonstrably deconstructs a trope rather than simply avoiding it |
| Trope | Recognizable recurring narrative device; in this context, harmful or flattening patterns diminishing individuality or cultural authenticity |
| Wall of Shame | Characters scoring F (<4.50) or carrying Yellowface flag + Major trope |
| Yellowface | Non-Asian actor cast in an Asian role |

---

## 24. Appendices

### Appendix A: Detailed Sub-Criteria Acceptance Criteria

*(To be drafted with concrete boolean heuristics per rule — see §8.2 for current expansion)*

### Appendix B: Worked Examples

Three canonical characters to be fully scored and published at launch:

1. Mr. Miyagi — *The Karate Kid* (1984) — expected A / A–
2. Mr. Yunioshi — *Breakfast at Tiffany's* (1961) — expected F / Wall of Shame
3. Mako Mori — *Pacific Rim* (2013) — expected A / A+

### Appendix C: Rubric Versioning Log

| Version | Date | Summary of changes |
|---|---|---|
| 0.0.1 | PRD v02 | Initial five-rule framework |
| 0.1.0 | PRD v03 | Sub-criteria expansion; Q5 flag separation; three-tier scoring; 34-trope taxonomy; tonal register system; confidence-weighted leaderboard; GitHub wiki integration |

### Appendix D: Prompt Template v1

*(Prompt engineering spec for Claude Sonnet 4 — to be authored in Cursor alongside F1.2 implementation. Must produce structured JSON matching F1.3 response schema. Must apply register tags per trope detection. Must evaluate subversion candidates explicitly.)*

### Appendix E: AI Scoring Calibration Notes

Key edge cases for prompt engineering:

- **Temporal split characters** (e.g., Psylocke): prompt must accept era parameter and score for specified era, not averaging across publication history
- **Q3 subversion detection**: model must distinguish genuine narrative deconstruction from superficial trope presence with softening dialogue
- **Q4 irreversibility test (4c)**: model must identify whether a decision can be undone by another character — not just whether the character acts
- **Register assignment**: model must assign register tags to each detected trope from the taxonomy, not invent new ones

---

*The Serizawa Test is an interpretive tool for entertainment and cultural discussion. It is not an academically peer-reviewed instrument. Use scores directionally; always consult source material.*

*Framework and rules licensed CC BY 4.0 — open usage with attribution to Japanifornia / Serizawa Test.*

*Named for Dr. Ishirō Serizawa — tragic scientist, moral philosopher, man whose decision ends the story. That's narrative gravity.*
