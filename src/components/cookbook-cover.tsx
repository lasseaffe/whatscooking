// src/components/cookbook-cover.tsx
"use client";

import Image from "next/image";
import type { CookbookFont } from "@/lib/cookbook-types";

const FONT_CLASS: Record<CookbookFont, string> = {
  serif:  "font-serif",
  sans:   "font-sans",
  script: "font-serif italic",
};

// Deterministic emoji from title keywords
function coverEmoji(title: string): string {
  const t = title.toLowerCase();
  if (/smoke|fire|grill|bbq|char/.test(t)) return "🔥";
  if (/plant|veg|green|salad|leaf/.test(t)) return "🥗";
  if (/fish|sea|ocean|salmon|tuna|shrimp/.test(t)) return "🐟";
  if (/pasta|italian|noodle/.test(t)) return "🍝";
  if (/sweet|dessert|bake|cake|cookie/.test(t)) return "🍰";
  if (/spice|curry|asian|thai|indian/.test(t)) return "🌶️";
  if (/chicken|poultry|turkey/.test(t)) return "🍗";
  if (/bread|sourdough|loaf/.test(t)) return "🍞";
  if (/soup|stew|broth/.test(t)) return "🍲";
  return "🍽️";
}

interface CookbookCoverProps {
  cookbook: {
    title: string;
    tagline?: string | null;
    cover_image_url?: string | null;
    theme_color: string;
    title_font: CookbookFont | string;
    price: number;
  };
  recipeCount?: number;
  creatorName?: string | null;
  creatorAvatar?: string | null;
  recipeImages?: string[];   // first 4 recipe image URLs for hover collage
  size?: "card" | "hero";
}

export function CookbookCover({
  cookbook, recipeCount, creatorName, creatorAvatar, recipeImages = [], size = "card",
}: CookbookCoverProps) {
  const isHero = size === "hero";
  const fontClass = FONT_CLASS[(cookbook.title_font as CookbookFont)] ?? FONT_CLASS.serif;
  const hasUploadedCover = !!cookbook.cover_image_url;
  const collageImages = recipeImages.filter(Boolean).slice(0, 4);
  const canCollage = !hasUploadedCover && collageImages.length >= 2;

  return (
    <div
      className={`relative overflow-hidden rounded-2xl group ${isHero ? "h-80 md:h-[420px]" : "h-52"} w-full`}
      style={{ background: cookbook.theme_color }}
    >
      {/* Uploaded cover image */}
      {hasUploadedCover && (
        <Image
          src={cookbook.cover_image_url!}
          alt={cookbook.title}
          fill
          className="object-cover"
          sizes={isHero ? "100vw" : "400px"}
        />
      )}

      {/* Gradient + emoji fallback (default when no uploaded cover) */}
      {!hasUploadedCover && (
        <div
          className={`absolute inset-0 flex items-center justify-center text-6xl transition-opacity duration-300 ${canCollage ? "group-hover:opacity-0" : ""}`}
          style={{
            background: `linear-gradient(160deg, ${cookbook.theme_color}dd, ${cookbook.theme_color})`,
          }}
        >
          {coverEmoji(cookbook.title)}
        </div>
      )}

      {/* Hover collage — 2×2 grid of recipe images */}
      {canCollage && (
        <div className="absolute inset-0 grid grid-cols-2 grid-rows-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          {collageImages.map((url, i) => (
            <div key={i} className="relative overflow-hidden">
              <Image
                src={url}
                alt=""
                fill
                className="object-cover"
                sizes="200px"
              />
            </div>
          ))}
        </div>
      )}

      {/* Dark overlay for text legibility */}
      <div className="absolute inset-0" style={{ background: "rgba(0,0,0,0.35)" }} />

      {/* Text layer */}
      <div className="absolute inset-0 flex flex-col justify-end p-4 text-white">
        <span className="self-start mb-2 text-xs font-semibold px-2 py-0.5 rounded-full bg-white/20">
          {cookbook.price === 0 ? "Free" : `$${cookbook.price.toFixed(2)}`}
        </span>
        <h3 className={`${isHero ? "text-3xl" : "text-lg"} font-bold leading-tight ${fontClass}`}>
          {cookbook.title}
        </h3>
        {cookbook.tagline && (
          <p className="text-xs mt-1 opacity-80 line-clamp-1">{cookbook.tagline}</p>
        )}
        {(creatorName || recipeCount !== undefined) && (
          <div className="flex items-center gap-2 mt-2">
            {creatorAvatar && (
              <Image src={creatorAvatar} alt={creatorName ?? ""} width={20} height={20} className="rounded-full" />
            )}
            {creatorName && <span className="text-xs opacity-75">@{creatorName}</span>}
            {recipeCount !== undefined && (
              <span className="text-xs opacity-60 ml-auto">{recipeCount} recipes</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
