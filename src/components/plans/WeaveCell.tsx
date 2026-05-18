'use client';

import { RecipeImage } from '@/components/recipe-image';
import type { ProposedEntry } from '@/lib/weave-solver';

interface Props {
  entry: ProposedEntry;
  recipe?: { image_url: string | null; focal_x?: number | null; focal_y?: number | null };
  onTap: () => void;
  onPin?: () => void;
  onRemove: () => void;
}

export function WeaveCell({ entry, recipe, onTap, onPin, onRemove }: Props) {
  const isPinned = entry.source === 'pinned' && !entry.is_leftover;
  const isLeftover = entry.is_leftover;
  const isSuggestion = entry.source === 'suggestion';

  const borderStyle = isPinned ? 'solid' : isSuggestion ? 'dashed' : 'solid';
  const borderColor = isPinned ? '#E67E22' : isSuggestion ? '#3A2A1A' : '#6B4E36';
  const imageOpacity = isSuggestion ? 0.85 : 1;
  const bgTint = isLeftover ? 'rgba(74, 104, 48, 0.15)' : '#1A120A';

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={`${entry.recipe_title} — tap to swap`}
      onClick={onTap}
      onKeyDown={e => { if (e.key === 'Enter') onTap(); }}
      className="group relative flex flex-col gap-1 p-1.5 rounded-md cursor-pointer transition-colors hover:bg-[#2A1F14]"
      style={{ border: `1px ${borderStyle} ${borderColor}`, background: bgTint, minHeight: 80 }}
    >
      <div className="relative w-full h-12 rounded overflow-hidden" style={{ background: '#2A1F14', opacity: imageOpacity }}>
        <RecipeImage
          recipeId={entry.clientid}
          imageUrl={recipe?.image_url ?? null}
          title={entry.recipe_title}
          focal_x={recipe?.focal_x}
          focal_y={recipe?.focal_y}
          className="w-full h-full"
        />
      </div>
      <div className="flex items-center gap-1">
        {isPinned && <span aria-label="pinned" title="Pinned">📌</span>}
        {isSuggestion && <span aria-label="suggestion" title="Suggestion" style={{ color: '#E67E22' }}>✨</span>}
        {isLeftover && <span aria-label="leftover" title="Leftover" style={{ color: '#7AA350' }}>♻</span>}
        <p className="text-xs leading-tight line-clamp-2 flex-1" style={{ color: '#EFE3CE' }}>
          {entry.recipe_title}
        </p>
      </div>
      <button
        onClick={e => { e.stopPropagation(); onRemove(); }}
        aria-label={`Remove ${entry.recipe_title}`}
        className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity rounded-full p-0.5"
        style={{ background: '#2A1F14' }}
      >
        <span className="block w-3 h-3 text-xs leading-3" style={{ color: '#E67E22' }}>×</span>
      </button>
      {isSuggestion && onPin && (
        <button
          onClick={e => { e.stopPropagation(); onPin(); }}
          aria-label="Pin this suggestion"
          className="absolute bottom-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity text-xs px-1.5 py-0.5 rounded"
          style={{ background: '#E67E22', color: '#1A120A' }}
        >
          📌
        </button>
      )}
    </div>
  );
}
