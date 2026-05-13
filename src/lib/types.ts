// ============================================================
// Enums & Union Types
// ============================================================

import type { MilestoneKey, AllergenKey } from "./family-types";

export type MealStatus = "planning" | "active" | "completed";
export type MealType = "breakfast" | "lunch" | "dinner" | "snack";
export type RecipeSource = "spoonacular" | "ai" | "curated" | "social" | "user";

export type DietaryFilter =
  | "vegetarian"
  | "vegan"
  | "gluten-free"
  | "dairy-free"
  | "keto"
  | "paleo"
  | "low-carb"
  | "high-protein"
  | "halal"
  | "kosher";

// ============================================================
// Nutritional Data
// ============================================================

export interface NutritionalGoals {
  calories?: number;
  protein_g?: number;
  carbs_g?: number;
  fat_g?: number;
  fiber_g?: number;
}

export interface NutritionInfo {
  calories?: number;
  protein_g?: number;
  carbs_g?: number;
  fat_g?: number;
  fiber_g?: number;
  sugar_g?: number;
  sodium_mg?: number;
}

// ============================================================
// Ingredient Categories & Pantry
// ============================================================

export interface IngredientCategory {
  id: string;
  name: string;
  emoji?: string;
  color?: string;
}

export interface RecipeIngredient {
  name: string;
  amount?: number;
  unit?: string;
  category?: string;
}

// ============================================================
// Enhanced Recipe Instructions (5-field per-step structure)
// See CLAUDE.md "Recipe Instruction Format" for the editorial spec.
// ============================================================

export interface JargonTerm {
  term: string;
  definition: string;
}

export interface EnhancedStep {
  header: string;                                  // 3-5 word action title
  body_text: string;                               // what + why + pitfall, humanized
  skill: { beginner: string; pro: string };        // sensory cue / chef secret
  jargon: JargonTerm[];                            // 0-2 entries
  visual_strategy: string;                         // 1-sentence visual aid description
}

// ============================================================
// Enhanced Recipe Description (structured editorial card)
// See CLAUDE.md "Recipe Description Format" for the editorial spec.
// ============================================================

export type RecipeSkillLevel = "beginner" | "intermediate" | "advanced";

export interface EnhancedDescription {
  headnote_narrative: string;                      // 3-10 sentences of editorial prose (the hero)
  tagline: string;                                 // 1 sentence punchy hook (<=25 words)
  origin: {
    cuisine: string;                               // specific label (e.g. "Northern Mexican")
    tradition: string;                             // 1 sentence on cultural role
  };
  technique_signature: string;                     // 1 sentence: defining method
  ingredient_signature: string;                    // 1 sentence: 2-3 key ingredients + flavor logic
  audience: string;                                // 1 sentence: who / when
  effort: {
    time_feel: string;                             // e.g. "60 minutes, mostly hands-off"
    skill_level: RecipeSkillLevel;
    forgiving: boolean;                            // mistakes recoverable mid-cook?
  };
}

export interface PantryItem {
  id: string;
  user_id: string;
  name: string;
  category_id?: string;
  category?: IngredientCategory;
  quantity?: string;
  added_at: string;
  expires_at?: string | null;  // ISO date string "YYYY-MM-DD"
}

// ============================================================
// Recipes (public cache - Spoonacular + AI)
// ============================================================

export interface Recipe {
  id: string;
  external_id?: string;
  source: RecipeSource;
  title: string;
  description?: string;
  image_url?: string;
  image_urls?: string[];
  cuisine_type?: string;
  dish_types?: string[];
  dietary_tags?: string[];
  ingredients: RecipeIngredient[];
  instructions?: string[];
  instructions_enhanced?: EnhancedStep[] | null;
  description_enhanced?: EnhancedDescription | null;
  prep_time_minutes?: number;
  cook_time_minutes?: number;
  servings?: number;
  calories?: number;
  protein_g?: number;
  carbs_g?: number;
  fat_g?: number;
  fiber_g?: number;
  sugar_g?: number;
  sodium_mg?: number;
  is_premium?: boolean;
  is_hack?: boolean;
  source_url?: string;
  source_name?: string;
  difficulty_level?: "easy" | "medium" | "hard" | null;
  created_at: string;
  created_by?: string | null;
  is_published?: boolean;
  // Baby & family fields
  baby_stages?: MilestoneKey[];
  allergen_flags?: AllergenKey[];
  has_baby_variant?: boolean;
  baby_variant_recipe_id?: string | null;
}

// ============================================================
// Meal Plans & Entries
// ============================================================

export interface MealPlan {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  week_start?: string;
  meals_per_day: number;
  duration_days: number;
  status: MealStatus;
  is_public: boolean;
  nutritional_goals?: NutritionalGoals;
  dietary_filters?: DietaryFilter[];
  tags?: string[];
  created_at: string;
  updated_at: string;
  meal_entries?: MealEntry[];
}

export interface MealEntry {
  id?: string;
  meal_plan_id?: string;
  recipe_id?: string;
  day_number: number;
  meal_type: MealType;
  recipe_title: string;
  description?: string;
  calories?: number;
  protein_g?: number;
  carbs_g?: number;
  fat_g?: number;
  fiber_g?: number;
  position?: number;
  created_at?: string;
}

// ============================================================
// User & Profile
// ============================================================

export interface Profile {
  id: string;
  username?: string;
  full_name?: string;
  avatar_url?: string;
  bio?: string;
  dietary_preferences?: string[];
  favorite_cuisines?: string[];
  created_at: string;
}

export interface UserPreferences {
  user_id: string;
  dietary_preferences?: string[];
  favorite_cuisines?: string[];
  difficulty_level?: "beginner" | "intermediate" | "advanced";
  preferred_meal_types?: MealType[];
  nutritional_goals?: NutritionalGoals;
  updated_at: string;
}

// ============================================================
// API Response Types
// ============================================================

export interface RecipeSearchResult {
  recipes: Recipe[];
  total: number;
  hasMore: boolean;
}

export interface IngredientSearchResult {
  recipes: Recipe[];
  usedIngredients: string[];
  missingIngredients: string[];
}

export interface CategorizeResult {
  items: { name: string; category: string; category_id?: string }[];
}

// ============================================================
// Budget & Cost Estimation
// ============================================================

export interface BudgetState {
  weekly_budget: number | null;
  estimated_spent: number;
  currency: string;
}

export interface RecipeCostEstimate {
  recipe_id: string;
  total_cost_usd: number;
  cost_per_serving_usd: number;
  estimated_at: string;
}

// ============================================================
// Household
// ============================================================

export type MemberAgeGroup = 'baby' | 'child' | 'teen' | 'adult';
export type MemberFilterStrictness = 'allergy' | 'dislike' | 'soft';
export type IngredientSentiment = 'dislike' | 'avoid' | 'love';
export type PreferenceSource = 'reported' | 'inferred';

export interface HouseholdMember {
  id: string;
  owner_user_id: string;
  linked_user_id: string | null;
  display_name: string;
  avatar_emoji: string;
  age_group: MemberAgeGroup;
  filter_strictness: MemberFilterStrictness;
  created_at: string;
}

export interface MemberIngredientPreference {
  id: string;
  member_id: string;
  ingredient_id: string | null;
  ingredient_text: string;
  sentiment: IngredientSentiment;
  source: PreferenceSource;
  created_at: string;
}

export interface MemberReaction {
  id: string;
  member_id: string;
  recipe_id: string;
  rating: 1 | 2 | 3;
  notes: string | null;
  reported_by: string;
  cooked_at: string;
}

export interface HouseholdMemberWithPreferences extends HouseholdMember {
  preferences: MemberIngredientPreference[];
  reactions: MemberReaction[];
}