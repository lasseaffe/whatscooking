'use client'
import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { OnboardingBeacon, OnboardingTheme } from './onboarding.types'

interface FeatureBeaconProps {
  beacon: OnboardingBeacon
  theme: OnboardingTheme
  dismissed: boolean
  onDismiss: (key: string) => void
}

function useBeaconPosition(target: string): { top: number; left: number } | null {
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null)
  useEffect(() => {
    const place = () => {
      const el = document.querySelector(target)
      if (!el) return
      const r = el.getBoundingClientRect()
      setPos({ top: r.top - 6, left: r.right - 6 })
    }
    place()
    window.addEventListener('resize', place)
    return () => window.removeEventListener('resize', place)
  }, [target])
  return pos
}

export function FeatureBeacon({ beacon, theme, dismissed, onDismiss }: FeatureBeaconProps) {
  const [hovered, setHovered] = useState(false)
  const pos = useBeaconPosition(beacon.target)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  if (dismissed || !pos) return null

  return (
    <div
      style={{ position: 'fixed', top: pos.top, left: pos.left, zIndex: 9990 }}
      onMouseEnter={() => { if (timerRef.current) clearTimeout(timerRef.current); setHovered(true) }}
      onMouseLeave={() => { timerRef.current = setTimeout(() => setHovered(false), 300) }}
    >
      {/* Pulsing ring */}
      <motion.div
        style={{
          width: 14, height: 14, borderRadius: '50%',
          background: theme.accent,
          cursor: 'pointer',
        }}
        animate={hovered ? { scale: 1.2 } : {}}
        transition={hovered ? {} : { duration: 0 }}
        onClick={() => setHovered(true)}
      >
        <motion.div
          style={{
            position: 'absolute',
            inset: -10,
            borderRadius: '50%',
            border: `2px solid ${theme.accent}`,
          }}
          animate={{
            opacity: [1, 0],
            scale: [0, 1],
          }}
          transition={{
            duration: 1.4,
            repeat: Infinity,
            ease: 'easeOut',
          }}
        />
      </motion.div>

      {/* Dismiss popover */}
      <AnimatePresence>
        {hovered && (
          <motion.div
            initial={{ opacity: 0, scale: 0.85, x: -10 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.85 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            style={{
              position: 'absolute', top: 20, right: 0,
              background: '#fff', borderRadius: 8, padding: '10px 14px',
              boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
              whiteSpace: 'nowrap', minWidth: 160,
            }}
          >
            <p style={{ fontSize: 12, fontWeight: 700, color: '#111', margin: '0 0 8px' }}>
              {beacon.label}
            </p>
            <button
              type="button"
              onClick={() => onDismiss(beacon.key)}
              style={{
                border: 'none', borderRadius: 5, padding: '5px 10px',
                background: theme.accent, color: '#fff',
                fontSize: 11, fontWeight: 700, cursor: 'pointer', width: '100%',
              }}
            >
              Got it ✓
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// Renders all active beacons — mount once in app root
export function BeaconManager({ beacons, theme, dismissedKeys, onDismiss }: {
  beacons: OnboardingBeacon[]
  theme: OnboardingTheme
  dismissedKeys: string[]
  onDismiss: (key: string) => void
}) {
  return (
    <>
      {beacons.map(b => (
        <FeatureBeacon
          key={b.id}
          beacon={b}
          theme={theme}
          dismissed={dismissedKeys.includes(b.key)}
          onDismiss={onDismiss}
        />
      ))}
    </>
  )
}
