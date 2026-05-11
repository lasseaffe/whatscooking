'use client'
import { useEffect, useState, useId } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface SpotlightRect { x: number; y: number; width: number; height: number; rx: number }

interface SpotlightProps {
  target: string      // CSS selector e.g. '[data-tour="swipe-deck"]'
  visible: boolean
  padding?: number
  borderRadius?: number
  onClick?: () => void
}

function useTargetRect(selector: string, visible: boolean): SpotlightRect | null {
  const [rect, setRect] = useState<SpotlightRect | null>(null)

  useEffect(() => {
    if (!visible) return
    const el = document.querySelector(selector)
    if (!el) return
    const r = el.getBoundingClientRect()
    setRect({ x: r.left, y: r.top, width: r.width, height: r.height, rx: 8 })

    const observer = new ResizeObserver(() => {
      const r2 = el.getBoundingClientRect()
      setRect({ x: r2.left, y: r2.top, width: r2.width, height: r2.height, rx: 8 })
    })
    observer.observe(el)

    const onScroll = () => {
      const r2 = el.getBoundingClientRect()
      setRect({ x: r2.left, y: r2.top, width: r2.width, height: r2.height, rx: 8 })
    }
    window.addEventListener('scroll', onScroll, { passive: true })

    return () => {
      observer.disconnect()
      window.removeEventListener('scroll', onScroll)
    }
  }, [selector, visible])

  return rect
}

export function Spotlight({ target, visible, padding = 8, borderRadius = 10, onClick }: SpotlightProps) {
  const clipId = useId().replace(/:/g, '')
  const rect = useTargetRect(target, visible)
  const [vw, setVw] = useState(0)
  const [vh, setVh] = useState(0)

  useEffect(() => {
    setVw(window.innerWidth)
    setVh(window.innerHeight)
    const handler = () => { setVw(window.innerWidth); setVh(window.innerHeight) }
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [])

  if (!rect || !vw) return null

  const x = rect.x - padding
  const y = rect.y - padding
  const w = rect.width + padding * 2
  const h = rect.height + padding * 2

  return (
    <AnimatePresence>
      {visible && (
        <motion.svg
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{ position: 'fixed', inset: 0, zIndex: 9998, pointerEvents: 'none' }}
          width={vw}
          height={vh}
        >
          <defs>
            <clipPath id={clipId}>
              <rect width={vw} height={vh} />
              <motion.rect
                animate={{ x, y, width: w, height: h, rx: borderRadius }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              />
            </clipPath>
          </defs>
          <rect
            width={vw} height={vh}
            fill="rgba(0,0,0,0.72)"
            clipPath={`url(#${clipId})`}
            style={{ clipRule: 'evenodd', pointerEvents: 'all' } as React.CSSProperties}
            onClick={onClick}
          />
          <motion.rect
            animate={{ x, y, width: w, height: h }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            fill="none"
            stroke="rgba(255,255,255,0.3)"
            strokeWidth={2}
            rx={borderRadius}
          />
        </motion.svg>
      )}
    </AnimatePresence>
  )
}
