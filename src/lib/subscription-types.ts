// ============================================================
// Subscription Enums & Types
// ============================================================

export type SubscriptionTier = 'free' | 'solo_plus' | 'household';

export type SubscriptionStatus =
  | 'active'
  | 'trialing'
  | 'past_due'
  | 'canceled'
  | 'grandfathered'
  | 'free';

export type BillingPeriod = 'monthly' | 'annual';

export type SubscriptionEventSource = 'revenuecat' | 'stripe' | 'system';

// ============================================================
// Database Row Types
// ============================================================

export interface SubscriptionRow {
  user_id: string;
  rc_user_id: string;
  tier: SubscriptionTier;
  status: SubscriptionStatus;
  current_period_end: string | null;
  trial_end_at: string | null;
  cancel_at_period_end: boolean;
  stripe_customer_id: string | null;
  rc_entitlement: string | null;
  billing_period: BillingPeriod | null;
  created_at: string;
  updated_at: string;
}

export interface SubscriptionEventRow {
  id: number;
  user_id: string | null;
  event_type: string;
  source: SubscriptionEventSource;
  payload: Record<string, unknown>;
  created_at: string;
}

// ============================================================
// Constants
// ============================================================

export const SUBSCRIPTION_TIERS: SubscriptionTier[] = [
  'free',
  'solo_plus',
  'household',
];

export const SUBSCRIPTION_STATUSES: SubscriptionStatus[] = [
  'active',
  'trialing',
  'past_due',
  'canceled',
  'grandfathered',
  'free',
];

export const BILLING_PERIODS: BillingPeriod[] = [
  'monthly',
  'annual',
];

export const SUBSCRIPTION_EVENT_SOURCES: SubscriptionEventSource[] = [
  'revenuecat',
  'stripe',
  'system',
];
