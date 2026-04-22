"use client";

import { useState } from "react";
import Link from "next/link";
import { Heart, ChevronDown, ChevronUp, Clock, Flame } from "lucide-react";

interface SavedRecipe {
  id: string;
  title: string;
  image_url: string | null;
  dietary_tags: string[] | null;
  prep_time_minutes: number | null;
  cook_time_minutes: number | null;
  calories: number | null;
  cuisine_type: string | null;
}

interface Props {
  savedRecipes: SavedRecipe[];
  planDietaryFilters: string[];
}

export function SavedRecipeFit({ savedRecipes, planDietaryFilters }: Props) {
  const [show, setShow] = useState(true);

  if (savedRecipes.length === 0) return null;

  // Score each saved recipe by how well it matches the plan's dietary filters
  const scored = savedRecipes
    .map((r) => {
      const tags = r.dietary_tags ?? [];
      const overlap = planDietaryFilters.filter((f) => tags.includes(f)).length;
      // If plan has no dietary filters, everything is a "match"
      const score = planDietaryFilters.length === 0 ? 1 : overlap;
      return { recipe: r, score, overlap };
    })
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 8);

  if (scored.length === 0) return null;

  return (
    <div className="mt-8 rounded-2xl border overflow-hidden" style={{ borderColor: "#FFD4C2" }}>
      {/* Toggle header */}
      <button
        onClick={() => setShow((v) => !v)}
        className="w-full flex items-center gap-3 px-5 py-4 text-left transition-all"
        style={{ background: "#FFF5F0" }}
      >
        <Heart className="w-4 h-4 shrink-0" style={{ color: "#C85A2F" }} fill="#C85A2F" />
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm" style={{ color: "#3D2817" }}>
              Your Saved Recipes That Fit This Plan
            </span>
            <span className="text-xs px-2 py-0.5 rounded-full"
              style={{ background: "#FFE4D6", color: "#C85A2F" }}>
              {scored.length} match{scored.length !== 1 ? "es" : ""}
            </span>
          </div>
          <p className="text-xs mt-0.5" style={{ color: "#A69180" }}>
            {planDietaryFilters.length > 0
              ? `Recipes from your saves matching: ${planDietaryFilters.join(", ")}`
              : "From your saved recipe collection"}
          </p>
        </div>
        <div className="shrink-0 w-7 h-7 rounded-full flex items-center justify-center"
          style={{ background: "#FFE4D6" }}>
          {show
            ? <ChevronUp className="w-4 h-4" style={{ color: "#C85A2F" }} />
            : <ChevronDown className="w-4 h-4" style={{ color: "#C85A2F" }} />}
        </div>
      </button>

      {show && (
        <div className="p-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3"
          style={{ background: "#FFFAF8" }}>
          {scored.map(({ recipe, score }) => {
            const totalTime = (recipe.prep_time_minutes ?? 0) + (recipe.cook_time_minutes ?? 0);
            const isPerfect = planDietaryFilters.length > 0 && score === planDietaryFilters.length;
            return (
              <Link key={recipe.id} href={`/recipes/${recipe.id}`}
                className="group rounded-xl border overflow-hidden transition-all hover:-translate-y-0.5 hover:shadow-md"
                style={{ borderColor: "#F5E6D3", background: "#fff" }}>
                <div className="relative h-28 overflow-hidden">
                  {recipe.image_url ? (
                    <img src={recipe.image_url} alt={recipe.title}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center"
                      style={{ background: "#FFF0E6" }}>
                      <Heart className="w-6 h-6" style={{ color: "#C85A2F", opacity: 0.3 }} />
                    </div>
                  )}
                  {isPerfect && (
                    <div className="absolute top-2 left-2 px-1.5 py-0.5 rounded text-xs font-bold"
                      style={{ background: "#C85A2F", color: "#fff" }}>
                      ✓ Perfect fit
                    </div>
                  )}
                </div>
                <div className="p-2.5">
                  <p className="text-xs font-semibold leading-snug line-clamp-2 mb-1.5"
                    style={{ color: "#3D2817" }}>
                    {recipe.title}
                  </p>
                  <div className="flex items-center gap-2 text-xs flex-wrap" style={{ color: "#A69180" }}>
                    {totalTime > 0 && (
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />{totalTime}m
                      </span>
                    )}
                    {recipe.calories && (
                      <span className="flex items-center gap-1">
                        <Flame className="w-3 h-3" />{recipe.calories}
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
