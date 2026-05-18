/**
 * @jest-environment node
 */
import { withPaywallErrorBoundary } from './api-error-boundary';
import { PaywallError } from './paywall-error';
import { NextResponse } from 'next/server';

describe('withPaywallErrorBoundary', () => {
  it('returns the wrapped handler result on success', async () => {
    const handler = async () => NextResponse.json({ ok: true });
    const wrapped = withPaywallErrorBoundary(handler);
    const res = await wrapped(new Request('http://localhost/api/x'));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
  });

  it('serializes PaywallError as 402 with the toJSON body', async () => {
    const handler = async () => {
      throw new PaywallError({
        requiredTier: 'household',
        currentTier: 'free',
        feature: 'shared_pantry',
      });
    };
    const wrapped = withPaywallErrorBoundary(handler);
    const res = await wrapped(new Request('http://localhost/api/x'));
    expect(res.status).toBe(402);
    expect(await res.json()).toEqual({
      error: 'payment_required',
      feature: 'shared_pantry',
      required_tier: 'household',
      current_tier: 'free',
      upgrade_url: '/pricing?tier=household&feature=shared_pantry',
    });
  });

  it('rethrows non-PaywallError errors unchanged so existing handlers still log them', async () => {
    const handler = async () => {
      throw new Error('something else');
    };
    const wrapped = withPaywallErrorBoundary(handler);
    await expect(wrapped(new Request('http://localhost/api/x'))).rejects.toThrow('something else');
  });
});
