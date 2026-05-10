import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET /api/recipes/recommend?plan_id=<id>&day_number=<n>&meal_type=<mt>
// Returns up to 10 scored recipes: dietary fit + saved boost + deduplication.
export async function GET(req: NextRequest) {
  const planId = req.nextUrl.searchParams.get("plan_id");
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Fallback: return popular recipes when no plan context
  if (!planId) {
    const { data } = await supabase
      .from("recipes")
      .select("id, title, image_url, calories, protein_g, carbs_g, fat_g, prep_time_minutes, cook_time_minutes, dietary_tags")
      .limit(10);
    return NextResponse.json(data ?? []);
  }

  // Fetch plan context and existing entries in parallel
  // Note: entries table is "meal_entries" with FK column "meal_plan_id"
  const [{ data: plan }, { data: entries }] = await Promise.all([
    supabase.from("meal_plans").select("dietary_filters, nutritional_goals").eq("id", planId).single(),
    supabase.from("meal_entries").select("recipe_title").eq("meal_plan_id", planId),
  ]);

  const dietaryFilters: string[] = plan?.dietary_filters ?? [];
  const existingTitles = new Set((entries ?? []).map((e: { recipe_title: string }) => e.recipe_title));

  // Fetch user's saved recipe IDs
  // Note: user_saved_recipes table must exist in Supabase with columns (user_id, recipe_id)
  let savedIds = new Set<string>();
  if (user) {
    const { data: saved } = await supabase
      .from("user_saved_recipes")
      .select("recipe_id")
      .eq("user_id", user.id);
    savedIds = new Set((saved ?? []).map((r: { recipe_id: string }) => r.recipe_id));
  }

  // Fetch candidate recipes
  const { data: candidates } = await supabase
    .from("recipes")
    .select("id, title, image_url, calories, protein_g, carbs_g, fat_g, prep_time_minutes, cook_time_minutes, dietary_tags")
    .limit(60);

  if (!candidates) return NextResponse.json([]);

  // Score each recipe
  const scored = candidates.map((r) => {
    let score = 0;
    const tags: string[] = r.dietary_tags ?? [];
    if (dietaryFilters.length > 0 && dietaryFilters.every((f) => tags.includes(f))) score += 3;
    if (savedIds.has(r.id)) score += 2;
    if (!existingTitles.has(r.title)) score += 2;
    return { ...r, is_saved: savedIds.has(r.id), _score: score };
  });

  scored.sort((a, b) => b._score - a._score);
  const top10 = scored.slice(0, 10).map(({ _score, ...r }) => r);
  return NextResponse.json(top10);
}
