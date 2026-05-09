'use client';

import { useState } from 'react';
import { Calendar, MapPin, Users, Clock, ChefHat, Edit2, Check, X } from 'lucide-react';
import type { FullEventData } from '@/lib/event-types';

const COURSE_ORDER = ['appetizer', 'main', 'side', 'dessert', 'drink'] as const;
const COURSE_LABEL: Record<string, string> = {
  appetizer: 'Starters', main: 'Main', side: 'Sides', dessert: 'Dessert', drink: 'Drinks',
};

export function OverviewTab({ data, isHost, eventId, onReload }: {
  data: FullEventData;
  isHost: boolean;
  eventId: string;
  onReload: () => void;
}) {
  const { party, guests, menuItems, timelineItems } = data;
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(party.title);
  const [location, setLocation] = useState(party.location ?? '');
  const [description, setDescription] = useState(party.description ?? '');
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    await fetch(`/api/events/${eventId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, location: location || null, description: description || null }),
    });
    setSaving(false);
    setEditing(false);
    onReload();
  }

  const grouped = COURSE_ORDER
    .map(course => ({ course, items: menuItems.filter(m => m.course === course) }))
    .filter(g => g.items.length > 0);

  const accepted = guests.filter(g => g.rsvp === 'accepted').length;
  const invited = guests.filter(g => g.rsvp === 'invited').length;

  return (
    <div className="flex flex-col gap-6 pb-12">
      {/* Event card */}
      <div className="rounded-2xl p-5 border" style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.07)' }}>
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="w-14 h-14 rounded-xl flex items-center justify-center text-3xl shrink-0"
            style={{ background: 'rgba(200,82,42,0.15)' }}>
            {party.avatar_url
              ? <img src={party.avatar_url} className="w-14 h-14 rounded-xl object-cover" alt="" />
              : (party.avatar_emoji ?? '🍽️')}
          </div>
          {isHost && !editing && (
            <button onClick={() => setEditing(true)}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl"
              style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(239,227,206,0.6)' }}>
              <Edit2 className="w-3 h-3" /> Edit
            </button>
          )}
          {editing && (
            <div className="flex gap-2">
              <button onClick={handleSave} disabled={saving}
                className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-xl font-semibold"
                style={{ background: 'rgba(200,82,42,0.25)', color: '#C8522A' }}>
                <Check className="w-3 h-3" /> {saving ? 'Saving…' : 'Save'}
              </button>
              <button onClick={() => setEditing(false)}
                className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-xl"
                style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(239,227,206,0.5)' }}>
                <X className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>

        {editing ? (
          <div className="flex flex-col gap-3">
            <input value={title} onChange={e => setTitle(e.target.value)}
              className="w-full rounded-xl px-3 py-2 text-sm font-semibold"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#EFE3CE' }} />
            <input value={location} onChange={e => setLocation(e.target.value)}
              placeholder="Location"
              className="w-full rounded-xl px-3 py-2 text-sm"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#EFE3CE' }} />
            <textarea value={description} onChange={e => setDescription(e.target.value)}
              placeholder="Description"
              rows={3}
              className="w-full rounded-xl px-3 py-2 text-sm resize-none"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#EFE3CE' }} />
          </div>
        ) : (
          <>
            <h2 className="text-lg font-semibold mb-3" style={{ color: '#EFE3CE' }}>{party.title}</h2>
            <div className="flex flex-col gap-2 text-sm" style={{ color: 'rgba(239,227,206,0.6)' }}>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 shrink-0" />
                {new Date(party.scheduled_at).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                {' · '}
                {new Date(party.scheduled_at).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
              </div>
              {party.location && (
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 shrink-0" /> {party.location}
                </div>
              )}
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 shrink-0" /> {accepted} confirmed · {invited} pending
              </div>
              {party.description && (
                <p className="mt-2 leading-relaxed" style={{ color: 'rgba(239,227,206,0.7)' }}>{party.description}</p>
              )}
            </div>
          </>
        )}
      </div>

      {/* Menu */}
      {grouped.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <ChefHat className="w-4 h-4" style={{ color: '#C8522A' }} />
            <h3 className="text-sm font-semibold tracking-wide uppercase" style={{ color: 'rgba(239,227,206,0.5)' }}>Menu</h3>
          </div>
          <div className="flex flex-col gap-4">
            {grouped.map(({ course, items }) => (
              <div key={course}>
                <p className="text-xs font-semibold mb-2 uppercase tracking-widest" style={{ color: 'rgba(200,82,42,0.8)' }}>
                  {COURSE_LABEL[course]}
                </p>
                <div className="flex flex-col gap-1.5">
                  {items.map(item => (
                    <div key={item.id} className="rounded-xl px-4 py-2.5"
                      style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                      <p className="text-sm font-medium" style={{ color: '#EFE3CE' }}>{item.name}</p>
                      {item.description && <p className="text-xs mt-0.5" style={{ color: 'rgba(239,227,206,0.45)' }}>{item.description}</p>}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Timeline */}
      {timelineItems.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Clock className="w-4 h-4" style={{ color: '#C8522A' }} />
            <h3 className="text-sm font-semibold tracking-wide uppercase" style={{ color: 'rgba(239,227,206,0.5)' }}>Timeline</h3>
          </div>
          <div className="flex flex-col gap-2 pl-4 border-l" style={{ borderColor: 'rgba(200,82,42,0.3)' }}>
            {[...timelineItems].sort((a, b) => a.sort_order - b.sort_order).map(item => (
              <div key={item.id} className="relative">
                <div className="absolute -left-[21px] w-2.5 h-2.5 rounded-full mt-1.5"
                  style={{ background: '#C8522A' }} />
                <p className="text-xs font-semibold mb-0.5" style={{ color: '#C8522A' }}>{item.time_label}</p>
                <p className="text-sm" style={{ color: 'rgba(239,227,206,0.8)' }}>{item.activity}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {grouped.length === 0 && timelineItems.length === 0 && (
        <div className="text-center py-12" style={{ color: 'rgba(239,227,206,0.3)' }}>
          <ChefHat className="w-8 h-8 mx-auto mb-2 opacity-30" />
          <p className="text-sm">No menu or timeline yet</p>
          {isHost && <p className="text-xs mt-1 opacity-60">Use the Shopping and Location tabs to plan the details</p>}
        </div>
      )}
    </div>
  );
}
