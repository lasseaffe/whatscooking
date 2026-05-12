import { getEntitlement } from './entitlements';
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
