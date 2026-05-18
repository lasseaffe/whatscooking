'use client'
import { useState, useCallback, useEffect, useRef } from 'react'
import type { OnboardingConfig, OnboardingState } from './onboarding.types'

const DEFAULT_STATE: OnboardingState = {
  mode: 'wizard',
  wizardStep: 0,
  tourStep: 0,
  wizardAnswers: {},
  dismissedBeacons: [],
  completedActions: [],
  narrativeRecipeId: null,
}

// null = not yet hydrated (hide the wizard until we've read localStorage)
type HydratedState = OnboardingState | null

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

function buildPickPayload(answers: Record<string, string | string[]>) {
  return {
    cookType: (answers['cook-type'] as string) ?? 'beginner',
    goal: (answers['goal'] as string) ?? '',
    diet: (answers['diet'] as string[]) ?? [],
    household: (answers['household'] as string) ?? 'solo',
  }
}

export function useOnboardingState(config: OnboardingConfig) {
  const { storageKey } = config.theme
  const totalWizardSteps = config.wizard.steps.length
  const totalTourSteps = config.tour.waypoints.length

  const [state, setState] = useState<HydratedState>(null)

  // Always-current ref — lets async callbacks read latest state without stale closures
  const stateRef = useRef<HydratedState>(null)
  stateRef.current = state

  // Defer localStorage read to after hydration so SSR never shows the wizard
  useEffect(() => {
    setState(loadState(storageKey))
  }, [storageKey])

  const advanceWizard = useCallback(async () => {
    const prev = stateRef.current
    if (!prev) return
    const nextStep = prev.wizardStep + 1

    if (nextStep < totalWizardSteps) {
      const next: OnboardingState = { ...prev, wizardStep: nextStep }
      saveState(storageKey, next)
      setState(next)
      return
    }

    // Last wizard step — try to pick a recipe before entering tour
    let narrativeRecipeId: string | null = null
    if (config.pickRecipeUrl) {
      try {
        const res = await fetch(config.pickRecipeUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(buildPickPayload(prev.wizardAnswers)),
        })
        if (res.ok) {
          const data = await res.json()
          narrativeRecipeId = data.recipeId ?? null
        }
      } catch { /* fall through with null — tour still works */ }
    }

    const next: OnboardingState = { ...prev, mode: 'tour', wizardStep: 0, narrativeRecipeId }
    saveState(storageKey, next)
    setState(next)
  }, [storageKey, totalWizardSteps, config.pickRecipeUrl])

  const advanceTour = useCallback(() => {
    setState(prev => {
      if (!prev) return prev
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
      if (!prev || prev.completedActions.includes(actionId)) return prev
      const next = { ...prev, completedActions: [...prev.completedActions, actionId] }
      saveState(storageKey, next)
      return next
    })
  }, [storageKey])

  const dismissBeacon = useCallback((key: string) => {
    setState(prev => {
      if (!prev || prev.dismissedBeacons.includes(key)) return prev
      const next = { ...prev, dismissedBeacons: [...prev.dismissedBeacons, key] }
      saveState(storageKey, next)
      return next
    })
  }, [storageKey])

  const setAnswer = useCallback((stepId: string, answer: string | string[]) => {
    setState(prev => {
      if (!prev) return prev
      const next = { ...prev, wizardAnswers: { ...prev.wizardAnswers, [stepId]: answer } }
      saveState(storageKey, next)
      return next
    })
  }, [storageKey])

  const skip = useCallback(() => {
    const next: OnboardingState = { ...DEFAULT_STATE, mode: 'done' }
    saveState(storageKey, next)
    setState(next)
  }, [storageKey])

  const restart = useCallback(() => {
    const next: OnboardingState = { ...DEFAULT_STATE }
    saveState(storageKey, next)
    setState(next)
  }, [storageKey])

  return { state, advanceWizard, advanceTour, markActionComplete, dismissBeacon, setAnswer, skip, restart }
}
