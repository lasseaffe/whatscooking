'use client'
import { motion } from 'framer-motion'
import type { OnboardingTheme } from './onboarding.types'
import { MOTION_PRESETS } from './onboarding.motion'

export interface ChoiceCardOption {
  value: string
  emoji: string
  label: string
  color?: string
  selectedBg?: string
  selectedBorder?: string
}

interface ChoiceCardProps {
  option: ChoiceCardOption
  selected: boolean
  onSelect: (value: string) => void
  theme: OnboardingTheme
}

export function ChoiceCard({ option, selected, onSelect, theme }: ChoiceCardProps) {
  const preset = MOTION_PRESETS[theme.motion]

  return (
    <motion.button
      type="button"
      variants={preset.cardVariants}
      initial="initial"
      animate={selected ? preset.cardSelect : 'animate'}
      exit="exit"
      whileHover={preset.cardHover}
      whileTap={{ scale: 0.97 }}
      onClick={() => onSelect(option.value)}
      style={{
        background: selected ? (option.selectedBg ?? theme.surface) : theme.surface,
        border: `2px solid ${selected ? (option.selectedBorder ?? theme.accent) : 'rgba(255,255,255,0.08)'}`,
        borderRadius: 14,
        padding: '16px 12px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 8,
        cursor: 'pointer',
        width: '100%',
        boxShadow: selected ? `0 0 16px ${theme.accent}33` : 'none',
        transition: theme.motion === 'terminal' ? 'all 0.12s steps(3, end)' : undefined,
        position: 'relative',
      }}
    >
      {theme.motion === 'terminal' && selected && (
        <span aria-hidden="true" style={{
          position: 'absolute', top: 4, right: 6,
          fontFamily: "'JetBrains Mono', monospace", fontSize: 7,
          color: theme.accent, letterSpacing: 1,
        }}>
          [SELECTED]
        </span>
      )}

      <span style={{ fontSize: 32, lineHeight: 1 }}>{option.emoji}</span>
      <span style={{
        fontSize: 10.5,
        fontWeight: theme.motion === 'snappy' ? 800 : 600,
        color: selected ? theme.text : theme.textMuted,
        textAlign: 'center',
        lineHeight: 1.3,
        fontFamily: theme.motion === 'terminal' ? "'JetBrains Mono', monospace" : undefined,
        textTransform: theme.motion === 'terminal' ? 'uppercase' : undefined,
        letterSpacing: theme.motion === 'terminal' ? '0.5px' : undefined,
      }}>
        {option.label}
      </span>
    </motion.button>
  )
}
