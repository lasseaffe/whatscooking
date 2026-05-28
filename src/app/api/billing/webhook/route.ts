import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { verifyWebhookSignature } from '@/lib/lemonsqueezy'

export async function POST(request: Request) {
  const rawBody = await request.text()
  const signature = request.headers.get('x-signature') ?? ''

  if (!verifyWebhookSignature(rawBody, signature)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  let event: Record<string, unknown>
  try {
    event = JSON.parse(rawBody)
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const eventName = (event.meta as Record<string, unknown>)?.event_name as string | undefined
  const customData = (event.meta as Record<string, unknown>)?.custom_data as Record<string, unknown> | undefined
  const userId = customData?.user_id as string | undefined

  if (!userId) {
    // Webhook not tied to a user — acknowledge silently
    return NextResponse.json({ ok: true })
  }

  const supabase = createServiceClient()
  const attrs = (event.data as Record<string, unknown>)?.attributes as Record<string, unknown> | undefined

  switch (eventName) {
    case 'subscription_created':
    case 'subscription_resumed':
      await supabase.from('profiles').update({
        tier: 'pro',
        tier_expires_at: (attrs?.ends_at as string | null) ?? null,
        lemon_customer_id: String(attrs?.customer_id ?? ''),
      }).eq('id', userId)
      break

    case 'subscription_updated':
      await supabase.from('profiles').update({
        tier_expires_at: (attrs?.ends_at as string | null) ?? null,
      }).eq('id', userId)
      break

    case 'subscription_cancelled':
      // Don't change tier — let it expire naturally at tier_expires_at
      break

    case 'subscription_expired':
      await supabase.from('profiles').update({
        tier: 'free',
        tier_expires_at: null,
      }).eq('id', userId)
      break

    default:
      // Unknown event — acknowledge without action
      break
  }

  return NextResponse.json({ ok: true })
}
