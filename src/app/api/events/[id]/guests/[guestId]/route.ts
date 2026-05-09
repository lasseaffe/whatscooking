import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';

type Params = { params: Promise<{ id: string; guestId: string }> };

export async function PATCH(req: Request, { params }: Params) {
  const { guestId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { rsvp } = await req.json();
  const { data, error } = await supabase
    .from('dinner_party_guests')
    .update({ rsvp, responded_at: new Date().toISOString() })
    .eq('id', guestId)
    .eq('user_id', user.id)
    .select().single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(_req: Request, { params }: Params) {
  const { id, guestId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: party } = await supabase.from('dinner_parties').select('host_id').eq('id', id).single();
  if (!party || party.host_id !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  await supabase.from('dinner_party_guests').delete().eq('id', guestId);
  return NextResponse.json({ ok: true });
}
