"use client";

import { useState } from "react";
import Link from "next/link";
import { Heart, X, ChefHat } from "lucide-react";

interface Recipe {
  id: string;
  title: string;
  description?: string | null;
  image_url?: string | null;
  cuisine_type?: string | null;
  prep_time_minutes?: number | null;
  cook_time_minutes?: number | null;
  calories?: number | null;
}

export function SwipeSection({ recipes }: { recipes: Recipe[] }) {
  const [index, setIndex] = useState(0);
  const [saved, setSaved] = useState<string[]>([]);

  if (index >= recipes.length) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <span className="text-5xl">🎉</span>
        <p className="text-base font-bold" style={{ color: "var(--wc-text, #EFE3CE)" }}>You&apos;ve seen them all!</p>
        <button
          onClick={() => setIndex(0)}
          className="px-4 py-2 rounded-xl text-sm font-semibold"
          style={{ background: "var(--wc-accent-saffron, #F4A261)", color: "#1C0E04" }}
        >
          Start over
        </button>
        {saved.length > 0 && (
          <p className="text-xs" style={{ color: "#7A5A40" }}>You liked {saved.length} recipe{saved.length !== 1 ? "s" : ""}</p>
        )}
      </div>
    );
  }

  const recipe = recipes[index];
  const totalTime = (recipe.prep_time_minutes ?? 0) + (recipe.cook_time_minutes ?? 0);

  return (
    <div className="flex flex-col items-center gap-4 max-w-sm mx-auto">
      <p className="text-xs self-start font-semibold" style={{ color: "#7A5A40" }}>
        {index + 1} / {recipes.length}
      </p>
      <div className="w-full rounded-3xl overflow-hidden relative" style={{ height: 420 }}>
        {recipe.image_url ? (
          <img src={recipe.image_url} alt={recipe.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center" style={{ background: "var(--wc-surface-1, #2C2724)" }}>
            <ChefHat style={{ width: 48, height: 48, color: "#3A2416", opacity: 0.4 }} />
          </div>
        )}
        <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(12,6,2,0.92) 0%, rgba(0,0,0,0.1) 55%, transparent 100%)" }} />
        <div className="absolute bottom-0 left-0 right-0 p-5">
          {recipe.cuisine_type && (
            <p className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: "#C8522A" }}>{recipe.cuisine_type}</p>
          )}
          <h3 className="text-xl font-bold mb-1 leading-snug" style={{ color: "#EFE3CE", fontFamily: "'Libre Baskerville', Georgia, serif" }}>
            {recipe.title}
          </h3>
          <div className="flex items-center gap-3 text-xs" style={{ color: "#8A6A4A" }}>
            {totalTime > 0 && <span>⏱ {totalTime} min</span>}
            {recipe.calories && <span>🔥 {recipe.calories} kcal</span>}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <button
          onClick={() => setIndex((v) => v + 1)}
          className="w-14 h-14 rounded-full flex items-center justify-center shadow-lg"
          style={{ background: "rgba(200,82,42,0.15)", border: "2px solid rgba(200,82,42,0.4)" }}
          aria-label="Skip"
        >
          <X style={{ width: 22, height: 22, color: "#C8522A" }} />
        </button>
        <Link
          href={`/recipes/${recipe.id}`}
          className="px-5 py-2.5 rounded-2xl text-sm font-semibold"
          style={{ background: "var(--wc-surface-1, #2C2724)", color: "var(--fg-primary, #EFE3CE)", border: "1px solid rgba(255,255,255,0.08)" }}
        >
          View recipe
        </Link>
        <button
          onClick={() => { setSaved((v) => [...v, recipe.id]); setIndex((i) => i + 1); }}
          className="w-14 h-14 rounded-full flex items-center justify-center shadow-lg"
          style={{ background: "rgba(130,142,111,0.15)", border: "2px solid rgba(130,142,111,0.4)" }}
          aria-label="Save"
        >
          <Heart style={{ width: 22, height: 22, color: "#828E6F" }} />
        </button>
      </div>
    </div>
  );
}
