'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { MealPlannerDemo } from './feature-demos/MealPlannerDemo'
import { MealSwipeDemo } from './feature-demos/MealSwipeDemo'
import { DiscoverDemo } from './feature-demos/DiscoverDemo'
import { ImportDemo } from './feature-demos/ImportDemo'
import { EventsDemo } from './feature-demos/EventsDemo'
import { PantryDemo } from './feature-demos/PantryDemo'
import { CollabDemo } from './feature-demos/CollabDemo'
import { RecsDemo } from './feature-demos/RecsDemo'

const FEATURES = [
  { num: '01', label: 'AI Meal Planner',       desc: 'A fully personalised weekly meal plan with shopping lists, built around your life.', Demo: MealPlannerDemo, href: '/plans' },
  { num: '02', label: 'Meal Swipe',            desc: "Swipe through recipes. Like what you see, skip what you don't.",                    Demo: MealSwipeDemo,   href: '/discover' },
  { num: '03', label: 'Discover & Trending',   desc: 'Browse trending recipes by cuisine, cooking time, dietary needs, or mood.',          Demo: DiscoverDemo,    href: '/discover' },
  { num: '04', label: 'Social Recipe Import',  desc: 'Spotted something on Instagram or TikTok? Paste the link, get every ingredient.',   Demo: ImportDemo,      href: '/my-recipes/new' },
  { num: '05', label: 'Events & Occasions',    desc: 'Plan the perfect date night, birthday, or dinner party with AI-curated menus.',      Demo: EventsDemo,      href: '/events' },
  { num: '06', label: 'Smart Pantry',          desc: 'Track what you have, get alerts before things expire, zero food waste.',             Demo: PantryDemo,      href: '/pantry' },
  { num: '07', label: 'Collaborative Cooking', desc: 'Plan meals with family or friends in real time.',                                    Demo: CollabDemo,      href: '/plans' },
  { num: '08', label: 'Smart Recommendations', desc: 'The more you cook, the smarter it gets.',                                            Demo: RecsDemo,        href: '/discover' },
] as const

export function FeatureCarousel() {
  const [active, setActive] = useState(0)
  const [transitioning, setTransitioning] = useState(false)

  const goTo = useCallback((idx: number) => {
    if (transitioning || idx === active) return
    setTransitioning(true)
    setTimeout(() => {
      setActive(idx)
      setTransitioning(false)
    }, 200)
  }, [active, transitioning])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).tagName === 'INPUT') return
      if (e.key === 'ArrowRight') goTo(Math.min(active + 1, FEATURES.length - 1))
      if (e.key === 'ArrowLeft') goTo(Math.max(active - 1, 0))
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [active, goTo])

  const { num, label, desc, Demo, href } = FEATURES[active]

  return (
    <section style={{ position: 'relative', minHeight: '90vh', display: 'flex', flexDirection: 'column', background: '#0a0503', borderTop: '1px solid rgba(244,162,97,0.08)' }}>

      {/* slide counter */}
      <div style={{
        position: 'absolute', top: 24, right: 32,
        fontFamily: 'var(--font-geist-mono, monospace)',
        fontSize: 11, letterSpacing: 3,
        color: 'rgba(244,162,97,0.35)',
        pointerEvents: 'none',
      }}>
        {num} / 08
      </div>

      {/* main split */}
      <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>

        {/* LEFT 30% — copy */}
        <div style={{
          width: '30%',
          padding: '64px 40px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          opacity: transitioning ? 0 : 1,
          transform: transitioning ? 'translateY(10px)' : 'translateY(0)',
          transition: 'opacity 200ms ease, transform 200ms ease',
        }}>
          <p style={{
            fontFamily: 'var(--font-geist-mono, monospace)',
            fontSize: 10, letterSpacing: 4,
            color: 'rgba(244,162,97,0.35)',
            textTransform: 'uppercase',
            margin: '0 0 20px',
          }}>
            {num}
          </p>
          <h2 style={{
            fontFamily: 'var(--font-cormorant, serif)',
            fontStyle: 'italic',
            fontSize: 'clamp(22px, 2.5vw, 34px)',
            fontWeight: 400,
            color: 'rgba(239,227,206,0.95)',
            lineHeight: 1.2,
            margin: '0 0 20px',
          }}>
            {label}
          </h2>
          <p style={{
            fontSize: 13,
            color: 'rgba(239,227,206,0.5)',
            lineHeight: 1.8,
            margin: '0 0 32px',
          }}>
            {desc}
          </p>
          <Link href={href} style={{
            fontSize: 10, letterSpacing: 3,
            color: 'rgba(244,162,97,0.8)',
            textDecoration: 'none',
            textTransform: 'uppercase',
          }}>
            Explore →
          </Link>
        </div>

        {/* RIGHT 70% — demo */}
        <div style={{
          width: '70%',
          background: '#100804',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 40,
          opacity: transitioning ? 0 : 1,
          transform: transitioning ? 'scale(0.97)' : 'scale(1)',
          transition: 'opacity 350ms ease, transform 350ms ease',
        }}>
          <Demo />
        </div>
      </div>

      {/* navigation bar */}
      <div style={{
        padding: '20px 40px',
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        borderTop: '1px solid rgba(244,162,97,0.06)',
      }}>
        <button
          onClick={() => goTo(Math.max(active - 1, 0))}
          disabled={active === 0}
          aria-label="Previous feature"
          style={{
            background: 'none',
            border: '1px solid rgba(244,162,97,0.2)',
            color: 'rgba(244,162,97,0.7)',
            width: 32, height: 32,
            borderRadius: 2,
            cursor: active === 0 ? 'default' : 'pointer',
            opacity: active === 0 ? 0.3 : 1,
            fontSize: 14,
            transition: 'opacity 200ms',
          }}
        >
          ←
        </button>

        <div style={{ display: 'flex', gap: 8 }}>
          {FEATURES.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              aria-label={`Go to feature ${i + 1}`}
              style={{
                width: 6, height: 6,
                borderRadius: '50%',
                background: i === active ? '#F4A261' : 'rgba(244,162,97,0.2)',
                border: 'none',
                padding: 0,
                cursor: 'pointer',
                transition: 'background 200ms',
              }}
            />
          ))}
        </div>

        <button
          onClick={() => goTo(Math.min(active + 1, FEATURES.length - 1))}
          disabled={active === FEATURES.length - 1}
          aria-label="Next feature"
          style={{
            background: 'none',
            border: '1px solid rgba(244,162,97,0.2)',
            color: 'rgba(244,162,97,0.7)',
            width: 32, height: 32,
            borderRadius: 2,
            cursor: active === FEATURES.length - 1 ? 'default' : 'pointer',
            opacity: active === FEATURES.length - 1 ? 0.3 : 1,
            fontSize: 14,
            transition: 'opacity 200ms',
          }}
        >
          →
        </button>
      </div>

    </section>
  )
}
