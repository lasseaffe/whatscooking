import type { SubscriptionRow, SubscriptionTier, SubscriptionStatus, BillingPeriod } from '@/lib/subscription-types';

export type FixtureState =
  | 'free'
  | 'trialing'
  | 'solo_monthly'
  | 'solo_annual'
  | 'household_monthly'
  | 'household_annual'
  | 'grandfathered'
  | 'past_due'
  | 'canceled';

export function fixtureRow(userId: string, state: FixtureState): SubscriptionRow {
  const now = new Date();
  const in30Days = new Date(now.getTime() + 30 * 86400000).toISOString();
  const in7Days = new Date(now.getTime() + 7 * 86400000).toISOString();
  const inOneYear = new Date(now.getTime() + 365 * 86400000).toISOString();

  const base: SubscriptionRow = {
    user_id: userId,
    rc_user_id: userId,
    tier: 'free',
    status: 'free',
    current_period_end: null,
    trial_end_at: null,
    cancel_at_period_end: false,
    stripe_customer_id: null,
    rc_entitlement: null,
    billing_period: null,
    created_at: now.toISOString(),
    updated_at: now.toISOString(),
  };

  switch (state) {
    case 'free':
      return base;
    case 'trialing':
      return { ...base, tier: 'household', status: 'trialing', trial_end_at: in7Days };
    case 'solo_monthly':
      return {
        ...base,
        tier: 'solo_plus',
        status: 'active',
        current_period_end: in30Days,
        billing_period: 'monthly',
        stripe_customer_id: 'cus_test_solo_m',
        rc_entitlement: 'solo_plus',
      };
    case 'solo_annual':
      return {
        ...base,
        tier: 'solo_plus',
        status: 'active',
        current_period_end: inOneYear,
        billing_period: 'annual',
        stripe_customer_id: 'cus_test_solo_a',
        rc_entitlement: 'solo_plus',
      };
    case 'household_monthly':
      return {
        ...base,
        tier: 'household',
        status: 'active',
        current_period_end: in30Days,
        billing_period: 'monthly',
        stripe_customer_id: 'cus_test_hh_m',
        rc_entitlement: 'household',
      };
    case 'household_annual':
      return {
        ...base,
        tier: 'household',
        status: 'active',
        current_period_end: inOneYear,
        billing_period: 'annual',
        stripe_customer_id: 'cus_test_hh_a',
        rc_entitlement: 'household',
      };
    case 'grandfathered':
      return { ...base, tier: 'household', status: 'grandfathered', trial_end_at: in30Days };
    case 'past_due':
      return {
        ...base,
        tier: 'household',
        status: 'past_due',
        current_period_end: in30Days,
        billing_period: 'monthly',
        stripe_customer_id: 'cus_test_pd',
      };
    case 'canceled':
      return {
        ...base,
        tier: 'household',
        status: 'canceled',
        current_period_end: in30Days,
        cancel_at_period_end: true,
        billing_period: 'monthly',
      };
  }
}

export const ALL_FIXTURE_STATES: FixtureState[] = [
  'free', 'trialing', 'solo_monthly', 'solo_annual',
  'household_monthly', 'household_annual', 'grandfathered',
  'past_due', 'canceled',
];
