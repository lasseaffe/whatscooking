'use client';

import type { ChallengeDef, ChallengeCompletion } from '../types';

interface Props {
  allChallenges: ChallengeDef[];
  completions: ChallengeCompletion[];
}

export function BadgeWall({ allChallenges, completions }: Props) {
  const earnedIds = new Set(completions.map(c => c.challenge_id));

  return (
    <div>
      <div style={{ color: 'var(--rc-title,#EFE3CE)', fontSize: 13, fontWeight: 700, marginBottom: 14 }}>
        🏅 Badges Earned ({earnedIds.size}/{allChallenges.length})
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 10 }}>
        {allChallenges.map(c => {
          const earned = earnedIds.has(c.id);
          const when = earned
            ? completions.find(x => x.challenge_id === c.id)?.completed_at
            : null;
          return (
            <div
              key={c.id}
              title={earned ? `${c.title} — ${when ? new Date(when).toLocaleDateString() : ''}` : `Locked: ${c.title}`}
              style={{ textAlign: 'center', opacity: earned ? 1 : 0.35 }}
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
              }}>
                {c.emoji}
              </div>
              <div style={{ color: 'var(--rc-meta,#A08060)', fontSize: 9, lineHeight: 1.2 }}>
                {c.title.length > 10 ? c.title.slice(0, 9) + '…' : c.title}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
