import { render, screen, fireEvent } from '@testing-library/react'
import { OnboardingEngine } from '../OnboardingEngine'
import type { OnboardingConfig } from '../onboarding.types'

const SimpleStep = ({ onAnswer }: any) => (
  <button onClick={() => onAnswer('val')}>Pick</button>
)

const config: OnboardingConfig = {
  theme: { motion: 'smooth', accent: '#C19A6B', bg: '#1C1208', surface: '#2D1E0E',
           text: '#EFE3CE', textMuted: '#B08060', storageKey: 'test-engine' },
  wizard: { steps: [{ id: 's1', component: SimpleStep, title: 'Q1' }] },
  tour: { waypoints: [{ id: 'w1', type: 'demo', target: '[data-tour="x"]', title: 'T', body: 'B' }] },
  beacons: [],
}

beforeEach(() => localStorage.clear())

test('renders wizard for new user', () => {
  render(<OnboardingEngine config={config} />)
  expect(screen.getByText('Q1')).toBeInTheDocument()
})

test('does not render when mode is done', () => {
  localStorage.setItem('test-engine', JSON.stringify({
    mode: 'done', wizardStep: 0, tourStep: 0,
    wizardAnswers: {}, dismissedBeacons: [], completedActions: [],
  }))
  const { container } = render(<OnboardingEngine config={config} />)
  expect(container).toBeEmptyDOMElement()
})

test('skip button sets mode to done', () => {
  render(<OnboardingEngine config={config} />)
  fireEvent.click(screen.getByText(/skip/i))
  const saved = JSON.parse(localStorage.getItem('test-engine')!)
  expect(saved.mode).toBe('done')
})
