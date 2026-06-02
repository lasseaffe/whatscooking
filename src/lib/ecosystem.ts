import { createClient } from '@/lib/supabase/server'

export interface EcosystemPortalState {
  state: 'match' | 'no-match' | 'not-linked'
  linkedUserId?: string
  matchData?: {
    plantName?: string
    plantId?: string
    harvestEta?: string
    harvestedAt?: string
    grams?: number
    daysUntilHarvest?: number
  }
}

// Resolve Tillr linked user for the current WC user
async function getLinkedTillrUserId(wcUserId: string): Promise<string | null> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('ecosystem_links')
    .select('linked_user_id')
    .eq('user_id', wcUserId)
    .eq('linked_app', 'tillr')
    .single()
  return data?.linked_user_id ?? null
}

// Detect which ingredients in a recipe are growable (have an entry in ingredient_plant_map)
export async function detectGrowableIngredients(ingredientList: string[]): Promise<string[]> {
  if (!ingredientList.length) return []

  const supabase = await createClient()

  // Normalise: lowercase, strip quantities, punctuation
  const normalised = ingredientList.map((i) =>
    i.toLowerCase().replace(/[0-9¼½¾⅓⅔]+/g, '').replace(/[^a-z\s]/g, '').trim()
  )

  const { data: mappings } = await supabase
    .from('ingredient_plant_map')
    .select('ingredient_slug')

  if (!mappings) return []

  return mappings
    .filter((m) =>
      normalised.some((n) => n.includes(m.ingredient_slug) || m.ingredient_slug.includes(n.split(' ')[0]))
    )
    .map((m) => m.ingredient_slug)
}

// Get portal state for a recipe page
export async function getRecipePortalState(params: {
  wcUserId: string
  growableIngredients: string[]
}): Promise<EcosystemPortalState> {
  if (!params.growableIngredients.length) return { state: 'no-match' }

  const tillrUserId = await getLinkedTillrUserId(params.wcUserId)
  if (!tillrUserId) return { state: 'not-linked' }

  const edgeFnUrl = `${process.env.TILLR_SUPABASE_URL}/functions/v1/ecosystem-match`

  const res = await fetch(edgeFnUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.TILLR_SERVICE_ROLE_KEY}`,
    },
    body: JSON.stringify({
      direction: 'wc→tillr',
      wcUserId: params.wcUserId,
      tillrUserId,
      growableIngredients: params.growableIngredients,
    }),
    cache: 'no-store',
  })

  if (!res.ok) return { state: 'no-match' }
  const data = await res.json()
  return { ...data, linkedUserId: tillrUserId }
}

// Save ecosystem link (Tillr user linked to this WC account)
export async function saveEcosystemLink(wcUserId: string, tillrUserId: string): Promise<void> {
  const supabase = await createClient()
  await supabase.from('ecosystem_links').upsert({
    user_id: wcUserId,
    linked_app: 'tillr',
    linked_user_id: tillrUserId,
  })
}

// WC-side auto-link: check if Tillr user with same email exists
export async function autoLinkByEmail(wcUserId: string, email: string): Promise<boolean> {
  const tillrCheckUrl = process.env.TILLR_APP_URL
  if (!tillrCheckUrl) return false

  const res = await fetch(`${tillrCheckUrl}/api/ecosystem/lookup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
    cache: 'no-store',
  })
  if (!res.ok) return false

  const { userId: tillrUserId } = await res.json()
  if (!tillrUserId) return false

  await saveEcosystemLink(wcUserId, tillrUserId)
  return true
}
