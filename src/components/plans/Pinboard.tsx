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

const SERIF = "var(--font-fraunces, 'Libre Baskerville', Georgia, serif)";
const MONO = "var(--font-geist-mono, ui-monospace, monospace)";

export function Pinboard({ state, planId, durationDays, mealsPerDay }: Props) {
  const [open, setOpen] = useState(true);
  const [tuneOpen, setTuneOpen] = useState(false);

  // When the first weave lands, fold the planning zone into the slim refine bar.
  useEffect(() => {
    if (state.weave) setOpen(false);
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
  const f = state.filters;

  const tuneCount = [
    f.diet.length > 0,
    f.squad_aware,
    f.pantry_aware,
    f.anti_repeat !== 'off',
    f.batch_enabled,
    f.inspiration_tags.length > 0,
  ].filter(Boolean).length;

  const summaryParts: string[] = [];
  if (f.diet.length) summaryParts.push(`◆ ${f.diet.join(', ')}`);
  summaryParts.push(`⏱ weeknights ≤${f.time_weeknight}m`);
  summaryParts.push(`👥 squad ${f.squad_size}`);
  if (f.anti_repeat !== 'off') summaryParts.push(`↻ ${f.anti_repeat}`);
  if (f.pantry_aware) summaryParts.push('🥕 pantry-aware');
  if (f.batch_enabled) summaryParts.push('🍳 batch');
  if (f.inspiration_tags.length) summaryParts.push(`✦ ${f.inspiration_tags.length} vibes`);

  // ── Shared pieces ─────────────────────────────────────────
  const tuneButton = (
    <button
      onClick={() => setTuneOpen(v => !v)}
      className="shrink-0 inline-flex items-center gap-2 rounded-xl transition-colors"
      style={{
        fontFamily: MONO, fontSize: 12, letterSpacing: '0.04em',
        color: '#EFE3CE', background: tuneOpen ? 'rgba(230,126,34,0.12)' : '#241A11',
        border: `1px solid ${tuneOpen ? '#E67E22' : '#3A2A1B'}`, padding: '9px 14px',
      }}
      aria-expanded={tuneOpen}
    >
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#E67E22' }} />
      Tune{tuneCount > 0 ? ` · ${tuneCount} active` : ''}
    </button>
  );

  const tunePanel = tuneOpen && (
    <div
      className="flex flex-col gap-4 p-4 rounded-2xl"
      style={{ background: 'rgba(12,9,7,0.55)', border: '1px solid #2A1E13' }}
    >
      <ConstraintChipBar filters={state.filters} onChange={state.setFilters} />
      <div style={{ height: 1, background: '#2A1E13' }} />
      <InspirationChips selected={state.filters.inspiration_tags} onToggle={toggleInspiration} />
    </div>
  );

  const pinnedShelf = state.pins.length > 0 && (
    <div className="flex items-center gap-3.5">
      <span style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '0.16em', textTransform: 'uppercase', color: '#6E573D' }}>Pinned</span>
      <div className="flex">
        {state.pins.slice(0, 6).map((p, i) => (
          <div
            key={p.id}
            className="rounded-lg overflow-hidden"
            style={{ width: 44, height: 44, marginLeft: i === 0 ? 0 : -10, border: '2px solid #0C0907', background: '#241A11', boxShadow: '0 2px 8px rgba(0,0,0,0.5)' }}
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
      </div>
      <span style={{ fontFamily: SERIF, fontSize: 15, color: '#EFE3CE' }}>
        {state.pins.length} {state.pins.length === 1 ? 'recipe' : 'recipes'} ready
      </span>
    </div>
  );

  const gallery = (
    <PinboardFeed
      planId={planId}
      filters={state.filters}
      pins={state.pins}
      onTogglePin={togglePin}
      onOpenTune={() => setTuneOpen(true)}
    />
  );

  // ════════════════════════════════════════════════════════════
  // PLANNING STATE — full editorial planning surface
  // ════════════════════════════════════════════════════════════
  if (!state.weave) {
    return (
      <section aria-label="Pinboard" className="flex flex-col gap-6">
        {/* editorial hero search */}
        <div
          className="rounded-2xl p-7"
          style={{ background: 'linear-gradient(180deg,#1C140D,#15100B)', border: '1px solid #3A2A1B' }}
        >
          <p style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '0.22em', textTransform: 'uppercase', color: '#9A7E5E' }}>
            What are we cooking this week?
          </p>
          <h2 style={{ fontFamily: SERIF, fontStyle: 'italic', fontWeight: 500, fontSize: 25, color: '#EFE3CE', margin: '8px 0 18px' }}>
            Search the library, or follow a craving below.
          </h2>
          <div className="flex items-stretch gap-3">
            <RecipeSearchBar pinnedIds={pinnedIds} onTogglePin={togglePin} variant="hero" placeholder="Search recipes — “miso salmon”, “high protein”…" />
            {tuneButton}
          </div>
          <p className="mt-4" style={{ fontFamily: MONO, fontSize: 11.5, color: '#9A7E5E', lineHeight: 1.7 }}>
            {summaryParts.join('  ·  ')}
          </p>
        </div>

        {tunePanel}
        {pinnedShelf}
        {gallery}

        <PinTray
          pins={state.pins}
          durationDays={durationDays}
          mealsPerDay={mealsPerDay}
          onRemove={state.removePin}
          onWeave={() => state.runWeave({ persistUndo: false })}
          weaving={state.loading}
        />
      </section>
    );
  }

  // ════════════════════════════════════════════════════════════
  // WOVEN STATE — planning folds into a slim "Refine" bar
  // ════════════════════════════════════════════════════════════
  return (
    <section
      aria-label="Pinboard"
      className="flex flex-col rounded-2xl overflow-hidden"
      style={{ background: 'rgba(21,16,11,0.6)', border: '1px solid #2A1E13' }}
    >
      <div className="flex items-center gap-3 px-4 py-3">
        {state.pins.length > 0 && (
          <div className="flex items-center gap-2 shrink-0">
            <span style={{ fontFamily: MONO, fontSize: 12, color: '#E67E22' }}>📌 {state.pins.length}</span>
            <div className="flex">
              {state.pins.slice(0, 5).map((p, i) => (
                <div key={p.id} className="rounded-md overflow-hidden" style={{ width: 28, height: 28, marginLeft: i === 0 ? 0 : -7, border: '2px solid #15100B', background: '#241A11' }}>
                  <RecipeImage recipeId={p.recipe.id} imageUrl={p.recipe.image_url} title={p.recipe.title} focal_x={p.recipe.focal_x} focal_y={p.recipe.focal_y} className="w-full h-full" />
                </div>
              ))}
            </div>
          </div>
        )}

        <RecipeSearchBar pinnedIds={pinnedIds} onTogglePin={togglePin} variant="slim" placeholder="Search & add recipes…" />

        <button
          onClick={() => state.runWeave({ seed: Date.now() & 0xffff, persistUndo: true })}
          disabled={state.loading}
          title="Reweave"
          className="shrink-0 rounded-lg transition-opacity disabled:opacity-40"
          style={{ fontFamily: MONO, fontSize: 13, color: '#9A7E5E', border: '1px solid #3A2A1B', padding: '7px 10px' }}
        >
          {state.loading ? '…' : '↻'}
        </button>

        <button
          onClick={() => setOpen(v => !v)}
          className="shrink-0 inline-flex items-center gap-1.5 rounded-lg transition-colors"
          style={{ fontFamily: MONO, fontSize: 12, color: open ? '#E67E22' : '#9A7E5E', border: `1px solid ${open ? '#E67E22' : '#3A2A1B'}`, padding: '7px 11px' }}
          aria-expanded={open}
        >
          ✎ Refine {open ? '▴' : '▾'}
        </button>
      </div>

      {open && (
        <div className="flex flex-col gap-5 px-4 pb-4 pt-1">
          <div className="flex justify-end">{tuneButton}</div>
          {tunePanel}
          {gallery}
          <div
            className="flex items-center justify-between px-4 py-3 rounded-xl"
            style={{ background: '#15100B', border: '1px solid #2A1E13' }}
          >
            <span style={{ fontFamily: SERIF, fontSize: 14, color: '#9A7E5E' }}>{state.pins.length} recipes pinned</span>
            <div className="flex gap-2">
              {state.canUndo && (
                <button onClick={state.undoWeave} className="rounded-lg" style={{ fontFamily: MONO, fontSize: 12, color: '#9A7E5E', border: '1px solid #3A2A1B', padding: '7px 12px' }}>
                  ↶ undo
                </button>
              )}
              <button
                onClick={() => state.runWeave({ seed: Date.now() & 0xffff, persistUndo: true })}
                disabled={state.loading}
                className="rounded-full disabled:opacity-40"
                style={{ fontFamily: MONO, fontSize: 12, color: '#E67E22', border: '1px solid #E67E22', padding: '7px 14px' }}
              >
                {state.loading ? 'Weaving…' : '🔀 Reweave'}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
