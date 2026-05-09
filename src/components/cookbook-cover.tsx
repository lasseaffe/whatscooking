// src/components/cookbook-cover.tsx
"use client";

import Image from "next/image";
import type { CookbookFont } from "@/lib/cookbook-types";

const FONT_CLASS: Record<CookbookFont, string> = {
  serif:  "font-serif",
  sans:   "font-sans",
  script: "font-serif italic",
};

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
  size?: "card" | "hero";
}

export function CookbookCover({ cookbook, recipeCount, creatorName, creatorAvatar, size = "card" }: CookbookCoverProps) {
  const isHero = size === "hero";
  const fontClass = FONT_CLASS[(cookbook.title_font as CookbookFont)] ?? FONT_CLASS.serif;

  return (
    <div
      className={`relative overflow-hidden rounded-2xl ${isHero ? "h-80 md:h-[420px]" : "h-52"} w-full`}
      style={{ background: cookbook.cover_image_url ? undefined : cookbook.theme_color }}
    >
      {cookbook.cover_image_url && (
        <Image
          src={cookbook.cover_image_url}
          alt={cookbook.title}
          fill
          className="object-cover"
          sizes={isHero ? "100vw" : "400px"}
        />
      )}
      <div className="absolute inset-0" style={{ background: `${cookbook.theme_color}cc` }} />
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
