'use client';

import { useState, useEffect } from 'react';
import { getActiveChallenge, clearActiveChallenge, formatElapsed } from '../utils';
import type { ActiveChallenge } from '../types';

interface Props {
  onComplete: (active: ActiveChallenge) => void;
}

export function ActiveBanner({ onComplete }: Props) {
  const [active, setActive] = useState<ActiveChallenge | null>(null);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const a = getActiveChallenge();
    setActive(a);
    if (!a) return;

    const startMs = new Date(a.startedAt).getTime();
    const tick = () => setElapsed(Math.floor((Date.now() - startMs) / 1000));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    function onFocus() { setActive(getActiveChallenge()); }
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, []);

  if (!active) return null;

  return (
    <div style={{
      margin: '0 0 20px',
      background: '#1a2010',
      border: '1px solid #3a5020',
      borderRadius: 12,
      padding: '14px 18px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
    }}>
      <div>
        <div style={{ color: '#7abd7a', fontSize: 10, fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '1.5px', marginBottom: 3 }}>
          ⚡ Active Challenge — {formatElapsed(elapsed)}
        </div>
        <div style={{ color: 'var(--rc-title,#EFE3CE)', fontSize: 14, fontWeight: 600 }}>
          {active.emoji} {active.title}
        </div>
      </div>
      <button
        onClick={() => onComplete(active)}
        style={{
          background: '#7abd7a', color: '#0d0d0c', border: 'none',
          borderRadius: 8, padding: '8px 16px', fontWeight: 700, fontSize: 12, cursor: 'pointer',
        }}
      >
        ✓ Done
      </button>
    </div>
  );
}
