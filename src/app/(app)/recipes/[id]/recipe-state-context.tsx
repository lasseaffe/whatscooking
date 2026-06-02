"use client";

// Shared recipe state for the detail page. Lets the header ingredients panel
// and the body instructions/phase runner share servings, unit system, and the
// (possibly AI-extracted) ingredients/instructions arrays without desyncing.

import { createContext, useContext, useState, type ReactNode } from "react";

export type UnitSystem = "metric" | "imperial";
export type Ingredient = { name: string; amount?: number | null; unit?: string | null };

interface RecipeStateValue {
  ingredients: Ingredient[];
  setIngredients: (i: Ingredient[]) => void;
  instructions: string[];
  setInstructions: (s: string[]) => void;
  unitSystem: UnitSystem;
  setUnitSystem: (u: UnitSystem) => void;
  servings: number;
  setServings: (n: number) => void;
  /** Original serving count the recipe was authored for. */
  base: number;
  /** servings / base — scale factor for amounts. */
  multiplier: number;
  /** Apply an AI-extracted recipe payload (premium recipes). Updates both arrays. */
  applyExtracted: (recipe: Record<string, unknown>) => void;
}

const RecipeStateContext = createContext<RecipeStateValue | null>(null);

export function RecipeStateProvider({
  children,
  initialIngredients,
  initialInstructions,
  baseServings,
}: {
  children: ReactNode;
  initialIngredients: Ingredient[];
  initialInstructions: string[];
  baseServings?: number | null;
}) {
  const [ingredients, setIngredients] = useState<Ingredient[]>(initialIngredients);
  const [instructions, setInstructions] = useState<string[]>(initialInstructions);
  const [unitSystem, setUnitSystem] = useState<UnitSystem>("metric");
  const base = baseServings ?? 4;
  const [servings, setServings] = useState(base);
  const multiplier = base > 0 ? servings / base : 1;

  function applyExtracted(recipe: Record<string, unknown>) {
    if (Array.isArray(recipe.ingredients) && recipe.ingredients.length > 0) {
      setIngredients(recipe.ingredients as Ingredient[]);
    }
    if (Array.isArray(recipe.instructions) && recipe.instructions.length > 0) {
      setInstructions(recipe.instructions as string[]);
    }
  }

  return (
    <RecipeStateContext.Provider
      value={{
        ingredients,
        setIngredients,
        instructions,
        setInstructions,
        unitSystem,
        setUnitSystem,
        servings,
        setServings,
        base,
        multiplier,
        applyExtracted,
      }}
    >
      {children}
    </RecipeStateContext.Provider>
  );
}

export function useRecipeState(): RecipeStateValue {
  const ctx = useContext(RecipeStateContext);
  if (!ctx) {
    throw new Error("useRecipeState must be used within a RecipeStateProvider");
  }
  return ctx;
}
