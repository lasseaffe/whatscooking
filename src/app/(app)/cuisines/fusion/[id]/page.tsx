import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { FUSION_DISHES } from "@/lib/fusion-foods";
import { createClient } from "@/lib/supabase/server";
import { CookingModeWrapper, CookingModeCTA, MobileStickyCTA } from "@/app/(app)/recipes/[id]/cooking-mode-wrapper";
import { TimeBreakdownBar } from "@/components/time-breakdown-bar";
import { FusionDNAPanel } from "@/components/fusion/fusion-dna-panel";

export const dynamic = "force-dynamic";

const CATEGORY_COLORS: Record<string, { accent: string; bg: string }> = {
  "Asian-Latin Fusion":             { accent: "#C8522A", bg: "#FDF2EC" },
  "New American Staples":           { accent: "#4A6830", bg: "#EEF5E8" },
  "European-Asian Fusion":          { accent: "#2C4A8C", bg: "#EEF2FA" },
  "Indian-Western Fusion":          { accent: "#8C5030", bg: "#F7F0EA" },
  "Middle Eastern & Global Fusion": { accent: "#7C3A8C", bg: "#F5EEF8" },
};

const DIFFICULTY_COLORS = { easy: "#4A6830", medium: "#C8522A", hard: "#8C1A1A" };

export default async function FusionDishPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const dish = FUSION_DISHES.find((d) => d.id === id);
  if (!dish) notFound();

  const colors = CATEGORY_COLORS[dish.category] ?? { accent: "#C8522A", bg: "#FDF2EC" };

  // Look up a matching recipe in the database
  const supabase = await createClient();
  const { data: recipe } = await supabase
    .from("recipes")
    .select("id")
    .ilike("title", dish.name)
    .maybeSingle();

  if (recipe) redirect(`/recipes/${recipe.id}`);

  const ingredients: { name: string; amount?: number | null; unit?: string | null }[] =
    dish.structuredIngredients ?? dish.ingredients.map((name) => ({ name }));
  const hasNutrition = dish.calories || dish.protein || dish.carbs || dish.fat;
  const hasTime = (dish.prepTime ?? 0) > 0 || (dish.cookTime ?? 0) > 0;

  return (
    <CookingModeWrapper
      recipeTitle={dish.name}
      imageUrl={dish.image}
      baseServings={dish.servings ?? 2}
      instructions={dish.instructions}
      ingredients={ingredients}
    >
      <div className="max-w-3xl mx-auto px-4 pb-24 pt-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 mb-6 text-xs" style={{ color: "#A69180" }}>
          <Link href="/cuisines" className="hover:underline">Cuisines</Link>
          <span>/</span>
          <Link href="/cuisines/fusion" className="hover:underline">Fusion Foods</Link>
          <span>/</span>
          <span style={{ color: "#6B5B52" }}>{dish.name}</span>
        </div>

        {/* Hero image */}
        <div className="rounded-2xl overflow-hidden mb-4 relative" style={{ height: 280 }}>
          <img src={dish.image} alt={dish.name} className="w-full h-full object-cover" />
          <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(20,10,4,0.75) 0%, transparent 60%)" }} />
          <div className="absolute bottom-0 left-0 right-0 px-6 pb-5">
            <span
              className="inline-block text-xs font-semibold px-3 py-1 rounded-full mb-3"
              style={{ background: colors.accent, color: "#fff" }}
            >
              {dish.category}
            </span>
            <h1
              className="text-3xl font-bold text-white drop-shadow"
              style={{ fontFamily: "'Libre Baskerville', Georgia, serif" }}
            >
              {dish.name}
            </h1>
          </div>
        </div>

        {/* Cooking Mode CTA */}
        <CookingModeCTA />

        {/* Meta row: time + difficulty + tags */}
        <div className="flex flex-wrap items-center gap-3 my-4">
          {hasTime && (
            <TimeBreakdownBar
              prepTimeMinutes={dish.prepTime ?? 0}
              cookTimeMinutes={dish.cookTime ?? 0}
              instructions={dish.instructions}
            />
          )}
          {dish.difficulty && (
            <span
              className="flex items-center gap-1.5 text-xs font-medium px-3 py-1 rounded-full"
              style={{
                background: `${DIFFICULTY_COLORS[dish.difficulty]}18`,
                color: DIFFICULTY_COLORS[dish.difficulty],
              }}
            >
              <span
                className="w-2 h-2 rounded-full"
                style={{ background: DIFFICULTY_COLORS[dish.difficulty] }}
              />
              {dish.difficulty.charAt(0).toUpperCase() + dish.difficulty.slice(1)}
            </span>
          )}
          {dish.servings && (
            <span
              className="text-xs px-3 py-1 rounded-full"
              style={{ background: "#F0E8DC", color: "#6B5B52" }}
            >
              {dish.servings} servings
            </span>
          )}
          {dish.dietaryTags?.map((tag) => (
            <span
              key={tag}
              className="text-xs px-3 py-1 rounded-full font-medium"
              style={{ background: "#E8F5E9", color: "#2E7D32" }}
            >
              {tag}
            </span>
          ))}
        </div>

        {/* Nutrition row */}
        {hasNutrition && (
          <div className="grid grid-cols-4 gap-3 mb-6">
            {[
              { label: "Calories", value: dish.calories, unit: "kcal" },
              { label: "Protein",  value: dish.protein,  unit: "g" },
              { label: "Carbs",    value: dish.carbs,    unit: "g" },
              { label: "Fat",      value: dish.fat,      unit: "g" },
            ].map(({ label, value, unit }) =>
              value ? (
                <div
                  key={label}
                  className="rounded-xl p-3 text-center"
                  style={{ background: "#FBF6EE", border: "1px solid #F0E8DC" }}
                >
                  <p className="text-lg font-bold" style={{ color: "#3D2817" }}>{value}</p>
                  <p className="text-xs" style={{ color: "#A69180" }}>{unit}</p>
                  <p className="text-xs font-medium mt-0.5" style={{ color: "#6B5B52" }}>{label}</p>
                </div>
              ) : null
            )}
          </div>
        )}

        {/* Origin story */}
        <div
          className="rounded-2xl p-5 mb-6"
          style={{ background: colors.bg, border: `1px solid ${colors.accent}25` }}
        >
          <h2 className="text-sm font-bold mb-2" style={{ color: colors.accent }}>
            The Story Behind It
          </h2>
          <p className="text-sm leading-relaxed" style={{ color: "#3D2817" }}>{dish.originStory}</p>
        </div>

        {/* FusionDNAPanel */}
        <FusionDNAPanel dish={dish} accentColor={colors.accent} />

        {/* Two-column layout */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
          {/* Ingredients */}
          <div className="rounded-2xl border p-5" style={{ borderColor: "#F0E8DC" }}>
            <h2 className="text-sm font-bold mb-4" style={{ color: "#3D2817" }}>Ingredients</h2>
            <ul className="flex flex-col gap-2">
              {ingredients.map((ing, i) => (
                <li key={i} className="flex items-center gap-2 text-sm" style={{ color: "#6B5B52" }}>
                  <span
                    className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                    style={{ background: `${colors.accent}20`, color: colors.accent }}
                  >
                    {i + 1}
                  </span>
                  <span className="capitalize">
                    {ing.amount ? `${ing.amount}${ing.unit ? ` ${ing.unit}` : ""} ` : ""}
                    {ing.name}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* Instructions */}
          <div className="rounded-2xl border p-5" style={{ borderColor: "#F0E8DC" }}>
            <h2 className="text-sm font-bold mb-4" style={{ color: "#3D2817" }}>Instructions</h2>
            <ol className="flex flex-col gap-4">
              {dish.instructions.map((step, i) => (
                <li key={i} className="flex gap-3">
                  <span
                    className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5"
                    style={{ background: colors.accent, color: "#fff" }}
                  >
                    {i + 1}
                  </span>
                  <p className="text-sm leading-relaxed flex-1" style={{ color: "#3D2817" }}>{step}</p>
                </li>
              ))}
            </ol>
          </div>
        </div>

        <Link
          href="/cuisines/fusion"
          className="inline-flex items-center gap-2 text-sm font-medium hover:underline"
          style={{ color: colors.accent }}
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Fusion Foods
        </Link>
      </div>

      <MobileStickyCTA hasInstructions={dish.instructions.length > 0} />
    </CookingModeWrapper>
  );
}
