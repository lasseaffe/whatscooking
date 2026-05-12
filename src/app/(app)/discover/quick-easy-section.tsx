// src/app/(app)/discover/quick-easy-section.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface QuickRecipe {
  id: string;
  title: string;
  image_url?: string | null;
  prep_time_minutes?: number | null;
  cook_time_minutes?: number | null;
}

interface Props {
  recipes: QuickRecipe[];
}

const CARD_WIDTH = 110;
const CARD_GAP = 12;
const CARD_STEP = CARD_WIDTH + CARD_GAP;
const VISIBLE = 4;

export function QuickEasySection({ recipes }: Props) {
  const [index, setIndex] = useState(0);

  if (recipes.length < 3) return null;

  const maxIndex = Math.max(0, recipes.length - VISIBLE);

  return (
    <div
      className="px-4 py-5"
      style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
    >
      <div className="flex items-center justify-between mb-3">
        <h2
          className="text-sm font-bold"
          style={{ color: "var(--wc-text, #EFE3CE)", fontFamily: "'Libre Baskerville', Georgia, serif" }}
        >
          ⚡ Quick &amp; Easy
        </h2>
        <div className="flex items-center gap-2">
          <span className="text-xs" style={{ color: "var(--fg-secondary, #8A6A4A)" }}>
            Under 20 min
          </span>
          {index > 0 && (
            <button
              onClick={() => setIndex((i) => Math.max(0, i - 1))}
              className="w-6 h-6 rounded-full flex items-center justify-center"
              style={{ background: "#C8522A", color: "#fff" }}
              aria-label="Previous"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
          )}
          {index < maxIndex && (
            <button
              onClick={() => setIndex((i) => Math.min(maxIndex, i + 1))}
              className="w-6 h-6 rounded-full flex items-center justify-center"
              style={{ background: "#C8522A", color: "#fff" }}
              aria-label="Next"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      <div className="overflow-hidden">
        <motion.div
          className="flex"
          style={{ gap: CARD_GAP, width: recipes.length * CARD_STEP }}
          animate={{ x: -(index * CARD_STEP) }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        >
          {recipes.map((r) => {
            const totalTime = (r.prep_time_minutes ?? 0) + (r.cook_time_minutes ?? 0);
            return (
              <Link
                key={r.id}
                href={`/recipes/${r.id}`}
                className="flex-shrink-0 rounded-xl overflow-hidden"
                style={{
                  width: CARD_WIDTH,
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.07)",
                }}
              >
                <div className="overflow-hidden" style={{ height: 72 }}>
                  {r.image_url ? (
                    <img src={r.image_url} alt={r.title} className="w-full h-full object-cover" />
                  ) : (
                    <div
                      className="w-full h-full flex items-center justify-center text-2xl"
                      style={{ background: "#2A1804" }}
                    >
                      🍽️
                    </div>
                  )}
                </div>
                <div className="p-1.5">
                  <p
                    className="text-xs font-semibold leading-tight line-clamp-2 mb-1"
                    style={{ color: "var(--wc-text, #EFE3CE)" }}
                  >
                    {r.title}
                  </p>
                  {totalTime > 0 && (
                    <span
                      className="text-xs font-semibold"
                      style={{ color: "var(--wc-accent-saffron, #F4A261)" }}
                    >
                      ⚡ {totalTime} min
                    </span>
                  )}
                </div>
              </Link>
            );
          })}
        </motion.div>
      </div>

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
  );
}
