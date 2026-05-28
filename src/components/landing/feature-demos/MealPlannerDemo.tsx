'use client'
import { useEffect, useState } from 'react'

// Mirrors plans-client.tsx plan card grid exactly:
// bg #1C1209, border #3A2416, 2xl radius, 80px thumbnail, Active badge,
// thumbnail carousel fade, third card snaps in.

const PLANS = [
  {
    title: 'Weeknight Rotation',
    status: 'Active',
    meals: '14 meals · 7 days',
    dietary: 'Quick · Family-friendly',
    images: [
      'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=200&q=70',
      'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=200&q=70',
    ],
  },
  {
    title: 'Plant-Based Week',
    status: 'Saved',
    meals: '10 meals · 5 days',
    dietary: 'Vegetarian · High-protein',
    images: [
      'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=200&q=70',
    ],
  },
  {
    title: 'Date Night Series',
    status: 'Active',
    meals: '6 meals · 3 evenings',
    dietary: 'Romantic · Under 1hr',
    images: [
      'https://images.unsplash.com/photo-1569050467447-ce54b3bbc37d?w=200&q=70',
    ],
  },
]

export function MealPlannerDemo() {
  const [thumbIdx, setThumbIdx] = useState(0)
  const [thumbFade, setThumbFade] = useState(true)
  const [thirdVisible, setThirdVisible] = useState(false)
  const [badgePulse, setBadgePulse] = useState(false)

  useEffect(() => {
    const interval = setInterval(() => {
      setThumbFade(false)
      setTimeout(() => {
        setThumbIdx(prev => (prev + 1) % PLANS[0].images.length)
        setThumbFade(true)
      }, 250)
    }, 2000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const t = setTimeout(() => setThirdVisible(true), 1500)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    const interval = setInterval(() => {
      setBadgePulse(true)
      setTimeout(() => setBadgePulse(false), 600)
    }, 3000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div style={{ width: '100%', maxWidth: 480, display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
        <span style={{ fontFamily: 'var(--font-baskerville, Georgia, serif)', fontSize: 16, fontWeight: 700, color: '#EFE3CE' }}>
          My Meal Plans
        </span>
        <button style={{
          display: 'flex', alignItems: 'center', gap: 5,
          background: '#C8522A', color: 'white',
          fontSize: 11, padding: '6px 12px', borderRadius: 10,
          border: 'none', cursor: 'default', fontFamily: 'inherit',
        }}>
          + New plan
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        {PLANS.map((plan, i) => {
          if (i === 2 && !thirdVisible) return null
          return (
            <div key={plan.title} style={{
              background: '#1C1209',
              border: '1px solid #3A2416',
              borderRadius: 16,
              overflow: 'hidden',
              animation: i === 2 && thirdVisible ? 'mpCardSnapIn 0.4s cubic-bezier(0.34,1.56,0.64,1) both' : undefined,
            }}>
              <div style={{ height: 80, position: 'relative', background: 'linear-gradient(135deg,#241809,#2A1B0D)' }}>
                {plan.images[0] && (
                  <img
                    src={i === 0 ? plan.images[thumbIdx] : plan.images[0]}
                    alt={plan.title}
                    style={{
                      position: 'absolute', inset: 0, width: '100%', height: '100%',
                      objectFit: 'cover',
                      filter: 'brightness(0.85) saturate(0.9)',
                      opacity: i === 0 ? (thumbFade ? 1 : 0) : 1,
                      transition: 'opacity 250ms ease',
                    }}
                  />
                )}
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(13,9,7,0.55) 0%, transparent 60%)' }} />
              </div>
              <div style={{ padding: '10px 12px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 6, marginBottom: 4 }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: '#EFE3CE', lineHeight: 1.3 }}>{plan.title}</span>
                  <span style={{
                    fontSize: 10, padding: '2px 7px', borderRadius: 20, flexShrink: 0,
                    background: plan.status === 'Active' ? '#2A1808' : '#1A1A08',
                    color: plan.status === 'Active' ? '#C8522A' : '#C89818',
                    border: `1px solid ${plan.status === 'Active' ? '#C8522A30' : '#C8981830'}`,
                    boxShadow: plan.status === 'Active' && badgePulse && i === 0 ? '0 0 6px rgba(200,82,42,0.4)' : 'none',
                    transition: 'box-shadow 0.3s ease',
                  }}>
                    {plan.status}
                  </span>
                </div>
                <div style={{ fontSize: 10, color: '#6B4E36', marginBottom: 2 }}>{plan.meals}</div>
                <div style={{ fontSize: 10, color: '#6B4E36', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{plan.dietary}</div>
              </div>
            </div>
          )
        })}

        <div style={{
          background: 'rgba(26,16,8,0.3)', border: '1px dashed #3A2416', borderRadius: 16,
          height: 130, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6,
        }}>
          <div style={{
            width: 28, height: 28, borderRadius: 8,
            background: 'rgba(200,82,42,0.12)', border: '1px solid rgba(200,82,42,0.25)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 14, color: '#C8522A',
          }}>+</div>
          <span style={{ fontSize: 11, fontWeight: 600, color: '#8A6A4A' }}>New plan</span>
        </div>
      </div>

      <style>{`
        @keyframes mpCardSnapIn {
          0% { transform: translateX(30px) scale(0.9); opacity: 0; }
          80% { transform: translateX(-2px) scale(1.02); opacity: 1; }
          100% { transform: translateX(0) scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  )
}
