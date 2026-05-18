// src/lib/weave-solver/__tests__/slots.test.ts
import { describe, it, expect } from 'vitest';
import { buildSlots, isWeekend, dayBudget } from '../slots';

describe('buildSlots', () => {
  it('produces day × meal_type cross product', () => {
    const slots = buildSlots({
      duration_days: 3,
      meal_types: ['breakfast', 'dinner'],
      week_start: null,
    });
    expect(slots).toHaveLength(6);
    expect(slots[0]).toEqual({ day_number: 1, meal_type: 'breakfast', is_weekend: false });
    expect(slots[5]).toEqual({ day_number: 3, meal_type: 'dinner', is_weekend: false });
  });

  it('marks Sat/Sun as weekend when week_start is a Monday', () => {
    const slots = buildSlots({
      duration_days: 7,
      meal_types: ['dinner'],
      week_start: '2026-05-18', // Monday
    });
    expect(slots.map(s => s.is_weekend)).toEqual([false,false,false,false,false,true,true]);
  });
});

describe('isWeekend', () => {
  it('returns true for Sat/Sun', () => {
    expect(isWeekend(new Date('2026-05-23'))).toBe(true); // Sat
    expect(isWeekend(new Date('2026-05-24'))).toBe(true); // Sun
    expect(isWeekend(new Date('2026-05-19'))).toBe(false); // Tue
  });
});

describe('dayBudget', () => {
  it('returns weekend_max on weekends', () => {
    expect(dayBudget(true, { time_weeknight_max: 30, time_weekend_max: 120 } as any)).toBe(120);
  });
  it('returns weeknight_max otherwise', () => {
    expect(dayBudget(false, { time_weeknight_max: 30, time_weekend_max: 120 } as any)).toBe(30);
  });
});
