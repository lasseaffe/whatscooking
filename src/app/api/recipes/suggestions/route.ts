import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

// POST /api/recipes/suggestions
// Body: { seedIds?: string[], useSaved?: boolean, useOwn?: boolean, useRated?: boolean, dietary?: boolean }
// Returns scored recipe suggestions based on the user's recipe history
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Fetch household members and their preferences for scoring
  const { data: householdMembers } = await supabase
    .from("household_members")
    .select("id, display_name, filter_strictness, age_group")
    .eq("owner_user_id", user.id);

  type MemberPref = { ingredient_text: string; sentiment: string };
  type MemberReactionRow = { recipe_id: string; rating: number };

  let memberPrefs: Record<string, MemberPref[]> = {};
  let memberReactionMap: Record<string, MemberReactionRow[]> = {};

  if (householdMembers?.length) {
    const memberIds = householdMembers.map((m) => m.id);

    const [{ data: prefs }, { data: reactions }] = await Promise.all([
      supabase
        .from("member_ingredient_preferences")
        .select("member_id, ingredient_text, sentiment")
        .in("member_id", memberIds)
        .in("sentiment", ["dislike", "avoid"]),
      supabase
        .from("member_meal_reactions")
        .select("member_id, recipe_id, rating")
        .in("member_id", memberIds),
    ]);

    for (const p of prefs ?? []) {
      if (!memberPrefs[p.member_id]) memberPrefs[p.member_id] = [];
      memberPrefs[p.member_id].push({ ingredient_text: p.ingredient_text, sentiment: p.sentiment });
    }

    for (const r of reactions ?? []) {
      if (!memberReactionMap[r.member_id]) memberReactionMap[r.member_id] = [];
      memberReactionMap[r.member_id].push({ recipe_id: r.recipe_id, rating: r.rating });
    }
  }

  const body = await req.json().catch(() => ({}));
  const {
    seedIds = [],         // Manually added recipe IDs
    useSaved = true,
    useOwn = true,
    useRated = true,
    respectDietary = true,
  } = body as {
    seedIds?: string[];
    useSaved?: boolean;
    useOwn?: boolean;
    useRated?: boolean;
    respectDietary?: boolean;
  };

  // 1. Gather seed recipes
  const idSets: { source: string; ids: string[] }[] = [];

  if (useSaved) {
    const { data } = await supabase
      .from("recipe_saves")
      .select("recipe_id")
      .eq("user_id", user.id)
      .limit(50);
    if (data?.length) idSets.push({ source: "saved", ids: data.map((d) => d.recipe_id) });
  }

  if (useOwn) {
    const { data } = await supabase
      .from("recipes")
      .select("id")
      .eq("source", "user")
      .eq("created_by", user.id)
      .limit(50);
    if (data?.length) idSets.push({ source: "own", ids: data.map((d) => d.id) });
  }

  if (useRated) {
    const { data } = await supabase
      .from("recipe_ratings")
      .select("recipe_id, taste")
      .eq("user_id", user.id)
      .gte("taste", 4) // 4+ star ratings
      .limit(50);
    if (data?.length) idSets.push({ source: "rated", ids: data.map((d) => d.recipe_id) });
  }

  // Merge all seed IDs
  const allSeedIds = [...new Set([...idSets.flatMap((s) => s.ids), ...seedIds])];

  if (allSeedIds.length === 0) {
    // No seeds — return popular recipes as fallback
    const { data: popular } = await supabase
      .from("recipes")
      .select("id, title, description, image_url, cuisine_type, dish_types, dietary_tags, prep_time_minutes, cook_time_minutes, calories, source_name, source_url")
      .not("dish_types", "cs", '{"drink"}')
      .not("dish_types", "cs", '{"hack"}')
      .not("dish_types", "cs", '{"premium"}')
      .limit(20);
    return NextResponse.json({ suggestions: popular ?? [], seedCount: 0, profile: null });
  }

  // 2. Fetch seed recipe details to build a taste profile
  const { data: seedRecipes } = await supabase
    .from("recipes")
    .select("id, cuisine_type, dish_types, dietary_tags")
    .in("id", allSeedIds);

  if (!seedRecipes?.length) {
    return NextResponse.json({ suggestions: [], seedCount: 0, profile: null });
  }

  // 3. Build taste profile
  const cuisineCounts: Record<string, number> = {};
  const dishTypeCounts: Record<string, number> = {};
  const dietaryTagCounts: Record<string, number> = {};
  let veganCount = 0;
  let vegetarianCount = 0;

  for (const r of seedRecipes) {
    if (r.cuisine_type) {
      cuisineCounts[r.cuisine_type] = (cuisineCounts[r.cuisine_type] ?? 0) + 1;
    }
    for (const t of r.dish_types ?? []) {
      dishTypeCounts[t] = (dishTypeCounts[t] ?? 0) + 1;
    }
    for (const t of r.dietary_tags ?? []) {
      dietaryTagCounts[t] = (dietaryTagCounts[t] ?? 0) + 1;
      if (t === "vegan") veganCount++;
      if (t === "vegetarian") vegetarianCount++;
    }
  }

  // Sort by frequency
  const topCuisines = Object.entries(cuisineCounts).sort((a, b) => b[1] - a[1]).map(([c]) => c).slice(0, 5);
  const topDishTypes = Object.entries(dishTypeCounts).sort((a, b) => b[1] - a[1]).map(([t]) => t).slice(0, 5);
  const topDietaryTags = Object.entries(dietaryTagCounts).sort((a, b) => b[1] - a[1]).map(([t]) => t).slice(0, 4);

  // Should suggestions be filtered for vegan/vegetarian?
  const allVegan = respectDietary && veganCount === seedRecipes.length;
  const allVegetarian = respectDietary && vegetarianCount === seedRecipes.length;

  const profile = {
    topCuisines,
    topDishTypes,
    topDietaryTags,
    seedCount: seedRecipes.length,
    isAllVegan: allVegan,
    isAllVegetarian: allVegetarian,
  };

  // 4. Fetch candidate recipes (exclude already seen + drinks/hacks/premium)
  let query = supabase
    .from("recipes")
    .select("id, title, description, image_url, cuisine_type, dish_types, dietary_tags, prep_time_minutes, cook_time_minutes, calories, source_name, source_url")
    .not("dish_types", "cs", '{"drink"}')
    .not("dish_types", "cs", '{"hack"}')
    .not("dish_types", "cs", '{"premium"}')
    .limit(300);

  if (allVegan) {
    query = query.contains("dietary_tags", ["vegan"]);
  } else if (allVegetarian) {
    query = query.contains("dietary_tags", ["vegetarian"]);
  }

  const { data: candidates } = await query;
  if (!candidates?.length) return NextResponse.json({ suggestions: [], seedCount: seedRecipes.length, profile });

  // 5. Score candidates
  const seenIdSet = new Set(allSeedIds);
  type CandidateRow = { id: string; title: string; description: string | null; image_url: string | null; cuisine_type: string | null; dish_types: string[] | null; dietary_tags: string[] | null; prep_time_minutes: number | null; cook_time_minutes: number | null; calories: number | null; source_name: string | null; source_url: string | null };
  const scored = candidates
    .filter((r) => !seenIdSet.has(r.id))
    .reduce<Array<{ _score: number; _badges: string[] } & CandidateRow>>((acc, r) => {
      let score = 0;
      let hardFiltered = false;

      // Existing taste-profile scoring
      if (r.cuisine_type && topCuisines.includes(r.cuisine_type)) {
        score += (topCuisines.length - topCuisines.indexOf(r.cuisine_type)) * 3;
      }
      for (const t of r.dish_types ?? []) {
        if (topDishTypes.includes(t)) score += 2;
      }
      for (const t of r.dietary_tags ?? []) {
        if (topDietaryTags.includes(t)) score += 1;
      }

      // Household scoring pass
      for (const member of householdMembers ?? []) {
        if (hardFiltered) break;
        const prefs = memberPrefs[member.id] ?? [];
        const reactions = memberReactionMap[member.id] ?? [];
        const recipeText = `${r.title ?? ""} ${r.description ?? ""}`.toLowerCase();

        for (const pref of prefs) {
          if (!recipeText.includes(pref.ingredient_text.toLowerCase())) continue;

          if (member.filter_strictness === "allergy") {
            hardFiltered = true;
            break;
          } else if (member.filter_strictness === "dislike") {
            score -= 4;
          } else {
            score -= 1;
          }
        }

        for (const reaction of reactions) {
          if (reaction.recipe_id !== r.id) continue;
          if (reaction.rating === 3) score += 2;
          if (reaction.rating === 1) score -= 3;
        }
      }

      // Compute household badges for this recipe
      const badges: string[] = [];
      const recipeText = `${r.title ?? ""} ${r.description ?? ""}`.toLowerCase();

      // Family favourite: >= 2 members have rated this recipe 3 stars at least once
      const highRatingCount = (householdMembers ?? []).filter((m) =>
        (memberReactionMap[m.id] ?? []).some((rx) => rx.recipe_id === r.id && rx.rating === 3)
      ).length;
      if (highRatingCount >= 2) badges.push("family_favourite");

      // Baby-friendly: baby-age members have no dislike match
      const babyMembers = (householdMembers ?? []).filter((m) => m.age_group === "baby");
      const babyConflict = babyMembers.some((m) =>
        (memberPrefs[m.id] ?? []).some((pref) =>
          recipeText.includes(pref.ingredient_text.toLowerCase())
        )
      );
      if (babyMembers.length > 0 && !babyConflict) badges.push("baby_friendly");

      // Won't eat: members with dislike/allergy match (non-soft strictness)
      const wontEatMembers = (householdMembers ?? [])
        .filter((m) => m.filter_strictness !== "soft")
        .filter((m) =>
          (memberPrefs[m.id] ?? []).some((pref) =>
            recipeText.includes(pref.ingredient_text.toLowerCase())
          )
        );
      if (wontEatMembers.length > 0) {
        badges.push(`wont_eat:${wontEatMembers.map((m) => m.id).join(",")}`);
      }

      if (!hardFiltered) acc.push({ ...r, _score: score, _badges: badges });
      return acc;
    }, [])
    .sort((a, b) => b._score - a._score);

  // Return top 16, with some randomness at the bottom to avoid staleness
  const top = scored.slice(0, 8);
  const rest = scored.slice(8, 60);
  // Fisher-Yates shuffle on the rest
  for (let i = rest.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [rest[i], rest[j]] = [rest[j], rest[i]];
  }
  const suggestions = [...top, ...rest.slice(0, 8)].map(({ _score: _, _badges, ...r }) => ({ ...r, badges: _badges }));

  return NextResponse.json({ suggestions, seedCount: seedRecipes.length, profile, householdMembers: householdMembers ?? [] });
}
