import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

// GET /api/calorie-entries/suggestions
// Returns the user's saved + rated + own recipes with nutrition data for smart autofill
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ suggestions: [] });

  // Pull from four sources in priority order: saves, ratings ≥4, meal plan items, own recipes
  const [saves, rated, mealPlanEntries, own, recent] = await Promise.all([
    supabase
      .from("recipe_saves")
      .select("recipe_id")
      .eq("user_id", user.id)
      .limit(30),
    supabase
      .from("recipe_ratings")
      .select("recipe_id")
      .eq("user_id", user.id)
      .gte("taste", 4)
      .limit(30),
    // Meal plan items — recipes the user has actively planned to eat
    supabase
      .from("meal_entries")
      .select("recipe_id, meal_plans!inner(user_id)")
      .eq("meal_plans.user_id", user.id)
      .not("recipe_id", "is", null)
      .limit(40),
    supabase
      .from("recipes")
      .select("id")
      .eq("created_by", user.id)
      .limit(20),
    // Also include recently logged entries so often-typed foods surface fast
    supabase
      .from("calorie_entries")
      .select("description, calories, protein_g, carbs_g, fat_g")
      .eq("user_id", user.id)
      .order("logged_at", { ascending: false })
      .limit(30),
  ]);

  const savedIds     = saves.data?.map((s) => s.recipe_id) ?? [];
  const ratedIds     = rated.data?.map((r) => r.recipe_id) ?? [];
  const plannedIds   = mealPlanEntries.data?.map((e) => e.recipe_id).filter(Boolean) ?? [];
  const ownIds       = own.data?.map((r) => r.id) ?? [];
  // Priority: saved → rated → meal-planned → own
  const allIds = [...new Set([...savedIds, ...ratedIds, ...plannedIds, ...ownIds])] as string[];

  const recipeSuggestions: { title: string; calories: number | null; protein_g: number | null; carbs_g: number | null; fat_g: number | null }[] = [];

  if (allIds.length > 0) {
    const { data: recipes } = await supabase
      .from("recipes")
      .select("title, calories, protein_g, carbs_g, fat_g")
      .in("id", allIds)
      .not("title", "is", null)
      .limit(60);

    for (const r of recipes ?? []) {
      if (r.title) recipeSuggestions.push({ title: r.title, calories: r.calories, protein_g: r.protein_g, carbs_g: r.carbs_g, fat_g: r.fat_g });
    }
  }

  // Merge recently logged food descriptions (without duplicating recipe titles)
  const existingTitles = new Set(recipeSuggestions.map((r) => r.title.toLowerCase()));
  for (const e of recent.data ?? []) {
    if (e.description && !existingTitles.has(e.description.toLowerCase())) {
      recipeSuggestions.push({ title: e.description, calories: e.calories, protein_g: e.protein_g ?? null, carbs_g: e.carbs_g ?? null, fat_g: e.fat_g ?? null });
      existingTitles.add(e.description.toLowerCase());
    }
  }

  return NextResponse.json({ suggestions: recipeSuggestions });
}
