import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { Flame, Dumbbell, ChevronLeft, Users, Clock } from "lucide-react";
import Link from "next/link";
import { RecipeInteractions } from "./recipe-interactions";
import { TimeBreakdownBar } from "@/components/time-breakdown-bar";
import { RecipeColumnsClient } from "./recipe-columns-client";
import { extractAndSaveRecipe } from "@/lib/extract-recipe";
import { RecipeHeroImage } from "./recipe-hero-image";
import { CookingModeWrapper, CookingModeCTA, MobileStickyCTA } from "./cooking-mode-wrapper";
import { RecipeStateProvider } from "./recipe-state-context";
import { RecipeIngredientsPanel } from "./recipe-ingredients-panel";
import { TagInput } from "@/components/tag-input";
import type { FeatureTag } from "@/components/tag-input";
import { FamilyFitBar } from "@/components/family-fit-bar";
import { isDrink } from "@/lib/drinks";
import { DrinkProPanel } from "@/components/drinks/drink-pro-panel";
import { RecipeEditButton } from "./recipe-edit-button";
import { CultureJourneyBanner } from "@/components/recipe/culture-journey-banner";
import { RecipeHeritageSidebar } from "@/components/recipe/recipe-heritage-sidebar";
import type { CulturalJourney, HeritageNotes, RecipeComponentWithRecipe } from "@/lib/types";
import { EcosystemPortal } from "@/components/ecosystem/EcosystemPortal";
import { detectGrowableIngredients, getRecipePortalState } from "@/lib/ecosystem";
import { CUISINES } from "@/lib/cuisines";
import { ComponentFullPageBanner } from "@/components/recipe/component-full-page-banner";
import { ComponentUseInStrip } from "@/components/recipe/component-use-in-strip";
import { ComponentVariationsSection } from "@/components/recipe/component-variations-section";

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
  const isDatasetRecipe = recipe.source === "dataset";

  let recipeData = recipe;
  if (isPremiumOrHack && !hasFullContent && !isDatasetRecipe) {
    const extracted = await extractAndSaveRecipe(id);
    if (extracted) recipeData = extracted as typeof recipe;
  }

  const [{ data: ratingsData }, { data: commentsData }, { data: saveData }, { data: myRating }, { data: pantryData }, { data: recipeTags }, { data: householdMembers }, { data: componentLinksRaw }, { data: componentParentsRaw }] = await Promise.all([
    supabase.from("recipe_ratings").select("taste,difficulty,prep_time_rating,value_for_effort,presentation").eq("recipe_id", id),
    supabase.from("recipe_comments").select("*, profile:profiles(full_name, id)").eq("recipe_id", id).order("created_at", { ascending: false }),
    supabase.from("recipe_saves").select("recipe_id").eq("user_id", user!.id).eq("recipe_id", id).maybeSingle(),
    supabase.from("recipe_ratings").select("*").eq("user_id", user!.id).eq("recipe_id", id).maybeSingle(),
    supabase.from("pantry_items").select("id, name, quantity").eq("user_id", user!.id),
    supabase.from("wc_recipe_feature_tags").select("tag_id, wc_feature_tags(id, name, label)").eq("recipe_id", id),
    supabase.from("household_members").select("id, display_name, avatar_emoji, age_group, filter_strictness, owner_user_id, linked_user_id, created_at").eq("owner_user_id", user!.id),
    supabase.from("recipe_component_links").select("id, ingredient_group_label, display_order, component_recipe_id, component:recipes!component_recipe_id(id, title, description, image_url, component_type, cook_time_minutes, prep_time_minutes, servings, ingredients, difficulty_level)").eq("parent_recipe_id", id).order("display_order"),
    supabase.from("recipe_component_links").select("parent_recipe_id, parent:recipes!parent_recipe_id(id, title, image_url)").eq("component_recipe_id", id),
  ]);

  // Fetch member ingredient preferences for FamilyFitBar
  const memberIds = (householdMembers ?? []).map((m) => m.id);
  const { data: memberPrefsRaw } = memberIds.length > 0
    ? await supabase
        .from("member_ingredient_preferences")
        .select("member_id, ingredient_id, ingredient_text, sentiment, source, id, created_at")
        .in("member_id", memberIds)
    : { data: [] };

  const memberPrefsMap: Record<string, import("@/lib/types").MemberIngredientPreference[]> = {};
  for (const p of memberPrefsRaw ?? []) {
    if (!memberPrefsMap[p.member_id]) memberPrefsMap[p.member_id] = [];
    memberPrefsMap[p.member_id].push(p as import("@/lib/types").MemberIngredientPreference);
  }

  const featureTags: FeatureTag[] = (recipeTags ?? [])
    .map((rt) => rt.wc_feature_tags as unknown as FeatureTag)
    .filter(Boolean);

  const componentLinks: RecipeComponentWithRecipe[] = (componentLinksRaw ?? [])
    .filter((l) => l.component != null)
    .map((l) => ({
      id: l.id,
      parent_recipe_id: id,
      component_recipe_id: l.component_recipe_id,
      ingredient_group_label: l.ingredient_group_label,
      display_order: l.display_order,
      created_at: "",
      component: l.component as unknown as RecipeComponentWithRecipe["component"],
    }));

  const componentParents = (componentParentsRaw ?? [])
    .filter((p) => p.parent != null)
    .map((p) => p.parent as unknown as { id: string; title: string; image_url: string | null });

  const isCulturallySignificant = recipeData.is_culturally_significant === true;
  const culturalJourney = isCulturallySignificant
    ? (recipeData.cultural_journey as CulturalJourney | null)
    : null;
  const heritageNotes = isCulturallySignificant
    ? (recipeData.heritage_notes as HeritageNotes | null)
    : null;
  const cuisineEntry = recipeData.cuisine_type
    ? CUISINES.find((c) =>
        c.dbValues.some(
          (v) => v.toLowerCase() === recipeData.cuisine_type?.toLowerCase()
        )
      ) ?? null
    : null;

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

  // Ecosystem portal: detect growable ingredients and fetch Tillr match state
  const ingredientNames = ingredients.map((i) => i.name ?? "");
  const growableIngredients = await detectGrowableIngredients(ingredientNames);
  const recipePortalState = growableIngredients.length > 0
    ? await getRecipePortalState({ wcUserId: user!.id, growableIngredients })
    : null;
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
      <RecipeStateProvider
        initialIngredients={ingredients}
        initialInstructions={instructions}
        baseServings={recipeData.servings ?? 2}
      >
      {/* ══ MOBILE HERO IMAGE — full-bleed with title overlay, hidden on desktop ══ */}
      {recipeData.image_url && (
        <div className="lg:hidden relative w-full" style={{ height: "62vw", maxHeight: 340, minHeight: 200 }}>
          <RecipeHeroImage
            recipeId={id}
            imageUrl={recipeData.image_url}
            title={displayTitle}
            cuisine={recipeData.cuisine_type}
            dietaryTags={(recipeData.dietary_tags ?? []) as string[]}
            sourceUrl={recipeData.source_url}
            sourceName={recipeData.source_name}
            focal_x={recipeData.focal_x}
            focal_y={recipeData.focal_y}
            editable
          />
          {/* Scrim + title overlay — keeps the title legible over any photo */}
          <div
            className="absolute inset-x-0 bottom-0 px-6 pt-16 pb-5 pointer-events-none"
            style={{ background: "linear-gradient(to top, var(--wc-bg, #0d0a07) 8%, rgba(13,10,7,0.78) 45%, transparent)" }}
          >
            {recipeData.cuisine_type && (
              <p className="text-[11px] font-bold uppercase tracking-widest mb-1" style={{ color: "#F4A261" }}>
                {recipeData.cuisine_type}
              </p>
            )}
            <h1
              style={{
                color: "#fff",
                fontFamily: "'Libre Baskerville', Georgia, serif",
                fontSize: "clamp(1.6rem, 7vw, 2.1rem)",
                lineHeight: 1.1,
                fontWeight: 700,
                textShadow: "0 2px 12px rgba(0,0,0,0.5)",
              }}
            >
              {displayTitle}
            </h1>
          </div>
        </div>
      )}

      {/* ══ BUILDING BLOCK BANNER — shown only when this recipe is a component ══ */}
      {recipeData.is_component && (
        <div className="px-6 lg:px-10 pt-4">
          <ComponentFullPageBanner
            isComponent={!!recipeData.is_component}
            componentType={(recipeData.component_type as import("@/lib/types").ComponentType) ?? null}
            parentRecipeCount={componentParents.length}
            firstParentTitle={componentParents[0]?.title ?? null}
            firstParentId={componentParents[0]?.id ?? null}
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

        {/* ══ DESKTOP TOP ROW — image + Cook (left) · ingredients (right) ══ */}
        <div className="hidden lg:flex gap-10 items-start mb-8">
          {/* Left: image anchor + Cook CTA (F-shape) */}
          <div className="w-[44%] shrink-0 flex flex-col gap-4" style={{ maxWidth: 520 }}>
            <div className="rounded-2xl overflow-hidden" style={{ height: "clamp(260px, 34vw, 420px)" }}>
              <RecipeHeroImage
                recipeId={id}
                imageUrl={recipeData.image_url}
                title={displayTitle}
                cuisine={recipeData.cuisine_type}
                dietaryTags={(recipeData.dietary_tags ?? []) as string[]}
                sourceUrl={recipeData.source_url}
                sourceName={recipeData.source_name}
                focal_x={recipeData.focal_x}
                focal_y={recipeData.focal_y}
                editable
              />
            </div>
            {instructions.length > 0 && <CookingModeCTA />}
          </div>
          {/* Right: ingredients panel + ecosystem portal */}
          <div className="flex-1 min-w-0 flex flex-col gap-4">
            <RecipeIngredientsPanel
              recipeId={id}
              sourceUrl={recipeData.source_url ?? null}
              isPremium={isPremiumOrHack}
              pantryItems={(pantryData ?? []) as { id: string; name: string; quantity?: string | null }[]}
              recipeTitle={displayTitle}
            />
            {recipePortalState && growableIngredients.length > 0 && (
              <EcosystemPortal
                portalState={recipePortalState}
                growableIngredients={growableIngredients}
              />
            )}
          </div>
        </div>

        {/* ══ TITLE + METADATA — full width below the image/ingredients row ══ */}
        <div className="flex flex-col gap-4">

            {/* Origin label — desktop only (mobile shows it in the hero overlay) */}
            {recipeData.cuisine_type && (
              <p
                className="hidden lg:block text-xs font-bold uppercase tracking-widest"
                style={{ color: "#C8522A" }}
              >
                {recipeData.cuisine_type}
              </p>
            )}

            {/* Title + edit button — desktop only (mobile shows title in overlay) */}
            <div className="hidden lg:flex items-start gap-3">
              <h1
                className="flex-1"
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
              <div className="mt-2 shrink-0">
                <RecipeEditButton
                  recipeId={id}
                  initialTitle={displayTitle}
                  initialDescription={recipeData.description ?? null}
                  initialInstructions={instructions}
                />
              </div>
            </div>

            {/* Mobile-only edit button (title is in the hero overlay) */}
            <div className="lg:hidden -mt-1">
              <RecipeEditButton
                recipeId={id}
                initialTitle={displayTitle}
                initialDescription={recipeData.description ?? null}
                initialInstructions={instructions}
              />
            </div>

            {/* Cultural journey banner */}
            {culturalJourney && (
              <CultureJourneyBanner journey={culturalJourney} />
            )}

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

            {/* Family fit indicator */}
            {(householdMembers ?? []).length > 0 && (
              <FamilyFitBar
                members={(householdMembers ?? []) as import("@/lib/types").HouseholdMember[]}
                memberPrefs={memberPrefsMap}
                recipeTitle={displayTitle}
                recipeDescription={recipeData.description ?? ""}
              />
            )}

          </div>

          {/* ── Mobile: ingredients panel (image + title live in the hero overlay above) ── */}
          <div className="lg:hidden mt-6">
            <RecipeIngredientsPanel
              recipeId={id}
              sourceUrl={recipeData.source_url ?? null}
              isPremium={isPremiumOrHack}
              pantryItems={(pantryData ?? []) as { id: string; name: string; quantity?: string | null }[]}
              recipeTitle={displayTitle}
            />
          </div>
          {/* Mobile: Cook CTA (renders as a sticky bottom bar on small screens) */}
          <div className="lg:hidden mt-4">
            {instructions.length > 0 && <CookingModeCTA />}
          </div>
      </div>

      {/* ══ RECIPE COLUMNS — ingredients + instructions ══ */}
      <div
        className={heritageNotes && cuisineEntry ? "lg:grid lg:grid-cols-[1fr_220px] lg:gap-6 lg:items-start lg:px-10" : ""}
        style={{ borderBottom: "1px solid rgba(42,24,8,0.6)" }}
      >
        <RecipeColumnsClient
          recipeId={id}
          pantryItems={(pantryData ?? []) as { id: string; name: string; quantity?: string | null }[]}
          recipeTitle={displayTitle}
          dietaryTags={(recipeData.dietary_tags ?? []) as string[]}
          componentLinks={componentLinks}
        />
        {heritageNotes && cuisineEntry && (
          <div className="hidden lg:block pt-8 pb-4">
            <RecipeHeritageSidebar
              notes={heritageNotes}
              cuisineSlug={cuisineEntry.slug}
              cuisineName={cuisineEntry.name}
            />
          </div>
        )}
      </div>

      {/* Mobile heritage sidebar — stacks below recipe columns */}
      {heritageNotes && cuisineEntry && (
        <div className="lg:hidden px-6 pt-6">
          <RecipeHeritageSidebar
            notes={heritageNotes}
            cuisineSlug={cuisineEntry.slug}
            cuisineName={cuisineEntry.name}
          />
        </div>
      )}

      {/* ══ DRINK PRO PANEL — shown only for drink recipes ══ */}
      {isDrink((recipeData.dish_types ?? []) as string[]) && (
        <div className="px-6 lg:px-10 max-w-5xl mx-auto">
          <DrinkProPanel
            dishTypes={(recipeData.dish_types ?? []) as string[]}
            drinkMeta={(recipeData as Record<string, unknown>).drink_meta as Record<string, unknown> ?? {}}
          />
        </div>
      )}

      {/* ══════════════════════════════════════════════════════
          FULL-WIDTH BOTTOM SECTIONS
      ══════════════════════════════════════════════════════ */}
      {/* Mobile sticky CTA sentinel — triggers when interactions section enters view */}
      <MobileStickyCTA hasInstructions={instructions.length > 0} />

      {/* Sentinel — CTA unsticks when this enters viewport */}
      <div id="cta-sentinel" />

      {componentParents.length > 0 && (
        <div className="px-6 lg:px-10 max-w-5xl mx-auto">
          <ComponentUseInStrip parents={componentParents} />
        </div>
      )}

      {/* Variations section — only shown on canonical (non-variation) components */}
      {recipeData.is_component && !recipeData.is_variation && (
        <ComponentVariationsSection canonicalId={id} />
      )}

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

      </RecipeStateProvider>
    </CookingModeWrapper>
  );
}
