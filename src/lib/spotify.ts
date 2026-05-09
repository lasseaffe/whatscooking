// src/lib/spotify.ts
import { encrypt, decrypt } from './crypto';

const CLIENT_ID = process.env.SPOTIFY_CLIENT_ID!;
const CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET!;
const REDIRECT_URI = process.env.SPOTIFY_REDIRECT_URI!;

export function getAuthUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    response_type: 'code',
    redirect_uri: REDIRECT_URI,
    scope: 'playlist-modify-public playlist-modify-private',
    state,
  });
  return `https://accounts.spotify.com/authorize?${params}`;
}

export async function exchangeCode(code: string): Promise<{
  access_token: string;
  refresh_token: string;
  expires_in: number;
}> {
  const res = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64')}`,
    },
    body: new URLSearchParams({ grant_type: 'authorization_code', code, redirect_uri: REDIRECT_URI }),
  });
  if (!res.ok) throw new Error('Spotify token exchange failed');
  return res.json();
}

export async function refreshToken(encryptedRefresh: string): Promise<{
  access_token: string;
  expires_in: number;
}> {
  const refresh_token = decrypt(encryptedRefresh);
  const res = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64')}`,
    },
    body: new URLSearchParams({ grant_type: 'refresh_token', refresh_token }),
  });
  if (!res.ok) throw new Error('Spotify token refresh failed');
  return res.json();
}

export async function createPlaylist(accessToken: string, userId: string, name: string): Promise<string> {
  const res = await fetch(`https://api.spotify.com/v1/users/${userId}/playlists`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, public: false, collaborative: true, description: 'Created by What\'s Cooking' }),
  });
  if (!res.ok) throw new Error('Failed to create Spotify playlist');
  const data = await res.json();
  return data.id;
}

export async function addTrackToPlaylist(accessToken: string, playlistId: string, uri: string): Promise<void> {
  const res = await fetch(`https://api.spotify.com/v1/playlists/${playlistId}/tracks`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ uris: [uri] }),
  });
  if (!res.ok) throw new Error('Failed to add track to playlist');
}

export async function getTrackMetadata(accessToken: string, uri: string): Promise<{
  name: string; artist: string; albumArt: string; uri: string;
}> {
  const trackId = uri.replace('spotify:track:', '').split('/').pop()!;
  const res = await fetch(`https://api.spotify.com/v1/tracks/${trackId}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) throw new Error('Failed to fetch track metadata');
  const data = await res.json();
  return {
    name: data.name,
    artist: data.artists[0]?.name ?? '',
    albumArt: data.album?.images?.[0]?.url ?? '',
    uri: data.uri,
  };
}

export function encryptTokens(accessToken: string, refreshToken: string) {
  return { encryptedAccess: encrypt(accessToken), encryptedRefresh: encrypt(refreshToken) };
}

export function getValidAccessToken(party: {
  spotify_access_token: string | null;
  spotify_token_expires_at: string | null;
}): string | null {
  if (!party.spotify_access_token) return null;
  return decrypt(party.spotify_access_token);
}
