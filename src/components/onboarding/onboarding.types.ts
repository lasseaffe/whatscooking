export interface OnboardingTheme {
  motion: 'smooth' | 'snappy' | 'terminal'
  accent: string
  bg: string
  surface: string
  text: string
  textMuted: string
  storageKey: string
}

export interface WizardStepProps {
  onAnswer: (answer: string | string[]) => void
  answer: string | string[] | undefined
  theme: OnboardingTheme
}

export interface OnboardingWizardStep {
  id: string
  component: React.ComponentType<WizardStepProps>
  title: string
  multiSelect?: boolean
}

export interface OnboardingWaypoint {
  id: string
  type: 'demo' | 'do' | 'celebration'
  target: string
  title: string
  body: string
  position?: 'top' | 'bottom' | 'left' | 'right'
  completeOn?: string
  celebrationText?: string
  celebrationSummary?: string[]
}

export interface OnboardingBeacon {
  id: string
  target: string
  label: string
  key: string
}

export interface OnboardingConfig {
  theme: OnboardingTheme
  wizard: { steps: OnboardingWizardStep[] }
  tour: { waypoints: OnboardingWaypoint[] }
  beacons: OnboardingBeacon[]
}

export interface OnboardingState {
  mode: 'wizard' | 'tour' | 'beacons' | 'done'
  wizardStep: number
  tourStep: number
  wizardAnswers: Record<string, string | string[]>
  dismissedBeacons: string[]
  completedActions: string[]
}
