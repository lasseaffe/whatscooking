'use client';

/**
 * Placeholder stub — full implementation lives in Phase C (Task C.5).
 * Kept here so plan-builder.tsx typechecks while the new vertical-stack
 * shell is wired up in Phases A/B. Replace with the real WeaveSection
 * (constraint-aware picker + grid + summary) in Phase C.
 */

import type { usePlannerState } from '@/app/(app)/plans/[id]/use-planner-state';

interface Props {
  state: ReturnType<typeof usePlannerState>;
  planId: string;
  durationDays: number;
  weekStart: string | null;
  mealsPerDay: number;
}

export function WeaveSection(_props: Props) {
  return (
    <section
      aria-label="Weave (coming in Phase C)"
      className="rounded-lg border p-6 text-sm"
      style={{ borderColor: '#3A2A1A', background: '#1A120A', color: '#6B4E36' }}
    >
      Weave grid arrives in Phase C.
    </section>
  );
}
