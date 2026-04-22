"use client";

import { useState } from "react";
import { Utensils, Sparkles, Loader2, ExternalLink } from "lucide-react";
import { AdaptedIngredients } from "./adapted-ingredients";

type Ingredient = { name: string; amount?: number | null; unit?: string | null };
type PantryItem = { id: string; name: string; quantity?: string | null };

interface Props {
  recipeId: string;
  initialIngredients: Ingredient[];
  sourceUrl: string | null;
  isPremium: boolean;
  onExtracted?: (recipe: Record<string, unknown>) => void;
  pantryItems?: PantryItem[];
}

export function IngredientsColumn({ recipeId, initialIngredients, sourceUrl, isPremium, onExtracted, pantryItems = [] }: Props) {
  const [ingredients, setIngredients] = useState<Ingredient[]>(initialIngredients);
  const [extracting, setExtracting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleExtract() {
    setExtracting(true);
    setError(null);
    try {
      const res = await fetch(`/api/recipes/${recipeId}/extract`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Extraction failed");
      const extracted = (data.recipe?.ingredients ?? []) as Ingredient[];
      if (extracted.length > 0) {
        setIngredients(extracted);
      }
      // Notify parent so instructions column also updates
      if (data.recipe) onExtracted?.(data.recipe);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Extraction failed");
    }
    setExtracting(false);
  }

  if (ingredients.length > 0) {
    return <AdaptedIngredients ingredients={ingredients} pantryItems={pantryItems} />;
  }

  // No ingredients yet — show extraction UI for premium recipes
  if (isPremium) {
    return (
      <div
        className="rounded-2xl overflow-hidden"
        style={{ border: "1px solid rgba(176,125,86,0.3)", background: "rgba(26,16,8,0.7)" }}
      >
        {/* Premium gradient header */}
        <div
          className="px-5 py-4"
          style={{ background: "linear-gradient(135deg, #1A1206 0%, #2E1D0A 60%, #3A2410 100%)", borderBottom: "1px solid rgba(176,125,86,0.2)" }}
        >
          <div className="flex items-center gap-2 mb-1.5">
            <div
              className="w-6 h-6 rounded-lg flex items-center justify-center"
              style={{ background: "rgba(201,168,76,0.2)" }}
            >
              <Sparkles style={{ width: 13, height: 13, color: "#C9A84C" }} />
            </div>
            <span className="text-xs font-bold uppercase tracking-wider" style={{ color: "#C9A84C" }}>
              Premium Recipe
            </span>
          </div>
          <p className="text-sm leading-snug" style={{ color: "rgba(239,227,206,0.75)" }}>
            Ingredients will be reconstructed by AI from the original source.
          </p>
        </div>

        <div className="px-5 py-4 flex flex-col gap-3">
          <button
            onClick={handleExtract}
            disabled={extracting}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold disabled:opacity-60 transition-all hover:opacity-90"
            style={{ background: "linear-gradient(135deg, #C8522A, #B07D56)", color: "#fff" }}
          >
            {extracting ? (
              <><Loader2 style={{ width: 15, height: 15 }} className="animate-spin" /> Extracting ingredients…</>
            ) : (
              <><Sparkles style={{ width: 15, height: 15 }} /> Extract ingredients with AI</>
            )}
          </button>

          {sourceUrl && (
            <a
              href={sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all hover:opacity-80"
              style={{ background: "rgba(42,24,8,0.6)", color: "#8A6A4A", border: "1px solid rgba(58,36,22,0.6)" }}
            >
              <ExternalLink style={{ width: 14, height: 14 }} />
              View original source
            </a>
          )}

          {error && (
            <p className="text-xs text-center" style={{ color: "#ef4444" }}>{error}</p>
          )}

          <p className="text-xs text-center leading-relaxed" style={{ color: "#4A3020" }}>
            AI reconstructs the ingredients from available recipe data and source information.
          </p>
        </div>
      </div>
    );
  }

  // Non-premium recipe with no ingredients
  return (
    <div
      className="rounded-xl p-6 text-center"
      style={{ background: "rgba(26,16,8,0.5)", border: "1px dashed rgba(42,24,8,0.7)" }}
    >
      <Utensils style={{ width: 28, height: 28, margin: "0 auto 12px", color: "#3A2416" }} />
      <p className="text-sm font-medium mb-1" style={{ color: "#6B4E36" }}>Ingredients not extracted yet</p>
      {sourceUrl && (
        <a
          href={sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs underline hover:opacity-80"
          style={{ color: "var(--wc-pal-accent, #B07D56)" }}
        >
          View original recipe →
        </a>
      )}
    </div>
  );
}
