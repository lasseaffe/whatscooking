import type { SupabaseClient } from '@supabase/supabase-js';
import type { SubscriptionRow, SubscriptionTier, SubscriptionStatus } from './subscription-types';

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
