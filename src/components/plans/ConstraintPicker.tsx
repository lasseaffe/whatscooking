'use client';

import { useState, useEffect, useRef } from 'react';
import { RecipeImage } from '@/components/recipe-image';
import type { MealType } from '@/lib/weave-solver';

interface PickedRecipe {
  id: string;
  title: string;
  image_url: string | null;
  focal_x?: number | null;
  focal_y?: number | null;
}

interface Props {
  planId: string;
  mealType: MealType;
  excludeRecipeIds: string[];
  onPick: (recipe: PickedRecipe) => void;
  onSuggestOne: () => Promise<PickedRecipe | null>;
  onClose: () => void;
}

export function ConstraintPicker({ planId, mealType, excludeRecipeIds, onPick, onSuggestOne, onClose }: Props) {
  const [q, setQ] = useState('');
  const [results, setResults] = useState<PickedRecipe[]>([]);
  const [loading, setLoading] = useState(false);
  const [suggesting, setSuggesting] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const excludeKey = excludeRecipeIds.join(',');

  useEffect(() => {
    const fetch_ = async () => {
      setLoading(true);
      const params = new URLSearchParams({ plan_id: planId, meal_type: mealType, limit: '24' });
      if (q.trim()) params.set('q', q.trim());
      if (excludeKey) params.set('exclude_recipe_ids', excludeKey);
      try {
        const r = await fetch(`/api/recipes/picker?${params}`);
        if (r.ok) {
          const d = await r.json();
          setResults(d.recipes ?? []);
        }
      } finally { setLoading(false); }
    };
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(fetch_, 200);
    return () => { if (timer.current) clearTimeout(timer.current); };
  }, [q, mealType, planId, excludeKey]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  const trySuggest = async () => {
    setSuggesting(true);
    try {
      const r = await onSuggestOne();
      if (r) onPick(r);
    } catch { /* fall through */ }
    setSuggesting(false);
  };

  return (
    <div
      className="fixed inset-0 z-40 flex items-end sm:items-center sm:justify-end"
      style={{ background: 'rgba(0,0,0,0.5)' }}
      onClick={onClose}
    >
      <div
        className="w-full sm:w-96 h-[85vh] sm:h-full flex flex-col"
        style={{ background: '#1A120A', borderLeft: '1px solid #3A2A1A' }}
        onClick={e => e.stopPropagation()}
      >
        <header className="flex items-center gap-3 px-4 py-3 border-b" style={{ borderColor: '#3A2A1A' }}>
          <div>
            <p className="text-xs uppercase tracking-wider" style={{ color: '#6B4E36' }}>Pick a recipe</p>
            <h2 className="text-base font-serif" style={{ color: '#EFE3CE' }}>{mealType}</h2>
          </div>
          <button onClick={onClose} aria-label="Close picker" className="ml-auto text-2xl leading-none" style={{ color: '#6B4E36' }}>×</button>
        </header>

        <div className="px-4 py-3 border-b" style={{ borderColor: '#2A1F14' }}>
          <input
            autoFocus
            type="text"
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder={`Search ${mealType} recipes…`}
            className="w-full px-3 py-2 rounded border text-sm focus:outline-none"
            style={{ background: '#2A1F14', borderColor: '#3A2A1A', color: '#EFE3CE' }}
          />
          <button
            disabled={suggesting}
            onClick={trySuggest}
            className="mt-2 w-full text-sm px-3 py-2 rounded border transition-colors disabled:opacity-40"
            style={{ borderColor: '#E67E22', color: '#E67E22' }}
          >
            {suggesting ? 'Thinking…' : '✨ Suggest one for me'}
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading && results.length === 0 ? (
            <p className="text-center py-8 text-sm" style={{ color: '#6B4E36' }}>Searching…</p>
          ) : results.length === 0 ? (
            <p className="text-center py-8 text-sm" style={{ color: '#6B4E36' }}>No recipes match.</p>
          ) : (
            <ul>
              {results.map(r => (
                <li key={r.id}>
                  <button
                    onClick={() => onPick(r)}
                    className="w-full flex items-center gap-3 px-4 py-2 text-left hover:bg-[#2A1F14]"
                    style={{ borderBottom: '1px solid #2A1F14' }}
                  >
                    <div className="relative w-12 h-12 rounded overflow-hidden shrink-0" style={{ background: '#2A1F14' }}>
                      <RecipeImage recipeId={r.id} imageUrl={r.image_url} title={r.title} focal_x={r.focal_x} focal_y={r.focal_y} className="w-full h-full" />
                    </div>
                    <span className="text-sm" style={{ color: '#EFE3CE' }}>{r.title}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
