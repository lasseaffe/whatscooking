// src/app/api/events/[id]/route.ts
import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Params) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: party } = await supabase
    .from('dinner_parties')
    .select('id,host_id,title,description,scheduled_at,location,theme,status,cover_color,avatar_url,avatar_emoji,spotify_playlist_id,created_at,updated_at')
    .eq('id', id)
    .single();

  if (!party) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const [
    { data: guests },
    { data: menuItems },
    { data: timelineItems },
    { data: shoppingItems },
    { data: locationOptions },
    { data: tracks },
  ] = await Promise.all([
    supabase.from('dinner_party_guests').select('*').eq('party_id', id).order('invited_at'),
    supabase.from('event_menu_items').select('*').eq('party_id', id).order('sort_order'),
    supabase.from('event_timeline_items').select('*').eq('party_id', id).order('sort_order'),
    supabase.from('event_shopping_items').select('*').eq('party_id', id).order('created_at'),
    supabase.from('event_location_options').select('*').eq('party_id', id),
    supabase.from('event_playlist_tracks').select('*').eq('party_id', id).order('created_at'),
  ]);

  // Attach vote counts
  const optionIds = (locationOptions ?? []).map((o: { id: string }) => o.id);
  let votes: { option_id: string; user_id: string }[] = [];
  if (optionIds.length > 0) {
    const { data: voteData } = await supabase
      .from('event_location_votes')
      .select('option_id,user_id')
      .in('option_id', optionIds);
    votes = voteData ?? [];
  }

  const enrichedOptions = (locationOptions ?? []).map((opt: { id: string }) => ({
    ...opt,
    vote_count: votes.filter(v => v.option_id === opt.id).length,
    user_voted: votes.some(v => v.option_id === opt.id && v.user_id === user.id),
  }));

  const guestRecord = (guests ?? []).find((g: { user_id: string | null }) => g.user_id === user.id);
  const userRole = party.host_id === user.id
    ? 'host'
    : guestRecord?.rsvp === 'accepted' ? 'accepted'
    : guestRecord?.rsvp === 'maybe' ? 'maybe'
    : 'invited';

  return NextResponse.json({
    party,
    guests: guests ?? [],
    menuItems: menuItems ?? [],
    timelineItems: timelineItems ?? [],
    shoppingItems: shoppingItems ?? [],
    locationOptions: enrichedOptions,
    tracks: tracks ?? [],
    userRole,
  });
}

export async function PATCH(req: Request, { params }: Params) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const allowed = ['title', 'scheduled_at', 'avatar_url', 'avatar_emoji', 'description', 'location'];
  const patch = Object.fromEntries(Object.entries(body).filter(([k]) => allowed.includes(k)));

  const { data, error } = await supabase
    .from('dinner_parties')
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('host_id', user.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
