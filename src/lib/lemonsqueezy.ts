// src/lib/lemonsqueezy.ts

const LS_BASE = 'https://api.lemonsqueezy.com/v1'

function lsHeaders() {
  return {
    Authorization: `Bearer ${process.env.LS_API_KEY!}`,
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
      ? process.env.LS_ANNUAL_VARIANT_ID!
      : process.env.LS_MONTHLY_VARIANT_ID!

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
            redirect_url: `${process.env.NEXT_PUBLIC_APP_URL}/settings?upgraded=1`,
          },
        },
        relationships: {
          store: { data: { type: 'stores', id: process.env.LS_STORE_ID! } },
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
  return json.data.attributes.url as string
}

/**
 * Verify a LemonSqueezy webhook signature.
 * Signature is HMAC-SHA256 of the raw request body using LS_WEBHOOK_SECRET.
 */
export async function verifyWebhookSignature(
  rawBody: string,
  signature: string
): Promise<boolean> {
  const { createHmac } = await import('crypto')
  const expected = createHmac('sha256', process.env.LS_WEBHOOK_SECRET!)
    .update(rawBody)
    .digest('hex')
  return expected === signature
}
