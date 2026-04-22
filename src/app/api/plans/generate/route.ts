import { generateMealPlan } from "@/lib/openai-helper";
import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * POST /api/plans/generate
 * Generate a meal plan from available recipes
 *
 * Body:
 * {
 *   "title": "High Protein Week",
 *   "duration_days": 7,
 *   "meals_per_day": 3,
 *   "nutritional_goals": { "calories": 2000, "protein_g": 150 },
 *   "dietary_filters": ["vegetarian"],
 *   "recipe_ids": ["recipe-id-1", "recipe-id-2", ...]
 * }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      title,
      duration_days = 7,
      meals_per_day = 3,
      nutritional_goals,
      dietary_filters,
      recipe_ids,
    } = body;

    if (!recipe_ids || !Array.isArray(recipe_ids) || recipe_ids.length === 0) {
      return NextResponse.json(
        { error: "recipe_ids array is required and must not be empty" },
        { status: 400 }
      );
    }

    // Get recipes from Supabase
    const supabase = await createClient();
    const { data: recipes } = await supabase
      .from("recipes")
      .select("*")
      .in("id", recipe_ids);

    if (!recipes || recipes.length === 0) {
      return NextResponse.json(
        { error: "No recipes found with provided IDs" },
        { status: 404 }
      );
    }

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Generate meal plan with AI
    const mealPlan = await generateMealPlan({
      recipes,
      duration_days,
      meals_per_day,
      nutritional_goals,
      dietary_filters,
    });

    // Save meal plan to Supabase
    const { data: plan } = await supabase
      .from("meal_plans")
      .insert({
        user_id: user.id,
        title: title || "AI Generated Meal Plan",
        description: `${duration_days}-day meal plan with ${meals_per_day} meals per day`,
        meals_per_day,
        duration_days,
        status: "planning",
        is_public: false,
        nutritional_goals: nutritional_goals || {},
        dietary_filters: dietary_filters || [],
      })
      .select()
      .single();

    if (!plan) {
      return NextResponse.json(
        { error: "Failed to create meal plan" },
        { status: 500 }
      );
    }

    // Save meal entries
    const mealEntries = mealPlan.meals.map((meal, idx) => ({
      meal_plan_id: plan.id,
      day_number: meal.day,
      meal_type: meal.meal_type,
      recipe_title: meal.recipe_title,
      position: idx,
    }));

    await supabase.from("meal_entries").insert(mealEntries);

    // Return plan with meals and nutrition summary
    return NextResponse.json({
      plan: {
        ...plan,
        meals: mealPlan.meals,
        daily_nutrition: mealPlan.daily_nutrition,
      },
    });
  } catch (error) {
    console.error("[plans/generate]", error);
    return NextResponse.json(
      { error: "Failed to generate meal plan" },
      { status: 500 }
    );
  }
}
