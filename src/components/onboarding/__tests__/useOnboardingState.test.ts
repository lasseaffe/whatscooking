// src/components/onboarding/__tests__/useOnboardingState.test.ts
import { renderHook, act } from '@testing-library/react'
import { useOnboardingState } from '../useOnboardingState'
import type { OnboardingConfig } from '../onboarding.types'

const mockConfig: OnboardingConfig = {
  theme: { motion: 'smooth', accent: '#C19A6B', bg: '#1C1208', surface: '#2D1E0E',
           text: '#EFE3CE', textMuted: '#B08060', storageKey: 'test-ob' },
  wizard: { steps: [{ id: 's1', component: () => null, title: 'Q1' },
                    { id: 's2', component: () => null, title: 'Q2' }] },
  tour: { waypoints: [{ id: 'w1', type: 'demo', target: '[data-tour="a"]', title: 'T', body: 'B' },
                      { id: 'w2', type: 'do', target: '[data-tour="b"]', title: 'T2', body: 'B2', completeOn: 'ev' }] },
  beacons: [{ id: 'b1', target: '[data-beacon="x"]', label: 'L', key: 'beacon-x' }],
}

beforeEach(() => localStorage.clear())

test('new user starts in wizard mode at step 0', () => {
  const { result } = renderHook(() => useOnboardingState(mockConfig))
  expect(result.current.state.mode).toBe('wizard')
  expect(result.current.state.wizardStep).toBe(0)
})

test('resumes saved state from localStorage', () => {
  localStorage.setItem('test-ob', JSON.stringify({
    mode: 'beacons', wizardStep: 0, tourStep: 0,
    wizardAnswers: {}, dismissedBeacons: [], completedActions: [],
  }))
  const { result } = renderHook(() => useOnboardingState(mockConfig))
  expect(result.current.state.mode).toBe('beacons')
})

test('advanceWizard increments step', () => {
  const { result } = renderHook(() => useOnboardingState(mockConfig))
  act(() => result.current.advanceWizard())
  expect(result.current.state.wizardStep).toBe(1)
})

test('advanceWizard transitions to tour when all steps done', () => {
  const { result } = renderHook(() => useOnboardingState(mockConfig))
  act(() => result.current.advanceWizard()) // step 0 → 1
  act(() => result.current.advanceWizard()) // step 1 → tour
  expect(result.current.state.mode).toBe('tour')
})

test('advanceTour increments tourStep', () => {
  localStorage.setItem('test-ob', JSON.stringify({
    mode: 'tour', wizardStep: 0, tourStep: 0,
    wizardAnswers: {}, dismissedBeacons: [], completedActions: [],
  }))
  const { result } = renderHook(() => useOnboardingState(mockConfig))
  act(() => result.current.advanceTour())
  expect(result.current.state.tourStep).toBe(1)
})

test('advanceTour transitions to beacons when all waypoints done', () => {
  localStorage.setItem('test-ob', JSON.stringify({
    mode: 'tour', wizardStep: 0, tourStep: 1,
    wizardAnswers: {}, dismissedBeacons: [], completedActions: [],
  }))
  const { result } = renderHook(() => useOnboardingState(mockConfig))
  act(() => result.current.advanceTour())
  expect(result.current.state.mode).toBe('beacons')
})

test('dismissBeacon adds key and persists', () => {
  localStorage.setItem('test-ob', JSON.stringify({
    mode: 'beacons', wizardStep: 0, tourStep: 0,
    wizardAnswers: {}, dismissedBeacons: [], completedActions: [],
  }))
  const { result } = renderHook(() => useOnboardingState(mockConfig))
  act(() => result.current.dismissBeacon('beacon-x'))
  expect(result.current.state.dismissedBeacons).toContain('beacon-x')
  const saved = JSON.parse(localStorage.getItem('test-ob')!)
  expect(saved.dismissedBeacons).toContain('beacon-x')
})

test('skip sets mode to done', () => {
  const { result } = renderHook(() => useOnboardingState(mockConfig))
  act(() => result.current.skip())
  expect(result.current.state.mode).toBe('done')
})

test('restart resets state to wizard mode', () => {
  localStorage.setItem('test-ob', JSON.stringify({
    mode: 'done', wizardStep: 0, tourStep: 0,
    wizardAnswers: {}, dismissedBeacons: ['beacon-x'], completedActions: [],
  }))
  const { result } = renderHook(() => useOnboardingState(mockConfig))
  act(() => result.current.restart())
  expect(result.current.state.mode).toBe('wizard')
  expect(result.current.state.dismissedBeacons).toEqual([])
})

test('setAnswer stores answer keyed by step id', () => {
  const { result } = renderHook(() => useOnboardingState(mockConfig))
  act(() => result.current.setAnswer('cook-type', 'home-cook'))
  expect(result.current.state.wizardAnswers['cook-type']).toBe('home-cook')
})

test('loads partial localStorage and merges with default state', () => {
  // Only 'mode' is stored — completedActions, dismissedBeacons etc. are missing
  localStorage.setItem('test-ob', JSON.stringify({ mode: 'tour' }))
  const { result } = renderHook(() => useOnboardingState(mockConfig))
  expect(result.current.state.mode).toBe('tour')
  expect(result.current.state.completedActions).toEqual([])
  expect(result.current.state.dismissedBeacons).toEqual([])
  expect(result.current.state.wizardAnswers).toEqual({})
})

test('state updates in React even when localStorage.setItem throws', () => {
  const spy = jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
    throw new Error('QuotaExceededError')
  })
  const { result } = renderHook(() => useOnboardingState(mockConfig))
  act(() => result.current.skip())
  expect(result.current.state.mode).toBe('done')
  spy.mockRestore()
})

test('default state includes narrativeRecipeId as null', () => {
  const { result } = renderHook(() => useOnboardingState(mockConfig))
  expect(result.current.state.narrativeRecipeId).toBeNull()
})
