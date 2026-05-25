'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

export interface DetailRecipe {
  id: string;
  title: string;
  image_url: string | null;
  focal_x?: number | null;
  focal_y?: number | null;
  cuisine_type?: string | null;
  dish_types?: string[] | null;
  description?: string | null;
  total_time_minutes?: number | null;
  prep_time_minutes?: number | null;
  cook_time_minutes?: number | null;
  calories?: number | null;
  servings?: number | null;
  dietary_tags?: string[] | null;
}

interface Props {
  recipe: DetailRecipe | null;
  onClose: () => void;
}

interface Ingredient {
  name: string;
  quantity?: string | number | null;
  unit?: string | null;
}

function useIngredients(recipeId: string | null) {
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!recipeId) return;
    setIngredients([]);
    setLoading(true);
    const supabase = createClient();
    (async () => {
      const { data } = await supabase
        .from('recipes')
        .select('ingredients')
        .eq('id', recipeId)
        .single();
      const raw = (data?.ingredients ?? []) as unknown[];
      setIngredients(
        raw.map((r: unknown) => {
          if (typeof r === 'string') return { name: r };
          const obj = r as Record<string, unknown>;
          return {
            name: String(obj.name ?? obj.ingredient ?? ''),
            quantity: obj.quantity != null ? String(obj.quantity) : null,
            unit: obj.unit != null ? String(obj.unit) : null,
          };
        }).filter(i => i.name)
      );
      setLoading(false);
    })();
  }, [recipeId]);

  return { ingredients, loading };
}

const PILL_LIMIT = 5;

export function RecipeDetailModal({ recipe, onClose }: Props) {
  useEffect(() => {
    if (!recipe) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [recipe, onClose]);

  const { ingredients, loading } = useIngredients(recipe?.id ?? null);

  if (!recipe) return null;

  const totalMinutes =
    recipe.total_time_minutes ??
    (((recipe.prep_time_minutes ?? 0) + (recipe.cook_time_minutes ?? 0)) || null);

  const visiblePills = ingredients.slice(0, PILL_LIMIT);
  const extraCount = ingredients.length - visiblePills.length;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(3px)' }}
      onClick={onClose}
    >
      <div
        className="w-full rounded-2xl overflow-hidden shadow-2xl"
        style={{
          maxWidth: 380,
          background: '#1C1009',
          border: '1px solid #3A1C08',
          boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Top row: image strip + info */}
        <div className="flex" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          {/* Left image strip */}
          <div className="shrink-0 overflow-hidden" style={{ width: 80 }}>
            {recipe.image_url ? (
              <img
                src={recipe.image_url}
                alt={recipe.title}
                className="w-full h-full object-cover"
                style={{ minHeight: 90 }}
              />
            ) : (
              <div
                className="w-full h-full flex items-center justify-center text-2xl"
                style={{ minHeight: 90, background: 'linear-gradient(135deg, #3A1C08, #1C0804)' }}
              >
                🍳
              </div>
            )}
          </div>

          {/* Right info */}
          <div className="flex-1 px-3 py-3 min-w-0">
            {recipe.cuisine_type && (
              <p style={{ fontSize: 8, textTransform: 'uppercase', letterSpacing: 3, color: '#F4A261', fontWeight: 600, marginBottom: 3 }}>
                {recipe.cuisine_type}
              </p>
            )}
            <p
              className="leading-snug mb-2"
              style={{ fontFamily: "'Playfair Display', Georgia, serif", fontStyle: 'italic', fontSize: 14, color: '#EFE3CE', lineHeight: 1.25 }}
            >
              {recipe.title}
            </p>
            <div className="flex gap-3">
              {totalMinutes && (
                <span style={{ fontSize: 10, color: '#8A6A4A' }}>⏱ <b style={{ color: '#C85A2F' }}>{totalMinutes}m</b></span>
              )}
              {recipe.calories && (
                <span style={{ fontSize: 10, color: '#8A6A4A' }}>🔥 <b style={{ color: '#C85A2F' }}>{recipe.calories}</b></span>
              )}
              {recipe.servings && (
                <span style={{ fontSize: 10, color: '#8A6A4A' }}>👤 <b style={{ color: '#C85A2F' }}>{recipe.servings}</b></span>
              )}
            </div>
          </div>

          {/* Close */}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 flex items-center justify-center w-6 h-6 rounded-full text-xs"
            style={{ background: 'rgba(0,0,0,0.4)', color: '#8A6A4A', position: 'relative', flexShrink: 0, alignSelf: 'flex-start', margin: '8px 8px 0 0' }}
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* Description */}
        {recipe.description && (
          <p
            className="px-3 py-2"
            style={{
              fontSize: 11, fontStyle: 'italic', color: 'rgba(239,227,206,0.45)',
              lineHeight: 1.45, borderBottom: '1px solid rgba(255,255,255,0.05)',
              overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis',
            }}
          >
            {recipe.description}
          </p>
        )}

        {/* Ingredient pills */}
        <div className="px-3 py-2" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <p style={{ fontSize: 8, textTransform: 'uppercase', letterSpacing: 2, color: '#6B4A32', fontWeight: 600, marginBottom: 6 }}>
            Ingredients{ingredients.length > 0 ? ` · ${ingredients.length} items` : ''}
          </p>
          {loading ? (
            <div className="flex gap-2">
              {[60, 80, 50].map(w => (
                <div key={w} className="h-5 rounded-full animate-pulse" style={{ width: w, background: '#2A1804' }} />
              ))}
            </div>
          ) : (
            <div className="flex gap-1.5 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
              {visiblePills.map((ing, i) => (
                <span
                  key={i}
                  className="shrink-0 text-xs px-2 py-0.5 rounded-full"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(239,227,206,0.65)', fontSize: 10 }}
                >
                  {ing.name}
                </span>
              ))}
              {extraCount > 0 && (
                <span
                  className="shrink-0 text-xs px-2 py-0.5 rounded-full"
                  style={{ background: 'rgba(244,162,97,0.06)', border: '1px solid rgba(244,162,97,0.2)', color: '#F4A261', fontSize: 10 }}
                >
                  +{extraCount} more
                </span>
              )}
            </div>
          )}
        </div>

        {/* Dietary tags */}
        {(recipe.dietary_tags ?? []).length > 0 && (
          <div className="flex flex-wrap gap-1.5 px-3 py-2" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            {(recipe.dietary_tags ?? []).map(tag => (
              <span
                key={tag}
                className="text-xs px-2 py-0.5 rounded-full"
                style={{ background: 'rgba(130,142,111,0.12)', color: '#828E6F', border: '1px solid rgba(130,142,111,0.18)', fontSize: 9 }}
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* CTAs */}
        <div className="flex gap-2 px-3 py-3">
          <a
            href={`/recipes/${recipe.id}`}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold text-white"
            style={{ background: 'linear-gradient(135deg, #C85A2F, #E8834A)', boxShadow: '0 3px 10px rgba(200,90,47,0.35)' }}
          >
            ♥ Save to plan
          </a>
          <a
            href={`/recipes/${recipe.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center px-3 py-2 rounded-lg text-xs font-semibold"
            style={{ border: '1px solid rgba(244,162,97,0.25)', color: '#F4A261', background: 'rgba(244,162,97,0.05)', whiteSpace: 'nowrap' }}
          >
            Full recipe →
          </a>
        </div>
      </div>
    </div>
  );
}
