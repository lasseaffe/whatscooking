'use client';

import { useState } from 'react';
import { Music2, Plus, ExternalLink } from 'lucide-react';
import type { FullEventData } from '@/lib/event-types';

export function PlaylistTab({ data, canInteract, eventId, onReload }: {
  data: FullEventData;
  canInteract: boolean;
  eventId: string;
  onReload: () => void;
}) {
  const { tracks, party } = data;
  const [url, setUrl] = useState('');
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState('');

  async function handleAdd() {
    if (!url.trim()) return;
    setAdding(true);
    setError('');
    const res = await fetch(`/api/events/${eventId}/tracks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ spotify_url: url.trim() }),
    });
    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      setError(json.error ?? 'Failed to add track');
    } else {
      setUrl('');
      onReload();
    }
    setAdding(false);
  }

  return (
    <div className="flex flex-col gap-5 pb-12">
      {party.spotify_playlist_id && (
        <a
          href={`https://open.spotify.com/playlist/${party.spotify_playlist_id}`}
          target="_blank" rel="noopener noreferrer"
          className="flex items-center justify-between px-4 py-3 rounded-2xl"
          style={{ background: 'rgba(30,215,96,0.12)', border: '1px solid rgba(30,215,96,0.25)' }}>
          <div className="flex items-center gap-2">
            <Music2 className="w-4 h-4" style={{ color: '#1ED760' }} />
            <span className="text-sm font-semibold" style={{ color: '#1ED760' }}>Open Spotify Playlist</span>
          </div>
          <ExternalLink className="w-4 h-4" style={{ color: 'rgba(30,215,96,0.6)' }} />
        </a>
      )}

      {!party.spotify_playlist_id && (
        <div className="rounded-2xl px-4 py-3 text-sm text-center"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', color: 'rgba(239,227,206,0.4)' }}>
          Connect Spotify to enable collaborative playlists
        </div>
      )}

      {canInteract && (
        <div className="rounded-2xl p-4 border flex flex-col gap-3"
          style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.07)' }}>
          <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'rgba(239,227,206,0.4)' }}>
            Suggest a track
          </p>
          <input
            value={url}
            onChange={e => setUrl(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAdd()}
            placeholder="Spotify track URL or URI"
            className="w-full rounded-xl px-3 py-2 text-sm"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#EFE3CE' }}
          />
          {!party.spotify_playlist_id && (
            <p className="text-xs" style={{ color: 'rgba(239,227,206,0.35)' }}>
              Spotify not connected — tracks will sync when the host connects Spotify
            </p>
          )}
          {error && <p className="text-xs" style={{ color: '#ef4444' }}>{error}</p>}
          <button onClick={handleAdd} disabled={adding || !url.trim()}
            className="flex items-center gap-1.5 text-sm px-4 py-2 rounded-xl font-semibold disabled:opacity-40 w-fit"
            style={{ background: 'rgba(30,215,96,0.15)', color: '#1ED760' }}>
            <Plus className="w-4 h-4" /> {adding ? 'Adding…' : 'Add track'}
          </button>
        </div>
      )}

      {tracks.length === 0 ? (
        <div className="text-center py-12" style={{ color: 'rgba(239,227,206,0.3)' }}>
          <Music2 className="w-8 h-8 mx-auto mb-2 opacity-30" />
          <p className="text-sm">No tracks yet — be the first to suggest one</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {tracks.map(track => (
            <div key={track.id} className="flex items-center gap-3 rounded-xl px-4 py-3"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
              {track.album_art_url ? (
                <img src={track.album_art_url} className="w-10 h-10 rounded-lg object-cover shrink-0" alt="" />
              ) : (
                <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                  style={{ background: 'rgba(30,215,96,0.1)' }}>
                  <Music2 className="w-4 h-4" style={{ color: '#1ED760' }} />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate" style={{ color: '#EFE3CE' }}>
                  {track.track_name ?? track.spotify_uri}
                </p>
                {track.artist_name && (
                  <p className="text-xs truncate" style={{ color: 'rgba(239,227,206,0.45)' }}>
                    {track.artist_name}
                    {track.submitter_name && <span className="ml-2 opacity-60">· by {track.submitter_name}</span>}
                  </p>
                )}
              </div>
              {track.added_to_spotify ? (
                <div className="w-2 h-2 rounded-full shrink-0" style={{ background: '#1ED760' }} title="On Spotify" />
              ) : (
                <div className="w-2 h-2 rounded-full shrink-0" style={{ background: 'rgba(239,227,206,0.2)' }} title="Pending sync" />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
