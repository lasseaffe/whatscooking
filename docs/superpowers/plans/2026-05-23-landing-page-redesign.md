# Landing Page Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the flat, grey landing page with a cinematic hero (Ken Burns dish photo + parallax scroll strip), in-page swiper with zoom-in entry, always-on animated feature demo cards, palette-reactive backgrounds, and a "Tonight's Edition" header on the discover page.

**Architecture:** The landing page (`src/app/page.tsx`) is a Next.js async server component that fetches a hero recipe and scroll-strip recipes server-side, then passes them to new client components (`HeroSection`, `ScrollStrip`, `SwiperSection`). Feature demo components are pure CSS-animation client components with no external data dependencies. A `useAmbilight` hook samples the dominant hue from scroll-strip images via an offscreen canvas and applies it as a CSS custom property.

**Tech Stack:** Next.js 15 App Router, React 18, TypeScript, Tailwind CSS v4, CSS custom properties, `@keyframes` animations, Supabase SSR client, Jest + Testing Library, `canvas.getImageData` for Ambilight.

---

## File Map

| File | Action | Responsibility |
|---|---|---|
| `src/app/page.tsx` | Rewrite | Server component — fetches hero recipe + strip recipes, composes new sections |
| `src/app/globals.css` | Modify | Palette-reactive `--bg-primary`, new keyframes, remove grey tones |
| `src/components/landing/HeroSection.tsx` | Create | Client component — Ken Burns photo, dish info, CTA, scroll hint |
| `src/components/landing/ScrollStrip.tsx` | Create | Client component — 3-col parallax columns + bleed overlays |
| `src/components/landing/useAmbilight.ts` | Create | Hook — offscreen canvas hue sampling, `--ambilight-color` CSS var |
| `src/components/landing/SwiperSection.tsx` | Create | Client component — zoom-in entry, breathe/glow idle, peek-swipe hover |
| `src/components/landing/feature-demos/MealPlannerDemo.tsx` | Rewrite | 3-phase loop: AI types week → card lifts → drag & drop |
| `src/components/landing/feature-demos/DiscoverDemo.tsx` | Rewrite | Chips marquee + cascading cards + trending leaderboard |
| `src/components/landing/feature-demos/MealSwipeDemo.tsx` | Rewrite | Full like+skip cycle with breathe idle |
| `src/components/landing/feature-demos/ImportDemo.tsx` | Rewrite | URL extract one-by-one + scan line materialise |
| `src/components/landing/feature-demos/EventsDemo.tsx` | Rewrite | 3-course sequence + auto-scaled party view |
| `src/components/landing/feature-demos/PantryDemo.tsx` | Rewrite | Expiry bars + "use soon" alert + recipe match % |
| `src/components/landing/feature-demos/CollabDemo.tsx` | Rewrite | Live cursors + family vote bars |
| `src/components/landing/feature-demos/RecsDemo.tsx` | Rewrite | Because-you-loved + taste profile bars |
| `src/app/(app)/discover/page.tsx` | Modify | Add Tonight's Edition unfold header above existing grid |
| `src/__tests__/landing/HeroSection.test.tsx` | Create | Renders hero recipe data, scroll hint present |
| `src/__tests__/landing/ScrollStrip.test.tsx` | Create | Renders recipe chips, columns present |
| `src/__tests__/landing/SwiperSection.test.tsx` | Create | Renders first card as hero recipe |
| `src/__tests__/landing/useAmbilight.test.ts` | Create | Returns fallback color when canvas unavailable |

---

## Task 1: Palette-reactive background tokens + new keyframes

**Files:**
- Modify: `src/app/globals.css`

- [ ] **Step 1: Replace the grey `--bg-primary` with a palette-reactive value**

Find the existing `--bg-primary` definition in the `:root` block and replace it. Also add the `kenBurns`, `scrollUp`, `breatheGlow`, `peekSwipe`, `zoomSettle`, and `ringDissipate` keyframes at the end of the file.

In `globals.css`, find:
```css
--bg-primary: #121211;
```
Replace with:
```css
--bg-primary: color-mix(in srgb, var(--wc-pal-accent, #B07040) 4%, #0a0503);
```

Then append at the very end of `globals.css`:
```css
/* ── Landing page keyframes ── */
@keyframes kenBurns {
  0%   { transform: scale(1.08) translate(0, 0); }
  100% { transform: scale(1.14) translate(-2%, -1.5%); }
}
@keyframes scrollUp {
  0%   { transform: translateY(0); }
  100% { transform: translateY(-50%); }
}
@keyframes breatheScale {
  0%, 100% { transform: scale(1); }
  50%       { transform: scale(1.025); }
}
@keyframes glowPulse {
  0%, 100% { opacity: 0.4; }
  50%       { opacity: 1; }
}
@keyframes peekRight {
  0%, 60%, 100% { transform: translateX(0) rotate(0deg); }
  75%            { transform: translateX(14px) rotate(4deg); opacity: 0.7; }
  85%            { transform: translateX(0) rotate(0deg); }
}
@keyframes arrowHint {
  0%, 60%     { opacity: 0; transform: translateX(-4px); }
  75%          { opacity: 0.7; transform: translateX(0); }
  90%, 100%   { opacity: 0; }
}
@keyframes zoomSettle {
  0%   { transform: scale(2.5); filter: blur(4px); opacity: 0; }
  40%  { transform: scale(1.02); filter: blur(0); opacity: 1; }
  55%, 100% { transform: scale(1); filter: blur(0); opacity: 1; }
}
@keyframes ringDissipate {
  0%   { transform: scale(2.5); opacity: 0.5; }
  40%  { transform: scale(1); opacity: 0; }
  100% { opacity: 0; }
}
@keyframes tonightsEditionUnfold {
  0%         { transform: scaleY(0.02); opacity: 0; }
  60%        { transform: scaleY(1.02); opacity: 1; }
  80%, 100%  { transform: scaleY(1); opacity: 1; }
}
```

- [ ] **Step 2: Commit**
```bash
git add src/app/globals.css
git commit -m "feat(landing): palette-reactive bg token + landing keyframes"
```

---

## Task 2: `useAmbilight` hook

**Files:**
- Create: `src/components/landing/useAmbilight.ts`
- Create: `src/__tests__/landing/useAmbilight.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/__tests__/landing/useAmbilight.test.ts`:
```typescript
import { renderHook, act } from '@testing-library/react';
import { useAmbilight } from '@/components/landing/useAmbilight';

describe('useAmbilight', () => {
  it('returns fallback color when no image is provided', () => {
    const { result } = renderHook(() => useAmbilight(null, true));
    expect(result.current).toBe('rgba(10,5,3,1)');
  });

  it('returns fallback color when disabled', () => {
    const { result } = renderHook(() => useAmbilight('http://example.com/img.jpg', false));
    expect(result.current).toBe('rgba(10,5,3,1)');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**
```bash
cd C:\Users\lasse\Desktop\whatscooking && npx jest useAmbilight --no-coverage
```
Expected: FAIL — module not found.

- [ ] **Step 3: Implement the hook**

Create `src/components/landing/useAmbilight.ts`:
```typescript
'use client';
import { useEffect, useState, useCallback } from 'react';

const FALLBACK = 'rgba(10,5,3,1)';
const SAMPLE_SIZE = 20; // px for downscaled canvas
const DEBOUNCE_MS = 200;

function getDominantColor(img: HTMLImageElement): string {
  try {
    const canvas = document.createElement('canvas');
    canvas.width = SAMPLE_SIZE;
    canvas.height = SAMPLE_SIZE;
    const ctx = canvas.getContext('2d');
    if (!ctx) return FALLBACK;
    ctx.drawImage(img, 0, 0, SAMPLE_SIZE, SAMPLE_SIZE);
    const data = ctx.getImageData(0, 0, SAMPLE_SIZE, SAMPLE_SIZE).data;
    let r = 0, g = 0, b = 0, count = 0;
    for (let i = 0; i < data.length; i += 4) {
      // Skip very dark pixels — they're just background
      if (data[i] + data[i + 1] + data[i + 2] < 30) continue;
      r += data[i]; g += data[i + 1]; b += data[i + 2]; count++;
    }
    if (count === 0) return FALLBACK;
    // Blend heavily toward dark base — subtle warmth shift only
    const br = Math.round(r / count * 0.12 + 10);
    const bg = Math.round(g / count * 0.06 + 5);
    const bb = Math.round(b / count * 0.04 + 3);
    return `rgba(${br},${bg},${bb},1)`;
  } catch {
    return FALLBACK;
  }
}

export function useAmbilight(imageUrl: string | null, enabled: boolean): string {
  const [color, setColor] = useState(FALLBACK);

  const sample = useCallback(() => {
    if (!enabled || !imageUrl) { setColor(FALLBACK); return; }
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => setColor(getDominantColor(img));
    img.onerror = () => setColor(FALLBACK);
    img.src = imageUrl;
  }, [imageUrl, enabled]);

  useEffect(() => {
    const timer = setTimeout(sample, DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [sample]);

  return color;
}
```

- [ ] **Step 4: Run test to verify it passes**
```bash
cd C:\Users\lasse\Desktop\whatscooking && npx jest useAmbilight --no-coverage
```
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**
```bash
git add src/components/landing/useAmbilight.ts src/__tests__/landing/useAmbilight.test.ts
git commit -m "feat(landing): useAmbilight hook — canvas hue sampling"
```

---

## Task 3: `ScrollStrip` component

**Files:**
- Create: `src/components/landing/ScrollStrip.tsx`
- Create: `src/__tests__/landing/ScrollStrip.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `src/__tests__/landing/ScrollStrip.test.tsx`:
```typescript
import { render, screen } from '@testing-library/react';
import { ScrollStrip } from '@/components/landing/ScrollStrip';

const recipes = [
  { id: '1', title: 'Carbonara', image_url: '/img1.jpg' },
  { id: '2', title: 'Tagine', image_url: '/img2.jpg' },
  { id: '3', title: 'Pho Bo', image_url: '/img3.jpg' },
  { id: '4', title: 'Shakshuka', image_url: '/img4.jpg' },
  { id: '5', title: 'Ramen', image_url: '/img5.jpg' },
  { id: '6', title: 'Butter Chicken', image_url: '/img6.jpg' },
];

describe('ScrollStrip', () => {
  it('renders all recipe titles', () => {
    render(<ScrollStrip recipes={recipes} onImageVisible={() => {}} />);
    expect(screen.getAllByText('Carbonara').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Tagine').length).toBeGreaterThan(0);
  });

  it('renders three columns', () => {
    const { container } = render(<ScrollStrip recipes={recipes} onImageVisible={() => {}} />);
    expect(container.querySelectorAll('[data-col]').length).toBe(3);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**
```bash
cd C:\Users\lasse\Desktop\whatscooking && npx jest ScrollStrip --no-coverage
```
Expected: FAIL — module not found.

- [ ] **Step 3: Implement the component**

Create `src/components/landing/ScrollStrip.tsx`:
```typescript
'use client';
import { useRef, useEffect } from 'react';

interface Recipe {
  id: string;
  title: string;
  image_url: string | null;
}

interface ScrollStripProps {
  recipes: Recipe[];
  onImageVisible: (imageUrl: string) => void;
}

// Distribute recipes across 3 columns, doubled for seamless loop
function buildColumns(recipes: Recipe[]): Recipe[][] {
  const cols: Recipe[][] = [[], [], []];
  recipes.forEach((r, i) => cols[i % 3].push(r));
  // Double each column for seamless CSS loop
  return cols.map(col => [...col, ...col]);
}

const COL_DURATIONS = ['18s', '22s', '16s'];
const COL_DELAYS = ['0s', '-6s', '-10s'];

export function ScrollStrip({ recipes, onImageVisible }: ScrollStripProps) {
  const cols = buildColumns(recipes);
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        const visible = entries.find(e => e.isIntersecting);
        if (visible) {
          const img = visible.target as HTMLElement;
          const url = img.dataset.imageUrl;
          if (url) onImageVisible(url);
        }
      },
      { threshold: 0.5 }
    );
    const imgs = document.querySelectorAll('[data-image-url]');
    imgs.forEach(img => observerRef.current?.observe(img));
    return () => observerRef.current?.disconnect();
  }, [onImageVisible]);

  return (
    <>
      {/* Ambient glow — wide, bleeds left across hero */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ zIndex: 4, background: 'linear-gradient(90deg, transparent 0%, transparent 40%, rgba(10,5,3,0.02) 52%, rgba(10,5,3,0.08) 62%, rgba(10,5,3,0.20) 70%, rgba(10,5,3,0.42) 78%, rgba(10,5,3,0.68) 86%, rgba(10,5,3,0.88) 93%, rgba(10,5,3,1.00) 100%)' }}
      />
      {/* Top/bottom feathered fade — sibling, never clips columns */}
      <div
        className="absolute right-0 top-0 bottom-0 pointer-events-none"
        style={{ width: 240, zIndex: 7, background: 'linear-gradient(180deg, rgba(10,5,3,0.97) 0%, rgba(10,5,3,0.3) 9%, transparent 20%, transparent 80%, rgba(10,5,3,0.3) 91%, rgba(10,5,3,0.97) 100%)' }}
      />
      {/* The 3 scroll columns */}
      <div
        className="absolute right-0 top-0 bottom-0 flex gap-1.5 pointer-events-none"
        style={{ width: 240, zIndex: 5, padding: '0 12px 0 0', overflow: 'visible' }}
      >
        {cols.map((col, colIdx) => (
          <div key={colIdx} data-col={colIdx} className="flex-1 flex flex-col gap-1.5">
            <div
              className="flex flex-col gap-1.5"
              style={{
                animation: `scrollUp ${COL_DURATIONS[colIdx]} linear infinite`,
                animationDelay: COL_DELAYS[colIdx],
              }}
            >
              {col.map((recipe, i) => (
                <div
                  key={`${recipe.id}-${i}`}
                  data-image-url={recipe.image_url ?? ''}
                  className="rounded-md overflow-hidden flex-shrink-0 relative"
                  style={{ aspectRatio: '3/4' }}
                >
                  {recipe.image_url ? (
                    <img
                      src={recipe.image_url}
                      alt={recipe.title}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full" style={{ background: 'linear-gradient(160deg,#2a1206,#0d0604)' }} />
                  )}
                  {/* Bottom fade + name */}
                  <div className="absolute inset-0" style={{ background: 'linear-gradient(transparent 50%, rgba(0,0,0,0.75) 100%)' }} />
                  <span className="absolute bottom-1.5 left-2 text-[9px] leading-tight" style={{ color: 'rgba(239,227,206,0.85)', textShadow: '0 1px 4px rgba(0,0,0,0.8)', zIndex: 2 }}>
                    {recipe.title}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**
```bash
cd C:\Users\lasse\Desktop\whatscooking && npx jest ScrollStrip --no-coverage
```
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**
```bash
git add src/components/landing/ScrollStrip.tsx src/__tests__/landing/ScrollStrip.test.tsx
git commit -m "feat(landing): ScrollStrip — 3-col parallax recipe columns"
```

---

## Task 4: `HeroSection` component

**Files:**
- Create: `src/components/landing/HeroSection.tsx`
- Create: `src/__tests__/landing/HeroSection.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `src/__tests__/landing/HeroSection.test.tsx`:
```typescript
import { render, screen } from '@testing-library/react';
import { HeroSection } from '@/components/landing/HeroSection';

const heroRecipe = {
  id: 'abc',
  title: 'Spaghetti Carbonara',
  image_url: '/img.jpg',
  cuisine_type: 'Italian',
  cook_time_minutes: 25,
  calories: 480,
};

const stripRecipes = [
  { id: '1', title: 'Tagine', image_url: '/t.jpg' },
  { id: '2', title: 'Ramen', image_url: '/r.jpg' },
];

describe('HeroSection', () => {
  it('renders the hero dish title', () => {
    render(<HeroSection heroRecipe={heroRecipe} stripRecipes={stripRecipes} />);
    expect(screen.getByText('Spaghetti Carbonara')).toBeInTheDocument();
  });

  it('renders GET STARTED CTA', () => {
    render(<HeroSection heroRecipe={heroRecipe} stripRecipes={stripRecipes} />);
    expect(screen.getByText('GET STARTED')).toBeInTheDocument();
  });

  it('renders scroll hint', () => {
    render(<HeroSection heroRecipe={heroRecipe} stripRecipes={stripRecipes} />);
    expect(screen.getByText('SWIPE TONIGHT\'S DINNER')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**
```bash
cd C:\Users\lasse\Desktop\whatscooking && npx jest HeroSection --no-coverage
```
Expected: FAIL — module not found.

- [ ] **Step 3: Implement the component**

Create `src/components/landing/HeroSection.tsx`:
```typescript
'use client';
import { useRef, useCallback } from 'react';
import Link from 'next/link';
import { ScrollStrip } from './ScrollStrip';
import { useAmbilight } from './useAmbilight';

interface HeroRecipe {
  id: string;
  title: string;
  image_url: string | null;
  cuisine_type: string | null;
  cook_time_minutes: number | null;
  calories: number | null;
}

interface HeroSectionProps {
  heroRecipe: HeroRecipe;
  stripRecipes: { id: string; title: string; image_url: string | null }[];
}

export function HeroSection({ heroRecipe, stripRecipes }: HeroSectionProps) {
  const swiperRef = useRef<HTMLElement | null>(null);
  const ambilightColor = useAmbilight(heroRecipe.image_url, true);

  const handleScrollToSwiper = useCallback(() => {
    const el = document.getElementById('swiper-section');
    el?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  const meta = [
    heroRecipe.cuisine_type?.toUpperCase(),
    heroRecipe.cook_time_minutes ? `${heroRecipe.cook_time_minutes} MIN` : null,
    heroRecipe.calories ? `${heroRecipe.calories} KCAL` : null,
  ].filter(Boolean).join(' · ');

  return (
    <section
      className="relative w-full"
      style={{ height: '100svh', minHeight: 600, overflow: 'clip', background: ambilightColor }}
    >
      {/* Ken Burns background image */}
      {heroRecipe.image_url && (
        <div
          className="absolute pointer-events-none"
          style={{ inset: '-5%', animation: 'kenBurns 8s ease-in-out infinite alternate' }}
        >
          <img
            src={heroRecipe.image_url}
            alt={heroRecipe.title}
            className="w-full h-full object-cover"
            priority-fetch="high"
          />
        </div>
      )}

      {/* Vignette: heavy on right where strip lives, lighter on left */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ zIndex: 3, background: 'radial-gradient(ellipse 120% 100% at 35% 50%, transparent 30%, rgba(0,0,0,0.5) 80%, rgba(0,0,0,0.85) 100%)' }}
      />

      {/* Scroll strip (B) — positioned here as sibling overlays */}
      <ScrollStrip stripRecipes={stripRecipes} onImageVisible={() => {}} />

      {/* Dish info — bottom left */}
      <div
        className="absolute"
        style={{ left: '6%', bottom: '28%', zIndex: 6, animation: 'fadeInUp 0.8s ease-out both' }}
      >
        <p style={{ fontSize: 10, letterSpacing: 5, color: 'rgba(244,162,97,0.6)', marginBottom: 10, textTransform: 'uppercase' }}>
          Tonight&apos;s Recommendation
        </p>
        <h1
          style={{ fontSize: 'clamp(32px,5vw,60px)', fontStyle: 'italic', fontWeight: 400, lineHeight: 1.1, color: 'rgba(239,227,206,0.95)', textShadow: '0 4px 32px rgba(0,0,0,0.7)' }}
        >
          {heroRecipe.title}
        </h1>
        {meta && (
          <p style={{ marginTop: 12, fontSize: 11, letterSpacing: 3, color: 'rgba(244,162,97,0.5)' }}>
            {meta}
          </p>
        )}
      </div>

      {/* CTAs */}
      <div
        className="absolute flex gap-3 items-center"
        style={{ left: '6%', bottom: '14%', zIndex: 6, animation: 'fadeInUp 0.8s ease-out 0.3s both' }}
      >
        <Link
          href="/auth/signup"
          className="inline-block"
          style={{ background: '#8B2635', color: 'rgba(239,227,206,0.95)', border: 'none', padding: '14px 28px', fontSize: 12, letterSpacing: 3, borderRadius: 2, textTransform: 'uppercase', fontFamily: 'inherit' }}
        >
          Get Started
        </Link>
        <button
          onClick={handleScrollToSwiper}
          style={{ background: 'transparent', color: 'rgba(239,227,206,0.6)', border: '1px solid rgba(239,227,206,0.2)', padding: '13px 24px', fontSize: 12, letterSpacing: 3, borderRadius: 2, cursor: 'pointer', textTransform: 'uppercase', fontFamily: 'inherit' }}
        >
          Explore Recipes
        </button>
      </div>

      {/* Scroll hint */}
      <button
        onClick={handleScrollToSwiper}
        className="absolute flex flex-col items-center gap-1.5"
        style={{ bottom: '4%', left: '50%', transform: 'translateX(-50%)', zIndex: 6, background: 'none', border: 'none', cursor: 'pointer', animation: 'fadeInUp 0.8s ease-out 0.6s both' }}
      >
        <span style={{ fontSize: 9, letterSpacing: 4, color: 'rgba(239,227,206,0.35)', textTransform: 'uppercase' }}>
          Swipe Tonight&apos;s Dinner
        </span>
        <div style={{ width: 20, height: 20, borderRight: '1px solid rgba(239,227,206,0.3)', borderBottom: '1px solid rgba(239,227,206,0.3)', transform: 'rotate(45deg)', animation: 'arrowBounce 1.5s ease-in-out infinite' }} />
      </button>

      {/* Thin bottom rule */}
      <div className="absolute bottom-0 left-0 right-0" style={{ height: 1, background: 'linear-gradient(90deg,transparent,rgba(244,162,97,0.2),transparent)', zIndex: 6 }} />
    </section>
  );
}
```

Also add `arrowBounce` keyframe to `globals.css`:
```css
@keyframes arrowBounce {
  0%, 100% { transform: rotate(45deg) translateY(0); }
  50%       { transform: rotate(45deg) translateY(4px); }
}
```

- [ ] **Step 4: Run test to verify it passes**
```bash
cd C:\Users\lasse\Desktop\whatscooking && npx jest HeroSection --no-coverage
```
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**
```bash
git add src/components/landing/HeroSection.tsx src/__tests__/landing/HeroSection.test.tsx src/app/globals.css
git commit -m "feat(landing): HeroSection — Ken Burns photo, scroll strip, CTAs"
```

---

## Task 5: `SwiperSection` component

**Files:**
- Create: `src/components/landing/SwiperSection.tsx`
- Create: `src/__tests__/landing/SwiperSection.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `src/__tests__/landing/SwiperSection.test.tsx`:
```typescript
import { render, screen } from '@testing-library/react';
import { SwiperSection } from '@/components/landing/SwiperSection';

const heroRecipe = { id: 'hero1', title: 'Lamb Tagine', image_url: '/t.jpg', cuisine_type: 'Moroccan', cook_time_minutes: 45, calories: 520 };
const moreRecipes = [
  { id: '2', title: 'Ramen', image_url: '/r.jpg', cuisine_type: 'Japanese', cook_time_minutes: 30, calories: 400 },
];

describe('SwiperSection', () => {
  it('renders the hero recipe as first card', () => {
    render(<SwiperSection heroRecipe={heroRecipe} moreRecipes={moreRecipes} />);
    expect(screen.getByText('Lamb Tagine')).toBeInTheDocument();
  });

  it('has the correct section id for scroll targeting', () => {
    const { container } = render(<SwiperSection heroRecipe={heroRecipe} moreRecipes={moreRecipes} />);
    expect(container.querySelector('#swiper-section')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**
```bash
cd C:\Users\lasse\Desktop\whatscooking && npx jest SwiperSection --no-coverage
```
Expected: FAIL — module not found.

- [ ] **Step 3: Implement the component**

Create `src/components/landing/SwiperSection.tsx`:
```typescript
'use client';
import { useRef, useEffect, useState } from 'react';

interface SwiperRecipe {
  id: string;
  title: string;
  image_url: string | null;
  cuisine_type: string | null;
  cook_time_minutes: number | null;
  calories: number | null;
}

interface SwiperSectionProps {
  heroRecipe: SwiperRecipe;
  moreRecipes: SwiperRecipe[];
}

export function SwiperSection({ heroRecipe, moreRecipes }: SwiperSectionProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const [entered, setEntered] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  // Zoom-settle entry on scroll into view
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setEntered(true); },
      { threshold: 0.3 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  const meta = [
    heroRecipe.cuisine_type?.toUpperCase(),
    heroRecipe.cook_time_minutes ? `${heroRecipe.cook_time_minutes} MIN` : null,
    heroRecipe.calories ? `${heroRecipe.calories} KCAL` : null,
  ].filter(Boolean).join(' · ');

  return (
    <section
      id="swiper-section"
      ref={sectionRef}
      className="relative flex flex-col items-center justify-center"
      style={{ minHeight: '100vh', background: 'var(--bg-primary)', padding: '80px 24px' }}
    >
      <p style={{ fontSize: 10, letterSpacing: 5, color: 'rgba(244,162,97,0.5)', marginBottom: 20, textTransform: 'uppercase' }}>
        What are you craving?
      </p>
      <h2 style={{ fontSize: 'clamp(28px,4vw,48px)', fontStyle: 'italic', fontWeight: 400, color: 'rgba(239,227,206,0.9)', marginBottom: 48, textAlign: 'center' }}>
        Tonight&apos;s pick
      </h2>

      {/* Card stack */}
      <div
        className="relative"
        style={{ width: 320, height: 440 }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Back cards */}
        <div className="absolute inset-0 rounded-2xl" style={{ transform: 'rotate(-4deg) scale(0.94)', background: 'linear-gradient(160deg,#2a1206,#0d0604)', border: '1px solid rgba(244,162,97,0.1)' }} />
        <div className="absolute inset-0 rounded-2xl" style={{ transform: 'rotate(-1.5deg) scale(0.97)', background: 'linear-gradient(160deg,#331508,#100604)', border: '1px solid rgba(244,162,97,0.15)' }} />

        {/* Breathe + glow idle */}
        <div
          className="absolute rounded-full pointer-events-none"
          style={{ inset: -6, background: 'radial-gradient(ellipse, rgba(139,38,53,0.15), transparent 70%)', animation: entered ? 'glowPulse 4s ease-in-out infinite' : 'none', zIndex: 0 }}
        />

        {/* Front card */}
        <div
          className="absolute inset-0 rounded-2xl overflow-hidden flex flex-col justify-end"
          style={{
            background: 'linear-gradient(160deg,#5a2510,#1a0a04)',
            border: '1px solid rgba(244,162,97,0.25)',
            boxShadow: '0 24px 60px rgba(0,0,0,0.6)',
            animation: entered ? `zoomSettle 0.6s cubic-bezier(0.34,1.56,0.64,1) both, breatheScale 4s ease-in-out ${entered ? '0.6s' : '0s'} infinite` : 'none',
            transform: isHovered ? 'translateX(14px) rotate(4deg)' : undefined,
            transition: isHovered ? 'transform 0.4s ease-out' : 'transform 0.4s ease-in',
            zIndex: 2,
          }}
        >
          {/* Dissipating ring on entry */}
          {entered && (
            <div className="absolute inset-0 rounded-2xl pointer-events-none" style={{ border: '1px solid rgba(244,162,97,0.3)', animation: 'ringDissipate 0.6s ease-out both' }} />
          )}
          {heroRecipe.image_url && (
            <img src={heroRecipe.image_url} alt={heroRecipe.title} className="absolute inset-0 w-full h-full object-cover" />
          )}
          <div className="absolute inset-0" style={{ background: 'linear-gradient(transparent 40%, rgba(0,0,0,0.75) 100%)' }} />
          <div className="relative p-6" style={{ zIndex: 2 }}>
            <h3 style={{ fontSize: 20, fontStyle: 'italic', fontWeight: 400, color: 'rgba(239,227,206,0.95)' }}>{heroRecipe.title}</h3>
            {meta && <p style={{ fontSize: 10, letterSpacing: 2, color: 'rgba(244,162,97,0.6)', marginTop: 6 }}>{meta}</p>}
          </div>
        </div>

        {/* Hover arrow hint */}
        {isHovered && (
          <div className="absolute" style={{ top: '40%', right: -28, fontSize: 18, color: 'rgba(244,162,97,0.6)', animation: 'arrowHint 0.4s ease-out both', zIndex: 10 }}>→</div>
        )}
      </div>

      {/* Action buttons */}
      <div className="flex gap-5 mt-8 items-center">
        {[{ label: '✕', title: 'Skip' }, { label: '🔖', title: 'Save' }, { label: '♥', title: 'Like', accent: true }, { label: 'ℹ', title: 'Info' }].map(({ label, title, accent }) => (
          <button
            key={label}
            title={title}
            className="rounded-full flex items-center justify-center"
            style={{ width: 56, height: 56, fontSize: 22, background: accent ? 'rgba(139,38,53,0.2)' : 'rgba(239,227,206,0.05)', border: `1px solid ${accent ? 'rgba(139,38,53,0.4)' : 'rgba(239,227,206,0.15)'}`, cursor: 'pointer' }}
          >
            {label}
          </button>
        ))}
      </div>
    </section>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**
```bash
cd C:\Users\lasse\Desktop\whatscooking && npx jest SwiperSection --no-coverage
```
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**
```bash
git add src/components/landing/SwiperSection.tsx src/__tests__/landing/SwiperSection.test.tsx
git commit -m "feat(landing): SwiperSection — zoom-settle entry, breathe/glow idle, peek-swipe hover"
```

---

## Task 6: Rewrite all 8 feature demo components

**Files:** All 8 in `src/components/landing/feature-demos/`

Each is a pure CSS-animation component — `'use client'`, no props, no state, inline `<style>` tag with `@keyframes`. Rewrite them all in one commit.

- [ ] **Step 1: Rewrite `MealPlannerDemo.tsx`**

```typescript
'use client';
export function MealPlannerDemo() {
  return (
    <div style={{ width: '100%', maxWidth: 280, margin: '0 auto' }}>
      <style>{`
        @keyframes mpLineReveal { 0%{opacity:0;transform:translateX(-8px)} 15%,72%{opacity:1;transform:translateX(0)} 85%,100%{opacity:0} }
        @keyframes mpCellLift { 0%,45%{transform:translateY(0) scale(1);boxShadow:'none'} 58%{transform:translateY(-8px) scale(1.1);box-shadow:0 4px 12px rgba(0,0,0,0.5)} 72%,100%{transform:translateY(0) scale(1)} }
        @keyframes mpSnapIn { 0%,72%{transform:translateY(-30px) scale(0.8);opacity:0} 82%{transform:translateY(2px) scale(1.05);opacity:1} 90%,100%{transform:translateY(0) scale(1);opacity:1} }
        @keyframes mpBlink { 0%,100%{opacity:1} 50%{opacity:0} }
      `}</style>
      {/* Day headers */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 3, marginBottom: 4 }}>
        {['M','T','W','T','F','S','S'].map((d, i) => (
          <div key={i} style={{ textAlign: 'center', fontSize: 8, letterSpacing: 1, color: 'rgba(244,162,97,0.5)' }}>{d}</div>
        ))}
      </div>
      {/* Day cells */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 3 }}>
        {/* Phase 1: AI types Mon–Thu (staggered reveals) */}
        {[{e:'🍝',d:'0s'},{e:'🥘',d:'0.4s'},{e:'🥗',d:'0.8s'},{e:'🍜',d:'1.2s'}].map(({e,d},i)=>(
          <div key={i} style={{ height: 44, borderRadius: 4, background: 'linear-gradient(160deg,#2a1206,#0d0604)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, animation: `mpLineReveal 6s ease-in-out ${d} infinite` }}>{e}</div>
        ))}
        {/* Phase 2: Wed cell lifts */}
        <div style={{ height: 44, borderRadius: 4, background: 'linear-gradient(160deg,#3a1508,#100504)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, animation: 'mpCellLift 6s ease-in-out 1.6s infinite' }}>🍛</div>
        {/* Phase 3: snap in */}
        <div style={{ height: 44, borderRadius: 4, background: 'linear-gradient(160deg,#1a0a2a,#080314)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, animation: 'mpSnapIn 6s ease-in-out 2s infinite' }}>🥩</div>
        {/* Cursor on last empty slot */}
        <div style={{ height: 44, borderRadius: 4, border: '1px dashed rgba(244,162,97,0.3)', background: 'rgba(244,162,97,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: 'rgba(244,162,97,0.4)' }}>
          <span style={{ animation: 'mpBlink 1s step-end infinite' }}>|</span>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Rewrite `DiscoverDemo.tsx`**

```typescript
'use client';
export function DiscoverDemo() {
  return (
    <div style={{ width: '100%', maxWidth: 260, margin: '0 auto' }}>
      <style>{`
        @keyframes chipScroll { 0%{transform:translateX(0)} 100%{transform:translateX(-50%)} }
        @keyframes ddCardReveal { 0%{opacity:0;transform:scale(0.9) translateY(8px)} 20%,75%{opacity:1;transform:scale(1) translateY(0)} 90%,100%{opacity:0} }
        @keyframes trendIn { 0%{opacity:0;transform:translateX(-6px)} 15%,80%{opacity:1;transform:translateX(0)} 100%{opacity:0} }
      `}</style>
      {/* Chip marquee */}
      <div style={{ overflow: 'hidden', position: 'relative', marginBottom: 8 }}>
        <div style={{ display: 'flex', gap: 6, animation: 'chipScroll 8s linear infinite', whiteSpace: 'nowrap' }}>
          {['🇯🇵 Japanese','🇮🇹 Italian','🇲🇦 Moroccan','🇲🇽 Mexican','🇮🇳 Indian','🇹🇭 Thai','🇯🇵 Japanese','🇮🇹 Italian','🇲🇦 Moroccan','🇲🇽 Mexican'].map((c,i)=>(
            <div key={i} style={{ background: i===0?'rgba(139,38,53,0.3)':'rgba(244,162,97,0.1)', border: `1px solid ${i===0?'rgba(139,38,53,0.5)':'rgba(244,162,97,0.2)'}`, borderRadius: 20, padding: '3px 10px', fontSize: 8, color: 'rgba(239,227,206,0.7)', flexShrink: 0 }}>{c}</div>
          ))}
        </div>
        <div style={{ position: 'absolute', top: 0, bottom: 0, right: 0, width: 40, background: 'linear-gradient(90deg,transparent,var(--bg-primary,#0a0503))' }} />
      </div>
      {/* Recipe cards grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 5, marginBottom: 8 }}>
        {[{e:'🍱',n:'Bento Box',s:'2.4k'},{e:'🍣',n:'Nigiri',s:'1.8k'},{e:'🍜',n:'Ramen',s:'3.1k'},{e:'🥟',n:'Gyoza',s:'1.2k'}].map(({e,n,s},i)=>(
          <div key={i} style={{ height: 60, background: 'linear-gradient(160deg,#2a1206,#0d0604)', borderRadius: 6, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2, animation: `ddCardReveal 4s ease-in-out ${i*0.25}s infinite` }}>
            <span style={{ fontSize: 18 }}>{e}</span>
            <span style={{ fontSize: 7, color: 'rgba(239,227,206,0.6)' }}>{n}</span>
            <span style={{ fontSize: 6, color: 'rgba(244,162,97,0.4)' }}>🔥 {s} saves</span>
          </div>
        ))}
      </div>
      {/* Trending rows */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {[{r:'#1',e:'🥘',n:'Lamb Tagine',s:'847'},{r:'#2',e:'🍜',n:'Pho Bo',s:'612'},{r:'#3',e:'🥗',n:'Fattoush',s:'401'}].map(({r,e,n,s},i)=>(
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, animation: `trendIn 4s ease-in-out ${i*0.35}s infinite` }}>
            <span style={{ fontSize: 9, color: 'rgba(244,162,97,0.7)', width: 14, textAlign: 'right' }}>{r}</span>
            <span style={{ fontSize: 12 }}>{e}</span>
            <span style={{ fontSize: 8, color: 'rgba(239,227,206,0.7)', flex: 1 }}>{n}</span>
            <span style={{ fontSize: 7, color: 'rgba(244,162,97,0.4)' }}>↑ {s}/day</span>
          </div>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Rewrite `MealSwipeDemo.tsx`**

```typescript
'use client';
export function MealSwipeDemo() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <style>{`
        @keyframes msSwipeRight { 0%,10%{transform:translateX(0) rotate(0deg);opacity:1} 35%{transform:translateX(60px) rotate(12deg);opacity:0} 40%{transform:translateX(-5px) rotate(-1deg);opacity:0} 55%,100%{transform:translateX(0) rotate(0deg);opacity:1} }
        @keyframes msSwipeLeft  { 0%,55%{transform:translateX(0) rotate(0deg);opacity:1} 80%{transform:translateX(-60px) rotate(-12deg);opacity:0} 85%{transform:translateX(5px) rotate(1deg);opacity:0} 100%{transform:translateX(0) rotate(0deg);opacity:1} }
        @keyframes msHeartPop   { 0%,10%{opacity:0;transform:scale(0)} 30%{opacity:1;transform:scale(1.3)} 45%,100%{opacity:0} }
        @keyframes msXPop       { 0%,55%{opacity:0;transform:scale(0)} 72%{opacity:1;transform:scale(1.3)} 85%,100%{opacity:0} }
        @keyframes msBreath     { 0%,100%{transform:scale(1)} 50%{transform:scale(1.025)} }
      `}</style>
      <div style={{ position: 'relative', width: 80, height: 110 }}>
        {/* Back cards */}
        <div style={{ position: 'absolute', top: 8, left: 8, width: 70, height: 96, background: 'linear-gradient(160deg,#1a0a2a,#080314)', borderRadius: 8, transform: 'rotate(-3deg)' }} />
        <div style={{ position: 'absolute', top: 4, left: 4, width: 70, height: 96, background: 'linear-gradient(160deg,#2a1206,#0d0604)', borderRadius: 8, transform: 'rotate(-1deg)', animation: 'msBreath 4s ease-in-out infinite' }} />
        {/* Front card — swipes right then left */}
        <div style={{ position: 'absolute', top: 0, left: 0, width: 70, height: 96, background: 'linear-gradient(160deg,#5a2510,#1a0a04)', borderRadius: 8, border: '1px solid rgba(244,162,97,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, animation: 'msSwipeRight 4s ease-in-out infinite' }}>🥘</div>
        {/* Heart */}
        <div style={{ position: 'absolute', top: 10, right: -20, fontSize: 18, color: 'rgba(139,38,53,0.9)', animation: 'msHeartPop 4s ease-in-out infinite' }}>♥</div>
        {/* Second card swipes left */}
        <div style={{ position: 'absolute', top: 0, left: 0, width: 70, height: 96, background: 'linear-gradient(160deg,#0a2a18,#051508)', borderRadius: 8, border: '1px solid rgba(244,162,97,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, animation: 'msSwipeLeft 4s ease-in-out infinite' }}>🥗</div>
        {/* X */}
        <div style={{ position: 'absolute', top: 10, left: -20, fontSize: 18, color: 'rgba(200,80,80,0.8)', animation: 'msXPop 4s ease-in-out infinite' }}>✕</div>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Rewrite `ImportDemo.tsx`**

```typescript
'use client';
export function ImportDemo() {
  return (
    <div style={{ width: '100%', maxWidth: 200, margin: '0 auto' }}>
      <style>{`
        @keyframes impExtract { 0%,35%{opacity:0;transform:translateX(-6px)} 50%,80%{opacity:1;transform:translateX(0)} 95%,100%{opacity:0} }
        @keyframes impScan    { 0%{left:-30%} 100%{left:130%} }
        @keyframes impMat     { 0%,55%{opacity:0;transform:scale(0.95)} 72%,90%{opacity:1;transform:scale(1)} 100%{opacity:0} }
      `}</style>
      {/* URL bar */}
      <div style={{ background: 'rgba(239,227,206,0.05)', border: '1px solid rgba(244,162,97,0.2)', borderRadius: 4, padding: '5px 8px', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
        <span style={{ fontSize: 9, color: 'rgba(244,162,97,0.4)' }}>🔗</span>
        <span style={{ fontSize: 9, color: 'rgba(239,227,206,0.5)' }}>instagram.com/reel/C4x…</span>
      </div>
      {/* Ingredients extracting */}
      {[{n:'Spaghetti 400g',d:'0.8s'},{n:'Guanciale 200g',d:'1.1s'},{n:'Pecorino 100g',d:'1.4s'},{n:'4 egg yolks',d:'1.7s'}].map(({n,d},i)=>(
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3, animation: `impExtract 4s ease-in-out ${d} infinite`, opacity: 0 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'rgba(139,38,53,0.8)', flexShrink: 0 }} />
          <span style={{ fontSize: 8, color: 'rgba(239,227,206,0.6)' }}>{n}</span>
        </div>
      ))}
      {/* Scan + materialise */}
      <div style={{ position: 'relative', height: 4, background: 'rgba(239,227,206,0.05)', borderRadius: 2, overflow: 'hidden', margin: '8px 0' }}>
        <div style={{ position: 'absolute', top: 0, height: '100%', width: '30%', background: 'linear-gradient(90deg,transparent,rgba(244,162,97,0.8),transparent)', animation: 'impScan 2s ease-in-out infinite' }} />
      </div>
      <div style={{ background: 'rgba(139,38,53,0.15)', border: '1px solid rgba(139,38,53,0.3)', borderRadius: 6, padding: '6px 10px', animation: 'impMat 4s ease-in-out 1.5s infinite', opacity: 0 }}>
        <div style={{ fontSize: 9, color: 'rgba(239,227,206,0.85)', fontStyle: 'italic' }}>Carbonara · 25 min</div>
        <div style={{ fontSize: 8, color: 'rgba(244,162,97,0.5)', marginTop: 2 }}>✦ Saved to My Recipes</div>
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Rewrite `EventsDemo.tsx`**

```typescript
'use client';
export function EventsDemo() {
  return (
    <div style={{ width: '100%', maxWidth: 200, margin: '0 auto' }}>
      <style>{`
        @keyframes evCourseReveal { 0%{opacity:0;transform:translateX(-6px)} 20%,60%{opacity:1;transform:translateX(0)} 75%,100%{opacity:0} }
        @keyframes evVoteBar1     { 0%,50%{width:0%} 80%,100%{width:75%} }
        @keyframes evVoteBar2     { 0%,55%{width:0%} 80%,100%{width:25%} }
        @keyframes evWinner       { 0%,70%{opacity:0} 82%,95%{opacity:1} 100%{opacity:0} }
      `}</style>
      {/* Act 1: 3-course */}
      <div style={{ background: 'rgba(244,162,97,0.08)', border: '1px solid rgba(244,162,97,0.2)', borderRadius: 8, padding: '7px 10px', marginBottom: 8 }}>
        <div style={{ fontSize: 8, letterSpacing: 2, color: 'rgba(244,162,97,0.5)', marginBottom: 4 }}>🎉 DATE NIGHT · SAT 24</div>
        {[{l:'STARTER',e:'🥗',n:'Caprese',d:'0s'},{l:'MAIN',e:'🍝',n:'Cacio e Pepe',d:'0.5s'},{l:'DESSERT',e:'🍮',n:'Panna Cotta',d:'1s'}].map(({l,e,n,d})=>(
          <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3, animation: `evCourseReveal 5s ease-in-out ${d} infinite` }}>
            <span style={{ fontSize: 7, color: 'rgba(244,162,97,0.4)', width: 40 }}>{l}</span>
            <span style={{ fontSize: 12 }}>{e}</span>
            <span style={{ fontSize: 9, color: 'rgba(239,227,206,0.6)' }}>{n}</span>
          </div>
        ))}
      </div>
      {/* Act 2: auto-scaled party */}
      <div style={{ fontSize: 8, letterSpacing: 2, color: 'rgba(244,162,97,0.4)', marginBottom: 6 }}>DINNER PARTY · 6 GUESTS</div>
      {[{e:'🥘',n:'Lamb Tagine',b:'evVoteBar1'},{e:'🥗',n:'Fattoush',b:'evVoteBar2'}].map(({e,n,b},i)=>(
        <div key={i} style={{ marginBottom: 5 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
            <span style={{ fontSize: 12 }}>{e}</span>
            <span style={{ fontSize: 9, color: 'rgba(239,227,206,0.7)' }}>{n}</span>
          </div>
          <div style={{ height: 4, background: 'rgba(239,227,206,0.08)', borderRadius: 2, overflow: 'hidden' }}>
            <div style={{ height: '100%', background: 'linear-gradient(90deg,rgba(139,38,53,0.6),rgba(244,162,97,0.6))', borderRadius: 2, width: 0, animation: `${b} 5s ease-in-out infinite` }} />
          </div>
        </div>
      ))}
      <div style={{ fontSize: 8, color: 'rgba(244,162,97,0.6)', animation: 'evWinner 5s ease-in-out infinite', opacity: 0 }}>✦ Scaled for 6 automatically</div>
    </div>
  );
}
```

- [ ] **Step 6: Rewrite `PantryDemo.tsx`**

```typescript
'use client';
export function PantryDemo() {
  return (
    <div style={{ width: '100%', maxWidth: 200, margin: '0 auto' }}>
      <style>{`
        @keyframes pantExpiryDrain { 0%,40%{width:15%} 70%{width:5%} 100%{width:15%} }
        @keyframes pantAlertPulse  { 0%,100%{opacity:1} 50%{opacity:0.4} }
        @keyframes pantAlertSlide  { 0%,50%{opacity:0;transform:translateY(4px)} 70%,100%{opacity:1;transform:translateY(0)} }
        @keyframes pantMatchReveal { 0%{opacity:0;transform:translateX(-8px)} 20%,75%{opacity:1;transform:translateX(0)} 90%,100%{opacity:0} }
      `}</style>
      {/* Act 1: expiry bars */}
      {[{e:'🥛',n:'Whole Milk',w:'15%',anim:'pantExpiryDrain',c:'#e74c3c',d:'2d',pulse:true},{e:'🧀',n:'Cheddar',w:'45%',anim:'none',c:'#f39c12',d:'5d',pulse:false},{e:'🥚',n:'Eggs ×6',w:'80%',anim:'none',c:'rgba(139,38,53,0.7)',d:'12d',pulse:false}].map(({e,n,w,anim,c,d,pulse},i)=>(
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
          <span style={{ fontSize: 14 }}>{e}</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 9, color: 'rgba(239,227,206,0.7)' }}>{n}</div>
            <div style={{ height: 4, background: 'rgba(239,227,206,0.1)', borderRadius: 2, marginTop: 3, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: w, background: c, borderRadius: 2, animation: anim !== 'none' ? `${anim} 3s ease-in-out infinite` : undefined }} />
            </div>
          </div>
          <span style={{ fontSize: 8, color: c, animation: pulse ? 'pantAlertPulse 1s ease-in-out infinite' : undefined }}>{d}</span>
        </div>
      ))}
      <div style={{ background: 'rgba(231,76,60,0.12)', border: '1px solid rgba(231,76,60,0.3)', borderRadius: 4, padding: '5px 8px', fontSize: 8, color: 'rgba(231,76,60,0.8)', animation: 'pantAlertSlide 3s ease-in-out infinite', marginBottom: 8 }}>
        ⚠ Use milk soon — 2 recipes match
      </div>
      {/* Act 2: recipe matches */}
      {[{e:'🍳',n:'Shakshuka',m:'5/6',pct:'95%'},{e:'🥚',n:'French Omelette',m:'4/4',pct:'100%'}].map(({e,n,m,pct},i)=>(
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(139,38,53,0.1)', border: '1px solid rgba(139,38,53,0.2)', borderRadius: 6, padding: '5px 8px', marginBottom: 4, animation: `pantMatchReveal 4s ease-in-out ${i*0.4}s infinite` }}>
          <span style={{ fontSize: 16 }}>{e}</span>
          <div>
            <div style={{ fontSize: 9, color: 'rgba(239,227,206,0.8)' }}>{n}</div>
            <div style={{ fontSize: 7, color: 'rgba(244,162,97,0.5)' }}>You have {m} ingredients</div>
          </div>
          <div style={{ marginLeft: 'auto', fontSize: 8, color: 'rgba(139,38,53,0.8)', fontWeight: 'bold' }}>{pct}</div>
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 7: Rewrite `CollabDemo.tsx`**

```typescript
'use client';
export function CollabDemo() {
  return (
    <div style={{ width: '100%', maxWidth: 200, margin: '0 auto' }}>
      <style>{`
        @keyframes collCursor1  { 0%,100%{transform:translateX(0)} 50%{transform:translateX(4px)} }
        @keyframes collCursor2  { 0%,100%{transform:translateX(0)} 50%{transform:translateX(-4px)} }
        @keyframes collLabel    { 0%,30%{opacity:0} 50%,80%{opacity:1} 100%{opacity:0} }
        @keyframes collVoteBar1 { 0%,40%{width:0%} 70%,100%{width:75%} }
        @keyframes collVoteBar2 { 0%,45%{width:0%} 70%,100%{width:25%} }
        @keyframes collWinner   { 0%,65%{opacity:0} 78%,95%{opacity:1} 100%{opacity:0} }
      `}</style>
      {/* Act 1: live cursors */}
      <div style={{ fontSize: 8, letterSpacing: 2, color: 'rgba(244,162,97,0.4)', marginBottom: 6 }}>THURSDAY PLAN · 2 EDITING</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 3, marginBottom: 6 }}>
        {[{e:'🍝'},{e:'🥗'},{e:'🍜',contested:true},{e:'🥘'}].map(({e,contested},i)=>(
          <div key={i} style={{ height: 40, borderRadius: 4, background: contested ? 'rgba(244,162,97,0.06)' : 'linear-gradient(160deg,#2a1206,#0d0604)', border: contested ? '1px solid rgba(244,162,97,0.4)' : 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, position: 'relative' }}>
            {e}
            {contested && <>
              <div style={{ position: 'absolute', top: -8, left: 2, width: 12, height: 12, borderRadius: '50%', background: '#8B2635', border: '1px solid rgba(239,227,206,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 6, animation: 'collCursor1 2s ease-in-out infinite' }}>L</div>
              <div style={{ position: 'absolute', top: -8, right: 2, width: 12, height: 12, borderRadius: '50%', background: '#2d6b3e', border: '1px solid rgba(239,227,206,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 6, animation: 'collCursor2 2s ease-in-out infinite' }}>S</div>
            </>}
          </div>
        ))}
      </div>
      <div style={{ fontSize: 8, color: 'rgba(244,162,97,0.5)', textAlign: 'center', marginBottom: 10, animation: 'collLabel 4s ease-in-out infinite' }}>● Sara is editing Thursday</div>
      {/* Act 2: family vote */}
      <div style={{ fontSize: 8, letterSpacing: 2, color: 'rgba(244,162,97,0.4)', marginBottom: 6 }}>FAMILY VOTE · FRIDAY</div>
      {[{e:'🍕',n:'Pizza Night',b:'collVoteBar1'},{e:'🍜',n:'Ramen',b:'collVoteBar2'}].map(({e,n,b},i)=>(
        <div key={i} style={{ marginBottom: 5 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
            <span style={{ fontSize: 9, color: 'rgba(239,227,206,0.7)' }}>{e} {n}</span>
          </div>
          <div style={{ height: 5, background: 'rgba(239,227,206,0.08)', borderRadius: 2, overflow: 'hidden' }}>
            <div style={{ height: '100%', background: 'rgba(139,38,53,0.6)', borderRadius: 2, width: 0, animation: `${b} 5s ease-in-out infinite` }} />
          </div>
        </div>
      ))}
      <div style={{ fontSize: 8, color: 'rgba(139,38,53,0.7)', animation: 'collWinner 5s ease-in-out infinite', opacity: 0 }}>🏆 Pizza wins Friday!</div>
    </div>
  );
}
```

- [ ] **Step 8: Rewrite `RecsDemo.tsx`**

```typescript
'use client';
export function RecsDemo() {
  return (
    <div style={{ width: '100%', maxWidth: 200, margin: '0 auto' }}>
      <style>{`
        @keyframes recsReveal  { 0%,25%{opacity:0;transform:translateY(5px)} 45%,75%{opacity:1;transform:translateY(0)} 90%,100%{opacity:0} }
        @keyframes recsBarFill { 0%,30%{width:0%} 55%,100%{width:var(--w)} }
        @keyframes recsProfile { 0%,50%{opacity:0} 65%,90%{opacity:1} 100%{opacity:0} }
      `}</style>
      {/* Act 1: because you loved */}
      <div style={{ fontSize: 8, letterSpacing: 2, color: 'rgba(244,162,97,0.4)', marginBottom: 6 }}>BECAUSE YOU LOVED</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(139,38,53,0.1)', borderRadius: 6, padding: '5px 8px', marginBottom: 6 }}>
        <span style={{ fontSize: 16 }}>🥘</span>
        <span style={{ fontSize: 9, color: 'rgba(239,227,206,0.7)' }}>Lamb Tagine ♥</span>
      </div>
      <div style={{ fontSize: 8, color: 'rgba(244,162,97,0.3)', textAlign: 'center', letterSpacing: 1, marginBottom: 6 }}>↓ YOU&apos;LL LOVE</div>
      {[{e:'🫕',n:'Moroccan Harira',stars:4},{e:'🍲',n:'Ras el Hanout Stew',stars:5}].map(({e,n,stars},i)=>(
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4, animation: `recsReveal 5s ease-in-out ${i*0.4}s infinite`, opacity: 0 }}>
          <span style={{ fontSize: 14 }}>{e}</span>
          <span style={{ fontSize: 9, color: 'rgba(239,227,206,0.7)', flex: 1 }}>{n}</span>
          <div style={{ display: 'flex', gap: 1 }}>
            {Array.from({length:5}).map((_,si)=>(
              <div key={si} style={{ width: 5, height: 5, borderRadius: 1, background: si < stars ? 'rgba(139,38,53,0.8)' : 'rgba(139,38,53,0.2)' }} />
            ))}
          </div>
        </div>
      ))}
      {/* Act 2: taste profile */}
      <div style={{ marginTop: 8, fontSize: 8, letterSpacing: 2, color: 'rgba(244,162,97,0.4)', marginBottom: 6 }}>YOUR TASTE PROFILE</div>
      {[{l:'Spicy',w:'80%'},{l:'Comfort',w:'90%'},{l:'Quick',w:'45%'}].map(({l,w},i)=>(
        <div key={i} style={{ marginBottom: 4 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
            <span style={{ fontSize: 8, color: 'rgba(239,227,206,0.5)' }}>{l}</span>
          </div>
          <div style={{ height: 4, background: 'rgba(239,227,206,0.08)', borderRadius: 2, overflow: 'hidden' }}>
            <div style={{ height: '100%', background: 'linear-gradient(90deg,rgba(139,38,53,0.6),rgba(244,162,97,0.6))', borderRadius: 2, animation: `recsBarFill 4s ease-in-out ${i*0.3}s infinite`, ['--w' as string]: w } as React.CSSProperties} />
          </div>
        </div>
      ))}
      <div style={{ fontSize: 8, color: 'rgba(244,162,97,0.5)', animation: 'recsProfile 4s ease-in-out 1s infinite', opacity: 0 }}>✦ 47 recipes matched to you</div>
    </div>
  );
}
```

- [ ] **Step 9: Run full test suite to make sure nothing broke**
```bash
cd C:\Users\lasse\Desktop\whatscooking && npx jest --no-coverage
```
Expected: All pre-existing tests pass. New failures only if any.

- [ ] **Step 10: Commit**
```bash
git add src/components/landing/feature-demos/
git commit -m "feat(landing): rewrite all 8 feature demo components — always-on animations"
```

---

## Task 7: Rewrite `src/app/page.tsx`

**Files:**
- Modify: `src/app/page.tsx`

- [ ] **Step 1: Replace the entire page with the new composition**

The server component fetches a hero recipe (random from top 20 by `like_count`) and strip recipes (30 recipes for the scroll columns). It then renders `HeroSection`, `SwiperSection`, and the bento features grid.

Replace the full contents of `src/app/page.tsx`:

```typescript
import { createClient } from "@/lib/supabase/server";
import { HeroSection } from "@/components/landing/HeroSection";
import { SwiperSection } from "@/components/landing/SwiperSection";
import { MealPlannerDemo } from "@/components/landing/feature-demos/MealPlannerDemo";
import { DiscoverDemo } from "@/components/landing/feature-demos/DiscoverDemo";
import { MealSwipeDemo } from "@/components/landing/feature-demos/MealSwipeDemo";
import { ImportDemo } from "@/components/landing/feature-demos/ImportDemo";
import { EventsDemo } from "@/components/landing/feature-demos/EventsDemo";
import { PantryDemo } from "@/components/landing/feature-demos/PantryDemo";
import { CollabDemo } from "@/components/landing/feature-demos/CollabDemo";
import { RecsDemo } from "@/components/landing/feature-demos/RecsDemo";
import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";

export const dynamic = "force-dynamic";

type Recipe = {
  id: string;
  title: string;
  image_url: string | null;
  cuisine_type: string | null;
  cook_time_minutes: number | null;
  calories: number | null;
};

const FEATURES = [
  { id: 'planner',  label: 'AI Meal Planner',        desc: 'A fully personalised weekly meal plan with shopping lists, built around your life.', Demo: MealPlannerDemo, large: true,  href: '/plans' },
  { id: 'swipe',    label: 'Meal Swipe',              desc: 'Swipe through recipes. Like what you see, skip what you don\'t.',                    Demo: MealSwipeDemo,   large: true,  href: '/discover' },
  { id: 'discover', label: 'Discover & Trending',     desc: 'Browse trending recipes by cuisine, cooking time, dietary needs, or mood.',          Demo: DiscoverDemo,    large: false, href: '/discover' },
  { id: 'import',   label: 'Social Recipe Import',    desc: 'Spotted something on Instagram or TikTok? Paste the link, get every ingredient.',   Demo: ImportDemo,      large: false, href: '/my-recipes/new' },
  { id: 'events',   label: 'Events & Occasions',      desc: 'Plan the perfect date night, birthday, or dinner party with AI-curated menus.',      Demo: EventsDemo,      large: false, href: '/events' },
  { id: 'pantry',   label: 'Smart Pantry',            desc: 'Track what you have, get alerts before things expire, zero food waste.',             Demo: PantryDemo,      large: false, href: '/pantry' },
  { id: 'collab',   label: 'Collaborative Cooking',   desc: 'Plan meals with family or friends in real time.',                                    Demo: CollabDemo,      large: false, href: '/plans' },
  { id: 'recs',     label: 'Smart Recommendations',   desc: 'The more you cook, the smarter it gets.',                                            Demo: RecsDemo,        large: false, href: '/discover' },
] as const;

export default async function LandingPage() {
  const supabase = await createClient();

  // Fetch top-20 recipes by like_count, pick a random one as hero
  const { data: topRecipes } = await supabase
    .from("recipes")
    .select("id, title, image_url, cuisine_type, cook_time_minutes, calories")
    .not("image_url", "is", null)
    .not("image_status", "eq", "bad")
    .order("like_count", { ascending: false })
    .limit(20);

  const heroRecipe: Recipe = topRecipes && topRecipes.length > 0
    ? topRecipes[Math.floor(Math.random() * topRecipes.length)]
    : { id: '', title: 'Tonight\'s Recipe', image_url: null, cuisine_type: null, cook_time_minutes: null, calories: null };

  // Fetch 30 recipes for the scroll strip (exclude hero)
  const { data: stripRecipes } = await supabase
    .from("recipes")
    .select("id, title, image_url")
    .not("image_url", "is", null)
    .not("image_status", "eq", "bad")
    .neq("id", heroRecipe.id)
    .order("like_count", { ascending: false })
    .limit(30);

  // Fetch more recipes for the in-page swiper (personalisation deferred to client)
  const { data: swiperRecipes } = await supabase
    .from("recipes")
    .select("id, title, image_url, cuisine_type, cook_time_minutes, calories")
    .not("image_url", "is", null)
    .not("image_status", "eq", "bad")
    .neq("id", heroRecipe.id)
    .order("like_count", { ascending: false })
    .limit(10);

  return (
    <>
      {/* Fixed header */}
      <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4" style={{ background: 'linear-gradient(rgba(10,5,3,0.8),transparent)', backdropFilter: 'blur(2px)' }}>
        <Link href="/" style={{ fontSize: 13, letterSpacing: 4, color: 'rgba(239,227,206,0.9)', textDecoration: 'none', textTransform: 'uppercase' }}>
          What&apos;s Cooking
        </Link>
        <div className="flex items-center gap-4">
          <ThemeToggle />
          <Link href="/auth/login" style={{ fontSize: 11, letterSpacing: 2, color: 'rgba(239,227,206,0.6)', textDecoration: 'none', textTransform: 'uppercase' }}>Sign in</Link>
          <Link href="/auth/signup" style={{ fontSize: 11, letterSpacing: 2, color: 'rgba(239,227,206,0.9)', textDecoration: 'none', textTransform: 'uppercase', background: '#8B2635', padding: '8px 16px', borderRadius: 2 }}>Get Started</Link>
        </div>
      </header>

      {/* Hero: Ken Burns + Scroll Strip */}
      <HeroSection heroRecipe={heroRecipe} stripRecipes={stripRecipes ?? []} />

      {/* In-page swiper */}
      <SwiperSection heroRecipe={heroRecipe} moreRecipes={swiperRecipes ?? []} />

      {/* Features bento grid */}
      <section style={{ background: 'color-mix(in srgb, var(--wc-pal-accent, #B07040) 6%, #0a0503)', padding: '80px 24px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <p style={{ textAlign: 'center', fontSize: 10, letterSpacing: 5, color: 'rgba(244,162,97,0.5)', marginBottom: 16, textTransform: 'uppercase' }}>What&apos;s inside</p>
          <h2 style={{ textAlign: 'center', fontSize: 'clamp(28px,4vw,48px)', fontStyle: 'italic', fontWeight: 400, color: 'rgba(239,227,206,0.9)', marginBottom: 48 }}>
            Four courses of <span style={{ color: 'var(--wc-accent-saffron,#F4A261)' }}>software</span>
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1, background: 'rgba(244,162,97,0.08)' }}>
            {FEATURES.map(({ id, label, desc, Demo, large, href }) => (
              <Link
                key={id}
                href={href}
                style={{ gridColumn: large ? 'span 1' : undefined, background: 'var(--bg-primary,#0a0503)', padding: 24, textDecoration: 'none', display: 'flex', flexDirection: 'column', gap: 12, transition: 'background 0.2s' }}
                className="group hover:bg-[rgba(244,162,97,0.04)]"
              >
                {/* Always-on demo */}
                <div style={{ marginBottom: 4 }}>
                  <Demo />
                </div>
                <h3 style={{ fontSize: 15, fontWeight: 500, color: 'rgba(239,227,206,0.9)' }}>{label}</h3>
                <p style={{ fontSize: 13, color: 'rgba(239,227,206,0.5)', lineHeight: 1.6 }}>{desc}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ background: 'var(--bg-primary,#0a0503)', borderTop: '1px solid rgba(244,162,97,0.1)', padding: '40px 24px', textAlign: 'center' }}>
        <p style={{ fontSize: 10, letterSpacing: 3, color: 'rgba(239,227,206,0.3)', textTransform: 'uppercase' }}>
          What&apos;s Cooking — Est. 2024 — Volume I
        </p>
      </footer>
    </>
  );
}
```

- [ ] **Step 2: Run full test suite**
```bash
cd C:\Users\lasse\Desktop\whatscooking && npx jest --no-coverage
```
Expected: All tests pass.

- [ ] **Step 3: Commit**
```bash
git add src/app/page.tsx
git commit -m "feat(landing): rewrite page.tsx — hero + swiper + bento feature grid"
```

---

## Task 8: Tonight's Edition header on `/discover`

**Files:**
- Modify: `src/app/(app)/discover/page.tsx`

- [ ] **Step 1: Add the unfold header above the existing `DiscoverFeedClient`**

Read the current top of `src/app/(app)/discover/page.tsx` to find the return statement, then insert the header component before `<DiscoverFeedClient`:

Add this component inline just before the existing `return (`:

```typescript
// Add above the return statement
function TonightsEditionHeader({ featuredTitle }: { featuredTitle: string }) {
  return (
    <div
      style={{
        transformOrigin: 'top center',
        animation: 'tonightsEditionUnfold 0.8s cubic-bezier(0.34,1.56,0.64,1) both',
        background: 'color-mix(in srgb, var(--wc-pal-accent, #B07040) 6%, #0a0503)',
        borderBottom: '1px solid rgba(244,162,97,0.15)',
        padding: '32px 24px 24px',
        textAlign: 'center',
      }}
    >
      <p style={{ fontSize: 9, letterSpacing: 6, color: 'rgba(244,162,97,0.4)', marginBottom: 8, textTransform: 'uppercase' }}>
        What&apos;s Cooking — Tonight&apos;s Edition
      </p>
      <h1 style={{ fontSize: 'clamp(24px,3vw,40px)', fontStyle: 'italic', fontWeight: 400, color: 'rgba(239,227,206,0.9)' }}>
        {featuredTitle}
      </h1>
      <p style={{ fontSize: 10, letterSpacing: 2, color: 'rgba(244,162,97,0.4)', marginTop: 8, textTransform: 'uppercase' }}>
        Fresh picks · Updated daily
      </p>
    </div>
  );
}
```

Then in the return statement, add `<TonightsEditionHeader featuredTitle={swipeRecipes?.[0]?.title ?? "Tonight's Recipes"} />` as the first child. The variable `swipeRecipes` is already fetched in the existing page.

- [ ] **Step 2: Run full test suite**
```bash
cd C:\Users\lasse\Desktop\whatscooking && npx jest --no-coverage
```
Expected: All tests pass.

- [ ] **Step 3: Commit**
```bash
git add src/app/(app)/discover/page.tsx
git commit -m "feat(discover): Tonight's Edition unfold header"
```

---

## Task 9: Verify end-to-end

- [ ] **Step 1: Start dev server**
```bash
cd C:\Users\lasse\Desktop\whatscooking && npm run dev
```

- [ ] **Step 2: Check landing page**
Open `http://localhost:3002/` and verify:
- Ken Burns pan plays on a real recipe image
- Scroll strip (3 columns) visible on right, feathered left edge with no hard line
- Dish name, origin, cook time in bottom-left
- GET STARTED and EXPLORE RECIPES buttons present
- Click EXPLORE RECIPES / SWIPE TONIGHT'S DINNER → smooth scrolls to swiper section
- Swiper section: zoom-in entry animation plays when scrolled to
- Hover the swiper deck → card peeks right with faint arrow
- 8 feature cards all animated, always-on
- Background is warm dark (not grey)

- [ ] **Step 3: Check discover page**
Open `http://localhost:3002/discover` and verify:
- Tonight's Edition header unfolds from top on load
- Existing recipe grid below is unchanged

- [ ] **Step 4: Check mobile (375px viewport)**
Resize browser to 375px width:
- Hero text is readable
- Scroll strip doesn't overflow
- Feature grid wraps to single column gracefully

- [ ] **Step 5: Final commit if any tweaks made**
```bash
git add -A
git commit -m "fix(landing): e2e visual tweaks after verification"
```
