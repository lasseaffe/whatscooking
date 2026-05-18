// src/components/plans/cook/CookCheckButton.tsx
'use client';

interface Props {
  cooked: boolean;
  isLeftover: boolean;
  onClick: () => void;
  compact?: boolean;
}

export function CookCheckButton({ cooked, isLeftover, onClick, compact = false }: Props) {
  const label = cooked
    ? (isLeftover ? '♻ Reheated' : '✓ Cooked')
    : (isLeftover ? 'Mark reheated' : 'Mark cooked');
  const verb = isLeftover ? 'reheated' : 'cooked';
  return (
    <button
      onClick={onClick}
      aria-label={`Mark as ${verb}`}
      aria-pressed={cooked}
      className={`shrink-0 self-center rounded-full font-semibold border transition-colors ${compact ? 'text-xs px-3 py-1' : 'text-sm px-4 py-2'}`}
      style={{
        background: cooked ? '#7AA350' : 'transparent',
        borderColor: cooked ? '#7AA350' : '#E67E22',
        color: cooked ? '#1A120A' : '#E67E22',
      }}
    >
      {label}
    </button>
  );
}
