import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'

export type GatedFeature = 'recipe_extract' | 'meal_weave' | 'batch_import'

export interface GateResult {
  allowed: boolean
  remaining: number | null  // null means no limit (pro users)
  resets_at: Date           // approximate rolling window reset
}

// Free tier weekly limits. batch_import = 0 means pro-only.
const FREE_WEEKLY_LIMITS: Record<GatedFeature, number> = {
  recipe_extract: 1,
  meal_weave: 10,
  batch_import: 0,
}

export async function checkFeatureGate(
  userId: string,
  feature: GatedFeature
): Promise<GateResult> {
  const supabase = await createClient()

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('tier, tier_expires_at')
    .eq('id', userId)
    .single()

  if (profileError) {
    throw new Error(`feature-gate: profile fetch failed: ${profileError.message}`)
  }

  const isPro =
    profile?.tier === 'pro' &&
    (!profile.tier_expires_at || new Date(profile.tier_expires_at) > new Date())

  if (isPro) {
    return { allowed: true, remaining: null, resets_at: new Date() }
  }

  const limit = FREE_WEEKLY_LIMITS[feature]
  if (limit === 0) {
    return { allowed: false, remaining: 0, resets_at: new Date() }
  }

  const windowStart = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

  const { count, error: countError } = await supabase
    .from('ai_usage_log')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('feature', feature)
    .gte('used_at', windowStart.toISOString())

  if (countError) {
    throw new Error(`feature-gate: usage count failed: ${countError.message}`)
  }

  const used = count ?? 0
  const remaining = Math.max(0, limit - used)
  // Approximate: next reset is 7 days from now
  const resets_at = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)

  return { allowed: remaining > 0, remaining, resets_at }
}

export async function logFeatureUsage(
  userId: string,
  feature: GatedFeature,
  metadata?: Record<string, unknown>
): Promise<void> {
  const supabase = createServiceClient()
  const { error } = await supabase
    .from('ai_usage_log')
    .insert({ user_id: userId, feature, metadata })
  if (error) {
    console.error('feature-gate: failed to log usage', { userId, feature, error: error.message })
  }
}
