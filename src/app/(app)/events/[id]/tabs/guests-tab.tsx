'use client';

import { useState } from 'react';
import { UserPlus, X, Link2, Copy, Check } from 'lucide-react';
import type { FullEventData, GuestRole } from '@/lib/event-types';

const RSVP_COLORS: Record<string, string> = {
  accepted: '#22c55e',
  declined:  '#ef4444',
  maybe:     '#f59e0b',
  invited:   'rgba(239,227,206,0.4)',
};

export function GuestsTab({ data, isHost, eventId, userId, guestRole, onReload }: {
  data: FullEventData;
  isHost: boolean;
  eventId: string;
  userId: string;
  guestRole: GuestRole | null;
  onReload: () => void;
}) {
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<GuestRole>('viewer');
  const [inviting, setInviting] = useState(false);

  const [inviteLink, setInviteLink] = useState('');
  const [loadingLink, setLoadingLink] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showLinkPanel, setShowLinkPanel] = useState(false);

  async function loadInviteLink() {
    if (inviteLink) { setShowLinkPanel(true); return; }
    setLoadingLink(true);
    setShowLinkPanel(true);
    const res = await fetch(`/api/events/${eventId}/invite-link`);
    const json = await res.json();
    setInviteLink(json.url ?? '');
    setLoadingLink(false);
  }

  async function copyLink() {
    await navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function invite() {
    if (!inviteEmail.trim()) return;
    setInviting(true);
    await fetch(`/api/events/${eventId}/guests`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: inviteEmail.trim(), displayName: inviteEmail.split('@')[0], role: inviteRole }),
    });
    setInviteEmail('');
    setInviting(false);
    onReload();
  }

  async function rsvp(guestId: string, rsvpValue: string) {
    await fetch(`/api/events/${eventId}/guests/${guestId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rsvp: rsvpValue }),
    });
    onReload();
  }

  async function setRole(guestId: string, role: GuestRole) {
    await fetch(`/api/events/${eventId}/guests/${guestId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role }),
    });
    onReload();
  }

  async function removeGuest(guestId: string) {
    await fetch(`/api/events/${eventId}/guests/${guestId}`, { method: 'DELETE' });
    onReload();
  }

  const myGuestRow = data.guests.find(g => g.user_id === userId);
  const whatsappUrl = inviteLink ? `https://wa.me/?text=${encodeURIComponent(`You're invited! ${inviteLink}`)}` : '';
  const imessageUrl = inviteLink ? `sms:&body=${encodeURIComponent(`You're invited! ${inviteLink}`)}` : '';

  return (
    <div className="flex flex-col gap-4 pb-12">
      {/* My RSVP (if guest) */}
      {!isHost && myGuestRow && (
        <div className="p-4 rounded-2xl" style={{ background: 'rgba(200,82,42,0.08)', border: '1px solid rgba(200,82,42,0.2)' }}>
          <p className="text-xs opacity-50 mb-2 uppercase tracking-widest">Your RSVP</p>
          <div className="flex gap-2">
            {(['accepted', 'maybe', 'declined'] as const).map(r => (
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

      {/* Shareable invite link (host only) */}
      {isHost && (
        <div className="flex flex-col gap-3">
          <button onClick={loadInviteLink}
            className="flex items-center gap-2 text-sm px-4 py-3 rounded-2xl w-full justify-center font-semibold"
            style={{ background: 'rgba(200,82,42,0.12)', border: '1px dashed rgba(200,82,42,0.35)', color: '#C8522A' }}>
            <Link2 className="w-4 h-4" /> Share invite link
          </button>

          {showLinkPanel && (
            <div className="rounded-2xl p-4 border flex flex-col gap-3"
              style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.08)' }}>
              {loadingLink ? (
                <p className="text-sm opacity-40">Generating link…</p>
              ) : (
                <>
                  <p className="text-xs font-mono break-all" style={{ color: 'rgba(239,227,206,0.5)' }}>{inviteLink}</p>
                  <div className="flex gap-2 flex-wrap">
                    <button onClick={copyLink}
                      className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-xl font-semibold"
                      style={{ background: 'rgba(200,82,42,0.2)', color: '#C8522A' }}>
                      {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      {copied ? 'Copied!' : 'Copy link'}
                    </button>
                    <a href={whatsappUrl} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-xl font-semibold"
                      style={{ background: 'rgba(37,211,102,0.15)', color: 'rgba(37,211,102,0.9)' }}>
                      💬 WhatsApp
                    </a>
                    <a href={imessageUrl}
                      className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-xl font-semibold"
                      style={{ background: 'rgba(0,122,255,0.12)', color: 'rgba(100,180,255,0.9)' }}>
                      💬 iMessage
                    </a>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      )}

      {/* Invite by email (host only) */}
      {isHost && (
        <div className="rounded-2xl p-4 border flex flex-col gap-3"
          style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.07)' }}>
          <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'rgba(239,227,206,0.4)' }}>
            Invite by email
          </p>
          <div className="flex gap-2 mb-1">
            {(['viewer', 'editor'] as const).map(r => (
              <button key={r} onClick={() => setInviteRole(r)}
                className="px-3 py-1.5 rounded-xl text-xs font-medium capitalize"
                style={{
                  background: inviteRole === r ? 'rgba(200,82,42,0.25)' : 'rgba(255,255,255,0.06)',
                  color: inviteRole === r ? '#C8522A' : 'rgba(239,227,206,0.5)',
                  border: `1px solid ${inviteRole === r ? 'rgba(200,82,42,0.4)' : 'rgba(255,255,255,0.08)'}`,
                }}>
                {r === 'editor' ? '✏️ Editor' : '👁 Viewer'}
              </button>
            ))}
          </div>
          <p className="text-xs" style={{ color: 'rgba(239,227,206,0.3)' }}>
            {inviteRole === 'editor' ? 'Can add shopping items, suggest locations, and add tracks' : 'Read-only access'}
          </p>
          <div className="flex gap-2">
            <input value={inviteEmail} onChange={e => setInviteEmail(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && invite()}
              placeholder="guest@email.com"
              className="flex-1 px-3 py-2 rounded-xl border text-sm focus:outline-none"
              style={{ background: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.1)', color: '#EFE3CE' }} />
            <button onClick={invite} disabled={inviting || !inviteEmail.trim()}
              className="px-4 py-2 rounded-xl font-semibold text-sm disabled:opacity-40 flex items-center gap-1.5"
              style={{ background: 'rgba(200,82,42,0.25)', color: '#C8522A' }}>
              <UserPlus className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Guest list */}
      <div className="flex flex-col gap-2">
        {data.guests.length === 0 && (
          <div className="text-center py-12" style={{ color: 'rgba(239,227,206,0.3)' }}>
            <UserPlus className="w-8 h-8 mx-auto mb-2 opacity-30" />
            <p className="text-sm">No guests yet</p>
          </div>
        )}
        {data.guests.map(guest => (
          <div key={guest.id} className="flex items-center gap-3 p-3 rounded-xl"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
              style={{ background: 'rgba(200,82,42,0.2)', color: '#C8522A' }}>
              {(guest.display_name ?? guest.email ?? '?')[0].toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate" style={{ color: '#EFE3CE' }}>{guest.display_name ?? guest.email}</p>
              {guest.email && <p className="text-xs truncate" style={{ color: 'rgba(239,227,206,0.4)' }}>{guest.email}</p>}
            </div>
            <span className="text-xs px-2 py-0.5 rounded-full capitalize" style={{ color: RSVP_COLORS[guest.rsvp] }}>
              {guest.rsvp}
            </span>
            {isHost && (
              <select
                value={guest.role}
                onChange={e => setRole(guest.id, e.target.value as GuestRole)}
                className="text-xs rounded-lg px-2 py-1"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(239,227,206,0.7)' }}>
                <option value="viewer">Viewer</option>
                <option value="editor">Editor</option>
              </select>
            )}
            {isHost && (
              <button onClick={() => removeGuest(guest.id)} className="opacity-30 hover:opacity-80">
                <X className="w-4 h-4" style={{ color: '#EFE3CE' }} />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
