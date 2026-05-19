"use client";

import { RecipeImage } from "@/components/recipe-image";
import { FocalPointEditor } from "@/components/focal-point-editor";

interface Props {
  recipeId: string;
  imageUrl?: string | null;
  title: string;
  cuisine?: string | null;
  dietaryTags?: string[] | null;
  sourceUrl?: string | null;
  sourceName?: string | null;
  focal_x?: number | null;
  focal_y?: number | null;
  /** Show the "Adjust crop" button for manual focal-point editing */
  editable?: boolean;
}

export function RecipeHeroImage({ recipeId, imageUrl, title, cuisine, dietaryTags, sourceUrl, sourceName, focal_x, focal_y, editable }: Props) {
  const vignetteAndBadge = (
    <>
      {/* Subtle vignette for depth */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0.08) 0%, transparent 40%, rgba(0,0,0,0.18) 100%)" }}
      />
      {sourceUrl && (
        <a
          href={sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="absolute top-4 right-4 flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg"
          style={{ background: "rgba(13,9,7,0.75)", color: "#8A6A4A", backdropFilter: "blur(4px)" }}
        >
          <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6m0 0v6m0-6L10 14" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          {sourceName ?? "Source"}
        </a>
      )}
    </>
  );

  if (editable) {
    return (
      <FocalPointEditor
        recipeId={recipeId}
        imageUrl={imageUrl}
        title={title}
        cuisine={cuisine}
        dietaryTags={dietaryTags}
        initialFocalX={focal_x}
        initialFocalY={focal_y}
        className="overflow-hidden relative w-full h-full"
      >
        {vignetteAndBadge}
      </FocalPointEditor>
    );
  }

  return (
    <div className="overflow-hidden relative w-full h-full">
      <RecipeImage
        recipeId={recipeId}
        imageUrl={imageUrl}
        title={title}
        cuisine={cuisine}
        dietaryTags={dietaryTags}
        focal_x={focal_x}
        focal_y={focal_y}
      />
      {vignetteAndBadge}
    </div>
  );
}
