import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';

type Params = { params: Promise<{ id: string; optionId: string }> };

export async function PATCH(req: Request, { params }: Params) {
  const { id, optionId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { is_winner } = await req.json();

  if (is_winner) {
    // Clear any existing winner first
    await supabase.from('event_location_options').update({ is_winner: false }).eq('party_id', id);
    // Get location name to update dinner_parties.location
    const { data: opt } = await supabase.from('event_location_options').select('name,address').eq('id', optionId).single();
    if (opt) {
      await supabase.from('dinner_parties').update({ location: opt.address ?? opt.name }).eq('id', id);
    }
  }

  const { data, error } = await supabase
    .from('event_location_options')
    .update({ is_winner })
    .eq('id', optionId)
    .select().single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(_req: Request, { params }: Params) {
  const { optionId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await supabase.from('event_location_options').delete().eq('id', optionId);
  return NextResponse.json({ ok: true });
}
