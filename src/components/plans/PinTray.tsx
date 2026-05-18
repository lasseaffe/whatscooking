'use client';

import { RecipeImage } from '@/components/recipe-image';
import type { Pin } from '@/app/(app)/plans/[id]/use-planner-state';

interface Props {
  pins: Pin[];
  durationDays: number;
  mealsPerDay: number;
  onRemove: (recipe_id: string) => void;
  onWeave: () => void;
  weaving: boolean;
}

export function PinTray({ pins, durationDays, mealsPerDay, onRemove, onWeave, weaving }: Props) {
  if (pins.length === 0) return null;
  const slotCount = durationDays * mealsPerDay;
  const qualityMin = Math.ceil(slotCount / 3);
  const ready = pins.length >= 3;
  const quality: 'low' | 'med' | 'high' = pins.length >= qualityMin ? 'high' : pins.length >= 3 ? 'med' : 'low';

  return (
    <div
      className="sticky bottom-0 z-20 -mx-4 px-4 py-3 flex items-center gap-3 backdrop-blur-md"
      style={{ background: 'rgba(26,18,10,0.92)', borderTop: '1px solid #2A1F14' }}
    >
      <span className="text-sm font-semibold" style={{ color: '#E67E22' }}>
        📌 {pins.length} pinned
      </span>
      <div className="flex gap-1 overflow-x-auto flex-1">
        {pins.map(p => (
          <button
            key={p.id}
            onClick={() => onRemove(p.recipe_id)}
            className="relative w-10 h-10 rounded overflow-hidden shrink-0 group"
            title={`Remove ${p.recipe.title}`}
            style={{ background: '#2A1F14' }}
          >
            <RecipeImage
              recipeId={p.recipe.id}
              imageUrl={p.recipe.image_url}
              title={p.recipe.title}
              focal_x={p.recipe.focal_x}
              focal_y={p.recipe.focal_y}
              className="w-full h-full"
            />
            <span className="absolute inset-0 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity" style={{ background: 'rgba(0,0,0,0.6)' }}>×</span>
          </button>
        ))}
      </div>
      <div className="flex flex-col items-end gap-1">
        {!ready && (
          <span className="text-xs" style={{ color: '#6B4E36' }}>Pin 3+ to weave</span>
        )}
        {ready && quality !== 'high' && (
          <span className="text-xs" style={{ color: '#8A6A4A' }}>App will pick a lot — add more pins to shape the week</span>
        )}
        <button
          disabled={!ready || weaving}
          onClick={onWeave}
          className="px-4 py-2 rounded-full text-sm font-semibold transition-opacity disabled:opacity-40"
          style={{ background: '#E67E22', color: '#1A120A' }}
        >
          {weaving ? 'Weaving…' : 'Weave the week →'}
        </button>
      </div>
    </div>
  );
}
