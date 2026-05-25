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

  const SERIF = "var(--font-fraunces, 'Libre Baskerville', Georgia, serif)";
  const hint = !ready
    ? 'Pin 3+ to weave'
    : quality !== 'high'
      ? 'A strong start — pin a few more to shape the week'
      : 'Enough for a strong week';

  return (
    <div
      className="sticky z-20 flex items-center gap-4 px-5 py-3.5 rounded-2xl"
      style={{
        bottom: 18,
        background: 'linear-gradient(180deg,rgba(28,20,13,0.96),rgba(21,16,11,0.97))',
        border: '1px solid #3A2A1B',
        backdropFilter: 'blur(8px)',
        boxShadow: '0 18px 50px rgba(0,0,0,0.55)',
      }}
    >
      <div className="flex items-center gap-3 min-w-0">
        <span style={{ fontSize: 17 }}>📌</span>
        <div className="flex gap-0.5 overflow-hidden">
          {pins.slice(0, 6).map(p => (
            <button
              key={p.id}
              onClick={() => onRemove(p.recipe_id)}
              className="relative rounded-lg overflow-hidden shrink-0 group"
              title={`Remove ${p.recipe.title}`}
              style={{ width: 34, height: 34, background: '#241A11', marginLeft: -6, border: '2px solid #15100B' }}
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
        <span className="hidden sm:block" style={{ fontFamily: SERIF, fontSize: 15, color: '#EFE3CE' }}>
          <span style={{ color: '#E67E22' }}>{pins.length}</span> pinned · <span style={{ color: '#9A7E5E' }}>{hint}</span>
        </span>
      </div>
      <button
        disabled={!ready || weaving}
        onClick={onWeave}
        className="ml-auto shrink-0 font-bold text-[15px] rounded-xl transition-opacity disabled:opacity-40"
        style={{ padding: '13px 26px', background: '#E67E22', color: '#0C0907' }}
      >
        {weaving ? 'Weaving…' : 'Weave my week →'}
      </button>
    </div>
  );
}
