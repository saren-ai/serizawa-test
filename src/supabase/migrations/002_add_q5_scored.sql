-- Migration 002: Add scored Q5 (Narrative Dignity & Gaze) columns
-- Run in Supabase SQL Editor after 001_initial_schema.sql

ALTER TABLE analyses
  ADD COLUMN IF NOT EXISTS q5_score      DECIMAL(3,2),
  ADD COLUMN IF NOT EXISTS q5_rationale  TEXT,
  ADD COLUMN IF NOT EXISTS q5_register   VARCHAR(20);

COMMENT ON COLUMN analyses.q5_score IS
  'Q5 scored: Narrative Dignity & Gaze (0.00–2.00). '
  'Sub-scores: 5a framing dignity (40%), 5b peer engagement (35%), 5c cultural framing (25%). '
  'Distinct from q5_flag (production authenticity flag — never scored).';
