"use client";

import { useRouter } from "next/navigation";
import { useState, useCallback, useEffect } from "react";
import { Bookmark, BookmarkCheck, Clock, ChefHat, Gauge } from "lucide-react";
import type { Recipe } from "@/lib/types";
import { RecipeImage } from "@/components/recipe-image";
import { motion } from "framer-motion";

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);
  return reduced;
}

interface RecipeCardProps {
  recipe: Recipe;
  featured?: boolean;
  /** 0–5 community taste rating; null / undefined = no rating */
  rating?: number | null;
  /** Whether this recipe matches the user's current meal plan */
  mealPlanMatch?: boolean;
  /** Index in a list — used to stagger entrance animations */
  index?: number;
}

// ── Chef Hat Rating ───────────────────────────────────────────
function ChefHatRating({ value }: { value: number }) {
  const filled = Math.round(Math.max(0, Math.min(5, value)));
  return (
    <div className="flex items-center gap-0.5" aria-label={`Rating: ${filled} out of 5`}>
      {Array.from({ length: 5 }, (_, i) => (
        <ChefHat
          key={i}
          style={{
            width: 14,
            height: 14,
            color: i < filled ? "var(--wc-accent-saffron, #F4A261)" : "rgba(255,255,255,0.2)",
            fill: i < filled ? "var(--wc-accent-saffron, #F4A261)" : "none",
            flexShrink: 0,
          }}
        />
      ))}
    </div>
  );
}

// ── Difficulty badge colour ───────────────────────────────────
function difficultyColor(level: string | null | undefined): string {
  switch (level) {
    case "easy":   return "var(--wc-sage, #73be59)";
    case "medium": return "var(--wc-gold, #ff8b61)";
    case "hard":   return "var(--wc-terracotta, #749df7)";
    default:       return "rgba(255,255,255,0.55)";
  }
}

export function RecipeCard({ recipe, featured = false, rating, mealPlanMatch, index = 0 }: RecipeCardProps) {
  const router = useRouter();
  const [saved, setSaved] = useState(false);
  const [pulseKey, setPulseKey] = useState(0);
  const reduced = usePrefersReducedMotion();

  const totalTime = (recipe.prep_time_minutes ?? 0) + (recipe.cook_time_minutes ?? 0);
  const isPremium = recipe.is_premium;
  const difficulty = (recipe as Recipe & { difficulty_level?: string | null }).difficulty_level;

  function handleClick() {
    router.push(`/recipes/${recipe.id}`);
  }

  const handleSave = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setSaved((v) => !v);
    setPulseKey((k) => k + 1);
  }, []);

  return (
    <motion.div
      role="link"
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={(e) => e.key === "Enter" && handleClick()}
      className="recipe-card-hover rounded-2xl overflow-hidden cursor-pointer relative"
      style={{
        border: `1px solid ${isPremium ? "#C9A84C50" : "#3A2416"}`,
        background: "var(--wc-floor, #1F1B19)",
        aspectRatio: featured ? "16/9" : "3/4",
      }}
      initial={reduced ? false : { opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.32, delay: index * 0.06, ease: [0.22, 1, 0.36, 1] }}
    >
      {/* Full-bleed hero image */}
      <div className="absolute inset-0">
        <RecipeImage
          recipeId={recipe.id}
          imageUrl={recipe.image_url}
          title={recipe.title}
          cuisine={(recipe as Recipe & { cuisine_type?: string | null }).cuisine_type}
          dietaryTags={recipe.dietary_tags}
        />
      </div>

      {/* Image scrim — spec-compliant gradient */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "linear-gradient(to top, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.3) 40%, transparent 70%)",
        }}
      />

      {/* Premium badge — top-left */}
      {isPremium && (
        <div className="absolute top-2 left-2 z-10">
          <span
            className="text-xs px-2 py-0.5 rounded-full font-bold backdrop-blur-sm"
            style={{ background: "rgba(201,168,76,0.9)", color: "#fff" }}
          >
            ★ Premium
          </span>
        </div>
      )}

      {/* Meal Plan Match badge — top-right (if applicable) */}
      {mealPlanMatch && (
        <div className="absolute top-2 right-2 z-10">
          <span
            className="text-xs px-2 py-0.5 rounded-full font-bold backdrop-blur-sm"
            style={{
              background: "rgba(115,190,89,0.85)",
              color: "#fff",
            }}
          >
            Plan Match
          </span>
        </div>
      )}

      {/* Save icon — bottom-right, 44x44 touch target */}
      <button
        key={`save-${pulseKey}`}
        type="button"
        aria-label={saved ? "Unsave recipe" : "Save recipe"}
        onClick={handleSave}
        className={`absolute bottom-2 right-2 flex items-center justify-center rounded-full z-10 transition-colors${saved ? " save-icon-pulse" : ""}`}
        style={{
          width: 44,
          height: 44,
          background: saved ? "rgba(176,125,86,0.92)" : "rgba(20,12,6,0.72)",
          backdropFilter: "blur(6px)",
          border: `1px solid ${saved ? "rgba(176,125,86,0.6)" : "rgba(255,255,255,0.08)"}`,
        }}
      >
        {saved
          ? <BookmarkCheck style={{ width: 18, height: 18, color: "#fff" }} />
          : <Bookmark style={{ width: 18, height: 18, color: "rgba(255,255,255,0.75)" }} />
        }
      </button>

      {/* Bottom content — always visible */}
      <div className="absolute inset-x-0 bottom-0 px-3 pb-3 z-[6] flex flex-col gap-1.5">
        {/* Metadata row — always visible */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {totalTime > 0 && (
            <span
              className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full"
              style={{
                background: "rgba(0,0,0,0.45)",
                color: "rgba(255,255,255,0.85)",
                backdropFilter: "blur(4px)",
              }}
            >
              <Clock style={{ width: 10, height: 10 }} />
              {totalTime} min
            </span>
          )}
          {difficulty && (
            <span
              className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full"
              style={{
                background: "rgba(0,0,0,0.45)",
                color: difficultyColor(difficulty),
                backdropFilter: "blur(4px)",
              }}
            >
              <Gauge style={{ width: 10, height: 10 }} />
              {difficulty}
            </span>
          )}
        </div>

        {/* Title */}
        <h3
          className="font-bold leading-snug line-clamp-2 drop-shadow-sm"
          style={{
            color: "#EFE3CE",
            fontSize: featured ? "2rem" : "0.875rem",
            fontFamily: featured
              ? "'Libre Baskerville', Georgia, serif"
              : "inherit",
          }}
        >
          {recipe.title}
        </h3>

        {/* Description */}
        {recipe.description && (
          <p
            className="text-xs leading-snug line-clamp-2 mt-0.5"
            style={{
              color: "rgba(239,227,206,0.65)",
              textShadow: "0 1px 3px rgba(0,0,0,0.6)",
            }}
          >
            {recipe.description}
          </p>
        )}

        {/* Chef Hat rating — always shown when rating is available */}
        {typeof rating === "number" && rating > 0 && (
          <ChefHatRating value={rating} />
        )}
      </div>
    </motion.div>
  );
}
