'use client';

interface Props {
  cookMinutes: number;
  hasLeftover: boolean;
  pantryPct: number;
}

export function DayDensityRibbon({ cookMinutes, hasLeftover, pantryPct }: Props) {
  const cookPct = Math.min(1, cookMinutes / 120);
  const leftoverPct = hasLeftover ? 1 : 0;
  const pantryNorm = Math.max(0, Math.min(1, pantryPct));

  if (cookPct < 0.05 && leftoverPct === 0 && pantryNorm < 0.05) return null;

  const tooltip = [
    cookMinutes > 0 ? `${cookMinutes} min active cooking` : 'no cooking',
    hasLeftover ? 'leftover day' : 'no leftovers',
    `${Math.round(pantryNorm * 100)}% from pantry`,
  ].join(' · ');

  return (
    <div className="flex flex-col gap-0.5 pt-1 pb-2" title={tooltip}>
      <div className="h-1 rounded-full overflow-hidden" style={{ background: '#2A1F14' }} aria-label={`cook time: ${cookMinutes} min`}>
        <div className="h-full transition-all" style={{ width: `${cookPct * 100}%`, background: '#E67E22' }} />
      </div>
      <div className="h-1 rounded-full overflow-hidden" style={{ background: '#2A1F14' }} aria-label={hasLeftover ? 'leftover day' : 'no leftovers'}>
        <div className="h-full transition-all" style={{ width: `${leftoverPct * 100}%`, background: '#7AA350' }} />
      </div>
      <div className="h-1 rounded-full overflow-hidden" style={{ background: '#2A1F14' }} aria-label={`pantry coverage: ${Math.round(pantryNorm * 100)}%`}>
        <div className="h-full transition-all" style={{ width: `${pantryNorm * 100}%`, background: '#C8A882' }} />
      </div>
    </div>
  );
}
