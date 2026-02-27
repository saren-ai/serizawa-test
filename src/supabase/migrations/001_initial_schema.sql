-- ============================================================
-- Serizawa Test — Initial Schema Migration
-- Migration:      001_initial_schema
-- PRD reference:  v03 §14 (Data Model), §8.4 (Trope Taxonomy),
--                 §9 (Scoring Tiers), §11 (F2 table list),
--                 §15 (analysis_raw), §21 (AI Integration)
-- Prompt ref:     serizawa-prompt-template-v1.md §4 (prompt_templates)
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- PROMPT TEMPLATES
-- Stored in DB per §21 AI Integration. Never modify a deployed
-- version in place — create a new row (ptv_2, ptv_3, …).
-- ============================================================
CREATE TABLE prompt_templates (
  id                    VARCHAR(20)  PRIMARY KEY,          -- e.g. 'ptv_1'
  rubric_version        VARCHAR(20)  NOT NULL,             -- e.g. '0.1.0'
  model_target          VARCHAR(100) NOT NULL,             -- e.g. 'claude-sonnet-4-20250514'
  system_prompt         TEXT         NOT NULL,
  user_message_template TEXT         NOT NULL,
  is_active             BOOLEAN      NOT NULL DEFAULT FALSE,
  notes                 TEXT,
  created_at            TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  deprecated_at         TIMESTAMPTZ
);

COMMENT ON TABLE  prompt_templates IS
  'Versioned AI prompt templates. is_active=TRUE marks the current template. '
  'Never update an existing row after activation — insert a new version instead.';
COMMENT ON COLUMN prompt_templates.id IS
  'Human-readable version key: ptv_1, ptv_2, … Logged on every analysis record.';


-- ============================================================
-- USERS  (public profile extending Supabase auth.users)
-- ============================================================
CREATE TABLE users (
  id                              UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name                    VARCHAR(100),
  avatar_url                      TEXT,
  role                            VARCHAR(20)  NOT NULL DEFAULT 'member',  -- member | critic | admin
  is_critic                       BOOLEAN      NOT NULL DEFAULT FALSE,
  is_admin                        BOOLEAN      NOT NULL DEFAULT FALSE,
  critic_granted_at               TIMESTAMPTZ,
  critic_granted_by               UUID,        -- references users(id); loose ref to avoid circular FK
  -- counters used for critic-eligibility checks
  accepted_trope_submissions      INTEGER      NOT NULL DEFAULT 0,
  disputes_resolved_in_favor      INTEGER      NOT NULL DEFAULT 0,
  analyses_run                    INTEGER      NOT NULL DEFAULT 0,
  created_at                      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at                      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  CONSTRAINT users_role_check CHECK (role IN ('member', 'critic', 'admin'))
);

COMMENT ON TABLE  users IS
  'Public profile row created on first auth sign-in. '
  'Critic status: ≥3 accepted trope submissions OR ≥5 disputes resolved OR admin grant.';


-- ============================================================
-- MEDIA PROPERTIES
-- ============================================================
CREATE TABLE media_properties (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  title             VARCHAR(200) NOT NULL,
  media_type        VARCHAR(50),   -- film | tv_series | comics | animation | game | other
  release_year      INTEGER,
  decade            VARCHAR(10),   -- '1940s', '1950s', … for era-filter leaderboard
  genre             VARCHAR(100),
  country_of_origin VARCHAR(50),
  created_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);


-- ============================================================
-- TROPE TAXONOMY
-- Seeded below with all 34 entries from §8.4.
-- ============================================================
CREATE TABLE tropes (
  id                VARCHAR(10)  PRIMARY KEY,               -- T001 … T037 (T006 reserved/unused)
  name              VARCHAR(100) NOT NULL,
  category          VARCHAR(60)  NOT NULL,
    -- Archetype | Cultural Reduction | Sexualization |
    -- Appearance / Accent / Language | Role Limitation |
    -- Identity / Casting / Systemic
  description       TEXT,
  register          VARCHAR(30),
    -- '📚' | '🚨' | '😂' | '📚→😂' | '😂→🚨' | '🚨→📚' | '😂→📚' | '📚→🚨'
  severity          VARCHAR(10)  NOT NULL,                  -- minor | moderate | major
  penalty           DECIMAL(3,2) NOT NULL,                  -- 0.05 | 0.10 | 0.25
  tvtropes_slug     VARCHAR(100),
  japanifornia_note TEXT,
  source_ref        TEXT,
  is_active         BOOLEAN      NOT NULL DEFAULT TRUE,
  created_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  CONSTRAINT tropes_severity_check CHECK (severity IN ('minor', 'moderate', 'major')),
  CONSTRAINT tropes_penalty_check  CHECK (penalty  IN (0.05, 0.10, 0.25))
);

COMMENT ON COLUMN tropes.register IS
  'Tonal register stored as display string (emoji). '
  'Dual registers use → notation, e.g. 😂→🚨 means lead with mockery, land with trigger.';


-- ============================================================
-- CHARACTERS
-- characters.latest_analysis_id FK is added after analyses is created
-- to resolve the mutual dependency.
-- ============================================================
CREATE TABLE characters (
  id                          UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  character_key               VARCHAR(300) UNIQUE NOT NULL,
    -- normalizeCharacterKey() output: 'mr_miyagi|the_karate_kid_1984'
  name                        VARCHAR(200) NOT NULL,
  media_property_id           UUID         REFERENCES media_properties(id) ON DELETE SET NULL,
  character_image_url         TEXT,
  gender_flag                 VARCHAR(20),    -- male | female | nonbinary | unknown
  era_specified               VARCHAR(50),    -- for split-era characters (e.g., 'Psylocke 1990s')

  -- Denormalised from latest analysis — updated on every new analysis
  first_analyzed_at           TIMESTAMPTZ,
  latest_analysis_id          UUID,           -- FK added after analyses table (see ALTER TABLE below)
  latest_final_score          DECIMAL(4,2),
  latest_grade                VARCHAR(2),     -- A+ | A | B | C | D | F
  q5_flag                     VARCHAR(20),
    -- authentic | approximate | yellowface | not_applicable | unknown
  weighted_leaderboard_score  DECIMAL(6,4),
    -- Bayesian avg: (v × R + m × C) / (v + m), m=5. Updated per §8.6.
  analysis_count              INTEGER      NOT NULL DEFAULT 0,

  -- Curation flags (set by algorithm or admin override)
  wall_of_shame               BOOLEAN      NOT NULL DEFAULT FALSE,
  hall_of_fame                BOOLEAN      NOT NULL DEFAULT FALSE,
  wall_of_shame_manual_flag   BOOLEAN      NOT NULL DEFAULT FALSE,  -- admin override
  hall_of_fame_manual_flag    BOOLEAN      NOT NULL DEFAULT FALSE,

  -- Analytics counters (incremented server-side, no client tracking)
  lookup_count                INTEGER      NOT NULL DEFAULT 0,
  view_count                  INTEGER      NOT NULL DEFAULT 0,
  share_count                 INTEGER      NOT NULL DEFAULT 0,

  created_at                  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at                  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

COMMENT ON COLUMN characters.character_key IS
  'Output of normalizeCharacterKey(name, mediaTitle). '
  'Example: "mr_miyagi|the_karate_kid_1984". Max 300 chars.';
COMMENT ON COLUMN characters.weighted_leaderboard_score IS
  'Bayesian average — prevents low-sample outliers dominating leaderboards. '
  'Formula: (v × R + m × C) / (v + m) where m=5, C=global mean FinalScore.';


-- ============================================================
-- ANALYSES
-- All DECIMAL(4,2) for scored fields per code conventions.
-- Server always overwrites model arithmetic via computeScores().
-- ============================================================
CREATE TABLE analyses (
  id                            UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  character_id                  UUID         NOT NULL REFERENCES characters(id) ON DELETE CASCADE,

  -- Q1 — Human Individuality (0.00–2.00)
  q1_score                      DECIMAL(3,2),
  q1_1a_score                   DECIMAL(3,2),  -- goal independence   (weight 40%)
  q1_1b_score                   DECIMAL(3,2),  -- moral complexity    (weight 35%)
  q1_1c_score                   DECIMAL(3,2),  -- emotional interior  (weight 25%)
  q1_rationale                  TEXT,
  q1_register                   VARCHAR(20),   -- teachable | trigger | mockery | dual

  -- Q2 — Distinctly Japanese Identity (0.00–2.00)
  q2_score                      DECIMAL(3,2),
  q2_2a_score                   DECIMAL(3,2),  -- explicit identity       (weight 35%)
  q2_2b_score                   DECIMAL(3,2),  -- cultural accuracy       (weight 35%)
  q2_2c_score                   DECIMAL(3,2),  -- internalized heritage   (weight 30%)
  q2_rationale                  TEXT,
  q2_register                   VARCHAR(20),

  -- Q3 — Avoidance of Harmful Tropes (base 2.00, modified by penalties/bonuses)
  q3_score                      DECIMAL(3,2),
  q3_rationale                  TEXT,
  q3_register                   VARCHAR(20),

  -- Q4 — Narrative Impact (0.00–2.00)
  q4_score                      DECIMAL(3,2),
  q4_4a_score                   DECIMAL(3,2),  -- plot counterfactual      (weight 40%)
  q4_4b_score                   DECIMAL(3,2),  -- emotional counterfactual (weight 35%)
  q4_4c_score                   DECIMAL(3,2),  -- irreversible decision    (weight 25%)
  q4_rationale                  TEXT,
  q4_register                   VARCHAR(20),
  q4_irreversible_decision_desc TEXT,          -- required when 4c > 0; null otherwise

  -- Q5 — Production Authenticity Flag (NOT scored — never in FinalScore)
  q5_flag                       VARCHAR(20),
    -- authentic | approximate | yellowface | not_applicable | unknown
  q5_actor_name                 VARCHAR(200),
  q5_actor_heritage             TEXT,
  q5_notes                      TEXT,
  q5_wall_of_shame_eligible     BOOLEAN      NOT NULL DEFAULT FALSE,
    -- TRUE only when q5_flag = 'yellowface' AND at least one major trope detected

  -- Server-computed scores (computeScores() overwrites model arithmetic)
  base_score                    DECIMAL(4,2),
    -- Q1 + Q2 + 2.00 (Q3 base) + Q4, computed before penalty cap
  trope_penalty_raw             DECIMAL(4,2),  -- Σ distinct trope penalties
  trope_penalty_capped          DECIMAL(4,2),  -- min(raw, 0.30 × base_score)
  trope_bonus                   DECIMAL(4,2),  -- Σ subversion bonuses, max 0.25
  final_score                   DECIMAL(4,2),  -- Q1 + Q2 + Q3_final + Q4, clamped 0–10
  grade                         VARCHAR(2),    -- A+ | A | B | C | D | F
  grade_label                   VARCHAR(50),

  -- Trope detection array — full structure per prompt template §Output Format
  tropes      JSONB,
    -- [{id, name, severity, penalty, register, evidence,
    --   subverted, subversion_description}]
  subversions JSONB,
    -- [{trope_id, description}] — denormalised from tropes for fast querying

  -- Model output fields
  suggestions          TEXT,       -- 3–5 actionable recommendations
  summary              TEXT,       -- 2–3 sentence Japanifornia verdict; used for OG sharing
  confidence           VARCHAR(10), -- high | medium | low
  confidence_notes     TEXT,        -- non-null when confidence ≠ high

  -- Provenance / governance — logged on every analysis (§15)
  rubric_version           VARCHAR(20),
  model_version            VARCHAR(50),   -- e.g. 'claude-sonnet-4-20250514'
  prompt_template_version  VARCHAR(20)    REFERENCES prompt_templates(id),
  era_specified            VARCHAR(50),   -- echoed from input
  media_type_analyzed      VARCHAR(50),
  gender_flag_used         VARCHAR(20),
  processing_duration_ms   INTEGER,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT analyses_q5_flag_check CHECK (
    q5_flag IN ('authentic','approximate','yellowface','not_applicable','unknown') OR q5_flag IS NULL
  ),
  CONSTRAINT analyses_confidence_check CHECK (
    confidence IN ('high','medium','low') OR confidence IS NULL
  )
);

COMMENT ON COLUMN analyses.base_score IS
  'Computed before penalty cap: Q1 + Q2 + 2.00 (Q3 base) + Q4. '
  'Cap = min(trope_penalty_raw, 0.30 × base_score).';
COMMENT ON COLUMN analyses.summary IS
  '2–3 sentence Japanifornia verdict. Appears on character card and populates OG description.';
COMMENT ON COLUMN analyses.tropes IS
  'Full trope detection array. Subversion fields embedded per prompt template schema.';


-- ============================================================
-- RAW ANALYSIS STORAGE  (audit only — not publicly accessible)
-- Stores raw Claude prompt + response for monthly audit workflow (§15).
-- ============================================================
CREATE TABLE analysis_raw (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  analysis_id  UUID        NOT NULL REFERENCES analyses(id) ON DELETE CASCADE,
  raw_prompt   TEXT        NOT NULL,
  raw_response TEXT        NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE analysis_raw IS
  'Secured raw AI I/O for audit purposes. Not publicly accessible. '
  'Row Level Security: admin only.';


-- ============================================================
-- Resolve characters ↔ analyses circular dependency
-- ============================================================
ALTER TABLE characters
  ADD CONSTRAINT characters_latest_analysis_id_fkey
  FOREIGN KEY (latest_analysis_id) REFERENCES analyses(id) ON DELETE SET NULL;


-- ============================================================
-- THREE-TIER VOTES
-- Critic votes carry 3× weight in Critic Score; audience 1×.
-- Minimum 3 votes before any community score is displayed (app logic).
-- ============================================================
CREATE TABLE votes (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  analysis_id UUID        NOT NULL REFERENCES analyses(id) ON DELETE CASCADE,
  user_id     UUID        NOT NULL REFERENCES users(id)    ON DELETE CASCADE,
  rule        VARCHAR(5)  NOT NULL,   -- q1 | q2 | q3 | q4
  vote        VARCHAR(20) NOT NULL,   -- agree | disagree | indifferent
  is_critic   BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (analysis_id, user_id, rule),
  CONSTRAINT votes_rule_check CHECK (rule IN ('q1','q2','q3','q4')),
  CONSTRAINT votes_vote_check CHECK (vote IN ('agree','disagree','indifferent'))
);


-- ============================================================
-- TROPE SUBMISSIONS  (community-submitted new tropes)
-- Mirrored to GitHub Issues via webhook (§12.4).
-- Requires ≥3 support_votes for acceptance consideration.
-- ============================================================
CREATE TABLE trope_submissions (
  id                  UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  submitted_by        UUID         REFERENCES users(id) ON DELETE SET NULL,
  proposed_trope_id   VARCHAR(10),  -- null until accepted and ID assigned
  name                VARCHAR(100) NOT NULL,
  category            VARCHAR(60),
  description         TEXT         NOT NULL,
  severity            VARCHAR(10),  -- minor | moderate | major
  penalty             DECIMAL(3,2),
  register            VARCHAR(30),
  tvtropes_slug       VARCHAR(100),
  japanifornia_note   TEXT,
  source_ref          TEXT,
  example             TEXT,
  status              VARCHAR(20)  NOT NULL DEFAULT 'pending',
  support_votes       INTEGER      NOT NULL DEFAULT 0,
  reviewed_by         UUID         REFERENCES users(id) ON DELETE SET NULL,
  reviewed_at         TIMESTAMPTZ,
  rejection_reason    TEXT,
  github_issue_number INTEGER,
  created_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  CONSTRAINT trope_submissions_status_check
    CHECK (status IN ('pending','accepted','rejected')),
  CONSTRAINT trope_submissions_severity_check
    CHECK (severity IN ('minor','moderate','major') OR severity IS NULL)
);


-- ============================================================
-- RULE SUGGESTIONS  (proposed rubric changes — F1.8)
-- Mirrored to GitHub Issues via webhook (§12.4).
-- rationale minimum 50 chars enforced by CHECK constraint.
-- ============================================================
CREATE TABLE rule_suggestions (
  id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  submitted_by        UUID        REFERENCES users(id) ON DELETE SET NULL,
  rule_id             VARCHAR(5)  NOT NULL,   -- q1 | q2 | q3 | q4 | q5
  proposed_change     TEXT        NOT NULL,
  rationale           TEXT        NOT NULL,
  evidence_links      TEXT[],
  status              VARCHAR(20) NOT NULL DEFAULT 'pending',
  reviewed_by         UUID        REFERENCES users(id) ON DELETE SET NULL,
  reviewed_at         TIMESTAMPTZ,
  rejection_reason    TEXT,
  github_issue_number INTEGER,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT rule_suggestions_rule_check
    CHECK (rule_id IN ('q1','q2','q3','q4','q5')),
  CONSTRAINT rule_suggestions_status_check
    CHECK (status IN ('pending','accepted','rejected','under_review')),
  CONSTRAINT rule_suggestions_rationale_min_length
    CHECK (char_length(rationale) >= 50)
);


-- ============================================================
-- GLOSSARY TERMS  (F10)
-- Seed content: all 34 tropes + 5 rules + lineage test names (app layer).
-- ============================================================
CREATE TABLE glossary_terms (
  id             UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  term           VARCHAR(100) NOT NULL,
  definition     TEXT         NOT NULL,
  examples       TEXT,
  register       VARCHAR(30),
  related_tropes TEXT[],      -- array of trope IDs e.g. '{T001,T002}'
  source_links   TEXT[],
  status         VARCHAR(20)  NOT NULL DEFAULT 'pending',
  submitted_by   UUID         REFERENCES users(id) ON DELETE SET NULL,
  reviewed_by    UUID         REFERENCES users(id) ON DELETE SET NULL,
  reviewed_at    TIMESTAMPTZ,
  created_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  CONSTRAINT glossary_terms_status_check
    CHECK (status IN ('pending','accepted','rejected'))
);


-- ============================================================
-- CRITIC APPLICATIONS  (§9.1)
-- ============================================================
CREATE TABLE critic_applications (
  id                        UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                   UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rationale                 TEXT,
  qualifying_trope_count    INTEGER     NOT NULL DEFAULT 0,
  qualifying_dispute_count  INTEGER     NOT NULL DEFAULT 0,
  status                    VARCHAR(20) NOT NULL DEFAULT 'pending',
  reviewed_by               UUID        REFERENCES users(id) ON DELETE SET NULL,
  reviewed_at               TIMESTAMPTZ,
  rejection_reason          TEXT,
  created_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT critic_applications_status_check
    CHECK (status IN ('pending','approved','rejected'))
);


-- ============================================================
-- BULK IMPORT JOBS  (F1.7 / F7)
-- ============================================================
CREATE TABLE bulk_jobs (
  id                       UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id                 UUID        REFERENCES users(id) ON DELETE SET NULL,
  file_name                VARCHAR(255),
  total_items              INTEGER     NOT NULL DEFAULT 0,
  processed_items          INTEGER     NOT NULL DEFAULT 0,
  failed_items             INTEGER     NOT NULL DEFAULT 0,
  status                   VARCHAR(20) NOT NULL DEFAULT 'pending',
  error_message            TEXT,
  github_wiki_sync_queued  BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at             TIMESTAMPTZ,
  CONSTRAINT bulk_jobs_status_check
    CHECK (status IN ('pending','processing','completed','failed','cancelled'))
);


-- ============================================================
-- BULK IMPORT ITEMS  (one row per CSV line)
-- ============================================================
CREATE TABLE bulk_items (
  id                 UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id             UUID        NOT NULL REFERENCES bulk_jobs(id) ON DELETE CASCADE,
  character_name     VARCHAR(200) NOT NULL,
  media_title        VARCHAR(200) NOT NULL,
  media_type         VARCHAR(50),
  era                VARCHAR(50),
  gender_flag        VARCHAR(20),
  additional_context TEXT,
  status             VARCHAR(20) NOT NULL DEFAULT 'pending',
  character_id       UUID        REFERENCES characters(id) ON DELETE SET NULL,
  analysis_id        UUID        REFERENCES analyses(id)   ON DELETE SET NULL,
  error_message      TEXT,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  processed_at       TIMESTAMPTZ,
  CONSTRAINT bulk_items_status_check
    CHECK (status IN ('pending','processing','completed','failed','skipped'))
);


-- ============================================================
-- AUDIT LOGS  (§18 Analytics Plan — server-side only, no client scripts)
-- ============================================================
CREATE TABLE audit_logs (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type  VARCHAR(50) NOT NULL,
    -- analysis_run | vote_cast | trope_accepted | trope_rejected |
    -- rule_accepted | critic_approved | bulk_job_completed |
    -- wall_of_shame_flagged | hall_of_fame_flagged | monthly_audit | …
  entity_type VARCHAR(50),   -- character | analysis | trope | user | …
  entity_id   TEXT,          -- UUID string or character_key
  admin_id    UUID           REFERENCES users(id) ON DELETE SET NULL,
  user_id     UUID           REFERENCES users(id) ON DELETE SET NULL,
  details     JSONB,
  created_at  TIMESTAMPTZ    NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE audit_logs IS
  'Server-side aggregate event log. No client instrumentation. '
  'Used for monthly audits (§15) and Transparency page analytics (§18).';


-- ============================================================
-- MODEL VERSIONS  (§F4 Transparency Page — model version log)
-- ============================================================
CREATE TABLE model_versions (
  id                      UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  model_name              VARCHAR(100) NOT NULL,   -- 'claude-sonnet-4-20250514'
  provider                VARCHAR(50)  NOT NULL,   -- 'anthropic'
  released_at             DATE,
  prompt_template_version VARCHAR(20)  REFERENCES prompt_templates(id),
  is_current              BOOLEAN      NOT NULL DEFAULT FALSE,
  notes                   TEXT,
  created_at              TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);


-- ============================================================
-- CHARACTER ASSOCIATIONS
-- Cross-media / cross-era links (e.g., Psylocke comics ↔ film adaptation).
-- ============================================================
CREATE TABLE character_associations (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  character_id_1   UUID        NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
  character_id_2   UUID        NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
  association_type VARCHAR(50),
    -- same_character_different_era | same_character_adaptation | thematic_comparison
  notes            TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (character_id_1, character_id_2),
  CONSTRAINT character_associations_no_self_ref CHECK (character_id_1 <> character_id_2)
);


-- ============================================================
-- CHARACTER SHARES  (social sharing analytics — F9.4)
-- Anonymous inserts allowed; no PII collected per §17.
-- ============================================================
CREATE TABLE character_shares (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  character_id UUID        NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
  platform     VARCHAR(50),  -- twitter | facebook | link_copy | embed | other
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ============================================================
-- INDEXES
-- ============================================================

-- characters
CREATE INDEX idx_characters_media_property        ON characters(media_property_id);
CREATE INDEX idx_characters_latest_final_score    ON characters(latest_final_score DESC NULLS LAST);
CREATE INDEX idx_characters_weighted_leaderboard  ON characters(weighted_leaderboard_score DESC NULLS LAST);
CREATE INDEX idx_characters_lookup_count          ON characters(lookup_count DESC);
CREATE INDEX idx_characters_wall_of_shame         ON characters(wall_of_shame) WHERE wall_of_shame = TRUE;
CREATE INDEX idx_characters_hall_of_fame          ON characters(hall_of_fame)  WHERE hall_of_fame  = TRUE;
CREATE INDEX idx_characters_name_fts              ON characters USING gin(to_tsvector('english', name));

-- analyses
CREATE INDEX idx_analyses_character      ON analyses(character_id);
CREATE INDEX idx_analyses_created_at     ON analyses(created_at DESC);
CREATE INDEX idx_analyses_final_score    ON analyses(final_score DESC NULLS LAST);
CREATE INDEX idx_analyses_prompt_version ON analyses(prompt_template_version);

-- votes
CREATE INDEX idx_votes_analysis ON votes(analysis_id);
CREATE INDEX idx_votes_user     ON votes(user_id);

-- community content
CREATE INDEX idx_trope_submissions_status ON trope_submissions(status);
CREATE INDEX idx_rule_suggestions_status  ON rule_suggestions(status);
CREATE INDEX idx_glossary_terms_status    ON glossary_terms(status);
CREATE INDEX idx_glossary_terms_fts       ON glossary_terms
  USING gin(to_tsvector('english', term || ' ' || definition));

-- bulk processing
CREATE INDEX idx_bulk_items_job    ON bulk_items(job_id);
CREATE INDEX idx_bulk_items_status ON bulk_items(status);

-- audit & analytics
CREATE INDEX idx_audit_logs_event_type ON audit_logs(event_type);
CREATE INDEX idx_audit_logs_entity     ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);

-- social
CREATE INDEX idx_character_shares_character  ON character_shares(character_id);
CREATE INDEX idx_character_shares_created_at ON character_shares(created_at DESC);


-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE prompt_templates        ENABLE ROW LEVEL SECURITY;
ALTER TABLE users                   ENABLE ROW LEVEL SECURITY;
ALTER TABLE media_properties        ENABLE ROW LEVEL SECURITY;
ALTER TABLE tropes                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE characters              ENABLE ROW LEVEL SECURITY;
ALTER TABLE analyses                ENABLE ROW LEVEL SECURITY;
ALTER TABLE analysis_raw            ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes                   ENABLE ROW LEVEL SECURITY;
ALTER TABLE trope_submissions       ENABLE ROW LEVEL SECURITY;
ALTER TABLE rule_suggestions        ENABLE ROW LEVEL SECURITY;
ALTER TABLE glossary_terms          ENABLE ROW LEVEL SECURITY;
ALTER TABLE critic_applications     ENABLE ROW LEVEL SECURITY;
ALTER TABLE bulk_jobs               ENABLE ROW LEVEL SECURITY;
ALTER TABLE bulk_items              ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs              ENABLE ROW LEVEL SECURITY;
ALTER TABLE model_versions          ENABLE ROW LEVEL SECURITY;
ALTER TABLE character_associations  ENABLE ROW LEVEL SECURITY;
ALTER TABLE character_shares        ENABLE ROW LEVEL SECURITY;

-- Helper: is the current user an admin?
-- Used inline to avoid a function dependency.

-- prompt_templates: public read for active templates (rubric is intentionally transparent)
CREATE POLICY "prompt_templates_public_read" ON prompt_templates
  FOR SELECT USING (is_active = TRUE);
CREATE POLICY "prompt_templates_admin_all" ON prompt_templates
  FOR ALL USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = TRUE));

-- media_properties: public read; admin write
CREATE POLICY "media_properties_public_read" ON media_properties
  FOR SELECT USING (TRUE);
CREATE POLICY "media_properties_admin_write" ON media_properties
  FOR ALL USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = TRUE));

-- tropes: public read (active only); admin write
CREATE POLICY "tropes_public_read" ON tropes
  FOR SELECT USING (is_active = TRUE);
CREATE POLICY "tropes_admin_all" ON tropes
  FOR ALL USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = TRUE));

-- model_versions: public read
CREATE POLICY "model_versions_public_read" ON model_versions
  FOR SELECT USING (TRUE);
CREATE POLICY "model_versions_admin_write" ON model_versions
  FOR ALL USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = TRUE));

-- characters: public read; server-side writes via service role
CREATE POLICY "characters_public_read" ON characters
  FOR SELECT USING (TRUE);

-- analyses: public read; server-side writes via service role
CREATE POLICY "analyses_public_read" ON analyses
  FOR SELECT USING (TRUE);

-- analysis_raw: admin only (audit purposes)
CREATE POLICY "analysis_raw_admin_only" ON analysis_raw
  FOR ALL USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = TRUE));

-- users: all can read public profiles; own row for update
CREATE POLICY "users_public_read" ON users
  FOR SELECT USING (TRUE);
CREATE POLICY "users_own_update" ON users
  FOR UPDATE USING (id = auth.uid());

-- votes: public read; authenticated insert/update own rows only
CREATE POLICY "votes_public_read" ON votes
  FOR SELECT USING (TRUE);
CREATE POLICY "votes_own_insert" ON votes
  FOR INSERT WITH CHECK (user_id = auth.uid() AND auth.uid() IS NOT NULL);
CREATE POLICY "votes_own_update" ON votes
  FOR UPDATE USING (user_id = auth.uid());

-- trope_submissions: accepted submissions public; own pending; admin all
CREATE POLICY "trope_submissions_read" ON trope_submissions
  FOR SELECT USING (
    status = 'accepted'
    OR submitted_by = auth.uid()
    OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = TRUE)
  );
CREATE POLICY "trope_submissions_authenticated_insert" ON trope_submissions
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL AND submitted_by = auth.uid());
CREATE POLICY "trope_submissions_admin_update" ON trope_submissions
  FOR UPDATE USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = TRUE));

-- rule_suggestions: same pattern as trope_submissions
CREATE POLICY "rule_suggestions_read" ON rule_suggestions
  FOR SELECT USING (
    status = 'accepted'
    OR submitted_by = auth.uid()
    OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = TRUE)
  );
CREATE POLICY "rule_suggestions_authenticated_insert" ON rule_suggestions
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL AND submitted_by = auth.uid());
CREATE POLICY "rule_suggestions_admin_update" ON rule_suggestions
  FOR UPDATE USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = TRUE));

-- glossary_terms: accepted public; own and admin full access
CREATE POLICY "glossary_terms_read" ON glossary_terms
  FOR SELECT USING (
    status = 'accepted'
    OR submitted_by = auth.uid()
    OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = TRUE)
  );
CREATE POLICY "glossary_terms_authenticated_insert" ON glossary_terms
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL AND submitted_by = auth.uid());
CREATE POLICY "glossary_terms_admin_update" ON glossary_terms
  FOR UPDATE USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = TRUE));

-- critic_applications: own row; admin all
CREATE POLICY "critic_applications_own_read" ON critic_applications
  FOR SELECT USING (
    user_id = auth.uid()
    OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = TRUE)
  );
CREATE POLICY "critic_applications_own_insert" ON critic_applications
  FOR INSERT WITH CHECK (user_id = auth.uid() AND auth.uid() IS NOT NULL);
CREATE POLICY "critic_applications_admin_update" ON critic_applications
  FOR UPDATE USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = TRUE));

-- bulk_jobs / bulk_items: admin only
CREATE POLICY "bulk_jobs_admin_only" ON bulk_jobs
  FOR ALL USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = TRUE));
CREATE POLICY "bulk_items_admin_only" ON bulk_items
  FOR ALL USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = TRUE));

-- audit_logs: admin only
CREATE POLICY "audit_logs_admin_only" ON audit_logs
  FOR ALL USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = TRUE));

-- character_associations: public read; admin write
CREATE POLICY "character_associations_public_read" ON character_associations
  FOR SELECT USING (TRUE);
CREATE POLICY "character_associations_admin_write" ON character_associations
  FOR ALL USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = TRUE));

-- character_shares: anonymous insert (no PII per §17); admin read
CREATE POLICY "character_shares_insert_anon" ON character_shares
  FOR INSERT WITH CHECK (TRUE);
CREATE POLICY "character_shares_admin_read" ON character_shares
  FOR SELECT USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = TRUE));


-- ============================================================
-- SEED DATA: TROPE TAXONOMY v01
-- All 34 entries from PRD §8.4 (T006 not used / reserved).
-- ============================================================
INSERT INTO tropes (id, name, category, severity, penalty, register, tvtropes_slug, japanifornia_note)
VALUES

-- Category 1: Archetype
('T001', 'Wise Mystic Mentor',            'Archetype', 'moderate', 0.10, '📚',    'wise_old_master',
  'The Miyagi borderline case. Depth saves it; pure cryptic wisdom dispensing sinks it'),
('T003', 'Silent Enforcer',               'Archetype', 'moderate', 0.10, '📚',    'strong_silent_type',
  'Stoic competence without interiority. Katana''s ZIP code'),
('T004', 'Default Martial Artist',        'Archetype', 'moderate', 0.10, '📚',    'martial_arts_dojo',
  'Skill assignment without narrative basis. Did anyone ask if they wanted to do karate?'),
('T012', 'Technological Savant Automaton','Archetype', 'moderate', 0.10, '📚',    'the_savant',
  'Emotionless logic machine. Every 90s cyberpunk film''s "Japanese hacker"'),
('T013', 'The Houseboy',                  'Archetype', 'major',    0.25, '🚨',    'manservant',
  'Domestic servitude coding. Racial and gender dimensions intersect nastily here'),

-- Category 2: Cultural Reduction
('T005', 'Samurai / Ninja Assumption',      'Cultural Reduction', 'major',    0.25, '📚→😂', 'samurai / ninja',
  'Starts 📚, becomes 😂 when a modern salaryman inexplicably knows kenjutsu'),
('T010', 'Gratuitous Kimono Drop',          'Cultural Reduction', 'minor',    0.05, '😂',    'kimono',
  'Shallow costume cameo unmoored from context. The cherry blossom establishing shot of clothing'),
('T014', 'Interchangeable Asian Cultures',  'Cultural Reduction', 'major',    0.25, '🚨',    'interchangeable_asian_cultures',
  'Japanese character with Chinese customs, Korean food, vaguely pan-Asian accent. Do your homework'),
('T015', 'Gaijin in Japan',                 'Cultural Reduction', 'minor',    0.05, '😂',    'gaijin',
  'White protagonist arrives in Japan, immediately becomes the most important person in the room'),
('T016', 'Tokyo Is the Center of the Universe', 'Cultural Reduction', 'minor', 0.05, '😂',   'tokyo_is_the_center_of_the_universe',
  'All of Japan is Tokyo. Osaka weeps. Okinawa has entered the chat'),
('T017', 'Japandering',                     'Cultural Reduction', 'minor',    0.05, '😂',    'japandering',
  'Western celebrity doing baffling Japanese ads. Not always harmful but deeply, beautifully weird'),
('T018', 'Japan Takes Over the World',      'Cultural Reduction', 'moderate', 0.10, '📚',    'japan_takes_over_the_world',
  'Yellow Peril''s economic anxiety cousin. Very 1980s. Still occasionally dusted off'),
('T019', 'WWII Soldier Doesn''t Know War Is Over', 'Cultural Reduction', 'moderate', 0.10, '😂→📚', NULL,
  'Hiroo Onoda territory. Starts 😂, lands 📚 when you learn the actual history'),

-- Category 3: Sexualization
('T002', 'Dragon Lady',                      'Sexualization', 'major',    0.25, '🚨',    'dragon_lady',
  'Alluring, manipulative, exoticized. Sexuality as threat. Still very much alive'),
('T007', 'Exotic Sexual Object',             'Sexualization', 'major',    0.25, '🚨',    'exotic_beauty',
  'Fetishized otherness as primary characterization. The camera lingers, the character evaporates'),
('T020', 'Geisha Stereotype',                'Sexualization', 'major',    0.25, '🚨→📚', 'geisha',
  'Submission and service as feminine ideal. Doesn''t require a literal geisha — the affect is enough'),
('T021', 'Yamato Nadeshiko',                 'Sexualization', 'moderate', 0.10, '📚',    'yamato_nadeshiko',
  'The "ideal Japanese woman" — demure, devoted, self-sacrificing. Positive framing that''s still a cage'),
('T022', 'Mighty Whitey and Mellow Yellow',  'Sexualization', 'major',    0.25, '🚨',    'mighty_whitey_and_mellow_yellow',
  'White male protagonist + devoted Japanese woman. Madama Butterfly''s Hollywood grandchildren'),

-- Category 4: Appearance / Accent / Language
('T008', 'Comedic Accent Gag',                   'Appearance / Accent / Language', 'moderate', 0.10, '😂→🚨', 'funny_accent',
  'Accent deployed for othering or humor. Starts 😂 in the room, lands 🚨 on the person it''s about'),
('T009', 'Asian Buck Teeth',                     'Appearance / Accent / Language', 'major',    0.25, '🚨',    'buck_teeth',
  'Legacy caricature. No redemptive reading exists. Full stop'),
('T023', 'Engrish / Japanese Ranguage',          'Appearance / Accent / Language', 'moderate', 0.10, '😂→🚨', 'engrish',
  'Mangled English as comedy. The 😂 is the tell — it''s laughing at, not with'),
('T024', 'Ching Chong',                          'Appearance / Accent / Language', 'major',    0.25, '🚨',    'ching_chong',
  'Onomatopoeic mockery of East Asian languages. No register ambiguity here'),
('T025', '"Ah, So."',                            'Appearance / Accent / Language', 'moderate', 0.10, '😂→🚨', NULL,
  'Specific phrase deployed as Japanese accent shorthand. So lazy it''s almost impressive. Almost'),
('T026', 'All Asians Wear Conical Straw Hats',   'Appearance / Accent / Language', 'minor',    0.05, '😂',    'conical_hat',
  'It''s 2024. And yet'),

-- Category 5: Role Limitation
('T011', 'Salaryman Flatness',                      'Role Limitation', 'minor',    0.05, '📚',    'salaryman',
  'Defined entirely by overworked office drone trope. Surprisingly common in prestige drama'),
('T027', 'Asian Airhead',                           'Role Limitation', 'moderate', 0.10, '😂→🚨', 'asian_airhead',
  'Ditzy, shallow, accent-adjacent. The kawaii pipeline misused'),
('T028', 'Asian and Nerdy',                         'Role Limitation', 'minor',    0.05, '📚',    'asian_and_nerdy',
  'Model minority stereotype wearing a pocket protector. Low severity, cumulative damage'),
('T029', 'Asian Babymama',                          'Role Limitation', 'moderate', 0.10, '🚨',    'asian_babymama',
  'Exists to produce mixed-race children for the white protagonist''s storyline. See T022'),
('T030', 'Asian Drivers',                           'Role Limitation', 'minor',    0.05, '😂',    'asian_drivers',
  'Deeply stupid. Gets the 😂 register and a raised eyebrow'),
('T031', 'Inscrutable Oriental',                    'Role Limitation', 'moderate', 0.10, '📚→🚨', 'inscrutable_oriental',
  'Deliberate inscrutability as characterization. Otherness as personality. Older than Hollywood'),
('T032', 'Japanese Politeness as Characterization', 'Role Limitation', 'minor',    0.05, '📚',    'japanese_politeness',
  'Politeness so exaggerated it replaces personality. Courtesy without humanity'),
('T033', 'Asian Cleaver Fever',                     'Role Limitation', 'minor',    0.05, '😂→🚨', NULL,
  'Specific prop-as-menace coding. Rare but worth tracking'),

-- Category 6: Identity / Casting / Systemic
('T034', 'Yellowface',           'Identity / Casting / Systemic', 'major',    0.25, '🚨',  'yellowface',
  'Non-Asian actor in Asian role. Primary Wall of Shame admission criterion'),
('T035', 'Whitey Playing Hāfu', 'Identity / Casting / Systemic', 'moderate', 0.10, '🚨',  NULL,
  'White or non-Japanese actor playing mixed Japanese heritage. Same spectrum, different severity'),
('T036', 'Yellow Peril',         'Identity / Casting / Systemic', 'major',    0.25, '🚨',  'yellow_peril',
  'Systemic threat framing. The ideological foundation of half this list'),
('T037', 'Asian Speekee Engrish','Identity / Casting / Systemic', 'moderate', 0.10, '😂→🚨','speekee_engrish',
  'Broader than T023 — systemic accent mockery as characterization');


-- ============================================================
-- SEED DATA: PROMPT TEMPLATE ptv_1
--
-- IMPORTANT: system_prompt below is a placeholder stub.
-- Before activating (set is_active = TRUE), replace the
-- system_prompt value with the full text from
-- serizawa-prompt-template-v1.md §1 System Prompt.
-- Never modify a row after setting is_active = TRUE.
-- ============================================================
INSERT INTO prompt_templates (
  id, rubric_version, model_target,
  system_prompt, user_message_template,
  is_active, notes
) VALUES (
  'ptv_1',
  '0.1.0',
  'claude-sonnet-4-20250514',
  '-- PLACEHOLDER: replace with full system prompt from serizawa-prompt-template-v1.md §1 before activating --',
  'Analyze the following character using the Serizawa Test framework provided in your system instructions.

Character name: {{CHARACTER_NAME}}
Media title: {{MEDIA_TITLE}}
Media type: {{MEDIA_TYPE}}
{{#if ERA}}Era / version: {{ERA}}{{/if}}
{{#if GENDER_FLAG}}Character gender: {{GENDER_FLAG}}{{/if}}
{{#if ADDITIONAL_CONTEXT}}Additional context: {{ADDITIONAL_CONTEXT}}{{/if}}

Return your analysis as valid JSON matching the required output schema.
Do not include any text outside the JSON object.',
  FALSE,
  'Initial template from serizawa-prompt-template-v1.md. '
  'Populate system_prompt with full content from §1, then set is_active = TRUE. '
  'Rubric version 0.1.0 — see PRD Appendix C.'
);


-- ============================================================
-- SEED DATA: INITIAL MODEL VERSION
-- ============================================================
INSERT INTO model_versions (
  model_name, provider, released_at, prompt_template_version, is_current, notes
) VALUES (
  'claude-sonnet-4-20250514',
  'anthropic',
  '2025-05-14',
  'ptv_1',
  TRUE,
  'Launch model. See PRD §21 AI Integration.'
);
