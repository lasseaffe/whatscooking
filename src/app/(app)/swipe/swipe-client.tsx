"use client";

import { useState } from "react";
import Link from "next/link";
import { Heart, X, Bookmark, BookmarkCheck, Info, RotateCcw, Filter, ShieldAlert, ChevronLeft } from "lucide-react";
import { useSwipeSession } from "@/lib/hooks/use-swipe-session";
import type { SwipeRecipe } from "@/lib/hooks/use-swipe-session";
import { RecipeCard, RecipePreviewSheet, MatchScreen, DIFFICULTY_CONFIG } from "@/components/swipe/swipe-cards";
import { useDietaryMode } from "@/lib/dietary-mode-context";

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
            type="button"
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
                <button
                  key={d}
                  type="button"
                  onClick={() => setDifficultyFilter(d)}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all"
                  style={{
                    background: active ? (cfg?.bg ?? "#3D2817") : "#F5EDE4",
                    color: active ? (cfg?.color ?? "#fff") : "#6B5B52",
                    border: active ? `1px solid ${cfg?.color ?? "#3D2817"}40` : "1px solid transparent",
                  }}
                >
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
          <div
            className="h-full rounded-full transition-all duration-300"
            style={{
              width: `${((session.filteredRecipes.length - session.deck.length) / Math.max(session.filteredRecipes.length, 1)) * 100}%`,
              background: "linear-gradient(90deg, #C85A2F 0%, #E8834A 100%)",
            }}
          />
        </div>
      </div>

      {/* Card stack */}
      <div className="relative w-full max-w-sm" style={{ height: 500, touchAction: "none" }}>
        {nextCard && (
          <div
            className="absolute inset-0 rounded-3xl overflow-hidden"
            style={{ ...session.cardStyle(false), pointerEvents: "none" }}
          >
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

      <p className="mt-3 text-xs" style={{ color: "#C4B5A8" }}>
        Tap card to preview · swipe or use buttons · ← → keyboard
      </p>

      {/* Action buttons */}
      <div className="flex items-center gap-6 mt-4">
        <button
          type="button"
          onClick={() => session.commitSwipe("left")}
          disabled={!!session.exiting}
          className="w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-transform active:scale-90 hover:scale-110"
          style={{ background: "#fff", border: "2px solid #F5E6D3" }}
          aria-label="Skip"
        >
          <X className="w-6 h-6" style={{ color: "#C85A2F" }} />
        </button>

        <button
          type="button"
          onClick={() => currentCard && session.toggleSave(currentCard)}
          disabled={!currentCard}
          className="w-12 h-12 rounded-full flex items-center justify-center shadow-md transition-transform active:scale-90 hover:scale-110 disabled:opacity-30"
          style={{ background: "#fff", border: "2px solid #F5E6D3" }}
          aria-label="Save"
        >
          {currentCard && savedIds.has(currentCard.id)
            ? <BookmarkCheck className="w-5 h-5" style={{ color: "#2C4A8C" }} />
            : <Bookmark className="w-5 h-5" style={{ color: "#A69180" }} />}
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
          style={{ background: "#fff", border: "2px solid #F5E6D3" }}
          aria-label="View recipe"
        >
          <Info className="w-5 h-5" style={{ color: "#A69180" }} />
        </button>

        <button
          type="button"
          onClick={() => session.undo()}
          disabled={session.skipped.length === 0 || !!session.exiting}
          className="w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-transform active:scale-90 hover:scale-110 disabled:opacity-40"
          style={{ background: "#fff", border: "2px solid #F5E6D3" }}
          aria-label="Undo"
        >
          <RotateCcw className="w-5 h-5" style={{ color: "#A69180" }} />
        </button>
      </div>
    </div>
  );
}
