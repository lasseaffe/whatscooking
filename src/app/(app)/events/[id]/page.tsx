// src/app/(app)/events/[id]/page.tsx
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { EventHub } from './event-hub';
import { cookies } from 'next/headers';

export default async function EventPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const cookieStore = await cookies();
  const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/events/${id}`, {
    headers: { Cookie: cookieStore.toString() },
    cache: 'no-store',
  });

  if (!res.ok) redirect('/events');
  const data = await res.json();

  return <EventHub initialData={data} eventId={id} userId={user.id} />;
}
