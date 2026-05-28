'use client';

import { useState } from 'react';
import type { ChallengeCompletion } from '../types';
import { formatElapsed } from '../utils';

interface Props {
  completions: ChallengeCompletion[];
}

const PAGE_SIZE = 10;

export function HistoryLog({ completions }: Props) {
  const [page, setPage] = useState(0);
  const slice = completions.slice(0, (page + 1) * PAGE_SIZE);
  const hasMore = slice.length < completions.length;

  if (completions.length === 0) {
    return (
      <div style={{ color: 'var(--fg-tertiary,#9c9c9b)', fontSize: 13, padding: '20px 0', textAlign: 'center' }}>
        No challenges completed yet. Accept your first one above!
      </div>
    );
  }

  return (
    <div>
      <div style={{ color: 'var(--rc-title,#EFE3CE)', fontSize: 13, fontWeight: 700, marginBottom: 12 }}>
        📋 History
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {slice.map(c => (
          <div key={c.id} style={{
            background: 'var(--rc-surface,#1F1B19)',
            border: '1px solid var(--rc-rim,#3A3430)',
            borderRadius: 10, padding: '11px 14px',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <span style={{ fontSize: 18 }}>{c.challenge?.emoji ?? '🏅'}</span>
              <div>
                <div style={{ color: 'var(--rc-title,#EFE3CE)', fontSize: 12, fontWeight: 600 }}>
                  {c.challenge?.title ?? 'Challenge'}
                </div>
                <div style={{ color: 'var(--fg-tertiary,#9c9c9b)', fontSize: 10 }}>
                  {new Date(c.completed_at).toLocaleDateString()}
                  {c.elapsed_seconds != null ? ` · ⏱ ${formatElapsed(c.elapsed_seconds)}` : ''}
                  {c.proof_url ? ' · 📸 Photo' : ''}
                </div>
              </div>
            </div>
            <span style={{ background: '#1a2e1a', color: '#7abd7a', fontSize: 9, padding: '2px 8px', borderRadius: 20 }}>
              ✓ Done
            </span>
          </div>
        ))}
      </div>
      {hasMore && (
        <button
          onClick={() => setPage(p => p + 1)}
          style={{
            marginTop: 12, width: '100%', padding: '10px',
            background: 'transparent', border: '1px solid var(--rc-rim,#3A3430)',
            borderRadius: 10, color: 'var(--fg-tertiary,#9c9c9b)', cursor: 'pointer', fontSize: 12,
          }}
        >
          Load more
        </button>
      )}
    </div>
  );
}
