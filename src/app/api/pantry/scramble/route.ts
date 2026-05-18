import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { pantryHasIngredient, getSubScore } from "@/lib/ingredient-substitutes";
import { ai, getModel } from "@/lib/ai";

export const runtime = "nodejs";

export interface MissingIngredient {
  name: string;
  criticality: number; // 0 (easy to skip) – 1 (critical)
  subScore: number;
}

export interface ScrambleResult {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  focal_x: number | null;
  focal_y: number | null;
  cuisine_type: string | null;
  dish_types: string[];
  dietary_tags: string[];
  prep_time_minutes: number | null;
  cook_time_minutes: number | null;
  calories: number | null;
  servings: number | null;
  totalIngredients: number;
  haveCount: number;
  missingIngredients: MissingIngredient[];
  /** Weighted missing score — lower is better (0 = can make right now) */
  missScore: number;
  canMakeNow: boolean;
}

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Fetch pantry items
  const { data: pantryItems } = await supabase
    .from("pantry_items")
    .select("name")
    .eq("user_id", user.id);

  const pantryNames = (pantryItems ?? []).map((p) => p.name as string);

  if (pantryNames.length === 0) {
    return NextResponse.json({ results: [], pantryEmpty: true });
  }

  // Fetch all non-social recipes with ingredients
  const { data: recipes } = await supabase
    .from("recipes")
    .select("id, title, description, image_url, focal_x, focal_y, cuisine_type, dish_types, dietary_tags, prep_time_minutes, cook_time_minutes, calories, servings, ingredients")
    .neq("source", "social")
    .not("ingredients", "eq", "[]")
    .limit(200);

  if (!recipes?.length) {
    return NextResponse.json({ results: [], pantryEmpty: false });
  }

  const results: ScrambleResult[] = [];

  for (const recipe of recipes) {
    const ingredients: { name: string }[] = Array.isArray(recipe.ingredients)
      ? recipe.ingredients
      : [];

    if (ingredients.length === 0) continue;

    const missing: MissingIngredient[] = [];
    let haveCount = 0;

    for (const ing of ingredients) {
      const has = pantryHasIngredient(ing.name, pantryNames);
      if (has) {
        haveCount++;
      } else {
        const sub = getSubScore(ing.name);
        missing.push({
          name: ing.name,
          subScore: sub,
          criticality: 1 - sub,
        });
      }
    }

    // missScore: sum of (criticality) for each missing ingredient
    // A missing "tomato" (criticality 0.75) hurts more than missing "olive oil" (criticality 0.05)
    const missScore = missing.reduce((acc, m) => acc + m.criticality, 0);

    results.push({
      id: recipe.id,
      title: recipe.title,
      description: recipe.description,
      image_url: recipe.image_url,
      focal_x: recipe.focal_x,
      focal_y: recipe.focal_y,
      cuisine_type: recipe.cuisine_type,
      dish_types: recipe.dish_types ?? [],
      dietary_tags: recipe.dietary_tags ?? [],
      prep_time_minutes: recipe.prep_time_minutes,
      cook_time_minutes: recipe.cook_time_minutes,
      calories: recipe.calories,
      servings: recipe.servings,
      totalIngredients: ingredients.length,
      haveCount,
      missingIngredients: missing.sort((a, b) => b.criticality - a.criticality),
      missScore,
      canMakeNow: missing.length === 0,
    });
  }

  // Sort: fewest weighted-missing first, then by total coverage
  results.sort((a, b) => {
    if (a.missScore !== b.missScore) return a.missScore - b.missScore;
    return b.haveCount - a.haveCount;
  });

  return NextResponse.json({ results, pantryEmpty: false });
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json() as { ingredients?: string[] };
    const ingredients = body.ingredients ?? [];

    if (!Array.isArray(ingredients) || ingredients.length === 0) {
      return NextResponse.json({ recipes: [] });
    }

    const response = await ai.chat.completions.create({
      model: getModel(),
      max_tokens: 600,
      messages: [
        {
          role: "user",
          content: `You are a creative chef assistant. Suggest 4 recipes that prominently feature the following ingredient(s): ${ingredients.join(", ")}.

For each recipe, provide:
- title: the recipe name
- reason: one sentence explaining how this ingredient is used in the dish

Return a JSON object only, no markdown: { "recipes": [{ "title": "...", "reason": "..." }, ...] }`,
        },
      ],
    });

    const raw = response.choices[0]?.message?.content?.trim() ?? '{"recipes":[]}';
    const cleaned = raw.replace(/^```(?:json)?\n?/m, "").replace(/\n?```$/m, "").trim();
    const parsed = JSON.parse(cleaned);
    return NextResponse.json({ recipes: parsed.recipes ?? [] });
  } catch (err) {
    console.error("[scramble POST]", err);
    return NextResponse.json({ recipes: [] }, { status: 500 });
  }
}
