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

        {/* Breathe + glow */}
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
            animation: entered ? 'zoomSettle 0.6s cubic-bezier(0.34,1.56,0.64,1) both' : 'none',
            transform: isHovered ? 'translateX(14px) rotate(4deg)' : undefined,
            transition: isHovered ? 'transform 0.4s ease-out' : 'transform 0.4s ease-in',
            zIndex: 2,
          }}
        >
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
        {[
          { label: '✕', title: 'Skip' },
          { label: '🔖', title: 'Save' },
          { label: '♥', title: 'Like', accent: true },
          { label: 'ℹ', title: 'Info' },
        ].map(({ label, title, accent }) => (
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
