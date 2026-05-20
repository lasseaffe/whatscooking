'use client';

interface LeaderboardEntry {
  user_id: string;
  name: string | null;
  count: number;
  is_me: boolean;
}

interface Props {
  entries: LeaderboardEntry[];
}

export function Leaderboard({ entries }: Props) {
  const sorted = [...entries].sort((a, b) => b.count - a.count);
  const myRank = sorted.findIndex(e => e.is_me) + 1;
  const myEntry = sorted.find(e => e.is_me);

  return (
    <div>
      <div style={{ color: 'var(--rc-title,#EFE3CE)', fontSize: 13, fontWeight: 700, marginBottom: 12 }}>
        🏆 This Week
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {sorted.slice(0, 10).map((e, i) => (
          <div key={e.user_id} style={{
            background: e.is_me ? '#1a1208' : 'var(--rc-surface,#1F1B19)',
            border: `${e.is_me ? '2px' : '1px'} solid ${e.is_me ? '#F4A261' : 'var(--rc-rim,#3A3430)'}`,
            borderRadius: 10, padding: '10px 14px',
            display: 'flex', alignItems: 'center', gap: 12,
          }}>
            <span style={{ color: i === 0 ? '#F4A261' : 'var(--fg-tertiary,#9c9c9b)', fontWeight: 800, fontSize: 14, width: 20 }}>
              {i + 1}
            </span>
            <div style={{
              width: 28, height: 28, background: e.is_me ? '#F4A261' : 'var(--rc-rim,#3A3430)',
              borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12,
            }}>
              {e.is_me ? '🧑' : '👤'}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ color: e.is_me ? '#F4A261' : 'var(--rc-title,#EFE3CE)', fontSize: 12, fontWeight: 600 }}>
                {e.is_me ? 'You' : (e.name ?? 'Member')}
              </div>
              <div style={{ color: 'var(--fg-tertiary,#9c9c9b)', fontSize: 10 }}>{e.count} this week</div>
            </div>
            <span style={{ color: e.is_me ? '#F4A261' : 'var(--fg-tertiary,#9c9c9b)', fontSize: 11, fontWeight: 700 }}>
              🔥 {e.count}
            </span>
          </div>
        ))}
        {myEntry && myRank > 10 && (
          <div style={{
            background: '#1a1208', border: '2px solid #F4A261', borderRadius: 10, padding: '10px 14px',
            display: 'flex', alignItems: 'center', gap: 12,
          }}>
            <span style={{ color: 'var(--fg-tertiary,#9c9c9b)', fontWeight: 800, fontSize: 14, width: 20 }}>{myRank}</span>
            <div style={{ width: 28, height: 28, background: '#F4A261', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12 }}>🧑</div>
            <div style={{ flex: 1 }}>
              <div style={{ color: '#F4A261', fontSize: 12, fontWeight: 600 }}>You</div>
              <div style={{ color: 'var(--fg-tertiary,#9c9c9b)', fontSize: 10 }}>{myEntry.count} this week</div>
            </div>
            <span style={{ color: '#F4A261', fontSize: 11, fontWeight: 700 }}>🔥 {myEntry.count}</span>
          </div>
        )}
      </div>
    </div>
  );
}
