'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { WeaveSummary } from './WeaveSummary';
import { WeaveGrid } from './WeaveGrid';
import { ConstraintPicker } from './ConstraintPicker';
import { MacroSummary } from './MacroSummary';
import type { usePlannerState } from '@/app/(app)/plans/[id]/use-planner-state';
import type { MealType, ProposedEntry } from '@/lib/weave-solver';

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

  const onCellTap = (day: number, mealType: MealType, entry: ProposedEntry | null) => {
    setPicker({ day, mealType, existing: entry });
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
        />
      )}
    </section>
  );
}
