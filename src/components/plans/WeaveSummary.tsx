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

export function WeaveSummary({ summary, weaving, canUndo, onReweave, onUndo, onStartCooking }: Props) {
  const pantryPct = Math.round(summary.pantry_pct * 100);
  const hours = Math.floor(summary.active_minutes / 60);
  const mins = summary.active_minutes % 60;
  const varietyLabel = summary.variety_score >= 0.7 ? 'high' : summary.variety_score >= 0.4 ? 'medium' : 'low';

  return (
    <div
      className="flex flex-wrap items-center gap-4 px-4 py-3 rounded-lg border"
      style={{ background: '#1A120A', borderColor: '#3A2A1A' }}
    >
      <span className="text-sm flex items-center gap-1" style={{ color: '#EFE3CE' }}>
        🥕 <span style={{ color: '#E67E22' }}>{pantryPct}%</span> pantry
      </span>
      <span className="text-sm" style={{ color: '#8A6A4A' }}>·</span>
      <span className="text-sm flex items-center gap-1" style={{ color: '#EFE3CE' }}>
        ⏱ {hours > 0 ? `${hours}h ${mins}m` : `${mins}m`}
      </span>
      <span className="text-sm" style={{ color: '#8A6A4A' }}>·</span>
      <span className="text-sm flex items-center gap-1" style={{ color: '#EFE3CE' }}>
        🔁 variety: <span style={{ color: '#E67E22' }}>{varietyLabel}</span>
      </span>
      {summary.leftover_count > 0 && (
        <>
          <span className="text-sm" style={{ color: '#8A6A4A' }}>·</span>
          <span className="text-sm flex items-center gap-1" style={{ color: '#7AA350' }}>
            ♻ {summary.leftover_count} leftover
          </span>
        </>
      )}
      <div className="ml-auto flex gap-2">
        {canUndo && (
          <button onClick={onUndo} className="text-xs px-3 py-1.5 rounded border" style={{ borderColor: '#3A2A1A', color: '#8A6A4A' }}>
            ↶ undo
          </button>
        )}
        <button
          disabled={weaving}
          onClick={onReweave}
          className="text-xs px-3 py-1.5 rounded border transition-colors disabled:opacity-40"
          style={{ borderColor: '#E67E22', color: '#E67E22' }}
        >
          🔀 reweave
        </button>
        <button
          onClick={onStartCooking}
          className="text-xs px-3 py-1.5 rounded font-semibold"
          style={{ background: '#E67E22', color: '#1A120A' }}
        >
          🛒 start cooking →
        </button>
      </div>
    </div>
  );
}
