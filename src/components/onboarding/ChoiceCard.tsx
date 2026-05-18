'use client'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
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
  index?: number
}

export function ChoiceCard({ option, selected, onSelect, theme, index = 0 }: ChoiceCardProps) {
  const preset = MOTION_PRESETS[theme.motion]
  const [bloomKey, setBloomKey] = useState(0)

  const handleSelect = () => {
    setBloomKey(k => k + 1)
    onSelect(option.value)
  }

  const staggerDelay = theme.motion === 'smooth' ? index * 0.08 : 0

  return (
    <motion.button
      type="button"
      variants={preset.cardVariants}
      initial="initial"
      animate={selected ? preset.cardSelect : {
        ...(typeof preset.cardVariants.animate === 'object' ? preset.cardVariants.animate as object : {}),
        transition: {
          ...(typeof preset.cardVariants.animate === 'object' && 'transition' in (preset.cardVariants.animate as object)
            ? (preset.cardVariants.animate as { transition?: object }).transition
            : {}),
          delay: staggerDelay,
        },
      }}
      exit="exit"
      whileHover={preset.cardHover}
      whileTap={{ scale: 0.97 }}
      onClick={handleSelect}
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
        overflow: 'hidden',
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

      {/* Radial bloom on selection */}
      <AnimatePresence>
        {bloomKey > 0 && (
          <motion.div
            key={bloomKey}
            initial={{ scale: 0, opacity: 0.25 }}
            animate={{ scale: 2.5, opacity: 0 }}
            exit={{}}
            transition={{ duration: 0.35, ease: 'easeOut' }}
            style={{
              position: 'absolute',
              inset: 0,
              borderRadius: 'inherit',
              background: `radial-gradient(circle, ${theme.accent}55, transparent)`,
              pointerEvents: 'none',
            }}
          />
        )}
      </AnimatePresence>

      <span style={{ fontSize: 32, lineHeight: 1, position: 'relative', zIndex: 1 }}>{option.emoji}</span>
      <span style={{
        fontSize: 10.5,
        fontWeight: theme.motion === 'snappy' ? 800 : 600,
        color: selected ? theme.text : theme.textMuted,
        textAlign: 'center',
        lineHeight: 1.3,
        fontFamily: theme.motion === 'terminal' ? "'JetBrains Mono', monospace" : undefined,
        textTransform: theme.motion === 'terminal' ? ('uppercase' as const) : undefined,
        letterSpacing: theme.motion === 'terminal' ? '0.5px' : undefined,
        position: 'relative',
        zIndex: 1,
      }}>
        {option.label}
      </span>
    </motion.button>
  )
}
