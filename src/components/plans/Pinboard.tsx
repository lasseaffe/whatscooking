'use client';

import { useEffect, useState } from 'react';
import { RecipeImage } from '@/components/recipe-image';
import { ConstraintChipBar } from './ConstraintChipBar';
import { InspirationChips } from './InspirationChips';
import { PinboardFeed } from './PinboardFeed';
import { PinTray } from './PinTray';
import { RecipeSearchBar } from './RecipeSearchBar';
import type { usePlannerState } from '@/app/(app)/plans/[id]/use-planner-state';

interface Props {
  state: ReturnType<typeof usePlannerState>;
  planId: string;
  durationDays: number;
  mealsPerDay: number;
}

export function Pinboard({ state, planId, durationDays, mealsPerDay }: Props) {
  const [open, setOpen] = useState(true);

  // Auto-collapse when the first weave lands
  useEffect(() => {
    if (state.weave) setOpen(false);
  // Only fire when weave transitions null → value
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [!!state.weave]);

  const togglePin = (recipe_id: string) => {
    const already = state.pins.find(p => p.recipe_id === recipe_id);
    if (already) state.removePin(recipe_id);
    else state.addPin(recipe_id);
  };

  const toggleInspiration = (id: string) => {
    const next = state.filters.inspiration_tags.includes(id)
      ? state.filters.inspiration_tags.filter(x => x !== id)
      : [...state.filters.inspiration_tags, id];
    state.setFilters({ inspiration_tags: next });
  };

  const pinnedIds = new Set(state.pins.map(p => p.recipe_id));
  const slotCount = durationDays * mealsPerDay;
  const ready = state.pins.length >= 3;

  return (
    <section aria-label="Pinboard" className="flex flex-col">
      {/* ── Sticky summary / collapsed header ── */}
      <div
        className="sticky top-0 z-30 flex items-center gap-2 px-3 py-2"
        style={{
          background: 'rgba(26,18,10,0.96)',
          borderBottom: '1px solid #2A1F14',
          backdropFilter: 'blur(8px)',
          minHeight: 52,
        }}
      >
        {/* Pin count + thumbnails */}
        {state.pins.length > 0 && (
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-xs font-semibold" style={{ color: '#E67E22' }}>
              📌 {state.pins.length}
            </span>
            <div className="flex gap-0.5">
              {state.pins.slice(0, 5).map(p => (
                <div
                  key={p.id}
                  className="w-7 h-7 rounded overflow-hidden"
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
                </div>
              ))}
              {state.pins.length > 5 && (
                <span className="text-[10px] self-center ml-0.5" style={{ color: '#6B4E36' }}>
                  +{state.pins.length - 5}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Search bar — always accessible */}
        <RecipeSearchBar
          pinnedIds={pinnedIds}
          onTogglePin={togglePin}
          placeholder="Search & add recipes…"
        />

        {/* Reweave button (only after first weave) */}
        {state.weave && (
          <button
            onClick={() => state.runWeave({ seed: Date.now() & 0xffff, persistUndo: true })}
            disabled={state.loading}
            title="Reweave"
            className="shrink-0 px-2 py-1 rounded text-xs border transition-opacity disabled:opacity-40"
            style={{ borderColor: '#3A2A1A', color: '#8A6A4A' }}
          >
            {state.loading ? '…' : '↺'}
          </button>
        )}

        {/* Expand / collapse toggle */}
        <button
          onClick={() => setOpen(v => !v)}
          className="shrink-0 w-7 h-7 flex items-center justify-center rounded transition-colors"
          style={{ color: '#6B4E36' }}
          aria-label={open ? 'Collapse pinboard' : 'Expand pinboard'}
        >
          {open ? '▴' : '▾'}
        </button>
      </div>

      {/* ── Expandable body ── */}
      {open && (
        <div className="flex flex-col gap-3 pt-3">
          <ConstraintChipBar filters={state.filters} onChange={state.setFilters} />
          <InspirationChips selected={state.filters.inspiration_tags} onToggle={toggleInspiration} />
          <PinboardFeed planId={planId} filters={state.filters} pins={state.pins} onTogglePin={togglePin} />
          {/* Weave button — inside expanded body, bottom sticky */}
          {!state.weave && (
            <PinTray
              pins={state.pins}
              durationDays={durationDays}
              mealsPerDay={mealsPerDay}
              onRemove={state.removePin}
              onWeave={() => state.runWeave({ persistUndo: false })}
              weaving={state.loading}
            />
          )}
          {/* After weave: show inline weave/reweave row instead of sticky PinTray */}
          {state.weave && (
            <div
              className="flex items-center justify-between px-3 py-2 rounded-lg"
              style={{ background: '#1A120A', border: '1px solid #2A1F14' }}
            >
              <span className="text-xs" style={{ color: '#6B4E36' }}>
                {state.pins.length} recipes pinned
              </span>
              <div className="flex gap-2">
                {state.canUndo && (
                  <button
                    onClick={state.undoWeave}
                    className="text-xs px-3 py-1 rounded border"
                    style={{ borderColor: '#3A2A1A', color: '#8A6A4A' }}
                  >
                    ↶ undo
                  </button>
                )}
                <button
                  onClick={() => state.runWeave({ seed: Date.now() & 0xffff, persistUndo: true })}
                  disabled={state.loading}
                  className="text-xs px-3 py-1 rounded-full border disabled:opacity-40"
                  style={{ borderColor: '#E67E22', color: '#E67E22' }}
                >
                  {state.loading ? 'Weaving…' : '🔀 Reweave'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
