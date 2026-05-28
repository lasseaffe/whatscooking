"use client";

import { useRef, useState, useEffect } from "react";
import Link from "next/link";
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

export function QuickEasySection({ recipes }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(false);

  function updateArrows() {
    const el = scrollRef.current;
    if (!el) return;
    setCanLeft(el.scrollLeft > 4);
    setCanRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  }

  useEffect(() => {
    updateArrows();
    const el = scrollRef.current;
    if (!el) return;
    el.addEventListener("scroll", updateArrows, { passive: true });
    const ro = new ResizeObserver(updateArrows);
    ro.observe(el);
    return () => { el.removeEventListener("scroll", updateArrows); ro.disconnect(); };
  }, [recipes]);

  function scroll(dir: "left" | "right") {
    scrollRef.current?.scrollBy({ left: dir === "left" ? -320 : 320, behavior: "smooth" });
  }

  if (recipes.length === 0) return null;

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
          <div className="flex gap-1">
            <button
              type="button"
              aria-label="Scroll left"
              onClick={() => scroll("left")}
              className="rounded-full p-1 transition-all"
              style={{
                background: "rgba(255,255,255,0.06)",
                color: "#A69180",
                opacity: canLeft ? 1 : 0.25,
                pointerEvents: canLeft ? "auto" : "none",
              }}
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              aria-label="Scroll right"
              onClick={() => scroll("right")}
              className="rounded-full p-1 transition-all"
              style={{
                background: "rgba(255,255,255,0.06)",
                color: "#A69180",
                opacity: canRight ? 1 : 0.25,
                pointerEvents: canRight ? "auto" : "none",
              }}
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      <div
        ref={scrollRef}
        className="flex gap-3 overflow-x-auto pb-1"
        style={{ scrollbarWidth: "none" }}
      >
        {recipes.map((r) => {
          const totalTime = (r.prep_time_minutes ?? 0) + (r.cook_time_minutes ?? 0);
          return (
            <Link
              key={r.id}
              href={`/recipes/${r.id}`}
              className="flex-shrink-0 rounded-xl overflow-hidden"
              style={{ width: 180, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}
            >
              <div className="overflow-hidden" style={{ height: 135 }}>
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
              <div className="p-2">
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
      </div>
    </div>
  );
}
