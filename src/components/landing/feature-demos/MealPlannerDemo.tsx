'use client'
import { useEffect, useState } from 'react'

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
]

const DAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI']
const MEAL_LABELS = ['BREAKFAST', 'LUNCH', 'DINNER']

type Slot = { title: string; img: string } | null

const WEEK_SLOTS: Slot[][] = [
  // Mon         Tue           Wed          Thu         Fri
  [
    { title: 'Avocado Toast', img: 'https://images.unsplash.com/photo-1541519227354-08fa5d50c820?w=120&q=60' },
    null,
    { title: 'Greek Yogurt Bowl', img: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=120&q=60' },
    null,
    { title: 'Overnight Oats', img: 'https://images.unsplash.com/photo-1574316071802-0d684efa7bf5?w=120&q=60' },
  ],
  [
    { title: 'Caesar Salad', img: 'https://images.unsplash.com/photo-1546793665-c74683f339c1?w=120&q=60' },
    { title: 'Ramen', img: 'https://images.unsplash.com/photo-1569050467447-ce54b3bbc37d?w=120&q=60' },
    null,
    { title: 'Fattoush', img: 'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=120&q=60' },
    { title: 'Soup & Bread', img: 'https://images.unsplash.com/photo-1547592180-85f173990554?w=120&q=60' },
  ],
  [
    { title: 'Birria Tacos', img: 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=120&q=60' },
    { title: 'Carbonara', img: 'https://images.unsplash.com/photo-1612874742237-6526221588e3?w=120&q=60' },
    { title: 'Grilled Salmon', img: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=120&q=60' },
    null,
    { title: 'Pizza Night', img: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=120&q=60' },
  ],
]

export function MealPlannerDemo() {
  const [thumbIdx, setThumbIdx] = useState(0)
  const [thumbFade, setThumbFade] = useState(true)
  const [badgePulse, setBadgePulse] = useState(false)
  const [gridVisible, setGridVisible] = useState(false)

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
    const t = setTimeout(() => setGridVisible(true), 400)
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
    <div style={{ width: '100%', maxWidth: 520, display: 'flex', flexDirection: 'column', gap: 10 }}>
      {/* Plan cards row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 }}>
        <span style={{ fontFamily: 'var(--font-baskerville, Georgia, serif)', fontSize: 14, fontWeight: 700, color: '#EFE3CE' }}>
          Weeknight Rotation
        </span>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <span style={{
            fontSize: 9, padding: '2px 7px', borderRadius: 20,
            background: '#2A1808', color: '#C8522A',
            border: '1px solid rgba(200,82,42,0.3)',
            boxShadow: badgePulse ? '0 0 6px rgba(200,82,42,0.4)' : 'none',
            transition: 'box-shadow 0.3s ease',
            letterSpacing: 1,
          }}>ACTIVE</span>
          <span style={{ fontSize: 9, color: '#6B4E36', letterSpacing: 1 }}>14 MEALS · 7 DAYS</span>
        </div>
      </div>

      {/* Weekly grid */}
      <div style={{ position: 'relative' }}>
        {/* Day headers */}
        <div style={{ display: 'grid', gridTemplateColumns: '44px repeat(5, 1fr)', gap: 3, marginBottom: 3 }}>
          <div />
          {DAYS.map(day => (
            <div key={day} style={{
              fontSize: 8, letterSpacing: 1.5, color: 'rgba(244,162,97,0.5)',
              textAlign: 'center', fontFamily: 'var(--font-geist-mono, monospace)',
            }}>
              {day}
            </div>
          ))}
        </div>

        {/* Meal rows */}
        {MEAL_LABELS.map((mealLabel, rowIdx) => (
          <div key={mealLabel} style={{ display: 'grid', gridTemplateColumns: '44px repeat(5, 1fr)', gap: 3, marginBottom: 3 }}>
            {/* Row label */}
            <div style={{
              fontSize: 7, letterSpacing: 1, color: 'rgba(239,227,206,0.25)',
              display: 'flex', alignItems: 'center',
              fontFamily: 'var(--font-geist-mono, monospace)',
              lineHeight: 1.2,
            }}>
              {mealLabel}
            </div>

            {/* Cells */}
            {DAYS.map((_, colIdx) => {
              const slot = WEEK_SLOTS[rowIdx][colIdx]
              const cellIdx = rowIdx * 5 + colIdx
              return (
                <div
                  key={colIdx}
                  style={{
                    height: 52,
                    borderRadius: 6,
                    overflow: 'hidden',
                    opacity: gridVisible ? 1 : 0,
                    animation: gridVisible ? `cellFadeIn 0.35s ease both` : 'none',
                    animationDelay: `${cellIdx * 45}ms`,
                    ...(slot ? {
                      background: 'linear-gradient(135deg,#241809,#2A1B0D)',
                      border: '1px solid #3A2416',
                      position: 'relative',
                    } : {
                      background: 'rgba(26,16,8,0.3)',
                      border: '1px dashed rgba(58,36,22,0.6)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }),
                  }}
                >
                  {slot ? (
                    <>
                      <img
                        src={slot.img}
                        alt={slot.title}
                        style={{
                          position: 'absolute', inset: 0,
                          width: '100%', height: '100%',
                          objectFit: 'cover',
                          filter: 'brightness(0.75) saturate(0.85)',
                        }}
                      />
                      <div style={{
                        position: 'absolute', inset: 0,
                        background: 'linear-gradient(to top, rgba(10,5,3,0.75) 0%, transparent 60%)',
                      }} />
                      <span style={{
                        position: 'absolute', bottom: 3, left: 4, right: 4,
                        fontSize: 7, color: 'rgba(239,227,206,0.88)',
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        lineHeight: 1.2,
                      }}>
                        {slot.title}
                      </span>
                    </>
                  ) : (
                    <span style={{ fontSize: 12, color: 'rgba(200,82,42,0.4)' }}>+</span>
                  )}
                </div>
              )
            })}
          </div>
        ))}
      </div>

      {/* Mini plan thumbnails */}
      <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
        {PLANS.map((plan, i) => (
          <div key={plan.title} style={{
            flex: 1,
            background: '#1C1209',
            border: '1px solid #3A2416',
            borderRadius: 10,
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '6px 8px',
          }}>
            <div style={{ width: 32, height: 32, borderRadius: 6, overflow: 'hidden', flexShrink: 0, position: 'relative', background: '#241809' }}>
              {plan.images[0] && (
                <img
                  src={i === 0 ? plan.images[thumbIdx] : plan.images[0]}
                  alt={plan.title}
                  style={{
                    position: 'absolute', inset: 0, width: '100%', height: '100%',
                    objectFit: 'cover',
                    filter: 'brightness(0.85)',
                    opacity: i === 0 ? (thumbFade ? 1 : 0) : 1,
                    transition: 'opacity 250ms ease',
                  }}
                />
              )}
            </div>
            <div>
              <div style={{ fontSize: 10, fontWeight: 600, color: '#EFE3CE', lineHeight: 1.3 }}>{plan.title}</div>
              <div style={{ fontSize: 8, color: '#6B4E36', marginTop: 1 }}>{plan.meals}</div>
            </div>
          </div>
        ))}
        <div style={{
          width: 50, flexShrink: 0,
          background: 'rgba(26,16,8,0.3)', border: '1px dashed #3A2416', borderRadius: 10,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 14, color: '#C8522A',
        }}>+</div>
      </div>

      <style>{`
        @keyframes cellFadeIn {
          0%   { opacity: 0; transform: scale(0.88); }
          100% { opacity: 1; transform: scale(1); }
        }
        @keyframes mpCardSnapIn {
          0%   { transform: translateX(30px) scale(0.9); opacity: 0; }
          80%  { transform: translateX(-2px) scale(1.02); opacity: 1; }
          100% { transform: translateX(0) scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  )
}
