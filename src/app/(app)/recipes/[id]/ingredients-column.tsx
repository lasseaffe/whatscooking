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
      <div className="wc-panel wc-panel--sm overflow-hidden">
        {/* Premium gradient header */}
        <div
          className="px-5 py-4"
          style={{
            background: "linear-gradient(135deg, var(--rc-bg, #1F1B19) 0%, var(--rc-surface, #2C2724) 100%)",
            borderBottom: "1px solid var(--rc-rim, #3A3430)",
          }}
        >
          <div className="flex items-center gap-2 mb-1.5">
            <div className="w-6 h-6 rounded-lg flex items-center justify-center"
              style={{ background: "rgba(201,168,76,0.18)" }}>
              <Sparkles style={{ width: 13, height: 13, color: "var(--rc-accent, #F4A261)" }} />
            </div>
            <span className="wc-section-label" style={{ color: "var(--rc-accent, #F4A261)" }}>
              Premium Recipe
            </span>
          </div>
          <p className="wc-text-sm leading-snug" style={{ color: "var(--rc-meta, #A08060)" }}>
            Ingredients will be reconstructed by AI from the original source.
          </p>
        </div>

        <div className="px-5 py-4 flex flex-col gap-3">
          <button
            onClick={handleExtract}
            disabled={extracting}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl wc-text-sm font-bold disabled:opacity-60 transition-all hover:opacity-90"
            style={{ background: "linear-gradient(135deg, var(--rc-accent-alt, #E85D20), var(--rc-accent, #F4A261))", color: "#fff" }}
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
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl wc-text-sm font-semibold transition-all hover:opacity-80"
              style={{ background: "var(--rc-badge-bg, #2A1808)", color: "var(--rc-meta, #A08060)", border: "1px solid var(--rc-rim, #3A3430)" }}
            >
              <ExternalLink style={{ width: 14, height: 14 }} />
              View original source
            </a>
          )}

          {error && (
            <p className="wc-text-xs text-center" style={{ color: "#ef4444" }}>{error}</p>
          )}

          <p className="wc-text-xs text-center leading-relaxed" style={{ color: "var(--rc-sub, #6B4E36)" }}>
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
      style={{ background: "var(--rc-bg, #1F1B19)", border: "1px dashed var(--rc-rim, #3A3430)" }}
    >
      <Utensils style={{ width: 28, height: 28, margin: "0 auto 12px", color: "var(--rc-sub, #6B4E36)" }} />
      <p className="wc-text-sm font-medium mb-1" style={{ color: "var(--rc-meta, #A08060)" }}>Ingredients not extracted yet</p>
      {sourceUrl && (
        <a
          href={sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="wc-text-xs underline hover:opacity-80"
          style={{ color: "var(--rc-accent, #F4A261)" }}
        >
          View original recipe →
        </a>
      )}
    </div>
  );
}
