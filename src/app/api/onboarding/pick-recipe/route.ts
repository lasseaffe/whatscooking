import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

interface PickPayload {
  cookType: string
  goal: string
  diet: string[]
  household: string
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()

  let payload: PickPayload
  try {
    payload = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { cookType, goal, diet, household } = payload

  const allowMedium = cookType === 'enthusiast' || cookType === 'family-chef'

  let query = supabase
    .from('recipes')
    .select('id, title, image_url, prep_time_minutes, dietary_tags, difficulty_level, servings, saved_count')
    .not('image_url', 'is', null)
    .in('difficulty_level', allowMedium ? ['easy', 'medium'] : ['easy'])
    .limit(80)

  if (goal === 'fast') {
    query = query.lte('prep_time_minutes', 30)
  }

  const { data: candidates } = await query
  if (!candidates || candidates.length === 0) {
    return NextResponse.json({ recipeId: null })
  }

  const scored = candidates.map((r) => {
    let score = 0
    const tags: string[] = r.dietary_tags ?? []

    if (diet.length > 0) {
      const allMatch = diet.every((d) => tags.includes(d))
      if (allMatch) score += 10
      else score -= 20
    }

    score += Math.min((r.saved_count ?? 0) / 10, 5)

    if (household === 'family' && (r.servings ?? 0) >= 4) score += 3

    if (r.difficulty_level === 'easy') score += 2

    return { ...r, _score: score }
  })

  scored.sort((a, b) => b._score - a._score)
  const winner = scored[0]

  if (diet.length > 0) {
    const tags: string[] = winner.dietary_tags ?? []
    const matches = diet.every((d) => tags.includes(d))
    if (!matches) {
      return NextResponse.json({ recipeId: null })
    }
  }

  return NextResponse.json({ recipeId: winner.id, title: winner.title, imageUrl: winner.image_url })
}
