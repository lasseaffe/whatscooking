# Discover & Pantry Visual Overhaul Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restore full drag-to-swipe mechanics as a hero section in Discover, extract the swipe logic into a shared hook, and overhaul the Pantry page with a dark theme and simplified tab structure.

**Architecture:** Extract `useSwipeSession` hook from `SwipeClient` so both `HeroSwiper` (discover) and the standalone `SwipeClient` (/swipe) share the same logic. Shared card presentational components live in `src/components/swipe/swipe-cards.tsx`. Pantry gets dark-themed with `pantryView` inner sub-tab removed entirely.

**Tech Stack:** Next.js 15 App Router, React 19, TypeScript, Tailwind CSS, Lucide React, Supabase client

---

## File Map

| File | Action | Responsibility |
|---|---|---|
| `src/lib/hooks/use-swipe-session.ts` | Create | All swipe state, drag, filter, save logic |
| `src/components/swipe/swipe-cards.tsx` | Create | RecipeCard, RecipePreviewSheet, MatchScreen components |
| `src/app/(app)/discover/hero-swiper.tsx` | Create | Hero-height swiper for discover feed |
| `src/app/(app)/discover/swipe-section.tsx` | Delete | Replaced by hero-swiper |
| `src/app/(app)/discover/discover-feed-client.tsx` | Edit | Import HeroSwiper, remove SwipeSection |
| `src/app/(app)/swipe/swipe-client.tsx` | Edit | Thin wrapper using shared hook + cards |
| `src/app/(app)/pantry/pantry-client.tsx` | Edit | Tab restructure + dark theme |
| `src/app/(app)/pantry/page.tsx` | Edit | Remove initialHouseholdTags fetch + prop |

---

## Task 1: Create `useSwipeSession` hook

**Files:**
- Create: `src/lib/hooks/use-swipe-session.ts`

- [ ] **Step 1: Create the hooks directory and file**

```bash
mkdir -p src/lib/hooks
```

Then create `src/lib/hooks/use-swipe-session.ts` with the full content:

```ts
"use client";

import { useState, useRef, useCallback, useEffect, useMemo } from "react";

export type SwipeRecipe = {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  cuisine_type: string | null;
  dietary_tags: string[] | null;
  calories: number | null;
  prep_time_minutes: number | null;
  cook_time_minutes: number | null;
  dish_types: string[] | null;
  ingredients: { name: string; amount?: number | null; unit?: string | null }[] | null;
  instructions: string[] | null;
  servings: number | null;
  protein_g: number | null;
  carbs_g: number | null;
  fat_g: number | null;
  difficulty_level: "easy" | "medium" | "hard" | null;
};

export interface SwipeFilters {
  restrictions: string[];
  customAvoid: string[];
  difficultyFilter: "all" | "easy" | "medium" | "hard";
}

const SWIPE_THRESHOLD = 100;
const ROTATION_FACTOR = 0.08;
const TAP_THRESHOLD = 8;

export function useSwipeSession(
  recipes: SwipeRecipe[],
  initialSavedIds: string[] = [],
  filters: SwipeFilters = { restrictions: [], customAvoid: [], difficultyFilter: "all" }
) {
  const filteredRecipes = useMemo(() => {
    return recipes.filter((r) => {
      if (filters.restrictions.length > 0) {
        const tags = r.dietary_tags ?? [];
        if (!filters.restrictions.every((d) => tags.includes(d))) return false;
      }
      if (filters.customAvoid.length > 0) {
        const ingNames = (r.ingredients ?? []).map((i) => i.name.toLowerCase());
        if (filters.customAvoid.some((avoid) => ingNames.some((ing) => ing.includes(avoid)))) return false;
      }
      if (filters.difficultyFilter !== "all" && r.difficulty_level !== filters.difficultyFilter) return false;
      return true;
    });
  }, [recipes, filters.restrictions, filters.customAvoid, filters.difficultyFilter]);

  const filteredRef = useRef(filteredRecipes);
  filteredRef.current = filteredRecipes;

  const [deck, setDeck] = useState(() => [...filteredRecipes].sort(() => Math.random() - 0.5));
  const [liked, setLiked] = useState<SwipeRecipe[]>([]);
  const [skipped, setSkipped] = useState<SwipeRecipe[]>([]);
  const [done, setDone] = useState(false);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set(initialSavedIds));
  const [previewRecipe, setPreviewRecipe] = useState<SwipeRecipe | null>(null);

  useEffect(() => {
    const next = filteredRef.current.length > 0 ? filteredRef.current : recipes;
    setDeck([...next].sort(() => Math.random() - 0.5));
    setLiked([]);
    setSkipped([]);
    setDone(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.restrictions.join(","), filters.customAvoid.join(","), filters.difficultyFilter]);

  const [dragging, setDragging] = useState(false);
  const [dragX, setDragX] = useState(0);
  const [dragY, setDragY] = useState(0);
  const startX = useRef(0);
  const startY = useRef(0);
  const moved = useRef(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const [exiting, setExiting] = useState<"left" | "right" | null>(null);

  const currentCard = deck[deck.length - 1];
  const nextCard = deck[deck.length - 2];

  const commitSwipe = useCallback((dir: "left" | "right") => {
    if (!currentCard || exiting) return;
    setExiting(dir);
    setTimeout(() => {
      if (dir === "right") setLiked((prev) => [currentCard, ...prev]);
      else setSkipped((prev) => [currentCard, ...prev]);
      setDeck((prev) => prev.slice(0, -1));
      setExiting(null);
      setDragX(0);
      setDragY(0);
      if (deck.length === 1) setDone(true);
    }, 350);
  }, [currentCard, deck.length, exiting]);

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    if (exiting) return;
    setDragging(true);
    moved.current = false;
    startX.current = e.clientX;
    startY.current = e.clientY;
    cardRef.current?.setPointerCapture(e.pointerId);
  }, [exiting]);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragging) return;
    const dx = e.clientX - startX.current;
    const dy = e.clientY - startY.current;
    if (Math.abs(dx) > TAP_THRESHOLD || Math.abs(dy) > TAP_THRESHOLD) moved.current = true;
    setDragX(dx);
    setDragY(dy);
  }, [dragging]);

  const onPointerUp = useCallback(() => {
    if (!dragging) return;
    setDragging(false);
    if (!moved.current && currentCard) {
      setPreviewRecipe(currentCard);
      setDragX(0);
      setDragY(0);
      return;
    }
    if (dragX > SWIPE_THRESHOLD) commitSwipe("right");
    else if (dragX < -SWIPE_THRESHOLD) commitSwipe("left");
    else { setDragX(0); setDragY(0); }
  }, [dragging, currentCard, dragX, commitSwipe]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (previewRecipe) { if (e.key === "Escape") setPreviewRecipe(null); return; }
      if (e.key === "ArrowRight") commitSwipe("right");
      if (e.key === "ArrowLeft") commitSwipe("left");
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [commitSwipe, previewRecipe]);

  const cardStyle = useCallback((isTop: boolean): React.CSSProperties => {
    if (!isTop) return { transform: "scale(0.96) translateY(10px)", opacity: 0.85, zIndex: 1 };
    let tx = dragX, ty = dragY * 0.3, rotate = dragX * ROTATION_FACTOR;
    if (exiting === "right") { tx = 600; ty = -80; rotate = 20; }
    if (exiting === "left") { tx = -600; ty = -80; rotate = -20; }
    return {
      transform: `translate(${tx}px, ${ty}px) rotate(${rotate}deg)`,
      transition: dragging ? "none" : exiting ? "transform 0.35s cubic-bezier(0.4,0,0.2,1)" : "transform 0.25s ease-out",
      zIndex: 2,
      cursor: dragging ? "grabbing" : "grab",
      userSelect: "none",
    };
  }, [dragX, dragY, exiting, dragging]);

  const toggleSave = useCallback(async (recipe: SwipeRecipe) => {
    const alreadySaved = savedIds.has(recipe.id);
    setSavedIds((prev) => {
      const next = new Set(prev);
      alreadySaved ? next.delete(recipe.id) : next.add(recipe.id);
      return next;
    });
    if (alreadySaved) {
      await fetch(`/api/swipe/like?recipe_id=${recipe.id}`, { method: "DELETE" });
    } else {
      await fetch("/api/swipe/like", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipe_id: recipe.id }),
      });
    }
  }, [savedIds]);

  const handleRestart = useCallback(() => {
    const source = filteredRef.current.length > 0 ? filteredRef.current : recipes;
    setDeck([...source].sort(() => Math.random() - 0.5));
    setLiked([]);
    setSkipped([]);
    setDone(false);
    setExiting(null);
    setDragX(0);
    setDragY(0);
    setDragging(false);
  }, [recipes]);

  const likeOpacity = Math.max(0, Math.min(1, (dragX - 20) / 80));
  const nopeOpacity = Math.max(0, Math.min(1, (-dragX - 20) / 80));
  const filteredOut = recipes.length - filteredRecipes.length;

  return {
    deck,
    liked,
    skipped,
    done,
    savedIds,
    previewRecipe,
    setPreviewRecipe,
    dragging,
    dragX,
    dragY,
    exiting,
    currentCard,
    nextCard,
    likeOpacity,
    nopeOpacity,
    filteredRecipes,
    filteredOut,
    commitSwipe,
    onPointerDown,
    onPointerMove,
    onPointerUp,
    handleRestart,
    toggleSave,
    cardStyle,
    cardRef,
  };
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd C:/Users/lasse/Desktop/whatscooking && npx tsc --noEmit 2>&1 | head -30
```

Expected: no errors (or only pre-existing errors unrelated to this file).

- [ ] **Step 3: Commit**

```bash
git add src/lib/hooks/use-swipe-session.ts
git commit -m "feat(swipe): extract useSwipeSession hook"
```

---

## Task 2: Create shared swipe card components

**Files:**
- Create: `src/components/swipe/swipe-cards.tsx`

- [ ] **Step 1: Create the file**

Create `src/components/swipe/swipe-cards.tsx`:

```tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Heart, X, Clock, Flame, ExternalLink, Bookmark, BookmarkCheck,
  ChevronDown, ChevronUp, Zap, Mountain,
} from "lucide-react";
import type { SwipeRecipe } from "@/lib/hooks/use-swipe-session";

export const DIFFICULTY_CONFIG = {
  easy:   { label: "Easy",        Icon: Zap,      color: "#16A34A", bg: "#DCFCE7" },
  medium: { label: "Medium",      Icon: Flame,    color: "#D97706", bg: "#FEF3C7" },
  hard:   { label: "Challenging", Icon: Mountain, color: "#DC2626", bg: "#FEE2E2" },
} as const;

// ── Recipe Card ────────────────────────────────────────────────

export function RecipeCard({
  recipe, likeOpacity, nopeOpacity, saved, onToggleSave, onInfo,
}: {
  recipe: SwipeRecipe;
  likeOpacity: number;
  nopeOpacity: number;
  saved: boolean;
  onToggleSave: () => void;
  onInfo: () => void;
}) {
  const totalTime = (recipe.prep_time_minutes ?? 0) + (recipe.cook_time_minutes ?? 0);
  const diff = recipe.difficulty_level ? DIFFICULTY_CONFIG[recipe.difficulty_level] : null;

  return (
    <div className="relative w-full h-full select-none" style={{ background: "#fff" }}>
      <div className="absolute inset-0">
        {recipe.image_url ? (
          <img src={recipe.image_url} alt={recipe.title} className="w-full h-full object-cover" draggable={false} />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-6xl" style={{ background: "#FFF0E6" }}>🍽️</div>
        )}
        <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(30,12,4,0.93) 0%, rgba(0,0,0,0.25) 55%, transparent 100%)" }} />
      </div>

      {/* LIKE stamp */}
      <div className="absolute top-8 left-6 px-4 py-2 rounded-xl border-4 rotate-[-20deg] pointer-events-none transition-opacity"
        style={{ borderColor: "#4CAF50", opacity: likeOpacity }}>
        <span className="text-2xl font-black tracking-widest" style={{ color: "#4CAF50" }}>LIKE</span>
      </div>

      {/* NOPE stamp */}
      <div className="absolute top-8 right-6 px-4 py-2 rounded-xl border-4 rotate-[20deg] pointer-events-none transition-opacity"
        style={{ borderColor: "#C85A2F", opacity: nopeOpacity }}>
        <span className="text-2xl font-black tracking-widest" style={{ color: "#C85A2F" }}>NOPE</span>
      </div>

      {/* Top-right action buttons */}
      <div className="absolute top-4 right-4 flex flex-col gap-2">
        <button
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => { e.stopPropagation(); onInfo(); }}
          className="w-9 h-9 rounded-full flex items-center justify-center hover:opacity-80"
          style={{ background: "rgba(0,0,0,0.35)" }}
          aria-label="View details"
        >
          <ExternalLink className="w-4 h-4 text-white" />
        </button>
        <button
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => { e.stopPropagation(); onToggleSave(); }}
          className="w-9 h-9 rounded-full flex items-center justify-center hover:opacity-80"
          style={{ background: saved ? "rgba(44,74,140,0.8)" : "rgba(0,0,0,0.35)" }}
          aria-label="Save"
        >
          {saved ? <BookmarkCheck className="w-4 h-4 text-white" /> : <Bookmark className="w-4 h-4 text-white" />}
        </button>
      </div>

      {/* Difficulty badge */}
      {diff && (
        <div className="absolute top-4 left-4">
          <span className="text-xs font-bold px-2.5 py-1 rounded-full"
            style={{ background: diff.bg, color: diff.color }}>
            {diff.label}
          </span>
        </div>
      )}

      {/* Bottom info */}
      <div className="absolute bottom-0 left-0 right-0 p-5">
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          {recipe.cuisine_type && (
            <span className="text-xs px-2.5 py-1 rounded-full font-semibold"
              style={{ background: "rgba(255,255,255,0.2)", color: "#fff", backdropFilter: "blur(4px)" }}>
              {recipe.cuisine_type}
            </span>
          )}
          {(recipe.dietary_tags ?? []).slice(0, 2).map((tag) => (
            <span key={tag} className="text-xs px-2.5 py-1 rounded-full"
              style={{ background: "rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.8)" }}>
              {tag}
            </span>
          ))}
        </div>
        <h2 className="text-2xl font-bold text-white leading-tight mb-2 drop-shadow-md">{recipe.title}</h2>
        {recipe.description && (
          <p className="text-sm text-white/70 leading-relaxed line-clamp-2 mb-3">{recipe.description}</p>
        )}
        <div className="flex items-center gap-4">
          {totalTime > 0 && (
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-white/60" />
              <span className="text-xs text-white/80 font-medium">{totalTime} min</span>
            </div>
          )}
          {recipe.calories && (
            <div className="flex items-center gap-1.5">
              <Flame className="w-3.5 h-3.5 text-white/60" />
              <span className="text-xs text-white/80 font-medium">{recipe.calories} kcal</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Recipe Preview Sheet ───────────────────────────────────────

export function RecipePreviewSheet({
  recipe, saved, onToggleSave, onClose, onLike, onSkip,
}: {
  recipe: SwipeRecipe;
  saved: boolean;
  onToggleSave: () => void;
  onClose: () => void;
  onLike: () => void;
  onSkip: () => void;
}) {
  const [showIngredients, setShowIngredients] = useState(true);
  const [showInstructions, setShowInstructions] = useState(false);
  const totalTime = (recipe.prep_time_minutes ?? 0) + (recipe.cook_time_minutes ?? 0);
  const diff = recipe.difficulty_level ? DIFFICULTY_CONFIG[recipe.difficulty_level] : null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col" style={{ background: "rgba(0,0,0,0.6)" }} onClick={onClose}>
      <div className="mt-auto max-h-[92vh] overflow-y-auto rounded-t-3xl"
        style={{ background: "#FFFBF7" }}
        onClick={(e) => e.stopPropagation()}>

        <div className="relative h-56 overflow-hidden rounded-t-3xl">
          {recipe.image_url ? (
            <img src={recipe.image_url} alt={recipe.title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-5xl" style={{ background: "#FFF0E6" }}>🍽️</div>
          )}
          <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(20,8,2,0.85) 0%, transparent 60%)" }} />
          <div className="absolute top-3 left-1/2 -translate-x-1/2 w-10 h-1 rounded-full opacity-60" style={{ background: "#fff" }} />
          <div className="absolute bottom-4 left-5 right-5">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              {recipe.cuisine_type && (
                <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
                  style={{ background: "rgba(255,255,255,0.2)", color: "#fff", backdropFilter: "blur(4px)" }}>
                  {recipe.cuisine_type}
                </span>
              )}
              {diff && (
                <span className="text-xs px-2 py-0.5 rounded-full font-bold"
                  style={{ background: diff.bg, color: diff.color }}>
                  {diff.label}
                </span>
              )}
            </div>
            <h2 className="text-xl font-bold text-white leading-snug drop-shadow">{recipe.title}</h2>
          </div>
        </div>

        <div className="px-5 py-4">
          <div className="flex items-center gap-4 mb-4 flex-wrap">
            {totalTime > 0 && (
              <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl" style={{ background: "#F5EDE4" }}>
                <Clock className="w-4 h-4" style={{ color: "#C85A2F" }} />
                <span className="text-sm font-semibold" style={{ color: "#3D2817" }}>{totalTime} min</span>
              </div>
            )}
            {recipe.calories && (
              <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl" style={{ background: "#F5EDE4" }}>
                <Flame className="w-4 h-4" style={{ color: "#C85A2F" }} />
                <span className="text-sm font-semibold" style={{ color: "#3D2817" }}>{recipe.calories} kcal</span>
              </div>
            )}
            {recipe.servings && (
              <div className="flex items-center gap-1 px-3 py-2 rounded-xl" style={{ background: "#F5EDE4" }}>
                <span className="text-sm font-semibold" style={{ color: "#3D2817" }}>Serves {recipe.servings}</span>
              </div>
            )}
          </div>

          {recipe.description && (
            <p className="text-sm leading-relaxed mb-4" style={{ color: "#6B5B52" }}>{recipe.description}</p>
          )}

          {(recipe.protein_g || recipe.carbs_g || recipe.fat_g) && (
            <div className="flex gap-2 mb-4 flex-wrap">
              {recipe.protein_g && (
                <span className="text-xs px-2.5 py-1 rounded-full font-semibold" style={{ background: "#DBEAFE", color: "#1D4ED8" }}>
                  Protein {Math.round(recipe.protein_g)}g
                </span>
              )}
              {recipe.carbs_g && (
                <span className="text-xs px-2.5 py-1 rounded-full font-semibold" style={{ background: "#FEF3C7", color: "#92400E" }}>
                  Carbs {Math.round(recipe.carbs_g)}g
                </span>
              )}
              {recipe.fat_g && (
                <span className="text-xs px-2.5 py-1 rounded-full font-semibold" style={{ background: "#F3E8FF", color: "#7C3AED" }}>
                  Fat {Math.round(recipe.fat_g)}g
                </span>
              )}
            </div>
          )}

          {(recipe.dietary_tags ?? []).length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-4">
              {(recipe.dietary_tags ?? []).map((tag) => (
                <span key={tag} className="text-xs px-2.5 py-1 rounded-full"
                  style={{ background: "#DCFCE7", color: "#16A34A" }}>
                  {tag}
                </span>
              ))}
            </div>
          )}

          {(recipe.ingredients ?? []).length > 0 && (
            <div className="mb-3 rounded-2xl overflow-hidden" style={{ border: "1.5px solid #F0E8DC" }}>
              <button onClick={() => setShowIngredients((s) => !s)}
                className="w-full flex items-center justify-between px-4 py-3"
                style={{ background: "#FAF7F2" }}>
                <span className="font-semibold text-sm" style={{ color: "#3D2817" }}>
                  Ingredients ({recipe.ingredients?.length ?? 0})
                </span>
                {showIngredients ? <ChevronUp className="w-4 h-4" style={{ color: "#A69180" }} /> : <ChevronDown className="w-4 h-4" style={{ color: "#A69180" }} />}
              </button>
              {showIngredients && (
                <div className="px-4 py-3 flex flex-col gap-1.5">
                  {(recipe.ingredients ?? []).map((ing, i) => (
                    <div key={i} className="flex items-center justify-between text-sm">
                      <span style={{ color: "#3D2817" }}>{ing.name}</span>
                      {(ing.amount || ing.unit) && (
                        <span className="text-xs font-medium" style={{ color: "#A69180" }}>
                          {ing.amount != null ? ing.amount : ""} {ing.unit ?? ""}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {(recipe.instructions ?? []).length > 0 && (
            <div className="mb-5 rounded-2xl overflow-hidden" style={{ border: "1.5px solid #F0E8DC" }}>
              <button onClick={() => setShowInstructions((s) => !s)}
                className="w-full flex items-center justify-between px-4 py-3"
                style={{ background: "#FAF7F2" }}>
                <span className="font-semibold text-sm" style={{ color: "#3D2817" }}>
                  Instructions ({recipe.instructions?.length ?? 0} steps)
                </span>
                {showInstructions ? <ChevronUp className="w-4 h-4" style={{ color: "#A69180" }} /> : <ChevronDown className="w-4 h-4" style={{ color: "#A69180" }} />}
              </button>
              {showInstructions && (
                <div className="px-4 py-3 flex flex-col gap-3">
                  {(recipe.instructions ?? []).map((step, i) => (
                    <div key={i} className="flex gap-3">
                      <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5"
                        style={{ background: "#FFF0E6", color: "#C85A2F" }}>{i + 1}</span>
                      <p className="text-sm leading-relaxed flex-1" style={{ color: "#6B5B52" }}>{step}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <Link href={`/recipes/${recipe.id}`}
            className="flex items-center justify-center gap-2 w-full py-3 rounded-xl text-sm font-semibold mb-4 hover:opacity-80"
            style={{ background: "#EEF2FA", color: "#2C4A8C" }}>
            <ExternalLink className="w-4 h-4" /> Full Recipe Page
          </Link>

          <div className="flex gap-3">
            <button type="button" onClick={onSkip}
              className="flex-1 py-3.5 rounded-2xl font-semibold text-sm hover:opacity-80 flex items-center justify-center gap-2"
              style={{ background: "#F5EDE4", color: "#6B5B52" }}>
              <X className="w-4 h-4" /> Skip
            </button>
            <button onClick={onToggleSave}
              className="flex items-center justify-center gap-1.5 px-4 py-3.5 rounded-2xl font-semibold text-sm hover:opacity-80"
              style={{ background: saved ? "#EEF2FA" : "#F5EDE4", color: saved ? "#2C4A8C" : "#6B5B52" }}>
              {saved ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
              {saved ? "Saved" : "Save"}
            </button>
            <button type="button" onClick={onLike}
              className="flex-1 py-3.5 rounded-2xl font-semibold text-sm text-white hover:opacity-90 flex items-center justify-center gap-2"
              style={{ background: "linear-gradient(135deg, #C85A2F, #E8834A)" }}>
              <Heart className="w-4 h-4 fill-white" /> Like
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Match Screen ───────────────────────────────────────────────

export function MatchScreen({
  liked, savedIds, onToggleSave, onRestart,
}: {
  liked: SwipeRecipe[];
  savedIds: Set<string>;
  onToggleSave: (r: SwipeRecipe) => void;
  onRestart: () => void;
}) {
  return (
    <div className="px-4 py-8 max-w-lg mx-auto w-full" style={{ color: "#EFE3CE" }}>
      <div className="text-center mb-8">
        <div className="text-5xl mb-3">🎉</div>
        <h1 className="text-2xl font-bold mb-1" style={{ color: "#EFE3CE" }}>Your Matches</h1>
        {liked.length === 0 ? (
          <p className="text-sm" style={{ color: "#8A6A4A" }}>You didn&apos;t like any meals this time.</p>
        ) : (
          <p className="text-sm" style={{ color: "#8A6A4A" }}>
            You liked {liked.length} meal{liked.length !== 1 ? "s" : ""}. Save your favourites!
          </p>
        )}
      </div>

      {liked.length > 0 && (
        <div className="flex flex-col gap-3 mb-8">
          {liked.map((recipe) => {
            const totalTime = (recipe.prep_time_minutes ?? 0) + (recipe.cook_time_minutes ?? 0);
            const isSaved = savedIds.has(recipe.id);
            const diff = recipe.difficulty_level ? DIFFICULTY_CONFIG[recipe.difficulty_level] : null;
            return (
              <div key={recipe.id}
                className="flex items-center gap-3 rounded-2xl overflow-hidden shadow-sm"
                style={{ background: "#2A1804", border: "1px solid #3A2416" }}>
                <Link href={`/recipes/${recipe.id}`} className="w-20 h-20 shrink-0 overflow-hidden">
                  {recipe.image_url
                    ? <img src={recipe.image_url} alt={recipe.title} className="w-full h-full object-cover" />
                    : <div className="w-full h-full flex items-center justify-center text-2xl" style={{ background: "#3D2010" }}>🍽️</div>}
                </Link>
                <div className="flex-1 min-w-0 py-2">
                  <Link href={`/recipes/${recipe.id}`}>
                    <div className="font-semibold text-sm leading-tight mb-1 truncate pr-2" style={{ color: "#EFE3CE" }}>{recipe.title}</div>
                  </Link>
                  <div className="flex items-center gap-2 flex-wrap">
                    {recipe.cuisine_type && (
                      <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "#3D2010", color: "#C85A2F" }}>
                        {recipe.cuisine_type}
                      </span>
                    )}
                    {diff && (
                      <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                        style={{ background: diff.bg, color: diff.color }}>
                        {diff.label}
                      </span>
                    )}
                    {totalTime > 0 && (
                      <span className="text-xs flex items-center gap-0.5" style={{ color: "#8A6A4A" }}>
                        <Clock className="w-3 h-3" />{totalTime}m
                      </span>
                    )}
                  </div>
                </div>
                <div className="pr-3 flex items-center gap-2 shrink-0">
                  <button onClick={() => onToggleSave(recipe)}
                    className="w-9 h-9 rounded-xl flex items-center justify-center hover:opacity-80"
                    style={{ background: isSaved ? "#1C3060" : "#3D2010" }}>
                    {isSaved ? <BookmarkCheck className="w-4 h-4" style={{ color: "#7B9FD4" }} /> : <Bookmark className="w-4 h-4" style={{ color: "#8A6A4A" }} />}
                  </button>
                  <Link href={`/recipes/${recipe.id}`}
                    className="w-9 h-9 rounded-xl flex items-center justify-center"
                    style={{ background: "#3D2010" }}>
                    <ExternalLink className="w-4 h-4" style={{ color: "#8A6A4A" }} />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <button type="button" onClick={onRestart}
        className="w-full py-3.5 rounded-2xl font-semibold text-white hover:opacity-90 mb-3"
        style={{ background: "linear-gradient(135deg, #C85A2F, #E8834A)" }}>
        Swipe Again
      </button>
      <Link href="/discover"
        className="block w-full py-3.5 rounded-2xl font-semibold text-center"
        style={{ background: "#2A1804", color: "#8A6A4A" }}>
        Back to Discover
      </Link>
    </div>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd C:/Users/lasse/Desktop/whatscooking && npx tsc --noEmit 2>&1 | head -30
```

Expected: no new errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/swipe/swipe-cards.tsx
git commit -m "feat(swipe): add shared RecipeCard, RecipePreviewSheet, MatchScreen components"
```

---

## Task 3: Create HeroSwiper for the discover page

**Files:**
- Create: `src/app/(app)/discover/hero-swiper.tsx`

- [ ] **Step 1: Create the file**

Create `src/app/(app)/discover/hero-swiper.tsx`:

```tsx
"use client";

import { useState } from "react";
import { Heart, X, Bookmark, BookmarkCheck, Info, RotateCcw } from "lucide-react";
import { useSwipeSession } from "@/lib/hooks/use-swipe-session";
import type { SwipeRecipe } from "@/lib/hooks/use-swipe-session";
import { RecipeCard, RecipePreviewSheet, MatchScreen } from "@/components/swipe/swipe-cards";
import { useDietaryMode } from "@/lib/dietary-mode-context";

export function HeroSwiper({ recipes }: { recipes: SwipeRecipe[] }) {
  const { restrictions, customAvoid } = useDietaryMode();
  const [difficultyFilter, setDifficultyFilter] = useState<"all" | "easy" | "medium" | "hard">("all");

  const session = useSwipeSession(recipes, [], { restrictions, customAvoid, difficultyFilter });
  const { currentCard, nextCard, done, liked, savedIds } = session;

  if (done || session.deck.length === 0) {
    return (
      <div
        className="w-full flex flex-col overflow-y-auto"
        style={{ height: "calc(100svh - 56px)", background: "#1C1209" }}
      >
        <MatchScreen
          liked={liked}
          savedIds={savedIds}
          onToggleSave={session.toggleSave}
          onRestart={session.handleRestart}
        />
      </div>
    );
  }

  return (
    <div
      className="w-full flex flex-col"
      style={{ height: "calc(100svh - 56px)", background: "#1C1209" }}
    >
      {/* Preview sheet */}
      {session.previewRecipe && (
        <RecipePreviewSheet
          recipe={session.previewRecipe}
          saved={savedIds.has(session.previewRecipe.id)}
          onToggleSave={() => session.toggleSave(session.previewRecipe!)}
          onClose={() => session.setPreviewRecipe(null)}
          onLike={() => { session.setPreviewRecipe(null); session.commitSwipe("right"); }}
          onSkip={() => { session.setPreviewRecipe(null); session.commitSwipe("left"); }}
        />
      )}

      {/* Difficulty chips + progress */}
      <div className="flex items-center gap-2 px-4 pt-3 pb-1 flex-wrap">
        <div className="flex items-center gap-1">
          {(["all", "easy", "medium", "hard"] as const).map((d) => (
            <button
              key={d}
              onClick={() => setDifficultyFilter(d)}
              className="px-2.5 py-1 rounded-full text-xs font-semibold transition-all"
              style={{
                background: difficultyFilter === d ? "#C85A2F" : "#2A1804",
                color: difficultyFilter === d ? "#fff" : "#8A6A4A",
              }}
            >
              {d === "all" ? "All" : d.charAt(0).toUpperCase() + d.slice(1)}
            </button>
          ))}
        </div>
        <span className="ml-auto text-xs font-medium" style={{ color: "#4A3020" }}>
          {session.deck.length} left · {liked.length} liked
        </span>
      </div>

      {/* Progress bar */}
      <div className="mx-4 h-0.5 rounded-full overflow-hidden mb-2" style={{ background: "#2A1804" }}>
        <div
          className="h-full rounded-full transition-all duration-300"
          style={{
            width: `${((session.filteredRecipes.length - session.deck.length) / Math.max(session.filteredRecipes.length, 1)) * 100}%`,
            background: "linear-gradient(90deg, #C85A2F 0%, #E8834A 100%)",
          }}
        />
      </div>

      {/* Card stack */}
      <div className="relative flex-1 mx-4 mb-2">
        {nextCard && (
          <div className="absolute inset-0 rounded-3xl overflow-hidden" style={session.cardStyle(false)}>
            <RecipeCard
              recipe={nextCard}
              likeOpacity={0}
              nopeOpacity={0}
              saved={savedIds.has(nextCard.id)}
              onToggleSave={() => session.toggleSave(nextCard)}
              onInfo={() => session.setPreviewRecipe(nextCard)}
            />
          </div>
        )}
        {currentCard && (
          <div
            ref={session.cardRef}
            className="absolute inset-0 rounded-3xl overflow-hidden shadow-2xl"
            style={session.cardStyle(true)}
            onPointerDown={session.onPointerDown}
            onPointerMove={session.onPointerMove}
            onPointerUp={session.onPointerUp}
            onPointerCancel={session.onPointerUp}
          >
            <RecipeCard
              recipe={currentCard}
              likeOpacity={session.likeOpacity}
              nopeOpacity={session.nopeOpacity}
              saved={savedIds.has(currentCard.id)}
              onToggleSave={() => session.toggleSave(currentCard)}
              onInfo={() => session.setPreviewRecipe(currentCard)}
            />
          </div>
        )}
      </div>

      {/* Action buttons */}
      <div className="flex items-center justify-center gap-5 py-3 pb-4">
        <button
          type="button"
          onClick={() => session.commitSwipe("left")}
          disabled={!!session.exiting}
          className="w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-transform active:scale-90 hover:scale-110"
          style={{ background: "#1C1209", border: "2px solid #3A2416" }}
          aria-label="Skip"
        >
          <X className="w-6 h-6" style={{ color: "#C85A2F" }} />
        </button>

        <button
          type="button"
          onClick={() => currentCard && session.toggleSave(currentCard)}
          disabled={!currentCard}
          className="w-12 h-12 rounded-full flex items-center justify-center shadow-md transition-transform active:scale-90 hover:scale-110 disabled:opacity-30"
          style={{ background: "#1C1209", border: "2px solid #3A2416" }}
          aria-label="Save"
        >
          {currentCard && savedIds.has(currentCard.id)
            ? <BookmarkCheck className="w-5 h-5" style={{ color: "#7B9FD4" }} />
            : <Bookmark className="w-5 h-5" style={{ color: "#8A6A4A" }} />}
        </button>

        <button
          type="button"
          onClick={() => session.commitSwipe("right")}
          disabled={!!session.exiting}
          className="rounded-full flex items-center justify-center shadow-xl transition-transform active:scale-90 hover:scale-110"
          style={{ width: 72, height: 72, background: "linear-gradient(135deg, #C85A2F, #E8834A)" }}
          aria-label="Like"
        >
          <Heart className="w-8 h-8 fill-white text-white" />
        </button>

        <button
          type="button"
          onClick={() => currentCard && session.setPreviewRecipe(currentCard)}
          disabled={!currentCard}
          className="w-12 h-12 rounded-full flex items-center justify-center shadow-md transition-transform active:scale-90 hover:scale-110 disabled:opacity-30"
          style={{ background: "#1C1209", border: "2px solid #3A2416" }}
          aria-label="View recipe"
        >
          <Info className="w-5 h-5" style={{ color: "#8A6A4A" }} />
        </button>

        <button
          onClick={() => {
            if (session.skipped.length === 0) return;
            const last = session.skipped[0];
            // Undo: pop first skipped, push back to deck
            session.skipped.splice(0, 1);
            session.deck.push(last);
            session.handleRestart();
          }}
          disabled={session.skipped.length === 0 || !!session.exiting}
          className="w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-transform active:scale-90 hover:scale-110 disabled:opacity-40"
          style={{ background: "#1C1209", border: "2px solid #3A2416" }}
          aria-label="Undo"
        >
          <RotateCcw className="w-5 h-5" style={{ color: "#8A6A4A" }} />
        </button>
      </div>
    </div>
  );
}
```

> **Note on Undo:** The `skipped` array and `deck` array returned by the hook are read-only snapshots — mutating them won't work. The undo button needs to call `commitSwipe` in reverse. Update the undo button implementation in the next step after verifying types.

- [ ] **Step 2: Fix the Undo button — it cannot mutate hook state directly**

The undo action needs to be exposed from the hook. Add an `undo` function to `useSwipeSession`. Open `src/lib/hooks/use-swipe-session.ts` and add this before the `return` statement:

```ts
const undo = useCallback(() => {
  if (skipped.length === 0 || exiting) return;
  const last = skipped[0];
  setSkipped((prev) => prev.slice(1));
  setDeck((prev) => [...prev, last]);
  setDone(false);
}, [skipped, exiting]);
```

Then add `undo` to the return object:

```ts
return {
  // ...existing fields...
  undo,
};
```

Then in `hero-swiper.tsx`, replace the undo button's `onClick` with:

```tsx
onClick={() => session.undo()}
disabled={session.skipped.length === 0 || !!session.exiting}
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
cd C:/Users/lasse/Desktop/whatscooking && npx tsc --noEmit 2>&1 | head -40
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/app/(app)/discover/hero-swiper.tsx src/lib/hooks/use-swipe-session.ts
git commit -m "feat(discover): add HeroSwiper with full drag mechanics"
```

---

## Task 4: Refactor SwipeClient into a thin wrapper

**Files:**
- Modify: `src/app/(app)/swipe/swipe-client.tsx`

- [ ] **Step 1: Replace the file content**

Replace `src/app/(app)/swipe/swipe-client.tsx` entirely with:

```tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { Heart, X, Bookmark, BookmarkCheck, Info, RotateCcw, Filter, ShieldAlert } from "lucide-react";
import { useSwipeSession } from "@/lib/hooks/use-swipe-session";
import type { SwipeRecipe } from "@/lib/hooks/use-swipe-session";
import { RecipeCard, RecipePreviewSheet, MatchScreen, DIFFICULTY_CONFIG } from "@/components/swipe/swipe-cards";
import { useDietaryMode } from "@/lib/dietary-mode-context";
import { ChevronLeft } from "lucide-react";

export function SwipeClient({ recipes, initialSavedIds }: { recipes: SwipeRecipe[]; initialSavedIds: string[] }) {
  const { restrictions, customAvoid } = useDietaryMode();
  const [difficultyFilter, setDifficultyFilter] = useState<"all" | "easy" | "medium" | "hard">("all");
  const [showFilters, setShowFilters] = useState(false);

  const session = useSwipeSession(recipes, initialSavedIds, { restrictions, customAvoid, difficultyFilter });
  const { currentCard, nextCard, done, liked, savedIds } = session;

  if (done || session.deck.length === 0) {
    return (
      <div className="min-h-screen" style={{ background: "#FFFBF7" }}>
        <MatchScreen
          liked={liked}
          savedIds={savedIds}
          onToggleSave={session.toggleSave}
          onRestart={session.handleRestart}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center min-h-screen px-4 pb-24 pt-6" style={{ background: "#FFFBF7" }}>
      {session.previewRecipe && (
        <RecipePreviewSheet
          recipe={session.previewRecipe}
          saved={savedIds.has(session.previewRecipe.id)}
          onToggleSave={() => session.toggleSave(session.previewRecipe!)}
          onClose={() => session.setPreviewRecipe(null)}
          onLike={() => { session.setPreviewRecipe(null); session.commitSwipe("right"); }}
          onSkip={() => { session.setPreviewRecipe(null); session.commitSwipe("left"); }}
        />
      )}

      {/* Header */}
      <div className="w-full max-w-sm mb-4">
        <div className="flex items-center justify-between">
          <Link href="/discover" className="flex items-center gap-1.5 text-sm" style={{ color: "#A69180" }}>
            <ChevronLeft className="w-4 h-4" /> Discover
          </Link>
          <div className="text-center">
            <h1 className="text-lg font-bold" style={{ color: "#3D2817" }}>Meal Swipe</h1>
            <p className="text-xs" style={{ color: "#A69180" }}>{session.deck.length} left · {liked.length} liked</p>
          </div>
          <button
            onClick={() => setShowFilters((f) => !f)}
            className="flex items-center gap-1 text-sm px-2.5 py-1.5 rounded-xl transition-all"
            style={{
              background: difficultyFilter !== "all" ? "#FFF0E6" : "#F5EDE4",
              color: difficultyFilter !== "all" ? "#C85A2F" : "#6B5B52",
              border: difficultyFilter !== "all" ? "1px solid #C85A2F40" : "1px solid transparent",
            }}
          >
            <Filter className="w-3.5 h-3.5" />
          </button>
        </div>

        {showFilters && (
          <div className="mt-3 flex items-center gap-1.5">
            <span className="text-xs font-medium shrink-0" style={{ color: "#A69180" }}>Difficulty:</span>
            {(["all", "easy", "medium", "hard"] as const).map((d) => {
              const cfg = d === "all" ? null : DIFFICULTY_CONFIG[d];
              const active = difficultyFilter === d;
              return (
                <button key={d} onClick={() => setDifficultyFilter(d)}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all"
                  style={{
                    background: active ? (cfg?.bg ?? "#3D2817") : "#F5EDE4",
                    color: active ? (cfg?.color ?? "#fff") : "#6B5B52",
                    border: active ? `1px solid ${cfg?.color ?? "#3D2817"}40` : "1px solid transparent",
                  }}>
                  {d === "all" ? "All" : cfg!.label}
                </button>
              );
            })}
          </div>
        )}

        {(restrictions.length > 0 || customAvoid.length > 0) && session.filteredOut > 0 && (
          <div className="mt-2 flex items-center gap-1.5 px-3 py-1.5 rounded-xl" style={{ background: "#FFF7ED", border: "1px solid #FED7AA" }}>
            <ShieldAlert className="w-3.5 h-3.5 shrink-0" style={{ color: "#C2410C" }} />
            <span className="text-xs" style={{ color: "#C2410C" }}>
              {session.filteredOut} recipe{session.filteredOut !== 1 ? "s" : ""} hidden by your food restrictions
            </span>
          </div>
        )}

        <div className="mt-3 h-1 rounded-full overflow-hidden" style={{ background: "#F0E8DC" }}>
          <div className="h-full rounded-full transition-all duration-300"
            style={{
              width: `${((session.filteredRecipes.length - session.deck.length) / Math.max(session.filteredRecipes.length, 1)) * 100}%`,
              background: "linear-gradient(90deg, #C85A2F 0%, #E8834A 100%)",
            }}
          />
        </div>
      </div>

      {/* Card stack */}
      <div className="relative w-full max-w-sm" style={{ height: 500 }}>
        {nextCard && (
          <div className="absolute inset-0 rounded-3xl overflow-hidden" style={session.cardStyle(false)}>
            <RecipeCard recipe={nextCard} likeOpacity={0} nopeOpacity={0}
              saved={savedIds.has(nextCard.id)}
              onToggleSave={() => session.toggleSave(nextCard)}
              onInfo={() => session.setPreviewRecipe(nextCard)} />
          </div>
        )}
        {currentCard && (
          <div ref={session.cardRef}
            className="absolute inset-0 rounded-3xl overflow-hidden shadow-2xl"
            style={session.cardStyle(true)}
            onPointerDown={session.onPointerDown}
            onPointerMove={session.onPointerMove}
            onPointerUp={session.onPointerUp}
            onPointerCancel={session.onPointerUp}
          >
            <RecipeCard recipe={currentCard} likeOpacity={session.likeOpacity} nopeOpacity={session.nopeOpacity}
              saved={savedIds.has(currentCard.id)}
              onToggleSave={() => session.toggleSave(currentCard)}
              onInfo={() => session.setPreviewRecipe(currentCard)} />
          </div>
        )}
      </div>

      <p className="mt-3 text-xs" style={{ color: "#C4B5A8" }}>
        Tap card to preview · swipe or use buttons · ← → keyboard
      </p>

      {/* Action buttons */}
      <div className="flex items-center gap-6 mt-4">
        <button type="button" onClick={() => session.commitSwipe("left")} disabled={!!session.exiting}
          className="w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-transform active:scale-90 hover:scale-110"
          style={{ background: "#fff", border: "2px solid #F5E6D3" }} aria-label="Skip">
          <X className="w-6 h-6" style={{ color: "#C85A2F" }} />
        </button>

        <button type="button" onClick={() => currentCard && session.toggleSave(currentCard)} disabled={!currentCard}
          className="w-12 h-12 rounded-full flex items-center justify-center shadow-md transition-transform active:scale-90 hover:scale-110 disabled:opacity-30"
          style={{ background: "#fff", border: "2px solid #F5E6D3" }} aria-label="Save">
          {currentCard && savedIds.has(currentCard.id)
            ? <BookmarkCheck className="w-5 h-5" style={{ color: "#2C4A8C" }} />
            : <Bookmark className="w-5 h-5" style={{ color: "#A69180" }} />}
        </button>

        <button type="button" onClick={() => session.commitSwipe("right")} disabled={!!session.exiting}
          className="rounded-full flex items-center justify-center shadow-xl transition-transform active:scale-90 hover:scale-110"
          style={{ width: 72, height: 72, background: "linear-gradient(135deg, #C85A2F, #E8834A)" }}
          aria-label="Like">
          <Heart className="w-8 h-8 fill-white text-white" />
        </button>

        <button type="button" onClick={() => currentCard && session.setPreviewRecipe(currentCard)} disabled={!currentCard}
          className="w-12 h-12 rounded-full flex items-center justify-center shadow-md transition-transform active:scale-90 hover:scale-110 disabled:opacity-30"
          style={{ background: "#fff", border: "2px solid #F5E6D3" }} aria-label="View recipe">
          <Info className="w-5 h-5" style={{ color: "#A69180" }} />
        </button>

        <button
          onClick={() => session.undo()}
          disabled={session.skipped.length === 0 || !!session.exiting}
          className="w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-transform active:scale-90 hover:scale-110 disabled:opacity-40"
          style={{ background: "#fff", border: "2px solid #F5E6D3" }} aria-label="Undo">
          <RotateCcw className="w-5 h-5" style={{ color: "#A69180" }} />
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd C:/Users/lasse/Desktop/whatscooking && npx tsc --noEmit 2>&1 | head -40
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/app/(app)/swipe/swipe-client.tsx
git commit -m "refactor(swipe): thin wrapper using useSwipeSession + shared cards"
```

---

## Task 5: Wire HeroSwiper into the discover feed

**Files:**
- Modify: `src/app/(app)/discover/discover-feed-client.tsx`
- Delete: `src/app/(app)/discover/swipe-section.tsx`

- [ ] **Step 1: Update the import in discover-feed-client.tsx**

In `src/app/(app)/discover/discover-feed-client.tsx`, replace:

```tsx
import { SwipeSection } from "./swipe-section";
```

with:

```tsx
import { HeroSwiper } from "./hero-swiper";
import type { SwipeRecipe } from "@/lib/hooks/use-swipe-session";
```

- [ ] **Step 2: Update the SwipeRecipe interface in discover-feed-client.tsx**

Remove the local `SwipeRecipe` interface (lines 11–21) — it's now imported from the hook. The `Interface SwipeRecipe { ... }` block at the top of the file should be deleted.

- [ ] **Step 3: Replace SwipeSection usage with HeroSwiper**

In the render, replace:

```tsx
{/* ── 1. Meal Swipe ── */}
<div style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
  <div className="px-4 pt-5 pb-2">
    <span
      className="text-xs font-bold tracking-widest uppercase"
      style={{ color: "var(--wc-accent-saffron, #F4A261)", opacity: 0.7 }}
    >
      Today&apos;s Picks
    </span>
    <h1
      className="text-xl font-bold"
      style={{ color: "var(--wc-text, #EFE3CE)", fontFamily: "'Libre Baskerville', Georgia, serif" }}
    >
      Meal Swipe
    </h1>
  </div>
  <SwipeSection recipes={swipeRecipes} />
</div>
```

with:

```tsx
{/* ── 1. Meal Swipe ── */}
<HeroSwiper recipes={swipeRecipes as SwipeRecipe[]} />
```

- [ ] **Step 4: Delete swipe-section.tsx**

```bash
rm "C:/Users/lasse/Desktop/whatscooking/src/app/(app)/discover/swipe-section.tsx"
```

- [ ] **Step 5: Verify TypeScript compiles**

```bash
cd C:/Users/lasse/Desktop/whatscooking && npx tsc --noEmit 2>&1 | head -40
```

Expected: no errors.

- [ ] **Step 6: Start dev server and visually verify**

```bash
cd C:/Users/lasse/Desktop/whatscooking && npm run dev
```

Open `http://localhost:3002/discover` and verify:
- The swipe card fills the viewport below the nav bar
- Dragging left/right animates the card with LIKE/NOPE stamps
- Tapping the card opens the preview sheet
- X/❤️ buttons work
- Undo button works after skipping at least one card
- Match screen appears after all cards are swiped

- [ ] **Step 7: Commit**

```bash
git add src/app/(app)/discover/discover-feed-client.tsx
git rm src/app/(app)/discover/swipe-section.tsx
git commit -m "feat(discover): wire HeroSwiper as hero section, remove SwipeSection"
```

---

## Task 6: Pantry — remove inner sub-tab and stub content

**Files:**
- Modify: `src/app/(app)/pantry/pantry-client.tsx`
- Modify: `src/app/(app)/pantry/page.tsx`

- [ ] **Step 1: Remove the pantryView state and related state from pantry-client.tsx**

At the top of `PantryClient`, remove these lines:

```ts
const [pantryView, setPantryView] = useState<"shared" | "mine">("shared");
const [showSharePanel, setShowSharePanel] = useState(false);
const [inviteCopied, setInviteCopied] = useState(false);
const [householdItems] = useState<PantryItem[]>([]);
const [householdTags, setHouseholdTags] = useState<string[]>(initialHouseholdTags);
const [savingTags, setSavingTags] = useState(false);
```

Also remove the `handleToggleTag` function and the `DIETARY_TAG_OPTIONS` constant (they're only used in the deleted block).

- [ ] **Step 2: Remove the initialHouseholdTags prop**

Change the `Props` interface from:

```ts
interface Props {
  initialItems: PantryItem[];
  categories: IngredientCategory[];
  initialHouseholdTags: string[];
  userId: string;
}
```

to:

```ts
interface Props {
  initialItems: PantryItem[];
  categories: IngredientCategory[];
  userId: string;
}
```

And remove `initialHouseholdTags` from the destructured function argument.

- [ ] **Step 3: Rename the three outer tabs**

Find the tab switcher (three buttons inside the `flex gap-1 mb-6 p-1 rounded-2xl` div). Change the labels:

- `"Leftovers & Storage"` → `"Leftovers"`  
- `"Shared Pantry"` → `"Shared"`

- [ ] **Step 4: Delete the inner sub-tab toggle and pantryView blocks**

Remove the entire block starting with `{/* Pantry view toggle: Shared Household / My Pantry */}` through the closing `</>}` of the `pantryView === "shared" ? null : <>` wrapper (approximately lines 572–707).

The result: `activeTab === "pantry"` renders the pantry content directly — no inner toggle, no stub share panel, no dietary tags block.

Also remove the unused imports: `Share2`, `Copy`, `Check`, `UserCircle2`, `Leaf` from the import line (if they're no longer used elsewhere in the file).

- [ ] **Step 5: Update page.tsx to remove initialHouseholdTags**

In `src/app/(app)/pantry/page.tsx`, remove the `prefs` fetch from the `Promise.all`:

Replace:

```ts
const [{ data: items }, { data: categories }, { data: prefs }] = await Promise.all([
  supabase
    .from("pantry_items")
    .select("*, category:ingredient_categories(id, name, emoji, color)")
    .eq("user_id", user!.id)
    .order("added_at", { ascending: false }),
  supabase
    .from("ingredient_categories")
    .select("id, name, emoji, color")
    .order("name"),
  supabase
    .from("user_preferences")
    .select("household_dietary_tags")
    .eq("user_id", user!.id)
    .maybeSingle(),
]);
```

with:

```ts
const [{ data: items }, { data: categories }] = await Promise.all([
  supabase
    .from("pantry_items")
    .select("*, category:ingredient_categories(id, name, emoji, color)")
    .eq("user_id", user!.id)
    .order("added_at", { ascending: false }),
  supabase
    .from("ingredient_categories")
    .select("id, name, emoji, color")
    .order("name"),
]);
```

And remove `initialHouseholdTags` from the `<PantryClient ... />` props.

- [ ] **Step 6: Verify TypeScript compiles**

```bash
cd C:/Users/lasse/Desktop/whatscooking && npx tsc --noEmit 2>&1 | head -40
```

Expected: no errors.

- [ ] **Step 7: Commit**

```bash
git add src/app/(app)/pantry/pantry-client.tsx src/app/(app)/pantry/page.tsx
git commit -m "refactor(pantry): remove inner sub-tab, simplify to 3 flat tabs"
```

---

## Task 7: Pantry dark theme

**Files:**
- Modify: `src/app/(app)/pantry/pantry-client.tsx`

- [ ] **Step 1: Set dark background on the root container**

Find the root `<div className="px-4 sm:px-6 py-8 max-w-3xl mx-auto">` and add an explicit background:

```tsx
<div className="px-4 sm:px-6 py-8 max-w-3xl mx-auto min-h-screen" style={{ background: "#1C1209" }}>
```

- [ ] **Step 2: Dark-theme the tab rail**

Find the tab switcher container. Change:

```tsx
style={{ background: "#F5E6D3" }}
```

to:

```tsx
style={{ background: "#2A1804" }}
```

For each of the three tab buttons, change the active state styling:

```tsx
// before
background: activeTab === "pantry" ? "#fff" : "transparent",
color: activeTab === "pantry" ? "#3D2817" : "#A69180",
boxShadow: activeTab === "pantry" ? "0 1px 3px rgba(0,0,0,0.08)" : "none",

// after
background: activeTab === "pantry" ? "#C85A2F" : "transparent",
color: activeTab === "pantry" ? "#fff" : "#8A6A4A",
boxShadow: "none",
```

Apply the same pattern for `"leftovers"` and `"shared"` tab buttons.

- [ ] **Step 3: Dark-theme the expiry notification banner**

Find the orange expiry banner. Change:

```tsx
style={{ background: "#FFF7ED", border: "1px solid #FED7AA" }}
```

to:

```tsx
style={{ background: "#2A1804", border: "1px solid #5A2800" }}
```

The text colors inside (`#7C2D12`, `#9A3412`) change to `#F4A261` and `#C8A882` respectively.

- [ ] **Step 4: Dark-theme the Add ingredient card**

Find the add ingredient card. Change:

```tsx
style={{ borderColor: "#F5E6D3", background: "#fff" }}
```

to:

```tsx
style={{ borderColor: "#3A2416", background: "#2A1804" }}
```

The label `color: "#3D2817"` → `#EFE3CE`.

- [ ] **Step 5: Dark-theme all inputs**

For every `<input>` element inside `pantry-client.tsx`, replace:

```tsx
style={{ borderColor: "#E8D4C0", background: "#FAF7F2", color: "#3D2817" }}
```

with:

```tsx
style={{ borderColor: "#3A2416", background: "#1C1209", color: "#EFE3CE" }}
```

- [ ] **Step 6: Dark-theme the autocomplete dropdown**

Find the suggestions dropdown. Change:

```tsx
style={{ background: "#fff", borderColor: "#E8D4C0" }}
```

to:

```tsx
style={{ background: "#2A1804", borderColor: "#3A2416" }}
```

And each suggestion button's hover: `hover:bg-amber-50` → `hover:bg-[#3A2416]`, text color `color: "#3D2817"` → `#EFE3CE`.

- [ ] **Step 7: Dark-theme the ingredient pills**

Find the ingredient pill `<div>` inside the grouped items section. Change:

```tsx
style={{
  borderColor: "#E8D4C0",
  background: "rgba(255,255,255,0.75)",
  backdropFilter: "blur(8px)",
  color: "#3D2817",
}}
```

to:

```tsx
style={{
  borderColor: "#3A2416",
  background: "#2A1804",
  color: "#EFE3CE",
}}
```

- [ ] **Step 8: Dark-theme the heading and subtitle text**

Find `h1` and subtitle `p` in the header block (when `pantryView === "mine"` was active — now just the visible header). Change `color: "#3D2817"` → `#EFE3CE` and `color: "#6B5B52"` → `#8A6A4A`.

- [ ] **Step 9: Dark-theme the empty state, rescue panel, Waste Not, find-recipes CTA**

For each remaining card/panel (empty state dashed border, rescue panel, Waste Not widget, find-recipes CTA), apply:

- `borderColor: "#F5E6D3"` → `#3A2416`
- `background: "#fff"` or `rgba(255,255,255,0.75)` → `#2A1804`
- `borderColor: "#E8D4C0"` → `#3A2416`
- `color: "#3D2817"` → `#EFE3CE`
- `color: "#6B5B52"` → `#8A6A4A`

- [ ] **Step 10: Dark-theme the photo extraction panel and extracted ingredients**

The photo extraction button: `background: "#FAF7F2"`, `borderColor: "#E8D4C0"`, `color: "#3D2817"` → `#2A1804`, `#3A2416`, `#EFE3CE`.

Each extracted ingredient chip active/inactive state: active `background: "#FFF0E6"` → `#3D2010`, inactive `background: "#FAF7F2"` → `#2A1804`.

- [ ] **Step 11: Dark-theme the PantryScramble section header (if visible)**

The scramble CTA is in `pantry-scramble.tsx` — check if it needs a background update, but don't change it unless it already has hardcoded light colors. If it does, apply the same token swap.

- [ ] **Step 12: Verify TypeScript compiles and visually verify**

```bash
cd C:/Users/lasse/Desktop/whatscooking && npx tsc --noEmit 2>&1 | head -20
```

Open `http://localhost:3002/pantry` and verify:
- Page background is `#1C1209` dark brown
- Three flat tabs (My Pantry · Leftovers · Shared), no inner toggle below
- Active tab is ember red (`#C85A2F`)
- Ingredient pills are dark with light text
- All inputs have dark backgrounds
- Switching to Leftovers and Shared tabs still works

- [ ] **Step 13: Commit**

```bash
git add src/app/(app)/pantry/pantry-client.tsx
git commit -m "feat(pantry): dark theme — match app-wide color scheme"
```

---

## Self-Review

### Spec coverage
- ✅ `useSwipeSession` hook with all swipe logic — Task 1
- ✅ Shared `RecipeCard`, `RecipePreviewSheet`, `MatchScreen` — Task 2
- ✅ `HeroSwiper` at `calc(100svh - 56px)`, dark bg, compact difficulty chips — Task 3
- ✅ `SwipeClient` refactored as thin wrapper — Task 4
- ✅ `DiscoverFeedClient` wired to `HeroSwiper`, `swipe-section.tsx` deleted — Task 5
- ✅ Pantry: 3 flat tabs, inner toggle removed, stub content deleted — Task 6
- ✅ Pantry: full dark theme token swap — Task 7
- ✅ `initialHouseholdTags` removed from page.tsx fetch — Task 6 Step 5

### Potential gotcha
Task 3 Step 1 has an incorrect undo implementation (mutating hook state). Task 3 Step 2 corrects it with the `undo` function added to the hook. The undo function is also used in Task 4 (SwipeClient). Ensure Task 3 Step 2 is completed before Task 4.
