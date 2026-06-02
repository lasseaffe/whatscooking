"use client";

// Ingredients panel for the recipe page HEADER (right column, image-left F-shape).
// Reuses the interactive ingredient pieces from recipe-columns-client and reads
// shared servings / unit / ingredients state from RecipeStateProvider, so it stays
// in sync with the instructions/phase runner rendered below.

import { Utensils } from "lucide-react";
import { useRecipeState } from "./recipe-state-context";
import {
  InteractiveIngredients,
  ServingControl,
  UnitToggle,
  CookThisButton,
} from "./recipe-columns-client";
import { IngredientsColumn } from "./ingredients-column";

type PantryItem = { id: string; name: string; quantity?: string | null };

interface RecipeIngredientsPanelProps {
  recipeId: string;
  sourceUrl: string | null;
  isPremium: boolean;
  pantryItems: PantryItem[];
  recipeTitle: string;
}

export function RecipeIngredientsPanel({
  recipeId,
  sourceUrl,
  isPremium,
  pantryItems,
  recipeTitle,
}: RecipeIngredientsPanelProps) {
  const {
    ingredients,
    unitSystem,
    setUnitSystem,
    servings,
    setServings,
    base,
    multiplier,
    applyExtracted,
  } = useRecipeState();

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{ background: "rgba(22,16,10,0.55)", border: "1px solid rgba(58,36,22,0.5)" }}
    >
      <div className="p-5">
        {/* Panel header */}
        <div className="flex items-center gap-2 mb-3">
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: "rgba(42,24,8,0.7)", border: "1px solid rgba(90,50,20,0.4)" }}
          >
            <Utensils style={{ width: 15, height: 15, color: "var(--wc-pal-accent, #B07D56)" }} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-bold uppercase tracking-widest" style={{ color: "#A8845E" }}>
              Phase II
            </div>
            <div
              className="text-base font-bold"
              style={{ color: "var(--wc-text, #EFE3CE)", fontFamily: "'Libre Baskerville', Georgia, serif" }}
            >
              Ingredients
            </div>
          </div>
          <UnitToggle value={unitSystem} onChange={setUnitSystem} />
        </div>

        {/* Serving size multiplier */}
        <div className="flex items-center gap-2 mb-3 pl-10">
          <span className="text-xs font-semibold" style={{ color: "#A8845E" }}>
            Servings
          </span>
          <ServingControl base={base} current={servings} onChange={setServings} />
          {multiplier !== 1 && (
            <span
              className="text-xs font-semibold tabular-nums"
              style={{ color: "rgba(176,125,86,0.55)" }}
            >
              ×{parseFloat(multiplier.toFixed(2))}
            </span>
          )}
        </div>

        {ingredients.length > 0 ? (
          <>
            <CookThisButton ingredients={ingredients} />
            <InteractiveIngredients
              ingredients={ingredients}
              unitSystem={unitSystem}
              multiplier={multiplier}
              pantryItems={pantryItems}
              recipeTitle={recipeTitle}
            />
          </>
        ) : (
          <IngredientsColumn
            recipeId={recipeId}
            initialIngredients={ingredients}
            sourceUrl={sourceUrl}
            isPremium={isPremium}
            onExtracted={applyExtracted}
            pantryItems={pantryItems}
          />
        )}
      </div>
    </div>
  );
}
