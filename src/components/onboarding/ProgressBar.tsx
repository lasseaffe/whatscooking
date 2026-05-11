'use client'
import { motion } from 'framer-motion'
import type { OnboardingTheme } from './onboarding.types'

interface ProgressBarProps {
  current: number   // 0-based
  total: number
  theme: OnboardingTheme
}

export function ProgressBar({ current, total, theme }: ProgressBarProps) {
  const pct = total > 0 ? Math.min(((current + 1) / total) * 100, 100) : 0
  const isTerminal = theme.motion === 'terminal'
  const isHolyFlex = theme.motion === 'snappy'

  return (
    <div style={{
      height: isTerminal ? 3 : 8,
      background: isTerminal ? '#1a2518' : 'rgba(255,255,255,0.1)',
      borderRadius: isTerminal ? 0 : 4,
      overflow: 'hidden',
      width: '100%',
    }}>
      <motion.div
        style={{
          height: '100%',
          borderRadius: isTerminal ? 0 : 4,
          background: isTerminal
            ? theme.accent
            : isHolyFlex
            ? 'linear-gradient(90deg, #E8547A, #9333EA, #EAB308, #38BDF8)'
            : `linear-gradient(90deg, ${theme.accent}, ${theme.accent}cc)`,
        }}
        initial={{ width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={isTerminal
          ? { duration: 0.05 }
          : { duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
      />
    </div>
  )
}
