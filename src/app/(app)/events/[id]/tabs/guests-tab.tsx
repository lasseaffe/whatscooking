'use client';

import { useState } from 'react';
import { UserPlus, X } from 'lucide-react';
import type { FullEventData } from '@/lib/event-types';

const RSVP_COLORS: Record<string, string> = {
  accepted: '#22c55e',
  declined:  '#ef4444',
  maybe:     '#f59e0b',
  invited:   'rgba(239,227,206,0.4)',
};

export function GuestsTab({ data, isHost, eventId, userId, onReload }: {
  data: FullEventData;
  isHost: boolean;
  eventId: string;
  userId: string;
  onReload: () => void;
}) {
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviting, setInviting] = useState(false);

  async function invite() {
    if (!inviteEmail.trim()) return;
    setInviting(true);
    await fetch(`/api/events/${eventId}/guests`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: inviteEmail.trim(), displayName: inviteEmail.split('@')[0] }),
    });
    setInviteEmail('');
    setInviting(false);
    onReload();
  }

  async function rsvp(guestId: string, rsvp: string) {
    await fetch(`/api/events/${eventId}/guests/${guestId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rsvp }),
    });
    onReload();
  }

  async function removeGuest(guestId: string) {
    await fetch(`/api/events/${eventId}/guests/${guestId}`, { method: 'DELETE' });
    onReload();
  }

  const myGuestRow = data.guests.find(g => g.user_id === userId);

  return (
    <div className="flex flex-col gap-4">
      {/* My RSVP (if guest) */}
      {!isHost && myGuestRow && (
        <div className="p-4 rounded-2xl" style={{ background: 'rgba(200,82,42,0.08)', border: '1px solid rgba(200,82,42,0.2)' }}>
          <p className="text-xs opacity-50 mb-2 uppercase tracking-widest">Your RSVP</p>
          <div className="flex gap-2">
            {(['accepted','maybe','declined'] as const).map(r => (
              <button key={r} onClick={() => rsvp(myGuestRow.id, r)}
                className="flex-1 py-2 rounded-xl text-xs font-semibold capitalize transition-all"
                style={{
                  background: myGuestRow.rsvp === r ? 'rgba(200,82,42,0.3)' : 'rgba(255,255,255,0.06)',
                  color: myGuestRow.rsvp === r ? '#C8522A' : '#EFE3CE',
                }}>
                {r}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Invite (host only) */}
      {isHost && (
        <div className="flex gap-2">
          <input value={inviteEmail} onChange={e => setInviteEmail(e.target.value)}
            placeholder="Email or username to invite"
            className="flex-1 px-4 py-3 rounded-xl border text-sm focus:outline-none"
            style={{ background: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.1)', color: '#EFE3CE' }} />
          <button onClick={invite} disabled={inviting || !inviteEmail.trim()}
            className="px-4 py-3 rounded-xl font-semibold text-sm disabled:opacity-40 flex items-center gap-1.5"
            style={{ background: 'linear-gradient(135deg,#C8522A,#E8834A)', color: '#fff' }}>
            <UserPlus className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Guest list */}
      <div className="flex flex-col gap-2">
        {data.guests.length === 0 && (
          <p className="text-sm opacity-40 text-center py-8">No guests yet</p>
        )}
        {data.guests.map(guest => (
          <div key={guest.id} className="flex items-center gap-3 p-3 rounded-xl"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
              style={{ background: 'rgba(200,82,42,0.2)', color: '#C8522A' }}>
              {(guest.display_name ?? guest.email ?? '?')[0].toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{guest.display_name ?? guest.email}</p>
              <p className="text-xs opacity-40">{guest.email}</p>
            </div>
            <span className="text-xs px-2 py-0.5 rounded-full capitalize" style={{ color: RSVP_COLORS[guest.rsvp] }}>
              {guest.rsvp}
            </span>
            {isHost && (
              <button onClick={() => removeGuest(guest.id)} className="opacity-30 hover:opacity-80">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
