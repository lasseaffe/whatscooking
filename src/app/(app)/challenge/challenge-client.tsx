'use client';

import { useState } from 'react';
import type { ChallengeDef, ChallengeCompletion } from './types';
import { ChallengeHero } from './components/challenge-hero';
import { ChallengeCarousel } from './components/challenge-carousel';
import { BadgeWall } from './components/badge-wall';
import { HistoryLog } from './components/history-log';
import { Leaderboard } from './components/leaderboard';
import { FriendsFeed } from './components/friends-feed';

type Tab = 'browse' | 'progress' | 'social';

interface LeaderboardEntry {
  user_id: string;
  name: string | null;
  count: number;
  is_me: boolean;
}

interface CompletionWithReactions extends ChallengeCompletion {
  reaction_count: number;
  i_reacted: boolean;
}

interface Props {
  allChallenges: ChallengeDef[];
  byCategory: Record<string, ChallengeDef[]>;
  daily: ChallengeDef | null;
  completions: ChallengeCompletion[];
  leaderboard: LeaderboardEntry[];
  householdFeed: CompletionWithReactions[];
  currentUserId: string;
  streakDays: number;
}

const CATEGORIES: ChallengeDef['category'][] = ['handicap', 'appliance', 'speedrun', 'wildcard', 'dare'];

export function ChallengeClient({
  allChallenges, byCategory, daily, completions,
  leaderboard, householdFeed, currentUserId, streakDays,
}: Props) {
  const [tab, setTab] = useState<Tab>('browse');
  const [refreshKey, setRefreshKey] = useState(0);

  function handleAccepted() {
    setRefreshKey(k => k + 1);
  }

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '28px 20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
        <div>
          <div style={{ color: 'var(--fg-tertiary,#9c9c9b)', fontSize: 11, letterSpacing: '2px', textTransform: 'uppercase' as const, marginBottom: 4 }}>
            What&apos;s Cooking
          </div>
          <h1 style={{ color: 'var(--rc-title,#EFE3CE)', margin: 0 }}>Challenge Mode</h1>
        </div>
        {streakDays > 0 && (
          <div style={{
            background: 'var(--rc-surface,#1F1B19)', border: '1px solid var(--rc-rim,#3A3430)',
            borderRadius: 10, padding: '8px 14px', color: '#F4A261', fontSize: 12, fontWeight: 600,
          }}>
            🔥 {streakDays}-day streak
          </div>
        )}
      </div>

      <ChallengeHero key={`hero-${refreshKey}`} challenges={allChallenges} daily={daily} onAccepted={handleAccepted} />

      <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid var(--border-primary,#272726)', marginBottom: 24 }}>
        {(['browse', 'progress', 'social'] as Tab[]).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              padding: '10px 20px 10px 0',
              fontSize: 13, fontWeight: 600, cursor: 'pointer',
              background: 'none', border: 'none',
              color: tab === t ? '#F4A261' : 'var(--fg-tertiary,#9c9c9b)',
              borderBottom: tab === t ? '2px solid #F4A261' : '2px solid transparent',
              marginBottom: -1,
            }}
          >
            {t === 'browse' ? 'Browse' : t === 'progress' ? 'My Progress' : 'Social'}
          </button>
        ))}
      </div>

      {tab === 'browse' && (
        <div>
          {CATEGORIES.map(cat =>
            (byCategory[cat]?.length ?? 0) > 0 && (
              <ChallengeCarousel
                key={cat}
                category={cat}
                challenges={byCategory[cat]}
                onAccepted={handleAccepted}
              />
            )
          )}
        </div>
      )}

      {tab === 'progress' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
          <div style={{
            background: 'linear-gradient(135deg,#1a1208,#160e04)',
            border: '1px solid var(--rc-rim,#3A3430)',
            borderRadius: 12, padding: 20,
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <div>
              <div style={{ color: '#F4A261', fontSize: 26, fontWeight: 800, lineHeight: 1 }}>🔥 {streakDays}</div>
              <div style={{ color: 'var(--rc-meta,#A08060)', fontSize: 11, marginTop: 2 }}>day streak</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ color: 'var(--rc-title,#EFE3CE)', fontSize: 20, fontWeight: 700 }}>{completions.length}</div>
              <div style={{ color: 'var(--fg-tertiary,#9c9c9b)', fontSize: 11 }}>completed</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ color: 'var(--rc-title,#EFE3CE)', fontSize: 20, fontWeight: 700 }}>
                {new Set(completions.map(c => c.challenge?.category).filter(Boolean)).size}
              </div>
              <div style={{ color: 'var(--fg-tertiary,#9c9c9b)', fontSize: 11 }}>categories</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ color: 'var(--rc-title,#EFE3CE)', fontSize: 20, fontWeight: 700 }}>
                #{leaderboard.findIndex(e => e.is_me) + 1 || '–'}
              </div>
              <div style={{ color: 'var(--fg-tertiary,#9c9c9b)', fontSize: 11 }}>leaderboard</div>
            </div>
          </div>
          <BadgeWall allChallenges={allChallenges} completions={completions} />
          <HistoryLog completions={completions} />
        </div>
      )}

      {tab === 'social' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
          <Leaderboard entries={leaderboard} />
          <div>
            <div style={{ color: 'var(--rc-title,#EFE3CE)', fontSize: 13, fontWeight: 700, marginBottom: 12 }}>
              👥 Household Activity
            </div>
            <FriendsFeed completions={householdFeed} currentUserId={currentUserId} />
          </div>
        </div>
      )}
    </div>
  );
}
