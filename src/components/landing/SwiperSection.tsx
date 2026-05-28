'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Heart, X } from 'lucide-react';
import { TrendingPanel } from './TrendingPanel';
import { useIsMobile } from '@/hooks/useIsMobile';

interface SwiperRecipe {
  id: string;
  title: string;
  image_url: string | null;
  cuisine_type: string | null;
  cook_time_minutes: number | null;
  calories: number | null;
}

interface TrendingRecipe {
  id: string;
  title: string;
  image_url: string | null;
  likes_count: number | null;
}

interface SwiperSectionProps {
  heroRecipe: SwiperRecipe;
  moreRecipes: SwiperRecipe[];
  trendingRecipes: TrendingRecipe[];
}

const SWIPE_THRESHOLD = 80;
const ROTATION_FACTOR = 0.1;

export function SwiperSection({ heroRecipe, moreRecipes, trendingRecipes }: SwiperSectionProps) {
  const isMobile = useIsMobile();
  const sectionRef = useRef<HTMLElement>(null);
  const [entered, setEntered] = useState(false);

  // Deck — shuffle once on mount
  const [deck, setDeck] = useState<SwiperRecipe[]>(() =>
    [...[heroRecipe, ...moreRecipes]].sort(() => Math.random() - 0.5)
  );
  const [done, setDone] = useState(false);

  // Drag state
  const cardRef = useRef<HTMLDivElement>(null);
  const [dragX, setDragX] = useState(0);
  const [dragY, setDragY] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [exiting, setExiting] = useState<'left' | 'right' | null>(null);
  const startX = useRef(0);
  const startY = useRef(0);
  const dragXRef = useRef(0);
  const moved = useRef(false);

  // Idle wiggle CTA
  const [wiggle, setWiggle] = useState(false);
  const interacted = useRef(false);
  const idleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setEntered(true); },
      { threshold: 0.3 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!entered || interacted.current) return;
    function arm() {
      idleTimer.current = setTimeout(() => {
        if (interacted.current) return;
        setWiggle(true);
        setTimeout(() => { setWiggle(false); arm(); }, 700);
      }, 5000);
    }
    idleTimer.current = setTimeout(() => {
      if (interacted.current) return;
      setWiggle(true);
      setTimeout(() => { setWiggle(false); arm(); }, 700);
    }, 3000);
    return () => { if (idleTimer.current) clearTimeout(idleTimer.current); };
  }, [entered]);

  function markInteracted() {
    if (!interacted.current) {
      interacted.current = true;
      if (idleTimer.current) clearTimeout(idleTimer.current);
    }
  }

  const commitSwipe = useCallback((dir: 'left' | 'right') => {
    if (exiting) return;
    markInteracted();
    setExiting(dir);
    setTimeout(() => {
      setDeck(prev => {
        const next = prev.slice(0, -1);
        if (next.length === 0) setDone(true);
        return next;
      });
      setExiting(null);
      setDragX(0);
      setDragY(0);
    }, 350);
  }, [exiting]);

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    if (exiting) return;
    markInteracted();
    setDragging(true);
    moved.current = false;
    startX.current = e.clientX;
    startY.current = e.clientY;
    cardRef.current?.setPointerCapture(e.pointerId);
  }, [exiting]);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragging) return;
    const dx = e.clientX - startX.current;
    const dy = e.clientY - startY.current;
    if (Math.abs(dx) > 6 || Math.abs(dy) > 6) moved.current = true;
    dragXRef.current = dx;
    setDragX(dx);
    setDragY(dy);
  }, [dragging]);

  const onPointerUp = useCallback(() => {
    if (!dragging) return;
    setDragging(false);
    const finalDragX = dragXRef.current;
    dragXRef.current = 0;
    if (finalDragX > SWIPE_THRESHOLD) commitSwipe('right');
    else if (finalDragX < -SWIPE_THRESHOLD) commitSwipe('left');
    else { setDragX(0); setDragY(0); }
  }, [dragging, commitSwipe]);

  const currentCard = deck[deck.length - 1];
  const nextCard = deck[deck.length - 2];

  const likeOpacity = Math.max(0, Math.min(1, (dragX - 20) / 60));
  const nopeOpacity = Math.max(0, Math.min(1, (-dragX - 20) / 60));

  function cardTransform(): React.CSSProperties {
    let tx = dragX, ty = dragY * 0.3, rotate = dragX * ROTATION_FACTOR;
    if (exiting === 'right') { tx = 600; ty = -60; rotate = 20; }
    if (exiting === 'left') { tx = -600; ty = -60; rotate = -20; }
    return {
      transform: `translate(${tx}px,${ty}px) rotate(${rotate}deg)`,
      transition: dragging ? 'none' : exiting ? 'transform 0.35s cubic-bezier(0.4,0,0.2,1)' : 'transform 0.25s ease-out',
      cursor: dragging ? 'grabbing' : 'grab',
      userSelect: 'none',
    };
  }

  function handleRestart() {
    setDeck([...[heroRecipe, ...moreRecipes]].sort(() => Math.random() - 0.5));
    setDone(false);
    setDragX(0);
    setDragY(0);
  }

  const meta = currentCard ? [
    currentCard.cuisine_type?.toUpperCase(),
    currentCard.cook_time_minutes ? `${currentCard.cook_time_minutes} MIN` : null,
  ].filter(Boolean).join(' · ') : '';

  return (
    <section
      id="swiper-section"
      ref={sectionRef}
      style={{
        minHeight: '60vh',
        background: 'var(--bg-primary)',
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
      }}
    >
      {/* Left: card stack + actions */}
      <div className="flex flex-col items-center justify-center" style={{ padding: '48px 24px' }}>
        <p style={{ fontSize: 10, letterSpacing: 5, color: 'rgba(244,162,97,0.5)', marginBottom: 16, textTransform: 'uppercase' }}>
          What are you craving?
        </p>
        <h2 style={{ fontSize: 'clamp(24px,3vw,40px)', fontStyle: 'italic', fontWeight: 400, color: 'rgba(239,227,206,0.9)', marginBottom: 36, textAlign: 'center' }}>
          Tonight&apos;s pick
        </h2>

        {done ? (
          <div className="flex flex-col items-center gap-4" style={{ color: 'rgba(239,227,206,0.5)', fontSize: 14 }}>
            <span style={{ fontSize: 32 }}>🍽️</span>
            <p>You&apos;ve seen everything for now.</p>
            <button
              onClick={handleRestart}
              style={{ fontSize: 11, letterSpacing: 2, color: 'rgba(244,162,97,0.8)', background: 'transparent', border: '1px solid rgba(244,162,97,0.3)', borderRadius: 4, padding: '8px 20px', cursor: 'pointer', textTransform: 'uppercase' }}
            >
              Shuffle again
            </button>
          </div>
        ) : (
          <>
            {/* Card stack */}
            <div className="relative" style={{ width: 280, height: 380 }}>
              {/* Ghost back cards */}
              <div className="absolute inset-0 rounded-2xl" style={{ transform: 'rotate(-4deg) scale(0.94)', background: 'linear-gradient(160deg,#2a1206,#0d0604)', border: '1px solid rgba(244,162,97,0.1)' }} />
              <div className="absolute inset-0 rounded-2xl" style={{ transform: 'rotate(-1.5deg) scale(0.97)', background: 'linear-gradient(160deg,#331508,#100604)', border: '1px solid rgba(244,162,97,0.15)' }} />

              {/* Next card (peek) */}
              {nextCard && (
                <div
                  className="absolute inset-0 rounded-2xl overflow-hidden"
                  style={{ transform: 'scale(0.96) translateY(10px)', opacity: 0.85, zIndex: 1 }}
                >
                  {nextCard.image_url && (
                    <img src={nextCard.image_url} alt={nextCard.title} className="w-full h-full object-cover" style={{ filter: 'brightness(0.7)' }} />
                  )}
                </div>
              )}

              {/* Top card */}
              {currentCard && (
                <div
                  ref={cardRef}
                  className="absolute inset-0 rounded-2xl overflow-hidden shadow-xl flex flex-col justify-end"
                  style={{
                    ...cardTransform(),
                    zIndex: 2,
                    border: '1px solid rgba(244,162,97,0.25)',
                    boxShadow: '0 24px 60px rgba(0,0,0,0.6)',
                    background: 'linear-gradient(160deg,#5a2510,#1a0a04)',
                    animation: wiggle ? 'landingWiggle 0.6s ease-in-out' : (entered ? 'zoomSettle 0.5s cubic-bezier(0.34,1.56,0.64,1) both' : 'none'),
                  }}
                  onPointerDown={onPointerDown}
                  onPointerMove={onPointerMove}
                  onPointerUp={onPointerUp}
                  onPointerCancel={onPointerUp}
                >
                  {currentCard.image_url && (
                    <img src={currentCard.image_url} alt={currentCard.title} className="absolute inset-0 w-full h-full object-cover" />
                  )}
                  <div className="absolute inset-0" style={{ background: 'linear-gradient(transparent 40%,rgba(0,0,0,0.78) 100%)' }} />

                  {/* Like stamp */}
                  {likeOpacity > 0 && (
                    <div className="absolute top-5 right-5 rounded-lg px-3 py-1" style={{ border: '2px solid #4ade80', opacity: likeOpacity, transform: `rotate(${-8 + likeOpacity * 4}deg)` }}>
                      <span style={{ color: '#4ade80', fontSize: 13, fontWeight: 700, letterSpacing: 2 }}>LIKE</span>
                    </div>
                  )}
                  {/* Nope stamp */}
                  {nopeOpacity > 0 && (
                    <div className="absolute top-5 left-5 rounded-lg px-3 py-1" style={{ border: '2px solid #f87171', opacity: nopeOpacity, transform: `rotate(${8 - nopeOpacity * 4}deg)` }}>
                      <span style={{ color: '#f87171', fontSize: 13, fontWeight: 700, letterSpacing: 2 }}>NOPE</span>
                    </div>
                  )}

                  <div className="relative p-5" style={{ zIndex: 2 }}>
                    <h3 style={{ fontSize: 18, fontStyle: 'italic', fontWeight: 400, color: 'rgba(239,227,206,0.95)' }}>{currentCard.title}</h3>
                    {meta && <p style={{ fontSize: 10, letterSpacing: 2, color: 'rgba(244,162,97,0.6)', marginTop: 6 }}>{meta}</p>}
                  </div>
                </div>
              )}
            </div>

            {/* Action buttons */}
            <div className="flex gap-5 mt-7 items-center">
              <button
                type="button"
                onClick={() => commitSwipe('left')}
                disabled={!!exiting}
                className="rounded-full flex items-center justify-center shadow-lg transition-transform active:scale-90 hover:scale-110"
                style={{ width: 56, height: 56, background: 'rgba(239,227,206,0.05)', border: '1px solid rgba(239,227,206,0.15)', cursor: 'pointer' }}
                aria-label="Skip"
              >
                <X className="w-5 h-5" style={{ color: '#C85A2F' }} />
              </button>

              <button
                type="button"
                onClick={() => commitSwipe('right')}
                disabled={!!exiting}
                className="rounded-full flex items-center justify-center shadow-xl transition-transform active:scale-90 hover:scale-110"
                style={{ width: 68, height: 68, background: 'linear-gradient(135deg,#C85A2F,#E8834A)', boxShadow: '0 6px 28px rgba(200,90,47,0.5)', cursor: 'pointer' }}
                aria-label="Like"
              >
                <Heart className="w-6 h-6 fill-white text-white" />
              </button>
            </div>
          </>
        )}
      </div>

      {/* Right: trending panel */}
      <TrendingPanel recipes={trendingRecipes} />

      <style>{`
        @keyframes landingWiggle {
          0%   { transform: rotate(0deg) translateX(0); }
          15%  { transform: rotate(-3deg) translateX(-8px); }
          35%  { transform: rotate(4deg)  translateX(12px); }
          55%  { transform: rotate(-2deg) translateX(-6px); }
          75%  { transform: rotate(2deg)  translateX(6px); }
          100% { transform: rotate(0deg) translateX(0); }
        }
        @keyframes zoomSettle {
          0%   { opacity: 0; transform: scale(0.85); }
          100% { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </section>
  );
}
