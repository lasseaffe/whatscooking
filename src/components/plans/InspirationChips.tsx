'use client';

import { INSPIRATION_TAGS } from '@/lib/inspiration-tags';

interface Props {
  selected: string[];
  onToggle: (tagId: string) => void;
}

const CATEGORIES = ['cuisine', 'mood', 'season'] as const;

export function InspirationChips({ selected, onToggle }: Props) {
  return (
    <div className="flex flex-col gap-2.5">
      <p style={{ fontFamily: "var(--font-geist-mono, ui-monospace, monospace)", fontSize: 10, letterSpacing: '0.16em', textTransform: 'uppercase', color: '#6E573D' }}>
        ✦ Inspiration
      </p>
      {CATEGORIES.map(cat => (
        <div key={cat} className="flex flex-wrap gap-1.5">
          {INSPIRATION_TAGS.filter(t => t.category === cat).map(t => {
            const on = selected.includes(t.id);
            return (
              <button
                key={t.id}
                onClick={() => onToggle(t.id)}
                className="px-2.5 py-1 rounded-full text-xs border transition-all"
                style={{
                  background: on ? '#E67E22' : 'transparent',
                  borderColor: on ? '#E67E22' : '#2A1E13',
                  color: on ? '#0C0907' : '#9A7E5E',
                }}
              >
                {t.label}
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
}
