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
