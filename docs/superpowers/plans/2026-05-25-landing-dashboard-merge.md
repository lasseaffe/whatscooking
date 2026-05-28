# Landing + Dashboard Merge Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Delete `/dashboard`, merge its best content into `/` — replacing the 8-card bento grid with a 30/70 split feature carousel, adding cinematic recipe posters and an auth-gated cookbook shelf.

**Architecture:** `src/app/page.tsx` becomes the sole home for all home-screen content. New client component `FeatureCarousel` owns slide state and keyboard nav. `RecipeShowcase` and `CookbookShelf` are server components moved from `dashboard/` to `landing/` with improvements. `/dashboard` redirects permanently to `/`.

**Tech Stack:** Next.js App Router, Supabase server client for auth-gated sections, React `useState`/`useEffect`/`useCallback` for carousel, inline CSS matching existing WC brand tokens (`#0a0503`, `#F4A261`, Cormorant Garamond italic, JetBrains Mono).

---

## File Map

| Action | Path |
|--------|------|
| Modify | `next.config.ts` |
| Create | `src/components/landing/poster-configs.tsx` |
| Create | `src/components/landing/RecipePoster.tsx` |
| Create | `src/components/landing/RecipeShowcase.tsx` |
| Create | `src/components/landing/CookbookCards.tsx` |
| Create | `src/components/landing/CookbookShelf.tsx` |
| Create | `src/components/landing/FeatureCarousel.tsx` |
| Modify | `src/app/page.tsx` |
| Modify | `src/app/(app)/layout.tsx` |
| Modify | `src/app/(app)/dashboard/page.tsx` |
| Delete | `src/components/dashboard/hero-section.tsx` |
| Delete | `src/components/dashboard/feature-showcase.tsx` |
| Delete | `src/components/dashboard/recipe-showcase.tsx` |
| Delete | `src/components/dashboard/recipe-poster.tsx` |
| Delete | `src/components/dashboard/poster-configs.tsx` |
| Delete | `src/components/dashboard/cookbook-shelf.tsx` |
| Delete | `src/components/dashboard/cookbook-cards.tsx` |

---

### Task 1: Add /dashboard permanent redirect

**Files:**
- Modify: `next.config.ts`

- [ ] **Step 1: Read current next.config.ts**

```bash
cat "C:\Users\lasse\Desktop\whatscooking\next.config.ts"
```

- [ ] **Step 2: Add redirects to next.config.ts**

Replace the full file with:

```ts
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  experimental: {
    turbo: {},
  },
  async redirects() {
    return [
      {
        source: '/dashboard',
        destination: '/',
        permanent: true,
      },
    ]
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'images.pexels.com' },
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
}

export default nextConfig
```

- [ ] **Step 3: Commit**

```bash
git add next.config.ts
git commit -m "feat(landing): redirect /dashboard → / permanently"
```

---

### Task 2: Copy poster infrastructure to landing/

**Files:**
- Create: `src/components/landing/poster-configs.tsx`
- Create: `src/components/landing/RecipePoster.tsx`

- [ ] **Step 1: Copy poster-configs.tsx to landing/**

```bash
cp "C:\Users\lasse\Desktop\whatscooking\src\components\dashboard\poster-configs.tsx" \
   "C:\Users\lasse\Desktop\whatscooking\src\components\landing\poster-configs.tsx"
```

- [ ] **Step 2: Copy recipe-poster.tsx to landing/RecipePoster.tsx**

```bash
cp "C:\Users\lasse\Desktop\whatscooking\src\components\dashboard\recipe-poster.tsx" \
   "C:\Users\lasse\Desktop\whatscooking\src\components\landing\RecipePoster.tsx"
```

- [ ] **Step 3: Verify files exist**

```bash
ls "C:\Users\lasse\Desktop\whatscooking\src\components\landing\"
```

Expected output includes: `poster-configs.tsx`, `RecipePoster.tsx`

- [ ] **Step 4: Commit**

```bash
git add src/components/landing/poster-configs.tsx src/components/landing/RecipePoster.tsx
git commit -m "feat(landing): copy poster infrastructure from dashboard to landing/"
```

---

### Task 3: Create RecipeShowcase with hover-expand

**Files:**
- Create: `src/components/landing/RecipeShowcase.tsx`

- [ ] **Step 1: Create RecipeShowcase.tsx**

```tsx
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
```

- [ ] **Step 2: Verify TypeScript compiles (quick check)**

```bash
cd C:\Users\lasse\Desktop\whatscooking && npx tsc --noEmit --project tsconfig.json 2>&1 | head -20
```

Expected: no errors referencing `RecipeShowcase.tsx`

- [ ] **Step 3: Commit**

```bash
git add src/components/landing/RecipeShowcase.tsx
git commit -m "feat(landing): add RecipeShowcase with hover-expand to landing/"
```

---

### Task 4: Copy CookbookCards to landing/

**Files:**
- Create: `src/components/landing/CookbookCards.tsx`

- [ ] **Step 1: Copy cookbook-cards.tsx to landing/CookbookCards.tsx**

```bash
cp "C:\Users\lasse\Desktop\whatscooking\src\components\dashboard\cookbook-cards.tsx" \
   "C:\Users\lasse\Desktop\whatscooking\src\components\landing\CookbookCards.tsx"
```

- [ ] **Step 2: Commit**

```bash
git add src/components/landing/CookbookCards.tsx
git commit -m "feat(landing): copy CookbookCards to landing/"
```

---

### Task 5: Create auth-conditional CookbookShelf

**Files:**
- Create: `src/components/landing/CookbookShelf.tsx`

The existing `dashboard/cookbook-shelf.tsx` returns nothing for logged-out users. The new version renders ghost placeholder cards with a sign-in CTA instead.

- [ ] **Step 1: Create CookbookShelf.tsx**

```tsx
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { CookbookCard } from './CookbookCards'

function GhostCard() {
  return (
    <div style={{
      width: 220,
      height: 300,
      flexShrink: 0,
      background: 'rgba(244,162,97,0.04)',
      border: '1px solid rgba(244,162,97,0.08)',
      borderRadius: 2,
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* shimmer lines */}
      {[40, 70, 90].map((top) => (
        <div key={top} style={{
          position: 'absolute',
          left: 16, right: 16,
          top,
          height: 8,
          background: 'rgba(244,162,97,0.06)',
          borderRadius: 2,
        }} />
      ))}
    </div>
  )
}

export async function CookbookShelf() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  /* ── Logged-out: ghost teaser ─────────────────────────── */
  if (!user) {
    return (
      <section style={{ background: '#0a0503', padding: '80px 40px', borderTop: '1px solid rgba(244,162,97,0.06)' }}>
        <p style={{ fontFamily: 'var(--font-geist-mono, monospace)', fontSize: 10, letterSpacing: 4, color: 'rgba(244,162,97,0.4)', textTransform: 'uppercase', marginBottom: 12 }}>
          Your Cookbooks
        </p>
        <h2 style={{ fontFamily: 'var(--font-cormorant, serif)', fontStyle: 'italic', fontSize: 'clamp(22px,3vw,36px)', fontWeight: 400, color: 'rgba(239,227,206,0.9)', marginBottom: 40, margin: '0 0 40px' }}>
          Build your cookbook
        </h2>
        <div style={{ position: 'relative', display: 'inline-flex', gap: 12 }}>
          <GhostCard />
          <GhostCard />
          <GhostCard />
          {/* overlay */}
          <div style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(to right, transparent 10%, rgba(10,5,3,0.85) 60%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            paddingRight: 32,
          }}>
            <Link href="/auth/login" style={{
              display: 'inline-block',
              fontSize: 11,
              letterSpacing: 2,
              color: 'rgba(239,227,206,0.9)',
              textDecoration: 'none',
              textTransform: 'uppercase',
              background: '#8B2635',
              padding: '10px 20px',
              borderRadius: 2,
            }}>
              Sign in to continue
            </Link>
          </div>
        </div>
      </section>
    )
  }

  /* ── Logged-in: real cookbooks ────────────────────────── */
  const { data: cookbooks } = await supabase
    .from('cookbooks')
    .select('id, title, slug, cover_image_url, theme_color, cookbook_chapters(cookbook_recipes(id))')
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false })
    .limit(3)

  const withCounts = (cookbooks ?? []).map((cb) => ({
    ...cb,
    recipeCount: (cb.cookbook_chapters ?? []).reduce(
      (acc: number, ch: { cookbook_recipes: { id: string }[] }) => acc + (ch.cookbook_recipes?.length ?? 0),
      0
    ),
  }))

  return (
    <section style={{ background: '#0a0503', padding: '80px 40px', borderTop: '1px solid rgba(244,162,97,0.06)' }}>
      <p style={{ fontFamily: 'var(--font-geist-mono, monospace)', fontSize: 10, letterSpacing: 4, color: 'rgba(244,162,97,0.4)', textTransform: 'uppercase', marginBottom: 12 }}>
        Your Cookbooks
      </p>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 40 }}>
        <h2 style={{ fontFamily: 'var(--font-cormorant, serif)', fontStyle: 'italic', fontSize: 'clamp(22px,3vw,36px)', fontWeight: 400, color: 'rgba(239,227,206,0.9)', margin: 0 }}>
          Your Cookbooks
        </h2>
        <div style={{ display: 'flex', gap: 24 }}>
          <Link href="/cookbooks" style={{ fontSize: 11, letterSpacing: 2, color: 'rgba(244,162,97,0.7)', textDecoration: 'none', textTransform: 'uppercase' }}>
            View All
          </Link>
          <Link href="/cookbooks/new" style={{ fontSize: 11, letterSpacing: 2, color: 'rgba(239,227,206,0.5)', textDecoration: 'none', textTransform: 'uppercase' }}>
            + Create New
          </Link>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        {withCounts.map((cb) => (
          <CookbookCard
            key={cb.id}
            href={`/cookbooks/${cb.slug}`}
            title={cb.title}
            count={cb.recipeCount}
            accent={cb.theme_color ?? '#8B2635'}
            coverImageUrl={cb.cover_image_url}
          />
        ))}
        {withCounts.length === 0 && (
          <Link href="/cookbooks/new" style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 220,
            height: 300,
            border: '1px dashed rgba(244,162,97,0.2)',
            borderRadius: 2,
            fontSize: 11,
            letterSpacing: 2,
            color: 'rgba(244,162,97,0.5)',
            textDecoration: 'none',
            textTransform: 'uppercase',
          }}>
            + Create First Cookbook
          </Link>
        )}
      </div>
    </section>
  )
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
cd C:\Users\lasse\Desktop\whatscooking && npx tsc --noEmit 2>&1 | head -30
```

Expected: no errors in `CookbookShelf.tsx`

- [ ] **Step 3: Commit**

```bash
git add src/components/landing/CookbookShelf.tsx
git commit -m "feat(landing): add auth-conditional CookbookShelf with ghost teaser"
```

---

### Task 6: Create FeatureCarousel client component

**Files:**
- Create: `src/components/landing/FeatureCarousel.tsx`

This replaces the existing bento grid section. It imports all 8 existing Demo components from `./feature-demos/` (their paths don't change).

- [ ] **Step 1: Create FeatureCarousel.tsx**

```tsx
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
```

- [ ] **Step 2: Verify TypeScript**

```bash
cd C:\Users\lasse\Desktop\whatscooking && npx tsc --noEmit 2>&1 | head -30
```

Expected: no errors in `FeatureCarousel.tsx`

- [ ] **Step 3: Commit**

```bash
git add src/components/landing/FeatureCarousel.tsx
git commit -m "feat(landing): add 30/70 FeatureCarousel client component"
```

---

### Task 7: Update page.tsx — wire all three new sections

**Files:**
- Modify: `src/app/page.tsx`

- [ ] **Step 1: Read current page.tsx to get exact line ranges**

```bash
cat -n "C:\Users\lasse\Desktop\whatscooking\src\app\page.tsx"
```

- [ ] **Step 2: Replace page.tsx**

Remove the FEATURES constant, all Demo imports, and the bento grid `<section>`. Add FeatureCarousel, RecipeShowcase, CookbookShelf. The file becomes:

```tsx
import { createClient } from "@/lib/supabase/server";
import { HeroSection } from "@/components/landing/HeroSection";
import { SwiperSection } from "@/components/landing/SwiperSection";
import { FeatureCarousel } from "@/components/landing/FeatureCarousel";
import { RecipeShowcase } from "@/components/landing/RecipeShowcase";
import { CookbookShelf } from "@/components/landing/CookbookShelf";
import Link from "next/link";

export const dynamic = "force-dynamic";

type Recipe = {
  id: string;
  title: string;
  image_url: string | null;
  cuisine_type: string | null;
  cook_time_minutes: number | null;
  calories: number | null;
};

export default async function LandingPage() {
  const supabase = await createClient();

  const { data: topRecipes } = await supabase
    .from("recipes")
    .select("id, title, image_url, cuisine_type, cook_time_minutes, calories")
    .eq("image_status", "ok")
    .ilike("image_url", "%supabase%")
    .order("created_at", { ascending: false })
    .limit(20);

  const heroRecipe: Recipe = topRecipes && topRecipes.length > 0
    ? topRecipes[Math.floor(Math.random() * topRecipes.length)]
    : { id: '', title: "Tonight's Recipe", image_url: null, cuisine_type: null, cook_time_minutes: null, calories: null };

  const { data: stripRecipes } = await supabase
    .from("recipes")
    .select("id, title, image_url")
    .not("image_url", "is", null)
    .neq("id", heroRecipe.id)
    .order("created_at", { ascending: false })
    .limit(30);

  const { data: swiperRecipes } = await supabase
    .from("recipes")
    .select("id, title, image_url, cuisine_type, cook_time_minutes, calories")
    .not("image_url", "is", null)
    .neq("id", heroRecipe.id)
    .order("created_at", { ascending: false })
    .limit(10);

  return (
    <>
      {/* Fixed header */}
      <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4" style={{ background: 'linear-gradient(rgba(10,5,3,0.8),transparent)', backdropFilter: 'blur(2px)' }}>
        <Link href="/" style={{ fontSize: 13, letterSpacing: 4, color: 'rgba(239,227,206,0.9)', textDecoration: 'none', textTransform: 'uppercase' }}>
          What&apos;s Cooking
        </Link>
        <div className="flex items-center gap-4">
          <Link href="/auth/login" style={{ fontSize: 11, letterSpacing: 2, color: 'rgba(239,227,206,0.6)', textDecoration: 'none', textTransform: 'uppercase' }}>Sign in</Link>
          <Link href="/auth/signup" style={{ fontSize: 11, letterSpacing: 2, color: 'rgba(239,227,206,0.9)', textDecoration: 'none', textTransform: 'uppercase', background: '#8B2635', padding: '8px 16px', borderRadius: 2 }}>Get Started</Link>
        </div>
      </header>

      <HeroSection heroRecipe={heroRecipe} stripRecipes={stripRecipes ?? []} />

      <SwiperSection heroRecipe={heroRecipe} moreRecipes={swiperRecipes ?? []} />

      <FeatureCarousel />

      <RecipeShowcase />

      <CookbookShelf />

      <footer style={{ background: 'var(--bg-primary,#0a0503)', borderTop: '1px solid rgba(244,162,97,0.1)', padding: '40px 24px', textAlign: 'center' }}>
        <p style={{ fontSize: 10, letterSpacing: 3, color: 'rgba(239,227,206,0.3)', textTransform: 'uppercase' }}>
          What&apos;s Cooking — Est. 2024 — Volume I
        </p>
      </footer>
    </>
  );
}
```

- [ ] **Step 3: Run build to verify no TypeScript/import errors**

```bash
cd C:\Users\lasse\Desktop\whatscooking && npm run build 2>&1 | tail -30
```

Expected: build completes without errors. If there are missing export errors (e.g. `RecipeShowcase` not exported), check that the file uses named exports (`export function`), not default exports.

- [ ] **Step 4: Commit**

```bash
git add src/app/page.tsx
git commit -m "feat(landing): wire FeatureCarousel, RecipeShowcase, CookbookShelf into root page"
```

---

### Task 8: Move DashboardOnboardingGate to (app)/layout.tsx

**Files:**
- Modify: `src/app/(app)/layout.tsx`

The `DashboardOnboardingGate` runs a one-time localStorage migration on mount. It currently lives only on `/dashboard`. Moving it to the app layout ensures it runs on any authenticated route.

- [ ] **Step 1: Read current (app)/layout.tsx to find insertion point**

```bash
cat -n "C:\Users\lasse\Desktop\whatscooking\src\app\(app)\layout.tsx"
```

- [ ] **Step 2: Add DashboardOnboardingGate import and usage**

Find the existing provider JSX return statement. Add the import at the top of the file:

```tsx
import DashboardOnboardingGate from '@/components/onboarding/DashboardOnboardingGate'
```

Then inside the returned JSX (anywhere within the provider tree, before or after `{children}`), add:

```tsx
<DashboardOnboardingGate />
```

- [ ] **Step 3: Verify TypeScript**

```bash
cd C:\Users\lasse\Desktop\whatscooking && npx tsc --noEmit 2>&1 | head -20
```

Expected: no new errors.

- [ ] **Step 4: Commit**

```bash
git add "src/app/(app)/layout.tsx"
git commit -m "feat(app): move DashboardOnboardingGate from /dashboard to (app)/layout"
```

---

### Task 9: Replace /dashboard/page.tsx with redirect

**Files:**
- Modify: `src/app/(app)/dashboard/page.tsx`

- [ ] **Step 1: Replace dashboard/page.tsx with a server-side redirect**

```tsx
import { redirect } from 'next/navigation'

export default function DashboardPage() {
  redirect('/')
}
```

- [ ] **Step 2: Verify build**

```bash
cd C:\Users\lasse\Desktop\whatscooking && npm run build 2>&1 | tail -20
```

Expected: clean build.

- [ ] **Step 3: Commit**

```bash
git add "src/app/(app)/dashboard/page.tsx"
git commit -m "feat(dashboard): replace /dashboard with server redirect to /"
```

---

### Task 10: Delete old dashboard components + final build verification

**Files:**
- Delete: `src/components/dashboard/hero-section.tsx`
- Delete: `src/components/dashboard/feature-showcase.tsx`
- Delete: `src/components/dashboard/recipe-showcase.tsx`
- Delete: `src/components/dashboard/recipe-poster.tsx`
- Delete: `src/components/dashboard/poster-configs.tsx`
- Delete: `src/components/dashboard/cookbook-shelf.tsx`
- Delete: `src/components/dashboard/cookbook-cards.tsx`

- [ ] **Step 1: Check nothing in the codebase still imports from these files**

```bash
cd C:\Users\lasse\Desktop\whatscooking && grep -r "dashboard/hero-section\|dashboard/feature-showcase\|dashboard/recipe-showcase\|dashboard/recipe-poster\|dashboard/poster-configs\|dashboard/cookbook-shelf\|dashboard/cookbook-cards" src/ --include="*.tsx" --include="*.ts"
```

Expected: only results from the files we're about to delete (or zero results). If any other file still imports these, fix those imports first.

- [ ] **Step 2: Delete the files**

```bash
Remove-Item "C:\Users\lasse\Desktop\whatscooking\src\components\dashboard\hero-section.tsx"
Remove-Item "C:\Users\lasse\Desktop\whatscooking\src\components\dashboard\feature-showcase.tsx"
Remove-Item "C:\Users\lasse\Desktop\whatscooking\src\components\dashboard\recipe-showcase.tsx"
Remove-Item "C:\Users\lasse\Desktop\whatscooking\src\components\dashboard\recipe-poster.tsx"
Remove-Item "C:\Users\lasse\Desktop\whatscooking\src\components\dashboard\poster-configs.tsx"
Remove-Item "C:\Users\lasse\Desktop\whatscooking\src\components\dashboard\cookbook-shelf.tsx"
Remove-Item "C:\Users\lasse\Desktop\whatscooking\src\components\dashboard\cookbook-cards.tsx"
```

- [ ] **Step 3: Final build**

```bash
cd C:\Users\lasse\Desktop\whatscooking && npm run build 2>&1 | tail -40
```

Expected: clean build with zero TypeScript errors. The `/dashboard` route still exists (it redirects to `/`) and the root `/` now renders all merged content.

- [ ] **Step 4: Final commit**

```bash
git add -A
git commit -m "feat(landing): remove stale dashboard components after merge to landing/"
```
