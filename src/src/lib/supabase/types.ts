/**
 * Minimal typed schema for Supabase queries.
 * Generated types would live here once `supabase gen types typescript` is run.
 * Until then, use these hand-authored types matching the migration schema.
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type UserRole = "member" | "critic" | "admin";

export type Q5Flag =
  | "authentic"
  | "approximate"
  | "yellowface"
  | "not_applicable"
  | "unknown";

export type TropeSeverity = "minor" | "moderate" | "major";

export type TropeRegister =
  | "trigger"
  | "teachable"
  | "mockery"
  | "dual";

export type MediaType =
  | "film"
  | "tv_series"
  | "comics"
  | "animation"
  | "game"
  | "other";

export type Grade = "A+" | "A" | "B" | "C" | "D" | "F";

export type VoteValue = "agree" | "disagree" | "indifferent";

export type SubmissionStatus = "pending" | "accepted" | "rejected";

export interface DetectedTrope {
  id: string;
  name: string;
  severity: TropeSeverity;
  penalty: number;
  register: string;
  evidence: string;
  subverted: boolean;
  subversion_description: string | null;
}

export interface Subversion {
  trope_id: string;
  description: string;
}

// --- Table row types ---

export interface MediaProperty {
  id: string;
  title: string;
  media_type: MediaType | null;
  release_year: number | null;
  decade: string | null;
  genre: string | null;
  country_of_origin: string | null;
  created_at: string;
}

export interface Character {
  id: string;
  character_key: string;
  name: string;
  media_property_id: string | null;
  character_image_url: string | null;
  gender_flag: string | null;
  first_analyzed_at: string | null;
  latest_analysis_id: string | null;
  latest_final_score: number | null;
  latest_grade: Grade | null;
  q5_flag: Q5Flag | null;
  wall_of_shame: boolean;
  hall_of_fame: boolean;
  lookup_count: number;
  view_count: number;
  share_count: number;
  created_at: string;
}

export interface Analysis {
  id: string;
  character_id: string;
  q1_score: number | null;
  q1_rationale: string | null;
  q2_score: number | null;
  q2_rationale: string | null;
  q3_score: number | null;
  q3_rationale: string | null;
  q4_score: number | null;
  q4_rationale: string | null;
  q5_flag: Q5Flag | null;
  q5_notes: string | null;
  base_score: number | null;
  trope_penalty: number | null;
  trope_bonus: number | null;
  final_score: number | null;
  grade: Grade | null;
  tropes: DetectedTrope[] | null;
  subversions: Subversion[] | null;
  suggestions: string | null;
  summary: string | null;
  rubric_version: string | null;
  model_version: string | null;
  prompt_template_version: string | null;
  processing_duration_ms: number | null;
  created_at: string;
}

export interface User {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  role: UserRole;
  is_critic: boolean;
  is_admin: boolean;
  critic_granted_at: string | null;
  accepted_trope_submissions: number;
  disputes_resolved_in_favor: number;
  analyses_run: number;
  created_at: string;
  updated_at: string;
}

export interface Trope {
  id: string;
  name: string;
  category: string;
  severity: TropeSeverity;
  penalty: number;
  register: string;
  tvtropes_slug: string | null;
  japanifornia_note: string | null;
  source_ref: string | null;
  created_at: string;
}

export interface GlossaryTerm {
  id: string;
  term: string;
  definition: string;
  examples: string | null;
  register: string | null;
  related_tropes: string[] | null;
  source_links: string[] | null;
  status: SubmissionStatus;
  submitted_by: string | null;
  created_at: string;
}

export interface Vote {
  id: string;
  analysis_id: string;
  user_id: string;
  rule: "q1" | "q2" | "q3" | "q4";
  vote: VoteValue;
  is_critic: boolean;
  created_at: string;
}

export interface PromptTemplate {
  id: string;
  rubric_version: string;
  model_target: string;
  system_prompt: string;
  user_message_template: string;
  is_active: boolean;
  notes: string | null;
  created_at: string;
  deprecated_at: string | null;
}

// Minimal Database type for createClient generics
export interface Database {
  public: {
    Tables: {
      characters: { Row: Character; Insert: Partial<Character>; Update: Partial<Character> };
      analyses: { Row: Analysis; Insert: Partial<Analysis>; Update: Partial<Analysis> };
      media_properties: { Row: MediaProperty; Insert: Partial<MediaProperty>; Update: Partial<MediaProperty> };
      users: { Row: User; Insert: Partial<User>; Update: Partial<User> };
      tropes: { Row: Trope; Insert: Partial<Trope>; Update: Partial<Trope> };
      glossary_terms: { Row: GlossaryTerm; Insert: Partial<GlossaryTerm>; Update: Partial<GlossaryTerm> };
      votes: { Row: Vote; Insert: Partial<Vote>; Update: Partial<Vote> };
      prompt_templates: { Row: PromptTemplate; Insert: Partial<PromptTemplate>; Update: Partial<PromptTemplate> };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}
