'use client'

import { useState, useEffect, useCallback } from 'react'
import { useIsMobile } from '@/hooks/useIsMobile'
import Link from 'next/link'
import { MealPlannerDemo } from './feature-demos/MealPlannerDemo'
import { MealSwipeDemo } from './feature-demos/MealSwipeDemo'
import { DiscoverDemo } from './feature-demos/DiscoverDemo'
import { ImportDemo } from './feature-demos/ImportDemo'
import { EventsDemo } from './feature-demos/EventsDemo'
import { PantryDemo } from './feature-demos/PantryDemo'
import { CollabDemo } from './feature-demos/CollabDemo'
import { RecsDemo } from './feature-demos/RecsDemo'

// One curated Unsplash image per feature — faint background behind copy panel
const FEATURE_BG_IMAGES = [
  'photo-1504674900247-0877df9cc836', // Meal Planner — food spread
  'photo-1565299585323-38d6b0865b47', // Meal Swipe — Birria
  'photo-1569050467447-ce54b3bbc37d', // Discover — Ramen
  'photo-1540189549336-e6e99c3679fe', // Social Import — Fattoush
  'photo-1555396273-367ea4eb4db5',    // Events — Fire grill
  'photo-1544025162-d76694265947',    // Smart Pantry — Slow cook
  'photo-1555507036-ab1f4038808a',    // Collab — Croissant
  'photo-1565299624946-b28f40a0ae38', // Smart Recs — Pizza
]

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
  const isMobile = useIsMobile()
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
  const bgImageUrl = `https://images.unsplash.com/${FEATURE_BG_IMAGES[active]}?auto=format&fit=crop&w=800&q=60`

  return (
    <section style={{
      position: 'relative',
      minHeight: isMobile ? 'auto' : '90vh',
      display: 'grid',
      gridTemplateColumns: isMobile ? '1fr' : '48px 1fr 55%',
      background: '#0a0503',
      borderTop: '1px solid rgba(244,162,97,0.08)',
    }}>

      {/* ── Side-rail number nav — desktop only ── */}
      {!isMobile && (
        <div style={{
          borderRight: '1px solid rgba(244,162,97,0.08)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          paddingTop: 48,
          gap: 4,
          background: '#08030200',
        }}>
          {FEATURES.map((f, i) => (
            <button
              key={f.num}
              onClick={() => goTo(i)}
              aria-label={`Go to feature ${f.num}`}
              style={{
                background: 'none',
                border: 'none',
                fontFamily: 'var(--font-geist-mono, monospace)',
                fontSize: 10,
                letterSpacing: 1,
                color: i === active ? '#c9a96e' : '#3a2a1a',
                fontWeight: i === active ? 700 : 400,
                cursor: 'pointer',
                padding: '6px 0',
                width: '100%',
                textAlign: 'center',
                transition: 'color 200ms',
              }}
            >
              {f.num}
            </button>
          ))}
        </div>
      )}

      {/* ── Copy panel (+ mobile horizontal nav strip at top) ── */}
      <div style={{
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: isMobile ? 'flex-start' : 'center',
        padding: isMobile ? '28px 20px 24px' : '64px 40px',
        opacity: transitioning ? 0 : 1,
        transform: transitioning ? 'translateY(10px)' : 'translateY(0)',
        transition: 'opacity 200ms ease, transform 200ms ease',
      }}>
        {/* Faint food image behind copy — changes per feature */}
        <div
          aria-hidden
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `url(${bgImageUrl})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            opacity: 0.06,
            pointerEvents: 'none',
            transition: 'background-image 300ms ease',
          }}
        />
        {/* Left-side gradient so text stays readable over the image */}
        <div aria-hidden style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to right, #0a0503 40%, transparent 100%)', pointerEvents: 'none' }} />

        {/* Mobile horizontal number strip */}
        {isMobile && (
          <div style={{ display: 'flex', gap: 6, overflowX: 'auto', marginBottom: 20, paddingBottom: 4 }}>
            {FEATURES.map((f, i) => (
              <button
                key={f.num}
                onClick={() => goTo(i)}
                style={{
                  background: 'none', border: 'none',
                  fontFamily: 'var(--font-geist-mono, monospace)',
                  fontSize: 10, letterSpacing: 1,
                  color: i === active ? '#c9a96e' : 'rgba(244,162,97,0.2)',
                  fontWeight: i === active ? 700 : 400,
                  cursor: 'pointer', padding: '4px 6px', flexShrink: 0,
                  transition: 'color 200ms',
                  borderBottom: i === active ? '1px solid rgba(201,169,110,0.4)' : '1px solid transparent',
                }}
              >
                {f.num}
              </button>
            ))}
          </div>
        )}

        <p style={{
          position: 'relative',
          fontFamily: 'var(--font-geist-mono, monospace)',
          fontSize: 10, letterSpacing: 4,
          color: 'rgba(244,162,97,0.35)',
          textTransform: 'uppercase',
          margin: '0 0 20px',
        }}>
          {num}
        </p>
        <h2 style={{
          position: 'relative',
          fontFamily: 'var(--font-cormorant, serif)',
          fontStyle: 'italic',
          fontSize: 'clamp(24px, 3vw, 32px)',
          fontWeight: 400,
          color: 'rgba(239,227,206,0.95)',
          lineHeight: 1.2,
          margin: '0 0 20px',
        }}>
          {label}
        </h2>
        <p style={{
          position: 'relative',
          fontSize: 13,
          color: 'rgba(239,227,206,0.5)',
          lineHeight: 1.8,
          margin: '0 0 32px',
        }}>
          {desc}
        </p>
        <Link href={href} style={{
          position: 'relative',
          fontSize: 10, letterSpacing: 3,
          color: 'rgba(244,162,97,0.8)',
          textDecoration: 'none',
          textTransform: 'uppercase',
        }}>
          Explore →
        </Link>
      </div>

      {/* ── Demo panel ── */}
      <div style={{
        background: '#100804',
        borderLeft: isMobile ? 'none' : '1px solid rgba(244,162,97,0.06)',
        borderTop: isMobile ? '1px solid rgba(244,162,97,0.06)' : 'none',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: isMobile ? '24px 16px 32px' : 40,
        opacity: transitioning ? 0 : 1,
        transform: transitioning ? 'scale(0.97)' : 'scale(1)',
        transition: 'opacity 350ms ease, transform 350ms ease',
      }}>
        <Demo />
      </div>

    </section>
  )
}
