import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';

type Params = { params: Promise<{ id: string }> };

export async function POST(req: Request, { params }: Params) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Verify requester is host
  const { data: party } = await supabase.from('dinner_parties').select('host_id').eq('id', id).single();
  if (!party || party.host_id !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { userId, email, displayName } = await req.json();

  const { data, error } = await supabase
    .from('dinner_party_guests')
    .insert({ party_id: id, user_id: userId ?? null, email: email ?? null, display_name: displayName ?? null, rsvp: 'invited' })
    .select().single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
