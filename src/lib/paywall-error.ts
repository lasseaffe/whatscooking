import type { SubscriptionTier } from './subscription-types';

export type GatedFeature =
  | 'ai_recipe_gen'
  | 'ai_plan_gen'
  | 'recipe_import'
  | 'coach_chat'
  | 'shared_pantry'
  | 'household_members'
  | 'dinner_parties'
  | 'family_allergens'
  | 'unlimited_saves'
  | 'unlimited_plans';

export interface PaywallErrorInput {
  requiredTier: Exclude<SubscriptionTier, 'free'>;
  currentTier: SubscriptionTier;
  feature: GatedFeature;
}

export class PaywallError extends Error {
  readonly requiredTier: Exclude<SubscriptionTier, 'free'>;
  readonly currentTier: SubscriptionTier;
  readonly feature: GatedFeature;

  constructor(input: PaywallErrorInput) {
    super(`Feature "${input.feature}" requires ${input.requiredTier} tier (current: ${input.currentTier})`);
    this.name = 'PaywallError';
    this.requiredTier = input.requiredTier;
    this.currentTier = input.currentTier;
    this.feature = input.feature;
    Object.setPrototypeOf(this, PaywallError.prototype);
  }

  toJSON() {
    return {
      error: 'payment_required',
      feature: this.feature,
      required_tier: this.requiredTier,
      current_tier: this.currentTier,
      upgrade_url: `/pricing?tier=${this.requiredTier}&feature=${this.feature}`,
    };
  }
}
