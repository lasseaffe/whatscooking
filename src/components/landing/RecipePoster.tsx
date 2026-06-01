'use client'

import { useId } from 'react'

export type PosterConfig = {
  no: string
  layout: 'circle-photo' | 'fullbleed-photo' | 'bilingual-columns' | 'fullbleed-strip' | 'diagonal-slash'
  background: string
  titleFont: 'playfair' | 'dm-serif'
  textColor: string
  accentColor: string
  borderHoverColor: string
  washes: string // CSS background value or 'none'
  photoFadeColor: string
  provenance: [string, string]
  provenanceEn?: [string, string]
  recipeName: string[]
  recipeNameFontSize?: string
  subLabel: { text: string; dataEn: string }
  description: string
  ingredients: { text: string; dataEn: string | null }[]
  meta: { label: string; labelEn: string; value: string }[]
  citation: {
    refText: string
    refEn: string | null
    body: string
    source: string
    sourceEn: string
  }
  imageUrl: string
  imageAlt: string
  monogram: React.ReactNode
  dividerOrnament: React.ReactNode
  langClass: 'fr' | 'ar' | 'jp' | 'es' | 'it'
  // circle-photo layout only
  rune?: string
  runeColor?: string
  // bilingual-columns layout only
  bilingualIngredients?: { ar: string; en: string }[]
  bilingualDescription?: { ar: string; en: string }
  // fullbleed-strip layout only
  stripColor?: string
  stripLabel?: string
  // diagonal-slash layout only
  slashColors?: [string, string, string] // [base, mid, accent]
  metaPills?: { label: string; color: string; border: string }[]
  // click destination
  href?: string
}

// ─── Language tooltip CSS ──────────────────────────────────────────────────────
// Shared styles injected once — `.fr`, `.jp`, `.ar`, `.es`, `.it` all share
// the same ::after tooltip behaviour, just with different border colors inherited
// from a CSS variable set on the parent poster element.

const TOOLTIP_STYLE = `
.lang-tooltip {
  position: relative;
  cursor: help;
  border-bottom: 1px dotted var(--poster-accent-border);
}
.lang-tooltip::after {
  content: attr(data-en);
  position: absolute;
  bottom: calc(100% + 5px);
  left: 50%;
  transform: translateX(-50%);
  background: var(--poster-tooltip-bg);
  border: 1px solid var(--poster-accent-border);
  color: var(--poster-tooltip-text);
  padding: 4px 10px;
  font-size: 10px;
  letter-spacing: 1.5px;
  white-space: nowrap;
  border-radius: 2px;
  font-family: var(--font-plus-jakarta-sans), sans-serif;
  font-style: normal;
  text-transform: none;
  z-index: 20;
  pointer-events: none;
  opacity: 0;
  transition: opacity 0.15s;
}
.lang-tooltip:hover::after {
  opacity: 1;
}
@keyframes kenBurns {
  0%   { transform: scale(1.0) translate(0,0); }
  35%  { transform: scale(1.07) translate(-3px,-2px); }
  70%  { transform: scale(1.10) translate(4px,3px); }
  100% { transform: scale(1.0) translate(0,0); }
}
`

let tooltipStyleInjected = false

function ensureTooltipStyle() {
  if (tooltipStyleInjected || typeof document === 'undefined') return
  const el = document.createElement('style')
  el.textContent = TOOLTIP_STYLE
  document.head.appendChild(el)
  tooltipStyleInjected = true
}

// ─── Lang span ────────────────────────────────────────────────────────────────

function L({ text, dataEn }: { text: string; dataEn: string | null }) {
  if (!dataEn) return <span>{text}</span>
  return <span className="lang-tooltip" data-en={dataEn}>{text}</span>
}

// ─── Component ────────────────────────────────────────────────────────────────

export function RecipePoster({ config, index = 0 }: { config: PosterConfig; index?: number }) {
  const uid = useId()

  // Inject tooltip CSS on first client render
  if (typeof window !== 'undefined') ensureTooltipStyle()

  const isCircle = config.layout === 'circle-photo'
  const isDark = config.background.startsWith('#0') || config.background.startsWith('#1') || config.background === '#F0E8D6' ? false : false
  const lightBg = !config.background.startsWith('#0') && !config.background.startsWith('#1')

  // Per-poster CSS variables for tooltip theming
  const cssVars: React.CSSProperties & Record<string, string> = {
    '--poster-accent-border': config.accentColor,
    '--poster-tooltip-bg': lightBg ? 'rgba(30,20,10,0.96)' : `${config.background}fa`,
    '--poster-tooltip-text': lightBg ? 'rgba(240,230,210,0.92)' : config.textColor,
  }

  const titleFontStyle: React.CSSProperties = config.titleFont === 'playfair'
    ? {
        fontFamily: 'var(--font-playfair-display), serif',
        fontWeight: 900,
        textTransform: 'uppercase' as const,
        letterSpacing: '-1px',
        lineHeight: 0.88,
      }
    : {
        fontFamily: 'var(--font-dm-serif-display), serif',
        fontStyle: 'italic',
        fontWeight: 400,
        letterSpacing: '-1px',
        lineHeight: 0.88,
      }

  const nameFontSize = config.recipeNameFontSize ?? 'clamp(46px,11vw,76px)'

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        maxWidth: 340,
        aspectRatio: '2/3',
        overflow: 'hidden',
        cursor: 'pointer',
        background: config.background,
        border: '1px solid transparent',
        transition: 'border-color 0.3s',
        flexShrink: 0,
        ...cssVars,
      }}
      onMouseEnter={e => ((e.currentTarget as HTMLElement).style.borderColor = config.borderHoverColor)}
      onMouseLeave={e => ((e.currentTarget as HTMLElement).style.borderColor = 'transparent')}
    >
      {/* Monogram background pattern */}
      {config.monogram}

      {/* Atmospheric washes */}
      {config.washes !== 'none' && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: 2,
            pointerEvents: 'none',
            background: config.washes,
          }}
        />
      )}

      {config.layout === 'circle-photo' ? (
        <CirclePhotoLayout config={config} uid={uid} titleFontStyle={titleFontStyle} nameFontSize={nameFontSize} lightBg={lightBg} />
      ) : config.layout === 'bilingual-columns' ? (
        <BilingualColumnsLayout config={config} uid={uid} titleFontStyle={titleFontStyle} nameFontSize={nameFontSize} />
      ) : config.layout === 'fullbleed-strip' ? (
        <FullbleedStripLayout config={config} uid={uid} titleFontStyle={titleFontStyle} nameFontSize={nameFontSize} lightBg={lightBg} />
      ) : config.layout === 'diagonal-slash' ? (
        <DiagonalSlashLayout config={config} uid={uid} titleFontStyle={titleFontStyle} nameFontSize={nameFontSize} />
      ) : (
        <FullbleedPhotoLayout config={config} uid={uid} titleFontStyle={titleFontStyle} nameFontSize={nameFontSize} lightBg={lightBg} />
      )}
    </div>
  )
}

// ─── Circle-photo layout (Carbonara) ─────────────────────────────────────────

function CirclePhotoLayout({
  config, uid, titleFontStyle, nameFontSize, lightBg,
}: {
  config: PosterConfig
  uid: string
  titleFontStyle: React.CSSProperties
  nameFontSize: string
  lightBg: boolean
}) {
  const bg = config.background

  return (
    <>
      {/* Ghost rune letter */}
      {config.rune && (
        <div style={{
          position: 'absolute',
          top: '6%',
          right: '-4%',
          fontSize: 'clamp(200px, 48vw, 340px)',
          fontFamily: 'var(--font-playfair-display), serif',
          fontWeight: 900,
          color: config.runeColor ?? 'rgba(139,37,19,0.055)',
          lineHeight: 1,
          userSelect: 'none',
          pointerEvents: 'none',
          zIndex: 2,
        }}>
          {config.rune}
        </div>
      )}

      {/* Circular photo zone */}
      <div style={{
        position: 'absolute',
        top: '8%',
        left: '50%',
        transform: 'translateX(-50%)',
        width: '68%',
        aspectRatio: '1/1',
        borderRadius: '50%',
        overflow: 'hidden',
        zIndex: 4,
        boxShadow: '0 8px 40px rgba(0,0,0,0.60)',
      }}>
        <img
          src={config.imageUrl}
          alt={config.imageAlt}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: 'center',
            filter: 'saturate(1.05) brightness(0.82)',
            animation: 'kenBurns 22s ease-in-out infinite',
            transformOrigin: 'center',
          }}
          onError={e => {
            const img = e.currentTarget
            img.style.display = 'none'
            ;(img.nextElementSibling as HTMLElement | null)?.style && ((img.nextElementSibling as HTMLElement).style.display = 'flex')
          }}
        />
        <div style={{
          display: 'none', width: '100%', height: '100%',
          background: `linear-gradient(#8B2513, ${bg})`,
          alignItems: 'center', justifyContent: 'center', fontSize: 72,
        }}>🍝</div>
      </div>

      {/* Content */}
      <div style={{
        position: 'absolute', inset: 0, zIndex: 9,
        display: 'flex', flexDirection: 'column', padding: '20px 28px 22px',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{
            fontSize: 7, letterSpacing: 4, textTransform: 'uppercase',
            color: `${config.textColor}ae`, lineHeight: 1.9,
          }}>
            {config.provenance[0]}<br />{config.provenance[1]}
          </div>
          <div style={{
            fontFamily: 'var(--font-cormorant-garamond), serif',
            fontStyle: 'italic', fontSize: 10, color: config.accentColor, letterSpacing: 2,
          }}>
            {config.no}
          </div>
        </div>

        <div style={{ marginTop: 'auto' }}>
          <div style={{ ...titleFontStyle, fontSize: nameFontSize, color: config.textColor }}>
            {config.recipeName.map((line, i) => (
              <div key={i}>{line}</div>
            ))}
          </div>

          {config.dividerOrnament ?? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, margin: '10px 0 8px' }}>
              <div style={{ flex: 1, height: 1, background: config.accentColor }} />
              <div style={{ flex: 1, height: 1, background: config.accentColor }} />
            </div>
          )}

          <PosterBody config={config} lightBg={lightBg} />
        </div>
      </div>
    </>
  )
}

// ─── Full-bleed photo layout (Ramen, Croissant, Fattoush, Birria) ─────────────

function FullbleedPhotoLayout({
  config, uid, titleFontStyle, nameFontSize, lightBg,
}: {
  config: PosterConfig
  uid: string
  titleFontStyle: React.CSSProperties
  nameFontSize: string
  lightBg: boolean
}) {
  return (
    <>
      {/* Photo zone — top 44% */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0,
        height: '44%', zIndex: 3, overflow: 'hidden',
      }}>
        <img
          src={config.imageUrl}
          alt={config.imageAlt}
          style={{
            width: '100%', height: '100%',
            objectFit: 'cover', objectPosition: 'center 38%',
            filter: lightBg ? 'sepia(0.08) saturate(1.1) brightness(0.97)' : 'saturate(1.15) brightness(0.85) contrast(1.04)',
            animation: 'kenBurns 22s ease-in-out infinite',
            transformOrigin: 'center',
          }}
          onError={e => {
            const img = e.currentTarget
            img.style.display = 'none'
            ;(img.nextElementSibling as HTMLElement | null)?.style && ((img.nextElementSibling as HTMLElement).style.display = 'flex')
          }}
        />
        <div style={{
          display: 'none', width: '100%', height: '100%',
          background: `linear-gradient(${config.background}88, ${config.background})`,
          alignItems: 'center', justifyContent: 'center', fontSize: 72,
        }}>🍽️</div>
      </div>

      {/* Photo fade — bleeds photo into card bg */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: '44%',
        zIndex: 4, pointerEvents: 'none',
        background: `linear-gradient(to bottom, transparent 50%, ${config.photoFadeColor}ae 80%, ${config.photoFadeColor} 100%)`,
      }} />

      {/* Editorial double rule */}
      <svg
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', zIndex: 8, pointerEvents: 'none', overflow: 'visible' }}
        viewBox="0 0 340 510"
        preserveAspectRatio="xMidYMid meet"
        xmlns="http://www.w3.org/2000/svg"
      >
        <line x1="22" y1="216" x2="318" y2="216" stroke={config.accentColor} strokeWidth="1.5" />
        <line x1="22" y1="220" x2="318" y2="220" stroke={`${config.accentColor.replace(/[\d.]+\)$/, '0.20)')}`} strokeWidth="0.7" />
      </svg>

      {/* Content */}
      <div style={{
        position: 'absolute', inset: 0, zIndex: 9,
        display: 'flex', flexDirection: 'column', padding: '20px 24px 20px',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{
            fontSize: 7, letterSpacing: 4, textTransform: 'uppercase',
            color: lightBg ? `${config.textColor}ae` : 'rgba(245,232,210,0.68)',
            lineHeight: 1.9, textShadow: '0 1px 6px rgba(0,0,0,0.7)',
          }}>
            <span className="lang-tooltip" data-en={config.provenanceEn?.[0] ?? config.provenance[0]}>
              {config.provenance[0]}
            </span>
            <br />
            <span className="lang-tooltip" data-en={config.provenanceEn?.[1] ?? config.provenance[1]}>
              {config.provenance[1]}
            </span>
          </div>
          <div style={{
            fontFamily: 'var(--font-cormorant-garamond), serif',
            fontStyle: 'italic', fontSize: 10,
            color: lightBg ? `${config.textColor}ae` : config.accentColor,
            letterSpacing: 2,
          }}>
            {config.no}
          </div>
        </div>

        <div style={{ marginTop: 'auto' }}>
          <div style={{ ...titleFontStyle, fontSize: nameFontSize, color: config.textColor }}>
            {config.recipeName.map((line, i) => (
              <div key={i}>{line}</div>
            ))}
          </div>

          {config.dividerOrnament}

          <PosterBody config={config} lightBg={lightBg} />
        </div>
      </div>
    </>
  )
}

// ─── Fullbleed-strip layout (Ramen) ──────────────────────────────────────────
// Identical to fullbleed-photo but with a colored strip down the left edge
// carrying vertical text (recipe number + native name).

function FullbleedStripLayout({
  config, uid, titleFontStyle, nameFontSize, lightBg,
}: {
  config: PosterConfig
  uid: string
  titleFontStyle: React.CSSProperties
  nameFontSize: string
  lightBg: boolean
}) {
  const strip = config.stripColor ?? config.accentColor.replace(/[\d.]+\)$/, '1)')
  const STRIP_W = 14

  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex' }}>
      {/* Left strip */}
      <div style={{
        width: STRIP_W, flexShrink: 0, background: strip, zIndex: 10,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {config.stripLabel && (
          <span style={{
            fontSize: 7, letterSpacing: 2, color: 'rgba(239,227,206,0.7)',
            writingMode: 'vertical-rl', textOrientation: 'mixed',
            whiteSpace: 'nowrap', fontFamily: 'serif',
          }}>
            {config.stripLabel}
          </span>
        )}
      </div>

      {/* Main content area — mirrors FullbleedPhotoLayout */}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        {/* Photo zone — top 44% */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '44%', zIndex: 3, overflow: 'hidden' }}>
          <img
            src={config.imageUrl}
            alt={config.imageAlt}
            style={{
              width: '100%', height: '100%',
              objectFit: 'cover', objectPosition: 'center 38%',
              filter: lightBg ? 'sepia(0.08) saturate(1.1) brightness(0.97)' : 'saturate(1.15) brightness(0.85) contrast(1.04)',
              animation: 'kenBurns 22s ease-in-out infinite',
              transformOrigin: 'center',
            }}
          />
        </div>
        {/* Photo fade */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: '44%',
          zIndex: 4, pointerEvents: 'none',
          background: `linear-gradient(to bottom, transparent 50%, ${config.photoFadeColor}ae 80%, ${config.photoFadeColor} 100%)`,
        }} />
        {/* Editorial double rule */}
        <svg
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', zIndex: 8, pointerEvents: 'none', overflow: 'visible' }}
          viewBox="0 0 326 510"
          preserveAspectRatio="xMidYMid meet"
          xmlns="http://www.w3.org/2000/svg"
        >
          <line x1="8" y1="216" x2="304" y2="216" stroke={config.accentColor} strokeWidth="1.5" />
          <line x1="8" y1="220" x2="304" y2="220" stroke={config.accentColor.replace(/[\d.]+\)$/, '0.20)')} strokeWidth="0.7" />
        </svg>
        {/* Content */}
        <div style={{ position: 'absolute', inset: 0, zIndex: 9, display: 'flex', flexDirection: 'column', padding: '20px 20px 20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ fontSize: 7, letterSpacing: 4, textTransform: 'uppercase', color: 'rgba(245,232,210,0.68)', lineHeight: 1.9, textShadow: '0 1px 6px rgba(0,0,0,0.7)' }}>
              <span className="lang-tooltip" data-en={config.provenanceEn?.[0] ?? config.provenance[0]}>{config.provenance[0]}</span>
              <br />
              <span className="lang-tooltip" data-en={config.provenanceEn?.[1] ?? config.provenance[1]}>{config.provenance[1]}</span>
            </div>
            <div style={{ fontFamily: 'var(--font-cormorant-garamond), serif', fontStyle: 'italic', fontSize: 10, color: config.accentColor, letterSpacing: 2 }}>
              {config.no}
            </div>
          </div>
          <div style={{ marginTop: 'auto' }}>
            <div style={{ ...titleFontStyle, fontSize: nameFontSize, color: config.textColor }}>
              {config.recipeName.map((line, i) => <div key={i}>{line}</div>)}
            </div>
            {config.dividerOrnament}
            <PosterBody config={config} lightBg={lightBg} />
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Diagonal-slash layout (Birria) ──────────────────────────────────────────
// Photo clipped to bottom-right triangle via clip-path. Multi-color diagonal
// SVG lines cut across the card. Text floats top-left. Colored meta pills bottom.

function DiagonalSlashLayout({
  config, uid, titleFontStyle, nameFontSize,
}: {
  config: PosterConfig
  uid: string
  titleFontStyle: React.CSSProperties
  nameFontSize: string
}) {
  const [slashBase, slashMid, slashAccent] = config.slashColors ?? [
    'rgba(180,30,10,0.6)',
    'rgba(232,100,10,0.45)',
    'rgba(212,160,42,0.3)',
  ]

  return (
    <>
      {/* Photo — clipped to bottom-right triangle */}
      <div style={{
        position: 'absolute', inset: 0, overflow: 'hidden',
        clipPath: 'polygon(40% 54%, 100% 0%, 100% 100%, 0% 100%)',
        zIndex: 3,
      }}>
        <img
          src={config.imageUrl}
          alt={config.imageAlt}
          style={{
            width: '100%', height: '100%',
            objectFit: 'cover', objectPosition: 'center',
            filter: 'brightness(0.62) saturate(1.2)',
            animation: 'kenBurns 22s ease-in-out infinite',
            transformOrigin: 'center',
          }}
        />
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(135deg, rgba(30,10,2,0.5) 20%, transparent 60%)',
        }} />
      </div>

      {/* Multi-color diagonal slash lines */}
      <svg
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', zIndex: 6, pointerEvents: 'none', overflow: 'visible' }}
        viewBox="0 0 340 510"
        preserveAspectRatio="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Faint shadow echo */}
        <line x1="132" y1="275" x2="340" y2="0" stroke={slashBase.replace(/[\d.]+\)$/, '0.12)')} strokeWidth="4" />
        {/* Base line — chile red */}
        <line x1="136" y1="275" x2="344" y2="0" stroke={slashBase} strokeWidth="1.5" />
        {/* Mid line — ember */}
        <line x1="141" y1="275" x2="349" y2="0" stroke={slashMid} strokeWidth="1" />
        {/* Accent line — gold */}
        <line x1="147" y1="275" x2="355" y2="0" stroke={slashAccent} strokeWidth="0.8" />
        {/* Corner dot — gold */}
        <circle cx="340" cy="2" r="3" fill={slashAccent.replace(/[\d.]+\)$/, '0.6)')} />
        <circle cx="136" cy="275" r="3" fill={slashBase.replace(/[\d.]+\)$/, '0.7)')} />
      </svg>

      {/* Content — top-left 68% wide, 72% tall */}
      <div style={{
        position: 'absolute', top: 0, left: 0, width: '68%', height: '72%',
        zIndex: 9, padding: '20px 16px',
        display: 'flex', flexDirection: 'column',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
          <div style={{ fontSize: 7, letterSpacing: 3, textTransform: 'uppercase', color: config.accentColor, lineHeight: 1.9 }}>
            <span className="lang-tooltip" data-en={config.provenanceEn?.[0] ?? config.provenance[0]}>{config.provenance[0]}</span>
            <br />
            <span className="lang-tooltip" data-en={config.provenanceEn?.[1] ?? config.provenance[1]}>{config.provenance[1]}</span>
          </div>
          <div style={{ fontFamily: 'var(--font-cormorant-garamond), serif', fontStyle: 'italic', fontSize: 10, color: config.accentColor, letterSpacing: 2 }}>
            {config.no}
          </div>
        </div>

        <div style={{ ...titleFontStyle, fontSize: 'clamp(36px,8vw,52px)', color: config.textColor, lineHeight: 0.95, marginBottom: 10 }}>
          {config.recipeName.map((line, i) => <div key={i}>{line}</div>)}
        </div>

        {/* Three-color accent bar */}
        <div style={{ display: 'flex', gap: 3, marginBottom: 8 }}>
          <div style={{ height: 2, width: 24, borderRadius: 1, background: slashBase.replace(/[\d.]+\)$/, '0.9)') }} />
          <div style={{ height: 2, width: 14, borderRadius: 1, background: slashMid.replace(/[\d.]+\)$/, '0.85)') }} />
          <div style={{ height: 2, width: 10, borderRadius: 1, background: slashAccent.replace(/[\d.]+\)$/, '0.8)') }} />
        </div>

        <div style={{ fontSize: 7.5, letterSpacing: 2, textTransform: 'uppercase', color: config.accentColor, marginBottom: 6 }}>
          <L text={config.subLabel.text} dataEn={config.subLabel.dataEn} />
        </div>

        <p style={{
          fontFamily: 'var(--font-cormorant-garamond), serif',
          fontStyle: 'italic', fontSize: 12,
          color: 'rgba(245,232,210,0.42)', lineHeight: 1.65,
        }}>
          {config.description}
        </p>
      </div>

      {/* Meta pills — bottom left */}
      {config.metaPills && (
        <div style={{
          position: 'absolute', bottom: 14, left: 14, zIndex: 9,
          display: 'flex', gap: 6,
        }}>
          {config.metaPills.map((pill, i) => (
            <span key={i} style={{
              fontSize: 7, letterSpacing: 1, padding: '2px 7px', borderRadius: 2,
              background: pill.color, border: `1px solid ${pill.border}`,
              color: pill.border, textTransform: 'uppercase',
            }}>
              {pill.label}
            </span>
          ))}
        </div>
      )}
    </>
  )
}

// ─── Bilingual columns layout (Fattoush) ─────────────────────────────────────
// Photo top 36%, large italic title centered, Arabic RTL column / English LTR column below.

function BilingualColumnsLayout({
  config, uid, titleFontStyle, nameFontSize,
}: {
  config: PosterConfig
  uid: string
  titleFontStyle: React.CSSProperties
  nameFontSize: string
}) {
  const acc = config.accentColor
  const accFaint = acc.replace(/[\d.]+\)$/, '0.18)')
  const accMid   = acc.replace(/[\d.]+\)$/, '0.45)')

  return (
    <>
      {/* Photo — top 36% */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '36%', zIndex: 3, overflow: 'hidden' }}>
        <img
          src={config.imageUrl}
          alt={config.imageAlt}
          style={{
            width: '100%', height: '100%',
            objectFit: 'cover', objectPosition: 'center 40%',
            filter: 'saturate(0.95) brightness(0.78)',
            animation: 'kenBurns 22s ease-in-out infinite',
            transformOrigin: 'center',
          }}
        />
      </div>
      {/* Photo fade */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: '36%',
        zIndex: 4, pointerEvents: 'none',
        background: `linear-gradient(to bottom, transparent 55%, ${config.photoFadeColor}b0 82%, ${config.photoFadeColor} 100%)`,
      }} />

      {/* Header — issue no + Arabic provenance */}
      <div style={{
        position: 'absolute', top: 'calc(36% + 8px)', left: 0, right: 0,
        zIndex: 9, padding: '0 12px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
      }}>
        <span style={{ fontSize: 7, letterSpacing: 3, textTransform: 'uppercase', color: accMid }}>{config.no}</span>
        <span style={{ fontSize: 7, letterSpacing: 1.5, color: acc.replace(/[\d.]+\)$/, '0.5)'), direction: 'rtl' }}>
          {config.provenance[0]}
        </span>
      </div>

      {/* Gold rule */}
      <div style={{
        position: 'absolute', top: 'calc(36% + 24px)', left: 12, right: 12,
        height: 1, zIndex: 9,
        background: `linear-gradient(to right, ${accMid}, ${accFaint})`,
      }} />

      {/* Recipe name — centered, large italic, Arabic above */}
      <div style={{
        position: 'absolute', top: 'calc(36% + 30px)', left: 0, right: 0,
        zIndex: 9, padding: '0 12px', textAlign: 'center',
      }}>
        <div style={{ fontSize: 10, color: acc.replace(/[\d.]+\)$/, '0.4)'), letterSpacing: 1, marginBottom: 2, fontFamily: 'serif', direction: 'rtl' }}>
          {config.provenance[1]}
        </div>
        <div style={{ ...titleFontStyle, fontSize: 'clamp(28px,7vw,36px)', color: config.textColor, lineHeight: 1.0 }}>
          {config.recipeName.join(' ')}
        </div>
        <div style={{ fontSize: 7, letterSpacing: 2.5, textTransform: 'uppercase', color: accMid, marginTop: 4 }}>
          {config.subLabel.dataEn}
        </div>
      </div>

      {/* Gold rule 2 — centered gradient */}
      <div style={{
        position: 'absolute', top: 'calc(36% + 88px)', left: 12, right: 12,
        height: 1, zIndex: 9,
        background: `linear-gradient(to right, ${accFaint}, ${accMid}, ${accFaint})`,
      }} />

      {/* Double column body */}
      <div style={{
        position: 'absolute',
        top: 'calc(36% + 96px)',
        left: 0, right: 0, bottom: 22,
        zIndex: 9,
        display: 'grid',
        gridTemplateColumns: '1fr 1px 1fr',
        padding: '0 10px',
      }}>
        {/* Arabic column — RTL */}
        <div style={{ padding: '0 6px', direction: 'rtl', textAlign: 'right', overflow: 'hidden', display: 'flex', flexDirection: 'column', gap: 4 }}>
          <div style={{ fontSize: 6.5, letterSpacing: 2, textTransform: 'uppercase', color: accMid, direction: 'ltr', textAlign: 'right', marginBottom: 2 }}>
            المكوّنات
          </div>
          {(config.bilingualIngredients ?? []).map((ing, i) => (
            <div key={i} style={{ fontSize: 8, lineHeight: 1.45, color: 'rgba(245,237,219,0.52)', fontFamily: 'serif' }}>
              {ing.ar}
            </div>
          ))}
          {config.bilingualDescription && (
            <div style={{ fontSize: 7.5, lineHeight: 1.5, color: 'rgba(245,237,219,0.32)', marginTop: 4, fontStyle: 'italic', fontFamily: 'serif' }}>
              {config.bilingualDescription.ar}
            </div>
          )}
        </div>

        {/* Divider */}
        <div style={{ background: accFaint, margin: '0 2px' }} />

        {/* English column — LTR */}
        <div style={{ padding: '0 6px', direction: 'ltr', textAlign: 'left', overflow: 'hidden', display: 'flex', flexDirection: 'column', gap: 4 }}>
          <div style={{ fontSize: 6.5, letterSpacing: 2, textTransform: 'uppercase', color: accMid, marginBottom: 2 }}>
            Ingredients
          </div>
          {(config.bilingualIngredients ?? []).map((ing, i) => (
            <div key={i} style={{ fontSize: 7.5, lineHeight: 1.45, color: 'rgba(245,237,219,0.5)', fontFamily: 'var(--font-cormorant-garamond), serif' }}>
              {ing.en}
            </div>
          ))}
          {config.bilingualDescription && (
            <div style={{ fontSize: 7.5, lineHeight: 1.5, color: 'rgba(245,237,219,0.3)', marginTop: 4, fontStyle: 'italic', fontFamily: 'var(--font-cormorant-garamond), serif' }}>
              {config.bilingualDescription.en}
            </div>
          )}
        </div>
      </div>

      {/* Bottom meta strip */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, height: 22,
        zIndex: 9, borderTop: `1px solid ${accFaint}`,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 12px',
      }}>
        {config.meta.map((m, i) => (
          <span key={i} style={{ fontSize: 7, letterSpacing: 1.5, color: accMid, textTransform: 'uppercase' }}>
            {m.value} {m.labelEn}
          </span>
        ))}
      </div>
    </>
  )
}

// ─── Shared body (sub-label → ingredients → meta → citation) ─────────────────

function PosterBody({ config, lightBg }: { config: PosterConfig; lightBg: boolean }) {
  const txt = config.textColor
  const acc = config.accentColor

  return (
    <>
      {/* Sub-label */}
      <div style={{
        fontSize: 7, letterSpacing: 4, textTransform: 'uppercase',
        color: acc, marginBottom: 9,
      }}>
        <L text={config.subLabel.text} dataEn={config.subLabel.dataEn} />
      </div>

      {/* Description */}
      <p style={{
        fontFamily: 'var(--font-cormorant-garamond), serif',
        fontStyle: 'italic', fontSize: 13.5,
        color: lightBg ? `${txt}8a` : 'rgba(245,232,210,0.52)',
        lineHeight: 1.72, marginBottom: 10,
      }}>
        {config.description}
      </p>

      {/* Double rule */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2, marginBottom: 9 }}>
        <div style={{ height: 1, background: `${acc.replace(/[\d.]+\)$/, '0.40)')}` }} />
        <div style={{ width: 44, height: 1, background: `${acc.replace(/[\d.]+\)$/, '0.20)')}` }} />
      </div>

      {/* Ingredients label */}
      <div style={{
        fontSize: 7, letterSpacing: 5, textTransform: 'uppercase',
        color: `${acc.replace(/[\d.]+\)$/, '0.42)')}`, marginBottom: 6,
      }}>
        <L text={config.langClass === 'jp' ? '材料' : config.langClass === 'ar' ? 'المكونات' : config.langClass === 'it' ? 'Ingredienti' : config.langClass === 'fr' ? 'Ingrédients' : 'Ingredientes'} dataEn="Ingredients" />
      </div>

      {/* Ingredients list */}
      <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 3, marginBottom: 9 }}>
        {config.ingredients.map((ing, i) => (
          <li key={i} style={{
            fontSize: 8, letterSpacing: 1.5, textTransform: 'uppercase',
            color: lightBg ? `${txt}66` : 'rgba(245,232,210,0.36)',
            display: 'flex', alignItems: 'center', gap: 7,
          }}>
            <span style={{ display: 'block', width: 8, height: 1, background: `${acc.replace(/[\d.]+\)$/, '0.45)')}`, flexShrink: 0 }} />
            <L text={ing.text} dataEn={ing.dataEn} />
          </li>
        ))}
      </ul>

      {/* Meta row */}
      <div style={{ display: 'flex', gap: 18, marginBottom: 9 }}>
        {config.meta.map((m, i) => (
          <div key={i} style={{ fontSize: 8, letterSpacing: 3, textTransform: 'uppercase', color: lightBg ? `${txt}4a` : 'rgba(245,232,210,0.28)' }}>
            <L text={m.label} dataEn={m.labelEn} />{' '}
            <span style={{ color: lightBg ? `${txt}99` : 'rgba(245,232,210,0.58)' }}>{m.value}</span>
          </div>
        ))}
      </div>

      {/* Citation block */}
      <div style={{ borderTop: `1px solid ${acc.replace(/[\d.]+\)$/, '0.18)')}`, paddingTop: 7 }}>
        <div style={{ fontSize: 7, letterSpacing: 3, textTransform: 'uppercase', color: acc, marginBottom: 3 }}>
          {config.citation.refEn
            ? <L text={config.citation.refText} dataEn={config.citation.refEn} />
            : config.citation.refText
          }
        </div>
        <div style={{
          fontFamily: 'var(--font-cormorant-garamond), serif',
          fontStyle: 'italic', fontSize: 11,
          color: lightBg ? `${txt}70` : 'rgba(245,232,210,0.40)',
          lineHeight: 1.65,
        }}>
          &quot;{config.citation.body}&quot;
        </div>
        <div style={{ marginTop: 3, fontSize: 7, letterSpacing: 1.5, color: `${acc.replace(/[\d.]+\)$/, '0.28)')}`, textTransform: 'uppercase' }}>
          — <L text={config.citation.source} dataEn={config.citation.sourceEn} />
        </div>
      </div>
    </>
  )
}
