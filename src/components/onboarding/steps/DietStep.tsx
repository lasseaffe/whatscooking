'use client'
import { ChoiceCard } from '../ChoiceCard'
import type { WizardStepProps } from '../onboarding.types'

const OPTIONS = [
  { value: 'plant-based',  emoji: '🌱', label: 'Plant-based' },
  { value: 'gluten-free',  emoji: '🌾', label: 'Gluten-free' },
  { value: 'meat-lover',   emoji: '🥩', label: 'Meat lover' },
  { value: 'no-limits',    emoji: '✓',  label: 'No limits' },
]

export function DietStep({ onAnswer, answer, theme }: WizardStepProps) {
  const selected = Array.isArray(answer) ? answer : answer ? [answer] : []

  const handleSelect = (val: string) => {
    if (val === 'no-limits') { onAnswer([val]); return }
    const next = selected.includes(val)
      ? selected.filter(v => v !== val)
      : [...selected.filter(v => v !== 'no-limits'), val]
    onAnswer(next.length > 0 ? next : [])
  }

  return (
    <div>
      <p style={{ color: theme.textMuted, fontSize: 11, marginBottom: 10, fontFamily: 'Georgia, serif' }}>
        Select all that apply
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 9 }}>
        {OPTIONS.map((opt, i) => (
          <ChoiceCard
            key={opt.value}
            option={opt}
            selected={selected.includes(opt.value)}
            onSelect={handleSelect}
            theme={theme}
            index={i}
          />
        ))}
      </div>
    </div>
  )
}
