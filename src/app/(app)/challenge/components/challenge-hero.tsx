'use client';

import { useState } from 'react';
import type { ChallengeDef } from '../types';
import { setActiveChallenge, DIFFICULTY_COLOR } from '../utils';

interface Props {
  challenges: ChallengeDef[];
  daily: ChallengeDef | null;
  onAccepted?: () => void;
}

export function ChallengeHero({ challenges, daily, onAccepted }: Props) {
  const [spinning, setSpinning] = useState(false);
  const [picked, setPicked] = useState<ChallengeDef | null>(null);

  function spin() {
    setSpinning(true);
    setPicked(null);
    setTimeout(() => {
      const pick = challenges[Math.floor(Math.random() * challenges.length)];
      setPicked(pick ?? null);
      setSpinning(false);
    }, 800);
  }

  function acceptPicked() {
    if (!picked) return;
    setActiveChallenge({
      challengeId: picked.id,
      title: picked.title,
      emoji: picked.emoji,
      startedAt: new Date().toISOString(),
      requiresProof: picked.requires_proof,
    });
    setPicked(null);
    onAccepted?.();
  }

  const diff = picked ? DIFFICULTY_COLOR[picked.difficulty] : null;

  return (
    <div style={{
      margin: '20px 0',
      background: 'linear-gradient(135deg,#1a0f08 0%,#1f1510 50%,#160a14 100%)',
      border: '1px solid var(--rc-rim,#3A3430)',
      borderRadius: 16,
      padding: 28,
      textAlign: 'center',
      position: 'relative',
      overflow: 'hidden',
    }}>
      <div style={{
        position: 'absolute', inset: 0,
        background: 'radial-gradient(ellipse at 50% 0%,rgba(244,162,97,0.08) 0%,transparent 70%)',
        pointerEvents: 'none',
      }} />

      {!picked ? (
        <>
          <div style={{ color: 'var(--fg-tertiary,#9c9c9b)', fontSize: 11, letterSpacing: '2px', textTransform: 'uppercase' as const, marginBottom: 10 }}>
            {spinning ? 'Spinning...' : "Today's Featured"}
          </div>
          <div style={{ fontSize: 56, marginBottom: 8, transition: 'transform 0.1s', transform: spinning ? 'rotate(20deg)' : 'none' }}>
            🎲
          </div>
          <div style={{ color: 'var(--rc-title,#EFE3CE)', fontSize: 19, fontWeight: 700, marginBottom: 6 }}>
            Feeling Lucky?
          </div>
          <div style={{ color: 'var(--rc-meta,#A08060)', fontSize: 13, maxWidth: 320, margin: '0 auto 20px' }}>
            Spin for a completely random challenge from any category. No previews. No mercy.
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' as const }}>
            <button
              onClick={spin}
              disabled={spinning}
              style={{
                background: '#F4A261', color: '#0d0d0c', border: 'none',
                borderRadius: 10, padding: '12px 28px', fontWeight: 700, fontSize: 14, cursor: 'pointer',
                opacity: spinning ? 0.7 : 1,
              }}
            >
              {spinning ? '...' : '🎲 Spin the Wheel'}
            </button>
            {daily && (
              <button
                onClick={() => setPicked(daily)}
                style={{
                  background: 'transparent', color: 'var(--rc-title,#EFE3CE)',
                  border: '1px solid var(--rc-rim,#3A3430)', borderRadius: 10,
                  padding: '12px 20px', fontSize: 13, cursor: 'pointer',
                }}
              >
                View Daily Challenge
              </button>
            )}
          </div>
        </>
      ) : (
        <div>
          <div style={{ fontSize: 52, marginBottom: 10 }}>{picked.emoji}</div>
          <div style={{ color: '#F4A261', fontSize: 11, letterSpacing: 2, textTransform: 'uppercase' as const, fontWeight: 700, marginBottom: 6 }}>
            {picked.category}
          </div>
          <div style={{ color: 'var(--rc-title,#EFE3CE)', fontSize: 20, fontWeight: 700, marginBottom: 8 }}>
            {picked.title}
          </div>
          <div style={{ color: 'var(--rc-meta,#A08060)', fontSize: 13, maxWidth: 340, margin: '0 auto 16px' }}>
            {picked.description}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 16 }}>
            {diff && (
              <span style={{ background: diff.bg, color: diff.text, fontSize: 10, padding: '2px 10px', borderRadius: 20, fontWeight: 600 }}>
                {diff.label}
              </span>
            )}
            <span style={{ color: 'var(--fg-tertiary,#9c9c9b)', fontSize: 11 }}>
              {picked.requires_proof ? '📸 Proof required' : '✓ No proof needed'}
            </span>
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
            <button
              onClick={acceptPicked}
              style={{
                background: '#F4A261', color: '#0d0d0c', border: 'none',
                borderRadius: 10, padding: '12px 28px', fontWeight: 700, fontSize: 14, cursor: 'pointer',
              }}
            >
              Accept Challenge
            </button>
            <button
              onClick={spin}
              style={{
                background: 'transparent', color: 'var(--rc-title,#EFE3CE)',
                border: '1px solid var(--rc-rim,#3A3430)', borderRadius: 10,
                padding: '12px 20px', fontSize: 13, cursor: 'pointer',
              }}
            >
              Re-spin
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
