/**
 * CostEstimator — lightweight static-pricing ingredient cost estimates.
 * No external API calls; uses ingredient category/name heuristics to assign
 * a USD cost per ingredient, then sums per recipe or weekly plan.
 */

import type { RecipeIngredient } from "@/lib/types";

// USD cost per ingredient "portion" by aisle/category keyword
const CATEGORY_COST_MAP: [RegExp, number][] = [
  [/meat|poultry|chicken|beef|pork|lamb|turkey|veal|duck/i, 2.80],
  [/fish|salmon|tuna|cod|shrimp|prawn|seafood|crab|lobster/i, 3.20],
  [/dairy|milk|cream|butter|cheese|yogurt|egg/i, 0.85],
  [/produce|vegetable|fruit|lettuce|tomato|onion|garlic|pepper|spinach|mushroom/i, 0.55],
  [/grain|pasta|bread|rice|flour|oat|cereal|noodle/i, 0.40],
  [/legume|bean|lentil|chickpea|tofu|tempeh/i, 0.60],
  [/nut|seed|almond|cashew|walnut|peanut/i, 0.70],
  [/spice|herb|salt|pepper|cumin|paprika|cinnamon|oregano|basil/i, 0.15],
  [/oil|vinegar|sauce|soy|ketchup|mustard|mayo/i, 0.25],
  [/canned|tinned|stock|broth|tomato sauce/i, 0.90],
  [/sugar|honey|syrup|jam/i, 0.20],
  [/frozen/i, 1.10],
];

const DEFAULT_INGREDIENT_COST = 0.60;

// Module-level cache: recipe_id → estimated total cost in USD
const costCache = new Map<string, { total: number; perServing: number; ts: string }>();

function estimateIngredientCost(ingredient: RecipeIngredient): number {
  const text = [ingredient.name, ingredient.category ?? ""].join(" ");
  for (const [pattern, cost] of CATEGORY_COST_MAP) {
    if (pattern.test(text)) return cost;
  }
  return DEFAULT_INGREDIENT_COST;
}

export function estimateRecipeCost(
  recipeId: string,
  ingredients: RecipeIngredient[],
  servings: number | null | undefined
): { total_cost_usd: number; cost_per_serving_usd: number } {
  const cached = costCache.get(recipeId);
  if (cached) {
    return { total_cost_usd: cached.total, cost_per_serving_usd: cached.perServing };
  }

  const total = ingredients.reduce((sum, ing) => sum + estimateIngredientCost(ing), 0);
  // Adjust upward slightly for real-world waste, packaging, and unit minimums
  const adjusted = parseFloat((total * 1.15).toFixed(2));
  const effectiveServings = Math.max(1, servings ?? 2);
  const perServing = parseFloat((adjusted / effectiveServings).toFixed(2));

  costCache.set(recipeId, { total: adjusted, perServing, ts: new Date().toISOString() });
  return { total_cost_usd: adjusted, cost_per_serving_usd: perServing };
}

export function estimateWeeklyPlanCost(
  entries: Array<{
    recipe_id?: string | null;
    recipe?: {
      ingredients: RecipeIngredient[];
      servings?: number | null;
    } | null;
  }>
): number {
  let total = 0;
  for (const entry of entries) {
    if (!entry.recipe_id || !entry.recipe) continue;
    const { total_cost_usd } = estimateRecipeCost(
      entry.recipe_id,
      entry.recipe.ingredients ?? [],
      entry.recipe.servings
    );
    total += total_cost_usd;
  }
  return parseFloat(total.toFixed(2));
}
