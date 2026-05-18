// src/lib/weave-solver/__tests__/scoring.test.ts
import { describe, it, expect } from 'vitest';
import { effortFit, dietMatch, antiRepeatFit, totalCookMinutes } from '../scoring';
import type { SolverRecipe } from '../types';

const r = (over: Partial<SolverRecipe> = {}): SolverRecipe => ({
  id: 'r1', title: 't', image_url: null, cuisine_type: null,
  dietary_tags: [], dish_types: [], prep_time_minutes: 10, cook_time_minutes: 20,
  calories: null, protein_g: null, carbs_g: null, fat_g: null,
  batch_friendly: false, pantry_match: 0, inspiration_match: 0,
  ...over,
});

describe('totalCookMinutes', () => {
  it('sums prep + cook, treats null as 0', () => {
    expect(totalCookMinutes(r({ prep_time_minutes: 10, cook_time_minutes: 20 }))).toBe(30);
    expect(totalCookMinutes(r({ prep_time_minutes: null, cook_time_minutes: 15 }))).toBe(15);
  });
});

describe('effortFit', () => {
  it('1.0 when under budget', () => {
    expect(effortFit(r({ prep_time_minutes: 10, cook_time_minutes: 10 }), 30)).toBe(1);
  });
  it('0 when more than 2× budget', () => {
    expect(effortFit(r({ prep_time_minutes: 30, cook_time_minutes: 40 }), 30)).toBe(0);
  });
  it('linearly degrades between 1× and 2× budget', () => {
    // 45 min vs budget 30 → ratio 1.5 → score 0.5
    expect(effortFit(r({ prep_time_minutes: 15, cook_time_minutes: 30 }), 30)).toBeCloseTo(0.5);
  });
});

describe('dietMatch', () => {
  it('1.0 when no diet required', () => {
    expect(dietMatch(r({ dietary_tags: [] }), [])).toBe(1);
  });
  it('1.0 when all required tags present', () => {
    expect(dietMatch(r({ dietary_tags: ['vegan', 'gluten-free'] }), ['vegan'])).toBe(1);
  });
  it('0 when any required tag missing', () => {
    expect(dietMatch(r({ dietary_tags: ['vegetarian'] }), ['vegan'])).toBe(0);
  });
});

describe('antiRepeatFit', () => {
  it('1.0 with strength=off regardless of neighbors', () => {
    const recent = [r({ cuisine_type: 'italian', dish_types: ['pasta'] })];
    expect(antiRepeatFit(r({ cuisine_type: 'italian' }), recent, 'off')).toBe(1);
  });
  it('lowers score when same cuisine appears in the previous day', () => {
    const recent = [r({ cuisine_type: 'italian' })];
    expect(antiRepeatFit(r({ cuisine_type: 'italian' }), recent, 'moderate')).toBeLessThan(1);
  });
  it('strict drops to 0 on same cuisine adjacent day', () => {
    const recent = [r({ cuisine_type: 'italian' })];
    expect(antiRepeatFit(r({ cuisine_type: 'italian' }), recent, 'strict')).toBe(0);
  });
  it('full score when no overlap', () => {
    const recent = [r({ cuisine_type: 'thai' })];
    expect(antiRepeatFit(r({ cuisine_type: 'italian' }), recent, 'strict')).toBe(1);
  });
});
