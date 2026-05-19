// src/lib/recipe-match.ts
//
// Shared pantry + inspiration matching helpers used by both
// the /api/recipes/picker route and the /api/plans/[id]/weave route.

import type { SupabaseClient } from "@supabase/supabase-js";

export function normalize(s: string): string {
  return s.toLowerCase().trim();
}

export function ingredientName(i: unknown): string {
  if (typeof i === "string") return i;
  if (i && typeof i === "object" && "name" in (i as Record<string, unknown>)) {
    const n = (i as Record<string, unknown>).name;
    return typeof n === "string" ? n : "";
  }
  return "";
}

/**
 * Load the user's pantry into a normalized Set of ingredient names.
 * Uses `pantry_items.name` (not `ingredient_name`).
 */
export async function loadPantrySet(
  supabase: SupabaseClient,
  userId: string,
): Promise<Set<string>> {
  const { data } = await supabase
    .from("pantry_items")
    .select("name")
    .eq("user_id", userId);
  return new Set(
    (data ?? []).map((p: { name: string | null }) => normalize(p.name ?? "")),
  );
}

/** Fraction of recipe ingredients present in the pantry (0..1). */
export function pantryMatch(
  recipe: { ingredients?: unknown },
  pantrySet: Set<string>,
): number {
  const ings = Array.isArray(recipe.ingredients) ? recipe.ingredients : [];
  if (ings.length === 0) return 0;
  const matches = ings.filter((i: unknown) => {
    const n = normalize(ingredientName(i));
    return n.length > 0 && pantrySet.has(n);
  }).length;
  return matches / ings.length;
}

/** Count of recipe ingredients NOT in the pantry. */
export function pantryMissingCount(
  recipe: { ingredients?: unknown },
  pantrySet: Set<string>,
): number {
  const ings = Array.isArray(recipe.ingredients) ? recipe.ingredients : [];
  return ings.filter((i: unknown) => {
    const n = normalize(ingredientName(i));
    return n.length > 0 && !pantrySet.has(n);
  }).length;
}

/**
 * Inspiration overlap (0..1): how many active inspiration tags are present
 * among the recipe's cuisine_type / dish_types / dietary_tags.
 */
export function inspirationMatch(
  recipe: {
    dietary_tags?: string[] | null;
    dish_types?: string[] | null;
    cuisine_type?: string | null;
  },
  inspirationTags: string[],
): number {
  if (inspirationTags.length === 0) return 0;
  const tags = new Set<string>([
    ...(recipe.dietary_tags ?? []),
    ...(recipe.dish_types ?? []),
    ...(recipe.cuisine_type ? [recipe.cuisine_type] : []),
  ]);
  const hits = inspirationTags.filter((t) => tags.has(t)).length;
  return hits / inspirationTags.length;
}

// ---------------------------------------------------------------------------
// Squad-aware helpers (Plan 5)
// ---------------------------------------------------------------------------

/** Lowercased trimmed ingredient names from a recipe row. */
export function recipeIngredientNames(recipe: { ingredients?: unknown }): string[] {
  const arr = Array.isArray(recipe?.ingredients) ? recipe.ingredients : [];
  return arr
    .map((i: unknown) => normalize(ingredientName(i)))
    .filter((s): s is string => s.length > 0);
}

/**
 * Hard squad filter — returns false if any avoid term appears as a substring
 * of any ingredient name. Substring match is intentional (so "egg" catches
 * "egg yolk" and "shelled egg") — documented v1 trade-off.
 */
export function squadHardFilter(
  recipe: { ingredients?: unknown },
  avoid: string[],
): boolean {
  if (avoid.length === 0) return true;
  const ings = recipeIngredientNames(recipe);
  for (const a of avoid) {
    const needle = normalize(a);
    if (!needle) continue;
    for (const ing of ings) {
      if (ing.includes(needle)) return false;
    }
  }
  return true;
}

/**
 * Soft squad score in [-1, +1]: -0.5 per dislike hit, +0.3 per love hit.
 */
export function squadScore(
  recipe: { ingredients?: unknown },
  squad: { dislike: string[]; love: string[] },
): number {
  const ings = recipeIngredientNames(recipe);
  let score = 0;
  for (const d of squad.dislike) {
    const needle = normalize(d);
    if (!needle) continue;
    if (ings.some((i) => i.includes(needle))) score -= 0.5;
  }
  for (const l of squad.love) {
    const needle = normalize(l);
    if (!needle) continue;
    if (ings.some((i) => i.includes(needle))) score += 0.3;
  }
  return Math.max(-1, Math.min(1, score));
}

/** Which dislike terms hit this recipe — used for UI warning badges. */
export function squadDislikeHits(
  recipe: { ingredients?: unknown },
  dislike: string[],
): string[] {
  const ings = recipeIngredientNames(recipe);
  return dislike.filter((d) => {
    const needle = normalize(d);
    return needle.length > 0 && ings.some((i) => i.includes(needle));
  });
}
