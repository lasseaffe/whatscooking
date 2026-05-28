'use client';

import { useEffect, useState } from 'react';
import { RecipeImage } from '@/components/recipe-image';
import { buildMatchBadges } from '@/lib/recipe-match-badges';
import type { Pin, PinboardFilters } from '@/app/(app)/plans/[id]/use-planner-state';

interface Props {
  planId: string;
  filters: PinboardFilters;
  pins: Pin[];
  onTogglePin: (recipe_id: string) => void;
  onOpenTune?: () => void;
}

const SERIF = "var(--font-fraunces, 'Libre Baskerville', Georgia, serif)";
const MONO = "var(--font-geist-mono, ui-monospace, monospace)";

const CATEGORIES = [
  { label: 'Breakfast', mealType: 'breakfast' },
  { label: 'Lunch',     mealType: 'lunch'     },
  { label: 'Dinner',    mealType: 'dinner'    },
] as const;

export function PinboardFeed({ planId, filters, pins, onTogglePin, onOpenTune }: Props) {
  const [byCategory, setByCategory] = useState<Record<string, any[]>>({
    breakfast: [], lunch: [], dinner: [],
  });
  const [loading, setLoading] = useState(false);
  const [squad, setSquad] = useState<{ dislike: string[] } | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/household/squad-preferences')
      .then(r => r.ok ? r.json() : { dislike: [] })
      .then((d: { dislike?: string[] }) => {
        if (!cancelled) setSquad({ dislike: d.dislike ?? [] });
      })
      .catch(() => { if (!cancelled) setSquad({ dislike: [] }); });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    const fetchCat = (mealType: string) => {
      const params = new URLSearchParams();
      params.set('plan_id', planId);
      params.set('meal_type', mealType);
      params.set('limit', '8');
      if (filters.pantry_aware) {
        params.set('pantry_aware', '1');
        params.set('pantry_missing_max', String(filters.pantry_missing_max));
      }
      if (filters.inspiration_tags.length > 0) {
        params.set('inspiration_tags', filters.inspiration_tags.join(','));
      }
      if (filters.squad_aware) params.set('squad_aware', '1');
      return fetch(`/api/recipes/picker?${params}`)
        .then(r => r.ok ? r.json() : { recipes: [] })
        .then(d => ({ mealType, recipes: d.recipes ?? [] }));
    };

    Promise.all(CATEGORIES.map(c => fetchCat(c.mealType)))
      .then(results => {
        if (cancelled) return;
        const next: Record<string, any[]> = {};
        for (const { mealType, recipes } of results) next[mealType] = recipes;
        setByCategory(next);
      })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [planId, filters.pantry_aware, filters.pantry_missing_max, filters.inspiration_tags, filters.squad_aware]);

  const pinnedIds = new Set(pins.map(p => p.recipe_id));

  if (loading && Object.values(byCategory).every(c => c.length === 0)) {
    return (
      <div className="flex items-center justify-center gap-2 py-12 text-sm" style={{ color: '#9A7E5E', fontFamily: MONO }}>
        <span className="inline-block w-3 h-3 rounded-full animate-pulse" style={{ background: '#E67E22' }} />
        Gathering recipes…
      </div>
    );
  }

  const sections = CATEGORIES.map(c => ({ ...c, recipes: byCategory[c.mealType] ?? [] }));
  const filled = sections.filter(s => s.recipes.length > 0);
  const empty = sections.filter(s => s.recipes.length === 0);
  const allEmpty = filled.length === 0;

  // Whole feed empty — one warm, branded nudge (never three stacked blocks)
  if (allEmpty) {
    return (
      <div
        className="flex flex-col items-center text-center gap-3 py-12 px-6 rounded-2xl"
        style={{ background: 'rgba(28,20,13,0.5)', border: '1px dashed #3A2A1B' }}
      >
        <span style={{ fontSize: 30 }}>🍽️</span>
        <p style={{ fontFamily: SERIF, fontStyle: 'italic', fontSize: 19, color: '#EFE3CE' }}>
          Nothing matches these filters yet.
        </p>
        <p className="text-sm max-w-xs" style={{ color: '#9A7E5E' }}>
          Your constraints are a little tight — loosen the time limit or a diet rule and the library will fill back up.
        </p>
        {onOpenTune && (
          <button
            onClick={onOpenTune}
            className="mt-1 text-sm font-semibold px-4 py-2 rounded-full transition-colors"
            style={{ background: '#E67E22', color: '#0C0907' }}
          >
            Adjust your filters →
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-7">
      {filled.map(({ label, mealType, recipes }) => (
        <div key={mealType}>
          <div className="flex items-baseline gap-2 mb-3">
            <h4 style={{ fontFamily: SERIF, fontSize: 18, fontWeight: 600, color: '#EFE3CE' }}>{label}</h4>
            <span style={{ fontFamily: MONO, fontSize: 11, color: '#6E573D' }}>{recipes.length} ideas</span>
          </div>
          <div
            className="flex gap-4 overflow-x-auto pb-2"
            style={{ scrollSnapType: 'x mandatory', WebkitOverflowScrolling: 'touch' }}
          >
            {recipes.map(r => {
              const pinned = pinnedIds.has(r.id);
              const badges = buildMatchBadges(r, filters, squad ?? undefined).slice(0, 2);
              return (
                <div
                  key={r.id}
                  className="flex flex-col rounded-2xl overflow-hidden shrink-0 transition-all"
                  style={{
                    width: 200,
                    background: '#15100B',
                    border: `1px solid ${pinned ? '#E67E22' : '#2A1E13'}`,
                    scrollSnapAlign: 'start',
                  }}
                >
                  <div className="relative overflow-hidden" style={{ height: 132, background: '#241A11' }}>
                    <RecipeImage
                      recipeId={r.id}
                      imageUrl={r.image_url}
                      title={r.title}
                      focal_x={r.focal_x}
                      focal_y={r.focal_y}
                      className="w-full h-full"
                    />
                    <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg,transparent 45%,rgba(12,9,7,0.78))' }} />
                    {badges.length > 0 && (
                      <div className="absolute left-2.5 bottom-2.5 flex flex-wrap gap-1.5">
                        {badges.map((b: { label: string }, i: number) => (
                          <span
                            key={i}
                            style={{
                              fontFamily: MONO, fontSize: 10, letterSpacing: '0.03em',
                              background: 'rgba(12,9,7,0.8)', border: '1px solid rgba(255,255,255,0.18)',
                              color: '#EFE3CE', padding: '3px 7px', borderRadius: 6, backdropFilter: 'blur(4px)',
                            }}
                          >
                            {b.label}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col gap-1 p-3.5 flex-1">
                    <p style={{ fontFamily: SERIF, fontSize: 16, fontWeight: 600, lineHeight: 1.25, color: '#EFE3CE' }} className="line-clamp-2">
                      {r.title}
                    </p>
                    <button
                      onClick={() => onTogglePin(r.id)}
                      className="mt-3 w-full text-sm font-semibold rounded-xl transition-colors"
                      style={{
                        padding: '9px',
                        background: pinned ? '#E67E22' : 'transparent',
                        border: '1px solid #E67E22',
                        color: pinned ? '#0C0907' : '#E67E22',
                      }}
                    >
                      {pinned ? '✓ Pinned' : '＋ Pin'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {/* one small inline nudge for any empty meal types — never a stacked wall */}
      {empty.length > 0 && (
        <div
          className="flex items-center gap-3 px-5 py-4 rounded-2xl"
          style={{ background: 'rgba(28,20,13,0.4)', border: '1px dashed #3A2A1B' }}
        >
          <span style={{ fontSize: 16 }}>✨</span>
          <p className="text-sm flex-1" style={{ color: '#9A7E5E' }}>
            Nothing new for{' '}
            <span style={{ fontFamily: SERIF, fontStyle: 'italic', color: '#EFE3CE' }}>
              {empty.map(e => e.label.toLowerCase()).join(' & ')}
            </span>{' '}
            under your filters.
          </p>
          {onOpenTune && (
            <button
              onClick={onOpenTune}
              className="shrink-0 text-xs font-medium px-3 py-2 rounded-lg transition-colors"
              style={{ fontFamily: MONO, color: '#E67E22', border: '1px solid #3A2A1B', background: 'transparent' }}
            >
              Loosen filters →
            </button>
          )}
        </div>
      )}
    </div>
  );
}
