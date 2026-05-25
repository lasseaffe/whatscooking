'use client'

import { useId } from 'react'

export type PosterConfig = {
  no: string
  layout: 'circle-photo' | 'fullbleed-photo'
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

      {isCircle ? (
        <CirclePhotoLayout config={config} uid={uid} titleFontStyle={titleFontStyle} nameFontSize={nameFontSize} lightBg={lightBg} />
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
