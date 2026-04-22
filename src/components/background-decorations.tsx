"use client";

/**
 * BackgroundDecorations
 * ---------------------
 * Fixed decorative layer rendered behind all app content.
 * Uses CSS custom properties (--wc-pal-*) so every decoration
 * automatically updates when the user changes the colour palette.
 *
 * Layers (back → front):
 *   0. SVG repeating cooking-motif tile (herbs, fork, dots) at ~3.5% opacity
 *   1. Top-left warm radial glow
 *   2. Top-right botanical sprig (SVG)
 *   3. Bottom-left herb / leaf cluster (SVG)
 *   4. Bottom-right subtle corner fade
 *   5. Mid-page scattered dot grid (fixed, repeating)
 *   6. Fine diagonal cross-hatch texture
 *   7. Right-edge warm vignette
 *   8. Top-centre brand stripe
 *   9. Horizontal section-divider rules at 33vh / 66vh
 *   10. Noise grain (always on top via body::after in globals.css)
 */
export function BackgroundDecorations() {
  return (
    <div
      aria-hidden="true"
      style={{
        position: "fixed",
        inset: 0,
        pointerEvents: "none",
        zIndex: 0,
        overflow: "hidden",
      }}
    >
      {/* ── 0. SVG repeating cooking-motif tile ────────────────────────────
          Small herb sprigs, a fork silhouette, and dots tiled at 110×110px.
          The motif colour references CSS vars so it updates with the palette.
          Opacity 0.035 — just enough to break up flat colour walls.
      ── */}
      <svg
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
        }}
      >
        <defs>
          <pattern
            id="wc-motif-tile"
            x="0"
            y="0"
            width="110"
            height="110"
            patternUnits="userSpaceOnUse"
          >
            {/* Herb sprig — top-left */}
            <g transform="translate(6,5)" opacity="0.85">
              <line x1="8" y1="20" x2="8" y2="2" stroke="var(--wc-pal-accent,#B07D56)" strokeWidth="1" strokeLinecap="round" />
              <path d="M8 16 Q4 13 2 10" stroke="var(--wc-pal-sage,#828E6F)" strokeWidth="0.9" strokeLinecap="round" fill="none" />
              <path d="M8 16 Q12 13 14 10" stroke="var(--wc-pal-sage,#828E6F)" strokeWidth="0.9" strokeLinecap="round" fill="none" />
              <path d="M8 11 Q4 8 3 5" stroke="var(--wc-pal-sage,#828E6F)" strokeWidth="0.9" strokeLinecap="round" fill="none" />
              <path d="M8 11 Q12 8 13 5" stroke="var(--wc-pal-sage,#828E6F)" strokeWidth="0.9" strokeLinecap="round" fill="none" />
            </g>
            {/* Fork — centre-right */}
            <g transform="translate(76,8)" opacity="0.7">
              <line x1="5" y1="0" x2="5" y2="22" stroke="var(--wc-pal-accent,#B07D56)" strokeWidth="1" strokeLinecap="round" />
              <line x1="3" y1="0" x2="3" y2="7" stroke="var(--wc-pal-accent,#B07D56)" strokeWidth="0.8" strokeLinecap="round" />
              <line x1="7" y1="0" x2="7" y2="7" stroke="var(--wc-pal-accent,#B07D56)" strokeWidth="0.8" strokeLinecap="round" />
            </g>
            {/* Leaf — bottom-left */}
            <g transform="translate(14,72)" opacity="0.75">
              <path d="M4 18 C2 12 0 6 4 2 C6 0 10 1 10 6 C10 12 7 16 4 18Z"
                stroke="var(--wc-pal-sage,#828E6F)" strokeWidth="0.9" fill="none" strokeLinecap="round" />
              <line x1="4" y1="17" x2="4" y2="4" stroke="var(--wc-pal-sage,#828E6F)" strokeWidth="0.6" />
            </g>
            {/* Herb sprig mirrored — bottom-right */}
            <g transform="translate(72,68)" opacity="0.75">
              <line x1="8" y1="20" x2="8" y2="2" stroke="var(--wc-pal-sage,#828E6F)" strokeWidth="1" strokeLinecap="round" />
              <path d="M8 15 Q4 12 2 9" stroke="var(--wc-pal-accent,#B07D56)" strokeWidth="0.9" strokeLinecap="round" fill="none" />
              <path d="M8 15 Q12 12 14 9" stroke="var(--wc-pal-accent,#B07D56)" strokeWidth="0.9" strokeLinecap="round" fill="none" />
            </g>
            {/* Scattered rhythm dots */}
            <circle cx="44" cy="18" r="1.2" fill="var(--wc-pal-sage,#828E6F)" opacity="0.6" />
            <circle cx="92" cy="52" r="1.2" fill="var(--wc-pal-accent,#B07D56)" opacity="0.55" />
            <circle cx="28" cy="50" r="1"   fill="var(--wc-pal-accent,#B07D56)" opacity="0.5" />
            <circle cx="58" cy="88" r="1.2" fill="var(--wc-pal-sage,#828E6F)" opacity="0.55" />
            <circle cx="100" cy="28" r="1"  fill="var(--wc-pal-sage,#828E6F)" opacity="0.45" />
          </pattern>
        </defs>
        <rect
          width="100%"
          height="100%"
          fill="url(#wc-motif-tile)"
          opacity="0.035"
        />
      </svg>

      {/* ── 1. Top-left warm radial glow ── */}
      <div
        style={{
          position: "absolute",
          top: -140,
          left: -140,
          width: 580,
          height: 580,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, color-mix(in srgb, var(--wc-pal-accent) 13%, transparent 87%) 0%, color-mix(in srgb, var(--wc-pal-mid) 7%, transparent 93%) 40%, transparent 68%)",
          transition: "background 0.4s ease",
        }}
      />

      {/* ── 2. Top-right botanical sprig ── */}
      <div
        style={{
          position: "absolute",
          top: -20,
          right: -20,
          width: 320,
          height: 320,
          opacity: 0.18,
          transition: "opacity 0.4s ease",
        }}
      >
        <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: "100%", height: "100%" }}>
          {/* Main stem */}
          <path d="M170 10 Q148 55 126 100 Q104 145 82 190" stroke="var(--wc-pal-sage)" strokeWidth="1.4" strokeLinecap="round" />
          {/* Leaves alternating left/right */}
          <path d="M170 10 Q158 38 136 46 Q152 32 170 10Z" fill="var(--wc-pal-sage)" opacity="0.55" />
          <path d="M152 40 Q140 62 118 68 Q136 54 152 40Z" fill="var(--wc-pal-sage)" opacity="0.45" />
          <path d="M136 68 Q120 88 102 93 Q120 80 136 68Z" fill="var(--wc-pal-sage)" opacity="0.4" />
          <path d="M120 95 Q105 113 86 117 Q104 103 120 95Z" fill="var(--wc-pal-sage)" opacity="0.35" />
          <path d="M104 122 Q90 138 72 141 Q89 127 104 122Z" fill="var(--wc-pal-sage)" opacity="0.3" />
          {/* Small berries/dots */}
          <circle cx="148" cy="33" r="2.5" fill="var(--wc-pal-accent)" opacity="0.45" />
          <circle cx="130" cy="62" r="2" fill="var(--wc-pal-accent)" opacity="0.35" />
          <circle cx="113" cy="90" r="1.8" fill="var(--wc-pal-accent)" opacity="0.3" />
        </svg>
      </div>

      {/* ── 3. Bottom-left herb / leaf cluster ── */}
      <div
        style={{
          position: "absolute",
          bottom: -50,
          left: -30,
          width: 380,
          height: 260,
          opacity: 0.15,
          transition: "opacity 0.4s ease",
        }}
      >
        <svg viewBox="0 0 240 160" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: "100%", height: "100%" }}>
          {/* Ground ellipse shadow */}
          <ellipse cx="90" cy="148" rx="68" ry="18" fill="var(--wc-pal-mid)" opacity="0.25" />
          {/* Main vertical stem */}
          <path d="M90 148 Q88 110 86 80 Q84 60 82 42" stroke="var(--wc-pal-accent)" strokeWidth="1.3" strokeLinecap="round" />
          {/* Left branch */}
          <path d="M86 80 Q70 60 52 52" stroke="var(--wc-pal-sage)" strokeWidth="1.1" strokeLinecap="round" />
          {/* Right branch */}
          <path d="M86 80 Q102 62 118 55" stroke="var(--wc-pal-sage)" strokeWidth="1.1" strokeLinecap="round" />
          {/* Leaves on main stem */}
          <path d="M82 42 Q68 28 50 28 Q68 34 82 42Z" fill="var(--wc-pal-accent)" opacity="0.5" />
          <path d="M82 42 Q96 28 114 30 Q96 36 82 42Z" fill="var(--wc-pal-accent)" opacity="0.45" />
          {/* Leaves on left branch */}
          <path d="M52 52 Q38 40 28 42 Q40 46 52 52Z" fill="var(--wc-pal-sage)" opacity="0.45" />
          <path d="M52 52 Q46 38 38 30 Q44 40 52 52Z" fill="var(--wc-pal-sage)" opacity="0.35" />
          {/* Leaves on right branch */}
          <path d="M118 55 Q130 42 140 44 Q128 48 118 55Z" fill="var(--wc-pal-sage)" opacity="0.45" />
          <path d="M118 55 Q124 40 132 33 Q125 43 118 55Z" fill="var(--wc-pal-sage)" opacity="0.35" />
          {/* Scattered small dots */}
          <circle cx="60" cy="100" r="2" fill="var(--wc-pal-accent)" opacity="0.3" />
          <circle cx="115" cy="95" r="1.5" fill="var(--wc-pal-accent)" opacity="0.25" />
          <circle cx="78" cy="118" r="2.2" fill="var(--wc-pal-sage)" opacity="0.3" />
        </svg>
      </div>

      {/* ── 4. Bottom-right subtle corner accent ── */}
      <div
        style={{
          position: "absolute",
          bottom: -80,
          right: -80,
          width: 420,
          height: 420,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, color-mix(in srgb, var(--wc-pal-sage) 9%, transparent 91%) 0%, transparent 60%)",
          transition: "background 0.4s ease",
        }}
      />

      {/* ── 5. Mid-page diagonal cross-hatch texture ── */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: `
            repeating-linear-gradient(
              135deg,
              transparent,
              transparent 24px,
              color-mix(in srgb, var(--wc-pal-mid) 5%, transparent 95%) 24px,
              color-mix(in srgb, var(--wc-pal-mid) 5%, transparent 95%) 25px
            ),
            repeating-linear-gradient(
              45deg,
              transparent,
              transparent 36px,
              color-mix(in srgb, var(--wc-pal-accent) 3%, transparent 97%) 36px,
              color-mix(in srgb, var(--wc-pal-accent) 3%, transparent 97%) 37px
            )
          `,
          mixBlendMode: "overlay",
          opacity: 0.35,
          transition: "opacity 0.4s ease",
        }}
      />

      {/* ── 6. Scattered dot grid ── */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            "radial-gradient(circle, color-mix(in srgb, var(--wc-pal-mid) 20%, transparent 80%) 1px, transparent 1px)",
          backgroundSize: "32px 32px",
          opacity: 0.18,
          transition: "opacity 0.4s ease",
        }}
      />

      {/* ── 7. Right-edge warm vignette ── */}
      <div
        style={{
          position: "absolute",
          top: 0,
          right: 0,
          width: 240,
          height: "100%",
          background:
            "linear-gradient(to left, color-mix(in srgb, var(--wc-pal-accent) 5%, transparent 95%) 0%, transparent 100%)",
          transition: "background 0.4s ease",
        }}
      />

      {/* ── 8. Top-centre subtle header band ── */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 3,
          background:
            "linear-gradient(to right, transparent, var(--wc-pal-accent), var(--wc-pal-sage), var(--wc-pal-accent), transparent)",
          opacity: 0.35,
          transition: "background 0.4s ease",
        }}
      />

      {/* ── 9. Horizontal section-divider rules at 33vh and 66vh ──────────
          Soft decorative rules that echo the section-of-thirds banding
          on the <main> element. Each rule has a centred accent node.
      ── */}
      {[33, 66].map((vhPct) => (
        <div
          key={vhPct}
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: `${vhPct}vh`,
          }}
        >
          {/* Hairline rule */}
          <div
            style={{
              height: 1,
              background: `linear-gradient(
                to right,
                transparent 0%,
                color-mix(in srgb, var(--wc-pal-accent,#B07D56) 22%, transparent) 20%,
                color-mix(in srgb, var(--wc-pal-accent,#B07D56) 28%, transparent) 50%,
                color-mix(in srgb, var(--wc-pal-accent,#B07D56) 22%, transparent) 80%,
                transparent 100%
              )`,
              opacity: 0.4,
            }}
          />
          {/* Centre diamond node */}
          <div
            style={{
              position: "absolute",
              top: -3,
              left: "50%",
              transform: "translateX(-50%) rotate(45deg)",
              width: 6,
              height: 6,
              background: "var(--wc-pal-accent,#B07D56)",
              opacity: 0.3,
            }}
          />
        </div>
      ))}
    </div>
  );
}
