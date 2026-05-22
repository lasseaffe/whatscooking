'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
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
  variant?: 'hero' | 'slim';
}

interface DropdownRect { top: number; left: number; width: number; }

export function RecipeSearchBar({ pinnedIds, onTogglePin, placeholder = 'Search & add recipes…', variant = 'slim' }: Props) {
  const [q, setQ] = useState('');
  const [results, setResults] = useState<AutocompleteRecipe[]>([]);
  const [open, setOpen] = useState(false);
  const [focusedIdx, setFocusedIdx] = useState(-1);
  const [dropRect, setDropRect] = useState<DropdownRect | null>(null);
  const [mounted, setMounted] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => { setMounted(true); }, []);

  const updateRect = useCallback(() => {
    if (!containerRef.current) return;
    const r = containerRef.current.getBoundingClientRect();
    setDropRect({ top: r.bottom + 4, left: r.left, width: r.width });
  }, []);

  // Reposition on scroll/resize while open
  useEffect(() => {
    if (!open) return;
    updateRect();
    window.addEventListener('scroll', updateRect, { passive: true, capture: true });
    window.addEventListener('resize', updateRect, { passive: true });
    return () => {
      window.removeEventListener('scroll', updateRect, true);
      window.removeEventListener('resize', updateRect);
    };
  }, [open, updateRect]);

  const search = useCallback((query: string) => {
    if (query.length < 2) { setResults([]); setOpen(false); return; }
    const params = new URLSearchParams({ q: query, limit: '8' });
    fetch(`/api/recipes/autocomplete?${params}`)
      .then(r => r.ok ? r.json() : [])
      .then((data: AutocompleteRecipe[]) => {
        setResults(data); setOpen(data.length > 0); setFocusedIdx(-1);
      })
      .catch(() => {});
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
    setQ(''); setResults([]); setOpen(false);
    inputRef.current?.focus();
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (!open) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); setFocusedIdx(i => Math.min(i + 1, results.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setFocusedIdx(i => Math.max(i - 1, -1)); }
    else if (e.key === 'Enter' && focusedIdx >= 0) { e.preventDefault(); pick(results[focusedIdx]); }
    else if (e.key === 'Escape') setOpen(false);
  };

  const hero = variant === 'hero';

  const dropdown = open && results.length > 0 && dropRect && mounted
    ? createPortal(
        <ul
          role="listbox"
          style={{
            position: 'fixed',
            top: dropRect.top,
            left: dropRect.left,
            width: dropRect.width,
            zIndex: 9999,
            background: '#1A120A',
            border: '1px solid #3A2A1A',
            borderRadius: 8,
            boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
            maxHeight: 320,
            overflowY: 'auto',
            margin: 0,
            padding: 0,
            listStyle: 'none',
          }}
        >
          {results.map((r, i) => {
            const pinned = pinnedIds.has(r.id);
            const focused = i === focusedIdx;
            return (
              <li key={r.id} role="option" aria-selected={pinned}>
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
                      recipeId={r.id} imageUrl={r.image_url} title={r.title}
                      focal_x={r.focal_x} focal_y={r.focal_y} className="w-full h-full"
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
        </ul>,
        document.body
      )
    : null;

  return (
    <div ref={containerRef} className="relative flex-1 min-w-0">
      <div className="relative flex items-center">
        <span
          className="absolute pointer-events-none"
          style={{ left: hero ? 18 : 12, color: hero ? '#E67E22' : '#6B4E36', fontSize: hero ? 17 : 14 }}
        >⌕</span>
        <input
          ref={inputRef}
          type="text"
          value={q}
          onChange={e => setQ(e.target.value)}
          onFocus={() => { if (results.length > 0) { setOpen(true); updateRect(); } }}
          onKeyDown={onKeyDown}
          placeholder={placeholder}
          aria-label={placeholder}
          aria-expanded={open}
          aria-haspopup="listbox"
          className="w-full focus:outline-none"
          style={hero ? {
            paddingLeft: 44, paddingRight: 16, paddingTop: 14, paddingBottom: 14,
            borderRadius: 14, fontSize: 16,
            background: '#0C0907', border: '1px solid #3A2A1B', color: '#EFE3CE',
          } : {
            paddingLeft: 34, paddingRight: 12, paddingTop: 6, paddingBottom: 6,
            borderRadius: 999, fontSize: 14,
            background: '#241A11', border: '1px solid #3A2A1B', color: '#EFE3CE',
          }}
        />
      </div>
      {dropdown}
    </div>
  );
}
