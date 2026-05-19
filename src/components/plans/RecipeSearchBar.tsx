'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { RecipeImage } from '@/components/recipe-image';

interface AutocompleteRecipe {
  id: string;
  title: string;
  image_url: string | null;
  focal_x?: number | null;
  focal_y?: number | null;
}

interface Props {
  pinnedIds: Set<string>;
  onTogglePin: (recipe_id: string) => void;
  placeholder?: string;
}

export function RecipeSearchBar({ pinnedIds, onTogglePin, placeholder = 'Search & add recipes…' }: Props) {
  const [q, setQ] = useState('');
  const [results, setResults] = useState<AutocompleteRecipe[]>([]);
  const [open, setOpen] = useState(false);
  const [focusedIdx, setFocusedIdx] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const search = useCallback((query: string) => {
    if (query.length < 2) {
      setResults([]);
      setOpen(false);
      return;
    }
    const params = new URLSearchParams({ q: query, limit: '8' });
    fetch(`/api/recipes/autocomplete?${params}`)
      .then(r => r.ok ? r.json() : [])
      .then((data: AutocompleteRecipe[]) => {
        setResults(data);
        setOpen(data.length > 0);
        setFocusedIdx(-1);
      })
      .catch(() => { /* silent */ });
  }, []);

  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => search(q), 200);
    return () => { if (timer.current) clearTimeout(timer.current); };
  }, [q, search]);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const pick = (recipe: AutocompleteRecipe) => {
    onTogglePin(recipe.id);
    setQ('');
    setResults([]);
    setOpen(false);
    inputRef.current?.focus();
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (!open) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setFocusedIdx(i => Math.min(i + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setFocusedIdx(i => Math.max(i - 1, -1));
    } else if (e.key === 'Enter' && focusedIdx >= 0) {
      e.preventDefault();
      pick(results[focusedIdx]);
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  };

  return (
    <div ref={containerRef} className="relative flex-1 min-w-0">
      <div className="relative flex items-center">
        <span className="absolute left-3 text-sm pointer-events-none" style={{ color: '#6B4E36' }}>🔍</span>
        <input
          ref={inputRef}
          type="text"
          value={q}
          onChange={e => setQ(e.target.value)}
          onFocus={() => results.length > 0 && setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder={placeholder}
          className="w-full pl-9 pr-3 py-1.5 rounded-full text-sm focus:outline-none"
          style={{
            background: '#2A1F14',
            border: '1px solid #3A2A1A',
            color: '#EFE3CE',
          }}
        />
      </div>

      {open && results.length > 0 && (
        <ul
          className="absolute left-0 right-0 top-full mt-1 rounded-lg overflow-hidden z-50 shadow-xl"
          style={{ background: '#1A120A', border: '1px solid #3A2A1A' }}
        >
          {results.map((r, i) => {
            const pinned = pinnedIds.has(r.id);
            const focused = i === focusedIdx;
            return (
              <li key={r.id}>
                <button
                  onMouseDown={e => { e.preventDefault(); pick(r); }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-left transition-colors"
                  style={{
                    background: focused ? '#2A1F14' : 'transparent',
                    borderBottom: '1px solid #2A1F14',
                  }}
                >
                  <div className="w-8 h-8 rounded overflow-hidden shrink-0" style={{ background: '#2A1F14' }}>
                    <RecipeImage
                      recipeId={r.id}
                      imageUrl={r.image_url}
                      title={r.title}
                      focal_x={r.focal_x}
                      focal_y={r.focal_y}
                      className="w-full h-full"
                    />
                  </div>
                  <span className="flex-1 text-sm line-clamp-1" style={{ color: '#EFE3CE' }}>{r.title}</span>
                  <span className="text-xs shrink-0" style={{ color: pinned ? '#7AA350' : '#6B4E36' }}>
                    {pinned ? '✓ Pinned' : '+ Pin'}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
