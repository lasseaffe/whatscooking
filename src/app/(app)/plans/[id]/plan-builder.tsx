'use client';

import { Pinboard } from '@/components/plans/Pinboard';
import { WeaveSection } from '@/components/plans/WeaveSection';
import { usePlannerState, type PlanStatus, type PinboardFilters } from './use-planner-state';

// Backward-compat type re-exports for files still importing BuilderEntry /
// MealType while Phase C swaps the legacy grid/list views out. The new builder
// no longer uses these shapes internally.
export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack' | 'dessert';

export interface BuilderEntry {
  clientId: string;
  dbId?: string;
  recipe_id?: string | null;
  day_number: number;
  meal_type: MealType;
  recipe_title: string;
  description?: string;
  calories?: number | null;
  protein_g?: number | null;
  carbs_g?: number | null;
  fat_g?: number | null;
  position: number;
  isEditing: boolean;
  from_database?: boolean;
}

export interface PlanBuilderProps {
  planId: string;
  planTitle: string;
  durationDays: number;
  weekStart: string | null;
  mealsPerDay: number;
  status: PlanStatus;
  pinboardFilters: Partial<PinboardFilters>;
  nutritionalGoals?: Record<string, number>;
}

export function PlanBuilder(props: PlanBuilderProps) {
  const state = usePlannerState(props.planId, props.status, props.pinboardFilters);

  return (
    <div className="flex flex-col gap-8 px-4 py-6 max-w-6xl mx-auto">
      <header className="flex items-baseline justify-between gap-4">
        <div>
          <h1 className="text-2xl font-serif" style={{ color: '#EFE3CE' }}>{props.planTitle}</h1>
          <p className="text-sm" style={{ color: '#6B4E36' }}>
            {props.durationDays} days · {props.mealsPerDay} meals/day
          </p>
        </div>
        <span
          className="px-3 py-1 rounded-full text-xs uppercase tracking-wider border"
          style={{ borderColor: '#3A2A1A', color: '#E67E22' }}
        >
          {state.status}
        </span>
      </header>

      <Pinboard
        state={state}
        planId={props.planId}
        durationDays={props.durationDays}
        mealsPerDay={props.mealsPerDay}
      />

      <WeaveSection
        state={state}
        planId={props.planId}
        durationDays={props.durationDays}
        weekStart={props.weekStart}
        mealsPerDay={props.mealsPerDay}
        nutritionalGoals={props.nutritionalGoals}
      />
    </div>
  );
}
