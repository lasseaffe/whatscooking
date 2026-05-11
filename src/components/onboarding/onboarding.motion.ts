// src/components/onboarding/onboarding.motion.ts
import type { Variants, TargetAndTransition } from 'framer-motion'

export interface MotionPreset {
  cardVariants: Variants
  cardHover: TargetAndTransition
  cardSelect: TargetAndTransition
  stepTransition: Record<string, unknown>
  screenVariants: Variants
}

export const MOTION_PRESETS: Record<'smooth' | 'snappy' | 'terminal', MotionPreset> = {
  smooth: {
    cardVariants: {
      initial: { opacity: 0, y: 18 },
      animate: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.4, 0, 0.2, 1] } },
      exit:    { opacity: 0, y: -12, transition: { duration: 0.4 } },
    },
    cardHover:  { y: -2, boxShadow: '0 8px 24px rgba(193,154,107,0.2)', transition: { duration: 0.55 } },
    cardSelect: { y: -2, transition: { duration: 0.55, ease: [0.4, 0, 0.2, 1] } },
    stepTransition: { type: 'tween', duration: 0.5, ease: [0.4, 0, 0.2, 1] },
    screenVariants: {
      initial: { opacity: 0, x: 40 },
      animate: { opacity: 1, x: 0, transition: { duration: 0.5, ease: [0.4, 0, 0.2, 1] } },
      exit:    { opacity: 0, x: -40, transition: { duration: 0.35 } },
    },
  },
  snappy: {
    cardVariants: {
      initial: { opacity: 0, scale: 0.88 },
      animate: { opacity: 1, scale: 1, transition: { type: 'spring', stiffness: 400, damping: 25 } },
      exit:    { opacity: 0, scale: 0.94, transition: { duration: 0.15 } },
    },
    cardHover:  { scale: 1.03 },
    cardSelect: { scale: 1.06, transition: { type: 'spring', stiffness: 500, damping: 20 } },
    stepTransition: { type: 'spring', stiffness: 350, damping: 30 },
    screenVariants: {
      initial: { opacity: 0, scale: 0.96 },
      animate: { opacity: 1, scale: 1, transition: { type: 'spring', stiffness: 350, damping: 30 } },
      exit:    { opacity: 0, scale: 1.04, transition: { duration: 0.12 } },
    },
  },
  terminal: {
    cardVariants: {
      initial: { opacity: 0 },
      animate: { opacity: 1, transition: { duration: 0.05 } },
      exit:    { opacity: 0, transition: { duration: 0.05 } },
    },
    cardHover:  {},
    cardSelect: {},
    stepTransition: { type: 'tween', duration: 0.08 },
    screenVariants: {
      initial: { opacity: 0 },
      animate: { opacity: 1, transition: { duration: 0.08 } },
      exit:    { opacity: 0, transition: { duration: 0.05 } },
    },
  },
}
