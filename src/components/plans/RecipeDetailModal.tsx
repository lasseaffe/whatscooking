'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { RecipeImage } from '@/components/recipe-image';

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
  notes?: string | null;
}

function useIngredients(recipeId: string | null) {
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!recipeId) return;
    setIngredients([]);
    setLoading(true);
    const supabase = createClient();
    Promise.resolve(supabase
      .from('recipes')
      .select('ingredients')
      .eq('id', recipeId)
      .single())
      .then(({ data }) => {
        const raw = (data?.ingredients ?? []) as unknown[];
        setIngredients(
          raw.map((r: unknown) => {
            if (typeof r === 'string') return { name: r };
            const obj = r as Record<string, unknown>;
            return {
              name: String(obj.name ?? obj.ingredient ?? ''),
              quantity: obj.quantity != null ? String(obj.quantity) : null,
              unit: obj.unit != null ? String(obj.unit) : null,
              notes: obj.notes != null ? String(obj.notes) : null,
            };
          }).filter(i => i.name)
        );
        setLoading(false);
      })
      .catch(() => { setLoading(false); });
  }, [recipeId]);

  return { ingredients, loading };
}

const SHOW_LIMIT = 7;

function IngredientsSection({ recipeId }: { recipeId: string }) {
  const { ingredients, loading } = useIngredients(recipeId);
  const [expanded, setExpanded] = useState(false);

  const visible = expanded ? ingredients : ingredients.slice(0, SHOW_LIMIT);
  const hidden = ingredients.length - SHOW_LIMIT;

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold" style={{ color: '#EFE3CE' }}>
          Ingredients{ingredients.length > 0 ? ` (${ingredients.length})` : ''}
        </h3>
      </div>
      <div className="h-px mb-3" style={{ background: '#3A3430' }} />

      {loading && (
        <div className="flex flex-col gap-2">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-4 rounded animate-pulse" style={{ background: '#3A3430', width: `${60 + i * 10}%` }} />
          ))}
        </div>
      )}

      {!loading && visible.map((ing, i) => (
        <div key={`${i}-${ing.name}`} className="flex justify-between py-1.5 text-sm border-b" style={{ borderColor: '#3A3430' }}>
          <span style={{ color: '#EFE3CE' }}>{ing.name}{ing.notes ? ` (${ing.notes})` : ''}</span>
          <span className="ml-4 shrink-0 text-xs" style={{ color: '#A08060' }}>
            {[ing.quantity, ing.unit].filter(Boolean).join(' ') || ''}
          </span>
        </div>
      ))}

      {!loading && !expanded && hidden > 0 && (
        <button
          className="mt-2 text-xs"
          style={{ color: '#F4A261' }}
          onClick={() => setExpanded(true)}
        >
          + {hidden} more
        </button>
      )}
    </div>
  );
}

export function RecipeDetailModal({ recipe, onClose }: Props) {
  useEffect(() => {
    if (!recipe) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [recipe, onClose]);

  if (!recipe) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}
    >
      <div
        className="relative w-full sm:max-w-2xl max-h-[90vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl"
        style={{ background: 'var(--wc-surface-1, #2C2724)', border: '1px solid #3A3430' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-10 flex items-center justify-center w-8 h-8 rounded-full text-sm"
          style={{ background: 'rgba(0,0,0,0.4)', color: '#A08060' }}
          aria-label="Close"
        >
          <span aria-hidden="true">✕</span>
        </button>

        {/* Hero image */}
        <div className="w-full" style={{ height: 240, overflow: 'hidden', borderRadius: '1rem 1rem 0 0' }}>
          <RecipeImage
            recipeId={recipe.id}
            imageUrl={recipe.image_url}
            title={recipe.title}
            cuisine={recipe.cuisine_type}
            focal_x={recipe.focal_x}
            focal_y={recipe.focal_y}
            className="w-full h-full object-cover"
          />
        </div>

        {/* Content */}
        <div className="px-5 py-4 flex flex-col gap-4">
          <ModalContent recipe={recipe} />
        </div>
      </div>
    </div>
  );
}

function ModalContent({ recipe }: { recipe: DetailRecipe }) {
  const totalMinutes =
    recipe.total_time_minutes ??
    (((recipe.prep_time_minutes ?? 0) + (recipe.cook_time_minutes ?? 0)) || null);

  return (
    <>
      {/* Cuisine label + title + description */}
      {recipe.cuisine_type && (
        <p className="text-xs uppercase font-semibold tracking-widest" style={{ color: '#F4A261' }}>
          {recipe.cuisine_type}
        </p>
      )}
      <div>
        <h2 className="text-xl font-semibold leading-snug" style={{ fontFamily: "'Libre Baskerville', Georgia, serif", color: '#EFE3CE' }}>
          {recipe.title}
        </h2>
        {recipe.description && (
          <p className="mt-1 text-sm italic" style={{ color: '#7A5A40' }}>
            {recipe.description}
          </p>
        )}
      </div>

      {/* Stat pills */}
      <div className="grid grid-cols-4 gap-2">
        {[
          { label: 'Time', value: totalMinutes ? `${totalMinutes} min` : '—' },
          { label: 'Calories', value: recipe.calories ? `${recipe.calories} kcal` : '—' },
          { label: 'Serves', value: recipe.servings ? `${recipe.servings}` : '—' },
          { label: 'Cuisine', value: recipe.cuisine_type ?? '—' },
        ].map(({ label, value }) => (
          <div
            key={label}
            className="flex flex-col items-center py-2 px-1 rounded-lg text-center"
            style={{ background: '#3A3430' }}
          >
            <span className="text-xs" style={{ color: '#6B4A32' }}>{label}</span>
            <span className="text-xs font-semibold mt-0.5 truncate w-full text-center" style={{ color: '#A08060' }}>{value}</span>
          </div>
        ))}
      </div>

      {/* Dietary tags */}
      {(recipe.dietary_tags ?? []).length > 0 && (
        <div className="flex flex-wrap gap-2">
          {(recipe.dietary_tags ?? []).map(tag => (
            <span
              key={tag}
              className="text-xs px-2 py-0.5 rounded-full"
              style={{ background: '#3A3430', color: '#EFE3CE' }}
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Ingredients */}
      <IngredientsSection recipeId={recipe.id} />

      {/* View full recipe link */}
      <a
        href={`/recipes/${recipe.id}`}
        className="flex items-center justify-center w-full py-2.5 rounded-lg text-sm font-medium border transition-colors"
        style={{ borderColor: '#F4A261', color: '#F4A261' }}
      >
        View full recipe →
      </a>
    </>
  );
}
