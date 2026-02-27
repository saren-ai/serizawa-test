# CLAUDE.md — Serizawa Test

AI assistant context for working on this codebase. Read this before touching anything.

---

## What This Is

A Next.js 14 app that scores Japanese/Nikkei character representation in Western media using Claude + community voting. Think "Bechdel Test but AI-powered, nuanced, and opinionated."

**Stack:** Next.js 14 App Router · TypeScript · Tailwind CSS · Supabase · Anthropic Claude · Upstash Redis · Vercel

---

## Read These First

The four documents in `/docs/` define everything:

| File | What it governs |
|---|---|
| `docs/serizawa-test-prd-v03.md` | Full product spec, scoring algorithm, trope taxonomy |
| `docs/serizawa-prompt-template-v1.md` | The AI prompt sent to Claude |
| `docs/serizawa-style-guide.md` | Design system, colors, typography, animation |
| `docs/serizawa-ux-flow.md` | Navigation spec, view inventory, click paths |

---

## Project Layout

```
/                          Root — README, CLAUDE.md, TODO.md, CHANGELOG.md
/docs/                     Spec documents (read before coding)
/.github/ISSUE_TEMPLATE/   GitHub issue templates (trope, dispute, rule change, glossary)
/src/                      Next.js app root
  src/app/                 App Router pages and API routes
    page.tsx               Home (V01) — also serves as search
    analyze/[key]/         Analysis loading screen (V02)
    character/[key]/       Results page (V03)
    leaderboard/           Leaderboard (V06)
    compare/               Compare (V07)
    transparency/          Transparency page (V09)
    glossary/              Glossary (V10)
    admin/                 Admin console (V11) — role-gated
    admin/bulk-import/     Bulk CSV import UI
    api/characters/[key]/analyze/   Core analysis endpoint
    api/characters/[key]/share/     Share endpoint
    api/admin/bulk/        Bulk job create + status
    api/cron/bulk/         Vercel cron handler (1 item/min)
    api/og/[key]/          Dynamic OG image generation
  src/lib/
    scoring.ts             THE scoring engine — all score math lives here only
    analysis/persist.ts    Writes analysis results to Supabase
    characters.ts          normalizeCharacterKey() — character_name|media_title
    character-images.ts    Static image map — character key → /public/characters/ file
    display.ts             displayScore() / displayQScore() — 0-10 → 0-100/0-20 conversion
    cache.ts               Redis get/set/invalidate with 24h TTL
    redis.ts               Upstash Redis client
    ratelimit.ts           Rate limiters (3/min anon, 10/min authed)
    supabase/
      client.ts            Browser Supabase client
      server.ts            Server Supabase client
      types.ts             Hand-authored TypeScript types (no generated types)
  src/components/
    card/BaseballCard.tsx  Main results card (front/back flip)
    results/RuleCard.tsx   Collapsible per-rule score card (Q1 opens by default)
    character/CharacterCard.tsx  Mini card for grids/leaderboard
    nav/FloatingPillBar.tsx  Floating bottom nav — 4 items, hover pills, frosted glass
  public/characters/       Character portrait images (600×900, 2:3)
/supabase/migrations/      SQL migrations (run in order)
/scripts/generate-wiki.mjs Nightly wiki generation script
/.github/workflows/        GitHub Actions (wiki-gen.yml)
/vercel.json               Cron schedule for bulk processor
```

---

## Non-Negotiable Rules

### Scoring
- All scores stored as `DECIMAL(4,2)` — never integers, never strings
- **Scoring logic lives in `/lib/scoring.ts` only** — do not put score math anywhere else
- Server-side score recomputation is mandatory — never trust what the model returns for math
- Q5 scores are **not** averaged into FinalScore (they are a companion criterion)
- Trope penalty is capped at 30% of BaseScore
- Subversion bonus is capped at +0.25

### Display
- Scores display on **0–100** scale (multiply internal 0–10 by 10 at render time)
- Per-question scores display on **0–20** (multiply internal 0–2 by 10)
- Use `displayScore()` and `displayQScore()` from `/lib/display.ts` — never inline multiply

### Characters
- Character keys are `character_name|media_title` (pipe-separated, lowercase, underscores)
- Always use `normalizeCharacterKey()` from `/lib/characters.ts`
- Decode `%7C` in route params: `const key = decodeURIComponent(params.key)` before any DB query
- The pipe encodes to `%7C` in URLs — Next.js does NOT auto-decode this in route params

### Character Images
- Portraits live in `/public/characters/` — 600×900px, JPEG/PNG
- `getCharacterImageUrl()` in `/lib/character-images.ts` resolves key → file path
- DB column `character_image_url` takes priority; static map is the fallback
- When adding new images: drop file in folder, add mapping in `character-images.ts`

### Prompt Template
- The prompt lives in the Supabase `prompt_templates` table, not in code
- Log `prompt_template_version` on every analysis record
- Never hardcode the prompt in the API route

### Navigation
- No vertical nav columns — ever
- Floating pill bar only — four destinations maximum (Home, Search→Home, Fame, Shame)
- Search goes to `/#search` (home page IS the search interface)
- See `docs/serizawa-ux-flow.md §2` for full spec

### Design
- Dark mode only — no light mode in v1
- Minimum border radius: `--radius-sm` (8px)
- All animations via Framer Motion
- Bilingual type moments — see `docs/serizawa-style-guide.md §3.3`

---

## Analysis Flow (How a Search Works)

1. **Redis cache check** — instant return on cache hit (24h TTL)
2. **Supabase DB lookup** — if character exists with a completed analysis, return it and re-cache
3. **Rate limiting** — 3/min anon, 10/min authed (bypassed in dev, fail-open in prod)
4. **Fetch prompt template** — from Supabase `prompt_templates` table
5. **Call Claude** — Haiku 4.5 in dev, Sonnet 4 in prod. MAX_TOKENS=8192
6. **Extract JSON** — from first `{` to last `}` (handles markdown fencing and commentary)
7. **Validate schema** — required fields, sub-scores, Q5 flag
8. **Inject Q5 sub_scores** — default neutral scores if model doesn't return scored Q5
9. **Server-side score recomputation** — NEVER trust model math
10. **Persist to Supabase** — character + analysis records
11. **Cache in Redis** — 24h TTL
12. **Return result**

---

## Common Pitfalls

### The Pipe Problem
`character_name|media_title` URLs become `character_name%7Cmedia_title` in the browser.
Next.js App Router does **not** decode `%7C` in `params.key`.
**Always do:** `const key = decodeURIComponent(params.key)` before Supabase queries.

### Claude's JSON Responses
Claude wraps JSON in ` ```json...``` ` fencing and sometimes adds commentary text after
the JSON object. **Never use regex to strip fencing.** Instead extract from first `{` to
last `}` — this handles all edge cases.

### Supabase Types
There are no auto-generated Supabase types. Everything is hand-authored in `/lib/supabase/types.ts`.
When adding DB columns, add to the types file manually.
Use explicit `as` casts for Supabase query results where needed.

### Supabase Joins
Complex `table!foreign_key` join syntax is fragile. Prefer two sequential queries over
a single join when the join involves a foreign key pointing *from* a parent table.
(The `characters.latest_analysis_id → analyses.id` join broke this way — use two queries.)

### Rate Limiting
Rate limiting is bypassed in dev (`NODE_ENV === 'development'`).
In production, Redis errors fail-open (analysis proceeds even if limiter unreachable).
Don't re-add fail-closed behavior without discussing it first.

### Model
Current dev model: `claude-haiku-4-5-20251001`
Production target: `claude-sonnet-4-20250514`
Both are set in `src/app/api/characters/[key]/analyze/route.ts` as `MODEL` constant.
Check [Anthropic model deprecation docs](https://docs.anthropic.com/en/docs/resources/model-deprecations) before assuming a model ID is current.

### Anthropic SDK Configuration
- `maxRetries: 0` — we handle retries in the route loop; SDK retries compound the timeout
- `timeout: 25_000` — 25s per attempt
- Prompt caching beta was removed due to compatibility issues — plain `system: string` now

---

## Environment Variables

| Variable | Used in | Notes |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Browser + server | Public |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Browser + server | Public |
| `SUPABASE_SERVICE_ROLE_KEY` | Server only | Never expose client-side |
| `ANTHROPIC_API_KEY` | `/api/.../analyze` | Server only |
| `UPSTASH_REDIS_REST_URL` | Rate limit + cache | Server only |
| `UPSTASH_REDIS_REST_TOKEN` | Rate limit + cache | Server only |
| `CRON_SECRET` | `/api/cron/bulk` | Any strong random string |

---

## Key Decisions (and Why)

**Why a pipe `|` in character keys?**
Avoids collisions between character and media names. `akira|john_wick_4` is unambiguous.
The URL encoding issue is a known tradeoff.

**Why hand-authored Supabase types?**
The Supabase type generator requires a running project and CLI link. Hand-authored types
are simpler for solo development and explicit about what the app actually uses.

**Why two sequential queries instead of a join?**
Supabase's PostgREST join syntax for FK relationships where the FK lives on the parent table
(`characters.latest_analysis_id`) is unreliable. Two queries are slower but predictable.

**Why is Q5 not in the FinalScore?**
Narrative Dignity & Gaze is a companion lens, not a weighted criterion like Q1–Q4.
Including it in the average would distort scores for characters who scored well on
traditional criteria but were directed through an objectifying gaze — which is exactly
the kind of nuance Q5 is meant to surface, not suppress.

**Why Haiku for dev?**
Sonnet 4 takes 20–40 seconds per analysis. Haiku 4.5 takes 3–8 seconds.
Switch back to Sonnet when doing bulk seeding or accuracy testing.

**Why does the "Japanifornia Says..." verdict sometimes disagree with the grade?**
The verdict is Claude's prose opinion written before server-side score recomputation.
The grade is algorithm. They're allowed to disagree — this is by design (option C).

---

## Cron / Bulk Import

The bulk processor runs at `/api/cron/bulk` every minute via Vercel cron.
Locally: call `curl -H "Authorization: Bearer $CRON_SECRET" http://localhost:3000/api/cron/bulk`
to manually trigger one item.

Vercel requires `CRON_SECRET` to match the Authorization header. Set it in `.env.local`.

---

## Deployment

**Repository:** `saren-ai/serizawa-test` on GitHub  
**Branch:** `feature/serizawa-build`  
**Deploy target:** Vercel  

See TODO.md for deployment checklist.
