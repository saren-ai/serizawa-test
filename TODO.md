# Serizawa Test — Roadmap & TODO

Last updated: 2026-02-27

Status key: ✅ Done · 🔧 In Progress · 🔜 Up Next · 📋 Backlog · 💡 Future

---

## Phase 1 — Core Engine ✅

Everything needed to run a single analysis from home to results.

- ✅ Home page (V01) — search input, preset pills, below-fold teasers
- ✅ Analysis loading screen (V02) — rotating messages, cancel, error states
- ✅ Character results page (V03) — baseball card, rule breakdown, trope pills
- ✅ API route `/api/characters/[key]/analyze` — full Claude integration
- ✅ Scoring engine `/lib/scoring.ts` — Q1–Q5, trope penalties, subversion bonus, grade bands
- ✅ Supabase schema — characters, analyses, tropes, prompt_templates, bulk_jobs/items tables
- ✅ Redis caching — 24-hour analysis cache keyed by character key
- ✅ Rate limiting — 3/min anonymous, 10/min authenticated (fail-open in prod)
- ✅ Character key normalization — `character_name|media_title` via `normalizeCharacterKey()`
- ✅ Analysis persistence — `/lib/analysis/persist.ts`

---

## Phase 2 — Discovery & Ranking ✅

Browse, compare, and rank characters.

- ✅ Leaderboard page (V06) — Bayesian-averaged ranking
- ✅ Compare page (V07) — side-by-side up to 3 characters
- ✅ Hall of Fame (V04) — threshold: FinalScore ≥ 9.30
- ✅ Wall of Shame (V05) — threshold: FinalScore < 6.00
- ✅ Search → Home page (no separate search view — home IS the search)

---

## Phase 3 — Transparency & Glossary ✅

Open framework documentation surfaced in-app.

- ✅ Transparency page (V09) — rubric, algorithm, model version log, submission forms
- ✅ Glossary page (V10) — A–Z search, 34 tropes + 7 concepts seeded
- ✅ Dynamic OG images — `/api/og/[key]` via `@vercel/og`
- ✅ Share endpoint — `/api/characters/[key]/share`

---

## Phase 4 — Admin & Bulk Import ✅

Internal tooling for seeding and moderation.

- ✅ Admin console (V11) — moderation queues (disputes, submissions, critic apps)
- ✅ Bulk import UI — `/admin/bulk-import`, CSV upload, live status board
- ✅ Bulk API — `/api/admin/bulk`, `/api/admin/bulk/[jobId]`
- ✅ Cron handler — `/api/cron/bulk`, 1 item/min, `CRON_SECRET` auth
- ✅ `vercel.json` cron schedule

---

## Phase 5 — Q5 Upgrade & Display Calibration ✅

Scoring system maturation based on v1 feedback.

- ✅ Q5 promoted from flag to scored criterion (Narrative Dignity & Gaze)
- ✅ 13-tier grade band system (A+ through F, high school scale)
- ✅ 0–100 display scale (internal scoring unchanged at 0–10)
- ✅ 0–20 per-question display (max 2.00 internal → max 20 display)
- ✅ Grade badge prominence on baseball card (high-contrast, frosted glass, white text)
- ✅ Model migration: Haiku 3.5 → Haiku 4.5 (`claude-haiku-4-5-20251001`)
- ✅ Dev rate-limit bypass + fail-open production behavior

---

## Phase 6 — UX Polish ✅

Session 2 refinements based on hands-on testing.

- ✅ JSON extraction fix — first `{` to last `}` (handles Claude's markdown + commentary)
- ✅ Q5 sub_scores injection fix — onto `parsed.q5`, not a separate key
- ✅ Anthropic SDK: `maxRetries: 0`, removed prompt caching beta
- ✅ MAX_TOKENS raised to 8192 (full analysis fits)
- ✅ Supabase DB lookup before Claude — existing analyses return instantly
- ✅ Character portrait images — 6 initial portraits in `/public/characters/`
- ✅ Static image map — `character-images.ts` resolves key → file with variant matching
- ✅ "Japanifornia Says..." verdict replaces "Suggestions for improvement"
- ✅ Q1 rule card opens by default (teaches users cards are expandable)
- ✅ Share button moved to upper-right corner
- ✅ Floating pill bar: centered viewport, pill-shaped hover state, animated JP tooltips
- ✅ Search pill navigates to home (no separate /search page)

---

## 🔜 Up Next — Phase 7: Deploy & Seed

Get the app live and populate it with content.

- 🔜 **Deploy to Vercel** (see Deployment Checklist below)
- 🔜 **Switch model to Sonnet 4** (`claude-sonnet-4-20250514`) for production quality
- 🔜 Build initial character CSV — 100+ well-known characters across eras
- 🔜 Run bulk import to seed leaderboard / Hall of Fame / Wall of Shame
- 🔜 Source character portraits for top 50 seeded characters
- 🔜 Prompt template v2 (`ptv_2`) — reflects Q5 as scored criterion

---

## 📋 Backlog — Phase 8: Auth & Community Scoring

The three-tier scoring system needs real users.

- 📋 Supabase Auth setup — Google OAuth + Apple Sign-In
- 📋 Vote UI on character results — agree/disagree/indifferent per rule
- 📋 Critic role — 3× vote weight, application flow at `/profile`
- 📋 Community score display — AI / Critics / Audience in three-tier band
- 📋 Score gap callout — "Critics rate this 1.2pts lower → See disputes"
- 📋 User profile page (V12) — vote history, submissions, Critic status

---

## 📋 Backlog — Phase 9: Trope Dispute System

Community corrections to AI trope detection.

- 📋 Dispute modal on character results — logged-in users only
- 📋 `/api/disputes` endpoint — create, list, vote on disputes
- 📋 Admin moderation queue — approve/reject disputes
- 📋 Dispute resolution affects analysis confidence field
- 📋 Resolved disputes credit toward Critic eligibility

---

## 💡 Future — Possible v2 Features

Not committed. Worth thinking about.

- 💡 **Cross-ethnicity adaptation** — extend framework to other Asian/Pacific Island groups
  (requires new trope taxonomy, separate rubric — not a minor change)
- 💡 **Era-adjusted scoring** — weight historical context differently for pre-1970 media
- 💡 **Director/writer pattern analysis** — aggregate scores by creator, not just character
- 💡 **Comparison to peer frameworks** — auto-run Bechdel, Mako Mori alongside Serizawa
- 💡 **Mobile app** — React Native or PWA with offline cached leaderboard
- 💡 **Embeds** — `<serizawa-card>` web component for third-party sites
- 💡 **API v1** — public rate-limited read API for researchers

---

## Known Issues / Technical Debt

- ⚠️ No auto-generated Supabase types — hand-authored in `/lib/supabase/types.ts`
  (Will need updating whenever schema changes)
- ⚠️ Q5 not yet in `ptv_2` prompt template — analyses still use the old 4-question prompt
  with a default Q5 fallback injected in code
- ⚠️ Bulk import cron requires manual trigger in local dev
  (`curl -H "Authorization: Bearer $CRON_SECRET" localhost:3000/api/cron/bulk`)
- ⚠️ Wall of Shame and Hall of Fame pages use placeholder data until bulk import seeds the DB
- ⚠️ No tests — TDD is the intended workflow but hasn't been applied yet
- ⚠️ "Japanifornia Says..." verdict may disagree with computed grade (by design — option C)

---

## Deployment Checklist

### Prerequisites
1. Vercel account linked to GitHub
2. Supabase project with all migrations applied (001 + 002)
3. `prompt_templates` table has one row with `is_active = true`
4. Upstash Redis instance created
5. Anthropic API key with access to Claude Sonnet 4

### Vercel Setup
1. Import `saren-ai/serizawa-test` repository in Vercel
2. Set root directory to `src` (the Next.js app lives there)
3. Framework preset: **Next.js**
4. Add environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `ANTHROPIC_API_KEY`
   - `UPSTASH_REDIS_REST_URL`
   - `UPSTASH_REDIS_REST_TOKEN`
   - `CRON_SECRET` (generate with `openssl rand -hex 32`)
5. Deploy

### Post-Deploy
1. Change `MODEL` constant to `claude-sonnet-4-20250514` for production quality
2. Verify cron job is registered (Vercel Dashboard → Cron Jobs)
3. Run a test analysis to confirm full pipeline works
4. Set up custom domain if desired
5. Seed initial characters via bulk import
