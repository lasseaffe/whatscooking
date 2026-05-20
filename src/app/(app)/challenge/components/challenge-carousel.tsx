'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import type { ChallengeDef } from '../types';
import { chunkArray, CATEGORY_LABEL, CATEGORY_SUBTITLE } from '../utils';
import { ChallengeCard } from './challenge-card';

interface Props {
  category: ChallengeDef['category'];
  challenges: ChallengeDef[];
  autoInterval?: number;
  onAccepted?: () => void;
}

export function ChallengeCarousel({ category, challenges, autoInterval = 5000, onAccepted }: Props) {
  const pages = chunkArray(challenges, 3);
  const [page, setPage] = useState(0);
  const paused = useRef(false);

  const advance = useCallback(() => {
    if (!paused.current) setPage(p => (p + 1) % pages.length);
  }, [pages.length]);

  useEffect(() => {
    if (pages.length <= 1) return;
    const id = setInterval(advance, autoInterval);
    return () => clearInterval(id);
  }, [advance, autoInterval, pages.length]);

  if (challenges.length === 0) return null;

  const current = pages[page] ?? [];

  return (
    <div style={{ marginBottom: 28 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <div>
          <div style={{ color: 'var(--rc-title, #EFE3CE)', fontSize: 15, fontWeight: 700 }}>
            {CATEGORY_LABEL[category]}
          </div>
          <div style={{ color: 'var(--fg-tertiary, #9c9c9b)', fontSize: 11 }}>
            {CATEGORY_SUBTITLE[category]}
          </div>
        </div>
        {pages.length > 1 && (
          <button
            onClick={() => setPage(p => (p + 1) % pages.length)}
            style={{ color: '#F4A261', fontSize: 11, background: 'none', border: 'none', cursor: 'pointer' }}
          >
            See more →
          </button>
        )}
      </div>

      <div
        style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12 }}
        onMouseEnter={() => { paused.current = true; }}
        onMouseLeave={() => { paused.current = false; }}
      >
        {current.map(c => (
          <ChallengeCard key={c.id} challenge={c} onAccepted={onAccepted} />
        ))}
        {current.length < 3 && Array.from({ length: 3 - current.length }).map((_, i) => (
          <div key={`pad-${i}`} />
        ))}
      </div>

      {pages.length > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginTop: 10 }}>
          {pages.map((_, i) => (
            <button
              key={i}
              onClick={() => setPage(i)}
              style={{
                width: i === page ? 20 : 6,
                height: 4,
                background: i === page ? '#F4A261' : '#3A3430',
                borderRadius: 2,
                border: 'none',
                cursor: 'pointer',
                padding: 0,
                transition: 'width 0.2s',
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
