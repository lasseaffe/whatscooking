// src/lib/weave-solver/types.ts

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';
export type EntrySource = 'pinned' | 'suggestion' | 'manual';
export type AntiRepeatStrength = 'strict' | 'moderate' | 'off';

export interface SolverRecipe {
  id: string;
  title: string;
  image_url: string | null;
  cuisine_type: string | null;
  dietary_tags: string[];
  dish_types: string[];
  prep_time_minutes: number | null;
  cook_time_minutes: number | null;
  calories: number | null;
  protein_g: number | null;
  carbs_g: number | null;
  fat_g: number | null;
  batch_friendly: boolean;
  // Pre-computed pantry coverage 0..1, supplied by caller
  pantry_match: number;
  // Inspiration chip overlap 0..1, supplied by caller
  inspiration_match: number;
}

export interface SolverConstraints {
  diet: string[];                  // required dietary tags
  time_weeknight_max: number;      // minutes
  time_weekend_max: number;        // minutes
  squad_size: number;
  pantry_aware: boolean;
  pantry_missing_max: number;      // when pantry_aware, drop recipes missing > this many ingredients
  anti_repeat: AntiRepeatStrength;
  batch_enabled: boolean;
  meal_types: MealType[];
}

export interface SolverInput {
  duration_days: number;
  week_start: string | null;       // ISO date or null (used to determine which days are weekend)
  pins: SolverRecipe[];            // ordered by priority desc
  pool: SolverRecipe[];            // candidate suggestions (pre-filtered by diet + pantry aggressive)
  constraints: SolverConstraints;
  seed: number;                    // 0 = deterministic; nonzero = randomized variant
}

export interface ProposedEntry {
  clientid: string;
  day_number: number;
  meal_type: MealType;
  recipe_id: string;
  recipe_title: string;
  source: EntrySource;
  is_leftover: boolean;
  parent_clientid: string | null;
  locked: boolean;
  position: number;
}

export interface WeaveSummary {
  pantry_pct: number;              // 0..1
  active_minutes: number;
  variety_score: number;           // 0..1 (higher = more variety)
  leftover_count: number;
  slots_total: number;
  slots_filled: number;
}

export interface SolverOutput {
  entries: ProposedEntry[];
  summary: WeaveSummary;
}
