'use client'
import { useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { OnboardingTheme } from './onboarding.types'

interface CelebrationOverlayProps {
  visible: boolean
  text: string
  summary?: string[]
  theme: OnboardingTheme
  onDone: () => void
  autoDismissMs?: number
}

function useConfetti(visible: boolean, canvasRef: React.RefObject<HTMLCanvasElement | null>) {
  useEffect(() => {
    if (!visible || !canvasRef.current) return
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')!
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight

    const particles = Array.from({ length: 80 }, () => ({
      x: Math.random() * canvas.width,
      y: -10,
      r: Math.random() * 6 + 4,
      color: ['#C19A6B', '#EFE3CE', '#E8547A', '#9333EA', '#EAB308', '#38BDF8'][Math.floor(Math.random() * 6)],
      dx: (Math.random() - 0.5) * 4,
      dy: Math.random() * 3 + 2,
      rot: Math.random() * 360,
      drot: (Math.random() - 0.5) * 6,
    }))

    let raf: number
    const tick = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      particles.forEach(p => {
        ctx.save()
        ctx.translate(p.x, p.y)
        ctx.rotate((p.rot * Math.PI) / 180)
        ctx.fillStyle = p.color
        ctx.fillRect(-p.r / 2, -p.r / 2, p.r, p.r)
        ctx.restore()
        p.x += p.dx; p.y += p.dy; p.rot += p.drot
      })
      if (particles.some(p => p.y < canvas.height + 20)) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [visible, canvasRef])
}

export function CelebrationOverlay({ visible, text, summary, theme, onDone, autoDismissMs = 2800 }: CelebrationOverlayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  useConfetti(visible, canvasRef)

  useEffect(() => {
    if (!visible) return
    const t = setTimeout(onDone, autoDismissMs)
    return () => clearTimeout(t)
  }, [visible, onDone, autoDismissMs])

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{
            position: 'fixed', inset: 0, zIndex: 10001,
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            background: `${theme.bg}f0`,
          }}
          onClick={onDone}
        >
          <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }} />
          <motion.div
            initial={{ scale: 0, rotate: -10 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 20 }}
            style={{ fontSize: 64, marginBottom: 20, position: 'relative', zIndex: 1 }}
          >
            🎉
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.4 }}
            style={{
              color: theme.text, fontFamily: 'Georgia, serif',
              fontSize: 22, fontWeight: 700, textAlign: 'center',
              maxWidth: 280, margin: '0 auto 12px', position: 'relative', zIndex: 1,
            }}
          >
            {text}
          </motion.h2>
          {summary && (
            <motion.ul
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              style={{ listStyle: 'none', padding: 0, textAlign: 'center', position: 'relative', zIndex: 1 }}
            >
              {summary.map((item, i) => (
                <li key={i} style={{ color: theme.textMuted, fontSize: 13, marginBottom: 4 }}>
                  ✓ {item}
                </li>
              ))}
            </motion.ul>
          )}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            transition={{ delay: 0.6 }}
            style={{ color: theme.textMuted, fontSize: 11, marginTop: 24, position: 'relative', zIndex: 1 }}
          >
            Tap anywhere to continue
          </motion.p>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
