// src/lib/lemonsqueezy.ts

import { createHmac, timingSafeEqual } from 'crypto'

function requireEnv(name: string): string {
  const v = process.env[name]
  if (!v) throw new Error(`Missing required environment variable: ${name}`)
  return v
}

const LS_BASE = 'https://api.lemonsqueezy.com/v1'

function lsHeaders() {
  return {
    Authorization: `Bearer ${requireEnv('LS_API_KEY')}`,
    'Content-Type': 'application/vnd.api+json',
    Accept: 'application/vnd.api+json',
  }
}

export type PlanType = 'monthly' | 'annual'

/**
 * Create a LemonSqueezy hosted checkout URL for a subscription plan.
 * custom.user_id is stored in checkout metadata so webhooks can identify the user.
 */
export async function createCheckoutUrl(
  userEmail: string,
  userId: string,
  plan: PlanType
): Promise<string> {
  const variantId =
    plan === 'annual'
      ? requireEnv('LS_ANNUAL_VARIANT_ID')
      : requireEnv('LS_MONTHLY_VARIANT_ID')

  const res = await fetch(`${LS_BASE}/checkouts`, {
    method: 'POST',
    headers: lsHeaders(),
    body: JSON.stringify({
      data: {
        type: 'checkouts',
        attributes: {
          checkout_data: {
            email: userEmail,
            custom: { user_id: userId },
          },
          product_options: {
            redirect_url: `${requireEnv('NEXT_PUBLIC_APP_URL')}/settings?upgraded=1`,
          },
        },
        relationships: {
          store: { data: { type: 'stores', id: requireEnv('LS_STORE_ID') } },
          variant: { data: { type: 'variants', id: variantId } },
        },
      },
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`LemonSqueezy checkout creation failed (${res.status}): ${err}`)
  }

  const json = await res.json()
  const url = json?.data?.attributes?.url
  if (typeof url !== 'string') {
    throw new Error('LemonSqueezy: unexpected checkout response shape')
  }
  return url
}

/**
 * Verify a LemonSqueezy webhook signature.
 * Signature is HMAC-SHA256 of the raw request body using LS_WEBHOOK_SECRET.
 */
export function verifyWebhookSignature(
  rawBody: string,
  signature: string
): boolean {
  const expected = createHmac('sha256', requireEnv('LS_WEBHOOK_SECRET'))
    .update(rawBody)
    .digest('hex')
  const expectedBuf = Buffer.from(expected, 'hex')
  const signatureBuf = Buffer.from(signature, 'hex')
  if (expectedBuf.length !== signatureBuf.length) return false
  return timingSafeEqual(expectedBuf, signatureBuf)
}
