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

  wizard: {
    steps: [
      { id: 'cook-type',  component: CookTypeStep,  title: 'What kind of cook are you?' },
      { id: 'goal',       component: GoalStep,       title: "What's your main goal?" },
      { id: 'diet',       component: DietStep,       title: 'Any dietary needs?', multiSelect: true },
      { id: 'household',  component: HouseholdStep,  title: 'Who are you cooking for?' },
    ],
  },

  tour: {
    waypoints: [
      {
        id: 'discover-intro',
        type: 'demo',
        target: '[data-tour="swipe-deck"]',
        title: "Here's your Discover feed",
        body: 'Recipes tailored to your preferences appear here. Swipe to explore.',
        position: 'bottom',
      },
      {
        id: 'first-swipe',
        type: 'do',
        target: '[data-tour="swipe-deck"]',
        title: 'Swipe right on anything that looks good',
        body: 'Give it a try — swipe right to save a recipe to your collection.',
        position: 'bottom',
        completeOn: 'swipe-right',
        celebrationText: 'Recipe saved! 🎉',
      },
      {
        id: 'pantry-intro',
        type: 'demo',
        target: '[data-tour="pantry-nav"]',
        title: 'Your Pantry tracks what you have',
        body: 'Add ingredients and we\'ll find recipes you can make right now.',
        position: 'right',
      },
      {
        id: 'pantry-add',
        type: 'do',
        target: '[data-tour="pantry-input"]',
        title: 'Type an ingredient you have right now',
        body: 'Try "chicken" or "pasta" — autocomplete will help.',
        position: 'bottom',
        completeOn: 'pantry-item-added',
        celebrationText: 'Pantry updated! We found recipes for you 🧅',
      },
      {
        id: 'pantry-magic',
        type: 'demo',
        target: '[data-tour="pantry-matches"]',
        title: 'Recipes you can cook RIGHT NOW',
        body: 'These recipes use ingredients you already have.',
        position: 'top',
      },
      {
        id: 'meal-plan',
        type: 'do',
        target: '[data-tour="week-grid"]',
        title: 'Tap Monday dinner to plan it',
        body: 'Tap any empty slot to assign a recipe to that meal.',
        position: 'top',
        completeOn: 'meal-planned',
        celebrationText: 'Meal planned! Your week is taking shape 🗓️',
      },
      {
        id: 'cookbooks-intro',
        type: 'demo',
        target: '[data-tour="cookbooks-nav"]',
        title: 'Build recipe collections',
        body: 'Create cookbooks for weeknights, dinner parties, or any occasion.',
        position: 'right',
      },
      {
        id: 'dinner-party',
        type: 'demo',
        target: '[data-tour="dinner-party-nav"]',
        title: 'Hosting guests? Dinner Party mode',
        body: 'Scale recipes, assign courses, sync a grocery list, and see a timing view — all in one flow.',
        position: 'right',
      },
      {
        id: 'scanner',
        type: 'demo',
        target: '[data-tour="menu-scanner-nav"]',
        title: 'Scan a restaurant menu',
        body: 'Point your camera at any menu — AI extracts every dish and adds them to your collection.',
        position: 'top',
      },
      {
        id: 'calorie-tracker',
        type: 'demo',
        target: '[data-tour="calorie-nav"]',
        title: 'Calorie tracker — auto-filled from plans',
        body: "Today's meals are already logged from the plan you just built.",
        position: 'top',
      },
      {
        id: 'done',
        type: 'celebration',
        target: 'body',
        title: 'Your kitchen is alive!',
        body: '',
        celebrationText: 'Your kitchen is alive! 🎉',
        celebrationSummary: [
          'Recipe saved to your collection',
          'Pantry item added',
          'Meal planned for the week',
        ],
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
