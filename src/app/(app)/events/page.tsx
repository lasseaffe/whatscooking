// src/app/(app)/events/page.tsx
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Calendar, Plus, ChevronRight } from 'lucide-react';

export default async function EventsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: hosting } = await supabase
    .from('dinner_parties')
    .select('id,title,scheduled_at,avatar_emoji,avatar_url,status')
    .eq('host_id', user.id)
    .order('scheduled_at');

  const { data: guestRows } = await supabase
    .from('dinner_party_guests')
    .select('party_id,rsvp,dinner_parties(id,title,scheduled_at,avatar_emoji,avatar_url,status)')
    .eq('user_id', user.id);

  const attending = (guestRows ?? []).map((g: {
    rsvp: string;
    dinner_parties: { id: string; title: string; scheduled_at: string; avatar_emoji: string | null; avatar_url: string | null; status: string } | null;
  }) => ({
    ...g.dinner_parties,
    rsvp: g.rsvp,
  })).filter(Boolean);

  const allEvents = [
    ...(hosting ?? []).map(e => ({ ...e, role: 'Hosting' as const })),
    ...attending.map(e => ({ ...e, role: 'Attending' as const })),
  ].sort((a, b) => new Date(a.scheduled_at!).getTime() - new Date(b.scheduled_at!).getTime());

  return (
    <div className="min-h-screen pb-24" style={{ background: '#0D0907', color: '#EFE3CE' }}>
      <div className="sticky top-0 z-10 px-4 py-3 flex items-center justify-between"
        style={{ background: 'rgba(13,9,7,0.9)', backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <h1 className="text-sm font-semibold tracking-widest uppercase" style={{ letterSpacing: '0.14em' }}>My Events</h1>
        <Link href="/events/new"
          className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-xl font-semibold"
          style={{ background: 'linear-gradient(135deg,#C8522A,#E8834A)', color: '#fff' }}>
          <Plus className="w-4 h-4" /> New
        </Link>
      </div>

      <div className="max-w-2xl mx-auto px-4 pt-6">
        {allEvents.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <Calendar className="w-10 h-10 opacity-20" />
            <p className="opacity-50 text-sm">No events yet — plan your first one</p>
            <Link href="/events/new"
              className="px-6 py-3 rounded-2xl font-semibold text-sm"
              style={{ background: 'linear-gradient(135deg,#C8522A,#E8834A)', color: '#fff' }}>
              Plan an event
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {allEvents.map(event => (
              <Link key={event.id} href={`/events/${event.id}`}
                className="flex items-center gap-4 p-4 rounded-2xl transition-all hover:scale-[1.01]"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0"
                  style={{ background: 'rgba(200,82,42,0.15)' }}>
                  {event.avatar_url
                    ? <img src={event.avatar_url} className="w-12 h-12 rounded-xl object-cover" alt="" />
                    : (event.avatar_emoji ?? '🍽️')}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate" style={{ color: '#EFE3CE' }}>{event.title}</p>
                  <p className="text-xs opacity-50">{new Date(event.scheduled_at!).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs px-2 py-0.5 rounded-full"
                    style={{ background: event.role === 'Hosting' ? 'rgba(200,82,42,0.2)' : 'rgba(255,255,255,0.08)', color: event.role === 'Hosting' ? '#C8522A' : '#EFE3CE' }}>
                    {event.role}
                  </span>
                  <ChevronRight className="w-4 h-4 opacity-30" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
