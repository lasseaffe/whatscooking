import type { SupabaseClient } from '@supabase/supabase-js';
import type { SubscriptionRow, SubscriptionTier, SubscriptionStatus } from './subscription-types';
import { PaywallError, type GatedFeature } from './paywall-error';

export interface Entitlement {
  tier: SubscriptionTier;
  status: SubscriptionStatus;
  trialEndAt: Date | null;
  periodEnd: Date | null;
}

const FREE_DEFAULT: Entitlement = {
  tier: 'free',
  status: 'free',
  trialEndAt: null,
  periodEnd: null,
};

export async function getEntitlement(
  userId: string,
  supabase: SupabaseClient,
): Promise<Entitlement> {
  const { data, error } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    throw new Error(`getEntitlement failed: ${error.message}`);
  }

  if (!data) {
    return FREE_DEFAULT;
  }

  const row = data as SubscriptionRow;
  return {
    tier: row.tier,
    status: row.status,
    trialEndAt: row.trial_end_at ? new Date(row.trial_end_at) : null,
    periodEnd: row.current_period_end ? new Date(row.current_period_end) : null,
  };
}

const FEATURE_TIER: Record<GatedFeature, Exclude<SubscriptionTier, 'free'>> = {
  ai_recipe_gen:     'solo_plus',
  ai_plan_gen:       'solo_plus',
  recipe_import:     'solo_plus',
  coach_chat:        'solo_plus',
  unlimited_saves:   'solo_plus',
  unlimited_plans:   'solo_plus',
  shared_pantry:     'household',
  household_members: 'household',
  dinner_parties:    'household',
  family_allergens:  'household',
};

function isEntitlementActive(ent: Entitlement, now = new Date()): boolean {
  switch (ent.status) {
    case 'active':
    case 'trialing':
    case 'grandfathered':
      return true;
    case 'canceled':
      return ent.periodEnd !== null && ent.periodEnd > now;
    case 'past_due':
    case 'free':
      return false;
  }
}

const TIER_RANK: Record<SubscriptionTier, number> = {
  free: 0,
  solo_plus: 1,
  household: 2,
};

function meetsRequirement(ent: Entitlement, required: Exclude<SubscriptionTier, 'free'>): boolean {
  if (!isEntitlementActive(ent)) return false;
  return TIER_RANK[ent.tier] >= TIER_RANK[required];
}

export async function requireTier(
  userId: string,
  required: Exclude<SubscriptionTier, 'free'>,
  feature: GatedFeature,
  supabase: SupabaseClient,
): Promise<void> {
  const ent = await getEntitlement(userId, supabase);
  if (meetsRequirement(ent, required)) {
    return;
  }
  throw new PaywallError({
    requiredTier: required,
    currentTier: ent.tier,
    feature,
  });
}

export async function hasFeature(
  userId: string,
  feature: GatedFeature,
  supabase: SupabaseClient,
): Promise<boolean> {
  const required = FEATURE_TIER[feature];
  const ent = await getEntitlement(userId, supabase);
  return meetsRequirement(ent, required);
}
