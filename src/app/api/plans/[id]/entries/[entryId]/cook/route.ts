export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { emitStreakEvent } from '@/lib/streak-emit';

type Ctx = { params: Promise<{ id: string; entryId: string }> };

export async function POST(_req: Request, ctx: Ctx) {
  const { id: planId, entryId } = await ctx.params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: plan } = await supabase
    .from('meal_plans')
    .select('id, user_id, status')
    .eq('id', planId)
    .single();
  if (!plan || plan.user_id !== user.id) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const now = new Date().toISOString();
  const { data: entry, error } = await supabase
    .from('meal_entries')
    .update({ cooked_at: now })
    .eq('id', entryId)
    .eq('meal_plan_id', planId)
    .select()
    .single();
  if (error || !entry) {
    return NextResponse.json({ error: error?.message ?? 'entry not found' }, { status: 400 });
  }

  // CROSS-APP: streak event emission (no-op stub today)
  await emitStreakEvent({
    user_id: user.id,
    action_id: entry.is_leftover ? 'recipe_reheated' : 'recipe_cooked',
    source: 'whatscooking',
    timestamp: now,
    metadata: {
      meal_plan_id: planId,
      meal_entry_id: entryId,
      recipe_id: entry.recipe_id,
      recipe_title: entry.recipe_title,
    },
  });

  const { data: allEntries } = await supabase
    .from('meal_entries')
    .select('cooked_at, is_leftover')
    .eq('meal_plan_id', planId);
  const cookable = (allEntries ?? []).filter(e => !e.is_leftover);
  const allCooked = cookable.length > 0 && cookable.every(e => e.cooked_at != null);
  const anyCooked = (allEntries ?? []).some(e => e.cooked_at != null);

  let nextStatus: string = plan.status;
  if (allCooked) nextStatus = 'completed';
  else if (anyCooked && plan.status === 'woven') nextStatus = 'cooking';

  if (nextStatus !== plan.status) {
    await supabase.from('meal_plans').update({ status: nextStatus }).eq('id', planId);
  }

  return NextResponse.json({ entry, status: nextStatus });
}

export async function DELETE(_req: Request, ctx: Ctx) {
  const { id: planId, entryId } = await ctx.params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: plan } = await supabase
    .from('meal_plans')
    .select('user_id, status')
    .eq('id', planId)
    .single();
  if (!plan || plan.user_id !== user.id) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const { data: entry, error } = await supabase
    .from('meal_entries')
    .update({ cooked_at: null })
    .eq('id', entryId)
    .eq('meal_plan_id', planId)
    .select()
    .single();
  if (error || !entry) {
    return NextResponse.json({ error: error?.message ?? 'entry not found' }, { status: 400 });
  }

  if (plan.status === 'completed') {
    await supabase.from('meal_plans').update({ status: 'cooking' }).eq('id', planId);
    return NextResponse.json({ entry, status: 'cooking' });
  }
  return NextResponse.json({ entry, status: plan.status });
}
