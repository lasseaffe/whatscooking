// src/app/(app)/events/[id]/page.tsx
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { EventHub } from './event-hub';
import type { FullEventData } from '@/lib/event-types';

export default async function EventPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: party } = await supabase
    .from('dinner_parties')
    .select('*')
    .eq('id', id)
    .single();

  if (!party) redirect('/events');

  // Determine user role
  let userRole: FullEventData['userRole'] = 'none';
  if (party.host_id === user.id) {
    userRole = 'host';
  } else {
    const { data: guestRow } = await supabase
      .from('dinner_party_guests')
      .select('rsvp')
      .eq('party_id', id)
      .eq('user_id', user.id)
      .maybeSingle();
    if (guestRow) userRole = guestRow.rsvp as FullEventData['userRole'];
  }

  if (userRole === 'none') redirect('/events');

  let guestRole: 'editor' | 'viewer' | null = null;
  if (userRole !== 'host') {
    const { data: guestRow2 } = await supabase
      .from('dinner_party_guests')
      .select('role')
      .eq('party_id', id)
      .eq('user_id', user.id)
      .maybeSingle();
    guestRole = (guestRow2?.role as 'editor' | 'viewer') ?? 'viewer';
  }

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

  // Enrich location options with vote counts
  const optionIds = (locationOptions ?? []).map((o: { id: string }) => o.id);
  let enrichedLocations = (locationOptions ?? []).map((o: { id: string }) => ({ ...o, vote_count: 0, user_voted: false }));

  if (optionIds.length > 0) {
    const { data: votes } = await supabase
      .from('event_location_votes')
      .select('option_id,user_id')
      .in('option_id', optionIds);

    enrichedLocations = (locationOptions ?? []).map((o: { id: string }) => ({
      ...o,
      vote_count: (votes ?? []).filter(v => v.option_id === o.id).length,
      user_voted: (votes ?? []).some(v => v.option_id === o.id && v.user_id === user.id),
    }));
  }

  const initialData: FullEventData = {
    party,
    guests: guests ?? [],
    menuItems: menuItems ?? [],
    timelineItems: timelineItems ?? [],
    shoppingItems: shoppingItems ?? [],
    locationOptions: enrichedLocations as any,
    tracks: tracks ?? [],
    userRole,
    guestRole,
  };

  return <EventHub initialData={initialData} eventId={id} userId={user.id} />;
}
