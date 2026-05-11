import { render, act } from '@testing-library/react'
import { ActionGate } from '../ActionGate'

test('calls onComplete when matching event is dispatched', () => {
  const onComplete = jest.fn()
  render(<ActionGate completeOn="swipe-right" onComplete={onComplete} />)
  act(() => {
    window.dispatchEvent(new CustomEvent('onboarding:action', { detail: { id: 'swipe-right' } }))
  })
  expect(onComplete).toHaveBeenCalledTimes(1)
})

test('does not call onComplete for non-matching event', () => {
  const onComplete = jest.fn()
  render(<ActionGate completeOn="swipe-right" onComplete={onComplete} />)
  act(() => {
    window.dispatchEvent(new CustomEvent('onboarding:action', { detail: { id: 'other-event' } }))
  })
  expect(onComplete).not.toHaveBeenCalled()
})

test('does not call onComplete when inactive', () => {
  const onComplete = jest.fn()
  render(<ActionGate completeOn="swipe-right" onComplete={onComplete} active={false} />)
  act(() => {
    window.dispatchEvent(new CustomEvent('onboarding:action', { detail: { id: 'swipe-right' } }))
  })
  expect(onComplete).not.toHaveBeenCalled()
})

test('only fires onComplete once per mount', () => {
  const onComplete = jest.fn()
  render(<ActionGate completeOn="swipe-right" onComplete={onComplete} />)
  act(() => {
    window.dispatchEvent(new CustomEvent('onboarding:action', { detail: { id: 'swipe-right' } }))
    window.dispatchEvent(new CustomEvent('onboarding:action', { detail: { id: 'swipe-right' } }))
  })
  expect(onComplete).toHaveBeenCalledTimes(1)
})
