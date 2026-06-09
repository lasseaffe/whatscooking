import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { fetchTheMealDBById, fetchSpoonacularById } from "@/lib/external-sources/adapters";
import { CookingModeWrapper, CookingModeCTA, MobileStickyCTA } from "@/app/(app)/recipes/[id]/cooking-mode-wrapper";
import { TimeBreakdownBar } from "@/components/time-breakdown-bar";
import { SaveButton } from "./save-button";

export const dynamic = "force-dynamic";

const SOURCE_COLORS: Record<string, string> = {
  themealdb:   "#0D9488",
  spoonacular: "#EA580C",
};

export default async function ExternalRecipeDetailPage({
  params,
}: {
  params: Promise<{ source: string; id: string }>;
}) {
  const { source, id } = await params;

  let recipe = null;
  if (source === "themealdb")   recipe = await fetchTheMealDBById(id);
  else if (source === "spoonacular") recipe = await fetchSpoonacularById(id);

  if (!recipe) notFound();

  const accentColor = SOURCE_COLORS[source] ?? "#C8522A";
  const hasTime = (recipe.prepTime ?? 0) + (recipe.cookTime ?? 0) > 0;
  const hasNutrition = recipe.calories || recipe.protein || recipe.carbs || recipe.fat;

  return (
    <CookingModeWrapper
      recipeTitle={recipe.title}
      imageUrl={recipe.imageUrl ?? ""}
      baseServings={recipe.servings ?? 2}
      instructions={recipe.instructions}
      ingredients={recipe.ingredients}
    >
      <div className="max-w-3xl mx-auto px-4 pb-24 pt-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 mb-6 text-xs" style={{ color: "#A69180" }}>
          <Link href="/explore" className="hover:underline">Explore</Link>
          <span>/</span>
          <span style={{ color: "#6B5B52" }}>{recipe.title}</span>
        </div>

        {/* Hero */}
        <div className="rounded-2xl overflow-hidden mb-4 relative" style={{ height: 280 }}>
          {recipe.imageUrl ? (
            <img src={recipe.imageUrl} alt={recipe.title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full" style={{ background: "#F0E8DC" }} />
          )}
          <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(20,10,4,0.75) 0%, transparent 60%)" }} />
          <div className="absolute bottom-0 left-0 right-0 px-6 pb-5">
            {recipe.cuisineType && (
              <span
                className="inline-block text-xs font-semibold px-3 py-1 rounded-full mb-3"
                style={{ background: accentColor, color: "#fff" }}
              >
                {recipe.cuisineType}
              </span>
            )}
            <h1
              className="text-3xl font-bold text-white drop-shadow"
              style={{ fontFamily: "'Libre Baskerville', Georgia, serif" }}
            >
              {recipe.title}
            </h1>
          </div>
        </div>

        <CookingModeCTA />

        {/* Meta */}
        <div className="flex flex-wrap items-center gap-3 my-4">
          {hasTime && (
            <TimeBreakdownBar
              prepTimeMinutes={recipe.prepTime ?? 0}
              cookTimeMinutes={recipe.cookTime ?? 0}
              instructions={recipe.instructions}
            />
          )}
          {recipe.servings && (
            <span className="text-xs px-3 py-1 rounded-full" style={{ background: "#F0E8DC", color: "#6B5B52" }}>
              {recipe.servings} servings
            </span>
          )}
          {recipe.dietaryTags?.map((tag) => (
            <span key={tag} className="text-xs px-3 py-1 rounded-full font-medium" style={{ background: "#E8F5E9", color: "#2E7D32" }}>
              {tag}
            </span>
          ))}
        </div>

        {/* Nutrition */}
        {hasNutrition && (
          <div className="grid grid-cols-4 gap-3 mb-6">
            {[
              { label: "Calories", value: recipe.calories, unit: "kcal" },
              { label: "Protein",  value: recipe.protein,  unit: "g" },
              { label: "Carbs",    value: recipe.carbs,    unit: "g" },
              { label: "Fat",      value: recipe.fat,      unit: "g" },
            ].map(({ label, value, unit }) => value ? (
              <div key={label} className="rounded-xl p-3 text-center" style={{ background: "#FBF6EE", border: "1px solid #F0E8DC" }}>
                <p className="text-lg font-bold" style={{ color: "#3D2817" }}>{value}</p>
                <p className="text-xs" style={{ color: "#A69180" }}>{unit}</p>
                <p className="text-xs font-medium mt-0.5" style={{ color: "#6B5B52" }}>{label}</p>
              </div>
            ) : null)}
          </div>
        )}

        {/* Description */}
        {recipe.description && (
          <div className="rounded-2xl p-5 mb-6" style={{ background: "#FBF6EE", border: "1px solid #F0E8DC" }}>
            <p className="text-sm leading-relaxed" style={{ color: "#3D2817" }}>{recipe.description}</p>
          </div>
        )}

        {/* Ingredients + Instructions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
          <div className="rounded-2xl border p-5" style={{ borderColor: "#F0E8DC" }}>
            <h2 className="text-sm font-bold mb-4" style={{ color: "#3D2817" }}>Ingredients</h2>
            <ul className="flex flex-col gap-2">
              {recipe.ingredients.map((ing, i) => (
                <li key={i} className="flex items-center gap-2 text-sm" style={{ color: "#6B5B52" }}>
                  <span
                    className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                    style={{ background: `${accentColor}20`, color: accentColor }}
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

          <div className="rounded-2xl border p-5" style={{ borderColor: "#F0E8DC" }}>
            <h2 className="text-sm font-bold mb-4" style={{ color: "#3D2817" }}>Instructions</h2>
            <ol className="flex flex-col gap-4">
              {recipe.instructions.map((step, i) => (
                <li key={i} className="flex gap-3">
                  <span
                    className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5"
                    style={{ background: accentColor, color: "#fff" }}
                  >
                    {i + 1}
                  </span>
                  <p className="text-sm leading-relaxed flex-1" style={{ color: "#3D2817" }}>{step}</p>
                </li>
              ))}
            </ol>
          </div>
        </div>

        {/* Save CTA */}
        <div
          className="rounded-2xl p-5 mb-6 flex items-center justify-between"
          style={{ background: "#FDF2EC", border: "1px solid #C8522A25" }}
        >
          <div>
            <p className="text-sm font-semibold" style={{ color: "#3D2817" }}>Like this recipe?</p>
            <p className="text-xs mt-0.5" style={{ color: "#6B5B52" }}>
              Save it to your cookbook — we&apos;ll fill any gaps automatically.
            </p>
          </div>
          <SaveButton recipe={recipe} />
        </div>

        <Link
          href="/explore"
          className="inline-flex items-center gap-2 text-sm font-medium hover:underline"
          style={{ color: accentColor }}
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Explore
        </Link>
      </div>

      <MobileStickyCTA hasInstructions={recipe.instructions.length > 0} />
    </CookingModeWrapper>
  );
}
