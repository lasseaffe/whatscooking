import { getAuthUrl } from '@/lib/spotify';
import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const eventId = url.searchParams.get('eventId') ?? '';
  // state encodes eventId so callback knows which event to update
  const state = Buffer.from(JSON.stringify({ eventId })).toString('base64');
  return NextResponse.redirect(getAuthUrl(state));
}
