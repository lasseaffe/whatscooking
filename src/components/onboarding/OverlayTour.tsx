'use client'
import { useState } from 'react'
import { Spotlight } from './Spotlight'
import { TooltipBubble } from './TooltipBubble'
import { ActionGate } from './ActionGate'
import { CelebrationOverlay } from './CelebrationOverlay'
import type { OnboardingConfig, OnboardingState } from './onboarding.types'

interface OverlayTourProps {
  config: OnboardingConfig
  state: OnboardingState
  onAdvance: () => void
  onActionComplete: (id: string) => void
}

export function OverlayTour({ config, state, onAdvance, onActionComplete }: OverlayTourProps) {
  const [showCelebration, setShowCelebration] = useState(false)
  const [celebrationText, setCelebrationText] = useState('')
  const [celebrationSummary, setCelebrationSummary] = useState<string[] | undefined>()

  const waypoints = config.tour.waypoints
  const waypoint = waypoints[state.tourStep]
  if (!waypoint || state.mode !== 'tour') return null

  const stepLabel = `Step ${state.tourStep + 1} of ${waypoints.length}`
  const isDoStep = waypoint.type === 'do'
  const isCelebrationStep = waypoint.type === 'celebration'

  const handleActionComplete = () => {
    const { id, celebrationText: cText, celebrationSummary: cSummary } = waypoint
    onActionComplete(id)
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
      <Spotlight
        target={waypoint.target}
        visible={!showCelebration}
        onClick={!isDoStep ? onAdvance : undefined}
      />
      <TooltipBubble
        target={waypoint.target}
        title={waypoint.title}
        body={waypoint.body}
        position={waypoint.position ?? 'bottom'}
        theme={config.theme}
        visible={!showCelebration}
        stepLabel={stepLabel}
        isDoStep={isDoStep}
        onNext={onAdvance}
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
