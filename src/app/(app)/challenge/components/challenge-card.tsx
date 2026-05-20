'use client';

import type { ChallengeDef } from '../types';
import { CATEGORY_GRADIENT, DIFFICULTY_COLOR, setActiveChallenge } from '../utils';

interface Props {
  challenge: ChallengeDef;
  onAccepted?: () => void;
}

export function ChallengeCard({ challenge, onAccepted }: Props) {
  const diff = DIFFICULTY_COLOR[challenge.difficulty];

  function handleAccept() {
    setActiveChallenge({
      challengeId: challenge.id,
      title: challenge.title,
      emoji: challenge.emoji,
      startedAt: new Date().toISOString(),
      requiresProof: challenge.requires_proof,
    });
    onAccepted?.();
  }

  return (
    <div style={{
      background: 'var(--rc-surface, #1F1B19)',
      border: '1px solid var(--rc-rim, #3A3430)',
      borderRadius: 14,
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
    }}>
      <div style={{
        background: CATEGORY_GRADIENT[challenge.category],
        padding: '22px 16px',
        textAlign: 'center',
      }}>
        <div style={{ fontSize: 40, marginBottom: 6 }}>{challenge.emoji}</div>
        <div style={{
          color: '#F4A261',
          fontSize: 9,
          letterSpacing: '2px',
          textTransform: 'uppercase' as const,
          fontWeight: 700,
        }}>
          {challenge.category.charAt(0).toUpperCase() + challenge.category.slice(1)}
        </div>
      </div>

      <div style={{ padding: 14, flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div style={{ color: 'var(--rc-title, #EFE3CE)', fontWeight: 700, fontSize: 13, marginBottom: 5 }}>
          {challenge.title}
        </div>
        <div style={{ color: 'var(--rc-meta, #A08060)', fontSize: 11, lineHeight: 1.5, marginBottom: 12, flex: 1 }}>
          {challenge.description}
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <span style={{
            background: diff.bg, color: diff.text,
            fontSize: 9, padding: '2px 8px', borderRadius: 20, fontWeight: 600,
          }}>
            {diff.label}
          </span>
          <span style={{ color: 'var(--fg-tertiary, #9c9c9b)', fontSize: 9 }}>
            {challenge.requires_proof ? '📸 Proof req.' : '✓ No proof'}
          </span>
        </div>

        <button
          onClick={handleAccept}
          style={{
            width: '100%',
            background: '#F4A261',
            color: '#0d0d0c',
            border: 'none',
            borderRadius: 8,
            padding: 9,
            fontWeight: 700,
            fontSize: 12,
            cursor: 'pointer',
          }}
        >
          {challenge.category === 'appliance' && challenge.title.includes('Roulette') ? 'Roll & Accept' : 'Accept'}
        </button>
      </div>
    </div>
  );
}
