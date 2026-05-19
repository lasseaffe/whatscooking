// src/app/api/household/squad-preferences/route.ts
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { resolveSquadPreferences } from '@/lib/plans/squad-resolve';

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const squad = await resolveSquadPreferences(supabase, user.id);
  return NextResponse.json(squad);
}
