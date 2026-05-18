import type { ProposedEntry } from '@/lib/weave-solver';

export interface MacroAggregate {
  total: number;
  known_slots: number;
  partial_slots: number;   // entries that had at least one null in their macro panel
  total_slots: number;
}

export type MacroField = 'calories' | 'protein_g' | 'carbs_g' | 'fat_g' | 'fiber_g' | 'sugar_g' | 'sat_fat_g' | 'sodium_mg';

export interface RecipeMacros {
  id: string;
  calories: number | null;
  protein_g: number | null;
  carbs_g: number | null;
  fat_g: number | null;
  fiber_g: number | null;
  sugar_g: number | null;
  sat_fat_g: number | null;
  sodium_mg: number | null;
}

export function aggregateMacro(
  entries: ProposedEntry[],
  recipes: Record<string, Partial<RecipeMacros>>,
  field: MacroField,
): MacroAggregate {
  let total = 0;
  let known = 0;
  let total_slots = 0;
  for (const e of entries) {
    if (e.is_leftover) continue;       // count cook days only
    total_slots += 1;
    const r = recipes[e.recipe_id];
    const val = r?.[field];
    if (typeof val === 'number' && Number.isFinite(val)) {
      total += val;
      known += 1;
    }
  }
  return { total, known_slots: known, partial_slots: 0, total_slots };
}

export function formatMacro(agg: MacroAggregate, unit: string): { display: string; tilde: boolean; em: boolean } {
  if (agg.known_slots === 0) return { display: '—', tilde: false, em: true };
  const rounded = Math.round(agg.total);
  const tilde = agg.known_slots < agg.total_slots;
  return { display: `${tilde ? '~' : ''}${rounded}${unit}`, tilde, em: false };
}
