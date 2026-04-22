"use client";

/**
 * RecipeImage
 *
 * Drop-in <img> replacement that guarantees no broken image is ever shown.
 *
 * State machine:
 *   1. src      → tries recipe.image_url (or provided src)
 *   2. fallback → tries category-matched Unsplash photo
 *   3. placeholder → renders styled div with food category icon
 *
 * Usage:
 *   <RecipeImage
 *     recipeId={id}
 *     imageUrl={recipe.image_url}
 *     title={recipe.title}
 *     cuisine={recipe.cuisine_type}
 *     dietaryTags={recipe.dietary_tags}
 *     className="w-full h-full object-cover"
 *   />
 */

import { useState } from "react";
import { getCategoryFallback, getPlaceholderConfig } from "@/lib/recipe-image";

interface Props {
  recipeId: string;
  imageUrl?: string | null;
  title: string;
  cuisine?: string | null;
  dietaryTags?: string[] | null;
  className?: string;
  style?: React.CSSProperties;
  alt?: string;
}

type Stage = "primary" | "fallback" | "placeholder";

export function RecipeImage({
  recipeId,
  imageUrl,
  title,
  cuisine,
  dietaryTags,
  className = "w-full h-full object-cover",
  style,
  alt,
}: Props) {
  const fallbackUrl = getCategoryFallback(recipeId, title, cuisine, dietaryTags);
  const [stage, setStage] = useState<Stage>(imageUrl ? "primary" : "fallback");
  const [src, setSrc] = useState(imageUrl ?? fallbackUrl);

  function handleError() {
    if (stage === "primary") {
      setStage("fallback");
      setSrc(fallbackUrl);
    } else {
      setStage("placeholder");
    }
  }

  if (stage === "placeholder") {
    const config = getPlaceholderConfig(title, cuisine);
    return (
      <div
        className="w-full h-full flex flex-col items-center justify-center gap-1 select-none"
        style={{ background: config.bg, ...style }}
        aria-label={alt ?? title}
      >
        <span style={{ fontSize: 32 }}>{config.icon}</span>
        <span className="text-xs font-medium" style={{ color: "#A69180" }}>{config.label}</span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt ?? title}
      className={className}
      style={style}
      onError={handleError}
    />
  );
}
