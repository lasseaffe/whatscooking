import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';

type Params = { params: Promise<{ id: string; itemId: string }> };

export async function PATCH(req: Request, { params }: Params) {
  const { itemId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const patch: Record<string, unknown> = {};
  if ('checked' in body) {
    patch.checked = body.checked;
    patch.checked_by = body.checked ? user.id : null;
    patch.checked_at = body.checked ? new Date().toISOString() : null;
  }
  if ('assigned_to' in body) patch.assigned_to = body.assigned_to;
  if ('name' in body) patch.name = body.name;
  if ('quantity' in body) patch.quantity = body.quantity;

  const { data, error } = await supabase
    .from('event_shopping_items')
    .update(patch)
    .eq('id', itemId)
    .select().single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(_req: Request, { params }: Params) {
  const { itemId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await supabase.from('event_shopping_items').delete().eq('id', itemId);
  return NextResponse.json({ ok: true });
}
