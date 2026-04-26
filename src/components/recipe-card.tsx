"use client";

import { useRouter } from "next/navigation";
import { useState, useCallback, useEffect } from "react";
import { Bookmark, BookmarkCheck, Clock, ChefHat, Gauge } from "lucide-react";
import { ReportButton } from "@/components/report-button";
import { WcBadge } from "@/components/wc-badge";
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
  /** WC 2026 nation code — renders a badge linking to the passport page */
  wcNationCode?: string;
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

export function RecipeCard({ recipe, featured = false, rating, mealPlanMatch, index = 0, wcNationCode }: RecipeCardProps) {
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
      className="rc-card recipe-card-hover cursor-pointer"
      style={{
        borderColor: isPremium ? "rgba(201,168,76,0.32)" : "var(--rc-rim, #3A3430)",
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

      {/* Image scrim — camel-beige token */}
      <div className="rc-card__scrim absolute inset-0 pointer-events-none" />

      {/* Premium badge — top-left */}
      {isPremium && (
        <div className="absolute top-2 left-2 z-10">
          <span className="rc-card__badge rc-card__badge--premium backdrop-blur-sm">
            ★ Premium
          </span>
        </div>
      )}

      {/* Meal Plan Match badge — top-right */}
      {mealPlanMatch && (
        <div className="absolute top-2 right-2 z-10">
          <span
            className="rc-card__badge backdrop-blur-sm"
            style={{ background: "rgba(115,190,89,0.85)", color: "#fff" }}
          >
            Plan Match
          </span>
        </div>
      )}

      {/* WC 2026 badge — top-right, below mealPlanMatch badge */}
      {wcNationCode && <WcBadge nationCode={wcNationCode} />}

      {/* Save icon — 44×44 touch target */}
      <button
        key={`save-${pulseKey}`}
        type="button"
        aria-label={saved ? "Unsave recipe" : "Save recipe"}
        onClick={handleSave}
        className={`rc-card__save absolute bottom-2 right-2 flex items-center justify-center z-10 transition-colors${saved ? " save-icon-pulse" : ""}`}
        data-saved={saved ? "true" : "false"}
        style={{ width: 44, height: 44 }}
      >
        {saved
          ? <BookmarkCheck style={{ width: 18, height: 18, color: "#fff" }} />
          : <Bookmark style={{ width: 18, height: 18, color: "rgba(255,255,255,0.75)" }} />
        }
      </button>

      {/* Report bug button — bottom-left */}
      <div className="absolute bottom-2 left-2 z-10">
        <ReportButton recipeId={recipe.id} recipeName={recipe.title} />
      </div>

      {/* Bottom content */}
      <div className="absolute inset-x-0 bottom-0 px-3 pb-3 z-[6] flex flex-col gap-1.5">
        {/* Dietary + cuisine tags — always visible above time chips */}
        {((recipe.dietary_tags && recipe.dietary_tags.length > 0) ||
          (recipe as Recipe & { cuisine_type?: string | null }).cuisine_type) && (
          <div className="rc-card__tags">
            {(recipe as Recipe & { cuisine_type?: string | null }).cuisine_type && (
              <span className="rc-card__tag">
                {(recipe as Recipe & { cuisine_type?: string | null }).cuisine_type}
              </span>
            )}
            {(recipe.dietary_tags ?? []).slice(0, 2).map((tag) => (
              <span
                key={tag}
                className={`rc-card__tag${tag === "vegan" || tag === "vegetarian" ? " rc-card__tag--vegan" : tag === "gluten-free" ? " rc-card__tag--gluten" : ""}`}
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Metadata chips */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {totalTime > 0 && (
            <span
              className="rc-card__meta inline-flex items-center gap-1 font-medium px-2 py-0.5 rounded-full"
              style={{ background: "rgba(0,0,0,0.48)", backdropFilter: "blur(4px)", color: "rgba(255,255,255,0.88)" }}
            >
              <Clock style={{ width: 10, height: 10 }} />
              {totalTime} min
            </span>
          )}
          {difficulty && (
            <span
              className="rc-card__meta inline-flex items-center gap-1 font-medium px-2 py-0.5 rounded-full"
              style={{ background: "rgba(0,0,0,0.48)", color: difficultyColor(difficulty), backdropFilter: "blur(4px)" }}
            >
              <Gauge style={{ width: 10, height: 10 }} />
              {difficulty}
            </span>
          )}
        </div>

        {/* Title — scales between card and featured via token */}
        <h3
          className={featured ? "rc-card__title rc-card__title--featured line-clamp-2 drop-shadow-sm" : "rc-card__title line-clamp-2 drop-shadow-sm"}
        >
          {recipe.title}
        </h3>

        {/* Nourishing description — always shown below recipe name */}
        {recipe.description && (
          <p className="rc-card__desc">
            {recipe.description}
          </p>
        )}

        {typeof rating === "number" && rating > 0 && (
          <ChefHatRating value={rating} />
        )}
      </div>
    </motion.div>
  );
}
