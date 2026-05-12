// src/components/finder-results-section.tsx
"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, X, Wand2 } from "lucide-react";
import { RecipeCard } from "@/components/recipe-card";
import type { Recipe } from "@/lib/types";

interface Props {
  recipes: Recipe[];
  profile: { vibeLabel: string | null; timeLabel: string | null };
  onRefine: () => void;
  onDismiss: () => void;
}

const VISIBLE = 4;

export function FinderResultsSection({ recipes, profile, onRefine, onDismiss }: Props) {
  const [index, setIndex] = useState(0);

  if (recipes.length === 0) return null;

  const maxIndex = Math.max(0, recipes.length - VISIBLE);
  const summaryParts = [profile.vibeLabel, profile.timeLabel].filter(Boolean) as string[];

  return (
    <section
      className="px-4 py-5"
      style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <Wand2 className="w-4 h-4" style={{ color: "#C8522A" }} />
            <span
              className="font-bold text-sm"
              style={{
                color: "#EFE3CE",
                fontFamily: "'Libre Baskerville', Georgia, serif",
              }}
            >
              Your Picks
            </span>
            <span
              className="text-xs font-semibold px-2 py-0.5 rounded-full border"
              style={{
                background: "#2A1808",
                borderColor: "#C8522A40",
                color: "#C8522A",
              }}
            >
              {recipes.length} recipes
            </span>
          </div>
          {summaryParts.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {summaryParts.map((part) => (
                <span
                  key={part}
                  className="text-xs px-2.5 py-1 rounded-full font-medium"
                  style={{
                    background: "rgba(200,82,42,0.12)",
                    border: "1px solid #C8522A30",
                    color: "#C8522A",
                  }}
                >
                  {part}
                </span>
              ))}
            </div>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0 ml-3">
          <button
            onClick={onRefine}
            className="text-xs font-semibold px-3 py-1.5 rounded-full"
            style={{
              background: "#2A1808",
              color: "#C8522A",
              border: "1px solid #C8522A40",
            }}
          >
            ✏️ Refine
          </button>
          <button
            onClick={onDismiss}
            className="w-7 h-7 rounded-full flex items-center justify-center"
            style={{ background: "#2A1808", color: "#6B4E36" }}
            aria-label="Dismiss picks"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Carousel */}
      <div className="relative">
        <button
          onClick={() => setIndex((i) => Math.max(0, i - 1))}
          disabled={index === 0}
          className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-10 w-9 h-9 rounded-full flex items-center justify-center shadow-lg transition-all"
          style={{
            background: "#C8522A",
            color: "#fff",
            opacity: index === 0 ? 0.3 : 1,
          }}
          aria-label="Previous recipes"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        <div className="overflow-hidden">
          <motion.div
            className="flex gap-4"
            animate={{
              x: `calc(-${index * (100 / VISIBLE)}% - ${(index * 16) / VISIBLE}px)`,
            }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            style={{ width: `${(recipes.length / VISIBLE) * 100}%` }}
          >
            {recipes.map((recipe) => (
              <div
                key={recipe.id}
                style={{ width: `${100 / recipes.length}%`, flexShrink: 0 }}
              >
                <RecipeCard recipe={recipe} />
              </div>
            ))}
          </motion.div>
        </div>

        <button
          onClick={() => setIndex((i) => Math.min(maxIndex, i + 1))}
          disabled={index >= maxIndex}
          className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-10 w-9 h-9 rounded-full flex items-center justify-center shadow-lg transition-all"
          style={{
            background: "#C8522A",
            color: "#fff",
            opacity: index >= maxIndex ? 0.3 : 1,
          }}
          aria-label="Next recipes"
        >
          <ChevronRight className="w-4 h-4" />
        </button>

        {recipes.length > VISIBLE && (
          <div className="flex justify-center gap-1.5 mt-3">
            {Array.from({ length: maxIndex + 1 }, (_, i) => (
              <button
                key={i}
                onClick={() => setIndex(i)}
                className="rounded-full transition-all"
                style={{
                  width: i === index ? 20 : 6,
                  height: 6,
                  background: i === index ? "#C8522A" : "#3A2416",
                }}
                aria-label={`Go to slide ${i + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
