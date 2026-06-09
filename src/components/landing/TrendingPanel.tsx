'use client';
import { useEffect, useRef, useState } from 'react';

interface TrendingRecipe {
  id: string;
  title: string;
  image_url: string | null;
  likes_count: number | null;
}

interface TrendingPanelProps {
  recipes: TrendingRecipe[];
}

export function TrendingPanel({ recipes }: TrendingPanelProps) {
  const [visible, setVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold: 0.3 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  // Compute bar widths relative to the highest like count
  const maxLikes = recipes.reduce((m, r) => Math.max(m, r.likes_count ?? 0), 1);

  // Fallback counts for display when likes_count is null
  const fallbackCounts = [2400, 1900, 1400, 1100, 800];

  return (
    <div
      ref={ref}
      style={{
        borderLeft: '1px solid rgba(201,169,110,0.1)',
        padding: '32px 28px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        gap: 18,
      }}
    >
      <div style={{ fontSize: 9, letterSpacing: 3, color: '#c9a96e', textTransform: 'uppercase', marginBottom: 4 }}>
        Trending This Week
      </div>

      {recipes.slice(0, 5).map((recipe, i) => {
        const count = recipe.likes_count ?? fallbackCounts[i];
        const barWidth = maxLikes > 0 ? (count / Math.max(maxLikes, 1)) * 100 : fallbackCounts[i] / fallbackCounts[0] * 100;
        const delay = i * 100;

        return (
          <div key={recipe.id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {/* Rank */}
            <span style={{
              fontFamily: 'monospace',
              fontSize: 11,
              color: '#444',
              width: 22,
              flexShrink: 0,
            }}>
              {String(i + 1).padStart(2, '0')}
            </span>

            {/* Thumbnail */}
            {recipe.image_url ? (
              <img
                src={recipe.image_url}
                alt={recipe.title}
                style={{ width: 36, height: 36, borderRadius: 4, objectFit: 'cover', flexShrink: 0 }}
              />
            ) : (
              <div style={{ width: 36, height: 36, borderRadius: 4, background: '#2a1a0f', flexShrink: 0 }} />
            )}

            {/* Name + bar */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                fontSize: 12,
                color: '#d4c5b0',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                marginBottom: 4,
              }}>
                {recipe.title}
              </div>
              <div style={{ height: 2, background: 'rgba(255,255,255,0.06)', borderRadius: 1 }}>
                <div style={{
                  height: '100%',
                  background: '#8b2020',
                  borderRadius: 1,
                  width: visible ? `${barWidth}%` : '0%',
                  transition: `width 0.6s ease ${delay}ms`,
                }} />
              </div>
            </div>

            {/* Count */}
            <span style={{
              fontSize: 10,
              color: '#c9a96e',
              flexShrink: 0,
              fontFamily: 'monospace',
            }}>
              {count >= 1000 ? `${(count / 1000).toFixed(1)}k` : count} ♥
            </span>
          </div>
        );
      })}
    </div>
  );
}
