'use client';
import { useCallback } from 'react';
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
          />
        </div>
      )}

      {/* Vignette */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ zIndex: 3, background: 'radial-gradient(ellipse 120% 100% at 35% 50%, transparent 30%, rgba(0,0,0,0.5) 80%, rgba(0,0,0,0.85) 100%)' }}
      />

      {/* Scroll strip */}
      <ScrollStrip recipes={stripRecipes} onImageVisible={() => {}} />

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
          style={{ background: '#8B2635', color: 'rgba(239,227,206,0.95)', padding: '14px 28px', fontSize: 12, letterSpacing: 3, borderRadius: 2, textTransform: 'uppercase', textDecoration: 'none' }}
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
