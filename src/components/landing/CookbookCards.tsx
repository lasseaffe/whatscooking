'use client'

import Link from 'next/link'

// Per-book design data for the 5 curated cookbooks.
// User-created books fall back to the generic card design.
type BookDesign = {
  spineColor: string
  spineTextColor: string
  coverBg: string
  textColor: string
  accentColor: string
  texture: 'ruled' | 'stipple' | 'char' | 'linen' | 'grid'
  motif: string
  titleFont: 'condensed-slab' | 'tall-italic' | 'heavy-caps' | 'wide-roman' | 'giant-num'
  titleSize: number
  subtag: string
}

const BOOK_DESIGNS: Record<string, BookDesign> = {
  'weeknight-wins': {
    spineColor: '#4a2e18', spineTextColor: 'rgba(201,169,110,0.75)',
    coverBg: '#2a1c10', textColor: '#EFE3CE', accentColor: 'rgba(201,169,110,0.55)',
    texture: 'ruled', motif: '— I —',
    titleFont: 'condensed-slab', titleSize: 38, subtag: 'Fast · Reliable · Real',
  },
  'plant-proud': {
    spineColor: '#152418', spineTextColor: 'rgba(140,190,130,0.8)',
    coverBg: '#0e1a10', textColor: '#c8e8c0', accentColor: 'rgba(140,190,130,0.5)',
    texture: 'stipple', motif: '✦  ✦  ✦',
    titleFont: 'tall-italic', titleSize: 32, subtag: 'Vegetable · Forward',
  },
  'fire-smoke': {
    spineColor: '#200a04', spineTextColor: 'rgba(220,100,50,0.8)',
    coverBg: '#100604', textColor: '#EFE3CE', accentColor: 'rgba(220,100,50,0.55)',
    texture: 'char', motif: '— ✦ —',
    titleFont: 'heavy-caps', titleSize: 36, subtag: 'Grill · Char · Braise',
  },
  'sunday-slow-cook': {
    spineColor: '#162030', spineTextColor: 'rgba(140,160,210,0.8)',
    coverBg: '#0e1520', textColor: '#d0d8f0', accentColor: 'rgba(140,160,210,0.5)',
    texture: 'linen', motif: '·  ·  ·  ·  ·',
    titleFont: 'wide-roman', titleSize: 26, subtag: 'Low · Slow · Patient',
  },
  '30-minute-wonders': {
    spineColor: '#b8a888', spineTextColor: 'rgba(42,22,6,0.7)',
    coverBg: '#e8dcc8', textColor: '#2a1206', accentColor: 'rgba(42,22,6,0.45)',
    texture: 'grid', motif: '',
    titleFont: 'giant-num', titleSize: 34, subtag: 'Quick · Smart · Done',
  },
}

function titleToSlug(title: string) {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}

function getTextureCss(texture: BookDesign['texture'], accentColor: string): string {
  switch (texture) {
    case 'ruled':
      return `repeating-linear-gradient(180deg, transparent 0px, transparent 13px, ${accentColor.replace('0.55', '0.07')} 13px, ${accentColor.replace('0.55', '0.07')} 14px)`
    case 'stipple':
      return `radial-gradient(circle, rgba(140,190,130,0.12) 1px, transparent 1px)`
    case 'char':
      return `repeating-linear-gradient(135deg, transparent 0px, transparent 18px, rgba(200,60,20,0.05) 18px, rgba(200,60,20,0.05) 19px)`
    case 'linen':
      return `repeating-linear-gradient(45deg, rgba(140,160,210,0.06) 0px, rgba(140,160,210,0.06) 1px, transparent 1px, transparent 12px), repeating-linear-gradient(-45deg, rgba(140,160,210,0.06) 0px, rgba(140,160,210,0.06) 1px, transparent 1px, transparent 12px)`
    case 'grid':
      return `repeating-linear-gradient(0deg, rgba(42,22,6,0.07) 0px, rgba(42,22,6,0.07) 1px, transparent 1px, transparent 16px), repeating-linear-gradient(90deg, rgba(42,22,6,0.07) 0px, rgba(42,22,6,0.07) 1px, transparent 1px, transparent 16px), repeating-linear-gradient(0deg, rgba(42,22,6,0.03) 0px, rgba(42,22,6,0.03) 1px, transparent 1px, transparent 4px), repeating-linear-gradient(90deg, rgba(42,22,6,0.03) 0px, rgba(42,22,6,0.03) 1px, transparent 1px, transparent 4px)`
  }
}

function getTitleStyle(font: BookDesign['titleFont'], size: number, color: string): React.CSSProperties {
  const base: React.CSSProperties = { color, lineHeight: 0.9, marginBottom: 6 }
  switch (font) {
    case 'condensed-slab':
      return { ...base, fontFamily: 'var(--font-playfair-display, serif)', fontWeight: 900, fontSize: size, letterSpacing: -1, textTransform: 'uppercase' }
    case 'tall-italic':
      return { ...base, fontFamily: 'Georgia, serif', fontStyle: 'italic', fontWeight: 400, fontSize: size, lineHeight: 1.15, letterSpacing: 0 }
    case 'heavy-caps':
      return { ...base, fontFamily: 'var(--font-playfair-display, serif)', fontWeight: 900, fontSize: size, letterSpacing: 2, textTransform: 'uppercase', lineHeight: 0.88 }
    case 'wide-roman':
      return { ...base, fontFamily: 'Georgia, serif', fontWeight: 400, fontSize: size, lineHeight: 1.25, letterSpacing: 1 }
    case 'giant-num':
      return { ...base, fontFamily: 'var(--font-playfair-display, serif)', fontWeight: 900, fontSize: size, letterSpacing: -1, textTransform: 'uppercase', lineHeight: 0.92 }
  }
}

function CuratedCard({ href, title, count, design, volNum }: {
  href: string
  title: string
  count: number
  design: BookDesign
  volNum: number
  coverImageUrl: string | null
}) {
  const textureStyle = getTextureCss(design.texture, design.accentColor)
  const textureSize = design.texture === 'stipple' ? '8px 8px' : undefined
  const titleStyle = getTitleStyle(design.titleFont, design.titleSize, design.textColor)
  const isLight = design.coverBg === '#e8dcc8'
  const volColor = isLight ? 'rgba(42,22,6,0.38)' : design.accentColor
  const subColor = isLight ? 'rgba(42,22,6,0.45)' : design.accentColor
  const countColor = isLight ? 'rgba(42,22,6,0.38)' : design.accentColor.replace('0.5', '0.38').replace('0.55', '0.38')
  const ruleColor = isLight ? 'rgba(42,22,6,0.18)' : design.accentColor.replace('0.5', '0.2').replace('0.55', '0.2')
  const motifColor = isLight ? 'rgba(42,22,6,0.38)' : design.accentColor

  const volLabels = ['Vol. I', 'Vol. II', 'Vol. III', 'Vol. IV', 'Vol. V']

  return (
    <Link
      href={href}
      style={{
        display: 'flex',
        width: 220, height: 300,
        flexShrink: 0,
        scrollSnapAlign: 'start',
        borderRadius: 2,
        overflow: 'hidden',
        textDecoration: 'none',
        transition: 'transform 0.28s ease, box-shadow 0.28s ease',
        background: design.coverBg,
      }}
      onMouseEnter={e => {
        const el = e.currentTarget as HTMLElement
        el.style.transform = 'translateY(-8px) rotate(-1.2deg)'
        el.style.boxShadow = '0 28px 64px rgba(0,0,0,0.75)'
      }}
      onMouseLeave={e => {
        const el = e.currentTarget as HTMLElement
        el.style.transform = ''
        el.style.boxShadow = ''
      }}
    >
      {/* Spine */}
      <div style={{
        width: 20, flexShrink: 0,
        background: design.spineColor,
        position: 'relative',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '10px 0',
        boxShadow: 'inset -1px 0 0 rgba(0,0,0,0.25)',
      }}>
        <span style={{
          fontSize: 7, letterSpacing: 2,
          fontFamily: 'Georgia, serif',
          writingMode: 'vertical-rl',
          whiteSpace: 'nowrap',
          textTransform: 'uppercase',
          color: design.spineTextColor,
        }}>
          {title}
        </span>
      </div>

      {/* Cover */}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        {/* Texture overlay */}
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 1,
          backgroundImage: textureStyle,
          backgroundSize: textureSize,
        }} />

        {/* Ghost "30" for 30-Minute Wonders */}
        {design.titleFont === 'giant-num' && (
          <div style={{
            position: 'absolute', bottom: -24, left: -8, zIndex: 2,
            fontFamily: 'var(--font-playfair-display, serif)', fontWeight: 900,
            fontSize: 200, lineHeight: 1, color: 'rgba(42,22,6,0.07)',
            pointerEvents: 'none', userSelect: 'none', letterSpacing: -8,
          }}>30</div>
        )}

        {/* Char corner scorch for Fire & Smoke */}
        {design.texture === 'char' && (
          <div style={{
            position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 2,
            background: 'radial-gradient(ellipse at 0% 0%, rgba(200,60,20,0.2) 0%, transparent 55%), radial-gradient(ellipse at 100% 100%, rgba(180,40,10,0.18) 0%, transparent 50%)',
          }} />
        )}

        {/* Content */}
        <div style={{
          position: 'absolute', inset: 0, zIndex: 5,
          padding: '20px 16px 16px',
          display: 'flex', flexDirection: 'column',
          alignItems: design.titleFont === 'tall-italic' ? 'center' : 'flex-start',
          textAlign: design.titleFont === 'tall-italic' ? 'center' : 'left',
        }}>
          <div style={{ fontSize: 7, letterSpacing: 3, textTransform: 'uppercase', color: volColor, marginBottom: 10 }}>
            {volLabels[volNum - 1] ?? `Vol. ${volNum}`}
          </div>

          {/* Typographic motif */}
          {design.motif && (
            <div style={{ fontSize: 10, letterSpacing: 6, color: motifColor, marginBottom: 12 }}>
              {design.motif}
            </div>
          )}

          <div style={titleStyle}>
            {design.titleFont === 'giant-num' ? (
              <>
                <span style={{ fontSize: 72, lineHeight: 0.85, display: 'block' }}>30</span>
                Min<br />Wonders
              </>
            ) : title}
          </div>

          <div style={{ fontSize: 7, letterSpacing: 4, textTransform: 'uppercase', color: subColor, marginTop: 6, marginBottom: 'auto' }}>
            {design.subtag}
          </div>

          <div style={{ height: 1, background: ruleColor, marginBottom: 8, width: '100%' }} />
          <div style={{ fontSize: 7, letterSpacing: 2, textTransform: 'uppercase', color: countColor }}>
            {count} recipes
          </div>
        </div>
      </div>
    </Link>
  )
}

type CookbookCardProps = {
  href: string
  title: string
  count: number
  accent: string
  coverImageUrl: string | null
  volNum?: number
}

export function CookbookCard({ href, title, count, accent, coverImageUrl, volNum = 1 }: CookbookCardProps) {
  const slug = titleToSlug(title)
  const design = BOOK_DESIGNS[slug]

  if (design) {
    return <CuratedCard href={href} title={title} count={count} design={design} volNum={volNum} coverImageUrl={coverImageUrl} />
  }

  // Generic fallback for user-created cookbooks
  return (
    <Link
      href={href}
      style={{
        display: 'flex',
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
        <div style={{ fontFamily: 'var(--font-plus-jakarta-sans), sans-serif', fontSize: 9, letterSpacing: 2, color: accent }}>
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
