import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { Flame, Dumbbell, ChevronLeft, Users, Clock } from "lucide-react";
import Link from "next/link";
import { RecipeInteractions } from "./recipe-interactions";
import { TimeBreakdownBar } from "@/components/time-breakdown-bar";
import { RecipeColumnsClient } from "./recipe-columns-client";
import { extractAndSaveRecipe } from "@/lib/extract-recipe";
import { RecipeHeroImage } from "./recipe-hero-image";
import { SOSCookingHelper } from "@/components/sos-cooking-helper";
import { CookingModeWrapper, CookingModeCTA, MobileStickyCTA } from "./cooking-mode-wrapper";
import { TagInput } from "@/components/tag-input";
import type { FeatureTag } from "@/components/tag-input";

export default async function RecipePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: recipe } = await supabase
    .from("recipes")
    .select("*")
    .eq("id", id)
    .single();

  if (!recipe) notFound();

  const isPremiumOrHack = (recipe.dish_types ?? []).some((t: string) => t === "premium" || t === "hack");
  const hasFullContent = ((recipe.instructions as string[] | null)?.length ?? 0) >= 2
    && ((recipe.ingredients as unknown[] | null)?.length ?? 0) >= 3;

  let recipeData = recipe;
  if (isPremiumOrHack && !hasFullContent) {
    const extracted = await extractAndSaveRecipe(id);
    if (extracted) recipeData = extracted as typeof recipe;
  }

  const [{ data: ratingsData }, { data: commentsData }, { data: saveData }, { data: myRating }, { data: pantryData }, { data: recipeTags }, { data: householdMembers }] = await Promise.all([
    supabase.from("recipe_ratings").select("taste,difficulty,prep_time_rating,value_for_effort,presentation").eq("recipe_id", id),
    supabase.from("recipe_comments").select("*, profile:profiles(full_name, id)").eq("recipe_id", id).order("created_at", { ascending: false }),
    supabase.from("recipe_saves").select("recipe_id").eq("user_id", user!.id).eq("recipe_id", id).maybeSingle(),
    supabase.from("recipe_ratings").select("*").eq("user_id", user!.id).eq("recipe_id", id).maybeSingle(),
    supabase.from("pantry_items").select("id, name, quantity").eq("user_id", user!.id),
    supabase.from("wc_recipe_feature_tags").select("tag_id, wc_feature_tags(id, name, label)").eq("recipe_id", id),
    supabase.from("household_members").select("id, display_name, avatar_emoji, age_group, filter_strictness").eq("owner_user_id", user!.id),
  ]);

  const featureTags: FeatureTag[] = (recipeTags ?? [])
    .map((rt) => rt.wc_feature_tags as unknown as FeatureTag)
    .filter(Boolean);

  const prepTime = recipeData.prep_time_minutes ?? 0;
  const cookTime = recipeData.cook_time_minutes ?? 0;
  const totalTime = prepTime + cookTime;

  const avg = (key: string) => {
    const vals = (ratingsData ?? []).map((r: Record<string, number | null>) => r[key]).filter((v) => v !== null) as number[];
    return vals.length ? (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1) : null;
  };
  const avgTaste = avg("taste");
  const ratingCount = ratingsData?.length ?? 0;

  const ingredients = (recipeData.ingredients ?? []) as { name: string; amount?: number; unit?: string }[];
  const instructions = (recipeData.instructions ?? []) as string[];

  // Generate a sensible title for premium/instagram recipes
  const displayTitle = (!recipeData.title || recipeData.title.toLowerCase() === "instagram recipe")
    ? recipeData.cuisine_type
      ? `${recipeData.cuisine_type} Recipe`
      : "Untitled Recipe"
    : recipeData.title;

  return (
    <CookingModeWrapper
      recipeTitle={displayTitle}
      imageUrl={recipeData.image_url ?? null}
      rating={avgTaste}
      reviewCount={ratingCount}
      baseServings={recipeData.servings ?? 2}
      instructions={instructions}
      ingredients={ingredients}
    >
      {/* ══ MOBILE HERO IMAGE — full-bleed, hidden on desktop ══ */}
      {recipeData.image_url && (
        <div className="lg:hidden relative w-full" style={{ height: "56vw", maxHeight: 300, minHeight: 160 }}>
          <RecipeHeroImage
            recipeId={id}
            imageUrl={recipeData.image_url}
            title={displayTitle}
            cuisine={recipeData.cuisine_type}
            dietaryTags={(recipeData.dietary_tags ?? []) as string[]}
            sourceUrl={recipeData.source_url}
            sourceName={recipeData.source_name}
          />
          {/* Gradient fade into page background */}
          <div
            className="absolute bottom-0 left-0 right-0 h-16 pointer-events-none"
            style={{ background: "linear-gradient(to bottom, transparent, var(--wc-bg, #0d0a07))" }}
          />
        </div>
      )}

      {/* ══ EDITORIAL HEADER — left: title/meta, right: image panel ══ */}
      <div
        className="px-6 lg:px-10 pt-6 pb-8"
        style={{ borderBottom: "1px solid rgba(42,24,8,0.5)" }}
      >
        {/* Back nav */}
        <Link
          href="/discover"
          className="inline-flex items-center gap-1.5 text-sm font-medium hover:opacity-80 transition-opacity mb-5"
          style={{ color: "var(--wc-pal-accent, #B07D56)" }}
        >
          <ChevronLeft style={{ width: 16, height: 16 }} /> Back to recipes
        </Link>

        <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 items-start">

          {/* ── Left: title + metadata ── */}
          <div className="flex-1 flex flex-col gap-4 lg:py-2">

            {/* Origin label */}
            {recipeData.cuisine_type && (
              <p
                className="text-xs font-bold uppercase tracking-widest"
                style={{ color: "#C8522A" }}
              >
                {recipeData.cuisine_type}
              </p>
            )}

            {/* Title */}
            <h1
              style={{
                color: "var(--wc-text, #EFE3CE)",
                fontFamily: "'Libre Baskerville', Georgia, serif",
                fontSize: "clamp(2rem, 5vw, 3rem)",
                lineHeight: 1.1,
                fontWeight: 700,
              }}
            >
              {displayTitle}
            </h1>

            {/* Description / tagline */}
            {recipeData.description && (
              <p
                className="text-base italic leading-relaxed"
                style={{ color: "#7A5A40", maxWidth: "44ch" }}
              >
                {recipeData.description}
              </p>
            )}

            {/* Metrics row */}
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm" style={{ color: "#8A6A4A" }}>
              {avgTaste && ratingCount > 0 && (
                <span className="flex items-center gap-1.5 font-semibold" style={{ color: "#C8A882" }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="#C8522A" aria-hidden="true">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                  {avgTaste} <span style={{ color: "#5A3A28", fontWeight: 400 }}>({ratingCount})</span>
                </span>
              )}
              {totalTime > 0 && (
                <span className="flex items-center gap-1.5">
                  <Clock style={{ width: 13, height: 13 }} /> {totalTime} min
                </span>
              )}
              {(recipeData as { difficulty_level?: string | null }).difficulty_level && (
                <span className="flex items-center gap-1.5">
                  <Flame style={{ width: 13, height: 13 }} />
                  {(recipeData as { difficulty_level?: string }).difficulty_level}
                </span>
              )}
              {recipeData.servings && (
                <span className="flex items-center gap-1.5">
                  <Users style={{ width: 13, height: 13 }} /> {recipeData.servings} serves
                </span>
              )}
              {recipeData.calories && (
                <span className="flex items-center gap-1.5">
                  <Dumbbell style={{ width: 13, height: 13 }} /> {recipeData.calories} kcal
                </span>
              )}
            </div>

            {/* Time breakdown bar */}
            {totalTime > 0 && (
              <div style={{ maxWidth: 340 }}>
                <TimeBreakdownBar
                  prepTimeMinutes={prepTime}
                  cookTimeMinutes={cookTime}
                  instructions={instructions}
                />
              </div>
            )}

            {/* Dietary tags */}
            {(recipeData.dietary_tags ?? []).length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {(recipeData.dietary_tags as string[]).map((tag) => (
                  <span
                    key={tag}
                    className="text-xs px-2.5 py-1 rounded-full font-medium"
                    style={{ background: "rgba(42,24,8,0.5)", color: "#8A6A4A", border: "1px solid rgba(58,36,22,0.5)" }}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}

          </div>

          {/* ── Right: recipe image panel + Cooking Mode CTA ── */}
          <div className="w-full lg:w-[42%] shrink-0 flex flex-col gap-4" style={{ maxWidth: 520 }}>
            <div
              className="rounded-2xl overflow-hidden"
              style={{ height: "clamp(260px, 38vw, 420px)" }}
            >
              <RecipeHeroImage
                recipeId={id}
                imageUrl={recipeData.image_url}
                title={displayTitle}
                cuisine={recipeData.cuisine_type}
                dietaryTags={(recipeData.dietary_tags ?? []) as string[]}
                sourceUrl={recipeData.source_url}
                sourceName={recipeData.source_name}
              />
            </div>
            {/* Large Cooking Mode CTA — below hero image */}
            {instructions.length > 0 && <CookingModeCTA />}
          </div>
        </div>
      </div>

      {/* ══ RECIPE COLUMNS — ingredients + instructions ══ */}
      <div style={{ borderBottom: "1px solid rgba(42,24,8,0.6)" }}>
        <RecipeColumnsClient
          recipeId={id}
          initialIngredients={ingredients}
          initialInstructions={instructions}
          sourceUrl={recipeData.source_url ?? null}
          isPremium={isPremiumOrHack}
          pantryItems={(pantryData ?? []) as { id: string; name: string; quantity?: string | null }[]}
          recipeTitle={displayTitle}
          dietaryTags={(recipeData.dietary_tags ?? []) as string[]}
          baseServings={recipeData.servings ?? null}
        />
      </div>

      {/* ══════════════════════════════════════════════════════
          FULL-WIDTH BOTTOM SECTIONS
      ══════════════════════════════════════════════════════ */}
      {/* Mobile sticky CTA sentinel — triggers when interactions section enters view */}
      <MobileStickyCTA hasInstructions={instructions.length > 0} />

      <div className="px-6 py-8 max-w-5xl mx-auto space-y-8">
        <RecipeInteractions
          recipeId={id}
          userId={user!.id}
          initialComments={commentsData ?? []}
          initialSaved={!!saveData}
          myExistingRating={myRating ?? null}
          isOriginalCreator={recipeData.created_by === user!.id}
          householdMembers={householdMembers ?? []}
          recipeIngredients={ingredients.map((i) => i.name)}
        />
      </div>

      {/* ── Feature Tags (admin only) ── */}
      {user && (
        <section className="px-6 pb-8 max-w-5xl mx-auto">
          <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: "#6B4E36" }}>Recipe Tags</p>
          <TagInput recipeId={id} initialTags={featureTags} />
        </section>
      )}

      {/* SOS helper */}
      <SOSCookingHelper recipeTitle={displayTitle} ingredients={ingredients} />
    </CookingModeWrapper>
  );
}
