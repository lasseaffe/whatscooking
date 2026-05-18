"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { CUISINES, CUISINE_REGIONS } from "@/lib/cuisines";
import type { CuisineInfo } from "@/lib/cuisines";

interface Props {
  /** Rotation interval in ms. Default 6000 (6 seconds per region). */
  intervalMs?: number;
}

function flagEmoji(code: string): string {
  if (!code || code.length !== 2) return "";
  const base = 127397; // regional indicator A - 'A'.charCodeAt(0)
  return String.fromCodePoint(...[...code.toUpperCase()].map((c) => base + c.charCodeAt(0)));
}

// ── Single rich card (matches the design from discover-client.tsx) ──
function CuisineCard({ cuisine }: { cuisine: CuisineInfo }) {
  return (
    <Link
      href={`/cuisines/${cuisine.slug}`}
      className="rounded-2xl overflow-hidden transition-transform hover:-translate-y-1 hover:shadow-lg text-left shrink-0 flex flex-col"
      style={{
        width: 160,
        border: "1px solid #3A2416",
        background: "#1C1209",
      }}
    >
      <div className="relative overflow-hidden" style={{ height: 112 }}>
        <img
          src={cuisine.heroImage}
          alt={cuisine.name}
          className="w-full h-full object-cover"
          loading="lazy"
        />
        <div
          className="absolute inset-0"
          style={{ background: "linear-gradient(to top, rgba(20,10,4,0.85) 0%, rgba(0,0,0,0.1) 55%, transparent 100%)" }}
        />
        <div className="absolute bottom-0 left-0 right-0 px-2.5 pb-2">
          <div className="flex items-end justify-between gap-1">
            <h3 className="text-white font-bold text-sm leading-tight drop-shadow-sm">{cuisine.name}</h3>
            <span className="text-base shrink-0">{flagEmoji(cuisine.flag)}</span>
          </div>
        </div>
        <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: cuisine.color }} />
      </div>
      <div className="px-2.5 py-2 flex flex-col flex-1">
        <p
          className="text-xs font-medium italic mb-1.5 line-clamp-1"
          style={{ color: cuisine.color }}
        >
          &ldquo;{cuisine.tagline}&rdquo;
        </p>
        <div className="flex flex-wrap gap-1">
          {cuisine.keyDishes.slice(0, 2).map((dish) => (
            <span
              key={dish}
              className="text-xs px-1.5 py-0.5 rounded-full"
              style={{ background: "rgba(255,255,255,0.07)", color: cuisine.color, fontSize: "10px" }}
            >
              {dish}
            </span>
          ))}
        </div>
      </div>
    </Link>
  );
}

export function CuisineRotator({ intervalMs = 6000 }: Props) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const regions = CUISINE_REGIONS;

  useEffect(() => {
    if (paused) return;
    timer.current = setInterval(() => {
      setIndex((i) => (i + 1) % regions.length);
    }, intervalMs);
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, [paused, intervalMs, regions.length]);

  const goPrev = () => setIndex((i) => (i - 1 + regions.length) % regions.length);
  const goNext = () => setIndex((i) => (i + 1) % regions.length);

  const region = regions[index];
  const cuisinesInRegion = CUISINES.filter((c) => c.region === region);

  return (
    <div
      className="px-4 py-5"
      style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="flex items-center justify-between mb-3">
        <h2
          className="text-sm font-bold"
          style={{ color: "var(--wc-text, #EFE3CE)", fontFamily: "'Libre Baskerville', Georgia, serif" }}
        >
          🌍 World Cuisines
        </h2>
        <Link
          href="/cuisines"
          className="text-xs font-semibold"
          style={{ color: "var(--wc-accent-saffron, #F4A261)" }}
        >
          See all →
        </Link>
      </div>

      {/* Region header with prev/next */}
      <div className="flex items-center justify-between mb-3">
        <button
          type="button"
          aria-label="Previous region"
          onClick={goPrev}
          className="rounded-full p-1 transition-colors hover:bg-white/5"
          style={{ color: "#A69180" }}
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <AnimatePresence mode="wait">
          <motion.h3
            key={region}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.3 }}
            className="text-xs font-bold uppercase tracking-widest"
            style={{ color: "#A69180" }}
          >
            {region}
          </motion.h3>
        </AnimatePresence>
        <button
          type="button"
          aria-label="Next region"
          onClick={goNext}
          className="rounded-full p-1 transition-colors hover:bg-white/5"
          style={{ color: "#A69180" }}
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Sliding card row */}
      <div className="relative overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={region}
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="flex gap-3 overflow-x-auto pb-2"
            style={{ scrollbarWidth: "none" }}
          >
            {cuisinesInRegion.map((c) => (
              <CuisineCard key={c.slug} cuisine={c} />
            ))}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Region dots */}
      <div className="flex justify-center gap-1.5 mt-3">
        {regions.map((r, i) => (
          <button
            key={r}
            type="button"
            aria-label={`Show ${r} cuisines`}
            onClick={() => setIndex(i)}
            className="rounded-full transition-all"
            style={{
              width: i === index ? 18 : 6,
              height: 6,
              background: i === index ? "var(--wc-accent-saffron, #F4A261)" : "rgba(255,255,255,0.2)",
            }}
          />
        ))}
      </div>
    </div>
  );
}
