'use client';

import { useEffect, useState } from 'react';
import { aggregateMacro, formatMacro, type RecipeMacros } from '@/lib/plans/macros';
import type { ProposedEntry } from '@/lib/weave-solver';

type RecipeRow = Partial<RecipeMacros> & { id: string; macros_estimated?: boolean | null };

interface Props {
  entries: ProposedEntry[];
  recipes: Record<string, RecipeRow>;
  nutritionalGoals?: Record<string, number>;
}

const FIELDS: Array<{ key: 'calories' | 'protein_g' | 'carbs_g' | 'fat_g'; icon: string; label: string; unit: string; goalKey: string }> = [
  { key: 'calories', icon: '⚡', label: 'Energy', unit: ' kcal', goalKey: 'calories' },
  { key: 'protein_g', icon: '🥩', label: 'Protein', unit: 'g', goalKey: 'protein_g' },
  { key: 'carbs_g', icon: '🌾', label: 'Carbs', unit: 'g', goalKey: 'carbs_g' },
  { key: 'fat_g', icon: '🥑', label: 'Fat', unit: 'g', goalKey: 'fat_g' },
];

function useLazyEstimator(recipes: Record<string, RecipeRow>) {
  const [estimated, setEstimated] = useState<Record<string, Partial<RecipeMacros>>>({});
  const recipeKey = Object.keys(recipes).sort().join(',');

  useEffect(() => {
    const missing = Object.values(recipes)
      .filter(r => !r.macros_estimated && (r.calories == null || r.protein_g == null))
      .slice(0, 12); // cap so we don't fan out forever
    if (missing.length === 0) return;

    let cancelled = false;
    const queue = [...missing];
    const workers = Array.from({ length: 6 }, async () => {
      while (queue.length > 0 && !cancelled) {
        const r = queue.shift()!;
        try {
          const res = await fetch(`/api/recipes/${r.id}/estimate-macros`, { method: 'POST' });
          if (!res.ok) continue;
          const d = await res.json();
          if (cancelled || !d.macros) continue;
          setEstimated(prev => ({ ...prev, [r.id]: d.macros }));
        } catch { /* swallow */ }
      }
    });
    void Promise.all(workers);
    return () => { cancelled = true; };
  }, [recipeKey]); // eslint-disable-line react-hooks/exhaustive-deps

  return estimated;
}

export function MacroSummary({ entries, recipes, nutritionalGoals }: Props) {
  const estimated = useLazyEstimator(recipes);

  // Merge: real values take precedence, estimated fills gaps
  const merged: Record<string, Partial<RecipeMacros>> = {};
  for (const id of Object.keys(recipes)) {
    merged[id] = { ...estimated[id], ...recipes[id] };
    // If real value is null but estimated has it, use estimated
    const real = recipes[id];
    const est = estimated[id];
    if (est) {
      const m = merged[id];
      for (const k of ['calories', 'protein_g', 'carbs_g', 'fat_g', 'fiber_g', 'sugar_g', 'sat_fat_g', 'sodium_mg'] as const) {
        if ((real?.[k] == null) && est[k] != null) {
          m[k] = est[k];
        }
      }
    }
  }

  const durationDays = entries.length > 0 ? Math.max(...entries.map(e => e.day_number), 1) : 1;

  return (
    <div className="flex flex-col gap-1 px-4 py-3 rounded-lg border" style={{ background: '#1A120A', borderColor: '#3A2A1A' }}>
      <div className="flex items-center justify-between mb-1">
        <h3 className="text-xs uppercase tracking-wider" style={{ color: '#6B4E36' }}>Week macros</h3>
      </div>
      {FIELDS.map(f => {
        const agg = aggregateMacro(entries, merged, f.key);
        const fmt = formatMacro(agg, f.unit);
        const goalPerDay = nutritionalGoals?.[f.goalKey];
        const goal = goalPerDay && goalPerDay > 0 ? goalPerDay * durationDays : null;
        const pct = goal && goal > 0 ? Math.min(1, agg.total / goal) : null;
        return (
          <div key={f.key} className="flex items-center gap-3 text-sm py-0.5">
            <span style={{ color: '#8A6A4A' }}>{f.icon}</span>
            <span className="w-16" style={{ color: '#8A6A4A' }}>{f.label}</span>
            <span className="font-mono" style={{ color: fmt.em ? '#6B4E36' : '#EFE3CE' }}>{fmt.display}</span>
            {goal && (
              <span className="ml-auto flex items-center gap-2">
                <span className="text-xs" style={{ color: '#6B4E36' }}>{Math.round(goal)}{f.unit}</span>
                {pct != null && (
                  <span className="w-20 h-1.5 rounded overflow-hidden" style={{ background: '#2A1F14' }}>
                    <span className="block h-full" style={{ width: `${pct * 100}%`, background: '#E67E22' }} />
                  </span>
                )}
              </span>
            )}
            {fmt.tilde && (
              <span className="text-xs italic" style={{ color: '#6B4E36' }}>partial</span>
            )}
          </div>
        );
      })}
      <div className="mt-1 text-xs" style={{ color: '#6B4E36' }}>
        {(() => {
          const cal = aggregateMacro(entries, merged, 'calories');
          return `${cal.known_slots}/${cal.total_slots} cook days have macros known`;
        })()}
      </div>
    </div>
  );
}
