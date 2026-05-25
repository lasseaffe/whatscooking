'use client';

import type { WeaveSummary as Summary } from '@/lib/weave-solver';

interface Props {
  summary: Summary;
  weaving: boolean;
  canUndo: boolean;
  onReweave: () => void;
  onUndo: () => void;
  onStartCooking: () => void;
}

const MONO = "var(--font-geist-mono, ui-monospace, monospace)";

function Stat({ k, v, warn }: { k: string; v: string; warn?: boolean }) {
  return (
    <div className="flex flex-col">
      <span style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.13em', textTransform: 'uppercase', color: '#6E573D' }}>{k}</span>
      <span style={{ fontFamily: MONO, fontSize: 17, color: warn ? '#E67E22' : '#EFE3CE', marginTop: 2 }}>{v}</span>
    </div>
  );
}

export function WeaveSummary({ summary, weaving, canUndo, onReweave, onUndo, onStartCooking }: Props) {
  const pantryPct = Math.round(summary.pantry_pct * 100);
  const hours = Math.floor(summary.active_minutes / 60);
  const mins = summary.active_minutes % 60;
  const varietyLabel = summary.variety_score >= 0.7 ? 'high' : summary.variety_score >= 0.4 ? 'medium' : 'low';
  const varietyWarn = summary.variety_score < 0.4;

  return (
    <div
      className="flex flex-wrap items-center gap-x-7 gap-y-3 px-5 py-4 rounded-2xl"
      style={{ background: '#15100B', border: '1px solid #2A1E13' }}
    >
      <Stat k="🥕 Pantry" v={`${pantryPct}%`} warn={pantryPct === 0} />
      <Stat k="⏱ Active time" v={hours > 0 ? `${hours}h ${mins}m` : `${mins}m`} />
      <Stat k="↻ Variety" v={varietyLabel} warn={varietyWarn} />
      {summary.leftover_count > 0 && (
        <div className="flex flex-col">
          <span style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.13em', textTransform: 'uppercase', color: '#6E573D' }}>♻ Leftovers</span>
          <span style={{ fontFamily: MONO, fontSize: 17, color: '#AEB873', marginTop: 2 }}>{summary.leftover_count}</span>
        </div>
      )}
      <div className="ml-auto flex items-center gap-2.5">
        {canUndo && (
          <button onClick={onUndo} className="rounded-xl font-semibold" style={{ fontFamily: 'inherit', fontSize: 13, padding: '11px 16px', border: '1px solid #3A2A1B', background: '#241A11', color: '#9A7E5E' }}>
            ↶ undo
          </button>
        )}
        <button
          disabled={weaving}
          onClick={onReweave}
          className="rounded-xl font-semibold transition-colors disabled:opacity-40"
          style={{ fontSize: 13, padding: '11px 18px', border: '1px solid #3A2A1B', background: '#241A11', color: '#EFE3CE' }}
        >
          🔀 Reweave
        </button>
        <button
          onClick={onStartCooking}
          className="rounded-xl font-bold inline-flex items-center gap-2"
          style={{ fontSize: 14, padding: '11px 22px', background: '#E67E22', color: '#0C0907' }}
        >
          🍳 Start cooking →
        </button>
      </div>
    </div>
  );
}
