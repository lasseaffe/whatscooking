import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Clock, Users } from "lucide-react";
import { FUSION_DISHES } from "@/lib/fusion-foods";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const CATEGORY_COLORS: Record<string, { accent: string; bg: string }> = {
  "Asian-Latin Fusion":            { accent: "#C8522A", bg: "#FDF2EC" },
  "New American Staples":          { accent: "#4A6830", bg: "#EEF5E8" },
  "European-Asian Fusion":         { accent: "#2C4A8C", bg: "#EEF2FA" },
  "Indian-Western Fusion":         { accent: "#8C5030", bg: "#F7F0EA" },
  "Middle Eastern & Global Fusion":{ accent: "#7C3A8C", bg: "#F5EEF8" },
};

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

  if (recipe) {
    redirect(`/recipes/${recipe.id}`);
  }

  // No matching recipe found — silently report and show fallback
  await supabase.from("recipe_bug_reports").insert({
    issue_type: "missing_recipe",
    recipe_name: dish.name,
    recipe_id: null,
  });

  const showFallback = true;

  return (
    <div className="max-w-3xl mx-auto px-4 pb-16 pt-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 mb-6 text-xs" style={{ color: "#A69180" }}>
        <Link href="/cuisines" className="hover:underline">Cuisines</Link>
        <span>/</span>
        <Link href="/cuisines/fusion" className="hover:underline">Fusion Foods</Link>
        <span>/</span>
        <span style={{ color: "#6B5B52" }}>{dish.name}</span>
      </div>

      {/* Hero image */}
      <div className="rounded-2xl overflow-hidden mb-6 relative" style={{ height: 280 }}>
        <img src={dish.image} alt={dish.name} className="w-full h-full object-cover" />
        <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(20,10,4,0.75) 0%, transparent 60%)" }} />
        <div className="absolute bottom-0 left-0 right-0 px-6 pb-5">
          <span
            className="inline-block text-xs font-semibold px-3 py-1 rounded-full mb-3"
            style={{ background: colors.accent, color: "#fff" }}
          >
            {dish.category}
          </span>
          <h1 className="text-3xl font-bold text-white drop-shadow"
            style={{ fontFamily: "'Libre Baskerville', Georgia, serif" }}>
            {dish.name}
          </h1>
        </div>
      </div>

      {/* Origin story */}
      <div className="rounded-2xl p-5 mb-6" style={{ background: colors.bg, border: `1px solid ${colors.accent}25` }}>
        <h2 className="text-sm font-bold mb-2" style={{ color: colors.accent }}>The Story Behind It</h2>
        <p className="text-sm leading-relaxed" style={{ color: "#3D2817" }}>{dish.originStory}</p>
      </div>

      {/* Recipe content or fallback */}
      {showFallback ? (
        <div
          className="rounded-2xl p-6 mb-6 text-center"
          style={{
            background: "#FBF6EE",
            border: "1px solid #E8D9C0",
            boxShadow: "inset 0 1px 3px rgba(160,130,90,0.08)",
          }}
        >
          <p className="text-base leading-relaxed mb-4" style={{ color: "#6B5B52", fontFamily: "'Libre Baskerville', Georgia, serif" }}>
            We&apos;re cooking up a full recipe for <strong style={{ color: "#3D2817" }}>{dish.name}</strong>. Check back soon.
          </p>
          <Link
            href="/cuisines/fusion"
            className="inline-flex items-center gap-2 text-sm font-medium hover:underline"
            style={{ color: colors.accent }}
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Fusion Foods
          </Link>
        </div>
      ) : (
        /* Two-column layout */
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
          {/* Ingredients */}
          <div className="rounded-2xl border p-5" style={{ borderColor: "#F0E8DC" }}>
            <h2 className="text-sm font-bold mb-4" style={{ color: "#3D2817" }}>Ingredients</h2>
            <ul className="flex flex-col gap-2">
              {dish.ingredients.map((ing, i) => (
                <li key={i} className="flex items-center gap-2 text-sm" style={{ color: "#6B5B52" }}>
                  <span
                    className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                    style={{ background: `${colors.accent}20`, color: colors.accent }}
                  >
                    {i + 1}
                  </span>
                  <span className="capitalize">{ing}</span>
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
      )}

      {/* Back link — only shown when full recipe is present */}
      {!showFallback && (
        <Link
          href="/cuisines/fusion"
          className="inline-flex items-center gap-2 text-sm font-medium hover:underline"
          style={{ color: colors.accent }}
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Fusion Foods
        </Link>
      )}
    </div>
  );
}
