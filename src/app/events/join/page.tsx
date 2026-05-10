'use client';

import { Suspense, useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { ChefHat, Check } from 'lucide-react';

function JoinForm() {
  const params = useSearchParams();
  const token = params.get('token') ?? '';

  const [eventTitle, setEventTitle] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) { setNotFound(true); setLoading(false); return; }
    fetch(`/api/events/join?token=${encodeURIComponent(token)}`)
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (!data) { setNotFound(true); }
        else { setEventTitle(data.title); setEventDate(data.scheduled_at); }
        setLoading(false);
      });
  }, [token]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setSubmitting(true);
    setError('');
    const res = await fetch('/api/events/join', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, name: name.trim(), email: email.trim() || null }),
    });
    const json = await res.json();
    if (!res.ok) { setError(json.error ?? 'Something went wrong'); }
    else { setDone(true); }
    setSubmitting(false);
  }

  const formattedDate = eventDate
    ? new Date(eventDate).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })
    : '';

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-5 py-12"
      style={{ background: '#0D0907', color: '#EFE3CE' }}>
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-2 mb-8 justify-center">
          <ChefHat className="w-6 h-6" style={{ color: '#C8522A' }} />
          <span className="font-bold text-lg tracking-tight" style={{ color: '#EFE3CE' }}>What&apos;s Cooking</span>
        </div>

        {loading && (
          <p className="text-center opacity-40 text-sm">Loading invitation…</p>
        )}

        {!loading && notFound && (
          <div className="text-center">
            <p className="text-sm opacity-50">This invite link is invalid or has expired.</p>
          </div>
        )}

        {!loading && !notFound && done && (
          <div className="rounded-2xl p-6 text-center"
            style={{ background: 'rgba(200,82,42,0.1)', border: '1px solid rgba(200,82,42,0.25)' }}>
            <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4"
              style={{ background: 'rgba(200,82,42,0.2)' }}>
              <Check className="w-6 h-6" style={{ color: '#C8522A' }} />
            </div>
            <p className="font-semibold text-lg mb-1" style={{ color: '#EFE3CE' }}>You&apos;re on the list!</p>
            <p className="text-sm opacity-50">{eventTitle}</p>
            {formattedDate && <p className="text-xs mt-1 opacity-40">{formattedDate}</p>}
          </div>
        )}

        {!loading && !notFound && !done && (
          <div className="flex flex-col gap-6">
            <div className="rounded-2xl p-5" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <p className="text-xs uppercase tracking-widest opacity-40 mb-1">You&apos;re invited to</p>
              <p className="text-xl font-semibold" style={{ color: '#EFE3CE' }}>{eventTitle}</p>
              {formattedDate && <p className="text-sm mt-1 opacity-50">{formattedDate}</p>}
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
              <input
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Your name *"
                required
                className="w-full rounded-xl px-4 py-3 text-sm"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#EFE3CE' }}
              />
              <input
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="Email (optional)"
                type="email"
                className="w-full rounded-xl px-4 py-3 text-sm"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#EFE3CE' }}
              />
              {error && <p className="text-xs" style={{ color: '#ef4444' }}>{error}</p>}
              <button type="submit" disabled={submitting || !name.trim()}
                className="w-full py-3 rounded-2xl font-semibold text-sm disabled:opacity-40 mt-1"
                style={{ background: 'linear-gradient(135deg,#C8522A,#E8834A)', color: '#fff' }}>
                {submitting ? 'Joining…' : 'Accept invitation'}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

export default function JoinPage() {
  return (
    <Suspense>
      <JoinForm />
    </Suspense>
  );
}
