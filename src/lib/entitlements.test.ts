import { getEntitlement, requireTier, hasFeature } from './entitlements';
import { PaywallError } from './paywall-error';
import { fixtureRow } from './test-helpers/entitlement-fixtures';
import type { SubscriptionRow } from './subscription-types';

function mockSupabaseWithRow(row: SubscriptionRow | null) {
  return {
    from: jest.fn().mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          maybeSingle: jest.fn().mockResolvedValue({ data: row, error: null }),
        }),
      }),
    }),
  } as any;
}

describe('getEntitlement', () => {
  it('returns the free default for a user with no subscription row', async () => {
    const supabase = mockSupabaseWithRow(null);
    const ent = await getEntitlement('user_xyz', supabase);
    expect(ent.tier).toBe('free');
    expect(ent.status).toBe('free');
    expect(ent.trialEndAt).toBeNull();
    expect(ent.periodEnd).toBeNull();
  });

  it('returns the row values for an active solo subscriber', async () => {
    const row = fixtureRow('user_xyz', 'solo_monthly');
    const supabase = mockSupabaseWithRow(row);
    const ent = await getEntitlement('user_xyz', supabase);
    expect(ent.tier).toBe('solo_plus');
    expect(ent.status).toBe('active');
    expect(ent.periodEnd).toBeInstanceOf(Date);
  });

  it('reports household tier for a trialing user', async () => {
    const row = fixtureRow('user_xyz', 'trialing');
    const supabase = mockSupabaseWithRow(row);
    const ent = await getEntitlement('user_xyz', supabase);
    expect(ent.tier).toBe('household');
    expect(ent.status).toBe('trialing');
    expect(ent.trialEndAt).toBeInstanceOf(Date);
  });

  it('reports household tier for a grandfathered user', async () => {
    const row = fixtureRow('user_xyz', 'grandfathered');
    const supabase = mockSupabaseWithRow(row);
    const ent = await getEntitlement('user_xyz', supabase);
    expect(ent.tier).toBe('household');
    expect(ent.status).toBe('grandfathered');
  });

  it('throws on a database error rather than silently returning free', async () => {
    const supabase = {
      from: () => ({
        select: () => ({
          eq: () => ({
            maybeSingle: () => Promise.resolve({ data: null, error: { message: 'boom' } }),
          }),
        }),
      }),
    } as any;
    await expect(getEntitlement('user_xyz', supabase)).rejects.toThrow(/boom/);
  });
});

describe('requireTier', () => {
  it('returns void when current tier meets requirement', async () => {
    const row = fixtureRow('u', 'household_monthly');
    const supabase = mockSupabaseWithRow(row);
    await expect(requireTier('u', 'household', 'dinner_parties', supabase)).resolves.toBeUndefined();
  });

  it('returns void when solo user accesses solo feature', async () => {
    const row = fixtureRow('u', 'solo_monthly');
    const supabase = mockSupabaseWithRow(row);
    await expect(requireTier('u', 'solo_plus', 'ai_recipe_gen', supabase)).resolves.toBeUndefined();
  });

  it('returns void when household user accesses solo feature', async () => {
    const row = fixtureRow('u', 'household_monthly');
    const supabase = mockSupabaseWithRow(row);
    await expect(requireTier('u', 'solo_plus', 'ai_recipe_gen', supabase)).resolves.toBeUndefined();
  });

  it('treats trialing as household for require purposes', async () => {
    const row = fixtureRow('u', 'trialing');
    const supabase = mockSupabaseWithRow(row);
    await expect(requireTier('u', 'household', 'dinner_parties', supabase)).resolves.toBeUndefined();
  });

  it('treats grandfathered as household for require purposes', async () => {
    const row = fixtureRow('u', 'grandfathered');
    const supabase = mockSupabaseWithRow(row);
    await expect(requireTier('u', 'household', 'dinner_parties', supabase)).resolves.toBeUndefined();
  });

  it('throws PaywallError when free user hits solo gate', async () => {
    const supabase = mockSupabaseWithRow(null);
    await expect(requireTier('u', 'solo_plus', 'ai_recipe_gen', supabase)).rejects.toBeInstanceOf(PaywallError);
  });

  it('throws PaywallError when solo user hits household gate', async () => {
    const row = fixtureRow('u', 'solo_monthly');
    const supabase = mockSupabaseWithRow(row);
    try {
      await requireTier('u', 'household', 'dinner_parties', supabase);
      throw new Error('should have thrown');
    } catch (e) {
      expect(e).toBeInstanceOf(PaywallError);
      expect((e as PaywallError).currentTier).toBe('solo_plus');
      expect((e as PaywallError).requiredTier).toBe('household');
      expect((e as PaywallError).feature).toBe('dinner_parties');
    }
  });

  it('throws PaywallError when past_due household user hits gate', async () => {
    const row = fixtureRow('u', 'past_due');
    const supabase = mockSupabaseWithRow(row);
    await expect(requireTier('u', 'solo_plus', 'ai_recipe_gen', supabase)).rejects.toBeInstanceOf(PaywallError);
  });

  it('throws PaywallError when canceled household user hits gate AFTER period end', async () => {
    const row = fixtureRow('u', 'canceled');
    row.current_period_end = new Date(Date.now() - 86400000).toISOString();
    const supabase = mockSupabaseWithRow(row);
    await expect(requireTier('u', 'solo_plus', 'ai_recipe_gen', supabase)).rejects.toBeInstanceOf(PaywallError);
  });

  it('GRANTS access for canceled user whose period has not yet ended', async () => {
    const row = fixtureRow('u', 'canceled');
    const supabase = mockSupabaseWithRow(row);
    await expect(requireTier('u', 'household', 'dinner_parties', supabase)).resolves.toBeUndefined();
  });
});

describe('hasFeature', () => {
  it('maps ai_recipe_gen to solo_plus tier', async () => {
    const row = fixtureRow('u', 'solo_monthly');
    const supabase = mockSupabaseWithRow(row);
    expect(await hasFeature('u', 'ai_recipe_gen', supabase)).toBe(true);
  });

  it('denies ai_recipe_gen for free user', async () => {
    const supabase = mockSupabaseWithRow(null);
    expect(await hasFeature('u', 'ai_recipe_gen', supabase)).toBe(false);
  });

  it('maps shared_pantry to household tier', async () => {
    const soloRow = fixtureRow('u', 'solo_monthly');
    const soloSupabase = mockSupabaseWithRow(soloRow);
    expect(await hasFeature('u', 'shared_pantry', soloSupabase)).toBe(false);

    const hhRow = fixtureRow('u', 'household_monthly');
    const hhSupabase = mockSupabaseWithRow(hhRow);
    expect(await hasFeature('u', 'shared_pantry', hhSupabase)).toBe(true);
  });
});
