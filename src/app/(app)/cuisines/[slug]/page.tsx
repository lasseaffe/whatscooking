import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCuisineBySlug } from "@/lib/cuisines";
import { RecipeCard } from "@/components/recipe-card";
import { ArrowLeft, UtensilsCrossed } from "lucide-react";
import type { Recipe } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function CuisineDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const cuisine = getCuisineBySlug(slug);
  if (!cuisine) notFound();

  const supabase = await createClient();

  // Fetch recipes matching any of the cuisine's dbValues
  const orFilter = cuisine.dbValues
    .map((v) => `cuisine_type.ilike.${v}`)
    .join(",");

  const { data: recipes } = await supabase
    .from("recipes")
    .select("*")
    .or(orFilter)
    .order("created_at", { ascending: false })
    .limit(60);

  const list = (recipes ?? []) as Recipe[];

  return (
    <div>
      {/* Hero */}
      <div className="px-6 py-8 pb-0 max-w-5xl mx-auto">
        <Link href="/cuisines"
          className="inline-flex items-center gap-1.5 text-xs mb-6 hover:underline"
          style={{ color: "#A69180" }}>
          <ArrowLeft className="w-3.5 h-3.5" />
          All cuisines
        </Link>

        <div className="rounded-2xl overflow-hidden mb-8" style={{ border: `1px solid #F0E8DC` }}>
          {/* Photo hero */}
          <div className="relative h-52 overflow-hidden">
            <img src={cuisine.heroImage} alt={`${cuisine.name} cuisine`}
              className="w-full h-full object-cover" />
            <div className="absolute inset-0"
              style={{ background: "linear-gradient(to top, rgba(20,10,4,0.80) 0%, rgba(0,0,0,0.2) 60%, transparent 100%)" }} />
            <div className="absolute top-0 left-0 right-0 h-1" style={{ background: cuisine.color }} />
            <div className="absolute bottom-0 left-0 right-0 px-6 pb-5">
              <h1 className="text-3xl font-bold text-white drop-shadow-sm mb-1">
                {cuisine.name} Cuisine
              </h1>
              <p className="text-sm font-semibold italic" style={{ color: "rgba(255,255,255,0.75)" }}>
                &ldquo;{cuisine.tagline}&rdquo;
              </p>
            </div>
          </div>
          <div className="p-6" style={{ background: cuisine.bg }}>
            <p className="text-sm leading-relaxed mb-4" style={{ color: "#6B5B52" }}>
              {cuisine.description}
            </p>
            <div className="flex flex-wrap gap-2">
              {cuisine.keyDishes.map((dish) => (
                <span key={dish}
                  className="text-xs px-3 py-1 rounded-full font-medium"
                  style={{ background: `${cuisine.color}15`, color: cuisine.color }}>
                  {dish}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Recipes */}
      <div className="px-6 pb-12 max-w-5xl mx-auto">
        <div className="flex items-center gap-2 mb-5">
          <UtensilsCrossed className="w-4 h-4" style={{ color: "#C85A2F" }} />
          <h2 className="text-base font-bold" style={{ color: "#3D2817" }}>
            {list.length > 0 ? `${list.length} recipe${list.length !== 1 ? "s" : ""}` : "Recipes"}
          </h2>
          {list.length === 0 && (
            <span className="text-xs px-2 py-0.5 rounded-full"
              style={{ background: "#FFF0E6", color: "#C85A2F" }}>
              Coming soon
            </span>
          )}
        </div>

        {list.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {list.map((r) => (
              <RecipeCard key={r.id} recipe={r} />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border p-12 text-center"
            style={{ borderColor: "#F5E6D3", borderStyle: "dashed" }}>
            <p className="text-sm" style={{ color: "#6B5B52" }}>
              No {cuisine.name} recipes added yet. Check back soon!
            </p>
            <Link href="/discover"
              className="inline-block mt-4 px-4 py-2 rounded-xl text-sm font-medium"
              style={{ background: "#C85A2F", color: "#fff" }}>
              Browse all recipes
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
