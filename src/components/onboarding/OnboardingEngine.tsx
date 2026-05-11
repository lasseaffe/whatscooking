'use client'
import { WizardShell } from './WizardShell'
import { OverlayTour } from './OverlayTour'
import { BeaconManager } from './FeatureBeacon'
import { useOnboardingState } from './useOnboardingState'
import type { OnboardingConfig } from './onboarding.types'

interface OnboardingEngineProps {
  config: OnboardingConfig
}

export function OnboardingEngine({ config }: OnboardingEngineProps) {
  const { state, advanceWizard, advanceTour, markActionComplete, dismissBeacon, setAnswer, skip } =
    useOnboardingState(config)

  if (state.mode === 'done') return null

  return (
    <>
      {state.mode === 'wizard' && (
        <WizardShell
          config={config}
          state={state}
          onAnswer={setAnswer}
          onAdvance={advanceWizard}
          onSkip={skip}
        />
      )}

      {state.mode === 'tour' && (
        <OverlayTour
          config={config}
          state={state}
          onAdvance={advanceTour}
          onActionComplete={markActionComplete}
          onSkip={skip}
        />
      )}

      {state.mode === 'beacons' && (
        <BeaconManager
          beacons={config.beacons}
          theme={config.theme}
          dismissedKeys={state.dismissedBeacons}
          onDismiss={dismissBeacon}
        />
      )}
    </>
  )
}
