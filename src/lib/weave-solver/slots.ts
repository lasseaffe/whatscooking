// src/lib/weave-solver/slots.ts
import type { MealType, SolverConstraints } from './types';

export interface Slot {
  day_number: number;
  meal_type: MealType;
  is_weekend: boolean;
}

export function isWeekend(d: Date): boolean {
  const day = d.getDay(); // 0 = Sun, 6 = Sat
  return day === 0 || day === 6;
}

export function buildSlots(input: {
  duration_days: number;
  meal_types: MealType[];
  week_start: string | null;
}): Slot[] {
  const baseDate = input.week_start ? new Date(input.week_start) : null;
  const slots: Slot[] = [];
  for (let day = 1; day <= input.duration_days; day++) {
    let weekend = false;
    if (baseDate) {
      const d = new Date(baseDate);
      d.setDate(d.getDate() + day - 1);
      weekend = isWeekend(d);
    }
    for (const mt of input.meal_types) {
      slots.push({ day_number: day, meal_type: mt, is_weekend: weekend });
    }
  }
  return slots;
}

export function dayBudget(is_weekend: boolean, c: Pick<SolverConstraints, 'time_weeknight_max' | 'time_weekend_max'>): number {
  return is_weekend ? c.time_weekend_max : c.time_weeknight_max;
}
