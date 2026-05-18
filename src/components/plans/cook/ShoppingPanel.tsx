// src/components/plans/cook/ShoppingPanel.tsx
'use client';

import { useEffect, useMemo, useState } from 'react';

interface Item {
  name: string;
  amount?: number | null;
  unit?: string | null;
  from: string[];
  category?: string;
}

interface Unknown {
  recipeTitle: string;
  dayNumber: number;
  mealType: string;
}

interface Props {
  planId: string;
}

export function ShoppingPanel({ planId }: Props) {
  const [data, setData] = useState<{ missing: Item[]; have: Item[]; unknownEntries: Unknown[]; totalRecipes: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const [showHave, setShowHave] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/plans/${planId}/shopping`)
      .then(r => r.ok ? r.json() : null)
      .then(setData)
      .finally(() => setLoading(false));
  }, [planId]);

  const groupedMissing = useMemo(() => {
    if (!data) return [];
    const map = new Map<string, Item[]>();
    for (const i of data.missing) {
      const cat = i.category ?? 'Other';
      if (!map.has(cat)) map.set(cat, []);
      map.get(cat)!.push(i);
    }
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [data]);

  const toggle = (key: string) => {
    setChecked(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  };

  return (
    <aside
      className="sticky top-6 self-start rounded-2xl border p-4 flex flex-col gap-3"
      style={{ background: '#1A120A', borderColor: '#3A2A1A', maxHeight: 'calc(100vh - 3rem)' }}
      aria-label="Shopping list"
    >
      <header className="flex items-baseline justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wider" style={{ color: '#E67E22' }}>🛒 Shopping</h2>
        {data && (
          <span className="text-xs" style={{ color: '#6B4E36' }}>
            {data.missing.length} to buy · {data.have.length} in pantry
          </span>
        )}
      </header>
      {loading && <p className="text-sm" style={{ color: '#6B4E36' }}>Loading…</p>}
      {data && (
        <>
          <div className="overflow-y-auto flex-1 flex flex-col gap-3 pr-1">
            {groupedMissing.map(([cat, items]) => (
              <section key={cat}>
                <h3 className="text-xs uppercase tracking-wider mb-1" style={{ color: '#8A6A4A' }}>{cat}</h3>
                <ul className="flex flex-col gap-0.5">
                  {items.map(i => {
                    const key = `m:${i.name}`;
                    const ck = checked.has(key);
                    return (
                      <li key={key}>
                        <button
                          onClick={() => toggle(key)}
                          className="w-full flex items-center gap-2 text-left py-1 text-sm"
                          aria-pressed={ck}
                        >
                          <span
                            className="w-4 h-4 rounded border flex items-center justify-center text-xs"
                            style={{ borderColor: ck ? '#7AA350' : '#3A2A1A', background: ck ? '#7AA350' : 'transparent', color: '#1A120A' }}
                          >
                            {ck ? '✓' : ''}
                          </span>
                          <span style={{ color: ck ? '#6B4E36' : '#EFE3CE', textDecoration: ck ? 'line-through' : undefined }}>
                            {i.name}
                            {i.amount != null && i.unit ? ` · ${i.amount} ${i.unit}` : ''}
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </section>
            ))}

            {data.have.length > 0 && (
              <section>
                <button
                  onClick={() => setShowHave(s => !s)}
                  className="text-xs uppercase tracking-wider"
                  style={{ color: '#6B4E36' }}
                  aria-expanded={showHave}
                >
                  ✓ {data.have.length} already have · {showHave ? '▴' : '▾'}
                </button>
                {showHave && (
                  <ul className="flex flex-col gap-0.5 mt-1">
                    {data.have.map(i => (
                      <li key={`h:${i.name}`} className="text-xs" style={{ color: '#6B4E36' }}>
                        {i.name}
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            )}

            {data.unknownEntries.length > 0 && (
              <section>
                <h3 className="text-xs uppercase tracking-wider mb-1" style={{ color: '#C85A2F' }}>
                  ⚠ {data.unknownEntries.length} recipes without ingredients
                </h3>
                <p className="text-xs" style={{ color: '#6B4E36' }}>
                  These manual entries won't generate shopping items: {data.unknownEntries.map(u => u.recipeTitle).join(', ')}
                </p>
              </section>
            )}
          </div>
        </>
      )}
    </aside>
  );
}
