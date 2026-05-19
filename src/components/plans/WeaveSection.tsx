'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { WeaveSummary } from './WeaveSummary';
import { WeaveGrid } from './WeaveGrid';
import { ConstraintPicker } from './ConstraintPicker';
import { RecipeDetailModal, type DetailRecipe } from './RecipeDetailModal';
import { MacroSummary } from './MacroSummary';
import type { usePlannerState } from '@/app/(app)/plans/[id]/use-planner-state';
import type { MealType, ProposedEntry } from '@/lib/weave-solver';
import type { SolverRecipe } from '@/lib/weave-solver/types';
import { computeTension } from '@/lib/weave-solver/tension';

interface Props {
  state: ReturnType<typeof usePlannerState>;
  planId: string;
  durationDays: number;
  weekStart: string | null;
  mealsPerDay: number;
  nutritionalGoals?: Record<string, number>;
}

function defaultMealTypes(meals_per_day: number): MealType[] {
  if (meals_per_day <= 1) return ['dinner'];
  if (meals_per_day === 2) return ['lunch', 'dinner'];
  if (meals_per_day === 3) return ['breakfast', 'lunch', 'dinner'];
  return ['breakfast', 'lunch', 'dinner', 'snack'];
}

interface PickerRecipe {
  id: string;
  title: string;
  image_url: string | null;
  focal_x?: number | null;
  focal_y?: number | null;
}

export function WeaveSection({ state, planId, durationDays, weekStart, mealsPerDay, nutritionalGoals }: Props) {
  const router = useRouter();
  const [picker, setPicker] = useState<{ day: number; mealType: MealType; existing: ProposedEntry | null } | null>(null);
  const [detailRecipe, setDetailRecipe] = useState<DetailRecipe | null>(null);
  const mealTypes = defaultMealTypes(mealsPerDay);

  if (!state.weave) {
    return (
      <section aria-label="Weave" className="flex flex-col gap-3 py-8 text-center">
        <p className="text-sm" style={{ color: '#6B4E36' }}>
          Pin recipes above, then weave them into a week.
        </p>
      </section>
    );
  }

  // Build recipe meta lookup from pins + weave response
  const recipes: Record<string, { image_url: string | null; focal_x?: number | null; focal_y?: number | null }> = {};
  for (const p of state.pins) {
    recipes[p.recipe.id] = {
      image_url: p.recipe.image_url,
      focal_x: p.recipe.focal_x,
      focal_y: p.recipe.focal_y,
    };
  }
  for (const r of state.weave.recipes ?? []) {
    if (!recipes[r.id]) {
      recipes[r.id] = { image_url: r.image_url, focal_x: r.focal_x, focal_y: r.focal_y };
    }
  }

  // Build macros lookup: combine pin recipe data with weave response macros
  const macrosLookup: Record<string, {
    id: string;
    calories: number | null;
    protein_g: number | null;
    carbs_g: number | null;
    fat_g: number | null;
    fiber_g: number | null;
    sugar_g: number | null;
    sat_fat_g: number | null;
    sodium_mg: number | null;
    macros_estimated: boolean | null;
  }> = {};
  for (const p of state.pins) {
    macrosLookup[p.recipe.id] = {
      id: p.recipe.id,
      calories: p.recipe.calories,
      protein_g: p.recipe.protein_g,
      carbs_g: p.recipe.carbs_g,
      fat_g: p.recipe.fat_g,
      fiber_g: null,
      sugar_g: null,
      sat_fat_g: null,
      sodium_mg: null,
      macros_estimated: null,
    };
  }
  for (const r of state.weave.recipes ?? []) {
    macrosLookup[r.id] = {
      id: r.id,
      calories: r.calories,
      protein_g: r.protein_g,
      carbs_g: r.carbs_g,
      fat_g: r.fat_g,
      fiber_g: r.fiber_g,
      sugar_g: r.sugar_g,
      sat_fat_g: r.sat_fat_g,
      sodium_mg: r.sodium_mg,
      macros_estimated: r.macros_estimated,
    };
  }

  // Build solver pool for tension + neighbor-hint computations.
  const solverPool = new Map<string, SolverRecipe>();
  for (const p of state.pins) {
    solverPool.set(p.recipe.id, {
      id: p.recipe.id,
      title: p.recipe.title,
      image_url: p.recipe.image_url,
      cuisine_type: p.recipe.cuisine_type,
      dietary_tags: p.recipe.dietary_tags ?? [],
      dish_types: [],
      prep_time_minutes: p.recipe.prep_time_minutes,
      cook_time_minutes: p.recipe.cook_time_minutes,
      calories: p.recipe.calories,
      protein_g: p.recipe.protein_g,
      carbs_g: p.recipe.carbs_g,
      fat_g: p.recipe.fat_g,
      batch_friendly: p.recipe.batch_friendly,
      pantry_match: 0,
      inspiration_match: 0,
    });
  }
  for (const r of state.weave.recipes ?? []) {
    if (!solverPool.has(r.id)) {
      solverPool.set(r.id, {
        id: r.id,
        title: '',
        image_url: r.image_url ?? null,
        cuisine_type: r.cuisine_type ?? null,
        dietary_tags: [],
        dish_types: r.dish_types ?? [],
        prep_time_minutes: r.prep_time_minutes,
        cook_time_minutes: r.cook_time_minutes,
        calories: r.calories,
        protein_g: r.protein_g,
        carbs_g: r.carbs_g,
        fat_g: r.fat_g,
        batch_friendly: false,
        pantry_match: 0,
        inspiration_match: 0,
      });
    }
  }

  // Plan 5 D.1 — feed pantry_match from weave response into density ribbon.
  const pantryPctByRecipeId: Record<string, number> = {};
  for (const r of state.weave.recipes ?? []) {
    if (typeof r.pantry_match === 'number') {
      pantryPctByRecipeId[r.id] = r.pantry_match;
    }
  }

  const tension = computeTension(state.weave.entries, solverPool);
  const conflictsByClientid: Record<string, string[]> = {};
  for (const c of tension.conflicts) {
    (conflictsByClientid[c.clientid_a] ??= []).push(c.reason);
    (conflictsByClientid[c.clientid_b] ??= []).push(c.reason);
  }

  // Compute neighbor hints for a slot (used by smart-swap picker).
  const CLIENT_PROTEINS = ['chicken', 'beef', 'pork', 'lamb', 'salmon', 'tuna', 'shrimp', 'tofu', 'lentil', 'chickpea', 'duck', 'turkey'];
  const detectProteinTitle = (title: string): string | null => {
    const t = (title ?? '').toLowerCase();
    for (const k of CLIENT_PROTEINS) if (t.includes(k)) return k;
    return null;
  };
  const computeNeighborHints = (slot: { day: number; mealType: MealType }) => {
    const avoidCuisines = new Set<string>();
    const avoidProteins = new Set<string>();
    const avoidDishTypes = new Set<string>();
    for (const e of state.weave?.entries ?? []) {
      if (Math.abs(e.day_number - slot.day) !== 1) continue;
      if (e.meal_type !== slot.mealType) continue;
      const r = solverPool.get(e.recipe_id);
      if (!r) continue;
      if (r.cuisine_type) avoidCuisines.add(r.cuisine_type);
      for (const d of r.dish_types) avoidDishTypes.add(d);
      const p = detectProteinTitle(r.title || e.recipe_title);
      if (p) avoidProteins.add(p);
    }
    return {
      avoidCuisines: [...avoidCuisines],
      avoidProteins: [...avoidProteins],
      avoidDishTypes: [...avoidDishTypes],
    };
  };

  const onCellTap = (day: number, mealType: MealType, entry: ProposedEntry | null) => {
    if (entry) {
      const r = solverPool.get(entry.recipe_id);
      setDetailRecipe({
        id: entry.recipe_id,
        title: entry.recipe_title ?? r?.title ?? '',
        image_url: recipes[entry.recipe_id]?.image_url ?? null,
        focal_x: recipes[entry.recipe_id]?.focal_x,
        focal_y: recipes[entry.recipe_id]?.focal_y,
        cuisine_type: r?.cuisine_type ?? null,
        dish_types: r?.dish_types ?? [],
        dietary_tags: r?.dietary_tags ?? [],
        prep_time_minutes: r?.prep_time_minutes ?? null,
        cook_time_minutes: r?.cook_time_minutes ?? null,
        calories: r?.calories ?? null,
      });
    } else {
      setPicker({ day, mealType, existing: null });
    }
  };

  const onPick = (recipe: PickerRecipe) => {
    if (!picker) return;
    if (picker.existing) {
      state.swapEntry(picker.existing.clientid, { recipe_id: recipe.id, recipe_title: recipe.title });
    }
    // Note: insertion into an empty cell is deferred to a future polish pass.
    setPicker(null);
  };

  const suggestOne = async (): Promise<PickerRecipe | null> => {
    if (!picker) return null;
    const params = new URLSearchParams({ plan_id: planId, meal_type: picker.mealType, limit: '1' });
    const exclude = state.weave?.entries
      .filter(e => e.clientid !== picker.existing?.clientid)
      .map(e => e.recipe_id) ?? [];
    if (exclude.length) params.set('exclude_recipe_ids', exclude.join(','));
    const r = await fetch(`/api/recipes/picker?${params}`);
    if (!r.ok) return null;
    const d = await r.json();
    return d.recipes?.[0] ?? null;
  };

  return (
    <section aria-label="Weave" className="flex flex-col gap-3">
      <WeaveSummary
        summary={state.weave.summary}
        weaving={state.loading}
        canUndo={state.canUndo}
        onReweave={() => state.runWeave({ seed: Date.now() & 0xffff, persistUndo: true })}
        onUndo={state.undoWeave}
        onStartCooking={() => router.push(`/plans/${planId}/cook`)}
      />
      <MacroSummary
        entries={state.weave.entries}
        recipes={macrosLookup}
        nutritionalGoals={nutritionalGoals}
      />
      <WeaveGrid
        entries={state.weave.entries}
        recipes={recipes}
        durationDays={durationDays}
        mealTypes={mealTypes}
        weekStart={weekStart}
        onCellTap={onCellTap}
        onCellRemove={state.removeEntry}
        onPinSuggestion={state.pinSuggestion}
        tensionByClientid={tension.byClientid}
        conflictsByClientid={conflictsByClientid}
        onSwapCells={state.swapEntriesByClientid}
        pantryPctByRecipeId={pantryPctByRecipeId}
      />
      {picker && (
        <ConstraintPicker
          planId={planId}
          mealType={picker.mealType}
          excludeRecipeIds={state.weave.entries
            .filter(e => e.clientid !== picker.existing?.clientid)
            .map(e => e.recipe_id)}
          onPick={onPick}
          onSuggestOne={suggestOne}
          onClose={() => setPicker(null)}
          neighborHints={computeNeighborHints({ day: picker.day, mealType: picker.mealType })}
        />
      )}
      <RecipeDetailModal
        recipe={detailRecipe}
        onClose={() => setDetailRecipe(null)}
      />
    </section>
  );
}
