'use client'

import { useState, useTransition } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Props {
  userId: string
  linkedApp: 'tillr'
  initialLinkedUserId?: string | null
}

export function EcosystemConnectSection({ userId, linkedApp, initialLinkedUserId }: Props) {
  const [linkedUserId, setLinkedUserId] = useState(initialLinkedUserId ?? null)
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'linking' | 'success' | 'error' | 'not-found'>('idle')
  const [isPending, startTransition] = useTransition()

  const appName = linkedApp === 'tillr' ? 'Tillr' : "What's Cooking"
  const appUrl = linkedApp === 'tillr'
    ? (process.env.NEXT_PUBLIC_TILLR_APP_URL ?? 'https://tillr.app')
    : 'https://whatscooking.app'

  async function handleLink() {
    if (!email.trim()) return
    setStatus('linking')
    startTransition(async () => {
      try {
        const res = await fetch(`${appUrl}/api/ecosystem/lookup`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: email.trim() }),
        })
        const { userId: otherUserId } = await res.json()
        if (!otherUserId) { setStatus('not-found'); return }

        const supabase = createClient()
        await supabase.from('ecosystem_links').upsert({
          user_id: userId,
          linked_app: linkedApp,
          linked_user_id: otherUserId,
        })
        setLinkedUserId(otherUserId)
        setStatus('success')
      } catch {
        setStatus('error')
      }
    })
  }

  async function handleUnlink() {
    const supabase = createClient()
    await supabase.from('ecosystem_links')
      .delete()
      .eq('user_id', userId)
      .eq('linked_app', linkedApp)
    setLinkedUserId(null)
    setStatus('idle')
    setEmail('')
  }

  if (linkedUserId) {
    return (
      <div className="flex items-center justify-between">
        <div>
          <span className="text-sm font-medium" style={{ color: '#7cb97c' }}>● Linked to {appName}</span>
          <p className="text-xs mt-0.5" style={{ color: '#7a5a40' }}>
            Garden harvests sync with your meal plan automatically.
          </p>
        </div>
        <button
          onClick={handleUnlink}
          className="text-xs px-3 py-1.5 rounded-md transition-colors"
          style={{ border: '1px solid rgba(120,90,64,0.4)', color: '#7a5a40' }}
        >
          Disconnect
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-2">
        <input
          type="email"
          placeholder={`Your ${appName} email`}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="flex-1 text-sm px-3 py-2 rounded-lg focus:outline-none"
          style={{
            background: 'rgba(26,16,8,0.6)',
            border: '1px solid rgba(120,90,64,0.4)',
            color: '#EFE3CE',
          }}
        />
        <button
          onClick={handleLink}
          disabled={isPending || !email.trim()}
          className="text-sm px-4 py-2 rounded-lg font-semibold disabled:opacity-50 transition-colors"
          style={{ background: '#2d6a2d', color: '#faf5ec' }}
        >
          {isPending ? 'Linking…' : 'Connect'}
        </button>
      </div>
      {status === 'not-found' && (
        <p className="text-xs" style={{ color: '#e12429' }}>
          No {appName} account found.{' '}
          <a href={`${appUrl}/signup`} className="underline">Sign up free →</a>
        </p>
      )}
      {status === 'error' && (
        <p className="text-xs" style={{ color: '#e12429' }}>Something went wrong. Try again.</p>
      )}
      {status === 'success' && (
        <p className="text-xs font-medium" style={{ color: '#7cb97c' }}>✓ Connected! Harvest data will now sync with your meal plan.</p>
      )}
      <p className="text-xs" style={{ color: '#7a5a40' }}>
        Don&apos;t have {appName} yet?{' '}
        <a href={`${appUrl}/signup`} className="underline" style={{ color: '#a08060' }}>
          Get it free →
        </a>
      </p>
    </div>
  )
}
