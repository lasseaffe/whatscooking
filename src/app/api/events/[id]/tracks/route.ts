import { createClient } from '@/lib/supabase/server';
import { getValidAccessToken, getTrackMetadata, addTrackToPlaylist, refreshToken, encryptTokens } from '@/lib/spotify';
import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';

type Params = { params: Promise<{ id: string }> };

function spotifyUrlToUri(input: string): string {
  // Handle https://open.spotify.com/track/ID or spotify:track:ID
  const match = input.match(/track[/:]([A-Za-z0-9]+)/);
  if (!match) throw new Error('Not a valid Spotify track URL or URI');
  return `spotify:track:${match[1]}`;
}

export async function POST(req: Request, { params }: Params) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { trackInput } = await req.json();

  const { data: party } = await supabase
    .from('dinner_parties')
    .select('spotify_access_token,spotify_refresh_token,spotify_token_expires_at,spotify_playlist_id,host_id')
    .eq('id', id).single();

  if (!party?.spotify_playlist_id) return NextResponse.json({ error: 'Spotify not connected' }, { status: 400 });

  // Refresh token if expiring within 5 minutes
  let accessToken = getValidAccessToken(party);
  if (!accessToken) return NextResponse.json({ error: 'No access token' }, { status: 400 });

  const expiresAt = new Date(party.spotify_token_expires_at).getTime();
  if (Date.now() > expiresAt - 5 * 60 * 1000) {
    const refreshed = await refreshToken(party.spotify_refresh_token!);
    const { encryptedAccess } = encryptTokens(refreshed.access_token, '');
    const newExpiry = new Date(Date.now() + refreshed.expires_in * 1000).toISOString();
    await supabase.from('dinner_parties').update({
      spotify_access_token: encryptedAccess,
      spotify_token_expires_at: newExpiry,
    }).eq('id', id);
    accessToken = refreshed.access_token;
  }

  const uri = spotifyUrlToUri(trackInput);
  const meta = await getTrackMetadata(accessToken, uri);
  await addTrackToPlaylist(accessToken, party.spotify_playlist_id, uri);

  const { data: track, error } = await supabase
    .from('event_playlist_tracks')
    .insert({
      party_id: id,
      submitted_by: user.id,
      spotify_uri: uri,
      track_name: meta.name,
      artist_name: meta.artist,
      album_art_url: meta.albumArt,
      added_to_spotify: true,
    })
    .select().single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(track);
}
