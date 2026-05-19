'use client';

import { useEffect } from 'react';
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
    </>
  );
}
