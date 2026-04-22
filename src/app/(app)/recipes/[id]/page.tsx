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
import { CookingModeWrapper } from "./cooking-mode-wrapper";

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

  const [{ data: ratingsData }, { data: commentsData }, { data: saveData }, { data: myRating }, { data: pantryData }] = await Promise.all([
    supabase.from("recipe_ratings").select("taste,difficulty,prep_time_rating,value_for_effort,presentation").eq("recipe_id", id),
    supabase.from("recipe_comments").select("*, profile:profiles(full_name, id)").eq("recipe_id", id).order("created_at", { ascending: false }),
    supabase.from("recipe_saves").select("recipe_id").eq("user_id", user!.id).eq("recipe_id", id).maybeSingle(),
    supabase.from("recipe_ratings").select("*").eq("user_id", user!.id).eq("recipe_id", id).maybeSingle(),
    supabase.from("pantry_items").select("id, name, quantity").eq("user_id", user!.id),
  ]);

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
    <CookingModeWrapper>
      {/* ── Back nav ── */}
      <div className="px-6 pt-5 pb-0 flex items-center justify-between">
        <Link href="/discover" className="inline-flex items-center gap-1.5 text-sm font-medium hover:opacity-80 transition-opacity"
          style={{ color: "var(--wc-pal-accent, #B07D56)" }}>
          <ChevronLeft style={{ width: 16, height: 16 }} /> Back to recipes
        </Link>
      </div>

      {/* ══ FULL-WIDTH HERO ══ */}
      <div className="relative w-full overflow-hidden" style={{ height: "40vh", minHeight: 340, maxHeight: 480 }}>
        <RecipeHeroImage
          recipeId={id}
          imageUrl={recipeData.image_url}
          title={displayTitle}
          cuisine={recipeData.cuisine_type}
          dietaryTags={(recipeData.dietary_tags ?? []) as string[]}
          sourceUrl={recipeData.source_url}
          sourceName={recipeData.source_name}
        />
        {/* Gradient fade to page background at bottom */}
        <div
          className="absolute inset-x-0 bottom-0 pointer-events-none"
          style={{
            height: "60%",
            background: "linear-gradient(to top, var(--bg-base, #0d0d0c) 0%, transparent 100%)",
          }}
        />
      </div>

      {/* ══ MASTER-DETAIL GRID ══
          desktop: [320px left sticky] | [1fr right scrollable]
          mobile: single column
      ══════════════════════════════════════════════════════ */}
      <div
        className="px-0 md:grid"
        style={{
          gridTemplateColumns: "320px 1fr",
          alignItems: "flex-start",
          borderBottom: "1px solid rgba(42,24,8,0.6)",
        }}
      >
        {/* ── LEFT COLUMN: sticky ingredients panel ── */}
        <div
          className="flex flex-col"
          style={{
            position: "sticky",
            top: 0,
            height: "calc(100vh - 64px)",
            overflowY: "auto",
            borderRight: "1px solid rgba(42,24,8,0.5)",
            background: "var(--wc-floor, rgba(14,9,5,0.5))",
          }}
        >
          <div className="p-5 flex flex-col gap-4">
            {/* Title */}
            <div>
              <h1
                className="font-bold leading-snug"
                style={{ color: "var(--wc-text, #EFE3CE)", fontFamily: "'Libre Baskerville', Georgia, serif", fontSize: "1.35rem" }}
              >
                {displayTitle}
              </h1>
              {recipeData.description && (
                <p className="text-sm leading-relaxed mt-1.5" style={{ color: "var(--fg-tertiary, #7A5A40)", lineHeight: 1.7 }}>
                  {recipeData.description}
                </p>
              )}
            </div>

            {/* Key metrics */}
            <div className="flex flex-wrap gap-2">
              {recipeData.calories && (
                <span className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full font-semibold"
                  style={{ background: "rgba(42,24,8,0.7)", color: "#C8522A", border: "1px solid rgba(200,82,42,0.2)" }}>
                  <Flame style={{ width: 11, height: 11 }} /> {recipeData.calories} kcal
                </span>
              )}
              {totalTime > 0 && (
                <span className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full font-semibold"
                  style={{ background: "rgba(42,24,8,0.7)", color: "var(--wc-pal-accent, #B07D56)", border: "1px solid rgba(176,125,86,0.2)" }}>
                  <Clock style={{ width: 11, height: 11 }} /> {totalTime}m
                </span>
              )}
              {recipeData.servings && (
                <span className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full font-semibold"
                  style={{ background: "rgba(42,24,8,0.7)", color: "var(--wc-pal-accent, #B07D56)", border: "1px solid rgba(176,125,86,0.2)" }}>
                  <Users style={{ width: 11, height: 11 }} /> {recipeData.servings} serves
                </span>
              )}
              {recipeData.protein_g && (
                <span className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full font-semibold"
                  style={{ background: "rgba(42,24,8,0.7)", color: "var(--wc-pal-sage, #828E6F)", border: "1px solid rgba(130,142,111,0.2)" }}>
                  <Dumbbell style={{ width: 11, height: 11 }} /> {recipeData.protein_g}g
                </span>
              )}
              {(recipeData as { difficulty_level?: string | null }).difficulty_level && (
                <span className="text-xs px-3 py-1.5 rounded-full font-semibold"
                  style={{ background: "rgba(42,24,8,0.7)", color: "#828E6F", border: "1px solid rgba(130,142,111,0.2)" }}>
                  {(recipeData as { difficulty_level?: string }).difficulty_level}
                </span>
              )}
            </div>

            {/* Time breakdown */}
            {totalTime > 0 && (
              <TimeBreakdownBar
                prepTimeMinutes={prepTime}
                cookTimeMinutes={cookTime}
                instructions={instructions}
              />
            )}

            {/* Dietary tags */}
            {(recipeData.dietary_tags ?? []).length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {(recipeData.dietary_tags as string[]).map((tag) => (
                  <span key={tag} className="text-xs px-2.5 py-1 rounded-full font-medium"
                    style={{ background: "rgba(42,24,8,0.5)", color: "#8A6A4A", border: "1px solid rgba(58,36,22,0.5)" }}>
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {/* Rating summary */}
            {ratingCount > 0 && (
              <div className="rounded-xl border p-3 flex items-center gap-4 flex-wrap"
                style={{ borderColor: "rgba(42,24,8,0.6)", background: "rgba(26,16,8,0.5)" }}>
                <div className="text-center">
                  <div className="text-2xl font-bold" style={{ color: "var(--wc-pal-accent, #B07D56)" }}>{avgTaste}</div>
                  <div className="text-xs" style={{ color: "#6B4E36" }}>taste / 5</div>
                </div>
                {[{ key: "difficulty", label: "difficulty" }, { key: "value_for_effort", label: "value" }].map(({ key, label }) => {
                  const v = avg(key);
                  if (!v) return null;
                  return (
                    <div key={key} className="text-center">
                      <div className="text-lg font-semibold" style={{ color: "var(--wc-text, #EFE3CE)" }}>{v}</div>
                      <div className="text-xs" style={{ color: "#6B4E36" }}>{label} / 5</div>
                    </div>
                  );
                })}
                <div className="ml-auto text-xs" style={{ color: "#6B4E36" }}>{ratingCount} ratings</div>
              </div>
            )}
          </div>
        </div>

        {/* ── RIGHT COLUMN: instructions + cooking phases ── */}
        <div className="min-w-0" style={{ background: "rgba(18,12,7,0.3)" }}>
          <RecipeColumnsClient
            recipeId={id}
            initialIngredients={ingredients}
            initialInstructions={instructions}
            sourceUrl={recipeData.source_url ?? null}
            isPremium={isPremiumOrHack}
            pantryItems={(pantryData ?? []) as { id: string; name: string; quantity?: string | null }[]}
            recipeTitle={displayTitle}
            dietaryTags={(recipeData.dietary_tags ?? []) as string[]}
          />
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════
          FULL-WIDTH BOTTOM SECTIONS
      ══════════════════════════════════════════════════════ */}
      <div className="px-6 py-8 max-w-5xl mx-auto space-y-8">
        <RecipeInteractions
          recipeId={id}
          userId={user!.id}
          initialComments={commentsData ?? []}
          initialSaved={!!saveData}
          myExistingRating={myRating ?? null}
          isOriginalCreator={recipeData.created_by === user!.id}
        />
      </div>

      {/* SOS helper */}
      <SOSCookingHelper recipeTitle={displayTitle} ingredients={ingredients} />
    </CookingModeWrapper>
  );
}
