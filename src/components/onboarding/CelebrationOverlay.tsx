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

interface Particle {
  x: number; y: number; vx: number; vy: number
  radius: number; color: string; alpha: number; decay: number
}

function spawnParticles(canvas: HTMLCanvasElement): Particle[] {
  const cx = canvas.width / 2
  const cy = canvas.height * 0.65

  return Array.from({ length: 40 }, () => {
    const type = Math.random()
    const isHerb = type < 0.4
    const isSpice = type < 0.8
    return {
      x: cx + (Math.random() - 0.5) * 80,
      y: cy,
      vx: (Math.random() - 0.5) * 1.2,
      vy: -(Math.random() * 2.5 + 1.5),
      radius: isHerb ? 2 + Math.random() * 2 : isSpice ? 3 + Math.random() * 2 : 8 + Math.random() * 6,
      color: isHerb ? '#8B9E6C' : isSpice ? '#C85A2F' : 'rgba(239,227,206,0.35)',
      alpha: isHerb || isSpice ? 1 : 0.4,
      decay: isHerb || isSpice ? 0.012 : 0.008,
    }
  })
}

function useCulinaryParticles(visible: boolean, canvasRef: React.RefObject<HTMLCanvasElement | null>) {
  useEffect(() => {
    if (!visible || !canvasRef.current) return
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight }
    resize()
    window.addEventListener('resize', resize)

    const particles = spawnParticles(canvas)
    let raf: number

    const tick = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      let anyAlive = false
      for (const p of particles) {
        if (p.alpha <= 0) continue
        anyAlive = true
        p.x += p.vx
        p.y += p.vy
        p.vy *= 0.99
        p.vx *= 0.995
        p.alpha = Math.max(0, p.alpha - p.decay)

        ctx.save()
        ctx.globalAlpha = p.alpha
        ctx.fillStyle = p.color
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2)
        ctx.fill()
        ctx.restore()
      }
      if (anyAlive) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
    }
  }, [visible, canvasRef])
}

export function CelebrationOverlay({ visible, text, summary, theme, onDone, autoDismissMs = 2800 }: CelebrationOverlayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const onDoneRef = useRef(onDone)
  useEffect(() => { onDoneRef.current = onDone }, [onDone])
  useCulinaryParticles(visible, canvasRef)

  useEffect(() => {
    if (!visible) return
    const t = setTimeout(() => onDoneRef.current(), autoDismissMs)
    return () => clearTimeout(t)
  }, [visible, autoDismissMs])

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
            background: `rgba(28,18,8,0.94)`,
            backgroundImage: 'radial-gradient(circle at 50% 60%, rgba(193,154,107,0.07), transparent 60%)',
          }}
          onClick={onDone}
        >
          <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }} />

          {/* Culinary glyph */}
          <motion.div
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 22, delay: 0.05 }}
            style={{
              fontSize: 32, marginBottom: 18,
              color: '#C19A6B', position: 'relative', zIndex: 1,
              fontFamily: "'Fraunces', Georgia, serif",
            }}
          >
            ✦
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.12, duration: 0.5, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] }}
            style={{
              color: theme.text,
              fontFamily: "'Fraunces', Georgia, serif",
              fontSize: 24, fontWeight: 300, fontStyle: 'italic',
              textAlign: 'center', maxWidth: 280,
              margin: '0 auto 14px', position: 'relative', zIndex: 1,
              lineHeight: 1.3,
            }}
          >
            {text}
          </motion.h2>

          {summary && (
            <motion.ul
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.28 }}
              style={{ listStyle: 'none', padding: 0, textAlign: 'center', position: 'relative', zIndex: 1 }}
            >
              {summary.map((item, i) => (
                <li key={i} style={{
                  color: theme.textMuted, fontSize: 13, marginBottom: 4,
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                }}>
                  <span style={{ color: '#C19A6B', marginRight: 6 }}>—</span>{item}
                </li>
              ))}
            </motion.ul>
          )}

          {/* Auto-dismiss progress line */}
          <motion.div
            initial={{ scaleX: 1 }}
            animate={{ scaleX: 0 }}
            transition={{ duration: autoDismissMs / 1000, ease: 'linear' }}
            style={{
              position: 'absolute', bottom: 0, left: 0, right: 0,
              height: 1, background: '#C19A6B',
              transformOrigin: 'left center',
            }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  )
}
