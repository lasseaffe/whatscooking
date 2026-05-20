'use client';

import { useState } from 'react';
import type { ChallengeDef, ChallengeCompletion } from '../types';

interface Props {
  allChallenges: ChallengeDef[];
  completions: ChallengeCompletion[];
}

export function BadgeWall({ allChallenges, completions }: Props) {
  const earnedIds = new Set(completions.map(c => c.challenge_id));
  const [tappedId, setTappedId] = useState<string | null>(null);

  function handleBadgeClick(id: string) {
    setTappedId(prev => (prev === id ? null : id));
  }

  return (
    <div onClick={() => setTappedId(null)}>
      <div style={{ color: 'var(--rc-title,#EFE3CE)', fontSize: 13, fontWeight: 700, marginBottom: 14 }}>
        🏅 Badges Earned ({earnedIds.size}/{allChallenges.length})
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 10 }}>
        {allChallenges.map(c => {
          const earned = earnedIds.has(c.id);
          const when = earned
            ? completions.find(x => x.challenge_id === c.id)?.completed_at
            : null;
          const isTooltipOpen = tappedId === c.id;
          return (
            <div
              key={c.id}
              style={{ textAlign: 'center', opacity: earned ? 1 : 0.35, position: 'relative' }}
              onClick={e => { e.stopPropagation(); handleBadgeClick(c.id); }}
            >
              <div style={{
                width: 44, height: 44,
                background: earned ? '#2A1808' : '#1f1f1e',
                border: `2px solid ${earned ? '#F4A261' : '#3A3430'}`,
                borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 20, margin: '0 auto 4px',
                boxShadow: earned ? '0 0 10px rgba(244,162,97,0.3)' : 'none',
                filter: earned ? 'none' : 'grayscale(1)',
                cursor: 'pointer',
              }}>
                {c.emoji}
              </div>
              <div style={{ color: 'var(--rc-meta,#A08060)', fontSize: 9, lineHeight: 1.2 }}>
                {c.title.length > 10 ? c.title.slice(0, 9) + '…' : c.title}
              </div>
              {isTooltipOpen && (
                <div style={{
                  position: 'absolute', top: '100%', left: '50%',
                  transform: 'translateX(-50%)',
                  marginTop: 6, zIndex: 20,
                  background: '#1F1B19',
                  border: '1px solid #3A3430',
                  borderRadius: 8, padding: '6px 10px',
                  whiteSpace: 'nowrap',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.5)',
                }}>
                  <div style={{ color: 'var(--rc-title,#EFE3CE)', fontSize: 11, fontWeight: 600 }}>{c.title}</div>
                  <div style={{ color: 'var(--rc-meta,#A08060)', fontSize: 10, marginTop: 2 }}>
                    {earned && when ? new Date(when).toLocaleDateString() : 'Locked'}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
