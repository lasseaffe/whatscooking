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

export function PinboardFeed({ planId, filters, pins, onTogglePin }: Props) {
  const [recipes, setRecipes] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams();
    params.set('plan_id', planId);
    params.set('limit', '24');
    if (filters.pantry_aware) {
      params.set('pantry_aware', '1');
      params.set('pantry_missing_max', String(filters.pantry_missing_max));
    }
    if (filters.inspiration_tags.length > 0) {
      params.set('inspiration_tags', filters.inspiration_tags.join(','));
    }
    setLoading(true);
    fetch(`/api/recipes/picker?${params}`)
      .then(r => r.ok ? r.json() : { recipes: [] })
      .then(d => setRecipes(d.recipes ?? []))
      .finally(() => setLoading(false));
  }, [planId, filters.pantry_aware, filters.pantry_missing_max, filters.inspiration_tags]);

  const pinnedIds = new Set(pins.map(p => p.recipe_id));

  if (loading && recipes.length === 0) {
    return <div className="py-12 text-center text-sm" style={{ color: '#6B4E36' }}>Loading recipes…</div>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      {recipes.map(r => {
        const pinned = pinnedIds.has(r.id);
        const badges = buildMatchBadges(r, filters);
        return (
          <div
            key={r.id}
            className="flex gap-3 p-3 rounded-lg border"
            style={{ background: '#1A120A', borderColor: pinned ? '#E67E22' : '#3A2A1A' }}
          >
            <div className="relative w-24 h-24 rounded overflow-hidden shrink-0" style={{ background: '#2A1F14' }}>
              <RecipeImage
                recipeId={r.id}
                imageUrl={r.image_url}
                title={r.title}
                focal_x={r.focal_x}
                focal_y={r.focal_y}
                className="w-full h-full"
              />
            </div>
            <div className="flex-1 flex flex-col gap-1 min-w-0">
              <h3 className="text-sm font-semibold line-clamp-2" style={{ color: '#EFE3CE' }}>{r.title}</h3>
              <div className="flex flex-wrap gap-1">
                {badges.map((b, i) => (
                  <span
                    key={i}
                    className="text-xs px-1.5 py-0.5 rounded"
                    style={{ background: '#2A1F14', color: '#E67E22' }}
                  >
                    {b.label}
                  </span>
                ))}
              </div>
              <button
                onClick={() => onTogglePin(r.id)}
                className="mt-auto self-start text-xs px-3 py-1 rounded-full border transition-colors"
                style={{
                  background: pinned ? '#E67E22' : 'transparent',
                  borderColor: '#E67E22',
                  color: pinned ? '#1A120A' : '#E67E22',
                }}
              >
                {pinned ? '📌 Pinned' : 'Pin'}
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
