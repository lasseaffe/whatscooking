'use client'
import { useState, useCallback, useRef } from 'react'
import type { SoundId } from '@/components/onboarding/onboarding.types'

const STORAGE_KEY = 'wc-sound-muted'

function createCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null
  try {
    return new AudioContext()
  } catch {
    return null
  }
}

function playOscillator(
  ctx: AudioContext,
  hz: number,
  type: OscillatorType,
  gainVal: number,
  decayMs: number,
  glideToHz?: number
) {
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.type = type
  osc.frequency.setValueAtTime(hz, ctx.currentTime)
  if (glideToHz !== undefined) {
    osc.frequency.exponentialRampToValueAtTime(glideToHz, ctx.currentTime + decayMs / 1000)
  }
  gain.gain.setValueAtTime(gainVal, ctx.currentTime)
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + decayMs / 1000)
  osc.connect(gain)
  gain.connect(ctx.destination)
  osc.start(ctx.currentTime)
  osc.stop(ctx.currentTime + decayMs / 1000 + 0.01)
}

function playNoise(ctx: AudioContext, gainVal: number, filterHz: number, durationMs: number) {
  const bufLen = Math.ceil(ctx.sampleRate * (durationMs / 1000))
  const buf = ctx.createBuffer(1, bufLen, ctx.sampleRate)
  const data = buf.getChannelData(0)
  for (let i = 0; i < bufLen; i++) data[i] = Math.random() * 2 - 1

  const src = ctx.createBufferSource()
  src.buffer = buf

  const filter = ctx.createBiquadFilter()
  filter.type = 'bandpass'
  filter.frequency.value = filterHz

  const gain = ctx.createGain()
  gain.gain.setValueAtTime(gainVal, ctx.currentTime)
  gain.gain.linearRampToValueAtTime(0, ctx.currentTime + durationMs / 1000)

  src.connect(filter)
  filter.connect(gain)
  gain.connect(ctx.destination)
  src.start(ctx.currentTime)
}

function synthesize(ctx: AudioContext, id: SoundId) {
  switch (id) {
    case 'ceramic-tap':
      playOscillator(ctx, 800, 'sine', 0.08, 60)
      break
    case 'cloth-swipe':
      playNoise(ctx, 0.06, 2000, 120)
      break
    case 'wooden-knock':
      playOscillator(ctx, 200, 'triangle', 0.10, 80)
      break
    case 'stove-ignite': {
      for (let i = 0; i < 3; i++) {
        setTimeout(() => playOscillator(ctx, 700, 'sine', 0.07, 45), i * 35)
      }
      setTimeout(() => playOscillator(ctx, 180, 'sine', 0.12, 400), 110)
      break
    }
    case 'timer-drop':
      playOscillator(ctx, 1200, 'sine', 0.08, 100, 600)
      break
    case 'warm-bell':
      playOscillator(ctx, 523, 'sine', 0.12, 800)
      break
  }
}

export interface UseCulinarySound {
  play: (id: SoundId) => void
  muted: boolean
  toggleMute: () => void
}

export function useCulinarySound(): UseCulinarySound {
  const [muted, setMuted] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false
    return localStorage.getItem(STORAGE_KEY) === 'true'
  })

  const ctxRef = useRef<AudioContext | null>(null)

  const play = useCallback((id: SoundId) => {
    if (muted) return
    if (typeof window === 'undefined') return

    // Respect prefers-reduced-motion
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    if (!ctxRef.current) {
      ctxRef.current = createCtx()
    }
    const ctx = ctxRef.current
    if (!ctx) return

    if (ctx.state === 'suspended') {
      ctx.resume().then(() => synthesize(ctx, id)).catch(() => undefined)
    } else {
      synthesize(ctx, id)
    }
  }, [muted])

  const toggleMute = useCallback(() => {
    setMuted(prev => {
      const next = !prev
      try { localStorage.setItem(STORAGE_KEY, String(next)) } catch { /* ignore */ }
      return next
    })
  }, [])

  return { play, muted, toggleMute }
}
