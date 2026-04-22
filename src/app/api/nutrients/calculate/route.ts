import { NextRequest, NextResponse } from "next/server";

// Open Food Facts — free, no API key required
const OFF_BASE = "https://world.openfoodfacts.org/cgi/search.pl";

interface Ingredient {
  name: string;
  amount?: number;
  unit?: string;
}

interface NutrientPer100g {
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  fiber_g: number;
  sugar_g: number;
  sodium_mg: number;
}

// Convert common units to grams
function toGrams(amount: number, unit: string): number {
  const u = unit.toLowerCase().trim();
  if (u === "g" || u === "gram" || u === "grams") return amount;
  if (u === "kg" || u === "kilogram") return amount * 1000;
  if (u === "ml" || u === "milliliter" || u === "millilitre") return amount; // approx 1g/ml for most liquids
  if (u === "l" || u === "liter" || u === "litre") return amount * 1000;
  if (u === "oz" || u === "ounce") return amount * 28.35;
  if (u === "lb" || u === "pound") return amount * 453.6;
  if (u === "cup" || u === "cups") return amount * 240;
  if (u === "tbsp" || u === "tablespoon" || u === "tablespoons") return amount * 15;
  if (u === "tsp" || u === "teaspoon" || u === "teaspoons") return amount * 5;
  if (u === "slice" || u === "slices" || u === "piece" || u === "pieces") return amount * 30;
  if (u === "clove" || u === "cloves") return amount * 5;
  // unknown unit — assume 100g as fallback
  return amount > 0 ? amount * 100 : 100;
}

async function lookupIngredient(name: string): Promise<NutrientPer100g | null> {
  try {
    const params = new URLSearchParams({
      search_terms: name,
      json: "1",
      page_size: "1",
      fields: "product_name,nutriments",
      sort_by: "popularity",
    });
    const res = await fetch(`${OFF_BASE}?${params}`, {
      headers: { "User-Agent": "WhatsCoooking/1.0" },
      next: { revalidate: 86400 }, // cache 24h
    });
    if (!res.ok) return null;
    const data = await res.json();
    const product = data?.products?.[0];
    if (!product?.nutriments) return null;

    const n = product.nutriments;
    return {
      calories:   n["energy-kcal_100g"] ?? n["energy_100g"] ?? 0,
      protein_g:  n["proteins_100g"] ?? 0,
      carbs_g:    n["carbohydrates_100g"] ?? 0,
      fat_g:      n["fat_100g"] ?? 0,
      fiber_g:    n["fiber_100g"] ?? 0,
      sugar_g:    n["sugars_100g"] ?? 0,
      sodium_mg:  (n["sodium_100g"] ?? 0) * 1000,
    };
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  const { ingredients, servings = 1 } = await req.json().catch(() => ({ ingredients: [], servings: 1 }));
  if (!Array.isArray(ingredients) || ingredients.length === 0) {
    return NextResponse.json({ error: "ingredients required" }, { status: 400 });
  }

  const totals = { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0, fiber_g: 0, sugar_g: 0, sodium_mg: 0 };
  const results: { name: string; found: boolean; grams: number }[] = [];

  await Promise.all(
    (ingredients as Ingredient[]).map(async (ing) => {
      if (!ing.name?.trim()) return;
      const nutriPer100 = await lookupIngredient(ing.name.trim());
      const grams = ing.amount && ing.unit
        ? toGrams(ing.amount, ing.unit)
        : ing.amount
          ? ing.amount  // no unit → assume grams
          : 100;        // no amount → 100g default

      results.push({ name: ing.name, found: !!nutriPer100, grams });

      if (nutriPer100) {
        const ratio = grams / 100;
        totals.calories   += nutriPer100.calories   * ratio;
        totals.protein_g  += nutriPer100.protein_g  * ratio;
        totals.carbs_g    += nutriPer100.carbs_g    * ratio;
        totals.fat_g      += nutriPer100.fat_g      * ratio;
        totals.fiber_g    += nutriPer100.fiber_g    * ratio;
        totals.sugar_g    += nutriPer100.sugar_g    * ratio;
        totals.sodium_mg  += nutriPer100.sodium_mg  * ratio;
      }
    })
  );

  // Per serving
  const perServing = {
    calories:  Math.round(totals.calories   / servings),
    protein_g: Math.round(totals.protein_g  / servings * 10) / 10,
    carbs_g:   Math.round(totals.carbs_g    / servings * 10) / 10,
    fat_g:     Math.round(totals.fat_g      / servings * 10) / 10,
    fiber_g:   Math.round(totals.fiber_g    / servings * 10) / 10,
    sugar_g:   Math.round(totals.sugar_g    / servings * 10) / 10,
    sodium_mg: Math.round(totals.sodium_mg  / servings),
  };

  const foundCount = results.filter((r) => r.found).length;

  return NextResponse.json({
    perServing,
    total: {
      calories:  Math.round(totals.calories),
      protein_g: Math.round(totals.protein_g * 10) / 10,
      carbs_g:   Math.round(totals.carbs_g   * 10) / 10,
      fat_g:     Math.round(totals.fat_g     * 10) / 10,
      fiber_g:   Math.round(totals.fiber_g   * 10) / 10,
    },
    ingredients: results,
    confidence: foundCount === 0 ? "none" : foundCount < ingredients.length / 2 ? "low" : "medium",
    note: `Found data for ${foundCount}/${results.length} ingredients via Open Food Facts`,
  });
}
