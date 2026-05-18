"use client";

import { useState, useEffect } from "react";
import { useMotionValue } from "framer-motion";
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
  const zeroMotionX = useMotionValue(0);
  const topCardMotionX = useMotionValue(0);
  useEffect(() => { topCardMotionX.set(session.dragX); }, [session.dragX, topCardMotionX]);

  if (done || session.deck.length === 0) {
    return (
      <div
        className="w-full flex flex-col overflow-y-auto rounded-2xl mx-auto"
        style={{ height: 480, maxWidth: 480, background: "#1C1209", margin: "16px auto" }}
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
      data-tour="swipe-deck"
      className="w-full flex flex-col rounded-2xl overflow-hidden shadow-2xl"
      style={{
        height: 520,
        maxWidth: 480,
        margin: "16px auto",
        background: "#1C1209",
        border: "1px solid #2A1804",
      }}
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
      <div className="flex items-center gap-2 px-3 pt-2.5 pb-1 flex-wrap">
        <div className="flex items-center gap-1">
          {(["all", "easy", "medium", "hard"] as const).map((d) => (
            <button
              key={d}
              onClick={() => setDifficultyFilter(d)}
              className="px-2 py-0.5 rounded-full text-xs font-semibold transition-all"
              style={{
                background: difficultyFilter === d ? "#C85A2F" : "#2A1804",
                color: difficultyFilter === d ? "#fff" : "#8A6A4A",
                fontSize: "0.68rem",
              }}
            >
              {d === "all" ? "All" : d.charAt(0).toUpperCase() + d.slice(1)}
            </button>
          ))}
        </div>
        <span className="ml-auto" style={{ fontSize: "0.65rem", color: "#4A3020", fontWeight: 500 }}>
          {session.deck.length} left · {liked.length} liked
        </span>
      </div>

      {/* Progress bar */}
      <div className="mx-3 h-0.5 rounded-full overflow-hidden mb-1.5" style={{ background: "#2A1804" }}>
        <div
          className="h-full rounded-full transition-all duration-300"
          style={{
            width: `${((session.filteredRecipes.length - session.deck.length) / Math.max(session.filteredRecipes.length, 1)) * 100}%`,
            background: "linear-gradient(90deg, #C85A2F 0%, #E8834A 100%)",
          }}
        />
      </div>

      {/* Card stack */}
      <div className="relative flex-1 mx-3 mb-1.5">
        {nextCard && (
          <div className="absolute inset-0 rounded-2xl overflow-hidden" style={session.cardStyle(false)}>
            <RecipeCard
              recipe={nextCard}
              motionX={zeroMotionX}
              saved={savedIds.has(nextCard.id)}
              onToggleSave={() => session.toggleSave(nextCard)}
              onInfo={() => session.setPreviewRecipe(nextCard)}
            />
          </div>
        )}
        {currentCard && (
          <div
            ref={session.cardRef}
            className="absolute inset-0 rounded-2xl overflow-hidden shadow-xl"
            style={session.cardStyle(true)}
            onPointerDown={session.onPointerDown}
            onPointerMove={session.onPointerMove}
            onPointerUp={session.onPointerUp}
            onPointerCancel={session.onPointerUp}
          >
            <RecipeCard
              recipe={currentCard}
              motionX={topCardMotionX}
              saved={savedIds.has(currentCard.id)}
              onToggleSave={() => session.toggleSave(currentCard)}
              onInfo={() => session.setPreviewRecipe(currentCard)}
            />
          </div>
        )}
      </div>

      {/* Action buttons */}
      <div className="flex items-center justify-center gap-3 py-2 pb-3">
        <button
          type="button"
          onClick={() => session.commitSwipe("left")}
          disabled={!!session.exiting}
          className="w-11 h-11 rounded-full flex items-center justify-center shadow-lg transition-transform active:scale-90 hover:scale-110"
          style={{ background: "#1C1209", border: "2px solid #3A2416" }}
          aria-label="Skip"
        >
          <X className="w-5 h-5" style={{ color: "#C85A2F" }} />
        </button>

        <button
          type="button"
          onClick={() => currentCard && session.toggleSave(currentCard)}
          disabled={!currentCard}
          className="w-10 h-10 rounded-full flex items-center justify-center shadow-md transition-transform active:scale-90 hover:scale-110 disabled:opacity-30"
          style={{ background: "#1C1209", border: "2px solid #3A2416" }}
          aria-label="Save"
        >
          {currentCard && savedIds.has(currentCard.id)
            ? <BookmarkCheck className="w-4 h-4" style={{ color: "#7B9FD4" }} />
            : <Bookmark className="w-4 h-4" style={{ color: "#8A6A4A" }} />}
        </button>

        <button
          type="button"
          onClick={() => session.commitSwipe("right")}
          disabled={!!session.exiting}
          className="rounded-full flex items-center justify-center shadow-xl transition-transform active:scale-90 hover:scale-110"
          style={{ width: 56, height: 56, background: "linear-gradient(135deg, #C85A2F, #E8834A)" }}
          aria-label="Like"
        >
          <Heart className="w-6 h-6 fill-white text-white" />
        </button>

        <button
          type="button"
          onClick={() => currentCard && session.setPreviewRecipe(currentCard)}
          disabled={!currentCard}
          className="w-10 h-10 rounded-full flex items-center justify-center shadow-md transition-transform active:scale-90 hover:scale-110 disabled:opacity-30"
          style={{ background: "#1C1209", border: "2px solid #3A2416" }}
          aria-label="View recipe"
        >
          <Info className="w-4 h-4" style={{ color: "#8A6A4A" }} />
        </button>

        <button
          type="button"
          onClick={() => session.undo()}
          disabled={session.skipped.length === 0 || !!session.exiting}
          className="w-11 h-11 rounded-full flex items-center justify-center shadow-lg transition-transform active:scale-90 hover:scale-110 disabled:opacity-40"
          style={{ background: "#1C1209", border: "2px solid #3A2416" }}
          aria-label="Undo"
        >
          <RotateCcw className="w-4 h-4" style={{ color: "#8A6A4A" }} />
        </button>
      </div>
    </div>
  );
}
