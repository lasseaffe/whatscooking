import { createClient } from "@/lib/supabase/server";
import { CUISINES } from "@/lib/cuisines";
import { DiscoverFeedClient } from "./discover-feed-client";

export const dynamic = "force-dynamic";

function computePantryMatches(
  recipes: Array<{
    id: string;
    title: string;
    image_url?: string | null;
    ingredients?: Array<{ name: string }> | null;
  }>,
  pantryNames: string[]
): Array<{ id: string; title: string; image_url?: string | null; matchedCount: number; totalIngredients: number }> {
  if (pantryNames.length === 0) return [];

  return recipes
    .filter((r) => (r.ingredients ?? []).length > 0)
    .map((r) => {
      const ings = r.ingredients ?? [];
      const matched = ings.filter((ing) =>
        pantryNames.some(
          (p) => ing.name.toLowerCase().includes(p) || p.includes(ing.name.toLowerCase())
        )
      ).length;
      return {
        id: r.id,
        title: r.title,
        image_url: r.image_url,
        matchedCount: matched,
        totalIngredients: ings.length,
        matchPct: Math.round((matched / ings.length) * 100),
      };
    })
    .filter((r) => r.matchPct >= 40)
    .sort((a, b) => b.matchPct - a.matchPct);
}

export default async function DiscoverPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [
    { data: swipeRecipes },
    { data: trendingRaw, count: trendingTotal },
    { data: quickRecipesRaw },
    { data: gridRecipes },
    { data: pantryItems },
    { data: matchCandidates },
  ] = await Promise.all([
    // 1. Swipe deck
    supabase
      .from("recipes")
      .select("id, title, description, image_url, cuisine_type, dietary_tags, prep_time_minutes, cook_time_minutes, calories, difficulty_level, ingredients, instructions, servings, protein_g, carbs_g, fat_g, dish_types")
      .not("image_url", "is", null)
      .or('dish_types.is.null,dish_types.not.cs.{"hack"}')
      .or('dish_types.is.null,dish_types.not.cs.{"premium"}')
      .limit(30),

    // 2. Trending — order by created_at as safe fallback
    supabase
      .from("recipes")
      .select("id, title, image_url, cuisine_type, prep_time_minutes, cook_time_minutes, saved_count", { count: "exact" })
      .not("image_url", "is", null)
      .order("created_at", { ascending: false })
      .limit(10),

    // 3. Quick & Easy — filter on prep_time, also apply total time filter below
    supabase
      .from("recipes")
      .select("id, title, image_url, prep_time_minutes, cook_time_minutes")
      .not("image_url", "is", null)
      .lte("prep_time_minutes", 20)
      .limit(10),

    // 4. All recipes grid
    supabase
      .from("recipes")
      .select("id, title, description, image_url, cuisine_type, dish_types, dietary_tags, prep_time_minutes, cook_time_minutes, difficulty_level")
      .or('dish_types.is.null,dish_types.not.cs.{"hack"}')
      .or('dish_types.is.null,dish_types.not.cs.{"premium"}')
      .order("created_at", { ascending: false })
      .limit(300),

    // 5. Pantry items (for swipe filter + pantry matching)
    user
      ? supabase.from("pantry_items").select("name").eq("user_id", user.id)
      : (Promise.resolve({ data: [] as { name: string }[], error: null }) as any),

    // 6. Recipes with ingredients for pantry matching (only when logged in)
    user
      ? supabase
          .from("recipes")
          .select("id, title, image_url, ingredients")
          .not("ingredients", "is", null)
          .limit(200)
      : (Promise.resolve({ data: [] as Array<{ id: string; title: string; image_url: string | null; ingredients: Array<{ name: string }> | null }>, error: null }) as any),
  ]);

  const pantryNames = (pantryItems ?? []).map((p: { name: string }) => p.name.toLowerCase());
  const cuisines = CUISINES.slice(0, 20);

  // Pantry matches
  const allPantryMatches = computePantryMatches(
    (matchCandidates ?? []) as Array<{ id: string; title: string; image_url?: string | null; ingredients?: Array<{ name: string }> | null }>,
    pantryNames
  );
  const topPantryMatches = allPantryMatches.slice(0, 2);

  // Quick recipes: refilter to ensure total time (prep + cook) ≤ 20
  const quickRecipes = (quickRecipesRaw ?? []).filter(
    (r) => (r.prep_time_minutes ?? 0) + (r.cook_time_minutes ?? 0) <= 20
  );

  return (
    <DiscoverFeedClient
      swipeRecipes={swipeRecipes ?? []}
      trendingRecipes={trendingRaw ?? []}
      trendingTotal={trendingTotal ?? 0}
      pantryMatches={topPantryMatches}
      pantryMatchTotal={allPantryMatches.length}
      pantryItemCount={pantryNames.length}
      quickRecipes={quickRecipes}
      cuisines={cuisines}
      gridRecipes={gridRecipes ?? []}
      pantryNames={pantryNames}
      isLoggedIn={!!user}
    />
  );
}
