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
}

const CATEGORIES = [
  { label: 'Breakfast', mealType: 'breakfast' },
  { label: 'Lunch',     mealType: 'lunch'     },
  { label: 'Dinner',    mealType: 'dinner'    },
] as const;

export function PinboardFeed({ planId, filters, pins, onTogglePin }: Props) {
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
    return <div className="py-8 text-center text-sm" style={{ color: '#6B4E36' }}>Loading recipes…</div>;
  }

  return (
    <div className="flex flex-col gap-5">
      {CATEGORIES.map(({ label, mealType }) => {
        const recipes = byCategory[mealType] ?? [];
        return (
          <div key={mealType}>
            <p className="text-xs uppercase tracking-wider mb-2 px-1" style={{ color: '#6B4E36' }}>
              {label}
            </p>
            {recipes.length === 0 ? (
              <p className="text-xs px-1" style={{ color: '#4A3020' }}>No matches — try different filters</p>
            ) : (
              <div
                className="flex gap-3 overflow-x-auto pb-2"
                style={{ scrollSnapType: 'x mandatory', WebkitOverflowScrolling: 'touch' }}
              >
                {recipes.map(r => {
                  const pinned = pinnedIds.has(r.id);
                  const badges = buildMatchBadges(r, filters, squad ?? undefined).slice(0, 2);
                  return (
                    <div
                      key={r.id}
                      className="flex flex-col rounded-lg border overflow-hidden shrink-0"
                      style={{
                        width: 120,
                        background: '#1A120A',
                        borderColor: pinned ? '#E67E22' : '#3A2A1A',
                        scrollSnapAlign: 'start',
                      }}
                    >
                      <div className="relative overflow-hidden" style={{ height: 88, background: '#2A1F14' }}>
                        <RecipeImage
                          recipeId={r.id}
                          imageUrl={r.image_url}
                          title={r.title}
                          focal_x={r.focal_x}
                          focal_y={r.focal_y}
                          className="w-full h-full"
                        />
                        {pinned && (
                          <span
                            className="absolute top-1 right-1 text-xs px-1 rounded"
                            style={{ background: '#E67E22', color: '#1A120A' }}
                          >
                            📌
                          </span>
                        )}
                      </div>
                      <div className="flex flex-col gap-1 p-2 flex-1">
                        <p className="text-xs font-medium line-clamp-2 leading-tight" style={{ color: '#EFE3CE' }}>
                          {r.title}
                        </p>
                        {badges.length > 0 && (
                          <div className="flex flex-wrap gap-0.5 mt-0.5">
                            {badges.map((b: { label: string }, i: number) => (
                              <span
                                key={i}
                                className="text-[10px] px-1 py-0.5 rounded leading-tight"
                                style={{ background: '#2A1F14', color: '#E67E22' }}
                              >
                                {b.label}
                              </span>
                            ))}
                          </div>
                        )}
                        <button
                          onClick={() => onTogglePin(r.id)}
                          className="mt-auto text-xs px-2 py-1 rounded-full border transition-colors"
                          style={{
                            background: pinned ? '#E67E22' : 'transparent',
                            borderColor: '#E67E22',
                            color: pinned ? '#1A120A' : '#E67E22',
                          }}
                        >
                          {pinned ? 'Pinned' : 'Pin'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
