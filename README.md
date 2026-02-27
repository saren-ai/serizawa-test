# The Serizawa Test

**An open, AI-assisted framework for evaluating Japanese and Japanese-American character representation in Western-produced media.**

Named for Dr. Ishirō Serizawa — 1954 *Godzilla* — the brooding scientist whose decision ends the story. Not a sidekick. Not comic relief. Not decorative. Load-bearing.

> *"For entertainment & insight, not peer-reviewed research."*

[![License: CC BY 4.0](https://img.shields.io/badge/License-CC%20BY%204.0-lightgrey.svg)](https://creativecommons.org/licenses/by/4.0/)

---

## What It Does

The Serizawa Test scores Japanese and Nikkei characters in Western media on a **0–100 display scale** (internally 0–10 weighted) using five structured criteria — the Serizawa Five. It combines:

- **AI analysis** via Claude applying the Serizawa Framework
- **Community validation** through a three-tier scoring system (AI / Critics / Audience)
- **Trope detection** against a 34-entry taxonomy with tonal register tags (🚨 📚 😂)
- **Longitudinal tracking** — every analysis is versioned and auditable
- **A confidence-weighted leaderboard** with a Wall of Shame and Hall of Fame

---

## The Serizawa Five

| Rule | Name | Core question | Weight |
|---|---|---|---|
| Q1 | Human Individuality | Does this character have goals, flaws, and an inner life independent of their ethnicity? | 30% |
| Q2 | Distinctly Japanese Identity | Is Japaneseness expressed through psychology and specificity — not props and pan-Asian blur? | 25% |
| Q3 | Avoidance of Harmful Tropes | Does the portrayal avoid or subvert the Serizawa Trope Taxonomy? | 25% |
| Q4 | Narrative Impact | Is this character load-bearing, or narrative furniture? | 20% |
| Q5 | Narrative Dignity & Gaze | Is the character portrayed with dignity, agency, and free of objectifying framing? | scored separately |

**Q5 sub-criteria:** Gaze & Framing (40%) / Agency & Dignity (35%) / Sexual Objectification Avoidance (25%)

Full rubric, sub-criteria, and scoring algorithm: [The Serizawa Five](wiki/The-Serizawa-Five.md)

---

## Score Display

Scores are displayed on a **0–100 scale** for intuitive reading. All internal calculations use the 0–10 weighted system defined in the rubric.

| Display | Internal | Meaning |
|---|---|---|
| 0–100 | 0–10 | FinalScore (weighted Q1–Q4 + trope penalties/bonuses) |
| 0–20 per rule | 0–2 per rule | Individual question scores |

---

## Grade Bands

13-tier A+–F system aligned to high school grading conventions:

| Score (0–100) | Grade | Label |
|---|---|---|
| ≥ 97 | A+ | Load-bearing |
| 93–96 | A | Excellent |
| 90–92 | A− | Strong pass |
| 87–89 | B+ | Above average |
| 83–86 | B | Solid |
| 80–82 | B− | Present but underwritten |
| 77–79 | C+ | Mixed |
| 73–76 | C | Ornamental |
| 70–72 | C− | Thin |
| 60–69 | D | Prop with lines |
| 50–59 | D− | Barely present |
| < 50 | F | Wall of Shame candidate |

---

## Quick Start

### Run the App Locally

```bash
git clone https://github.com/13ager/serizawa-test.git
cd serizawa-test/src

npm install
cp .env.local.example .env.local   # fill in your own keys
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Required Environment Variables

| Variable | Source |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase project Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase project Settings → API |
| `ANTHROPIC_API_KEY` | [console.anthropic.com](https://console.anthropic.com) |
| `UPSTASH_REDIS_REST_URL` | [upstash.com](https://upstash.com) |
| `UPSTASH_REDIS_REST_TOKEN` | [upstash.com](https://upstash.com) |
| `CRON_SECRET` | Any strong random string (used by Vercel cron auth) |

### Database Setup

```bash
cd src
supabase link --project-ref YOUR_PROJECT_REF
supabase db push
```

---

## Tech Stack

- **Next.js 14** (App Router) + TypeScript
- **Tailwind CSS** + Headless UI
- **Framer Motion** (all animations)
- **Supabase** (Postgres + Auth + Storage + RLS)
- **Anthropic Claude** — Haiku 4.5 (`claude-haiku-4-5-20251001`) for dev, Sonnet 4 (`claude-sonnet-4-20250514`) for production
- **Upstash Redis** (analysis cache + rate limiting)
- **Vercel** deployment + cron jobs

---

## Trope Taxonomy

34 tropes across 6 categories with tonal register tags:

| Register | Symbol | Meaning |
|---|---|---|
| Trigger Warning | 🚨 | Genuine harm — acknowledge before analysis |
| Teachable Moment | 📚 | Usually unintentional ignorance, not malice |
| Ruthless Mockery | 😂 | So lazy, so thoroughly deserving |

Full taxonomy: [Trope-Taxonomy.md](wiki/Trope-Taxonomy.md) *(auto-generated nightly)*

---

## Bulk Import

Admins can queue multiple character analyses via CSV at `/admin/bulk-import`. The system:

1. Parses CSV (character name, media title, year, media type)
2. Creates a job record in `bulk_jobs`
3. Processes one item per minute via Vercel cron (`/api/cron/bulk`)
4. Caches each result in Redis; persists to Supabase on completion

Required database tables: `bulk_jobs`, `bulk_items` (see `supabase/migrations/`).

---

## Lineage & Credits

The Serizawa Test builds on a tradition of representation frameworks:

- Bechdel Test (1985) — Alison Bechdel / Liz Wallace
- Mako Mori Test (2013) — Tumblr user "Chaila"
- Sexy Lamp Test — Kelly Sue DeConnick
- Vito Russo Test — GLAAD
- DuVernay Test (2016) — Manohla Dargis
- Latif Sisters Test (2016) — Nadia & Leila Latif / The Guardian
- Dr. Ishirō Serizawa — 1954 *Godzilla* — the standard we name ourselves after

---

## Security

See [SECURITY.md](SECURITY.md) for responsible disclosure policy.

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for how to:

- Submit a new trope to the taxonomy
- Dispute a misclassified trope detection
- Propose a rubric rule change
- Add a glossary term
- Apply for Critic status

---

## License

Framework, rubric, trope taxonomy, and documentation: **[CC BY 4.0](LICENSE)**
Open usage with attribution to Japanifornia / Serizawa Test.

Application source code: **MIT**

---

*The Serizawa Test is an interpretive tool for entertainment and cultural discussion. It is not an academically peer-reviewed instrument. Use scores directionally; always consult source material.*
