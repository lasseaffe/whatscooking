import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Trophy, Utensils } from "lucide-react";
import { WC2026_NATIONS, CONF_COLORS, getNationBySlug, flagcdnCode } from "@/lib/wc2026";
import { getDishSlug } from "@/lib/wc2026-recipes";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ country: string }> }) {
  const { country } = await params;
  const nation = getNationBySlug(country);
  return { title: nation ? `${nation.name} Cuisine — World Cup 2026` : "Not Found" };
}

export default async function WCCountryPage({ params }: { params: Promise<{ country: string }> }) {
  const { country } = await params;
  const nation = getNationBySlug(country);
  if (!nation) notFound();

  const confColor = CONF_COLORS[nation.group] ?? "#C8522A";

  const supabase = await createClient();
  const { data: recipes } = await supabase
    .from("recipes")
    .select("id, title, image_url")
    .ilike("cuisine_type", nation.cuisine)
    .limit(6);

  const list = recipes ?? [];

  return (
    <div className="max-w-4xl mx-auto px-4 pb-16 pt-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 mb-6 text-xs flex-wrap" style={{ color: "#A69180" }}>
        <Link href="/cuisines" className="hover:underline">Cuisines</Link>
        <span>/</span>
        <Link href="/cuisines/world-cup-2026" className="hover:underline">World Cup 2026</Link>
        <span>/</span>
        <span style={{ color: "#6B5B52" }}>{nation.name}</span>
      </div>

      {/* Hero */}
      <div className="relative rounded-3xl overflow-hidden mb-8" style={{ height: 300, background: "#0A0500" }}>
        <img
          src={`https://flagcdn.com/w1280/${flagcdnCode(nation.iso2)}.png`}
          alt={`${nation.name} flag`}
          className="w-full h-full object-cover"
        />
        <div
          className="absolute inset-0"
          style={{ background: "linear-gradient(to top, rgba(10,5,0,0.85) 0%, rgba(10,5,0,0.2) 60%, transparent 100%)" }}
        />
        <div className="absolute top-4 right-4">
          <span
            className="text-xs font-bold px-3 py-1 rounded-full"
            style={{ background: `${confColor}30`, color: confColor, border: `1px solid ${confColor}60` }}
          >
            {nation.group}
          </span>
        </div>
        <div className="absolute bottom-0 left-0 right-0 px-6 pb-6">
          <div className="flex items-end gap-4">
            <span className="text-6xl leading-none">{nation.flag}</span>
            <div>
              <p className="text-xs font-semibold mb-1" style={{ color: confColor }}>
                {nation.cuisine} Cuisine
              </p>
              <h1
                className="text-3xl font-bold text-white drop-shadow"
                style={{ fontFamily: "'Libre Baskerville', Georgia, serif" }}
              >
                {nation.name}
              </h1>
            </div>
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div className="flex flex-wrap gap-3 mb-8">
        <div
          className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold"
          style={{ background: `${confColor}15`, color: confColor, border: `1px solid ${confColor}30` }}
        >
          <Trophy className="w-4 h-4" />
          WC 2026 Qualifier
        </div>
        <div
          className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold"
          style={{ background: "rgba(239,227,206,0.06)", color: "#A69180", border: "1px solid rgba(239,227,206,0.12)" }}
        >
          <Utensils className="w-4 h-4" />
          {nation.dishes.length} signature dishes
        </div>
        <div
          className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold"
          style={{ background: "rgba(239,227,206,0.06)", color: "#A69180", border: "1px solid rgba(239,227,206,0.12)" }}
        >
          🌍 {nation.region}
        </div>
      </div>

      {/* Dish grid */}
      <h2
        className="text-lg font-bold mb-4"
        style={{ color: "#EFE3CE", fontFamily: "'Libre Baskerville', Georgia, serif" }}
      >
        Signature Dishes
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-10">
        {nation.dishes.map((dish, i) => (
          <Link
            key={dish.name}
            href={`/cuisines/world-cup-2026/${country}/${getDishSlug(dish.name)}`}
            className="flex gap-4 rounded-2xl p-4 transition-opacity hover:opacity-80"
            style={{ background: "#0F0A06", border: `1px solid ${confColor}20` }}
          >
            <span
              className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
              style={{ background: `${confColor}20`, color: confColor }}
            >
              {i + 1}
            </span>
            <div>
              <p className="text-sm font-bold leading-tight mb-0.5" style={{ color: "#EFE3CE" }}>
                {dish.name}
              </p>
              <p className="text-xs leading-relaxed" style={{ color: "rgba(239,227,206,0.5)" }}>
                {dish.description}
              </p>
            </div>
          </Link>
        ))}
      </div>

      {/* Recipes from this cuisine */}
      {list.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
          <span className="text-5xl">⚽</span>
          <p className="text-xl font-bold" style={{ fontFamily: "'Libre Baskerville', Georgia, serif", color: "var(--wc-text, #EFE3CE)" }}>
            Recipes Coming Soon
          </p>
          <p className="text-sm max-w-xs" style={{ color: "#7A5A40" }}>
            We&apos;re busy collecting authentic dishes from this nation. Check back soon!
          </p>
          <Link
            href="/cuisines/world-cup-2026"
            className="px-4 py-2 rounded-xl text-sm font-semibold"
            style={{ background: "var(--wc-accent-saffron, #F4A261)", color: "#fff" }}
          >
            ← Back to World Cup
          </Link>
        </div>
      )}
      {list.length > 0 && (
        <div className="mb-10">
          <h2
            className="text-lg font-bold mb-4"
            style={{ color: "#EFE3CE", fontFamily: "'Libre Baskerville', Georgia, serif" }}
          >
            Recipes from {nation.cuisine} Cuisine
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {list.map((recipe) => (
              <Link
                key={recipe.id}
                href={`/recipes/${recipe.id}`}
                className="flex flex-col rounded-2xl overflow-hidden"
                style={{ border: `1px solid ${confColor}40`, background: "#0F0A06" }}
              >
                {recipe.image_url && (
                  <img
                    src={recipe.image_url}
                    alt={recipe.title}
                    className="w-full rounded-xl object-cover"
                    style={{ height: 80 }}
                  />
                )}
                <p
                  className="text-xs font-semibold px-3 py-2 leading-tight"
                  style={{ color: "#EFE3CE" }}
                >
                  {recipe.title}
                </p>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Back link */}
      <Link
        href="/cuisines/world-cup-2026"
        className="inline-flex items-center gap-2 text-sm font-medium hover:underline"
        style={{ color: confColor }}
      >
        <ArrowLeft className="w-4 h-4" />
        Back to World Cup 2026
      </Link>
    </div>
  );
}
