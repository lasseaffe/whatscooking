'use client'
import { ChoiceCard } from '../ChoiceCard'
import type { WizardStepProps } from '../onboarding.types'

const OPTIONS = [
  { value: '1',    emoji: '🧑',    label: 'Just me' },
  { value: '2',    emoji: '👫',    label: 'Two of us' },
  { value: '3-4',  emoji: '👨‍👩‍👧', label: 'Small family' },
  { value: '5+',   emoji: '🏠',    label: 'Big household' },
]

export function HouseholdStep({ onAnswer, answer, theme }: WizardStepProps) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 9 }}>
      {OPTIONS.map(opt => (
        <ChoiceCard
          key={opt.value}
          option={opt}
          selected={answer === opt.value}
          onSelect={onAnswer}
          theme={theme}
        />
      ))}
    </div>
  )
}
