'use client';

import { Pinboard } from '@/components/plans/Pinboard';
import { WeaveSection } from '@/components/plans/WeaveSection';
import { usePlannerState, type PlanStatus, type PinboardFilters } from './use-planner-state';
import { SetBgMode } from '@/components/set-bg-mode';

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
  personCount: number;
  trackingEnabled: boolean;
}

export function PlanBuilder(props: PlanBuilderProps) {
  const state = usePlannerState(props.planId, props.status, props.pinboardFilters);

  const woven = !!state.weave;
  const statusLabel = woven ? 'Woven' : state.status === 'planning' ? 'Planning' : state.status;
  const statusStyle = woven
    ? { background: 'rgba(224,184,90,0.10)', color: '#E0B85A', borderColor: 'rgba(224,184,90,0.35)' }
    : { background: 'rgba(174,184,115,0.12)', color: '#AEB873', borderColor: 'rgba(174,184,115,0.3)' };

  return (
    <div className="flex flex-col gap-6 px-4 py-6 max-w-6xl mx-auto">
      <SetBgMode mode="plan" />
      <header className="flex items-baseline justify-between gap-4">
        <div>
          <h1 style={{ fontFamily: "var(--font-fraunces, 'Libre Baskerville', Georgia, serif)", fontSize: 30, fontWeight: 600, letterSpacing: '-0.02em', color: '#EFE3CE' }}>
            {props.planTitle}
          </h1>
          <p style={{ fontFamily: "var(--font-geist-mono, ui-monospace, monospace)", fontSize: 12.5, color: '#9A7E5E', marginTop: 2 }}>
            {props.durationDays} days · {props.mealsPerDay} meals/day
            {woven ? ' · woven' : ' · pinning'}
          </p>
        </div>
        <span
          className="px-3 py-1 rounded-full border"
          style={{ fontFamily: "var(--font-geist-mono, ui-monospace, monospace)", fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', ...statusStyle }}
        >
          {statusLabel}
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
        personCount={props.personCount}
        trackingEnabled={props.trackingEnabled}
      />
    </div>
  );
}
