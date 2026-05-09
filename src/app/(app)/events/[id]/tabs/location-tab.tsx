'use client';

import { useState } from 'react';
import { MapPin, Plus, ThumbsUp, Trophy, Trash2 } from 'lucide-react';
import type { FullEventData } from '@/lib/event-types';

export function LocationTab({ data, isHost, canInteract, eventId, onReload }: {
  data: FullEventData;
  isHost: boolean;
  canInteract: boolean;
  eventId: string;
  onReload: () => void;
}) {
  const { locationOptions } = data;
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [adding, setAdding] = useState(false);
  const [showForm, setShowForm] = useState(false);

  async function handleAdd() {
    if (!name.trim()) return;
    setAdding(true);
    await fetch(`/api/events/${eventId}/locations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: name.trim(), address: address.trim() || null, notes: notes.trim() || null }),
    });
    setName(''); setAddress(''); setNotes('');
    setAdding(false);
    setShowForm(false);
    onReload();
  }

  async function handleVote(optionId: string, userVoted: boolean) {
    await fetch(`/api/events/${eventId}/locations/${optionId}/vote`, {
      method: userVoted ? 'DELETE' : 'POST',
    });
    onReload();
  }

  async function handleSetWinner(optionId: string) {
    await fetch(`/api/events/${eventId}/locations/${optionId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_winner: true }),
    });
    onReload();
  }

  async function handleDelete(optionId: string) {
    await fetch(`/api/events/${eventId}/locations/${optionId}`, { method: 'DELETE' });
    onReload();
  }

  const sorted = [...locationOptions].sort((a, b) => (b.vote_count ?? 0) - (a.vote_count ?? 0));

  return (
    <div className="flex flex-col gap-5 pb-12">
      {canInteract && !showForm && (
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-2 text-sm px-4 py-3 rounded-2xl w-full justify-center font-semibold"
          style={{ background: 'rgba(200,82,42,0.15)', border: '1px dashed rgba(200,82,42,0.4)', color: '#C8522A' }}>
          <Plus className="w-4 h-4" /> Suggest a location
        </button>
      )}

      {showForm && (
        <div className="rounded-2xl p-4 border flex flex-col gap-3"
          style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.07)' }}>
          <input value={name} onChange={e => setName(e.target.value)}
            placeholder="Location name *"
            className="w-full rounded-xl px-3 py-2 text-sm"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#EFE3CE' }} />
          <input value={address} onChange={e => setAddress(e.target.value)}
            placeholder="Address"
            className="w-full rounded-xl px-3 py-2 text-sm"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#EFE3CE' }} />
          <textarea value={notes} onChange={e => setNotes(e.target.value)}
            placeholder="Notes"
            rows={2}
            className="w-full rounded-xl px-3 py-2 text-sm resize-none"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#EFE3CE' }} />
          <div className="flex gap-2">
            <button onClick={handleAdd} disabled={adding || !name.trim()}
              className="flex-1 text-sm py-2 rounded-xl font-semibold disabled:opacity-40"
              style={{ background: 'rgba(200,82,42,0.25)', color: '#C8522A' }}>
              {adding ? 'Adding…' : 'Add location'}
            </button>
            <button onClick={() => setShowForm(false)}
              className="px-4 text-sm py-2 rounded-xl"
              style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(239,227,206,0.5)' }}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {sorted.length === 0 ? (
        <div className="text-center py-12" style={{ color: 'rgba(239,227,206,0.3)' }}>
          <MapPin className="w-8 h-8 mx-auto mb-2 opacity-30" />
          <p className="text-sm">No locations suggested yet</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {sorted.map(option => (
            <div key={option.id} className="rounded-2xl p-4 border"
              style={{
                background: option.is_winner ? 'rgba(200,82,42,0.1)' : 'rgba(255,255,255,0.03)',
                borderColor: option.is_winner ? 'rgba(200,82,42,0.4)' : 'rgba(255,255,255,0.07)',
              }}>
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    {option.is_winner && <Trophy className="w-4 h-4 shrink-0" style={{ color: '#C8522A' }} />}
                    <p className="text-sm font-semibold" style={{ color: '#EFE3CE' }}>{option.name}</p>
                  </div>
                  {option.address && <p className="text-xs mt-0.5" style={{ color: 'rgba(239,227,206,0.5)' }}>{option.address}</p>}
                  {option.notes && <p className="text-xs mt-1" style={{ color: 'rgba(239,227,206,0.4)' }}>{option.notes}</p>}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {isHost && !option.is_winner && (
                    <button onClick={() => handleSetWinner(option.id)}
                      className="text-xs px-2 py-1 rounded-lg"
                      style={{ background: 'rgba(200,82,42,0.2)', color: '#C8522A' }}>
                      Pick
                    </button>
                  )}
                  {isHost && (
                    <button onClick={() => handleDelete(option.id)} className="opacity-40 hover:opacity-80">
                      <Trash2 className="w-3.5 h-3.5" style={{ color: '#EFE3CE' }} />
                    </button>
                  )}
                </div>
              </div>
              {canInteract && (
                <button onClick={() => handleVote(option.id, option.user_voted ?? false)}
                  className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl mt-1"
                  style={{
                    background: option.user_voted ? 'rgba(200,82,42,0.2)' : 'rgba(255,255,255,0.05)',
                    color: option.user_voted ? '#C8522A' : 'rgba(239,227,206,0.5)',
                    border: `1px solid ${option.user_voted ? 'rgba(200,82,42,0.4)' : 'rgba(255,255,255,0.08)'}`,
                  }}>
                  <ThumbsUp className="w-3 h-3" />
                  {option.vote_count ?? 0} {(option.vote_count ?? 0) === 1 ? 'vote' : 'votes'}
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
