'use client';
import { useCallback } from 'react';
import Link from 'next/link';
import { useAmbilight } from './useAmbilight';
import { CookingModePanel } from './CookingModePanel';
import { useIsMobile } from '@/hooks/useIsMobile';

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?auto=format&fit=crop&w=1400&q=85';

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
}

export function HeroSection({ heroRecipe }: HeroSectionProps) {
  const isMobile = useIsMobile();
  const imageUrl = heroRecipe.image_url ?? FALLBACK_IMAGE;
  const ambilightColor = useAmbilight(imageUrl, true);

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
      style={{
        height: isMobile ? '60svh' : '70svh',
        minHeight: isMobile ? 380 : 480,
        overflow: 'clip',
        background: ambilightColor,
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : '1fr 36%',
      }}
    >
      {/* ── Left: cinematic image ── */}
      <div className="relative" style={{ overflow: 'hidden' }}>
        {/* Ken Burns background */}
        <div
          className="absolute pointer-events-none"
          style={{ inset: '-5%', animation: 'kenBurns 8s ease-in-out infinite alternate' }}
        >
          <img
            src={imageUrl}
            alt={heroRecipe.title}
            className="w-full h-full object-cover"
          />
        </div>

        {/* Vignette — left-weighted so copy stays readable, right fades to panel */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            zIndex: 3,
            background: [
              'linear-gradient(to right, rgba(10,5,3,0.85) 0%, rgba(10,5,3,0.3) 55%, rgba(10,5,3,0.7) 100%)',
              'linear-gradient(to top, rgba(10,5,3,0.6) 0%, transparent 50%)',
            ].join(', '),
          }}
        />

        {/* Dish info — bottom left */}
        <div
          className="absolute"
          style={{ left: '8%', bottom: '26%', zIndex: 6, animation: 'fadeInUp 0.8s ease-out both' }}
        >
          <p style={{ fontSize: 10, letterSpacing: 5, color: 'rgba(244,162,97,0.6)', marginBottom: 10, textTransform: 'uppercase' }}>
            Tonight&apos;s Recommendation
          </p>
          <h1
            style={{ fontSize: 'clamp(28px,4vw,52px)', fontStyle: 'italic', fontWeight: 400, lineHeight: 1.1, color: 'rgba(239,227,206,0.95)', textShadow: '0 4px 32px rgba(0,0,0,0.7)' }}
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
          style={{ left: '8%', bottom: '12%', zIndex: 6, animation: 'fadeInUp 0.8s ease-out 0.3s both' }}
        >
          <Link
            href="/signup"
            className="inline-block"
            style={{ background: '#8B2635', color: 'rgba(239,227,206,0.95)', padding: '13px 26px', fontSize: 11, letterSpacing: 3, borderRadius: 2, textTransform: 'uppercase', textDecoration: 'none' }}
          >
            Get Started
          </Link>
          <button
            onClick={handleScrollToSwiper}
            style={{ background: 'transparent', color: 'rgba(239,227,206,0.6)', border: '1px solid rgba(239,227,206,0.2)', padding: '12px 22px', fontSize: 11, letterSpacing: 3, borderRadius: 2, cursor: 'pointer', textTransform: 'uppercase', fontFamily: 'inherit' }}
          >
            Explore Recipes
          </button>
        </div>

        {/* Thin bottom rule */}
        <div className="absolute bottom-0 left-0 right-0" style={{ height: 1, background: 'linear-gradient(90deg,transparent,rgba(244,162,97,0.2),transparent)', zIndex: 6 }} />
      </div>

      {/* ── Right: cooking mode panel — hidden on mobile ── */}
      {!isMobile && <CookingModePanel />}
    </section>
  );
}
