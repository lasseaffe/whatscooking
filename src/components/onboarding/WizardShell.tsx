// src/components/onboarding/WizardShell.tsx
'use client'
import { AnimatePresence, motion } from 'framer-motion'
import { useCulinarySound } from '@/hooks/useCulinarySound'
import type { OnboardingConfig, OnboardingState } from './onboarding.types'

interface WizardShellProps {
  config: OnboardingConfig
  state: OnboardingState
  onAnswer: (stepId: string, answer: string | string[]) => void
  onAdvance: () => void
  onSkip: () => void
}

export function WizardShell({ config, state, onAnswer, onAdvance, onSkip }: WizardShellProps) {
  const { theme, wizard } = config
  const { play, muted, toggleMute } = useCulinarySound()
  const step = wizard.steps[state.wizardStep]

  if (!step) return null

  const StepComponent = step.component
  const currentAnswer = state.wizardAnswers[step.id]
  const hasAnswer = Array.isArray(currentAnswer) ? currentAnswer.length > 0 : Boolean(currentAnswer)

  function handleAnswer(ans: string | string[]) {
    play('ceramic-tap')
    onAnswer(step.id, ans)
  }

  function handleAdvance() {
    play('wooden-knock')
    onAdvance()
  }

  return (
    <div style={{
      position: 'fixed', top: 0, bottom: 0,
      left: '50%', transform: 'translateX(-50%)',
      width: '100%', maxWidth: 460, zIndex: 9999,
      background: theme.bg,
      display: 'flex', flexDirection: 'column',
      overflow: 'hidden',
    }}>

      {/* Grain texture overlay */}
      <div aria-hidden="true" style={{
        position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0,
        opacity: 0.035,
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23n)'/%3E%3C/svg%3E")`,
        backgroundSize: '200px 200px',
      }} />

      {/* Warm vignette */}
      <div aria-hidden="true" style={{
        position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0,
        background: 'radial-gradient(ellipse at 50% 80%, rgba(193,154,107,0.06), transparent 70%)',
      }} />

      {/* Status bar area */}
      <div style={{
        padding: '12px 22px 0', zIndex: 1,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <span style={{ fontSize: 10, color: theme.accent, fontFamily: "'Geist Mono', monospace" }}>
          9:41
        </span>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <button
            type="button"
            onClick={toggleMute}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, opacity: 0.6, lineHeight: 1 }}
            aria-label={muted ? 'Unmute sounds' : 'Mute sounds'}
          >
            {muted ? '🔇' : '🔊'}
          </button>
          <button
            type="button"
            onClick={onSkip}
            style={{
              background: 'none', border: 'none', color: theme.textMuted,
              fontSize: 11, cursor: 'pointer',
              fontFamily: "'Plus Jakarta Sans', sans-serif",
            }}
          >
            Skip
          </button>
        </div>
      </div>

      {/* Culinary progress glyphs */}
      <div style={{
        padding: '10px 22px 12px', zIndex: 1,
        display: 'flex', gap: 8, alignItems: 'center', justifyContent: 'center',
      }}>
        {wizard.steps.map((_, i) => (
          <span key={i} style={{
            fontSize: 10,
            color: i <= state.wizardStep ? theme.accent : '#3D2817',
            transition: 'color 0.4s ease',
          }}>
            ◆
          </span>
        ))}
      </div>

      {/* Step content */}
      <div style={{ flex: 1, padding: '4px 20px 0', overflowY: 'auto', zIndex: 1 }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={step.id}
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0, transition: { duration: 0.5, ease: [0.4, 0, 0.2, 1] } }}
            exit={{ opacity: 0, x: -40, transition: { duration: 0.35 } }}
            style={{ height: '100%', display: 'flex', flexDirection: 'column' }}
          >
            <h2 style={{
              fontSize: 22, fontWeight: 300, color: theme.text,
              fontFamily: "'Fraunces', Georgia, serif",
              letterSpacing: '-0.3px', lineHeight: 1.25,
              marginBottom: 20,
            }}>
              {step.title}
            </h2>

            <StepComponent
              onAnswer={handleAnswer}
              answer={currentAnswer}
              theme={theme}
            />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* CTA */}
      <div style={{ padding: '12px 20px 22px', flexShrink: 0, zIndex: 1 }}>
        <AnimatePresence>
          {hasAnswer && (
            <motion.button
              type="button"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] }}
              onClick={handleAdvance}
              style={{
                width: '100%',
                border: 'none',
                borderRadius: 10,
                padding: 14,
                fontSize: 14,
                fontWeight: 400,
                fontStyle: 'italic',
                color: '#fff',
                background: `linear-gradient(135deg, ${theme.accent}, ${theme.accent}cc)`,
                cursor: 'pointer',
                fontFamily: "'Fraunces', Georgia, serif",
                letterSpacing: '0.3px',
                boxShadow: `0 8px 32px ${theme.accent}25`,
              }}
            >
              {state.wizardStep === wizard.steps.length - 1 ? 'Begin cooking' : 'Continue'}
            </motion.button>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
