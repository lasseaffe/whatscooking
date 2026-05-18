'use client';

import { useState } from 'react';
import type { PinboardFilters } from '@/app/(app)/plans/[id]/use-planner-state';

interface Props {
  filters: PinboardFilters;
  onChange: (patch: Partial<PinboardFilters>) => void;
}

const DIET_OPTIONS = ['vegan', 'vegetarian', 'gluten-free', 'dairy-free', 'pescatarian', 'keto'];

export function ConstraintChipBar({ filters, onChange }: Props) {
  const [open, setOpen] = useState<string | null>(null);

  const close = () => setOpen(null);

  return (
    <div
      className="sticky top-0 z-10 flex flex-wrap gap-2 py-3 px-4 -mx-4 backdrop-blur-md"
      style={{ background: 'rgba(26,18,10,0.85)', borderBottom: '1px solid #2A1F14' }}
    >
      <Chip
        active={filters.diet.length > 0}
        label={filters.diet.length > 0 ? `Diet: ${filters.diet.join(', ')}` : 'Diet'}
        onClick={() => setOpen(open === 'diet' ? null : 'diet')}
      />
      {open === 'diet' && (
        <Popover onClose={close}>
          {DIET_OPTIONS.map(d => (
            <label key={d} className="flex items-center gap-2 py-1 text-sm" style={{ color: '#EFE3CE' }}>
              <input
                type="checkbox"
                checked={filters.diet.includes(d)}
                onChange={e => {
                  const next = e.target.checked
                    ? [...filters.diet, d]
                    : filters.diet.filter(x => x !== d);
                  onChange({ diet: next });
                }}
              />
              {d}
            </label>
          ))}
        </Popover>
      )}

      <Chip
        active
        label={`Weeknight ≤${filters.time_weeknight}m`}
        onClick={() => setOpen(open === 'time-week' ? null : 'time-week')}
      />
      {open === 'time-week' && (
        <Popover onClose={close}>
          <NumberSlider value={filters.time_weeknight} onChange={v => onChange({ time_weeknight: v })} min={10} max={90} step={5} />
        </Popover>
      )}

      <Chip
        active
        label={`Weekend ≤${filters.time_weekend}m`}
        onClick={() => setOpen(open === 'time-end' ? null : 'time-end')}
      />
      {open === 'time-end' && (
        <Popover onClose={close}>
          <NumberSlider value={filters.time_weekend} onChange={v => onChange({ time_weekend: v })} min={30} max={240} step={15} />
        </Popover>
      )}

      <Chip
        active
        label={`Squad ${filters.squad_size}`}
        onClick={() => setOpen(open === 'squad' ? null : 'squad')}
      />
      {open === 'squad' && (
        <Popover onClose={close}>
          <NumberSlider value={filters.squad_size} onChange={v => onChange({ squad_size: v })} min={1} max={8} step={1} />
        </Popover>
      )}

      <ToggleChip
        active={filters.pantry_aware}
        label={`Pantry-aware${filters.pantry_aware ? ` (≤${filters.pantry_missing_max} missing)` : ''}`}
        onClick={() => onChange({ pantry_aware: !filters.pantry_aware })}
      />

      <Chip
        active
        label={`Anti-repeat: ${filters.anti_repeat}`}
        onClick={() => setOpen(open === 'rep' ? null : 'rep')}
      />
      {open === 'rep' && (
        <Popover onClose={close}>
          {(['strict','moderate','off'] as const).map(v => (
            <button key={v} onClick={() => { onChange({ anti_repeat: v }); close(); }} className="block w-full text-left py-1 px-2 text-sm" style={{ color: filters.anti_repeat === v ? '#E67E22' : '#EFE3CE' }}>
              {v}
            </button>
          ))}
        </Popover>
      )}

      <ToggleChip
        active={filters.batch_enabled}
        label="🍳 Batch / leftovers"
        onClick={() => onChange({ batch_enabled: !filters.batch_enabled })}
      />
    </div>
  );
}

function Chip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="px-3 py-1.5 rounded-full text-sm border transition-colors"
      style={{
        background: active ? '#2A1F14' : 'transparent',
        borderColor: active ? '#E67E22' : '#3A2A1A',
        color: active ? '#E67E22' : '#8A6A4A',
      }}
    >
      {label}
    </button>
  );
}

function ToggleChip(props: { active: boolean; label: string; onClick: () => void }) {
  return <Chip {...props} />;
}

function Popover({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <>
      <div className="fixed inset-0 z-20" onClick={onClose} />
      <div
        className="absolute z-30 mt-12 p-3 rounded-lg border shadow-lg"
        style={{ background: '#1A120A', borderColor: '#3A2A1A', minWidth: 200 }}
      >
        {children}
      </div>
    </>
  );
}

function NumberSlider({ value, onChange, min, max, step }: { value: number; onChange: (v: number) => void; min: number; max: number; step: number }) {
  return (
    <div className="flex flex-col gap-2">
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={e => onChange(parseInt(e.target.value))}
        className="w-full"
      />
      <span className="text-xs text-center" style={{ color: '#E67E22' }}>{value}</span>
    </div>
  );
}
