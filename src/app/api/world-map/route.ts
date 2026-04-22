import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { CUISINES } from "@/lib/cuisines";
import { CUISINE_SLUG_TO_COUNTRY } from "@/lib/country-cuisine-map";
import { computeBadges, type AchievementContext } from "@/lib/achievements";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Normalise a cuisine_type string to one of our cuisine slugs */
function cuisineTypeToSlug(cuisineType: string): string | null {
  const lower = cuisineType.toLowerCase().trim();
  for (const c of CUISINES) {
    if (c.dbValues.some((v) => v.toLowerCase() === lower)) return c.slug;
  }
  return null;
}

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // ── Collect pinned cuisines from saves ────────────────────────
  const { data: saves } = await supabase
    .from("recipe_saves")
    .select("recipe:recipes!inner(cuisine_type)")
    .eq("user_id", user.id);

  // ── Collect pinned cuisines from ratings ──────────────────────
  const { data: ratings } = await supabase
    .from("recipe_ratings")
    .select("recipe:recipes!inner(cuisine_type)")
    .eq("user_id", user.id);

  const savedCount = saves?.length ?? 0;
  const ratedCount = ratings?.length ?? 0;

  // Build pinned slug set
  const pinnedSlugs = new Set<string>();
  const addCuisine = (ct: string | null | undefined) => {
    if (!ct) return;
    const slug = cuisineTypeToSlug(ct);
    if (slug && CUISINE_SLUG_TO_COUNTRY[slug]) pinnedSlugs.add(slug);
  };

  for (const s of saves ?? []) {
    const rec = s.recipe as unknown as { cuisine_type: string | null } | null;
    addCuisine(rec?.cuisine_type);
  }
  for (const r of ratings ?? []) {
    const rec = r.recipe as unknown as { cuisine_type: string | null } | null;
    addCuisine(rec?.cuisine_type);
  }

  // ── Own recipe stats ──────────────────────────────────────────
  const { data: ownRecipes } = await supabase
    .from("recipes")
    .select("id, is_published, cuisine_type")
    .eq("source", "user")
    .eq("created_by", user.id);

  const ownRecipeCount = ownRecipes?.length ?? 0;
  const publishedRecipeCount = ownRecipes?.filter(r => r.is_published).length ?? 0;

  // Also pin cuisines from own recipes
  for (const r of ownRecipes ?? []) addCuisine(r.cuisine_type);

  // ── Community saves on own recipes ───────────────────────────
  let communityFaveSaves = 0;
  let topRating = 0;

  if (ownRecipes && ownRecipes.length > 0) {
    const ownIds = ownRecipes.map(r => r.id);

    const { data: saveCounts } = await supabase
      .from("recipe_saves")
      .select("recipe_id")
      .in("recipe_id", ownIds)
      .neq("user_id", user.id);

    if (saveCounts) {
      const byRecipe: Record<string, number> = {};
      for (const sc of saveCounts) {
        byRecipe[sc.recipe_id] = (byRecipe[sc.recipe_id] ?? 0) + 1;
      }
      communityFaveSaves = Math.max(0, ...Object.values(byRecipe));
    }

    const { data: ratingRows } = await supabase
      .from("recipe_ratings")
      .select("recipe_id, rating")
      .in("recipe_id", ownIds);

    if (ratingRows && ratingRows.length > 0) {
      const byRecipe: Record<string, number[]> = {};
      for (const rr of ratingRows) {
        if (!byRecipe[rr.recipe_id]) byRecipe[rr.recipe_id] = [];
        byRecipe[rr.recipe_id].push(rr.rating);
      }
      topRating = Math.max(
        0,
        ...Object.values(byRecipe).map(
          (arr) => arr.reduce((a, b) => a + b, 0) / arr.length
        )
      );
    }
  }

  // ── Compute badges ────────────────────────────────────────────
  const ctx: AchievementContext = {
    pinnedSlugs,
    savedCount,
    ratedCount,
    ownRecipeCount,
    publishedRecipeCount,
    communityFaveSaves,
    topRating,
  };

  const earned = computeBadges(ctx);

  // Build pinned country list
  const pinnedCountries = Array.from(pinnedSlugs).map((slug) => ({
    slug,
    ...CUISINE_SLUG_TO_COUNTRY[slug],
  }));

  return NextResponse.json({
    pinnedCountries,
    pinnedSlugs: Array.from(pinnedSlugs),
    totalPinned: pinnedSlugs.size,
    badges: earned.map(b => ({ id: b.id, name: b.name, description: b.description, emoji: b.emoji, tier: b.tier })),
    stats: { savedCount, ratedCount, ownRecipeCount, publishedRecipeCount },
  });
}
