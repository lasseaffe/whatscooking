'use client'
import { useState } from 'react'
import { Spotlight } from './Spotlight'
import { TooltipBubble } from './TooltipBubble'
import { ActionGate } from './ActionGate'
import { CelebrationOverlay } from './CelebrationOverlay'
import { useCulinarySound } from '@/hooks/useCulinarySound'
import type { OnboardingConfig, OnboardingState } from './onboarding.types'

interface OverlayTourProps {
  config: OnboardingConfig
  state: OnboardingState
  onAdvance: () => void
  onActionComplete: (id: string) => void
  onSkip?: () => void
}

export function OverlayTour({ config, state, onAdvance, onActionComplete, onSkip }: OverlayTourProps) {
  const [showCelebration, setShowCelebration] = useState(false)
  const [celebrationText, setCelebrationText] = useState('')
  const [celebrationSummary, setCelebrationSummary] = useState<string[] | undefined>()
  const { play } = useCulinarySound()

  const waypoints = config.tour.waypoints
  const waypoint = waypoints[state.tourStep]
  if (!waypoint || state.mode !== 'tour') return null

  const stepLabel = `${String(state.tourStep + 1).padStart(2, '0')} / ${String(waypoints.length).padStart(2, '0')}`
  const isDoStep = waypoint.type === 'do'
  const isCelebrationStep = waypoint.type === 'celebration'

  const handleDemoAdvance = () => {
    play('wooden-knock')
    onAdvance()
  }

  const handleActionComplete = () => {
    const { id, celebrationText: cText, celebrationSummary: cSummary, sound } = waypoint
    onActionComplete(id)
    if (sound) play(sound)
    if (cText) {
      setCelebrationText(cText)
      setCelebrationSummary(cSummary)
      setShowCelebration(true)
    } else {
      onAdvance()
    }
  }

  const handleCelebrationDone = () => {
    setShowCelebration(false)
    setCelebrationText('')
    setCelebrationSummary(undefined)
    onAdvance()
  }

  // Celebration-type waypoints auto-show celebration overlay
  if (isCelebrationStep) {
    return (
      <CelebrationOverlay
        visible
        text={waypoint.celebrationText ?? ''}
        summary={waypoint.celebrationSummary}
        theme={config.theme}
        onDone={onAdvance}
      />
    )
  }

  return (
    <>
      {onSkip && (
        <button
          onClick={onSkip}
          style={{
            position: 'fixed', top: 14, right: 16, zIndex: 10000,
            fontSize: 10, fontWeight: 700, letterSpacing: 1,
            color: '#C19A6B', background: 'none', border: 'none',
            cursor: 'pointer', fontFamily: '"Playfair Display", serif',
          }}
        >
          Skip tour
        </button>
      )}
      <Spotlight
        target={waypoint.target}
        visible={!showCelebration}
        onClick={!isDoStep ? handleDemoAdvance : undefined}
      />
      <TooltipBubble
        target={waypoint.target}
        title={waypoint.title}
        body={waypoint.body}
        icon={waypoint.icon}
        position={waypoint.position ?? 'bottom'}
        theme={config.theme}
        visible={!showCelebration}
        stepLabel={stepLabel}
        isDoStep={isDoStep}
        onNext={handleDemoAdvance}
      />
      {isDoStep && waypoint.completeOn && (
        <ActionGate
          completeOn={waypoint.completeOn}
          onComplete={handleActionComplete}
          active={!showCelebration}
        />
      )}
      <CelebrationOverlay
        visible={showCelebration}
        text={celebrationText}
        summary={celebrationSummary}
        theme={config.theme}
        onDone={handleCelebrationDone}
      />
    </>
  )
}
