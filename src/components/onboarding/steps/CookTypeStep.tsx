'use client'
import { ChoiceCard } from '../ChoiceCard'
import type { WizardStepProps } from '../onboarding.types'

const OPTIONS = [
  { value: 'beginner',    emoji: '🍳', label: 'Starting out' },
  { value: 'home-cook',   emoji: '🔪', label: 'Home cook' },
  { value: 'enthusiast',  emoji: '👨‍🍳', label: 'Enthusiast' },
  { value: 'family-chef', emoji: '🍽️', label: 'Family chef' },
]

export function CookTypeStep({ onAnswer, answer, theme }: WizardStepProps) {
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
