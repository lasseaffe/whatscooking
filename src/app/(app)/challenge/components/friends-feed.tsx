'use client';

import { useState } from 'react';
import type { ChallengeCompletion } from '../types';
import { DIFFICULTY_COLOR } from '../utils';

interface CompletionWithReactions extends ChallengeCompletion {
  reaction_count: number;
  i_reacted: boolean;
}

interface Props {
  completions: CompletionWithReactions[];
  currentUserId: string;
  onChallengeThem?: (challengeId: string) => void;
}

export function FriendsFeed({ completions, currentUserId, onChallengeThem }: Props) {
  const [reactions, setReactions] = useState<Record<string, { count: number; iReacted: boolean }>>(
    Object.fromEntries(completions.map(c => [c.id, { count: c.reaction_count, iReacted: c.i_reacted }]))
  );

  async function toggleReaction(completionId: string) {
    const current = reactions[completionId] ?? { count: 0, iReacted: false };
    setReactions(r => ({ ...r, [completionId]: { count: current.iReacted ? current.count - 1 : current.count + 1, iReacted: !current.iReacted } }));

    const method = current.iReacted ? 'DELETE' : 'POST';
    await fetch('/api/challenge/reactions', {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ completion_id: completionId }),
    });
  }

  if (completions.length === 0) {
    return (
      <div style={{ color: 'var(--fg-tertiary,#9c9c9b)', fontSize: 13, padding: '20px 0', textAlign: 'center' }}>
        No household activity yet. Get your household cooking!
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {completions.map(c => {
        const diff = c.challenge ? DIFFICULTY_COLOR[c.challenge.difficulty] : null;
        const r = reactions[c.id] ?? { count: 0, iReacted: false };
        const isOwnPost = c.user_id === currentUserId;

        return (
          <div key={c.id} style={{
            background: 'var(--rc-surface,#1F1B19)',
            border: '1px solid var(--rc-rim,#3A3430)',
            borderRadius: 12, padding: 14,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <div style={{
                  width: 28, height: 28, background: 'var(--rc-rim,#3A3430)',
                  borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12,
                }}>
                  👤
                </div>
                <div>
                  <div style={{ color: 'var(--rc-title,#EFE3CE)', fontSize: 12, fontWeight: 600 }}>
                    {isOwnPost ? 'You' : (c.completer_name ?? 'Member')}
                  </div>
                  <div style={{ color: 'var(--fg-tertiary,#9c9c9b)', fontSize: 10 }}>
                    {new Date(c.completed_at).toLocaleString()}
                  </div>
                </div>
              </div>
              {diff && (
                <span style={{ background: diff.bg, color: diff.text, fontSize: 9, padding: '2px 8px', borderRadius: 20, fontWeight: 600 }}>
                  {diff.label}
                </span>
              )}
            </div>

            {c.proof_url && (
              <div style={{ marginBottom: 10, borderRadius: 8, overflow: 'hidden' }}>
                {c.proof_url.endsWith('.mp4') ? (
                  <video src={c.proof_url} autoPlay muted loop playsInline style={{ width: '100%', maxHeight: 200, objectFit: 'cover' }} />
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={c.proof_url} alt="Challenge proof" style={{ width: '100%', maxHeight: 200, objectFit: 'cover' }} />
                )}
              </div>
            )}

            <div style={{ color: 'var(--rc-title,#EFE3CE)', fontSize: 12, fontWeight: 600 }}>
              {c.challenge?.emoji} {c.challenge?.title ?? 'Challenge'}
            </div>
            {c.note && (
              <div style={{ color: 'var(--fg-tertiary,#9c9c9b)', fontSize: 11, marginTop: 4 }}>
                &ldquo;{c.note}&rdquo;
              </div>
            )}

            <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
              <button
                onClick={() => toggleReaction(c.id)}
                style={{
                  background: r.iReacted ? '#2A1808' : 'transparent',
                  border: '1px solid var(--rc-rim,#3A3430)',
                  borderRadius: 7, padding: '5px 12px',
                  color: r.iReacted ? '#F4A261' : 'var(--fg-tertiary,#9c9c9b)',
                  fontSize: 11, cursor: 'pointer',
                }}
              >
                👏 {r.count}
              </button>
              {!isOwnPost && c.challenge_id && (
                <button
                  onClick={() => onChallengeThem?.(c.challenge_id)}
                  style={{
                    background: 'transparent',
                    border: '1px solid var(--rc-rim,#3A3430)',
                    borderRadius: 7, padding: '5px 12px',
                    color: 'var(--fg-tertiary,#9c9c9b)',
                    fontSize: 11, cursor: 'pointer',
                  }}
                >
                  ⚔️ Challenge them
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
