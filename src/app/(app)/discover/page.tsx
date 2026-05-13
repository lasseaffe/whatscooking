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

// Build a score map from household reactions: avg rating per recipe_id.
// rating=3 (loved) → +2, rating=2 (ok) → 0, rating=1 (disliked) → -3
function reactionScore(rating: number): number {
  if (rating >= 3) return 2;
  if (rating === 1) return -3;
  return 0;
}

function rankByReactions<T extends { id: string }>(
  recipes: T[],
  scoreMap: Map<string, number>
): T[] {
  if (scoreMap.size === 0) return recipes;
  return [...recipes].sort((a, b) => {
    const sa = scoreMap.get(a.id) ?? 0;
    const sb = scoreMap.get(b.id) ?? 0;
    return sb - sa; // higher score first
  });
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
    { data: gridRecipes, count: gridTotal },
    { data: pantryItems },
    { data: matchCandidates },
    { data: householdMembers },
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

    // 4. All recipes grid — no image_url filter so dataset recipes (10K) appear
    supabase
      .from("recipes")
      .select("id, title, description, image_url, cuisine_type, dish_types, dietary_tags, prep_time_minutes, cook_time_minutes, difficulty_level", { count: "exact" })
      .or('dish_types.is.null,dish_types.not.cs.{"hack"}')
      .or('dish_types.is.null,dish_types.not.cs.{"premium"}')
      .order("created_at", { ascending: false })
      .limit(50),

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

    // 7. WC-5: Household member IDs for reaction ranking (fetched separately, joined below)
    user
      ? supabase
          .from("household_members")
          .select("id")
          .eq("owner_user_id", user.id)
      : (Promise.resolve({ data: [] as Array<{ id: string }>, error: null }) as any),
  ]);

  const pantryNames = (pantryItems ?? []).map((p: { name: string }) => p.name.toLowerCase());
  const cuisines = CUISINES.slice(0, 20);

  // WC-5: Fetch reactions for this user's household members, then build score map
  const memberIds = (householdMembers ?? []).map((m: { id: string }) => m.id);
  let reactions: Array<{ recipe_id: string; rating: number }> = [];
  if (memberIds.length > 0) {
    const { data } = await supabase
      .from("member_meal_reactions")
      .select("recipe_id, rating")
      .in("member_id", memberIds);
    reactions = data ?? [];
  }

  const scoreMap = new Map<string, number>();
  for (const r of reactions) {
    const prev = scoreMap.get(r.recipe_id) ?? 0;
    scoreMap.set(r.recipe_id, prev + reactionScore(r.rating));
  }
  const rankedSwipe = rankByReactions(swipeRecipes ?? [], scoreMap);
  const rankedGrid = rankByReactions(gridRecipes ?? [], scoreMap);

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
      swipeRecipes={rankedSwipe}
      trendingRecipes={trendingRaw ?? []}
      trendingTotal={trendingTotal ?? 0}
      pantryMatches={topPantryMatches}
      pantryMatchTotal={allPantryMatches.length}
      pantryItemCount={pantryNames.length}
      quickRecipes={quickRecipes}
      cuisines={cuisines}
      gridRecipes={rankedGrid}
      gridTotal={gridTotal ?? 0}
      pantryNames={pantryNames}
      isLoggedIn={!!user}
    />
  );
}
