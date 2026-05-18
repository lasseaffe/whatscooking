// src/components/onboarding/TooltipBubble.tsx
'use client'
import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { OnboardingTheme } from './onboarding.types'

interface TooltipBubbleProps {
  target: string
  title: string
  body: string
  icon?: string
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
    const TOOLTIP_H = 200, TOOLTIP_W = 260, GAP = 16, MARGIN = 12

    const compute = () => {
      const r = el.getBoundingClientRect()
      const vw = window.innerWidth
      const vh = window.innerHeight

      if (r.width > vw * 0.7 || r.height > vh * 0.7) {
        setPos({
          top:  Math.round(vh / 2 - TOOLTIP_H / 2),
          left: Math.round(vw / 2 - TOOLTIP_W / 2),
        })
        return
      }

      const positions = {
        bottom: { top: r.bottom + GAP, left: r.left + r.width / 2 - TOOLTIP_W / 2 },
        top:    { top: r.top - TOOLTIP_H - GAP, left: r.left + r.width / 2 - TOOLTIP_W / 2 },
        right:  { top: r.top + r.height / 2 - TOOLTIP_H / 2, left: r.right + GAP },
        left:   { top: r.top + r.height / 2 - TOOLTIP_H / 2, left: r.left - TOOLTIP_W - GAP },
      }
      const chosen = { ...positions[position] }
      chosen.left = Math.max(MARGIN, Math.min(vw - TOOLTIP_W - MARGIN, chosen.left))
      chosen.top  = Math.max(MARGIN, Math.min(vh - TOOLTIP_H - MARGIN, chosen.top))
      setPos(chosen)
    }

    compute()
    const ro = new ResizeObserver(compute)
    ro.observe(el)
    window.addEventListener('scroll', compute, { passive: true })
    window.addEventListener('resize', compute)

    return () => {
      ro.disconnect()
      window.removeEventListener('scroll', compute)
      window.removeEventListener('resize', compute)
    }
  }, [target, visible, position])

  return pos
}

function entranceVariants(position: 'top' | 'bottom' | 'left' | 'right') {
  const offsets = { right: { x: -12, y: 0 }, left: { x: 12, y: 0 }, bottom: { x: 0, y: -10 }, top: { x: 0, y: 10 } }
  const { x, y } = offsets[position]
  return {
    initial: { opacity: 0, x, y },
    animate: { opacity: 1, x: 0, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] } },
    exit:    { opacity: 0, transition: { duration: 0.2 } },
  }
}

export function TooltipBubble({ target, title, body, icon, position = 'bottom', theme, visible, stepLabel, isDoStep, onNext, nextLabel }: TooltipBubbleProps) {
  const pos = useTooltipPosition(target, visible, position)
  const variants = entranceVariants(position)

  return (
    <AnimatePresence>
      {visible && pos && (
        <motion.div
          initial={variants.initial}
          animate={variants.animate}
          exit={variants.exit}
          style={{
            position: 'fixed',
            top: pos.top, left: pos.left,
            width: 260, zIndex: 9999,
            background: 'linear-gradient(145deg, #231508, #1C1208)',
            borderRadius: 12,
            borderLeft: '3px solid #C19A6B',
            padding: '14px 16px',
            boxShadow: '0 12px 40px rgba(0,0,0,0.5), 0 0 0 1px rgba(193,154,107,0.1)',
            backdropFilter: 'blur(8px)',
          }}
        >
          {/* Step counter */}
          <div style={{
            fontSize: 9, color: '#B08060', marginBottom: 8,
            fontFamily: "'Geist Mono', 'JetBrains Mono', monospace",
            letterSpacing: '1.5px',
          }}>
            {stepLabel}
          </div>

          {/* Icon */}
          {icon && (
            <div style={{ fontSize: 20, marginBottom: 6 }}>{icon}</div>
          )}

          {/* Title */}
          <h3 style={{
            fontSize: 16, fontWeight: 400, color: '#EFE3CE',
            margin: '0 0 8px',
            fontFamily: "'Fraunces', Georgia, serif",
            lineHeight: 1.3,
          }}>
            {title}
          </h3>

          {/* Body */}
          <p style={{
            fontSize: 13, color: '#B08060', lineHeight: 1.6, margin: '0 0 14px',
            fontFamily: "'Plus Jakarta Sans', sans-serif",
          }}>
            {body}
          </p>

          {!isDoStep && (
            <button
              type="button"
              onClick={onNext}
              style={{
                width: '100%', border: 'none', borderRadius: 8, padding: '9px 0',
                background: `linear-gradient(135deg, ${theme.accent}, ${theme.accent}cc)`,
                color: '#fff', fontWeight: 600, fontSize: 12, cursor: 'pointer',
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                letterSpacing: '0.3px',
              }}
            >
              {nextLabel ?? 'Next →'}
            </button>
          )}

          {isDoStep && (
            <p style={{
              fontSize: 11, color: theme.accent, fontWeight: 600,
              textAlign: 'center', margin: 0,
              fontFamily: "'Plus Jakarta Sans', sans-serif",
            }}>
              ↑ Try it above
            </p>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  )
}
