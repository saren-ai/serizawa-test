# The Serizawa Test

**An open, AI-assisted framework for evaluating Japanese and Japanese-American character representation in Western-produced media.**

Named for Dr. Ishirō Serizawa — 1954 *Godzilla* — the brooding scientist whose decision ends the story. Not a sidekick. Not comic relief. Not decorative. Load-bearing.

> *"For entertainment & insight, not peer-reviewed research."*

[![License: CC BY 4.0](https://img.shields.io/badge/License-CC%20BY%204.0-lightgrey.svg)](https://creativecommons.org/licenses/by/4.0/)

---

## What It Does

The Serizawa Test scores Japanese and Nikkei characters in Western media on a **0–10 weighted scale** using five structured criteria — the Serizawa Five. It combines:

- **AI analysis** via Claude Sonnet 4 applying the Serizawa Framework
- **Community validation** through a three-tier scoring system (AI / Critics / Audience)
- **Trope detection** against a 34-entry taxonomy with tonal register tags (🚨 📚 😂)
- **Longitudinal tracking** — every analysis is versioned and auditable
- **A confidence-weighted leaderboard** with a Wall of Shame and Hall of Fame

---

## The Serizawa Five

| Rule | Name | Core question |
|---|---|---|
| Q1 | Human Individuality | Does this character have goals, flaws, and an inner life independent of their ethnicity? |
| Q2 | Distinctly Japanese Identity | Is Japaneseness expressed through psychology and specificity — not props and pan-Asian blur? |
| Q3 | Avoidance of Harmful Tropes | Does the portrayal avoid or subvert the Serizawa Trope Taxonomy? |
| Q4 | Narrative Impact | Is this character load-bearing, or narrative furniture? |
| Q5 | Ethnic Authenticity | Is the character played by a Japanese or Japanese-American actor? *(flag only — not scored)* |

Full rubric, sub-criteria, and scoring algorithm: [The Serizawa Five](wiki/The-Serizawa-Five.md)

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
- **Supabase** (Postgres + Auth + Storage)
- **Anthropic Claude Sonnet 4** (`claude-sonnet-4-20250514`)
- **Upstash Redis** (analysis cache)
- **Vercel** deployment

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

## Grade Bands

| Score | Grade | Label |
|---|---|---|
| ≥ 8.50 | A+ | Load-bearing |
| 7.50–8.49 | A | Strong pass |
| 6.50–7.49 | B | Present but underwritten |
| 5.50–6.49 | C | Ornamental |
| 4.50–5.49 | D | Prop with lines |
| < 4.50 | F | Wall of Shame candidate |

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
