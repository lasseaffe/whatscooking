'use client'
import { useState, useCallback } from 'react'
import type { OnboardingConfig, OnboardingState } from './onboarding.types'

const DEFAULT_STATE: OnboardingState = {
  mode: 'wizard',
  wizardStep: 0,
  tourStep: 0,
  wizardAnswers: {},
  dismissedBeacons: [],
  completedActions: [],
}

function loadState(storageKey: string): OnboardingState {
  try {
    const raw = localStorage.getItem(storageKey)
    if (raw) return { ...DEFAULT_STATE, ...JSON.parse(raw) }
  } catch { /* ignore */ }
  return DEFAULT_STATE
}

function saveState(storageKey: string, state: OnboardingState) {
  try { localStorage.setItem(storageKey, JSON.stringify(state)) } catch { /* ignore */ }
}

export function useOnboardingState(config: OnboardingConfig) {
  const { storageKey } = config.theme
  const totalWizardSteps = config.wizard.steps.length
  const totalTourSteps = config.tour.waypoints.length

  const [state, setState] = useState<OnboardingState>(() => loadState(storageKey))

  const update = useCallback((patch: Partial<OnboardingState>) => {
    setState(prev => {
      const next = { ...prev, ...patch }
      saveState(storageKey, next)
      return next
    })
  }, [storageKey])

  const advanceWizard = useCallback(() => {
    setState(prev => {
      const nextStep = prev.wizardStep + 1
      const next: OnboardingState = nextStep >= totalWizardSteps
        ? { ...prev, mode: 'tour', wizardStep: 0 }
        : { ...prev, wizardStep: nextStep }
      saveState(storageKey, next)
      return next
    })
  }, [storageKey, totalWizardSteps])

  const advanceTour = useCallback(() => {
    setState(prev => {
      const nextStep = prev.tourStep + 1
      const next: OnboardingState = nextStep >= totalTourSteps
        ? { ...prev, mode: 'beacons', tourStep: 0 }
        : { ...prev, tourStep: nextStep }
      saveState(storageKey, next)
      return next
    })
  }, [storageKey, totalTourSteps])

  const markActionComplete = useCallback((actionId: string) => {
    setState(prev => {
      if (prev.completedActions.includes(actionId)) return prev
      const next = { ...prev, completedActions: [...prev.completedActions, actionId] }
      saveState(storageKey, next)
      return next
    })
  }, [storageKey])

  const dismissBeacon = useCallback((key: string) => {
    setState(prev => {
      if (prev.dismissedBeacons.includes(key)) return prev
      const next = { ...prev, dismissedBeacons: [...prev.dismissedBeacons, key] }
      saveState(storageKey, next)
      return next
    })
  }, [storageKey])

  const setAnswer = useCallback((stepId: string, answer: string | string[]) => {
    setState(prev => {
      const next = { ...prev, wizardAnswers: { ...prev.wizardAnswers, [stepId]: answer } }
      saveState(storageKey, next)
      return next
    })
  }, [storageKey])

  const skip = useCallback(() => update({ mode: 'done' }), [update])

  const restart = useCallback(() => {
    const next: OnboardingState = { ...DEFAULT_STATE }
    saveState(storageKey, next)
    setState(next)
  }, [storageKey])

  return { state, advanceWizard, advanceTour, markActionComplete, dismissBeacon, setAnswer, skip, restart }
}
