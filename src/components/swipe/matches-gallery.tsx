"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { springGentle } from "@/lib/motion";
import type { SwipeRecipe } from "@/lib/hooks/use-swipe-fm";

interface MatchesGalleryProps {
  liked: SwipeRecipe[];
  onRestart: () => void;
}

export function MatchesGallery({ liked, onRestart }: MatchesGalleryProps) {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const saveAll = useCallback(async () => {
    if (saving || saved || liked.length === 0) return;
    setSaving(true);
    await Promise.all(
      liked.map((r) =>
        fetch("/api/saves", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ recipe_id: r.id }),
        })
      )
    );
    setSaving(false);
    setSaved(true);
  }, [liked, saving, saved]);

  return (
    <div className="min-h-screen flex flex-col items-center px-4 pt-10 pb-24" style={{ background: "#FFFBF7" }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={springGentle}
        className="w-full max-w-sm"
      >
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold mb-1" style={{ color: "#3D2817" }}>
            Your Matches
          </h1>
          <p className="text-sm" style={{ color: "#A69180" }}>
            {liked.length} {liked.length === 1 ? "recipe" : "recipes"} · tap to view · swipe again anytime
          </p>
        </div>

        {liked.length === 0 ? (
          <div className="text-center py-16" style={{ color: "#A69180" }}>
            <p className="text-4xl mb-3">🍽️</p>
            <p className="text-sm">No likes yet — give it another go!</p>
          </div>
        ) : (
          <>
            {/* 2-col image grid */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              {liked.map((recipe, i) => (
                <motion.div
                  key={recipe.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ ...springGentle, delay: i * 0.05 }}
                >
                  <Link
                    href={`/recipes/${recipe.id}`}
                    className="block relative rounded-2xl overflow-hidden shadow-md"
                    style={{ aspectRatio: "3/4" }}
                  >
                    {recipe.image_url ? (
                      <img
                        src={recipe.image_url}
                        alt={recipe.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div
                        className="w-full h-full flex items-center justify-center text-4xl"
                        style={{ background: "#FFF0E6" }}
                      >
                        🍽️
                      </div>
                    )}
                    <div
                      className="absolute inset-0 pointer-events-none"
                      style={{ background: "linear-gradient(to top, rgba(30,12,4,0.85) 0%, transparent 50%)" }}
                    />
                    <p
                      className="absolute bottom-2 left-2 right-2 text-xs font-medium leading-tight"
                      style={{ color: "#F5EDE4" }}
                    >
                      {recipe.title}
                    </p>
                  </Link>
                </motion.div>
              ))}
            </div>

            {/* CTAs */}
            <div className="flex flex-col gap-3">
              <motion.button
                type="button"
                onClick={saveAll}
                disabled={saving || saved}
                whileTap={{ scale: 0.97 }}
                className="w-full py-3.5 rounded-2xl font-bold text-sm transition-all"
                style={{
                  background: saved ? "#16A34A" : "#3D2817",
                  color: "#FFFBF7",
                  opacity: saving ? 0.7 : 1,
                }}
              >
                {saved
                  ? "✓ Saved to Collection"
                  : saving
                  ? "Saving…"
                  : `Save all ${liked.length} to Collection`}
              </motion.button>

              <button
                type="button"
                onClick={onRestart}
                className="w-full py-2.5 text-sm font-medium transition-opacity hover:opacity-70"
                style={{ color: "#A69180" }}
              >
                Shuffle again
              </button>
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
}
