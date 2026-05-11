// src/components/onboarding/TooltipBubble.tsx
'use client'
import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { OnboardingTheme } from './onboarding.types'

interface TooltipBubbleProps {
  target: string
  title: string
  body: string
  position?: 'top' | 'bottom' | 'left' | 'right'
  theme: OnboardingTheme
  visible: boolean
  stepLabel: string
  isDoStep: boolean
  onNext: () => void
  nextLabel?: string
}

function useTooltipPosition(
  target: string,
  visible: boolean,
  position: 'top' | 'bottom' | 'left' | 'right'
): { top: number; left: number } | null {
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null)

  useEffect(() => {
    if (!visible) return
    const el = document.querySelector(target)
    if (!el) return
    const r = el.getBoundingClientRect()
    const TOOLTIP_H = 160, TOOLTIP_W = 280, GAP = 16

    const positions = {
      bottom: { top: r.bottom + GAP, left: r.left + r.width / 2 - TOOLTIP_W / 2 },
      top:    { top: r.top - TOOLTIP_H - GAP, left: r.left + r.width / 2 - TOOLTIP_W / 2 },
      right:  { top: r.top + r.height / 2 - TOOLTIP_H / 2, left: r.right + GAP },
      left:   { top: r.top + r.height / 2 - TOOLTIP_H / 2, left: r.left - TOOLTIP_W - GAP },
    }
    const chosen = positions[position]
    chosen.left = Math.max(12, Math.min(window.innerWidth - TOOLTIP_W - 12, chosen.left))
    chosen.top  = Math.max(12, Math.min(window.innerHeight - TOOLTIP_H - 12, chosen.top))
    setPos(chosen)
  }, [target, visible, position])

  return pos
}

export function TooltipBubble({ target, title, body, position = 'bottom', theme, visible, stepLabel, isDoStep, onNext, nextLabel }: TooltipBubbleProps) {
  const pos = useTooltipPosition(target, visible, position)

  return (
    <AnimatePresence>
      {visible && pos && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: position === 'bottom' ? -8 : 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={{ type: 'spring', stiffness: 400, damping: 28 }}
          style={{
            position: 'fixed',
            top: pos.top, left: pos.left,
            width: 280, zIndex: 9999,
            background: '#fff',
            borderRadius: 12,
            padding: 16,
            boxShadow: '0 8px 32px rgba(0,0,0,0.25)',
          }}
        >
          <div style={{ fontSize: 9, color: '#aaa', marginBottom: 6, fontFamily: "'JetBrains Mono', monospace", letterSpacing: 1 }}>
            {stepLabel}
          </div>
          <h3 style={{ fontSize: 14, fontWeight: 800, color: '#111', margin: '0 0 6px' }}>{title}</h3>
          <p style={{ fontSize: 12, color: '#555', lineHeight: 1.5, margin: '0 0 12px' }}>{body}</p>
          {!isDoStep && (
            <button
              type="button"
              onClick={onNext}
              style={{
                width: '100%', border: 'none', borderRadius: 8, padding: '9px 0',
                background: `linear-gradient(135deg, ${theme.accent}, ${theme.accent}cc)`,
                color: '#fff', fontWeight: 700, fontSize: 12, cursor: 'pointer',
              }}
            >
              {nextLabel ?? 'Next →'}
            </button>
          )}
          {isDoStep && (
            <p style={{ fontSize: 11, color: theme.accent, fontWeight: 700, textAlign: 'center', margin: 0 }}>
              ↑ Try it above
            </p>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  )
}
