'use client';

import { useDraggable, useDroppable } from '@dnd-kit/core';
import { RecipeImage } from '@/components/recipe-image';
import type { ProposedEntry } from '@/lib/weave-solver';

interface Props {
  entry: ProposedEntry;
  recipe?: { image_url: string | null; focal_x?: number | null; focal_y?: number | null };
  onTap: () => void;
  onPin?: () => void;
  onRemove: () => void;
  tension?: number;
  conflictReasons?: string[];
  hasLeftoverDescendant?: boolean;
}

export function WeaveCell({ entry, recipe, onTap, onPin, onRemove, tension = 0, conflictReasons = [], hasLeftoverDescendant = false }: Props) {
  const isPinned = entry.source === 'pinned' && !entry.is_leftover;
  const isLeftover = entry.is_leftover;
  const isSuggestion = entry.source === 'suggestion';

  const drag = useDraggable({ id: entry.clientid, data: { kind: 'cell' } });
  const drop = useDroppable({ id: entry.clientid, data: { kind: 'cell' } });

  const borderStyle = isSuggestion ? 'dashed' : 'solid';
  const borderColor = isPinned ? '#E67E22' : isSuggestion ? '#3A2A1B' : '#4A3826';
  const imageOpacity = isSuggestion ? 0.88 : 1;
  const bgTint = isLeftover ? 'rgba(122, 163, 80, 0.10)' : '#15100B';

  const setRefs = (el: HTMLDivElement | null) => {
    drag.setNodeRef(el);
    drop.setNodeRef(el);
  };

  return (
    <div
      ref={setRefs}
      {...drag.attributes}
      {...drag.listeners}
      role="button"
      tabIndex={0}
      aria-label={`${entry.recipe_title} — tap to swap`}
      onClick={() => { if (!drag.isDragging) onTap(); }}
      onKeyDown={e => { if (e.key === 'Enter') onTap(); }}
      className="group relative flex flex-col gap-1.5 p-2 rounded-xl transition-colors"
      style={{
        border: `1px ${borderStyle} ${borderColor}`,
        background: bgTint,
        minHeight: 88,
        opacity: drag.isDragging ? 0.4 : 1,
        outline: drop.isOver && !drag.isDragging ? '2px solid #E67E22' : undefined,
        outlineOffset: drop.isOver && !drag.isDragging ? -2 : undefined,
        touchAction: 'none',
        cursor: drag.isDragging ? 'grabbing' : 'grab',
      }}
    >
      <div className="relative w-full rounded-lg overflow-hidden" style={{ height: 56, background: '#241A11', opacity: imageOpacity }}>
        <RecipeImage
          recipeId={entry.clientid}
          imageUrl={recipe?.image_url ?? null}
          title={entry.recipe_title}
          focal_x={recipe?.focal_x}
          focal_y={recipe?.focal_y}
          className="w-full h-full"
        />
      </div>
      <div className="flex items-start gap-1">
        {isPinned && <span aria-label="pinned" title="Pinned" style={{ fontSize: 11 }}>📌</span>}
        {isSuggestion && <span aria-label="suggestion" title="Suggestion" style={{ color: '#E67E22', fontSize: 11 }}>✨</span>}
        {isLeftover && <span aria-label="leftover" title="Leftover" style={{ color: '#AEB873', fontSize: 11 }}>♻</span>}
        <p className="leading-tight line-clamp-2 flex-1" style={{ fontSize: 12.5, fontWeight: 600, color: '#EFE3CE' }}>
          {entry.recipe_title}
        </p>
        {hasLeftoverDescendant && (
          <span
            className="text-xs px-1.5 py-0.5 rounded"
            style={{ background: 'rgba(122, 163, 80, 0.2)', color: '#7AA350' }}
            title="This is the cook day; one leftover slot uses the same dish"
          >
            🍳 2×
          </span>
        )}
      </div>
      {tension > 0 && conflictReasons.length > 0 && (
        <div
          className="absolute -bottom-0.5 left-1 right-1 h-0.5 rounded-full"
          style={{ background: '#F2C94C', opacity: Math.min(1, 0.4 + tension * 0.6) }}
          title={`Anti-repeat: ${conflictReasons.join('; ')}`}
        />
      )}
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
