import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { completion_id } = await req.json() as { completion_id: string };
  if (!completion_id) return NextResponse.json({ error: 'completion_id required' }, { status: 400 });

  const { data, error } = await supabase
    .from('challenge_reactions')
    .upsert({ completion_id, user_id: user.id }, { onConflict: 'completion_id,user_id' })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}

export async function DELETE(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { completion_id } = await req.json() as { completion_id: string };

  const { error } = await supabase
    .from('challenge_reactions')
    .delete()
    .eq('completion_id', completion_id)
    .eq('user_id', user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return new NextResponse(null, { status: 204 });
}
