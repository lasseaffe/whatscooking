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

function buildColumns(recipes: Recipe[]): Recipe[][] {
  const cols: Recipe[][] = [[], [], []];
  recipes.forEach((r, i) => cols[i % 3].push(r));
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
      {/* Full-viewport-width bleed overlay — starts transparent far left, ends opaque far right */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ zIndex: 4, background: 'linear-gradient(90deg, transparent 0%, transparent 40%, rgba(10,5,3,0.02) 52%, rgba(10,5,3,0.08) 62%, rgba(10,5,3,0.20) 70%, rgba(10,5,3,0.42) 78%, rgba(10,5,3,0.68) 86%, rgba(10,5,3,0.88) 93%, rgba(10,5,3,1.00) 100%)' }}
      />
      {/* Top/bottom feathered fade */}
      <div
        className="absolute right-0 top-0 bottom-0 pointer-events-none"
        style={{ width: 240, zIndex: 7, background: 'linear-gradient(180deg, rgba(10,5,3,0.97) 0%, rgba(10,5,3,0.3) 9%, transparent 20%, transparent 80%, rgba(10,5,3,0.3) 91%, rgba(10,5,3,0.97) 100%)' }}
      />
      {/* 3 scroll columns */}
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
