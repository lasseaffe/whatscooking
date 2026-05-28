import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { checkFeatureGate } from '@/lib/feature-gate'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('tier, tier_expires_at, referral_code')
    .eq('id', user.id)
    .single()

  let extractGate
  try {
    extractGate = await checkFeatureGate(user.id, 'recipe_extract')
  } catch {
    extractGate = { allowed: true, remaining: null, resets_at: new Date() }
  }

  return NextResponse.json({
    tier: profile?.tier ?? 'free',
    tier_expires_at: profile?.tier_expires_at ?? null,
    referral_code: profile?.referral_code ?? null,
    extract: {
      remaining: extractGate.remaining,
      limit: 1,
      resets_at: extractGate.resets_at.toISOString(),
    },
  })
}
