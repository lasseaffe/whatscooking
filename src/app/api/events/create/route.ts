// src/app/api/events/create/route.ts
import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { occasion, guests, plan, avatarEmoji } = await req.json();
  // plan is the EventPlan shape from the AI generator

  const { data: party, error: partyError } = await supabase
    .from('dinner_parties')
    .insert({
      host_id: user.id,
      title: plan.theme,
      description: null,
      scheduled_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      theme: occasion,
      avatar_emoji: avatarEmoji ?? '🍽️',
      status: 'planning',
    })
    .select()
    .single();

  if (partyError) return NextResponse.json({ error: partyError.message }, { status: 500 });

  const partyId = party.id;

  // Seed menu items
  const menuRows = plan.recipes.map((r: { name: string; description: string; course: string }, i: number) => ({
    party_id: partyId,
    name: r.name,
    description: r.description,
    course: r.course,
    sort_order: i,
  }));

  // Seed timeline items
  const timelineRows = plan.timeline.map((t: { time: string; activity: string }, i: number) => ({
    party_id: partyId,
    time_label: t.time,
    activity: t.activity,
    sort_order: i,
  }));

  // Seed shopping items from highlights
  const shoppingRows = plan.shopping_highlights.map((item: string) => ({
    party_id: partyId,
    name: item,
    created_by: user.id,
  }));

  await Promise.all([
    supabase.from('event_menu_items').insert(menuRows),
    supabase.from('event_timeline_items').insert(timelineRows),
    supabase.from('event_shopping_items').insert(shoppingRows),
  ]);

  return NextResponse.json({ id: partyId });
}
