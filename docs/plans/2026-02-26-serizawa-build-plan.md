# Serizawa Test — Full Build Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build the complete Serizawa Test application — from Supabase schema to deployable Next.js app with OG image sharing.

**Architecture:** Next.js 14 App Router with Supabase (Postgres + Auth + Storage), Anthropic Claude API for analysis, Upstash Redis for caching/rate-limiting, Vercel for deployment. Scoring logic isolated in `/lib/scoring.ts`. Prompt templates stored in Supabase.

**Tech Stack:** Next.js 14, TypeScript, Tailwind CSS, Supabase, Anthropic `claude-sonnet-4-20250514`, Upstash Redis, Framer Motion, `@vercel/og`, Lucide React

---

## Dependency Order — 27 Steps

---

### Step 1 — Supabase Schema Migration

**What it is:** Write and run the full SQL migration creating all 16 tables with correct types, constraints, RLS stubs, and indexes.

**Files:**
- Create: `supabase/migrations/0001_initial_schema.sql`
- Create: `supabase/seed/001_tropes.sql` ← placeholder, filled in Step 5
- Create: `supabase/seed/002_prompt_templates.sql` ← placeholder, filled in Step 5

**Tables to create (in FK-safe order):**
```sql
-- No-dependency tables first
media_properties
users           -- Supabase auth.users mirror via trigger
prompt_templates
model_versions
audit_logs

-- FK-dependent
characters      -- → media_properties
analyses        -- → characters
votes           -- → analyses, users
tropes
glossary_terms  -- → users (submitted_by)
critic_applications -- → users
bulk_jobs
bulk_items      -- → bulk_jobs
trope_submissions -- → users
rule_suggestions  -- → users
character_shares  -- → characters
analysis_raw    -- → analyses (secured, not public)
```

**Critical constraints:**
- All score columns: `DECIMAL(4,2)` — never `INTEGER` or `FLOAT`
- `characters.character_key` — `VARCHAR(300) UNIQUE NOT NULL`
- `analyses.tropes` — `JSONB`
- `votes` — `UNIQUE(analysis_id, user_id, rule)`
- `prompt_templates` — needs `version VARCHAR(20) PRIMARY KEY`, `system_prompt TEXT`, `user_message_template TEXT`, `rubric_version VARCHAR(20)`, `is_active BOOLEAN DEFAULT FALSE`

**Run:** `supabase db push` or paste into Supabase SQL editor

**Unblocks:** Everything. No other step can begin without the schema. Specifically: Steps 2, 5, 7, 8.

---

### Step 2 — Next.js Project Initialization + Tailwind Design Tokens

**What it is:** `create-next-app` with TypeScript, configure Tailwind with the full Japanifornia token set, import Google Fonts, create CSS custom properties.

**Files:**
- Create: `package.json` (via `npx create-next-app@14`)
- Modify: `tailwind.config.ts` — add all color tokens, font families, border radius, spacing scale
- Modify: `app/globals.css` — CSS custom properties from style-guide §2 + §3 + §4
- Create: `app/layout.tsx` — root layout with font imports, dark bg, `lang="en"`

**Tailwind extensions (exact tokens from style-guide §12):**
```typescript
colors: {
  ink: { 950: '#0A0705', 900: '#140E0A', 800: '#1F1612', 700: '#2E201A', 600: '#4A352C' },
  vermillion: { 600: '#C0392B', 500: '#E74C3C', 400: '#F15A4A', 300: '#F5856E', 100: '#FDE8E6' },
  gold: { 500: '#F0A500', 400: '#F5BC3A', 200: '#FDE9A8' },
  washi: { 100: '#FAF6F1', 200: '#F0E8DF', 300: '#D9CEC4', 400: '#B8A99A' },
  register: { trigger: '#E74C3C', teachable: '#3498DB', mockery: '#F39C12', dual: '#9B59B6' },
  grade: { aplus: '#F0A500', a: '#27AE60', b: '#2ECC71', c: '#F39C12', d: '#E67E22', f: '#E74C3C' },
  q5: { authentic: '#27AE60', approximate: '#F39C12', yellowface: '#E74C3C' }
}
fontFamily: {
  display: ['Bebas Neue', 'Impact', 'sans-serif'],
  body: ['DM Sans', 'Inter', 'sans-serif'],
  jp: ['Noto Sans JP', 'Hiragino Sans', 'Yu Gothic', 'sans-serif'],
  mono: ['JetBrains Mono', 'Fira Code', 'monospace']
}
borderRadius: { sm: '8px', md: '12px', lg: '16px', xl: '24px', '2xl': '32px' }
```

**Google Fonts import in `app/layout.tsx`:** Bebas Neue 400, DM Sans 300/400/500/600/700, Noto Sans JP 400/700, JetBrains Mono 400/500

**Install packages:**
```bash
npm install framer-motion @supabase/supabase-js @supabase/ssr @upstash/redis @upstash/ratelimit @anthropic-ai/sdk
npm install lucide-react
npm install -D @types/node
```

**Environment variables scaffold:**
- Create: `.env.local.example` with keys: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `ANTHROPIC_API_KEY`, `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`

**Unblocks:** All UI work (Steps 9–21). All API routes need the env vars. Design tokens used in every component.

---

### Step 3 — Supabase Auth Setup

**What it is:** Configure Supabase Auth with Google + Apple OAuth providers. Set up middleware for session management. Define user role system.

**Files:**
- Create: `lib/supabase/server.ts` — server-side client using `@supabase/ssr`
- Create: `lib/supabase/client.ts` — browser client
- Create: `middleware.ts` — session refresh on every request
- Create: `lib/auth/roles.ts` — role check helpers (`isAdmin()`, `isCritic()`, `isLoggedIn()`)

**Role system (stored in `users` table, mirrored from auth.users):**
```typescript
type UserRole = 'anonymous' | 'user' | 'critic' | 'admin'
```

**RLS policies needed on:**
- `votes` — INSERT/SELECT own rows only
- `trope_submissions` — INSERT own; SELECT all
- `rule_suggestions` — INSERT own; SELECT all
- `glossary_terms` — INSERT own; SELECT accepted
- `analysis_raw` — SELECT admin only; no public access
- `bulk_jobs` / `bulk_items` — admin only

**Unblocks:** Step 14 (voting UI), Step 24 (admin console), Step 21 (dispute/submission forms). Auth modal in Step 14 depends on this setup.

---

### Step 4 — Upstash Redis + Rate Limiting Middleware

**What it is:** Configure Upstash Redis client. Build rate-limiting middleware that enforces 3 analyses/min (anonymous) and 10/min (logged-in). Cache layer for 24-hour analysis results.

**Files:**
- Create: `lib/redis.ts` — Upstash client singleton
- Create: `lib/ratelimit.ts` — two limiters using `@upstash/ratelimit`
- Modify: `middleware.ts` — apply rate limit check to `/api/characters/*/analyze`

**Rate limit config:**
```typescript
const anonymousLimiter = new Ratelimit({
  redis, limiter: Ratelimit.slidingWindow(3, '1 m'), prefix: 'rl:anon'
})
const userLimiter = new Ratelimit({
  redis, limiter: Ratelimit.slidingWindow(10, '1 m'), prefix: 'rl:user'
})
```

**Cache helpers:**
```typescript
// lib/cache.ts
async function getCachedAnalysis(characterKey: string): Promise<Analysis | null>
async function setCachedAnalysis(characterKey: string, analysis: Analysis): Promise<void>
// TTL: 86400 seconds (24 hours)
// Cache hits do NOT count against rate limit
```

**Unblocks:** Step 8 (analysis API — rate limit and cache are both wired in there).

---

### Step 5 — Seed Data: Trope Taxonomy + Prompt Template

**What it is:** Insert all 34 tropes from PRD §8.4 into the `tropes` table. Insert the `ptv_1` system prompt into `prompt_templates`. Insert initial `model_versions` record.

**Files:**
- Create: `supabase/seed/001_tropes.sql` — 34 `INSERT INTO tropes` statements
- Create: `supabase/seed/002_prompt_templates.sql` — `ptv_1` system prompt + user message template
- Create: `supabase/seed/003_model_versions.sql` — `claude-sonnet-4-20250514` record
- Create: `scripts/seed.ts` — script to run seeds via Supabase service role client

**Trope seed format:**
```sql
INSERT INTO tropes (id, name, category, severity, register, penalty, tvtropes_slug, japanifornia_note) VALUES
('T001', 'Wise Mystic Mentor', 'archetype', 'moderate', 'teachable', 0.10, 'wise_old_master', 'The Miyagi borderline case...'),
('T002', 'Dragon Lady', 'sexualization', 'major', 'trigger', 0.25, 'dragon_lady', 'Alluring, manipulative, exoticized...'),
-- ... all 34 entries
```

**Prompt template seed:**
```sql
INSERT INTO prompt_templates (version, system_prompt, user_message_template, rubric_version, is_active)
VALUES ('ptv_1', '...full system prompt from serizawa-prompt-template-v1.md...', '...user message template...', '0.1.0', true);
```

**Run:** `npx tsx scripts/seed.ts`

**Unblocks:** Step 8 (analysis API reads active prompt template from DB). Step 22 (Transparency page displays trope taxonomy from DB). Step 23 (Glossary seeds use trope data).

---

### Step 6 — `normalizeCharacterKey()` + `/lib/scoring.ts`

**What it is:** Implement the two core library functions with no UI or DB dependencies. These are pure functions — testable in isolation.

**Files:**
- Create: `lib/scoring.ts` — ALL scoring logic lives here only
- Create: `lib/characters.ts` — `normalizeCharacterKey()` and character key helpers

**`normalizeCharacterKey()` from PRD §14:**
```typescript
export function normalizeCharacterKey(characterName: string, mediaTitle: string): string {
  const normalize = (str: string) => str
    .toLowerCase().trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '_')
    .substring(0, 100)
  return `${normalize(characterName)}|${normalize(mediaTitle)}`
}
```

**`/lib/scoring.ts` must implement (server-side recomputation — never trust model math):**
```typescript
export function computeQ1Score(subScores: Q1SubScores): number  // weighted 40/35/25
export function computeQ2Score(subScores: Q2SubScores): number  // weighted 35/35/30
export function computeQ4Score(subScores: Q4SubScores): number  // weighted 40/35/25
export function computeQ3Score(detectedTropes: DetectedTrope[], baseScore: number): Q3Result
// Q3Result: { score, tropePenaltyRaw, penaltyCap, tropeBonus }
// PenaltyCap = min(TropePenaltyRaw, 0.30 × BaseScore)
// TropeBonus = min(subversions.length × 0.10, 0.25)
export function computeBaseScore(q1: number, q2: number, q4: number): number  // q3 base = 2.00
export function computeFinalScore(q1: number, q2: number, q3: number, q4: number): number
export function computeGrade(finalScore: number): Grade  // Grade: 'A+' | 'A' | 'B' | 'C' | 'D' | 'F'
export function computeGradeLabel(grade: Grade): string
export function computeWeightedLeaderboardScore(finalScore: number, analysisCount: number, globalMean: number): number
// Bayesian: (v × R + m × C) / (v + m) where m = 5
```

**All return values:** `DECIMAL(4,2)` — use `Math.round(value * 100) / 100` for precision.

**Unblocks:** Step 8 (analysis API calls these), Step 12 (results page displays output of these). This is the most risk-concentrated code — keep it isolated and pure.

---

### Step 7 — Character Search + Lookup API

**What it is:** Two simple read-only API routes for autocomplete and fetching existing analysis data.

**Files:**
- Create: `app/api/characters/search/route.ts` — `GET ?q=string&limit=10`
- Create: `app/api/characters/[key]/route.ts` — `GET` full character + latest analysis + scores

**Search endpoint:**
```typescript
// GET /api/characters/search?q=miyagi&limit=10
// Returns: Array<{ character_key, name, media_title, final_score, grade, q5_flag }>
// Query: ILIKE on name + media title, JOIN analyses for latest score
// No auth required
```

**Character detail endpoint:**
```typescript
// GET /api/characters/[key]
// Returns: character + media_property + latest analysis + all detected tropes
// Increments view_count (fire-and-forget)
// No auth required
```

**Unblocks:** Step 9 (home page autocomplete), Step 11 (baseball card reads this), Step 17 (leaderboard browse links here).

---

### Step 8 — AI Analysis API Route

**What it is:** The core engine. POST handler that checks cache → rate limits → fetches prompt from DB → calls Claude → validates JSON → recomputes scores server-side → persists → caches → returns.

**Files:**
- Create: `app/api/characters/[key]/analyze/route.ts`
- Create: `lib/analysis/claude.ts` — Claude API call + retry logic
- Create: `lib/analysis/validate.ts` — schema validation (required fields check)
- Create: `lib/analysis/persist.ts` — Supabase write for characters + analyses + analysis_raw

**Full handler flow (from `serizawa-prompt-template-v1.md` §3):**
```
1. Parse body: { characterName, mediaTitle, mediaType, era?, genderFlag?, additionalContext? }
2. normalizeCharacterKey() → characterKey
3. Check Redis cache → if hit, return with fromCache: true (no rate limit check)
4. Check rate limit (anonymous: 3/min, user: 10/min) → 429 if exceeded
5. Fetch active prompt_template (version = 'ptv_1') from Supabase
6. Build user message from template with parameter substitution
7. POST to Claude: model: 'claude-sonnet-4-20250514', max_tokens: 4096, system: systemPrompt
8. JSON.parse(response.content[0].text) → on failure, retry once → on second failure, RecoverableAnalysisError
9. validateAnalysisSchema(parsed) → throw RecoverableAnalysisError if invalid
10. computeScores(parsed) using /lib/scoring.ts — OVERWRITE model's scoring object
11. Upsert media_properties, upsert characters, INSERT analyses, INSERT analysis_raw
12. Update characters.latest_analysis_id, latest_final_score, latest_grade, lookup_count
13. Redis.set(cacheKey, scored, { ex: 86400 })
14. Return scored analysis
```

**Error responses:**
- `429` — rate limited, include `retryAfter` header
- `422` — parse failed after retry
- `504` — Claude timeout (>30s)
- `200` — success, include `fromCache: boolean`

**Unblocks:** Step 10 (home page can now trigger a real analysis), Step 12 (results page has data to render), Step 25 (bulk runner reuses this logic).

---

### Step 9 — Home Page (V01)

**What it is:** The entry point. Full-viewport centered form above the fold. Below-fold teaser columns. Preset pills. Per ux-flow.md §5 V01 and style-guide §8.1.

**Files:**
- Create: `app/page.tsx`
- Create: `components/home/AnalysisForm.tsx` — two inputs + submit button + preset pills
- Create: `components/home/TeaserSection.tsx` — Hall of Fame / Wall of Shame / Recent teasers
- Create: `components/home/PresetPills.tsx` — Mr. Miyagi, Ryu, Lady Deathstrike, Mr. Yunioshi

**Layout:**
- Above fold: `min-h-screen flex items-center justify-center`, max-width 480px
- App name: Bebas Neue 48px `text-washi-100` + JP subtitle `text-vermillion-400`
- Tagline: DM Sans 300 16px `text-washi-300`
- Inputs: 52px height, `border-ink-600 focus:border-vermillion-500`, JP placeholder companions
- Analyze button: full-width pill, `bg-vermillion-500 hover:bg-vermillion-400`, bilingual label
- Below fold: 3-column teaser grid; 3 mini cards per column; "See all →" ghost links
- Footer: ghost links (About · Transparency · Glossary · GitHub · CC BY) + disclaimer

**Framer Motion:**
- Form fields: `initial={{ opacity: 0, y: 12 }}` staggered 100ms each on mount
- Preset pills: fade in at 300ms delay

**On submit:** POST to `/api/characters/[key]/analyze` → push to `/analyze` (V02) → on complete, redirect to `/character/[key]`

**Unblocks:** Step 10 (loading screen is the next state after submit). End-to-end analysis flow becomes testable once Steps 8 + 9 + 10 + 12 are complete.

---

### Step 10 — Analysis Loading Screen (V02)

**What it is:** Full-viewport focus state shown while Claude processes. Rotating messages. No progress bar. Cancel pill.

**Files:**
- Create: `app/analyze/page.tsx` — redirect shell that polls analysis status
- Create: `components/loading/AnalysisLoader.tsx` — full loading UI
- Create: `lib/loading-messages.ts` — 40+ message strings from style-guide §7.1

**Layout:** Full viewport, centered, no scroll, `overflow: hidden`

**Message pool (40+ items, 4 categories):** Trope detection 😂, Narrative analysis 📚, Cultural reverence 🌸, Existential 😂. Randomly selected every 3 seconds without immediate repeat. Each has JP companion text.

**Framer Motion:**
```typescript
// Message swap: opacity 0 → 1, 300ms ease, on exit opacity 1 → 0
// Breathing glow: opacity 0.3 → 0.6, 2s infinite, ease-in-out
// Logo: slow rotation, 3s linear infinite
```

**Polling logic:** `useEffect` polls `/api/characters/[key]/analyze` status every 2s. On complete → `router.replace('/character/[key]')`. On error → render error state with retry.

**Cancel:** Breadcrumb ghost pill top-left → `router.push('/')`, no analysis persisted.

**Unblocks:** Full analysis flow (Home → Loading → Results) becomes navigable.

---

### Step 11 — Baseball Card Component

**What it is:** The single most important UI component. 340×520px portrait card with flip animation. Front shows verdict; back shows rule breakdown. Per style-guide §5.

**Files:**
- Create: `components/character/BaseballCard.tsx` — flip container + both faces
- Create: `components/character/CardFront.tsx` — image, grade badge, score, Q5, trope pills, summary
- Create: `components/character/CardBack.tsx` — rule rows with score bars, three-tier display
- Create: `components/scores/GradeBadge.tsx` — circle badge, bilingual, color by grade
- Create: `components/scores/ScoreBar.tsx` — pill-shaped progress bar with animated fill
- Create: `components/scores/ScoreDisplay.tsx` — count-up animation for final score
- Create: `components/tropes/TropePill.tsx` — register-colored pill with tooltip
- Create: `components/scores/Q5FlagPill.tsx` — flag badge with pulse for Yellowface

**Flip animation (exact spring from style-guide §5.4):**
```typescript
const cardVariants = {
  front: { rotateY: 0, transition: { type: 'spring', stiffness: 80, damping: 18 } },
  back:  { rotateY: 180, transition: { type: 'spring', stiffness: 80, damping: 18 } }
}
// Container: style={{ perspective: 1200 }}
// Both faces: style={{ backfaceVisibility: 'hidden' }}
// Back face initial: rotateY: 180
```

**Score count-up:** `useEffect` animates from 0 to `finalScore` over 800ms ease-out using `requestAnimationFrame`.

**Score bar fill:** Framer Motion `width` from `'0%'` to `finalPct + '%'` over 600ms, staggered 100ms per rule.

**Grade badge entry:** `initial={{ scale: 0 }}` → `animate={{ scale: [0, 1.08, 1] }}` spring.

**Accessibility:** Card has `role="button"`, `aria-label="Character card. Press Enter to flip."`, both faces have hidden ARIA labels. Reduced motion: fade instead of flip via `@media (prefers-reduced-motion)`.

**Unblocks:** Step 12 (results page can now render). Step 27 (OG image generator references the same visual spec).

---

### Step 12 — Character Results Page (V03)

**What it is:** The canonical character URL. Sticky baseball card left, full analysis right. Three-tier score display. Rule breakdown cards. Trope pills. Q5 flag. Suggestions.

**Files:**
- Create: `app/character/[key]/page.tsx` — SSR page, fetches from `/api/characters/[key]`
- Create: `components/analysis/AnalysisResults.tsx` — full right-column layout
- Create: `components/analysis/RuleCard.tsx` — collapsible card per Q1–Q4 with rationale + vote buttons (placeholder for now, wired in Step 14)
- Create: `components/scores/ThreeTierDisplay.tsx` — AI / Critics / Audience row
- Create: `components/analysis/SuggestionsSection.tsx` — collapsible bullet list

**OG meta tags (from style-guide §9.2):**
```typescript
// In page.tsx generateMetadata():
return {
  title: `${name} (${media}) — ${finalScore}/10 · ${grade} | Serizawa Test`,
  openGraph: {
    images: [{ url: `/api/og/${characterKey}.png`, width: 1200, height: 630 }]
  },
  twitter: { card: 'summary_large_image' }
}
```

**Score gap callout:** If `|aiScore - criticScore| > 1.0` or `|aiScore - audienceScore| > 1.0`, show callout: "Critics rate this 1.2pts lower → See disputes"

**Mobile layout:** Single column, card full-width `calc(100vw - 48px)`, rule cards below.

**Disclaimer:** Always present — *"The Serizawa Test is an interpretive tool for entertainment and cultural discussion. It is not an academically peer-reviewed instrument."*

**Unblocks:** Step 13 (floating nav needs pages to navigate between). Step 14 (voting UI goes into `RuleCard`). All discovery flows (Steps 17–20) link here.

---

### Step 13 — Floating Pill Bar (Global Navigation)

**What it is:** The only persistent nav element. 4 destinations. Scroll-triggered appearance. Per ux-flow.md §2 and style-guide (no vertical nav, ever).

**Files:**
- Create: `components/layout/FloatingPillBar.tsx`
- Create: `components/layout/BreadcrumbGhostPill.tsx` — single back pill, top-left
- Modify: `app/layout.tsx` — add `<FloatingPillBar />` and `<BreadcrumbGhostPill />`

**Pill bar spec:**
```typescript
// Position: fixed, bottom: 24px, left: 50%, translateX(-50%)
// Max-width: 280px, radius: full
// Background: rgba(20,14,10,0.85), backdropFilter: blur(12px)
// Border: 1px solid ink-600, zIndex: 100
// Four tabs: Home(/), Search(/search), Fame(/hall-of-fame), Shame(/wall-of-shame)
```

**Scroll behavior (Framer Motion):**
```typescript
// useScroll() → if scrollY < 80: translateY(120%) else translateY(0)
// transition: 300ms ease
```

**Active state:** Current route matches destination → `text-vermillion-500` icon + small red dot.

**User logged in:** Replace 🔍 Search tab with 👤 Profile tab.

**Unblocks:** Navigating between any two views. Complete app navigation graph becomes operational.

---

### Step 14 — Auth Modal + Voting API + Vote UI

**What it is:** Wire up Supabase Auth OAuth modal (stays on page — no redirect). Implement vote API. Add agree/disagree/indifferent buttons to `RuleCard`. Show community score aggregates.

**Files:**
- Create: `app/api/analysis/[id]/vote/route.ts` — POST vote, GET vote summary
- Create: `components/auth/AuthModal.tsx` — Supabase Auth UI, Google + Apple providers
- Modify: `components/analysis/RuleCard.tsx` — add vote buttons, login prompt if logged out
- Create: `components/scores/VoteButtons.tsx` — three-button group with optimistic UI

**Vote API:**
```typescript
// POST /api/analysis/[id]/vote
// Body: { rule: 'q1' | 'q2' | 'q3' | 'q4', vote: 'agree' | 'disagree' | 'indifferent' }
// Auth required: 401 if not logged in
// Upsert into votes (UNIQUE constraint handles idempotency)
// Critic votes: is_critic = true, weight = 3
// User votes: is_critic = false, weight = 1
// Returns: { success: true, updatedCommunityScore }
```

**Community score aggregation (run on every vote):**
```typescript
// Audience score: weighted average of all user votes per rule → aggregate final
// Critic score: weighted average of critic votes (3× weight) per rule
// Only display if ≥3 votes exist (PRD §9.3)
// Store aggregated scores back on analyses table
```

**Optimistic UI:** Vote button immediately reflects selection; revert on API error.

**Unblocks:** Step 15 (three-tier scores become live), Step 21 (disputes need auth). Community score column in `ThreeTierDisplay` becomes populated.

---

### Step 15 — Trope Dispute Flow + Submission Forms

**What it is:** Dispute modal on each trope pill. Trope submission form. Rule suggestion form.

**Files:**
- Create: `app/api/tropes/dispute/route.ts` — POST dispute record
- Create: `app/api/tropes/submit/route.ts` — POST new trope submission  
- Create: `app/api/rules/suggest/route.ts` — POST rule suggestion
- Create: `components/tropes/DisputeModal.tsx` — reason text field + submit
- Modify: `components/tropes/TropePill.tsx` — add dispute button in tooltip (logged-in only)

**Dispute modal trigger:** Trope pill tooltip → `[Dispute this →]` link (logged-in only; otherwise "Sign in to dispute").

**New tables needed (should already exist from Step 1):**
- `trope_submissions`: id, name, category, description, severity, example, source_ref, submitted_by, status
- `rule_suggestions`: id, rule_id, proposed_change, rationale (min 50 chars), evidence_links, submitted_by, status

**Validation:** Rule suggestion rationale: minimum 50 characters (per PRD F1.8).

**Unblocks:** Step 24 (admin console moderates these submissions). Step 22 (Transparency page shows pending community polls).

---

### Step 16 — Wall of Shame Page (V05) + Seed Entries

**What it is:** Dedicated page sorted by damage. Yellowface entries elevated. Pre-seed the 8 canonical entries from PRD §10.3.

**Files:**
- Create: `app/wall-of-shame/page.tsx`
- Create: `supabase/seed/004_wall_of_shame.sql` — 8 seed characters with media properties
- Create: `app/api/leaderboard/wall-of-shame/route.ts` — GET paginated wall of shame
- Create: `components/leaderboard/WallOfShame.tsx`

**Seed entries (PRD §10.3):**
```sql
-- Mr. Yunioshi, Breakfast at Tiffany's (1961)
-- Sakini, The Teahouse of the August Moon (1956) — Marlon Brando
-- Mr. Asano, A Majority of One (1961) — Alec Guinness
-- Hana-Ogi, Sayonara (1957) — Ricardo Montalban
-- Lucy Dell/Yoko Mori, My Geisha (1962) — Shirley MacLaine
-- Mr. Moto, various (1937-1939) — Peter Lorre
-- Various, McHale's Navy — Tim Conway
-- Various, NBC Bob Hope Special (1964)
-- Mark wall_of_shame = TRUE on these characters
```

**Wall of Shame eligibility check (from PRD §10.3):**
```typescript
// Eligible if: finalScore < 4.50 (F grade) OR (q5_flag = 'yellowface' AND hasAtLeastOneMajorTrope)
```

**Page header:** WALL OF SHAME (Bebas Neue, `text-vermillion-500`) / 恥の殿堂. Pulsing red F badges. 🚨 Yellowface banner overlay on eligible entries. Callout box: teachable moments framing.

**Unblocks:** Step 19 (leaderboard links to Wall of Shame). Primary viral surface becomes operational.

---

### Step 17 — Hall of Fame Page (V04) + Seed Entries

**What it is:** Dedicated HOF page. Gold gradient header. Pre-seed the 3 canonical A+ candidates for analysis.

**Files:**
- Create: `app/hall-of-fame/page.tsx`
- Create: `app/api/leaderboard/hall-of-fame/route.ts`
- Create: `supabase/seed/005_hall_of_fame_queue.sql` — queue Mr. Miyagi, Dr. Serizawa, Mako Mori for analysis
- Create: `components/leaderboard/HallOfFame.tsx`

**HOF eligibility:** `finalScore >= 8.50` AND `analysis_count >= 5` (confidence-weighted ranking).

**Gold gradient hero:**
```typescript
// background: linear-gradient(135deg, --color-gold-500/10, transparent)
// Header color: text-gold-500
// Grade badges: gold circle with Bebas Neue
```

**Unblocks:** Step 19 (leaderboard tabs include HOF reference). Hall of Fame share funnel complete.

---

### Step 18 — Leaderboard Page (V06)

**What it is:** Six-tab leaderboard. All API endpoints for each view. Bayesian confidence weighting visible to user.

**Files:**
- Create: `app/leaderboard/page.tsx`
- Create: `app/leaderboard/[view]/page.tsx` — for direct URL to specific tab
- Create: `app/api/leaderboard/top/route.ts` — confidence-weighted all-time
- Create: `app/api/leaderboard/most-improved/route.ts` — delta ascending
- Create: `app/api/leaderboard/most-analyzed/route.ts` — lookup_count desc
- Create: `components/leaderboard/LeaderboardTabs.tsx` — 6-tab horizontal pill nav
- Create: `components/leaderboard/LeaderboardRow.tsx` — rank + mini card + score + trajectory arrow

**Six tabs (PRD §10.2):**
```
🏆 All-time best      WeightedLeaderboardScore desc
📈 Most improved      Delta score desc (requires ≥2 analyses per character)
🗓 By era             Filter by decade
🎬 By media type      Film / TV / Comics / Games
🔥 Most analyzed      lookup_count desc
💀 Wall of Shame      FinalScore asc (links to V05)
```

**Confidence note:** Characters with `analysis_count < 5` shown with `◇` marker.

**Trajectory arrow:** `TrajectoryArrow.tsx` — ↑ (green, +0.5+) ↗ (green, +0.1–0.49) → (gray, -0.09–+0.09) ↘ (red) ↓ (red, -0.5+).

**Unblocks:** Step 20 (search page complements leaderboard for discovery). Full discovery flow operational.

---

### Step 19 — Search / Browse Page (V08)

**What it is:** Full character browsing with filter pills. Empty state with "Analyze this character" CTA. Autocomplete search.

**Files:**
- Create: `app/search/page.tsx`
- Create: `components/character/CharacterList.tsx` — paginated grid, 20/page
- Create: `components/character/CharacterSearch.tsx` — debounced autocomplete, 300ms
- Create: `components/filters/FilterPills.tsx` — reusable horizontal filter pill row

**Filter options:** [ All ] [ Film ] [ TV ] [ Comics ] [ A+ ] [ F ] [ 🚨 Yellowface ] [ 1940s ] [ 1950s ] [ 1980s ] [ Recent ]

**Empty state:**
```
🔍
"No characters matching '[query]' yet."
[ Analyze '[query]' → ] → V01 with pre-filled input
```

**Unblocks:** Complete browse-without-analyzing flow. Used as "add character" flow in Step 20 (Compare).

---

### Step 20 — Compare Page (V07)

**What it is:** Side-by-side comparison of up to 3 characters. URL-parameterized. Trope overlap highlight.

**Files:**
- Create: `app/compare/page.tsx` — reads `?a=`, `?b=`, `?c=` params
- Create: `components/character/CompareView.tsx` — multi-column layout
- Create: `app/api/characters/compare/route.ts` — GET multiple characters by key array
- Modify: `components/analysis/AnalysisResults.tsx` — add Compare action to action tray

**Compare view per column:**
- Mini baseball card (not flippable)
- 4 rule rows: score bars align horizontally, delta shown vs. highest scorer per rule
- Trope overlap: shared tropes in `text-dual/register-dual`, unique in register color
- Q5 flags side by side

**Add character flow:** Compare overlay (bottom sheet) slides up. Search input or recent analyses. Max 3 characters. URL updates as characters added.

**Trope overlap logic:**
```typescript
// Find trope IDs present in ≥2 of the 3 characters → highlight in purple
// Unique tropes: render in their own register color
```

**Unblocks:** Comparative analysis feature (PRD use case #7) complete.

---

### Step 21 — Transparency Page (V09)

**What it is:** The contract page. Full rubric. Trope taxonomy table. Model version log. Audit results. Submission forms.

**Files:**
- Create: `app/transparency/page.tsx`
- Create: `components/transparency/RubricSection.tsx` — Serizawa Five with sub-criteria
- Create: `components/transparency/TropeTaxonomyTable.tsx` — full 34-entry filterable table
- Create: `components/transparency/ModelVersionLog.tsx` — reads `model_versions` table
- Create: `components/transparency/SubmitRuleChange.tsx` — wired to `/api/rules/suggest`
- Create: `components/transparency/SubmitNewTrope.tsx` — wired to `/api/tropes/submit`
- Create: `app/api/admin/analytics/route.ts` — GET aggregate stats for transparency page

**Sections (all collapsible):** Current Rubric v0.1.0 → Trope Taxonomy → Model & Prompt Version Log → Monthly Audit Results → Submit Rule Change form → Submit New Trope form → GitHub Wiki link

**Footer note:** *"This page is the contract between this tool and its users. If something changes, it's logged here first."*

**Unblocks:** Step 23 (Glossary links to taxonomy here). GitHub wiki content matches what's on this page.

---

### Step 22 — Glossary Page (V10) + Seed Content

**What it is:** A–Z searchable glossary. Seed with all 34 tropes, all 5 rules, key test names, key Japanese terms used in analyses.

**Files:**
- Create: `app/glossary/page.tsx`
- Create: `app/glossary/[slug]/page.tsx` — individual term page
- Create: `supabase/seed/006_glossary.sql` — seed content
- Create: `components/glossary/GlossaryIndex.tsx` — A–Z index + search
- Create: `components/glossary/TermCard.tsx` — term + definition + register tag + related tropes
- Create: `app/api/glossary/search/route.ts`
- Create: `app/api/glossary/submit/route.ts`

**Seed content (from PRD §F10.4):**
- All 34 tropes (linked to taxonomy)
- All 5 rules (Q1–Q5 definitions)
- Key test names: Bechdel, Mako Mori, Sexy Lamp, Vito Russo, DuVernay
- Key Japanese terms: 誇り, Nikkei, Nisei, Sansei, Yamato Nadeshiko, etc.

**Submit term:** Login required. Soft prompt if logged out. `status = 'pending'` until admin approves.

**Unblocks:** Full content discovery complete. Admin console (Step 23) moderates submissions from here.

---

### Step 23 — Admin Console (V11)

**What it is:** Role-gated internal tool. Moderation queue for all submissions. Bulk import. Analytics. Critic application approval.

**Files:**
- Create: `app/admin/page.tsx` — admin chrome, simple pill nav
- Create: `app/admin/moderate/page.tsx` — combined queue: tropes, rules, glossary, disputes
- Create: `app/admin/critics/page.tsx` — critic application queue
- Create: `app/admin/bulk/page.tsx` — CSV upload UI + job status
- Create: `app/admin/analytics/page.tsx` — aggregate stats
- Create: `middleware.ts` (modify) — block `/admin` for non-admin users → 404

**Moderation queue items:**
- Trope submissions: Approve → `status = 'accepted'`, trigger webhook to GitHub Issues
- Rule suggestions: Approve → `status = 'accepted'`
- Glossary terms: Approve → `status = 'accepted'`, term becomes publicly visible
- Trope disputes: Approve → flag for prompt review; Reject → close

**Critic approval:** View application, check criteria (3+ accepted tropes OR 5+ disputes won OR admin invite), approve → set `users.role = 'critic'`.

**Unblocks:** Step 24 (bulk runner needs the upload UI here). Community content pipeline becomes operational.

---

### Step 24 — Bulk Import Runner

**What it is:** CSV upload → parse → preview → confirm → sequential processing via the existing analysis API → status page. Admin-only.

**Files:**
- Create: `app/api/analysis/bulk/route.ts` — POST creates bulk_job + bulk_items; GET returns job status
- Create: `lib/bulk/runner.ts` — sequential processor: reads bulk_items, calls analyzeCharacter() per row
- Create: `app/api/cron/bulk-process/route.ts` — Vercel cron handler (or Supabase Edge Function)
- Modify: `app/admin/bulk/page.tsx` — upload form, preview table, confirm button, live status list

**CSV format:**
```
character_name,media_title,media_type,era,gender_flag,additional_context
Mr. Miyagi,The Karate Kid (1984),film,1984,male,
```

**Processing:** `bulk_items` table tracks status (pending → processing → complete → error) per row. Admin status page polls every 5 seconds. Rate: one per second to avoid API saturation.

**Unblocks:** Pre-seeding the leaderboard with the 8 Wall of Shame entries + Hall of Fame candidates. Also enables the canonical worked examples from PRD Appendix B.

---

### Step 25 — GitHub Wiki Auto-Generation Action

**What it is:** GitHub Action that runs nightly and on-demand (webhook from admin console). Pulls data from Supabase. Commits updated wiki markdown.

**Files:**
- Create: `.github/workflows/wiki-sync.yml` — nightly cron + workflow_dispatch
- Create: `scripts/wiki/generate-trope-taxonomy.ts` — reads `tropes` table → `Trope-Taxonomy.md`
- Create: `scripts/wiki/generate-model-log.ts` — reads `model_versions` → `Model-Version-Log.md`
- Create: `scripts/wiki/generate-grade-distribution.ts` — reads `analyses` → `Grade-Distribution.md`
- Create: `scripts/wiki/generate-worked-examples.ts` — top 5 + bottom 5 → `Worked-Examples.md`
- Create: `scripts/wiki/generate-indexes.ts` — HOF + WOS indexes

**Auto-generated wiki pages (per PRD §12.2):**
- `Trope-Taxonomy.md` — all 34 entries with full fields
- `Model-Version-Log.md` — model + prompt template history
- `Grade-Distribution.md` — score histogram, mean, median
- `Worked-Examples.md` — top 5 A+ and bottom 5 F by confidence-weighted score
- `Wall-of-Shame/Index.md` — all WOS entries
- `Hall-of-Fame/Index.md` — all HOF entries

**GitHub Action config:**
```yaml
on:
  schedule: [{ cron: '0 2 * * *' }]   # 2am UTC nightly
  workflow_dispatch: {}                  # on-demand from admin
env:
  SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
  SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}
```

**Unblocks:** GitHub wiki stays accurate. On-demand trigger from bulk import completion means wiki updates after every major seeding run.

---

### Step 26 — Share API + Analytics

**What it is:** Share event logging. Platform share counts. `/character/[key]/share` POST endpoint.

**Files:**
- Create: `app/api/characters/[key]/share/route.ts` — POST { platform: 'twitter' | 'copy' | 'embed' }
- Modify: `components/analysis/AnalysisResults.tsx` — wire share buttons to this endpoint
- Create: `components/sharing/ShareButtons.tsx` — Copy link, Twitter/X, Copy embed (MediaWiki iframe)

**Share button implementation:**
```typescript
// Copy link: navigator.clipboard.writeText(canonicalUrl) + POST /share { platform: 'copy' }
// Twitter/X: window.open(twitterIntentUrl) + POST /share { platform: 'twitter' }
// Embed: clipboard copies <iframe src="/character/[key]?embed=true" ...> + POST /share { platform: 'embed' }
```

**Embed view:** `/character/[key]?embed=true` — renders baseball card only, no chrome, MediaWiki-compatible sizing.

**Analytics (server-side only, no client tracking):** `character_shares` table accumulates counts. Weekly script snapshots to `audit_logs`. Published on Transparency page.

**Unblocks:** Step 27 (OG image is what gets shared when Twitter/X unfurls the URL). Social virality funnel complete once OG image endpoint is live.

---

### Step 27 — OG Image Generation Endpoint (`/api/og/[character-key].png`)

**What it is:** The final step. Dynamic 1200×630 OG image generated via `@vercel/og`. Renders the baseball card visual, three-tier scores, grade badge, Q5 flag, top 3 tropes, Serizawa Test branding.

**Files:**
- Create: `app/api/og/[key]/route.tsx` — `@vercel/og` ImageResponse handler
- Modify: `app/character/[key]/page.tsx` — confirm `og:image` meta tag points here

**Install:**
```bash
npm install @vercel/og
```

**OG image layout (from style-guide §9.1, 1200×630px):**
```
LEFT HALF (~560px):
  Baseball card visual (scaled ~280px wide)
  Grade badge overlapping card corner (gold/red/green by grade)
  Character image (grayscale + vermillion overlay)

RIGHT HALF (~560px):
  SERIZAWA TEST (Bebas Neue 32px, washi-100)
  芹沢テスト (Noto Sans JP 14px, vermillion-400)
  [16px gap]
  Character name (DM Sans 700 28px, washi-100)
  Media title (DM Sans 400 18px, washi-300)
  [24px gap]
  Score: "8.47 / 10" (JetBrains Mono 36px, washi-100)
  Grade badge circle (48px)
  [16px gap]
  Q5 flag pill
  [16px gap]
  Top 3 trope pills with register emoji
  [bottom]
  "serizawa.japanifornia.com" (DM Sans 300 14px, washi-400)
  "CC BY · Japanifornia" (DM Sans 300 12px, washi-400)

BACKGROUND:
  ink-950 (#0A0705) + subtle vermillion gradient top-left
```

**Font loading in `@vercel/og`:**
```typescript
// Must load fonts as ArrayBuffer from local /public/fonts/ or via fetch
// Required: Bebas Neue 400, DM Sans 400/700, Noto Sans JP 400, JetBrains Mono 400
```

**Data fetch:** Route handler calls Supabase directly (server-side) to get character + latest analysis. Returns `ImageResponse` with `Cache-Control: public, max-age=86400`.

**Error fallback:** If character not found, return generic Serizawa Test branded OG image.

**Unblocks:** `og:image` meta tags on every character page resolve to real images. Twitter/X, iMessage, Slack, Discord all unfurl with the baseball card visual. Social sharing becomes the viral loop.

---

## Execution Options

**Plan saved to:** `docs/plans/2026-02-26-serizawa-build-plan.md`

**Two execution options:**

**1. Subagent-Driven (this session)** — dispatch fresh subagent per step, code review between steps, fast iteration. Use `superpowers:subagent-driven-development`.

**2. Parallel Session (separate)** — open new session with this plan, use `superpowers:executing-plans`, batch execution with checkpoints.

Which approach?
