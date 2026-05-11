// src/components/onboarding/WizardShell.tsx
'use client'
import { AnimatePresence, motion } from 'framer-motion'
import { ProgressBar } from './ProgressBar'
import { MOTION_PRESETS } from './onboarding.motion'
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
  const step = wizard.steps[state.wizardStep]
  const preset = MOTION_PRESETS[theme.motion]

  if (!step) return null

  const StepComponent = step.component
  const currentAnswer = state.wizardAnswers[step.id]
  const hasAnswer = Array.isArray(currentAnswer) ? currentAnswer.length > 0 : Boolean(currentAnswer)

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      bottom: 0,
      left: '50%',
      transform: 'translateX(-50%)',
      width: '100%',
      maxWidth: 460,
      zIndex: 9999,
      background: theme.bg,
      display: 'flex',
      flexDirection: 'column',
    }}>
      {/* Status bar area */}
      <div style={{ padding: '12px 22px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 10, color: theme.accent, fontFamily: theme.motion === 'terminal' ? "'JetBrains Mono', monospace" : undefined }}>
          {theme.motion === 'terminal' ? '09:41 SYS_OK' : '9:41'}
        </span>
        <button
          type="button"
          onClick={onSkip}
          style={{ background: 'none', border: 'none', color: theme.textMuted, fontSize: 11, cursor: 'pointer',
                   fontFamily: theme.motion === 'terminal' ? "'JetBrains Mono', monospace" : undefined }}
        >
          {theme.motion === 'terminal' ? '[ skip ]' : 'Skip'}
        </button>
      </div>

      {/* Progress bar */}
      <div style={{ padding: '8px 22px 12px' }}>
        <ProgressBar current={state.wizardStep} total={wizard.steps.length} theme={theme} />
      </div>

      {/* Step content */}
      <div style={{ flex: 1, padding: '4px 20px 0', overflowY: 'auto' }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={step.id}
            variants={preset.screenVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            style={{ height: '100%', display: 'flex', flexDirection: 'column' }}
          >
            <h2 style={{
              fontSize: theme.motion === 'terminal' ? 14 : 19,
              fontWeight: theme.motion === 'snappy' ? 900 : 700,
              color: theme.text,
              fontFamily: theme.motion === 'terminal'
                ? "'JetBrains Mono', monospace"
                : theme.motion === 'smooth' ? 'Georgia, serif' : undefined,
              marginBottom: 16,
              lineHeight: 1.3,
            }}>
              {theme.motion === 'terminal' ? `> ${step.title}` : step.title}
            </h2>

            <StepComponent
              onAnswer={(ans) => onAnswer(step.id, ans)}
              answer={currentAnswer}
              theme={theme}
            />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* CTA */}
      <div style={{ padding: '12px 20px 22px', flexShrink: 0 }}>
        <AnimatePresence>
          {hasAnswer && (
            <motion.button
              type="button"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 16 }}
              transition={{ duration: 0.3 }}
              onClick={onAdvance}
              style={{
                width: '100%',
                border: theme.motion === 'terminal' ? `1px solid ${theme.accent}` : 'none',
                borderRadius: theme.motion === 'terminal' ? 4 : 12,
                padding: 14,
                fontSize: 13,
                fontWeight: 700,
                color: theme.motion === 'terminal' ? theme.accent : '#fff',
                background: theme.motion === 'terminal'
                  ? 'transparent'
                  : `linear-gradient(135deg, ${theme.accent}, ${theme.accent}cc)`,
                cursor: 'pointer',
                fontFamily: theme.motion === 'terminal' ? "'JetBrains Mono', monospace" : 'Georgia, serif',
                letterSpacing: theme.motion === 'terminal' ? 2 : 0.3,
                textTransform: theme.motion === 'terminal' ? ('uppercase' as const) : undefined,
                boxShadow: theme.motion !== 'terminal' ? `0 4px 20px ${theme.accent}44` : undefined,
              }}
            >
              {theme.motion === 'terminal' ? '> PROCEED' : 'Continue'}
            </motion.button>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
