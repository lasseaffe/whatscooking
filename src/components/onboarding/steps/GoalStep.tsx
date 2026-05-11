'use client'
import { ChoiceCard } from '../ChoiceCard'
import type { WizardStepProps } from '../onboarding.types'

const OPTIONS = [
  { value: 'use-pantry',   emoji: '🛒', label: 'Use what I have' },
  { value: 'discover',     emoji: '💡', label: 'Discover recipes' },
  { value: 'plan-week',    emoji: '🗓️', label: 'Plan my week' },
  { value: 'eat-healthy',  emoji: '🥗', label: 'Eat healthier' },
]

export function GoalStep({ onAnswer, answer, theme }: WizardStepProps) {
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
