# Serizawa Test — Style Guide v1.0
## Japanifornia Design System

**Document status:** v1.0 Draft  
**Owner:** Saren  
**Applies to:** Web app, baseball cards, social sharing, GitHub wiki  
**Animation library:** Framer Motion  
**Icon library:** Lucide React + custom emoji set  

---

## 1. Design Philosophy

Japanifornia is not "Asian-inspired." It is Japanese-American and proud.  
The aesthetic is owned, not borrowed. Bold, layered, culturally specific.  
Think BAPE Harajuku meets a California garage. Think ink and sunset.  
Think a bilingual kid who switches languages mid-sentence without explaining it.

**Three design principles:**

**1. 誇り / Pride**  
Every design decision should feel like it was made by someone who gives a damn. No half-measures. No generic Asian restaurant vibes. Specific, considered, confident.

**2. 重さ / Weight**  
Animations feel weighted, not bouncy. Typography has presence. The baseball card flip is deliberate. This tool is taking something seriously even when it's being funny.

**3. 透明性 / Transparency**  
The system is visible. Scores are explained. Tropes are named. Register icons tell you exactly what kind of finding you're looking at. Nothing is hidden in fine print.

---

## 2. Color System

### 2.1 Core Palette

```
/* Primary — Ink */
--color-ink-950:    #0A0705;   /* near-black with warm undertone — primary bg */
--color-ink-900:    #140E0A;   /* card backgrounds */
--color-ink-800:    #1F1612;   /* elevated surfaces */
--color-ink-700:    #2E201A;   /* borders, dividers */
--color-ink-600:    #4A352C;   /* subtle borders */

/* Primary — Vermillion (Japan Red) */
--color-red-600:    #C0392B;   /* primary brand red */
--color-red-500:    #E74C3C;   /* interactive red, CTAs */
--color-red-400:    #F15A4A;   /* hover states */
--color-red-300:    #F5856E;   /* light accents */
--color-red-100:    #FDE8E6;   /* red tints on dark bg */

/* Secondary — California Gold */
--color-gold-500:   #F0A500;   /* Grade A+, Hall of Fame, highlights */
--color-gold-400:   #F5BC3A;   /* hover gold */
--color-gold-200:   #FDE9A8;   /* gold tints */

/* Neutral — Washi (warm whites) */
--color-washi-100:  #FAF6F1;   /* primary text on dark */
--color-washi-200:  #F0E8DF;   /* secondary text */
--color-washi-300:  #D9CEC4;   /* tertiary text, placeholders */
--color-washi-400:  #B8A99A;   /* disabled states */

/* Semantic — Register Colors */
--color-trigger:    #E74C3C;   /* 🚨 Trigger Warning — red */
--color-teachable:  #3498DB;   /* 📚 Teachable Moment — calm blue */
--color-mockery:    #F39C12;   /* 😂 Ruthless Mockery — warm amber */
--color-dual:       #9B59B6;   /* dual register — purple bridge */

/* Semantic — Grade Colors */
--color-grade-aplus:  #F0A500;  /* A+ gold */
--color-grade-a:      #27AE60;  /* A green */
--color-grade-b:      #2ECC71;  /* B light green */
--color-grade-c:      #F39C12;  /* C amber */
--color-grade-d:      #E67E22;  /* D orange */
--color-grade-f:      #E74C3C;  /* F red — Wall of Shame */

/* Semantic — Q5 Flag Colors */
--color-authentic:    #27AE60;  /* ✅ green */
--color-approximate:  #F39C12;  /* ⚠️ amber */
--color-yellowface:   #E74C3C;  /* 🚨 red */
```

### 2.2 Dark Mode as Default

This app is dark mode native. Light mode is not planned for v1.  
All color values assume dark backgrounds.  
Background hierarchy:

```
Page background:     --color-ink-950   #0A0705
Card surface:        --color-ink-900   #140E0A
Elevated card:       --color-ink-800   #1F1612
Interactive surface: --color-ink-700   #2E201A
Border:              --color-ink-600   #4A352C
```

### 2.3 Color Usage Rules

- **Never** use pure `#000000` or `#FFFFFF` — always warm tones
- **Never** use cold blues or grays as neutrals — everything trends warm
- The vermillion red is for action, danger, and pride — not decoration
- Gold is reserved for achievement and Hall of Fame — don't dilute it
- Register colors (trigger/teachable/mockery) appear ONLY on trope findings — not UI chrome

---

## 3. Typography

### 3.1 Type Stack

```css
/* Display / Headlines — English */
font-family: 'Bebas Neue', 'Impact', sans-serif;
/* Used for: Grade badges, hero scores, Wall of Shame header */
/* Character: loud, confident, streetwear-coded */

/* Body / UI — English */  
font-family: 'DM Sans', 'Inter', sans-serif;
/* Used for: All body copy, labels, navigation, form inputs */
/* Character: clean, geometric, readable at small sizes */

/* Japanese Script — Bilingual moments */
font-family: 'Noto Sans JP', 'Hiragino Sans', 'Yu Gothic', sans-serif;
/* Used for: Japanese text overlays, bilingual labels, cultural moments */
/* Weight: 400 (regular) for body JP, 700 (bold) for display JP */

/* Monospace — Scores, data */
font-family: 'JetBrains Mono', 'Fira Code', monospace;
/* Used for: Decimal scores (8.47), version numbers, technical data */
/* Character: precise, data-forward */
```

Google Fonts import order:
```
Bebas Neue: 400
DM Sans: 300 400 500 600 700
Noto Sans JP: 400 700
JetBrains Mono: 400 500
```

### 3.2 Type Scale

```css
/* Display — hero moments only */
--text-display:     4.5rem / 72px    /* Grade badge "A+" */
--text-display-jp:  2.5rem / 40px    /* 優秀 alongside A+ */

/* Heading 1 — page titles */
--text-h1:          2.25rem / 36px   /* "Serizawa Test" */
--text-h1-jp:       1.5rem / 24px    /* 芹沢テスト */

/* Heading 2 — section titles */
--text-h2:          1.5rem / 24px    /* "Narrative Impact" */
--text-h2-jp:       1rem / 16px      /* 物語の影響 */

/* Heading 3 — card titles */
--text-h3:          1.125rem / 18px  /* Character name */

/* Body large */
--text-body-lg:     1rem / 16px      /* Primary reading text */

/* Body */
--text-body:        0.875rem / 14px  /* Secondary reading text */

/* Small */
--text-sm:          0.75rem / 12px   /* Labels, captions, JP subtitles */

/* Micro */
--text-xs:          0.625rem / 10px  /* Version numbers, metadata */

/* Score display */
--text-score:       2rem / 32px      /* "8.47" in JetBrains Mono */
--text-score-sm:    1.25rem / 20px   /* Rule sub-scores */
```

### 3.3 Bilingual Type Rules

Japanese text appears in these specific, intentional moments — not randomly:

| Element | English | Japanese | Size ratio |
|---|---|---|---|
| App name | SERIZAWA TEST | 芹沢テスト | 1:0.6 |
| Grade badge | A+ | 優秀 | 1:0.55 |
| Grade F | F | 恥 | 1:0.55 |
| Wall of Shame header | Wall of Shame | 恥の殿堂 | 1:0.5 |
| Hall of Fame header | Hall of Fame | 名誉の殿堂 | 1:0.5 |
| Trope pills (hover/flip) | Dragon Lady | ドラゴン・レディ | 1:0.7 |
| Loading messages | "Scanning for Kimono Drops…" | 着物を探しています… | 1:0.7 |
| Submit button | Analyze → | 分析する | 1:0.65 |

**Rule:** Japanese text always appears *beneath* or *beside* English — never replacing it. It is an accent, not a substitution. Users who don't read Japanese still parse the English. Users who do read Japanese get a small cultural gift.

**Rule:** Never use Japanese text decoratively for characters that have nothing to do with Japanese culture. The bilingual moments are earned, not scattered.

---

## 4. Spacing & Layout

### 4.1 Spacing Scale (8px base grid)

```css
--space-1:   4px
--space-2:   8px
--space-3:   12px
--space-4:   16px
--space-5:   20px
--space-6:   24px
--space-8:   32px
--space-10:  40px
--space-12:  48px
--space-16:  64px
--space-20:  80px
--space-24:  96px
```

### 4.2 Border Radius — Rounded Everything

```css
--radius-sm:     8px    /* Small pills, tags */
--radius-md:     12px   /* Input fields, small cards */
--radius-lg:     16px   /* Standard cards */
--radius-xl:     24px   /* Baseball cards, large panels */
--radius-2xl:    32px   /* Modal overlays */
--radius-full:   9999px /* Pills, circle buttons, badges */
```

**Rule:** Nothing in this UI has sharp corners. The minimum radius is `--radius-sm`. Buttons are pill-shaped (`--radius-full`) or circular. Cards are `--radius-lg` minimum.

### 4.3 Max Widths

```css
--width-home:    480px   /* Home page input form — intentionally narrow */
--width-card:    360px   /* Baseball card — portrait */
--width-results: 720px   /* Results page — readable but not sprawling */
--width-compare: 1080px  /* Comparative view — needs width */
--width-board:   1200px  /* Leaderboard — full width on desktop */
```

---

## 5. The Baseball Card

The single most important component in the app. Portrait orientation. Flip animation reveals the back. Shareable as an image. Beautiful enough to screenshot unprompted.

### 5.1 Card Dimensions

```
Width:   340px  (mobile-friendly portrait)
Height:  520px  (3:2 ratio approximately — baseball card proportions)
Radius:  --radius-xl (24px)
Shadow:  0 20px 60px rgba(0,0,0,0.6), 0 4px 16px rgba(192,57,43,0.2)
         (warm red glow in the shadow — subtle, intentional)
```

### 5.2 Card Front — The Verdict

```
┌─────────────────────────────────┐  ← --radius-xl
│  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░  │  ← Character image (top 45% of card)
│  ░░░░░░  CHARACTER IMG  ░░░░░░  │    Grayscale with red color overlay
│  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░  │    Gradient fade to card bg at bottom
│                                 │
│  ┌──────┐                       │
│  │  A+  │  Mr. Miyagi           │  ← Grade badge (circle, gold) + name
│  │ 優秀 │  Mr. Miyagi           │    (DM Sans 600, washi-100)
│  └──────┘  The Karate Kid       │  ← Media title (DM Sans 400, washi-300)
│            1984 · Film          │  ← Year + type (DM Sans 300, washi-400)
│                                 │
│  ╔══════════════════════════╗   │
│  ║   8 . 4 7  /  1 0        ║   │  ← Score (JetBrains Mono, large)
│  ╚══════════════════════════╝   │
│                                 │
│  ✅ Authentic  · Pat Morita     │  ← Q5 flag pill + actor name
│                                 │
│  "Load-bearing. Not just        │  ← 2-sentence summary
│   seasoning."                   │    (DM Sans 400, washi-200, italic)
│                                 │
│  🚨 T007  📚 T001  📚 T004     │  ← Trope pills (top 3, register-colored)
│                                 │
│  [ 🔄 Flip for breakdown ]      │  ← Subtle flip prompt (washi-400, sm)
└─────────────────────────────────┘
```

### 5.3 Card Back — The Breakdown

```
┌─────────────────────────────────┐
│  Mr. Miyagi  ·  8.47            │  ← Compact header
│  ─────────────────────────────  │
│                                 │
│  Q1 Human Individuality   1.85  │  ← Rule rows
│  ████████████████░░  92%        │    Score bar (pill-shaped, red fill)
│                                 │
│  Q2 Japanese Identity     1.90  │
│  █████████████████░  95%        │
│                                 │
│  Q3 Harmful Tropes        1.75  │
│  █████████████████░░  87%       │
│                                 │
│  Q4 Narrative Impact      1.90  │
│  █████████████████░  95%        │
│                                 │
│  ─────────────────────────────  │
│  Detected tropes:               │
│  📚 Wise Mystic Mentor          │  ← Trope pills, full name
│  📚 Default Martial Artist ↩    │    ↩ = subverted (bonus applied)
│                                 │
│  ─────────────────────────────  │
│  AI 8.47  ·  Critics 8.20  ·   │  ← Three-tier scores (compact)
│  Audience 8.61                  │
│                                 │
│  [ Share ]  [ Full Analysis ]   │  ← Actions
└─────────────────────────────────┘
```

### 5.4 Card Flip Animation (Framer Motion)

```typescript
// Baseball card flip — the hero interaction
const cardVariants = {
  front: {
    rotateY: 0,
    transition: {
      type: "spring",
      stiffness: 80,
      damping: 18,
      duration: 0.5
    }
  },
  back: {
    rotateY: 180,
    transition: {
      type: "spring",
      stiffness: 80,
      damping: 18,
      duration: 0.5
    }
  }
};

// Container needs perspective
// style={{ perspective: 1200 }}

// Both faces need backfaceVisibility: "hidden"
// Back face needs rotateY: 180 as initial state

// On hover: slight scale up (1.02) and lift shadow
// On flip: spring with weight — not bouncy, deliberate
```

**Animation feel:** Weighted. Like picking up an actual card and turning it over. Not a flip-book snap. Not a jelly bounce. A considered rotation with just enough spring to feel alive.

---

## 6. Component Library

### 6.1 Buttons

```
PILL BUTTON (primary CTA):
  Background:  --color-red-500
  Text:        --color-washi-100, DM Sans 600, 15px
  Padding:     12px 28px
  Radius:      --radius-full
  Height:      44px
  Hover:       --color-red-400, scale(1.02), shadow lifts
  Active:      --color-red-600, scale(0.98)
  Transition:  150ms ease

PILL BUTTON (secondary):
  Background:  --color-ink-700
  Border:      1px solid --color-ink-600
  Text:        --color-washi-200
  (same shape as primary)
  Hover:       --color-ink-600, border --color-red-500

CIRCLE BUTTON (icon action):
  Width/Height: 44px
  Radius:       --radius-full
  Background:   --color-ink-700
  Icon:         Lucide, 18px, --color-washi-200
  Hover:        --color-ink-600, icon --color-washi-100
  
  Larger variant (56px) for primary actions
  Smaller variant (32px) for card actions

GHOST BUTTON (tertiary):
  Background:  transparent
  Text:        --color-washi-300, DM Sans 500
  Underline:   none (hover: --color-red-400 underline)
  No border, no radius fill
```

### 6.2 Input Fields

```
CHARACTER INPUT:
  Background:   --color-ink-800
  Border:       1.5px solid --color-ink-600
  Border-focus: 1.5px solid --color-red-500
  Radius:       --radius-md (12px)
  Height:       52px
  Padding:      0 16px
  Font:         DM Sans 400, 16px, --color-washi-100
  Placeholder:  DM Sans 300, --color-washi-400
  
  Focus ring: 0 0 0 3px rgba(231,76,60,0.25)
  
  Japanese placeholder companion:
    Below field in --text-xs, --color-washi-400, Noto Sans JP
    "キャラクター名" / "作品名"
    Fades in on focus, fades out on input
```

### 6.3 Trope Pills

```
TROPE PILL:
  Height:      28px
  Padding:     0 12px
  Radius:      --radius-full
  Font:        DM Sans 500, 12px
  
  Register variants:
    🚨 Trigger:    bg rgba(231,76,60,0.15),   border rgba(231,76,60,0.4),  text #F5856E
    📚 Teachable:  bg rgba(52,152,219,0.15),  border rgba(52,152,219,0.4), text #7EC8E3
    😂 Mockery:    bg rgba(243,156,18,0.15),  border rgba(243,156,18,0.4), text #F5C842
    🔀 Dual:       bg rgba(155,89,182,0.15),  border rgba(155,89,182,0.4), text #C39BD3
  
  Subverted trope: add ↩ suffix, opacity 0.7, strikethrough optional
  
  Hover: scale(1.05), shadow, tooltip reveals full trope name + JP subtitle
  
  Tooltip on hover:
    "Dragon Lady"
    ドラゴン・レディ
    Major · −0.25 · 🚨 Trigger Warning
    [Dispute this →]
```

### 6.4 Grade Badges

```
GRADE BADGE (large — baseball card):
  Shape:       Circle, 72px diameter
  Font:        Bebas Neue, 36px, centered
  JP subtitle: Noto Sans JP 700, 11px, centered below grade letter
  
  A+ / 優秀:   Gold (#F0A500) bg, ink text
  A  / 合格:   Green (#27AE60) bg, washi text
  B  / 良好:   Light green (#2ECC71) bg, ink text
  C  / 普通:   Amber (#F39C12) bg, ink text
  D  / 不足:   Orange (#E67E22) bg, washi text
  F  / 恥:     Red (#E74C3C) bg, washi text
  
  Entry animation: scale from 0 with spring (stiffness 200, damping 15)
  Hover: slight pulse (scale 1.05, 300ms ease)

GRADE BADGE (small — list/leaderboard):
  Shape:       Circle, 36px diameter
  Font:        Bebas Neue, 18px
  No JP subtitle at this size
```

### 6.5 Score Display

```
FINAL SCORE:
  Font:       JetBrains Mono 500
  Size:       --text-score (2rem)
  Color:      --color-washi-100
  Format:     "8.47" — always two decimal places
  
  "/10" suffix: JetBrains Mono 300, 1rem, --color-washi-400
  
  Entry animation: count up from 0.00 over 800ms with ease-out
  (The number ticks up like a scoreboard — satisfying)

RULE SUB-SCORE:
  Font:       JetBrains Mono 400, --text-score-sm (1.25rem)
  Color:      Inherits register color of the rule finding
  
SCORE PILL BAR:
  Height:     8px
  Radius:     --radius-full
  Background: --color-ink-600
  Fill:       Linear gradient, --color-red-600 → --color-red-400
  Width:      Animated from 0 to final % on load (600ms, ease-out)
  
  Full (≥90%): Fill becomes --color-gold-500
  Good (70-89%): Fill is red gradient
  Mid (50-69%): Fill becomes --color-gold-500 → --color-red-600 (warning)
  Low (<50%): Fill becomes --color-red-600 solid
```

### 6.6 Q5 Flag Pill

```
Q5 FLAG:
  Height:     32px
  Padding:    0 14px
  Radius:     --radius-full
  Font:       DM Sans 600, 12px
  
  ✅ Authentic:     bg rgba(39,174,96,0.15),  border rgba(39,174,96,0.4),  text #6FCF97
  ⚠️ Approximate:  bg rgba(243,156,18,0.15), border rgba(243,156,18,0.4), text #F5C842
  🚨 Yellowface:   bg rgba(231,76,60,0.20),  border rgba(231,76,60,0.6),  text #F5856E
                   + subtle pulse animation (2s infinite, opacity 0.7→1.0)
                   + "Wall of Shame eligible" tooltip
```

---

## 7. Loading & Processing States

### 7.1 Analysis Loading Screen

When Claude is processing (5–30s), display a full-screen or card-sized loading state with rotating messages. This is a feature, not a spinner.

**Layout:**
```
[ Large animated Serizawa Test logo — slow rotation, 3s ]

"Analyzing..."
[ rotating message — changes every 3 seconds ]

[ subtle progress pulse — not a bar, just a breathing glow ]
```

**Message rotation system:** Messages rotate every 3 seconds, randomly selected without immediate repeat. Minimum pool of 40 messages to prevent repetition in normal sessions.

**Message categories and samples:**

*Trope detection (😂 register):*
- "Scanning for Gratuitous Kimono Drops… 👘"
- "Counting cherry blossom establishing shots… 🌸"
- "Checking if anyone said 'Ah, so.'… 😑"
- "Auditing the katana-to-personality ratio… ⚔️"
- "Assessing sushi cameo frequency… 🍣"
- "Detecting unsolicited martial arts competence… 🥋"
- "Scanning for mystical wisdom dispensing… 🎋"
- "Checking Tokyo skyline establishing shot count… 🗼"
- "Reviewing accent deployment for comedic purposes… 📻"
- "Auditing conical straw hat inventory… 🎋"
- "Measuring inscrutability index… 🤔"
- "Detecting Engrish coefficient… 📝"
- "Locating the dragon lady activation sequence… 🐉"
- "Assessing honorable self-sacrifice probability… ⚰️"
- "Checking if character knows karate for no reason… 🥊"

*Narrative analysis (📚 register):*
- "Running the counterfactual removal test… 🧪"
- "Measuring narrative gravity… ⚖️"
- "Checking for irreversible decisions… 💣"
- "Evaluating emotional counterfactual impact… 💭"
- "Testing load-bearing status… 🏗️"
- "Assessing independent goal presence… 🎯"
- "Scanning for moral complexity… 🔍"
- "Checking interiority levels… 🧠"
- "Measuring cultural specificity… 📐"
- "Validating Okinawan / regional accuracy… 🗾"

*Cultural reverence (🌸 register):*
- "Consulting the ghost of Ishirō Honda… 🎬"
- "Asking Dr. Serizawa what he would have done… 💊"
- "Reviewing the 1954 precedent… 📽️"
- "Channeling Mako Mori's energy… ⚡"
- "Checking Pat Morita's notes… 📓"
- "Reading the room, and also the film… 🎥"
- "Cross-referencing TVTropes with actual Japan… 🗾"
- "Wondering what Ava DuVernay would say… 💬"

*Existential (😂 register):*
- "Questioning every Hollywood executive's choices since 1956… 🤦"
- "Mourning what could have been… 😔"
- "Preparing to be disappointed… 📋"
- "Steeling ourselves for the Wall of Shame… 🫡"
- "Hoping for the best, expecting Yellowface… 🤞"
- "Remembering that Marlon Brando did this willingly… 😤"
- "Tabulating the decades of missed opportunity… 📊"
- "Estimating damage to the discourse… 💥"

**Message typography:**
```
Main message:   DM Sans 400, 18px, --color-washi-200, centered
Emoji:          24px, leading the message
JP companion:   Noto Sans JP 400, 12px, --color-washi-400, centered, below
                (e.g., "分析中…" beneath "Analyzing…")
```

### 7.2 Micro-interactions

```
Button press:      scale(0.96), 80ms, spring back
Card hover:        translateY(-4px), shadow deepens, 200ms ease
Trope pill hover:  scale(1.05), tooltip fades in, 150ms ease
Score reveal:      Count-up animation, 800ms ease-out
Bar fill:          Width animation, 600ms ease-out, staggered per rule
Grade badge entry: scale(0) → scale(1.08) → scale(1), spring, 400ms
Page transition:   Fade + translateY(8px), 200ms ease
```

---

## 8. Page Templates

### 8.1 Home Page

```
VIEWPORT: Full height, centered vertically
BACKGROUND: --color-ink-950
MAX-WIDTH: --width-home (480px) for the form

[ App name: SERIZAWA TEST ]          ← Bebas Neue, 48px, --color-washi-100
[ 芹沢テスト ]                        ← Noto Sans JP 700, 20px, --color-red-400
                                        8px gap below English name

[ Tagline ]                           ← DM Sans 300, 16px, --color-washi-300
"Is this character load-bearing       
 — or just seasoning?"

━━━━━━━━━━━━━━━━━━━━━━━━━━

[ Character name input ]              ← Full width, 52px height
  placeholder: "Character name"
  jp: キャラクター名

[ Property / Media title input ]      ← Full width, 52px height  
  placeholder: "Film, show, or comic"
  jp: 作品名

[ ANALYZE →  分析する ]               ← Pill button, full width, 52px, red

━━━━━━━━━━━━━━━━━━━━━━━━━━

Try:                                  ← DM Sans 300, 13px, --color-washi-400
[ Mr. Miyagi · Karate Kid ]           ← Preset pills, ghost style
[ Ryu · Street Fighter ]
[ Lady Deathstrike · X2 ]
[ Mr. Yunioshi · Breakfast at Tiffany's ]

━━━━━━━━━━━━━━━━━━━━━━━━━━

BELOW FOLD — scroll to reveal:

🏆 Hall of Fame     💀 Wall of Shame    🔥 Recently Analyzed
名誉の殿堂           恥の殿堂
[ 3 mini cards ]    [ 3 mini cards ]    [ 3 mini cards ]
[ See all → ]       [ See all → ]       [ See all → ]
```

### 8.2 Results Page

```
URL: /character/mr_miyagi|the_karate_kid_1984

LAYOUT: Two-column on desktop (card left, details right)
        Single column on mobile (card on top)

LEFT COLUMN (sticky):
  Baseball card — front face visible
  Click/tap to flip
  Share button below card

RIGHT COLUMN:
  Character name (H2)
  Media + year + type
  Three-tier score display
    [ AI: 8.47 ]  [ Critics: 8.20 ]  [ Audience: 8.61 ]
  
  Rule breakdown (4 cards, stacked):
    Each card: rule name + JP, score, bar, rationale, vote buttons
    Collapsed by default, expand on tap
  
  Detected tropes (horizontal scroll on mobile):
    Trope pills with register icons
    Each expandable: full name, JP, evidence, dispute button
  
  Q5 flag (prominent):
    ✅ Authentic · Pat Morita · Japanese American
  
  Suggestions section:
    "How this could score higher" — DM Sans italic
  
  Share section:
    [ 🔗 Copy link ]  [ 🐦 Twitter/X ]  [ 📋 Copy embed ]
```

### 8.3 Wall of Shame Page

```
URL: /wall-of-shame
Header: WALL OF SHAME  /  恥の殿堂

Background: --color-ink-950 with very subtle red texture overlay
Header color: --color-red-500 for "WALL OF SHAME"
             --color-red-300 for 恥の殿堂

Subheader (DM Sans 300, washi-300):
"These portrayals failed. Some spectacularly. 
 All of them are teachable moments."

Grid: 3 columns desktop, 2 tablet, 1 mobile
Cards: Baseball cards, front face showing
       Grade badge: pulsing red F
       Extra: small "🚨 Yellowface" banner if applicable
```

---

## 9. Social Sharing Meta Tags

Every character page generates dynamic Open Graph and Twitter Card tags.
These are the images and text that appear when a URL is shared.

### 9.1 OG Image Spec

Generated dynamically via `@vercel/og` at `/api/og/[character-key].png`

```
Dimensions: 1200 × 630px (standard OG)
Background: --color-ink-950 with subtle red gradient top-left

LEFT HALF:
  Baseball card (scaled to ~280px wide)
  Grade badge overlapping card corner

RIGHT HALF:
  SERIZAWA TEST (Bebas Neue, 32px, washi-100)
  芹沢テスト (Noto Sans JP, 14px, red-400)
  
  Character name (DM Sans 700, 28px, washi-100)
  Media title (DM Sans 400, 18px, washi-300)
  
  Score: "8.47 / 10" (JetBrains Mono, 36px, washi-100)
  Grade badge (48px circle)
  
  Q5 flag pill
  
  Top 3 trope pills with register icons
  
  Footer: "serizawa.japanifornia.com"
           CC BY · Japanifornia
```

### 9.2 Meta Tag Template

```html
<!-- Primary meta -->
<title>{{CHARACTER_NAME}} ({{MEDIA_TITLE}}) — {{FINAL_SCORE}}/10 · {{GRADE}} | Serizawa Test</title>
<meta name="description" 
  content="{{SUMMARY_SENTENCE_1}} Serizawa Score: {{FINAL_SCORE}}/10 · Grade {{GRADE}}. {{TROPE_COUNT}} tropes detected. {{Q5_FLAG_TEXT}}." />

<!-- Open Graph -->
<meta property="og:type"        content="article" />
<meta property="og:url"         content="https://serizawa.japanifornia.com/character/{{CHARACTER_KEY}}" />
<meta property="og:title"       content="{{CHARACTER_NAME}} — Serizawa Score: {{FINAL_SCORE}}/10 · Grade {{GRADE}}" />
<meta property="og:description" content="{{SUMMARY_SENTENCE_1}} {{TROPE_SUMMARY}}." />
<meta property="og:image"       content="https://serizawa.japanifornia.com/api/og/{{CHARACTER_KEY}}.png" />
<meta property="og:image:width"  content="1200" />
<meta property="og:image:height" content="630" />
<meta property="og:site_name"   content="Serizawa Test · Japanifornia" />
<meta property="og:locale"      content="en_US" />

<!-- Twitter / X Card -->
<meta name="twitter:card"        content="summary_large_image" />
<meta name="twitter:site"        content="@japanifornia" />
<meta name="twitter:title"       content="{{CHARACTER_NAME}} — Serizawa Score: {{FINAL_SCORE}}/10 · Grade {{GRADE}}" />
<meta name="twitter:description" content="{{SUMMARY_SENTENCE_1}} {{TROPE_SUMMARY}}." />
<meta name="twitter:image"       content="https://serizawa.japanifornia.com/api/og/{{CHARACTER_KEY}}.png" />
<meta name="twitter:image:alt"   content="Serizawa Test baseball card for {{CHARACTER_NAME}} from {{MEDIA_TITLE}}. Score: {{FINAL_SCORE}}/10." />

<!-- Structured data — Article -->
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": "{{CHARACTER_NAME}} ({{MEDIA_TITLE}}) — Serizawa Test Analysis",
  "description": "{{SUMMARY_FULL}}",
  "url": "https://serizawa.japanifornia.com/character/{{CHARACTER_KEY}}",
  "image": "https://serizawa.japanifornia.com/api/og/{{CHARACTER_KEY}}.png",
  "publisher": {
    "@type": "Organization",
    "name": "Japanifornia",
    "url": "https://japanifornia.com"
  },
  "datePublished": "{{ANALYSIS_DATE}}",
  "dateModified": "{{UPDATED_DATE}}"
}
</script>
```

### 9.3 Unique URL Rules

```
Pattern:   /character/[character-key]
Format:    /character/{{normalized_name}}|{{normalized_media}}

Examples:
  /character/mr_miyagi|the_karate_kid_1984
  /character/mr_yunioshi|breakfast_at_tiffanys_1961
  /character/psylocke|x_men_comics_1990s
  /character/mako_mori|pacific_rim_2013
  /character/ryu|street_fighter

Canonical URL always lowercase, underscores for spaces,
year appended to media title when disambiguation needed.
Pipe character | separates character from media.

301 redirects: common alternate slugs → canonical
  /character/miyagi → /character/mr_miyagi|the_karate_kid_1984
```

---

## 10. Animation Principles Summary

| Interaction | Duration | Easing | Notes |
|---|---|---|---|
| Baseball card flip | 500ms | Spring (stiffness: 80, damping: 18) | The hero animation — weighted |
| Card hover lift | 200ms | ease-out | translateY(-4px) |
| Grade badge entry | 400ms | Spring (stiffness: 200, damping: 15) | Scale pop |
| Score count-up | 800ms | ease-out | Ticks up like a scoreboard |
| Score bar fill | 600ms | ease-out | Staggered: 100ms per rule |
| Button press | 80ms | ease | scale(0.96) → spring back |
| Trope pill hover | 150ms | ease | scale(1.05) |
| Page transition | 200ms | ease | fade + translateY(8px) |
| Loading message swap | 300ms | ease | fade out → fade in |
| Tooltip | 150ms | ease | fade in |

**Global animation rule:** If an animation feels bouncy or playful, slow it down and add damping. This app has wit but not silliness. The weight of the subject matter should be felt in the physics.

---

## 11. Accessibility

- All color combinations meet WCAG 2.1 AA contrast (4.5:1 minimum for body text)
- Focus states: `outline: 2px solid --color-red-500, outline-offset: 3px`
- All interactive elements minimum 44×44px touch target
- Japanese text has `lang="ja"` attribute for correct screen reader pronunciation
- Trope register icons (🚨 📚 😂) always accompanied by text labels — never icon-only
- Card flip has keyboard trigger (Enter/Space) and ARIA labels for both faces
- Loading messages have `aria-live="polite"` region
- Reduced motion: `@media (prefers-reduced-motion)` disables flip animation, uses fade instead

---

## 12. File & Token Reference

```
// Tailwind config extensions (tailwind.config.ts)
colors: {
  ink: { 950, 900, 800, 700, 600 },
  vermillion: { 600, 500, 400, 300, 100 },
  gold: { 500, 400, 200 },
  washi: { 100, 200, 300, 400 },
  register: { trigger, teachable, mockery, dual },
  grade: { aplus, a, b, c, d, f },
  q5: { authentic, approximate, yellowface }
}
fontFamily: {
  display: ['Bebas Neue', 'Impact', 'sans-serif'],
  body: ['DM Sans', 'Inter', 'sans-serif'],
  jp: ['Noto Sans JP', 'Hiragino Sans', 'Yu Gothic', 'sans-serif'],
  mono: ['JetBrains Mono', 'Fira Code', 'monospace']
}
borderRadius: {
  sm: '8px', md: '12px', lg: '16px',
  xl: '24px', '2xl': '32px'
}
```

---

*Serizawa Test Style Guide v1.0*  
*Japanifornia Design System*  
*誠実に、大胆に、誇りを持って*  
*(Honestly, boldly, with pride)*
