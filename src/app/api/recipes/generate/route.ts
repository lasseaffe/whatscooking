import { generateRecipe } from "@/lib/openai-helper";
import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * POST /api/recipes/generate
 * Generate a custom recipe using AI
 *
 * Body:
 * {
 *   "description": "A quick stir-fry with tofu",
 *   "dietaryTags": ["vegetarian", "low-carb"],
 *   "ingredients": ["tofu", "broccoli"],
 *   "servings": 4
 * }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { description, dietaryTags, ingredients, servings } = body;

    if (!description) {
      return NextResponse.json(
        { error: "description is required" },
        { status: 400 }
      );
    }

    // Generate recipe with AI
    const recipe = await generateRecipe({
      description,
      dietaryTags,
      ingredients,
      servings,
    });

    // Cache in Supabase
    const supabase = await createClient();
    const { data: cached } = await supabase
      .from("recipes")
      .insert({
        source: "ai",
        title: recipe.title,
        description: recipe.description,
        image_url: null,
        cuisine_type: recipe.cuisine_type,
        dish_types: recipe.dish_types,
        dietary_tags: recipe.dietary_tags,
        ingredients: recipe.ingredients,
        instructions: recipe.instructions,
        prep_time_minutes: recipe.prep_time_minutes,
        cook_time_minutes: recipe.cook_time_minutes,
        servings: recipe.servings,
        calories: recipe.calories,
        protein_g: recipe.protein_g,
        carbs_g: recipe.carbs_g,
        fat_g: recipe.fat_g,
        fiber_g: recipe.fiber_g,
        sugar_g: recipe.sugar_g,
        sodium_mg: recipe.sodium_mg,
      })
      .select()
      .single();

    return NextResponse.json(cached || recipe);
  } catch (error) {
    console.error("[recipes/generate]", error);
    return NextResponse.json(
      { error: "Failed to generate recipe" },
      { status: 500 }
    );
  }
}
