import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createCheckoutUrl } from '@/lib/lemonsqueezy'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json() as { plan?: string }
  const { plan } = body

  if (plan !== 'monthly' && plan !== 'annual') {
    return NextResponse.json({ error: 'Invalid plan. Must be "monthly" or "annual".' }, { status: 400 })
  }

  if (!user.email) {
    return NextResponse.json(
      { error: 'Your account has no email address. Please update your profile.' },
      { status: 400 }
    )
  }

  try {
    const url = await createCheckoutUrl(user.email, user.id, plan)
    return NextResponse.json({ url })
  } catch (err) {
    console.error('[billing/checkout]', err)
    return NextResponse.json({ error: 'Failed to create checkout session' }, { status: 500 })
  }
}
