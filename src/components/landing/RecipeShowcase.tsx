'use client'

import { useState } from 'react'
import { ALL_POSTERS } from './poster-configs'
import { RecipePoster } from './RecipePoster'

export function RecipeShowcase() {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null)

  return (
    <section style={{ background: '#0a0503', padding: '80px 0' }}>
      {/* Section header */}
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', padding: '0 40px', marginBottom: 40 }}>
        <h2 style={{
          fontFamily: 'var(--font-cormorant, serif)',
          fontStyle: 'italic',
          fontSize: 'clamp(22px, 3vw, 36px)',
          fontWeight: 400,
          color: 'rgba(239,227,206,0.9)',
          margin: 0,
        }}>
          This month&apos;s editorial
        </h2>
        <span style={{
          fontFamily: 'var(--font-geist-mono, monospace)',
          fontSize: 10,
          letterSpacing: 3,
          color: 'rgba(244,162,97,0.4)',
          textTransform: 'uppercase',
        }}>
          Issue No. 01
        </span>
      </div>

      {/* Horizontal scroll strip */}
      <div
        style={{
          display: 'flex',
          gap: 2,
          overflowX: 'auto',
          padding: '0 40px 24px',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
        }}
      >
        {ALL_POSTERS.map((poster, i) => (
          <div
            key={poster.no}
            onMouseEnter={() => setHoveredIdx(i)}
            onMouseLeave={() => setHoveredIdx(null)}
            style={{
              flexShrink: 0,
              width: hoveredIdx === i ? 'min(420px, 80vw)' : 'min(280px, 70vw)',
              transition: 'width 400ms cubic-bezier(0.4,0,0.2,1)',
              overflow: 'hidden',
              position: 'relative',
            }}
          >
            <RecipePoster config={poster} index={i} />
          </div>
        ))}
      </div>
    </section>
  )
}
