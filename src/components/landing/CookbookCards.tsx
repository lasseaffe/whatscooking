'use client'

import Link from 'next/link'

type CookbookCardProps = {
  href: string
  title: string
  count: number
  accent: string
  coverImageUrl: string | null
}

export function CookbookCard({ href, title, count, accent, coverImageUrl }: CookbookCardProps) {
  return (
    <Link
      href={href}
      style={{
        display: 'block',
        width: 220, height: 300,
        flexShrink: 0,
        scrollSnapAlign: 'start',
        position: 'relative',
        borderRadius: 4,
        overflow: 'hidden',
        textDecoration: 'none',
        transition: 'transform 0.25s ease, box-shadow 0.25s ease',
        background: coverImageUrl ? '#0d0d0c' : `linear-gradient(145deg, ${accent}55 0%, ${accent}22 100%)`,
      }}
      onMouseEnter={e => {
        const el = e.currentTarget as HTMLElement
        el.style.transform = 'translateY(-6px) scale(1.02)'
        el.style.boxShadow = '0 20px 60px rgba(0,0,0,0.5)'
      }}
      onMouseLeave={e => {
        const el = e.currentTarget as HTMLElement
        el.style.transform = ''
        el.style.boxShadow = ''
      }}
    >
      {coverImageUrl && (
        <img
          src={coverImageUrl}
          alt={title}
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
        />
      )}

      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, height: '40%',
        background: 'rgba(0,0,0,0.75)',
        display: 'flex', flexDirection: 'column',
        justifyContent: 'flex-end', padding: '12px 14px',
      }}>
        <div style={{
          fontFamily: 'var(--font-plus-jakarta-sans), sans-serif',
          fontWeight: 300, fontSize: 11,
          letterSpacing: 2, textTransform: 'uppercase',
          color: 'rgba(245,237,217,0.88)',
          lineHeight: 1.3, marginBottom: 4,
        }}>
          {title}
        </div>
        <div style={{
          fontFamily: 'var(--font-plus-jakarta-sans), sans-serif',
          fontSize: 9, letterSpacing: 2,
          color: accent,
        }}>
          {count} {count === 1 ? 'recipe' : 'recipes'}
        </div>
      </div>
    </Link>
  )
}

export function EmptyCard() {
  return (
    <Link
      href="/cookbooks/new"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
        width: 220, height: 300,
        flexShrink: 0,
        scrollSnapAlign: 'start',
        borderRadius: 4,
        border: '1px dashed rgba(200,146,42,0.30)',
        textDecoration: 'none',
        transition: 'border-color 0.2s',
        background: 'transparent',
      }}
      onMouseEnter={e => ((e.currentTarget as HTMLElement).style.borderColor = 'rgba(200,146,42,0.6)')}
      onMouseLeave={e => ((e.currentTarget as HTMLElement).style.borderColor = 'rgba(200,146,42,0.30)')}
    >
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
        <path d="M12 5v14M5 12h14" stroke="rgba(200,146,42,0.6)" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
      <div style={{
        fontFamily: 'var(--font-plus-jakarta-sans), sans-serif',
        fontWeight: 300, fontSize: 11,
        letterSpacing: 2, textTransform: 'uppercase',
        color: 'rgba(245,237,217,0.38)',
        textAlign: 'center', maxWidth: 140,
      }}>
        Create your first cookbook
      </div>
    </Link>
  )
}
