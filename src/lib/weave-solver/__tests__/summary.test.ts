// src/lib/weave-solver/__tests__/summary.test.ts
import { describe, it, expect } from 'vitest';
import { computeSummary } from '../summary';
import type { ProposedEntry, SolverRecipe } from '../types';

const r = (id: string, over: Partial<SolverRecipe> = {}): SolverRecipe => ({
  id, title: id, image_url: null, cuisine_type: null,
  dietary_tags: [], dish_types: [], prep_time_minutes: 10, cook_time_minutes: 20,
  calories: null, protein_g: null, carbs_g: null, fat_g: null,
  batch_friendly: false, pantry_match: 0.5, inspiration_match: 0,
  ...over,
});

const e = (id: string, day: number, src: ProposedEntry['source'], is_leftover = false): ProposedEntry => ({
  clientid: `c${day}`, day_number: day, meal_type: 'dinner',
  recipe_id: id, recipe_title: id, source: src,
  is_leftover, parent_clientid: null, locked: src === 'pinned', position: 0,
});

describe('computeSummary', () => {
  it('reports slot counts and basic numbers', () => {
    const entries = [e('a', 1, 'pinned'), e('b', 2, 'suggestion')];
    const pool = new Map([['a', r('a', { pantry_match: 0.6 })], ['b', r('b', { pantry_match: 1.0 })]]);
    const s = computeSummary(entries, pool, 3);
    expect(s.slots_total).toBe(3);
    expect(s.slots_filled).toBe(2);
    expect(s.leftover_count).toBe(0);
    expect(s.pantry_pct).toBeCloseTo(0.8, 2); // mean of 0.6 and 1.0
    expect(s.active_minutes).toBe(60); // 2 entries × (10+20)
  });

  it('counts leftover entries but doesn\'t add their cook time', () => {
    const entries = [e('a', 1, 'pinned'), e('a', 2, 'pinned', true)];
    const pool = new Map([['a', r('a')]]);
    const s = computeSummary(entries, pool, 3);
    expect(s.leftover_count).toBe(1);
    expect(s.active_minutes).toBe(30); // only the cook day counts
  });

  it('variety_score is 1.0 when all entries have different cuisines', () => {
    const entries = [e('a', 1, 'pinned'), e('b', 2, 'pinned')];
    const pool = new Map([
      ['a', r('a', { cuisine_type: 'italian' })],
      ['b', r('b', { cuisine_type: 'thai' })],
    ]);
    expect(computeSummary(entries, pool, 2).variety_score).toBe(1);
  });

  it('variety_score is 0 when all entries are the same cuisine', () => {
    const entries = [e('a', 1, 'pinned'), e('b', 2, 'pinned')];
    const pool = new Map([
      ['a', r('a', { cuisine_type: 'italian' })],
      ['b', r('b', { cuisine_type: 'italian' })],
    ]);
    expect(computeSummary(entries, pool, 2).variety_score).toBe(0);
  });
});
