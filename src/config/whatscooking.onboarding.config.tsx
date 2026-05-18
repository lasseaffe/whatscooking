import { CookTypeStep } from '@/components/onboarding/steps/CookTypeStep'
import { GoalStep } from '@/components/onboarding/steps/GoalStep'
import { DietStep } from '@/components/onboarding/steps/DietStep'
import { HouseholdStep } from '@/components/onboarding/steps/HouseholdStep'
import type { OnboardingConfig } from '@/components/onboarding/onboarding.types'

export const wcOnboardingConfig: OnboardingConfig = {
  theme: {
    motion: 'smooth',
    accent: '#C19A6B',
    bg: '#1C1208',
    surface: '#2D1E0E',
    text: '#EFE3CE',
    textMuted: '#B08060',
    storageKey: 'wc-onboarding',
  },

  pickRecipeUrl: '/api/onboarding/pick-recipe',

  wizard: {
    steps: [
      { id: 'cook-type',  component: CookTypeStep,  title: 'What kind of cook are you?' },
      { id: 'goal',       component: GoalStep,       title: "What's your main goal?" },
      { id: 'diet',       component: DietStep,       title: 'Any dietary needs?', multiSelect: true },
      { id: 'household',  component: HouseholdStep,  title: 'Who are you cooking for?' },
    ],
  },

  // "Cook Your First Dinner" — 7 beats across 8 waypoints
  tour: {
    waypoints: [
      // Beat 1 — The Pick
      {
        id: 'the-pick',
        type: 'do',
        target: '[data-tour="swipe-deck"]',
        icon: '🔪',
        title: 'We found your first recipe.',
        body: 'Chosen for your taste and skill level. Swipe right to save it.',
        position: 'bottom',
        completeOn: 'swipe-right',
        celebrationText: 'Saved to your kitchen.',
        sound: 'cloth-swipe',
      },

      // Beat 2a — Pantry Nav
      {
        id: 'pantry-nav',
        type: 'demo',
        target: '[data-tour="pantry-nav"]',
        icon: '🧅',
        title: "Now let's see what you have.",
        body: 'Your pantry tells us which recipes you can cook tonight.',
        position: 'right',
      },

      // Beat 2b — Pantry Add
      {
        id: 'pantry-add',
        type: 'do',
        target: '[data-tour="pantry-input"]',
        icon: '🧅',
        title: 'Add one ingredient from your kitchen.',
        body: 'Try "chicken" or "pasta" — anything you have right now.',
        position: 'bottom',
        completeOn: 'pantry-item-added',
        sound: 'ceramic-tap',
      },

      // Beat 3 — The Plan
      {
        id: 'the-plan',
        type: 'do',
        target: '[data-tour="week-grid"]',
        icon: '📅',
        title: 'One slot to fill.',
        body: "Tap tonight's dinner to assign your recipe.",
        position: 'top',
        completeOn: 'meal-planned',
        celebrationText: "Tonight is ready.",
        sound: 'wooden-knock',
      },

      // Beat 4 — The Kitchen
      {
        id: 'the-kitchen',
        type: 'do',
        target: '[data-tour="start-cooking-btn"]',
        icon: '🔥',
        title: 'Your ingredients are ready. Your plan is set.',
        body: 'Open cooking mode when you want to cook.',
        position: 'bottom',
        completeOn: 'cooking-mode-entered',
        sound: 'stove-ignite',
      },

      // Beat 5 — The Timer
      {
        id: 'the-timer',
        type: 'do',
        target: '[data-tour="timer-control"]',
        icon: '⏱',
        title: 'This step needs time.',
        body: 'Set a timer so you can step away from the kitchen.',
        position: 'top',
        completeOn: 'timer-started',
        sound: 'timer-drop',
      },

      // Beat 6 — The Step
      {
        id: 'the-step',
        type: 'demo',
        target: '[data-tour="step-advance"]',
        icon: '✦',
        title: "You're cooking.",
        body: 'Move through each step at your own pace.',
        position: 'top',
      },

      // Beat 7 — Kitchen Ready
      {
        id: 'kitchen-ready',
        type: 'celebration',
        target: 'body',
        title: '',
        body: '',
        celebrationText: 'Your first dinner is planned.',
        celebrationSummary: [
          'Recipe saved to your kitchen',
          'Pantry stocked',
          "Tonight's dinner scheduled",
        ],
        sound: 'warm-bell',
      },
    ],
  },

  beacons: [
    { id: 'dinner-party', target: '[data-beacon="dinner-party"]', label: 'Host a Dinner Party', key: 'beacon-dinner-party' },
    { id: 'scanner',      target: '[data-beacon="menu-scanner"]', label: 'Scan a Menu',          key: 'beacon-scanner' },
    { id: 'calorie',      target: '[data-beacon="calorie"]',      label: 'Track Calories',       key: 'beacon-calorie' },
    { id: 'passport',     target: '[data-beacon="passport"]',     label: 'Cuisine Passport',     key: 'beacon-passport' },
    { id: 'drinks',       target: '[data-beacon="drinks"]',       label: 'Discover Drinks',      key: 'beacon-drinks' },
  ],
}
