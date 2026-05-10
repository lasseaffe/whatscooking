import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get('token');
  if (!token) return NextResponse.json({ error: 'Missing token' }, { status: 400 });

  const supabase = await createClient();
  const { data: party } = await supabase
    .from('dinner_parties')
    .select('id, title, description, scheduled_at, location, host_id')
    .eq('invite_token', token)
    .single();

  if (!party) return NextResponse.json({ error: 'Invalid invite link' }, { status: 404 });

  return NextResponse.json(party);
}

export async function POST(req: Request) {
  const { token, name, email } = await req.json();
  if (!token || !name || !email) {
    return NextResponse.json({ error: 'token, name, and email are required' }, { status: 400 });
  }

  const supabase = await createClient();

  const { data: party } = await supabase
    .from('dinner_parties')
    .select('id, title, host_id')
    .eq('invite_token', token)
    .single();

  if (!party) return NextResponse.json({ error: 'Invalid invite link' }, { status: 404 });

  const { data: existing } = await supabase
    .from('dinner_party_guests')
    .select('id')
    .eq('party_id', party.id)
    .eq('email', email)
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ partyId: party.id, alreadyRsvped: true });
  }

  const { error } = await supabase
    .from('dinner_party_guests')
    .insert({
      party_id: party.id,
      email,
      display_name: name,
      rsvp: 'invited',
      role: 'viewer',
    });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ partyId: party.id, alreadyRsvped: false });
}
