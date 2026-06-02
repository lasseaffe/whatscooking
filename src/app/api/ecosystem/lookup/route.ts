import { NextResponse } from 'next/server'

// Called by Tillr to check if a user with this email exists in What's Cooking
export async function POST(req: Request) {
  const { email } = await req.json()
  if (!email || typeof email !== 'string') {
    return NextResponse.json({ error: 'email required' }, { status: 400 })
  }

  const { createClient } = await import('@supabase/supabase-js')
  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  const { data: { users }, error } = await admin.auth.admin.listUsers()
  if (error) return NextResponse.json({ userId: null })

  const match = users.find((u) => u.email?.toLowerCase() === email.toLowerCase())
  return NextResponse.json({ userId: match?.id ?? null })
}
