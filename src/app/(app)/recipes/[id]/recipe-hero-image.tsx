"use client";

import { RecipeImage } from "@/components/recipe-image";

interface Props {
  recipeId: string;
  imageUrl?: string | null;
  title: string;
  cuisine?: string | null;
  dietaryTags?: string[] | null;
  sourceUrl?: string | null;
  sourceName?: string | null;
}

export function RecipeHeroImage({ recipeId, imageUrl, title, cuisine, dietaryTags, sourceUrl, sourceName }: Props) {
  return (
    <div className="overflow-hidden relative w-full h-full">
      <RecipeImage
        recipeId={recipeId}
        imageUrl={imageUrl}
        title={title}
        cuisine={cuisine}
        dietaryTags={dietaryTags}
      />
      {/* Scrim — spec gradient */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: "linear-gradient(to top, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.3) 40%, transparent 70%)" }}
      />

      {/* Title overlaid on the hero — recipe presentation style */}
      <div className="absolute bottom-0 left-0 right-0 px-5 pb-6">
        <h1
          className="font-serif-display leading-tight mb-2"
          style={{ color: "#F5EDD8", fontSize: "clamp(1.4rem, 4vw, 2rem)", textShadow: "0 2px 16px rgba(0,0,0,0.6)" }}
        >
          {title}
        </h1>
        <div className="flex items-center gap-2 flex-wrap">
          {cuisine && (
            <span className="text-xs font-medium px-2.5 py-1 rounded-full" style={{ background: "rgba(200,82,42,0.25)", color: "#C8522A", border: "1px solid rgba(200,82,42,0.3)", backdropFilter: "blur(4px)" }}>
              {cuisine}
            </span>
          )}
          {(dietaryTags ?? []).slice(0, 2).map((tag) => (
            <span key={tag} className="text-xs px-2.5 py-1 rounded-full" style={{ background: "rgba(13,9,7,0.5)", color: "#8A6A4A", border: "1px solid rgba(58,36,22,0.6)", backdropFilter: "blur(4px)" }}>
              {tag}
            </span>
          ))}
        </div>
      </div>

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
    </div>
  );
}
