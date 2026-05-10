import { notFound } from "next/navigation";
import Link from "next/link";
import { Clock, Users, ChefHat, Flame } from "lucide-react";
import { getNationBySlug, CONF_COLORS } from "@/lib/wc2026";
import { getDishRecipe, getDishSlug } from "@/lib/wc2026-recipes";
import { createClient } from "@/lib/supabase/server";
import { CookingModeWrapper, CookingModeCTA, MobileStickyCTA } from "@/app/(app)/recipes/[id]/cooking-mode-wrapper";
import { RecipeColumnsClient } from "@/app/(app)/recipes/[id]/recipe-columns-client";
import { SOSCookingHelper } from "@/components/sos-cooking-helper";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ country: string; dish: string }>;
}) {
  const { country, dish } = await params;
  const nation = getNationBySlug(country);
  if (!nation) return { title: "Not Found" };
  const recipe = getDishRecipe(country, dish);
  const dishName = recipe?.name ?? dish.replace(/-/g, " ");
  return { title: `${dishName} — ${nation.name} | World Cup 2026` };
}

const DIFFICULTY_COLOR = {
  Easy: "#4ade80",
  Medium: "#facc15",
  Hard: "#f87171",
};

export default async function WCDishPage({
  params,
}: {
  params: Promise<{ country: string; dish: string }>;
}) {
  const { country, dish } = await params;
  const nation = getNationBySlug(country);
  if (!nation) notFound();

  const recipe = getDishRecipe(country, dish);
  const confColor = CONF_COLORS[nation.group] ?? "#C8522A";

  const nationDish = nation.dishes.find((d) => getDishSlug(d.name) === dish);
  if (!nationDish && !recipe) notFound();

  const displayName = recipe?.name ?? nationDish?.name ?? dish;

  // Auth + pantry (best-effort — WC pages are accessible without login)
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: pantryData } = user
    ? await supabase.from("pantry_items").select("id, name, quantity").eq("user_id", user.id)
    : { data: [] };

  const ingredients = (recipe?.ingredients ?? []).map((ing) => ({ name: ing }));
  const instructions = recipe?.instructions ?? [];

  // Parse servings from prepTime string for scaling (e.g. "30 min" → keep recipe.servings)
  const baseServings = recipe?.servings ?? 2;

  return (
    <CookingModeWrapper
      recipeTitle={displayName}
      baseServings={baseServings}
      instructions={instructions}
      ingredients={ingredients}
    >
      {/* ══ HEADER ══ */}
      <div
        className="px-6 lg:px-10 pt-6 pb-8"
        style={{ borderBottom: "1px solid rgba(42,24,8,0.5)" }}
      >
        {/* Breadcrumb */}
        <div
          className="flex items-center gap-2 mb-6 text-xs flex-wrap"
          style={{ color: "#A69180" }}
        >
          <Link href="/cuisines" className="hover:underline">Cuisines</Link>
          <span>/</span>
          <Link href="/cuisines/world-cup-2026" className="hover:underline">World Cup 2026</Link>
          <span>/</span>
          <Link href={`/cuisines/world-cup-2026/${country}`} className="hover:underline">
            {nation.flag} {nation.name}
          </Link>
          <span>/</span>
          <span style={{ color: "#6B5B52" }}>{displayName}</span>
        </div>

        <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 items-start">
          {/* ── Left: title + metadata ── */}
          <div className="flex-1 flex flex-col gap-4 lg:py-2">
            <p className="text-xs font-bold uppercase tracking-widest" style={{ color: confColor }}>
              {nation.flag} {nation.name} · {nation.cuisine} Cuisine
            </p>

            <h1
              style={{
                color: "var(--wc-text, #EFE3CE)",
                fontFamily: "'Libre Baskerville', Georgia, serif",
                fontSize: "clamp(2rem, 5vw, 3rem)",
                lineHeight: 1.1,
                fontWeight: 700,
              }}
            >
              {displayName}
            </h1>

            {(recipe?.description ?? nationDish?.description) && (
              <p className="text-base italic leading-relaxed" style={{ color: "#7A5A40", maxWidth: "44ch" }}>
                {recipe?.description ?? nationDish?.description}
              </p>
            )}

            {recipe && (
              <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm" style={{ color: "#8A6A4A" }}>
                <span className="flex items-center gap-1.5">
                  <Clock style={{ width: 13, height: 13 }} /> Prep: {recipe.prepTime}
                </span>
                <span className="flex items-center gap-1.5">
                  <Flame style={{ width: 13, height: 13 }} /> Cook: {recipe.cookTime}
                </span>
                <span className="flex items-center gap-1.5">
                  <Users style={{ width: 13, height: 13 }} /> Serves {recipe.servings}
                </span>
                <span
                  className="flex items-center gap-1.5 font-semibold"
                  style={{ color: DIFFICULTY_COLOR[recipe.difficulty] }}
                >
                  <ChefHat style={{ width: 13, height: 13 }} /> {recipe.difficulty}
                </span>
              </div>
            )}

            {/* WC badge */}
            <span
              className="self-start text-xs font-bold px-3 py-1.5 rounded-full"
              style={{
                background: `${confColor}20`,
                color: confColor,
                border: `1px solid ${confColor}40`,
              }}
            >
              ⚽ FIFA World Cup 2026
            </span>
          </div>

          {/* ── Right: Cooking Mode CTA (desktop) ── */}
          {instructions.length > 0 && (
            <div className="hidden lg:flex w-full lg:w-[38%] shrink-0 flex-col gap-4 lg:pt-12" style={{ maxWidth: 420 }}>
              <CookingModeCTA />
              {recipe?.tip && (
                <div
                  className="rounded-2xl p-4 flex gap-3"
                  style={{
                    background: `${confColor}10`,
                    border: `1px solid ${confColor}25`,
                  }}
                >
                  <span className="text-xl">👨‍🍳</span>
                  <div>
                    <p className="text-xs font-bold mb-1" style={{ color: confColor }}>Chef&apos;s Tip</p>
                    <p className="text-sm leading-relaxed" style={{ color: "rgba(239,227,206,0.7)" }}>
                      {recipe.tip}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ══ RECIPE COLUMNS — ingredients + instructions ══ */}
      {recipe ? (
        <div style={{ borderBottom: "1px solid rgba(42,24,8,0.6)" }}>
          <RecipeColumnsClient
            recipeId={`wc2026-${country}-${dish}`}
            initialIngredients={ingredients}
            initialInstructions={instructions}
            sourceUrl={null}
            isPremium={false}
            pantryItems={(pantryData ?? []) as { id: string; name: string; quantity?: string | null }[]}
            recipeTitle={displayName}
            dietaryTags={[]}
            baseServings={baseServings}
          />
        </div>
      ) : (
        /* No recipe data yet */
        <div className="px-6 py-10 text-center">
          <span className="text-4xl mb-3 block">🍽️</span>
          <p className="text-base font-semibold mb-2" style={{ color: "#EFE3CE" }}>
            Full recipe coming soon
          </p>
          <p className="text-sm" style={{ color: "#A69180" }}>
            We&apos;re adding step-by-step instructions for every World Cup 2026 signature dish.
          </p>
        </div>
      )}

      {/* Mobile sticky CTA */}
      <MobileStickyCTA hasInstructions={instructions.length > 0} />

      {/* Chef's tip (mobile) */}
      {recipe?.tip && (
        <div className="lg:hidden px-6 pt-6 max-w-2xl mx-auto">
          <div
            className="rounded-2xl p-4 flex gap-3"
            style={{ background: `${confColor}10`, border: `1px solid ${confColor}25` }}
          >
            <span className="text-xl">👨‍🍳</span>
            <div>
              <p className="text-xs font-bold mb-1" style={{ color: confColor }}>Chef&apos;s Tip</p>
              <p className="text-sm leading-relaxed" style={{ color: "rgba(239,227,206,0.7)" }}>
                {recipe.tip}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ══ More from this country ══ */}
      <section className="px-6 py-8 max-w-5xl mx-auto">
        <h2
          className="text-base font-bold mb-3"
          style={{ color: "#EFE3CE", fontFamily: "'Libre Baskerville', Georgia, serif" }}
        >
          More from {nation.name}
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {nation.dishes
            .filter((d) => getDishSlug(d.name) !== dish)
            .slice(0, 6)
            .map((d) => (
              <Link
                key={d.name}
                href={`/cuisines/world-cup-2026/${country}/${getDishSlug(d.name)}`}
                className="rounded-2xl p-3 transition-opacity hover:opacity-80"
                style={{ background: "#0F0A06", border: `1px solid ${confColor}20` }}
              >
                <p className="text-xs font-semibold leading-tight mb-0.5" style={{ color: "#EFE3CE" }}>
                  {d.name}
                </p>
                <p className="text-xs leading-snug" style={{ color: "rgba(239,227,206,0.45)" }}>
                  {d.description}
                </p>
              </Link>
            ))}
        </div>
      </section>

      {/* SOS helper */}
      <SOSCookingHelper recipeTitle={displayName} ingredients={ingredients} />
    </CookingModeWrapper>
  );
}
