# Serizawa Test — App Source (`/src`)

This is the Next.js 14 application for the Serizawa Test.

**For project overview, scoring rubric, and documentation:** see [`../README.md`](../README.md)  
**For AI assistant context:** see [`../CLAUDE.md`](../CLAUDE.md)  
**For roadmap:** see [`../TODO.md`](../TODO.md)

---

## Local Development

```bash
# From this directory (/src)
npm install
cp .env.local.example .env.local   # fill in your keys — see below
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Environment Variables

Copy `.env.local.example` to `.env.local` and fill in:

| Variable | Where to get it |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase Dashboard → Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase Dashboard → Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Dashboard → Settings → API |
| `ANTHROPIC_API_KEY` | [console.anthropic.com](https://console.anthropic.com) |
| `UPSTASH_REDIS_REST_URL` | [upstash.com](https://upstash.com) → Redis → REST API |
| `UPSTASH_REDIS_REST_TOKEN` | [upstash.com](https://upstash.com) → Redis → REST API |
| `CRON_SECRET` | Any strong random string (`openssl rand -hex 32`) |

### Database Setup

Run migrations against your Supabase project:

```bash
supabase link --project-ref YOUR_PROJECT_REF
supabase db push
```

Or paste `supabase/migrations/` SQL files into the Supabase SQL Editor manually.

---

## Project Structure

```
src/app/                   Pages and API routes (Next.js App Router)
  page.tsx                 Home — search input, presets, leaderboard teasers
  analyze/[key]/page.tsx   Analysis loading screen
  character/[key]/page.tsx Character results (baseball card + rule breakdown)
  leaderboard/             Leaderboard
  compare/                 Side-by-side character compare
  transparency/            Open rubric, model log, submission forms
  glossary/                A–Z trope + concept glossary
  admin/                   Admin console (role-gated)
  admin/bulk-import/       CSV bulk character import
  api/characters/[key]/analyze/   Core analysis endpoint (calls Claude)
  api/characters/[key]/share/     Share URL + MediaWiki embed
  api/admin/bulk/          Bulk job create + status polling
  api/cron/bulk/           Vercel cron handler — processes 1 item/min
  api/og/[key]/            Dynamic Open Graph image

src/lib/
  scoring.ts               ALL score math — do not put score logic elsewhere
  analysis/persist.ts      Supabase write after analysis completes
  characters.ts            normalizeCharacterKey()
  display.ts               displayScore() / displayQScore() — 0-10 → 0-100/0-20
  redis.ts                 Upstash client
  ratelimit.ts             Rate limiters (3/min anon, 10/min authed)
  supabase/                Browser + server clients, hand-authored types

src/components/
  card/BaseballCard.tsx    Main results card (flip animation)
  results/RuleCard.tsx     Collapsible per-rule score card (Q1–Q5)
  character/CharacterCard.tsx   Mini card for grids

supabase/migrations/       SQL schema — run in order
scripts/                   generate-wiki.mjs (nightly GitHub wiki generation)
```

---

## Key Conventions

- **Scores:** `DECIMAL(4,2)` always. Display on 0–100 scale via `displayScore()`.
- **Character keys:** `character_name|media_title` — always use `normalizeCharacterKey()`
- **Route params with `|`:** always `decodeURIComponent(params.key)` before DB queries
- **Scoring logic:** `/lib/scoring.ts` only — never inline
- **Prompt template:** stored in Supabase `prompt_templates` table, not in code

## Triggering the Cron Locally

```bash
curl -H "Authorization: Bearer YOUR_CRON_SECRET" \
  http://localhost:3000/api/cron/bulk
```
