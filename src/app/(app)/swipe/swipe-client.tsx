"use client";

import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  Heart, X, Clock, ChevronLeft, RotateCcw, Flame, ExternalLink, ShieldAlert,
  Bookmark, BookmarkCheck, ChevronDown, ChevronUp, Info, Zap, Mountain, Filter,
} from "lucide-react";
import { useDietaryMode } from "@/lib/dietary-mode-context";

type Recipe = {
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

const SWIPE_THRESHOLD = 100;
const ROTATION_FACTOR = 0.08;
const TAP_THRESHOLD = 8; // px — below this is a tap, not a drag

const DIFFICULTY_CONFIG = {
  easy:   { label: "Easy",       icon: Zap,      color: "#16A34A", bg: "#DCFCE7" },
  medium: { label: "Medium",     icon: Flame,    color: "#D97706", bg: "#FEF3C7" },
  hard:   { label: "Challenging",icon: Mountain, color: "#DC2626", bg: "#FEE2E2" },
} as const;

// ── Main component ────────────────────────────────────────────

export function SwipeClient({ recipes, initialSavedIds }: { recipes: Recipe[]; initialSavedIds: string[] }) {
  const { restrictions, customAvoid } = useDietaryMode();
  const [difficultyFilter, setDifficultyFilter] = useState<"all" | "easy" | "medium" | "hard">("all");
  const [showFilters, setShowFilters] = useState(false);

  const filteredRecipes = useMemo(() => {
    return recipes.filter((r) => {
      if (restrictions.length > 0) {
        const tags = r.dietary_tags ?? [];
        if (!restrictions.every((d) => tags.includes(d))) return false;
      }
      if (customAvoid.length > 0) {
        const ingNames = (r.ingredients ?? []).map((i) => i.name.toLowerCase());
        if (customAvoid.some((avoid) => ingNames.some((ing) => ing.includes(avoid)))) return false;
      }
      if (difficultyFilter !== "all" && r.difficulty_level !== difficultyFilter) return false;
      return true;
    });
  }, [recipes, restrictions, customAvoid, difficultyFilter]);

  const [deck, setDeck] = useState(filteredRecipes);
  const [liked, setLiked] = useState<Recipe[]>([]);
  const [skipped, setSkipped] = useState<Recipe[]>([]);
  const [done, setDone] = useState(false);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set(initialSavedIds));
  const [previewRecipe, setPreviewRecipe] = useState<Recipe | null>(null);

  useEffect(() => {
    setDeck([...filteredRecipes]);
    setLiked([]);
    setSkipped([]);
    setDone(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [restrictions.join(","), customAvoid.join(","), difficultyFilter]);

  // Drag state
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
      if (dir === "right") setLiked(prev => [currentCard, ...prev]);
      else setSkipped(prev => [currentCard, ...prev]);
      setDeck(prev => prev.slice(0, -1));
      setExiting(null);
      setDragX(0);
      setDragY(0);
      if (deck.length === 1) setDone(true);
    }, 350);
  }, [currentCard, deck.length, exiting]);

  const onPointerDown = (e: React.PointerEvent) => {
    if (exiting) return;
    setDragging(true);
    moved.current = false;
    startX.current = e.clientX;
    startY.current = e.clientY;
    cardRef.current?.setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragging) return;
    const dx = e.clientX - startX.current;
    const dy = e.clientY - startY.current;
    if (Math.abs(dx) > TAP_THRESHOLD || Math.abs(dy) > TAP_THRESHOLD) moved.current = true;
    setDragX(dx);
    setDragY(dy);
  };

  const onPointerUp = () => {
    if (!dragging) return;
    setDragging(false);
    if (!moved.current && currentCard) {
      // Tap — open preview
      setPreviewRecipe(currentCard);
      setDragX(0);
      setDragY(0);
      return;
    }
    if (dragX > SWIPE_THRESHOLD) commitSwipe("right");
    else if (dragX < -SWIPE_THRESHOLD) commitSwipe("left");
    else { setDragX(0); setDragY(0); }
  };

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (previewRecipe) { if (e.key === "Escape") setPreviewRecipe(null); return; }
      if (e.key === "ArrowRight") commitSwipe("right");
      if (e.key === "ArrowLeft") commitSwipe("left");
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [commitSwipe, previewRecipe]);

  function cardStyle(isTop: boolean): React.CSSProperties {
    if (!isTop) return { transform: "scale(0.96) translateY(10px)", opacity: 0.85, zIndex: 1 };
    let tx = dragX, ty = dragY * 0.3, rotate = dragX * ROTATION_FACTOR;
    if (exiting === "right") { tx = 600; ty = -80; rotate = 20; }
    if (exiting === "left")  { tx = -600; ty = -80; rotate = -20; }
    return {
      transform: `translate(${tx}px, ${ty}px) rotate(${rotate}deg)`,
      transition: dragging ? "none" : exiting ? "transform 0.35s cubic-bezier(0.4,0,0.2,1)" : "transform 0.25s ease-out",
      zIndex: 2,
      cursor: dragging ? "grabbing" : "grab",
      userSelect: "none",
    };
  }

  async function toggleSave(recipe: Recipe) {
    const alreadySaved = savedIds.has(recipe.id);
    setSavedIds(prev => {
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
  }

  const likeOpacity = Math.max(0, Math.min(1, (dragX - 20) / 80));
  const nopeOpacity = Math.max(0, Math.min(1, (-dragX - 20) / 80));
  const filteredOut = recipes.length - filteredRecipes.length;

  if (done || deck.length === 0) {
    return (
      <MatchScreen
        liked={liked}
        savedIds={savedIds}
        onToggleSave={toggleSave}
        onRestart={() => {
        setDeck([...filteredRecipes].sort(() => Math.random() - 0.5));
        setLiked([]);
        setSkipped([]);
        setDone(false);
        setExiting(null);
        setDragX(0);
        setDragY(0);
        setDragging(false);
      }}
      />
    );
  }

  return (
    <div className="flex flex-col items-center min-h-screen px-4 pb-24 pt-6" style={{ background: "#FFFBF7" }}>
      {/* Recipe preview sheet */}
      {previewRecipe && (
        <RecipePreviewSheet
          recipe={previewRecipe}
          saved={savedIds.has(previewRecipe.id)}
          onToggleSave={() => toggleSave(previewRecipe)}
          onClose={() => setPreviewRecipe(null)}
          onLike={() => { setPreviewRecipe(null); commitSwipe("right"); }}
          onSkip={() => { setPreviewRecipe(null); commitSwipe("left"); }}
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
            <p className="text-xs" style={{ color: "#A69180" }}>{deck.length} left · {liked.length} liked</p>
          </div>
          <button
            onClick={() => setShowFilters(f => !f)}
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

        {/* Difficulty filter */}
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

        {/* Dietary badge */}
        {(restrictions.length > 0 || customAvoid.length > 0) && filteredOut > 0 && (
          <div className="mt-2 flex items-center gap-1.5 px-3 py-1.5 rounded-xl" style={{ background: "#FFF7ED", border: "1px solid #FED7AA" }}>
            <ShieldAlert className="w-3.5 h-3.5 shrink-0" style={{ color: "#C2410C" }} />
            <span className="text-xs" style={{ color: "#C2410C" }}>
              {filteredOut} recipe{filteredOut !== 1 ? "s" : ""} hidden by your food restrictions
            </span>
          </div>
        )}

        {/* Progress bar */}
        <div className="mt-3 h-1 rounded-full overflow-hidden" style={{ background: "#F0E8DC" }}>
          <div className="h-full rounded-full transition-all duration-300"
            style={{
              width: `${((filteredRecipes.length - deck.length) / Math.max(filteredRecipes.length, 1)) * 100}%`,
              background: "linear-gradient(90deg, #C85A2F 0%, #E8834A 100%)",
            }}
          />
        </div>
      </div>

      {/* Card stack */}
      <div className="relative w-full max-w-sm" style={{ height: 500 }}>
        {nextCard && (
          <div className="absolute inset-0 rounded-3xl overflow-hidden" style={cardStyle(false)}>
            <RecipeCard recipe={nextCard} likeOpacity={0} nopeOpacity={0} saved={savedIds.has(nextCard.id)} onToggleSave={() => toggleSave(nextCard)} onInfo={() => setPreviewRecipe(nextCard)} />
          </div>
        )}
        {currentCard && (
          <div ref={cardRef}
            className="absolute inset-0 rounded-3xl overflow-hidden shadow-2xl"
            style={cardStyle(true)}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
          >
            <RecipeCard recipe={currentCard} likeOpacity={likeOpacity} nopeOpacity={nopeOpacity} saved={savedIds.has(currentCard.id)} onToggleSave={() => toggleSave(currentCard)} onInfo={() => setPreviewRecipe(currentCard)} />
          </div>
        )}
      </div>

      <p className="mt-3 text-xs" style={{ color: "#C4B5A8" }}>
        Tap card to preview · swipe or use buttons · ← → keyboard
      </p>

      {/* Action buttons */}
      <div className="flex items-center gap-6 mt-4">
        <button onClick={() => commitSwipe("left")} disabled={!!exiting}
          className="w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-transform active:scale-90 hover:scale-110"
          style={{ background: "#fff", border: "2px solid #F5E6D3" }} aria-label="Skip">
          <X className="w-6 h-6" style={{ color: "#C85A2F" }} />
        </button>

        <button onClick={() => currentCard && toggleSave(currentCard)} disabled={!currentCard}
          className="w-12 h-12 rounded-full flex items-center justify-center shadow-md transition-transform active:scale-90 hover:scale-110 disabled:opacity-30"
          style={{ background: "#fff", border: "2px solid #F5E6D3" }} aria-label="Save to My Recipes">
          {currentCard && savedIds.has(currentCard.id)
            ? <BookmarkCheck className="w-5 h-5" style={{ color: "#2C4A8C" }} />
            : <Bookmark className="w-5 h-5" style={{ color: "#A69180" }} />}
        </button>

        <button onClick={() => commitSwipe("right")} disabled={!!exiting}
          className="w-18 h-18 rounded-full flex items-center justify-center shadow-xl transition-transform active:scale-90 hover:scale-110"
          style={{ width: 72, height: 72, background: "linear-gradient(135deg, #C85A2F, #E8834A)" }}
          aria-label="Like">
          <Heart className="w-8 h-8 fill-white text-white" />
        </button>

        <button onClick={() => currentCard && setPreviewRecipe(currentCard)} disabled={!currentCard}
          className="w-12 h-12 rounded-full flex items-center justify-center shadow-md transition-transform active:scale-90 hover:scale-110 disabled:opacity-30"
          style={{ background: "#fff", border: "2px solid #F5E6D3" }} aria-label="View recipe">
          <Info className="w-5 h-5" style={{ color: "#A69180" }} />
        </button>

        <button
          onClick={() => {
            if (skipped.length === 0) return;
            const last = skipped[0];
            setSkipped(prev => prev.slice(1));
            setDeck(prev => [...prev, last]);
            setDone(false);
          }}
          disabled={skipped.length === 0 || !!exiting}
          className="w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-transform active:scale-90 hover:scale-110 disabled:opacity-40"
          style={{ background: "#fff", border: "2px solid #F5E6D3" }} aria-label="Undo">
          <RotateCcw className="w-5 h-5" style={{ color: "#A69180" }} />
        </button>
      </div>
    </div>
  );
}

// ── Recipe Card ───────────────────────────────────────────────

function RecipeCard({
  recipe, likeOpacity, nopeOpacity, saved, onToggleSave, onInfo,
}: {
  recipe: Recipe; likeOpacity: number; nopeOpacity: number;
  saved: boolean; onToggleSave: () => void; onInfo: () => void;
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

      {/* Top-right buttons (stop propagation so they don't trigger swipe) */}
      <div className="absolute top-4 right-4 flex flex-col gap-2">
        <button
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => { e.stopPropagation(); onInfo(); }}
          className="w-9 h-9 rounded-full flex items-center justify-center backdrop-blur-sm transition-opacity hover:opacity-80"
          style={{ background: "rgba(0,0,0,0.35)" }}
          aria-label="View details"
        >
          <Info className="w-4 h-4 text-white" />
        </button>
        <button
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => { e.stopPropagation(); onToggleSave(); }}
          className="w-9 h-9 rounded-full flex items-center justify-center backdrop-blur-sm transition-opacity hover:opacity-80"
          style={{ background: saved ? "rgba(44,74,140,0.8)" : "rgba(0,0,0,0.35)" }}
          aria-label="Save"
        >
          {saved
            ? <BookmarkCheck className="w-4 h-4 text-white" />
            : <Bookmark className="w-4 h-4 text-white" />}
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
          {(recipe.dietary_tags ?? []).slice(0, 2).map(tag => (
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

// ── Recipe Preview Sheet ──────────────────────────────────────

function RecipePreviewSheet({
  recipe, saved, onToggleSave, onClose, onLike, onSkip,
}: {
  recipe: Recipe; saved: boolean; onToggleSave: () => void;
  onClose: () => void; onLike: () => void; onSkip: () => void;
}) {
  const [showIngredients, setShowIngredients] = useState(true);
  const [showInstructions, setShowInstructions] = useState(false);
  const totalTime = (recipe.prep_time_minutes ?? 0) + (recipe.cook_time_minutes ?? 0);
  const diff = recipe.difficulty_level ? DIFFICULTY_CONFIG[recipe.difficulty_level] : null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col" style={{ background: "rgba(0,0,0,0.6)" }}
      onClick={onClose}>
      <div className="mt-auto max-h-[92vh] overflow-y-auto rounded-t-3xl"
        style={{ background: "#FFFBF7" }}
        onClick={(e) => e.stopPropagation()}>

        {/* Image header */}
        <div className="relative h-56 overflow-hidden rounded-t-3xl">
          {recipe.image_url ? (
            <img src={recipe.image_url} alt={recipe.title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-5xl" style={{ background: "#FFF0E6" }}>🍽️</div>
          )}
          <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(20,8,2,0.85) 0%, transparent 60%)" }} />

          {/* Close pill */}
          <div className="absolute top-3 left-1/2 -translate-x-1/2 w-10 h-1 rounded-full opacity-60"
            style={{ background: "#fff" }} />

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

        {/* Body */}
        <div className="px-5 py-4">
          {/* Stats row */}
          <div className="flex items-center gap-4 mb-4 flex-wrap">
            {totalTime > 0 && (
              <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl"
                style={{ background: "#F5EDE4" }}>
                <Clock className="w-4 h-4" style={{ color: "#C85A2F" }} />
                <span className="text-sm font-semibold" style={{ color: "#3D2817" }}>{totalTime} min</span>
              </div>
            )}
            {recipe.calories && (
              <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl"
                style={{ background: "#F5EDE4" }}>
                <Flame className="w-4 h-4" style={{ color: "#C85A2F" }} />
                <span className="text-sm font-semibold" style={{ color: "#3D2817" }}>{recipe.calories} kcal</span>
              </div>
            )}
            {recipe.servings && (
              <div className="flex items-center gap-1 px-3 py-2 rounded-xl"
                style={{ background: "#F5EDE4" }}>
                <span className="text-sm font-semibold" style={{ color: "#3D2817" }}>
                  Serves {recipe.servings}
                </span>
              </div>
            )}
          </div>

          {recipe.description && (
            <p className="text-sm leading-relaxed mb-4" style={{ color: "#6B5B52" }}>{recipe.description}</p>
          )}

          {/* Macro pills */}
          {(recipe.protein_g || recipe.carbs_g || recipe.fat_g) && (
            <div className="flex gap-2 mb-4 flex-wrap">
              {recipe.protein_g && (
                <span className="text-xs px-2.5 py-1 rounded-full font-semibold"
                  style={{ background: "#DBEAFE", color: "#1D4ED8" }}>
                  Protein {Math.round(recipe.protein_g)}g
                </span>
              )}
              {recipe.carbs_g && (
                <span className="text-xs px-2.5 py-1 rounded-full font-semibold"
                  style={{ background: "#FEF3C7", color: "#92400E" }}>
                  Carbs {Math.round(recipe.carbs_g)}g
                </span>
              )}
              {recipe.fat_g && (
                <span className="text-xs px-2.5 py-1 rounded-full font-semibold"
                  style={{ background: "#F3E8FF", color: "#7C3AED" }}>
                  Fat {Math.round(recipe.fat_g)}g
                </span>
              )}
            </div>
          )}

          {/* Dietary tags */}
          {(recipe.dietary_tags ?? []).length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-4">
              {(recipe.dietary_tags ?? []).map(tag => (
                <span key={tag} className="text-xs px-2.5 py-1 rounded-full"
                  style={{ background: "#DCFCE7", color: "#16A34A" }}>
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Ingredients accordion */}
          {(recipe.ingredients ?? []).length > 0 && (
            <div className="mb-3 rounded-2xl overflow-hidden" style={{ border: "1.5px solid #F0E8DC" }}>
              <button
                onClick={() => setShowIngredients(s => !s)}
                className="w-full flex items-center justify-between px-4 py-3"
                style={{ background: "#FAF7F2" }}>
                <span className="font-semibold text-sm" style={{ color: "#3D2817" }}>
                  Ingredients ({recipe.ingredients?.length ?? 0})
                </span>
                {showIngredients
                  ? <ChevronUp className="w-4 h-4" style={{ color: "#A69180" }} />
                  : <ChevronDown className="w-4 h-4" style={{ color: "#A69180" }} />}
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

          {/* Instructions accordion */}
          {(recipe.instructions ?? []).length > 0 && (
            <div className="mb-5 rounded-2xl overflow-hidden" style={{ border: "1.5px solid #F0E8DC" }}>
              <button
                onClick={() => setShowInstructions(s => !s)}
                className="w-full flex items-center justify-between px-4 py-3"
                style={{ background: "#FAF7F2" }}>
                <span className="font-semibold text-sm" style={{ color: "#3D2817" }}>
                  Instructions ({recipe.instructions?.length ?? 0} steps)
                </span>
                {showInstructions
                  ? <ChevronUp className="w-4 h-4" style={{ color: "#A69180" }} />
                  : <ChevronDown className="w-4 h-4" style={{ color: "#A69180" }} />}
              </button>
              {showInstructions && (
                <div className="px-4 py-3 flex flex-col gap-3">
                  {(recipe.instructions ?? []).map((step, i) => (
                    <div key={i} className="flex gap-3">
                      <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5"
                        style={{ background: "#FFF0E6", color: "#C85A2F" }}>
                        {i + 1}
                      </span>
                      <p className="text-sm leading-relaxed flex-1" style={{ color: "#6B5B52" }}>{step}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Full recipe link */}
          <Link href={`/recipes/${recipe.id}`}
            className="flex items-center justify-center gap-2 w-full py-3 rounded-xl text-sm font-semibold mb-4 transition-opacity hover:opacity-80"
            style={{ background: "#EEF2FA", color: "#2C4A8C" }}>
            <ExternalLink className="w-4 h-4" />
            Full Recipe Page
          </Link>

          {/* Action buttons */}
          <div className="flex gap-3">
            <button onClick={onSkip}
              className="flex-1 py-3.5 rounded-2xl font-semibold text-sm transition-opacity hover:opacity-80 flex items-center justify-center gap-2"
              style={{ background: "#F5EDE4", color: "#6B5B52" }}>
              <X className="w-4 h-4" /> Skip
            </button>
            <button
              onClick={onToggleSave}
              className="flex items-center justify-center gap-1.5 px-4 py-3.5 rounded-2xl font-semibold text-sm transition-opacity hover:opacity-80"
              style={{ background: saved ? "#EEF2FA" : "#F5EDE4", color: saved ? "#2C4A8C" : "#6B5B52" }}>
              {saved ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
              {saved ? "Saved" : "Save"}
            </button>
            <button onClick={onLike}
              className="flex-1 py-3.5 rounded-2xl font-semibold text-sm text-white transition-opacity hover:opacity-90 flex items-center justify-center gap-2"
              style={{ background: "linear-gradient(135deg, #C85A2F, #E8834A)" }}>
              <Heart className="w-4 h-4 fill-white" /> Like
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Match Screen ──────────────────────────────────────────────

function MatchScreen({ liked, savedIds, onToggleSave, onRestart }: {
  liked: Recipe[]; savedIds: Set<string>; onToggleSave: (r: Recipe) => void; onRestart: () => void;
}) {
  return (
    <div className="min-h-screen px-4 py-8 max-w-lg mx-auto" style={{ background: "#FFFBF7" }}>
      <div className="text-center mb-8">
        <div className="text-5xl mb-3">🎉</div>
        <h1 className="text-2xl font-bold mb-1" style={{ color: "#3D2817" }}>Your Matches</h1>
        {liked.length === 0 ? (
          <p className="text-sm" style={{ color: "#A69180" }}>You didn't like any meals this time.</p>
        ) : (
          <p className="text-sm" style={{ color: "#A69180" }}>
            You liked {liked.length} meal{liked.length !== 1 ? "s" : ""}. Save your favourites!
          </p>
        )}
      </div>

      {liked.length > 0 && (
        <div className="flex flex-col gap-3 mb-8">
          {liked.map(recipe => {
            const totalTime = (recipe.prep_time_minutes ?? 0) + (recipe.cook_time_minutes ?? 0);
            const isSaved = savedIds.has(recipe.id);
            const diff = recipe.difficulty_level ? DIFFICULTY_CONFIG[recipe.difficulty_level] : null;
            return (
              <div key={recipe.id}
                className="flex items-center gap-3 rounded-2xl overflow-hidden shadow-sm"
                style={{ background: "#fff", border: "1px solid #F0E8DC" }}>
                <Link href={`/recipes/${recipe.id}`} className="w-20 h-20 shrink-0 overflow-hidden">
                  {recipe.image_url ? (
                    <img src={recipe.image_url} alt={recipe.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-2xl" style={{ background: "#FFF0E6" }}>🍽️</div>
                  )}
                </Link>
                <div className="flex-1 min-w-0 py-2">
                  <Link href={`/recipes/${recipe.id}`}>
                    <div className="font-semibold text-sm leading-tight mb-1 truncate pr-2" style={{ color: "#3D2817" }}>{recipe.title}</div>
                  </Link>
                  <div className="flex items-center gap-2 flex-wrap">
                    {recipe.cuisine_type && (
                      <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "#FFF0E6", color: "#C85A2F" }}>
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
                      <span className="text-xs flex items-center gap-0.5" style={{ color: "#A69180" }}>
                        <Clock className="w-3 h-3" />{totalTime}m
                      </span>
                    )}
                  </div>
                </div>
                <div className="pr-3 flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => onToggleSave(recipe)}
                    className="w-9 h-9 rounded-xl flex items-center justify-center transition-all hover:opacity-80"
                    style={{ background: isSaved ? "#EEF2FA" : "#F5EDE4" }}
                    title={isSaved ? "Remove from My Recipes" : "Save to My Recipes"}
                  >
                    {isSaved
                      ? <BookmarkCheck className="w-4 h-4" style={{ color: "#2C4A8C" }} />
                      : <Bookmark className="w-4 h-4" style={{ color: "#A69180" }} />}
                  </button>
                  <Link href={`/recipes/${recipe.id}`}
                    className="w-9 h-9 rounded-xl flex items-center justify-center"
                    style={{ background: "#F5EDE4" }}>
                    <ExternalLink className="w-4 h-4" style={{ color: "#A69180" }} />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {liked.length > 0 && (
        <div className="mb-5 p-4 rounded-2xl flex items-start gap-3"
          style={{ background: "#EEF2FA", border: "1px solid #C4CEE8" }}>
          <BookmarkCheck className="w-5 h-5 shrink-0 mt-0.5" style={{ color: "#2C4A8C" }} />
          <div>
            <p className="text-sm font-semibold" style={{ color: "#1A2F5A" }}>
              Saved recipes appear in My Recipes
            </p>
            <p className="text-xs mt-0.5" style={{ color: "#4A6090" }}>
              Find them under &ldquo;Liked via Meal Swipe&rdquo; in My Recipes.
            </p>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-3">
        <button onClick={onRestart}
          className="w-full py-3.5 rounded-2xl font-semibold text-white transition-opacity hover:opacity-90"
          style={{ background: "linear-gradient(135deg, #C85A2F, #E8834A)" }}>
          Swipe Again
        </button>
        <Link href="/my-recipes"
          className="w-full py-3.5 rounded-2xl font-semibold text-center"
          style={{ background: "#F5EDE4", color: "#6B5B52" }}>
          My Recipes
        </Link>
        <Link href="/discover"
          className="w-full py-3.5 rounded-2xl font-semibold text-center"
          style={{ background: "#F5EDE4", color: "#6B5B52" }}>
          Back to Discover
        </Link>
      </div>
    </div>
  );
}
