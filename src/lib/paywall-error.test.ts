import { PaywallError } from './paywall-error';

describe('PaywallError', () => {
  it('captures required tier and current tier', () => {
    const err = new PaywallError({
      requiredTier: 'household',
      currentTier: 'free',
      feature: 'shared_pantry',
    });
    expect(err.name).toBe('PaywallError');
    expect(err.requiredTier).toBe('household');
    expect(err.currentTier).toBe('free');
    expect(err.feature).toBe('shared_pantry');
    expect(err.message).toMatch(/shared_pantry/);
  });

  it('is an instance of Error', () => {
    const err = new PaywallError({
      requiredTier: 'solo_plus',
      currentTier: 'free',
      feature: 'ai_recipe_gen',
    });
    expect(err).toBeInstanceOf(Error);
    expect(err).toBeInstanceOf(PaywallError);
  });

  it('serializes to a 402-shaped JSON body', () => {
    const err = new PaywallError({
      requiredTier: 'household',
      currentTier: 'solo_plus',
      feature: 'dinner_parties',
    });
    expect(err.toJSON()).toEqual({
      error: 'payment_required',
      feature: 'dinner_parties',
      required_tier: 'household',
      current_tier: 'solo_plus',
      upgrade_url: '/pricing?tier=household&feature=dinner_parties',
    });
  });
});
