import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data, error } = await supabase
    .from('challenge_completions')
    .select('*, challenge:challenge_definitions(*)')
    .eq('user_id', user.id)
    .order('completed_at', { ascending: false })
    .limit(50);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json() as {
    challenge_id: string; proof_url?: string; note?: string; elapsed_seconds?: number | null;
  };

  if (!body.challenge_id) {
    return NextResponse.json({ error: 'challenge_id required' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('challenge_completions')
    .insert({
      user_id: user.id,
      challenge_id: body.challenge_id,
      proof_url: body.proof_url ?? null,
      note: body.note ?? null,
      elapsed_seconds: body.elapsed_seconds ?? null,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
