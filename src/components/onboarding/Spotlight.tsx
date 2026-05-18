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
  if (rect.width === 0 && rect.height === 0) return null

  const x = rect.x - padding
  const y = rect.y - padding
  const w = rect.width + padding * 2
  const h = rect.height + padding * 2

  return (
    <AnimatePresence>
      {visible && (
        <>
          {/* Click-to-advance HTML overlay — covers viewport except spotlight hole, pointer events pass through inside cutout */}
          {onClick && (
            <div
              onClick={onClick}
              style={{
                position: 'fixed', inset: 0, zIndex: 9998,
                clipPath: `polygon(0 0, ${vw}px 0, ${vw}px ${vh}px, 0 ${vh}px, 0 0, ${x}px ${y}px, ${x}px ${y + h}px, ${x + w}px ${y + h}px, ${x + w}px ${y}px, ${x}px ${y}px)`,
                cursor: 'pointer',
              }}
            />
          )}
          <motion.svg
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, zIndex: 9997, pointerEvents: 'none' }}
            width={vw}
            height={vh}
          >
            <defs>
              <clipPath id={clipId}>
                <rect width={vw} height={vh} clipRule="evenodd" />
                <motion.rect
                  clipRule="evenodd"
                  animate={{ x, y, width: w, height: h, rx: borderRadius }}
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                />
              </clipPath>
            </defs>
            <rect
              width={vw} height={vh}
              fill="rgba(16,10,4,0.80)"
              clipPath={`url(#${clipId})`}
            />
            {/* Outer ambient glow ring */}
            <motion.rect
              animate={{ x: x - 6, y: y - 6, width: w + 12, height: h + 12 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              fill="none"
              stroke="#C19A6B"
              strokeWidth={1}
              opacity={0.15}
              rx={borderRadius + 4}
            />
            {/* Inner pulse ring */}
            <motion.rect
              animate={{
                x, y, width: w, height: h,
                strokeWidth: [1.5, 2.5, 1.5],
              }}
              transition={{
                type: 'spring',
                stiffness: 300,
                damping: 30,
                strokeWidth: { duration: 3, repeat: Infinity, ease: 'easeInOut' },
              }}
              fill="none"
              stroke="#C19A6B"
              strokeWidth={1.5}
              opacity={0.45}
              rx={borderRadius}
            />
          </motion.svg>
        </>
      )}
    </AnimatePresence>
  )
}
