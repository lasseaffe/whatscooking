'use client';

import { useEffect, useRef, useState } from 'react';
import { aggregateMacro, aggregateByDay, formatMacro, type MacroField, type RecipeMacros } from '@/lib/plans/macros';
import type { ProposedEntry } from '@/lib/weave-solver';

type RecipeRow = Partial<RecipeMacros> & { id: string; macros_estimated?: boolean | null };

interface Props {
  entries: ProposedEntry[];
  recipes: Record<string, RecipeRow>;
  nutritionalGoals?: Record<string, number>;
  // tracking gate — any one true unlocks accordion
  trackingEnabled: boolean; // (goals non-empty) || plan.track_intake || profile.track_intake
  // person count
  personCount: number;
  onPersonCountChange: (n: number) => void;
  // lifted state — WeaveSection owns this so WeaveGrid can react
  selectedField: MacroField | null;
  onFieldSelect: (field: MacroField | null) => void;
  planId: string;
}

const FIELDS: Array<{ key: MacroField; label: string; unit: string; color: string; goalKey: string }> = [
  { key: 'calories',  label: 'Energy',  unit: 'kcal', color: '#E67E22', goalKey: 'calories' },
  { key: 'protein_g', label: 'Protein', unit: 'g',    color: '#AEB873', goalKey: 'protein_g' },
  { key: 'carbs_g',   label: 'Carbs',   unit: 'g',    color: '#E0B85A', goalKey: 'carbs_g' },
  { key: 'fat_g',     label: 'Fat',     unit: 'g',    color: '#C8522A', goalKey: 'fat_g' },
];

function useLazyEstimator(recipes: Record<string, RecipeRow>) {
  const [estimated, setEstimated] = useState<Record<string, Partial<RecipeMacros>>>({});
  const recipeKey = Object.keys(recipes).sort().join(',');

  useEffect(() => {
    const missing = Object.values(recipes)
      .filter(r => !r.macros_estimated && (r.calories == null || r.protein_g == null))
      .slice(0, 12);
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

export function MacroSummary({
  entries, recipes, nutritionalGoals,
  trackingEnabled, personCount, onPersonCountChange,
  selectedField, onFieldSelect, planId,
}: Props) {
  const estimated = useLazyEstimator(recipes);
  const patchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => { if (patchTimer.current) clearTimeout(patchTimer.current); };
  }, []);

  // Merge estimated macros into real values
  const merged: Record<string, Partial<RecipeMacros>> = {};
  for (const id of Object.keys(recipes)) {
    merged[id] = { ...estimated[id], ...recipes[id] };
    const real = recipes[id];
    const est = estimated[id];
    if (est) {
      const m = merged[id];
      for (const k of ['calories', 'protein_g', 'carbs_g', 'fat_g', 'fiber_g', 'sugar_g', 'sat_fat_g', 'sodium_mg'] as const) {
        if (real?.[k] == null && est[k] != null) m[k] = est[k];
      }
    }
  }

  const durationDays = entries.length > 0 ? Math.max(...entries.map(e => e.day_number), 1) : 1;
  const MONO = "var(--font-geist-mono, ui-monospace, monospace)";
  const SERIF = "var(--font-fraunces, 'Libre Baskerville', Georgia, serif)";

  const cal = aggregateMacro(entries, merged, 'calories');

  // Persist person count with debounce
  const handlePersonCount = (n: number) => {
    const clamped = Math.max(1, Math.min(20, n));
    onPersonCountChange(clamped);
    if (patchTimer.current) clearTimeout(patchTimer.current);
    patchTimer.current = setTimeout(() => {
      fetch(`/api/plans/${planId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ person_count: clamped }),
      }).catch(() => {/* silent */});
    }, 800);
  };

  const toggleField = (field: MacroField) => {
    if (!trackingEnabled) return;
    onFieldSelect(selectedField === field ? null : field);
  };

  return (
    <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid #2A1E13' }}>
      {/* Header row */}
      <div className="flex items-center justify-between px-5 pt-4 pb-3 gap-4 flex-wrap">
        <h3 style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.16em', textTransform: 'uppercase', color: '#6E573D' }}>
          Week macros — per person
        </h3>

        {/* Person count stepper */}
        <div className="flex items-center gap-2">
          <span style={{ fontFamily: MONO, fontSize: 10, color: '#6E573D' }}>Cooking for</span>
          <button
            onClick={() => handlePersonCount(personCount - 1)}
            aria-label="Decrease person count"
            className="w-5 h-5 rounded-full flex items-center justify-center text-xs transition-colors"
            style={{ background: '#2A1E13', color: '#9A7E5E', border: '1px solid #3A2A1A' }}
          >−</button>
          <span style={{ fontFamily: MONO, fontSize: 12, color: '#EFE3CE', minWidth: 24, textAlign: 'center' }}>
            {personCount}
          </span>
          <button
            onClick={() => handlePersonCount(personCount + 1)}
            aria-label="Increase person count"
            className="w-5 h-5 rounded-full flex items-center justify-center text-xs transition-colors"
            style={{ background: '#2A1E13', color: '#9A7E5E', border: '1px solid #3A2A1A' }}
          >+</button>
        </div>

        <span style={{ fontFamily: MONO, fontSize: 10, color: '#AEB873' }}>
          ✓ {cal.known_slots}/{cal.total_slots} cook days have macros known
        </span>
      </div>

      {/* 4 macro cards */}
      <div className="grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', gap: 1, background: '#2A1E13' }}>
        {FIELDS.map((f) => {
          const agg = aggregateMacro(entries, merged, f.key);
          const total = personCount > 0 ? agg.total / personCount : agg.total;
          const fmt = formatMacro({ ...agg, total }, f.unit);
          const goalPerDay = nutritionalGoals?.[f.goalKey];
          const goal = goalPerDay && goalPerDay > 0 ? (goalPerDay / personCount) * durationDays : null;
          const pct = goal && goal > 0 ? Math.min(1, total / goal) : 0.7;
          const num = fmt.display.replace(f.unit.trim(), '').trim();
          const isSelected = selectedField === f.key;

          return (
            <button
              key={f.key}
              onClick={() => toggleField(f.key)}
              disabled={!trackingEnabled}
              tabIndex={trackingEnabled ? 0 : -1}
              {...(trackingEnabled ? { 'aria-pressed': isSelected } : {})}
              aria-label={`${f.label}: ${num} ${f.unit}${trackingEnabled ? (isSelected ? ', expanded' : ', click to expand') : ''}`}
              className="px-5 py-4 text-left transition-colors w-full"
              style={{
                background: isSelected ? '#1C150E' : '#15100B',
                cursor: trackingEnabled ? 'pointer' : 'default',
                outline: isSelected ? `1px solid ${f.color}40` : 'none',
              }}
            >
              <div className="flex items-center justify-between">
                <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#6E573D' }}>
                  {f.label}
                </div>
                {trackingEnabled && (
                  <span style={{ color: f.color, fontSize: 10, opacity: 0.7 }}>{isSelected ? '▴' : '▾'}</span>
                )}
              </div>
              <div style={{ fontFamily: SERIF, fontSize: 28, fontWeight: 600, color: fmt.em ? '#6E573D' : '#EFE3CE', marginTop: 6, letterSpacing: '-0.01em', lineHeight: 1 }}>
                {num}
                <span style={{ fontFamily: MONO, fontSize: 12, color: '#9A7E5E', fontWeight: 400, marginLeft: 3 }}>{f.unit}</span>
                {fmt.tilde && <span style={{ fontFamily: MONO, fontSize: 11, color: '#6E573D', marginLeft: 6 }}>~</span>}
              </div>
              <div className="rounded-full overflow-hidden" style={{ height: 4, background: '#241A11', marginTop: 12 }}>
                <span className="block h-full rounded-full" style={{ width: `${pct * 100}%`, background: f.color }} />
              </div>
            </button>
          );
        })}
      </div>

      {/* Accordion — per-day breakdown for selectedField */}
      {trackingEnabled && selectedField && (() => {
        const field = FIELDS.find(f => f.key === selectedField)!;
        const byDay = aggregateByDay(entries, merged, selectedField);
        const dayNums = Array.from({ length: durationDays }, (_, i) => i + 1);
        const maxVal = Math.max(...dayNums.map(d => (byDay[d]?.total ?? 0) / personCount), 1);

        return (
          <div style={{ background: '#15100B', borderTop: `1px solid ${field.color}30`, padding: '12px 20px 16px' }}>
            <div style={{ fontFamily: MONO, fontSize: 9, letterSpacing: '0.16em', textTransform: 'uppercase', color: field.color, marginBottom: 10 }}>
              {field.label} — {field.unit} per person per day
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {dayNums.map(day => {
                const agg = byDay[day];
                const val = agg ? agg.total / personCount : null;
                const pct = val != null ? val / maxVal : 0;
                return (
                  <div key={day} style={{ display: 'grid', gridTemplateColumns: '28px 1fr 44px', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontFamily: MONO, fontSize: 9, color: '#6E573D', textAlign: 'right' }}>D{day}</span>
                    <div style={{ height: 6, background: '#241A11', borderRadius: 3, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${pct * 100}%`, background: field.color, borderRadius: 3, transition: 'width 0.3s ease' }} />
                    </div>
                    <span style={{ fontFamily: MONO, fontSize: 10, fontWeight: 600, color: val != null ? '#EFE3CE' : '#3A2A1A' }}>
                      {val != null ? `${Math.round(val)}${field.unit}` : '—'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })()}
    </div>
  );
}
