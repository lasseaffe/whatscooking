// src/components/plans/cook/CookHeader.tsx
'use client';

import type { CookProgress } from '@/lib/plans/cook-progress';

interface Props {
  title: string;
  status: string;
  progress: CookProgress;
}

export function CookHeader({ title, status, progress }: Props) {
  const pct = Math.round(progress.pctComplete * 100);
  return (
    <header className="flex flex-col gap-3">
      <div className="flex items-baseline justify-between gap-4">
        <h1 className="text-2xl font-serif" style={{ color: '#EFE3CE' }}>{title}</h1>
        <span
          className="px-3 py-1 rounded-full text-xs uppercase tracking-wider border"
          style={{ borderColor: '#3A2A1A', color: '#E67E22' }}
        >
          {status}
        </span>
      </div>
      <div className="flex items-center gap-3">
        <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: '#2A1F14' }}>
          <div className="h-full transition-all" style={{ width: `${pct}%`, background: '#E67E22' }} />
        </div>
        <span className="text-sm font-mono whitespace-nowrap" style={{ color: '#EFE3CE' }}>
          {progress.cooked} / {progress.total} cooked
        </span>
        {progress.reheated > 0 && (
          <span className="text-xs whitespace-nowrap" style={{ color: '#7AA350' }}>
            · ♻ {progress.reheated} reheated
          </span>
        )}
      </div>
    </header>
  );
}
