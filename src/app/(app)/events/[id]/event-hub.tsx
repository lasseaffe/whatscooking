// src/app/(app)/events/[id]/event-hub.tsx
'use client';

import { useState } from 'react';
import { ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import type { FullEventData } from '@/lib/event-types';
import { OverviewTab } from './tabs/overview-tab';
import { GuestsTab } from './tabs/guests-tab';
import { ShoppingTab } from './tabs/shopping-tab';
import { LocationTab } from './tabs/location-tab';
import { PlaylistTab } from './tabs/playlist-tab';

const TABS = ['Overview', 'Guests', 'Shopping', 'Location', 'Playlist'] as const;
type Tab = typeof TABS[number];

export function EventHub({ initialData, eventId, userId }: {
  initialData: FullEventData;
  eventId: string;
  userId: string;
}) {
  const [data, setData] = useState<FullEventData>(initialData);
  const [activeTab, setActiveTab] = useState<Tab>('Overview');

  async function reload() {
    const res = await fetch(`/api/events/${eventId}`);
    if (res.ok) setData(await res.json());
  }

  const isHost = data.userRole === 'host';
  const canInteract = isHost || data.guestRole === 'editor';

  return (
    <div className="min-h-screen pb-24" style={{ background: 'transparent', color: '#EFE3CE' }}>
      {/* Header */}
      <div className="sticky top-0 z-20 px-4 py-3 flex items-center gap-3"
        style={{ background: 'rgba(13,9,7,0.9)', backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <Link href="/events" className="flex items-center gap-1 text-sm opacity-60 hover:opacity-100">
          <ChevronLeft className="w-4 h-4" /> Events
        </Link>
        <div className="flex-1 text-center text-sm font-semibold tracking-widest uppercase truncate px-2">
          {data.party.title}
        </div>
        <div className="w-16" />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 px-4 py-3 overflow-x-auto"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        {TABS.map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className="px-4 py-1.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all"
            style={{
              background: activeTab === tab ? 'rgba(200,82,42,0.2)' : 'transparent',
              color: activeTab === tab ? '#C8522A' : 'rgba(239,227,206,0.5)',
            }}>
            {tab}
          </button>
        ))}
      </div>

      <div className="max-w-2xl mx-auto px-4 pt-6">
        {activeTab === 'Overview'  && <OverviewTab  data={data} isHost={isHost} eventId={eventId} onReload={reload} />}
        {activeTab === 'Guests'    && <GuestsTab    data={data} isHost={isHost} eventId={eventId} userId={userId} guestRole={data.guestRole} onReload={reload} />}
        {activeTab === 'Shopping'  && <ShoppingTab  data={data} canInteract={canInteract} eventId={eventId} userId={userId} onReload={reload} />}
        {activeTab === 'Location'  && <LocationTab  data={data} isHost={isHost} canInteract={canInteract} eventId={eventId} onReload={reload} />}
        {activeTab === 'Playlist'  && <PlaylistTab  data={data} canInteract={canInteract} eventId={eventId} onReload={reload} />}
      </div>
    </div>
  );
}
