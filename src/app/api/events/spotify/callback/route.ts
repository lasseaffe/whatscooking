import { exchangeCode, createPlaylist, encryptTokens } from '@/lib/spotify';
import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  if (!code || !state) return NextResponse.redirect('/events?error=spotify_denied');

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect('/login');

  const { eventId } = JSON.parse(Buffer.from(state, 'base64').toString('utf8'));

  const tokens = await exchangeCode(code);
  const { encryptedAccess, encryptedRefresh } = encryptTokens(tokens.access_token, tokens.refresh_token);
  const expiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString();

  // Get event title for playlist name
  const { data: party } = await supabase.from('dinner_parties').select('title').eq('id', eventId).single();
  const playlistName = `${party?.title ?? 'Event'} — What's Cooking`;

  // Get Spotify user ID
  const meRes = await fetch('https://api.spotify.com/v1/me', {
    headers: { Authorization: `Bearer ${tokens.access_token}` },
  });
  const me = await meRes.json();
  const playlistId = await createPlaylist(tokens.access_token, me.id, playlistName);

  await supabase.from('dinner_parties').update({
    spotify_access_token: encryptedAccess,
    spotify_refresh_token: encryptedRefresh,
    spotify_token_expires_at: expiresAt,
    spotify_playlist_id: playlistId,
  }).eq('id', eventId).eq('host_id', user.id);

  return NextResponse.redirect(`/events/${eventId}?tab=playlist`);
}
