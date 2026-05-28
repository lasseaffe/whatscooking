'use client'
import { useEffect, useState } from 'react'

// Mirrors hero-swiper.tsx from discover:
// card stack with gradient cards + title text, saffron heart pop on swipe right,
// action buttons: X / bookmark / heart (saffron) / info — exact colours from real component.

const CARDS = [
  { title: 'Birria Tacos', cuisine: 'Mexican', time: '75 min', bg: 'linear-gradient(160deg,#5a2510,#1a0a04)', image: 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=300&q=70' },
  { title: 'Tonkotsu Ramen', cuisine: 'Japanese', time: '13 hr', bg: 'linear-gradient(160deg,#1a0a2a,#080314)', image: 'https://images.unsplash.com/photo-1569050467447-ce54b3bbc37d?w=300&q=70' },
  { title: 'Butter Croissant', cuisine: 'French', time: '9 hr', bg: 'linear-gradient(160deg,#2a1a0a,#0d0604)', image: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=300&q=70' },
]

type Phase = 'idle' | 'swipe-right' | 'swipe-left' | 'reset'

export function MealSwipeDemo() {
  const [idx, setIdx] = useState(0)
  const [phase, setPhase] = useState<Phase>('idle')

  // Loop: idle 1.5s → swipe right → reset → idle 1.5s → swipe left → reset
  useEffect(() => {
    let t1: ReturnType<typeof setTimeout>
    let t2: ReturnType<typeof setTimeout>
    let t3: ReturnType<typeof setTimeout>
    let t4: ReturnType<typeof setTimeout>
    let t5: ReturnType<typeof setTimeout>

    t1 = setTimeout(() => setPhase('swipe-right'), 1500)
    t2 = setTimeout(() => {
      setPhase('reset')
      setIdx(prev => (prev + 1) % CARDS.length)
    }, 2800)
    t3 = setTimeout(() => setPhase('idle'), 3100)
    t4 = setTimeout(() => setPhase('swipe-left'), 4600)
    t5 = setTimeout(() => {
      setPhase('reset')
      setIdx(prev => (prev + 1) % CARDS.length)
      setTimeout(() => setPhase('idle'), 300)
    }, 5900)

    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4); clearTimeout(t5) }
  }, [idx]) // re-arm after each card change

  const card = CARDS[idx]
  const nextCard = CARDS[(idx + 1) % CARDS.length]

  const cardTransform = phase === 'swipe-right'
    ? 'translateX(120px) rotate(18deg)'
    : phase === 'swipe-left'
      ? 'translateX(-120px) rotate(-18deg)'
      : 'translateX(0) rotate(0deg)'

  const cardOpacity = (phase === 'swipe-right' || phase === 'swipe-left') ? 0 : 1

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>

      {/* Card stack */}
      <div style={{ position: 'relative', width: 220, height: 300 }}>
        {/* Back card */}
        <div style={{
          position: 'absolute', inset: 0, borderRadius: 16,
          background: nextCard.bg,
          border: '1px solid rgba(244,162,97,0.1)',
          transform: 'rotate(-3deg) scale(0.94)',
          overflow: 'hidden',
        }}>
          <img src={nextCard.image} alt={nextCard.title} style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.7, filter: 'brightness(0.7)' }} />
        </div>

        {/* Middle card */}
        <div style={{
          position: 'absolute', inset: 0, borderRadius: 16,
          background: CARDS[(idx + 2) % CARDS.length].bg,
          border: '1px solid rgba(244,162,97,0.12)',
          transform: 'rotate(-1deg) scale(0.97)',
        }} />

        {/* Front card */}
        <div style={{
          position: 'absolute', inset: 0, borderRadius: 16,
          border: '1px solid rgba(244,162,97,0.25)',
          boxShadow: '0 20px 50px rgba(0,0,0,0.6)',
          overflow: 'hidden',
          transform: cardTransform,
          opacity: cardOpacity,
          transition: phase === 'reset' ? 'none' : 'transform 0.5s ease, opacity 0.4s ease',
          zIndex: 2,
        }}>
          <img src={card.image} alt={card.title} style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'brightness(0.85) saturate(0.9)' }} />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(transparent 45%, rgba(0,0,0,0.82) 100%)' }} />
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '14px 16px' }}>
            <div style={{ fontSize: 16, fontStyle: 'italic', fontWeight: 400, color: 'rgba(239,227,206,0.95)', fontFamily: 'Georgia, serif' }}>{card.title}</div>
            <div style={{ fontSize: 10, letterSpacing: 2, color: 'rgba(244,162,97,0.6)', marginTop: 4 }}>{card.cuisine.toUpperCase()} · {card.time.toUpperCase()}</div>
          </div>

          {/* Heart pop */}
          {phase === 'swipe-right' && (
            <div style={{
              position: 'absolute', top: 16, right: 16,
              fontSize: 28, color: 'rgba(244,162,97,0.9)',
              animation: 'msHeartPop 0.5s ease-out both',
            }}>♥</div>
          )}
          {/* X pop */}
          {phase === 'swipe-left' && (
            <div style={{
              position: 'absolute', top: 16, left: 16,
              fontSize: 24, color: 'rgba(200,80,80,0.9)',
              animation: 'msXPop 0.5s ease-out both',
            }}>✕</div>
          )}
        </div>
      </div>

      {/* Action buttons — mirrors real discover swiper exactly */}
      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        {[
          { label: '✕', title: 'Skip', accent: false },
          { label: '🔖', title: 'Save', accent: false },
          { label: '♥', title: 'Like', accent: true },
          { label: 'ℹ', title: 'Info', accent: false },
        ].map(({ label, title, accent }) => (
          <button
            key={label}
            title={title}
            style={{
              width: 44, height: 44, borderRadius: '50%',
              fontSize: 18,
              background: accent ? 'rgba(244,162,97,0.15)' : 'rgba(239,227,206,0.05)',
              border: `1px solid ${accent ? 'rgba(244,162,97,0.4)' : 'rgba(239,227,206,0.12)'}`,
              cursor: 'default',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            {label}
          </button>
        ))}
      </div>

      <style>{`
        @keyframes msHeartPop {
          0% { opacity: 0; transform: scale(0.4) rotate(-10deg); }
          60% { opacity: 1; transform: scale(1.3) rotate(5deg); }
          100% { opacity: 1; transform: scale(1) rotate(0deg); }
        }
        @keyframes msXPop {
          0% { opacity: 0; transform: scale(0.4); }
          60% { opacity: 1; transform: scale(1.3); }
          100% { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  )
}
