# Serizawa Test — UX Flow & Navigation v1.0

**Document status:** v1.0 Draft  
**Owner:** Saren  
**Depends on:** Style Guide v1.0, PRD v03  

---

## 1. Navigation Philosophy

No vertical nav columns. Ever.  
No persistent header with 8 links.  
No hamburger menus hiding a filing cabinet.

Three nav patterns, used contextually:

**① Floating Pill Bar** (global, scroll-triggered)  
Appears at the bottom of the viewport after scrolling past the fold.  
Disappears when back at top. Always 4 destinations maximum.  
Floats above content. Frosted glass background on ink-950.  
This is the only persistent nav element in the app.

**② Contextual Action Tray** (page-specific)  
Appears on results, leaderboard, compare pages.  
Relevant actions only — never generic links.  
Lives just below the primary content, not in chrome.

**③ Breadcrumb Ghost Pill** (single-level, top-left)  
One pill. One tap. Goes back one level.  
Appears only when you're not on the home page.  
Fades in on page load. Never more than one level shown.

---

## 2. The Floating Pill Bar

```
╭─────────────────────────────────────────────╮
│  🏠   🔍   🏆   💀                          │
│  Home  Search  Fame  Shame                  │
╰─────────────────────────────────────────────╯
```

Four destinations. Always the same four.  
Pill-shaped container, `--radius-full`, centered, max-width 280px.  
Background: `rgba(20,14,10,0.85)` with `backdrop-filter: blur(12px)`.  
Border: `1px solid --color-ink-600`.  
Position: `fixed`, bottom 24px, left 50%, translateX(-50%).  
Z-index: 100.

Each tab:
- 32px circle button, icon + label below (10px, DM Sans 500)
- Active state: `--color-red-500` icon, small red dot underneath
- Inactive: `--color-washi-400` icon
- Tap: scale(0.92) spring back

Scroll behavior:
- Hidden at page top (y-offset < 80px)
- Slides up from bottom on scroll down (`translateY(0)`, 300ms ease)
- Slides back down when scrolled to top (`translateY(120%)`, 300ms ease)

**The four destinations:**

| Icon | Label | JP | Destination |
|---|---|---|---|
| 🏠 | Home | ホーム | `/` |
| 🔍 | Search | 検索 | `/search` (also opens search overlay inline) |
| 🏆 | Fame | 名誉 | `/hall-of-fame` |
| 💀 | Shame | 恥 | `/wall-of-shame` |

Leaderboard, transparency, glossary, and about are reached via the results  
page action tray or from the home page below-fold section — not from the  
floating pill bar. Keep the global nav ruthlessly minimal.

---

## 3. Full View Inventory

Every distinct view in the app. 12 total.

```
V01  Home
V02  Analysis Loading
V03  Character Results (Baseball Card)
V04  Hall of Fame
V05  Wall of Shame
V06  Leaderboard
V07  Compare (up to 3 characters)
V08  Search / Browse
V09  Transparency
V10  Glossary
V11  Admin Console
V12  User Profile / Votes History
```

---

## 4. Flow Diagram

### 4.1 Primary Flow — The Analysis Path

```
                        ┌─────────────┐
                        │  V01: HOME  │ ◄─────────────────────────────┐
                        └──────┬──────┘                               │
                               │                                       │
              ┌────────────────┼────────────────┐                     │
              │                │                │                      │
              ▼                ▼                ▼                      │
        [Type input]    [Tap preset]    [Tap result card              │
              │                │         from below fold]             │
              └────────────────┘                │                     │
                               │                │                     │
                               ▼                ▼                     │
                        ┌─────────────────────────┐                  │
                        │  V02: ANALYSIS LOADING  │                  │
                        │  Rotating messages      │                  │
                        │  ~5–30 seconds          │                  │
                        └────────────┬────────────┘                  │
                                     │                                │
                                     ▼                                │
                        ┌─────────────────────────┐                  │
                        │  V03: CHARACTER RESULTS │                  │
                        │  Baseball card          │                  │
                        │  Rule breakdown         │                  │
                        │  Trope detections       │                  │
                        │  Three-tier scores      │                  │
                        └────────────┬────────────┘                  │
                                     │                                │
          ┌──────────────┬───────────┼────────────┬──────────────┐   │
          │              │           │            │              │   │
          ▼              ▼           ▼            ▼              ▼   │
      [Share]       [Compare]   [Analyze      [Dispute]    [← Back] │
          │              │       another]         │              │   │
          │              │           │            │              └───┘
          ▼              ▼           │            ▼
    [OG card +      V07: COMPARE     │      Dispute modal
     copy link]         │            └──► V01: HOME
                        │                (input pre-cleared)
                        ▼
                  V03 × 3 columns
```

---

### 4.2 Discovery Flow — Browse Without Analyzing

```
                        ┌─────────────┐
                        │  V01: HOME  │
                        └──────┬──────┘
                               │
                    ┌──────────┼──────────┐
                    │          │          │
                    ▼          ▼          ▼
              [🔍 Search]  [🏆 Fame]  [💀 Shame]
                    │          │          │
                    ▼          ▼          ▼
               V08: SEARCH  V04: HOF   V05: WOS
                    │          │          │
                    │          └────┬─────┘
                    │               │
                    └───────────────┘
                                    │
                                    ▼
                           [Tap any character card]
                                    │
                                    ▼
                           V03: CHARACTER RESULTS
                           (no loading state —
                            result already exists)
```

---

### 4.3 Leaderboard Flow

```
              [Below fold on V01: HOME]
                        │
                        ▼
              [ See all → ] tap on any teaser
                        │
              ┌─────────┴──────────────────────────────┐
              │                                        │
              ▼                                        ▼
     V06: LEADERBOARD                          V04 / V05 direct
     [ Tab: All-time ]                         (HOF or WOS)
     [ Tab: By era   ]
     [ Tab: By media ]
     [ Tab: Most analyzed ]
     [ Tab: Most improved ]
              │
              ▼
     [Tap any character]
              │
              ▼
     V03: CHARACTER RESULTS
```

---

### 4.4 Compare Flow

```
    V03: CHARACTER RESULTS
              │
              ▼
    [Compare →] action in tray
              │
              ▼
    Compare overlay slides up (bottom sheet)
    "Add up to 2 more characters"
              │
     ┌────────┴────────┐
     │                 │
     ▼                 ▼
   Search         Tap recent
   input          analyses
     │                 │
     └────────┬────────┘
              │
              ▼
    V07: COMPARE VIEW
    (2 or 3 columns, horizontal scroll on mobile)
              │
              ▼
    [Tap any column's character name]
              │
              ▼
    V03: CHARACTER RESULTS (that character)
```

---

### 4.5 Utility Views Flow

```
    V03: CHARACTER RESULTS
    (or any page via floating pill → 🔍)
              │
     ┌────────┴────────────────┐
     │                         │
     ▼                         ▼
  V08: SEARCH              V10: GLOSSARY
  Browse all                  │
  characters                  │
  Filter: era /               ▼
  media type /           [Tap term]
  grade band                  │
     │                        ▼
     ▼                  Term detail page
  [Tap card]            (modal or inline)
     │
     ▼
  V03: CHARACTER RESULTS
```

```
    V09: TRANSPARENCY PAGE
    Reached via:
    - Footer link on V01 HOME (below fold)
    - "About the score" link on V03 RESULTS
    - GitHub wiki link (external)
    
    Contains:
    - Current rubric version
    - Full trope taxonomy
    - Model version log
    - Monthly audit summary
    - Submission forms
    - Link to GitHub wiki
    
    No nav path out except:
    - Floating pill bar
    - Breadcrumb ghost ← Home
```

---

### 4.6 Auth Flow (Lightweight)

```
    V03: CHARACTER RESULTS
    (voting section — logged out)
              │
              ▼
    "Vote on this score →
     Sign in with Google or Apple"
              │
              ▼
    Auth modal (Supabase)
    — stays on same page
    — no redirect to separate login page
              │
         ┌────┴────┐
         │         │
         ▼         ▼
     Google     Apple
       Auth       Auth
         │         │
         └────┬────┘
              │
              ▼
    Return to V03: CHARACTER RESULTS
    Voting UI now active
    No page reload — optimistic update
```

---

### 4.7 Admin Flow

```
    /admin (protected route)
    Accessible only with admin role flag
    No entry from public nav
              │
     ┌────────┴─────────────┐
     │                      │
     ▼                      ▼
  Moderation queue      Bulk import
  - Trope submissions   - CSV upload
  - Rule suggestions    - Queue status
  - Disputes            - Progress list
  - Critic applications
     │
     ▼
  [Approve / Reject]
  Triggers webhook →
  GitHub Issue update
```

---

## 5. View Specs (Per Page)

### V01 — Home

```
URL:         /
Nav:         Floating pill bar (hidden at top, appears on scroll)
Back pill:   None (this is root)

ABOVE FOLD:
  Full-viewport-height centered layout
  App name + JP subtitle
  Tagline
  Two input fields (character, property)
  Analyze button
  Preset pills (4)

BELOW FOLD (scroll to reveal):
  Three teaser columns:
    🏆 Hall of Fame (3 mini cards) + See all →
    💀 Wall of Shame (3 mini cards) + See all →
    🔥 Recently Analyzed (3 mini cards) + See all →
  
  Footer row (minimal):
    About · Transparency · Glossary · GitHub · CC BY
    (ghost links, DM Sans 300, washi-400)
    
    "Not peer-reviewed research. Just peer-reviewed opinions."
    (italic, washi-400, centered)
```

### V02 — Analysis Loading

```
URL:         /analyze (transient — redirects to V03 on complete)
Nav:         None — full focus state
Back pill:   ← Cancel (ghost pill, top-left)

LAYOUT:
  Full viewport, centered
  
  Serizawa Test logo mark (animated — slow rotation, 3s)
  
  "Analyzing…" / 分析中…
  (DM Sans 300, 24px, washi-200)
  
  Rotating message (changes every 3 seconds)
  (DM Sans 400, 18px, washi-100, centered)
  (JP companion below, Noto Sans JP 400, 12px, washi-400)
  
  Subtle breathing glow (red, 2s pulse, opacity 0.3→0.6)
  
  No progress bar — duration is unpredictable
  No percentage — we don't know the endpoint
```

### V03 — Character Results

```
URL:         /character/[character-key]
Nav:         Floating pill bar
Back pill:   ← Home (or ← Search if arrived from search)

LAYOUT (desktop): Two-column, 40/60 split
LAYOUT (mobile):  Single column, card on top

LEFT / TOP:
  Baseball card (front face, flippable)
  Tap/click to flip — reveals rule breakdown
  
  Below card:
    Action tray (pill-shaped container):
    [ 🔗 Share ]  [ ⚖️ Compare ]  [ 📋 Embed ]
    
    If logged in, add:
    [ 🚩 Dispute ]

RIGHT / BELOW:
  Character name (H2, DM Sans 700, 28px)
  Media title · Year · Type (DM Sans 400, 16px, washi-300)
  
  Three-tier score display:
    ┌──────────────────────────────────────┐
    │  🤖 AI      🎓 Critics   👥 Audience │
    │  8.47       8.20         8.61        │
    │  [grade A]  [3 votes]    [12 votes]  │
    └──────────────────────────────────────┘
    
    If gap > 1.0 between any two scores:
    "Critics rate this 1.2pts lower → See disputes"
  
  Rule breakdown (4 cards, stacked, collapsed):
    Each card tap expands:
      Rule name (EN + JP)
      Score (JetBrains Mono)
      Score bar (pill, animated)
      Sub-scores (three rows, smaller)
      Rationale text
      Vote buttons (agree / disagree / indifferent)
        Login prompt if logged out
  
  Detected tropes (pill row, horizontal scroll):
    Each pill tap expands tooltip:
      Full name + JP
      Severity + Register
      Evidence quote
      [Dispute this]
  
  Q5 flag (prominent pill):
    Full actor name and heritage note
  
  Suggestions section:
    "How this could score higher" (collapsible)
    3–5 bullet points from AI analysis
  
  About this score (ghost link):
    Opens transparency modal
    Explains rubric version, model version, prompt template
```

### V04 — Hall of Fame

```
URL:         /hall-of-fame
Nav:         Floating pill bar (🏆 active)
Back pill:   ← Home
JP header:   名誉の殿堂

LAYOUT:
  Hero header with gold gradient
  Subheader: "Characters who earned their place. Load-bearing, specific, human."
  
  Grid: 3 col desktop, 2 tablet, 1 mobile
  Sort: Confidence-weighted score, desc
  Filter pills: [ All ] [ Film ] [ TV ] [ Comics ] [ Games ]
  
  Each card: mini baseball card front
    Gold badge for A+
    Character name, media, score
    Tap → V03: CHARACTER RESULTS
```

### V05 — Wall of Shame

```
URL:         /wall-of-shame
Nav:         Floating pill bar (💀 active)
Back pill:   ← Home
JP header:   恥の殿堂

LAYOUT:
  Dark background with subtle red texture
  Header: WALL OF SHAME in --color-red-500 Bebas Neue
  Subheader: "These portrayals failed. Some spectacularly.
              All of them are teachable moments."
  
  Sort: Worst score first; Yellowface-flagged entries elevated
  Filter pills: [ All ] [ 🚨 Yellowface ] [ By era ] [ By trope ]
  
  Each card: mini baseball card front
    Pulsing red F badge
    🚨 Yellowface banner overlay if applicable
    Era label (1940s, 1950s, etc.)
    Tap → V03: CHARACTER RESULTS
  
  Callout box (pinned top):
    "These are teachable moments, not cancellations.
     Every entry links to historical context and
     what creators can learn from them."
    (DM Sans 300, italic, washi-300)
```

### V06 — Leaderboard

```
URL:         /leaderboard
Nav:         Floating pill bar
Back pill:   ← Home

LAYOUT:
  Tab pills (horizontal scroll on mobile):
  [ 🏆 All-time ] [ 📈 Most Improved ] [ 🗓 By Era ]
  [ 🎬 By Media ] [ 🔥 Most Analyzed ]
  
  Each tab: ranked list
    Rank number (Bebas Neue, large, washi-400)
    Mini baseball card thumbnail
    Character + media
    Score + grade badge
    Trajectory arrow (↑ ↓ →) for most improved tab
    Tap → V03: CHARACTER RESULTS
  
  Confidence note (ghost text, bottom):
    "Rankings use Bayesian averaging.
     Characters with fewer than 5 analyses
     are marked with ◇"
```

### V07 — Compare

```
URL:         /compare?a=[key]&b=[key]&c=[key]
Nav:         Floating pill bar
Back pill:   ← [previous character]

LAYOUT (2 characters): Two columns, equal width
LAYOUT (3 characters): Three columns (horizontal scroll mobile)

Each column:
  Mini baseball card (top, not flippable here)
  Character name + media
  Final score
  
  Rule rows (4):
    Rule name
    Score (both columns shown side by side)
    Bar visual — bars align horizontally for comparison
    Delta: "+0.45 vs [other character]" in small text
  
  Trope overlap section:
    Shared tropes highlighted in purple
    Unique tropes per character in their register color
  
  Q5 flags side by side
  
  Bottom action:
    [ ← Swap character ]  [ Share comparison ]
```

### V08 — Search / Browse

```
URL:         /search
Nav:         Floating pill bar (🔍 active)
Back pill:   ← Home

LAYOUT:
  Search bar (full width, prominent)
  
  Filter pills (horizontal scroll):
  [ All ] [ Film ] [ TV ] [ Comics ] [ A+ ] [ F ] [ 🚨 Yellowface ]
  [ 1940s ] [ 1950s ] [ 1980s ] [ Recent ]
  
  Results grid:
    Mini baseball cards
    Sorted by relevance (name match first, then score)
    Empty state: "No results yet. Analyze this character →"
      (links back to V01 with search term pre-filled)
  
  If search term matches nothing in DB:
    "We haven't analyzed [term] yet."
    [ Analyze [term] → ] pill button → V01 with pre-fill
```

### V09 — Transparency

```
URL:         /transparency
Nav:         Floating pill bar
Back pill:   ← Home

LAYOUT: Long-form, single column, max-width 720px

Sections (each collapsible):
  Current Rubric (v0.1.0)
  — The Serizawa Five with full sub-criteria
  — Scoring algorithm
  — Grade bands
  
  Trope Taxonomy
  — Full 34-entry table
  — Filter by category / severity / register
  
  Model & Prompt Version Log
  — Table of versions, dates, change summaries
  
  Monthly Audit Results
  — Latest audit summary
  — Agreement rates per rule
  
  Submit a Rule Change
  — Form: Rule ID, proposed change, rationale, evidence
  
  Submit a New Trope
  — Form: Name, category, description, severity, example
  
  GitHub Wiki →
  — External link badge
  
Footer note:
  "This page is the contract between this tool and its users.
   If something changes, it's logged here first."
```

### V10 — Glossary

```
URL:         /glossary
Nav:         Floating pill bar
Back pill:   ← Home

LAYOUT:
  Search bar (glossary-specific)
  A–Z index pills (horizontal scroll)
  
  Term cards (stacked):
    Term (EN) + JP translation if applicable
    Definition
    Register tag if applicable
    Related tropes (pills, link to V09 taxonomy)
    Examples (collapsed, tap to expand)
    Source links (ghost)
  
  Bottom CTA:
    "Missing a term?"
    [ Submit new term → ] pill button
    (login required — gentle prompt if logged out)
```

### V11 — Admin Console

```
URL:         /admin (role-gated)
Nav:         None — separate admin chrome
             Simple pill row: [ Moderate ] [ Bulk ] [ Analytics ] [ Versions ]

Not documented in detail here — internal tool only.
See PRD §F7.
```

### V12 — User Profile

```
URL:         /profile
Nav:         Floating pill bar (appears after login — replaces 🔍 with 👤)
Back pill:   ← Home

LAYOUT:
  User avatar + name (from Google/Apple auth)
  Critic status badge (if applicable)
  
  Vote history:
    List of analyses voted on
    Their vote vs. AI score
    Agreement/disagreement rate
  
  Submissions:
    Tropes submitted (status: pending/accepted/rejected)
    Rule suggestions submitted
    Glossary terms submitted
  
  Account actions:
    [ Request data deletion ] (ghost button)
    [ Sign out ] (ghost button)
```

---

## 6. Click Path Matrix

Every destination from every view. Quick reference.

| From → | Home | Loading | Results | HOF | WOS | Board | Compare | Search | Trans | Glossary |
|---|---|---|---|---|---|---|---|---|---|---|
| Home | — | ✓ (analyze) | ✓ (preset/below fold) | ✓ (below fold) | ✓ (below fold) | ✓ (below fold) | — | ✓ (pill) | ✓ (footer) | ✓ (footer) |
| Loading | ✓ (cancel) | — | ✓ (auto) | — | — | — | — | — | — | — |
| Results | ✓ (back pill) | ✓ (analyze another) | — | ✓ (if A+) | ✓ (if F) | — | ✓ (action tray) | ✓ (pill) | ✓ (about link) | — |
| HOF | ✓ (back pill) | — | ✓ (tap card) | — | — | ✓ (pill) | — | ✓ (pill) | — | — |
| WOS | ✓ (back pill) | — | ✓ (tap card) | — | — | ✓ (pill) | — | ✓ (pill) | — | — |
| Board | ✓ (back pill) | — | ✓ (tap card) | ✓ (tab) | ✓ (tab) | — | — | ✓ (pill) | — | — |
| Compare | ✓ (back pill) | ✓ (add character) | ✓ (tap column) | — | — | — | — | ✓ (pill) | — | — |
| Search | ✓ (back pill) | ✓ (analyze new) | ✓ (tap result) | — | — | — | — | — | — | — |
| Trans | ✓ (back pill) | — | — | — | — | — | — | — | — | ✓ (glossary link) |
| Glossary | ✓ (back pill) | — | — | — | — | — | — | — | ✓ (taxonomy link) | — |

---

## 7. Mobile Behavior Notes

**Bottom pill bar** sits above the system home indicator on iOS.  
Safe area: `padding-bottom: env(safe-area-inset-bottom)`.

**Baseball card** on mobile:  
Full-width card (calc(100vw - 48px)), centered.  
Swipe left/right on results page navigates between  
recently analyzed characters (if applicable).  
Tap to flip — no hover state on mobile.

**Compare view** on mobile:  
Two characters: side-by-side columns, each 48% width, horizontal scroll.  
Three characters: horizontal scroll, each column 80% viewport width,  
snap scrolling between columns.

**Input fields** on home:  
On focus, keyboard pushes viewport up naturally.  
Tagline and app name slide up gracefully.  
Analyze button stays visible above keyboard  
using `position: sticky` within the form.

**Loading screen** on mobile:  
Full viewport lock — no scroll, no escape except Cancel pill.  
Prevents accidental back navigation during analysis.

---

## 8. URL Structure Summary

```
/                                    Home
/analyze                             Analysis loading (transient)
/character/[character-key]           Results — shareable canonical URL
/hall-of-fame                        Hall of Fame
/wall-of-shame                       Wall of Shame
/leaderboard                         Leaderboard (default: all-time tab)
/leaderboard/[view]                  Leaderboard specific tab
/compare                             Compare (empty state)
/compare?a=[key]&b=[key]             Compare 2 characters
/compare?a=[key]&b=[key]&c=[key]     Compare 3 characters
/search                              Search / browse
/search?q=[term]                     Search with pre-filled query
/transparency                        Transparency page
/glossary                            Glossary
/glossary/[term-slug]                Individual term page
/profile                             User profile (auth required)
/admin                               Admin console (role required)

/api/og/[character-key].png          Dynamic OG image generation
```

---

## 9. Empty & Error States

**No results in search:**
```
  🔍
  "No characters matching '[query]' yet."
  [ Analyze '[query]' → ]
  (pre-fills home input with search term)
```

**Analysis fails (API error):**
```
  😕
  "Analysis didn't complete. Claude is probably thinking very hard."
  [ Try again ]  [ Go home ]
  (error logged; no partial data shown)
```

**Character not found (direct URL):**
```
  🎌
  "We haven't analyzed this character yet."
  "Want to be the first?"
  [ Analyze now → ]
  (pre-fills input with parsed character key)
```

**Wall of Shame — empty (shouldn't happen post-seed):**
```
  🎉
  "The Wall of Shame is empty. Hollywood did good today."
  "Just kidding. Check back soon."
```

---

*Serizawa Test — UX Flow & Navigation v1.0*  
*Japanifornia*  
*流れるように / Flow like water*
