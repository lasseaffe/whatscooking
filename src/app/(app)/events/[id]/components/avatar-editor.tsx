// src/app/(app)/events/[id]/components/avatar-editor.tsx
'use client';

import { useState, useRef } from 'react';
import { Upload, X } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

const EMOJI_OPTIONS = ['🍽️','🥂','🎂','🥞','🍷','🎬','🎮','🌹','🥗','🍜','🌮','🥘','🍕','🎉','🏡'];

export function AvatarEditor({ eventId, currentEmoji, currentUrl, onSaved }: {
  eventId: string;
  currentEmoji: string | null;
  currentUrl: string | null;
  onSaved: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<'emoji' | 'upload'>('emoji');
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function pickEmoji(emoji: string) {
    await fetch(`/api/events/${eventId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ avatar_emoji: emoji, avatar_url: null }),
    });
    setOpen(false);
    onSaved();
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { alert('Max 5MB'); return; }
    setUploading(true);
    const supabase = createClient();
    const path = `${eventId}/${Date.now()}-${file.name}`;
    const { error } = await supabase.storage.from('event-avatars').upload(path, file, { upsert: true });
    if (!error) {
      const { data } = supabase.storage.from('event-avatars').getPublicUrl(path);
      await fetch(`/api/events/${eventId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ avatar_url: data.publicUrl }),
      });
      onSaved();
      setOpen(false);
    }
    setUploading(false);
  }

  return (
    <>
      <button onClick={() => setOpen(true)} className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl hover:opacity-80 transition-opacity"
        style={{ background: 'rgba(200,82,42,0.15)' }}>
        {currentUrl ? <img src={currentUrl} className="w-16 h-16 rounded-2xl object-cover" alt="" /> : (currentEmoji ?? '🍽️')}
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)' }}>
          <div className="w-full max-w-sm rounded-3xl p-5" style={{ background: '#1A1210' }}>
            <div className="flex items-center justify-between mb-4">
              <span className="font-semibold">Event avatar</span>
              <button onClick={() => setOpen(false)}><X className="w-5 h-5 opacity-50" /></button>
            </div>
            <div className="flex gap-2 mb-4">
              {(['emoji','upload'] as const).map(t => (
                <button key={t} onClick={() => setTab(t)}
                  className="flex-1 py-1.5 rounded-xl text-sm capitalize"
                  style={{ background: tab === t ? 'rgba(200,82,42,0.2)' : 'rgba(255,255,255,0.06)', color: tab === t ? '#C8522A' : '#EFE3CE' }}>
                  {t}
                </button>
              ))}
            </div>
            {tab === 'emoji' ? (
              <div className="grid grid-cols-5 gap-2">
                {EMOJI_OPTIONS.map(e => (
                  <button key={e} onClick={() => pickEmoji(e)}
                    className="text-3xl p-2 rounded-xl hover:bg-white/10 transition-colors">{e}</button>
                ))}
              </div>
            ) : (
              <button onClick={() => fileRef.current?.click()}
                disabled={uploading}
                className="w-full py-3 rounded-xl border border-dashed text-sm flex items-center justify-center gap-2 opacity-70 hover:opacity-100"
                style={{ borderColor: 'rgba(255,255,255,0.2)' }}>
                <Upload className="w-4 h-4" />
                {uploading ? 'Uploading...' : 'Choose image (max 5MB)'}
              </button>
            )}
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleUpload} />
          </div>
        </div>
      )}
    </>
  );
}
