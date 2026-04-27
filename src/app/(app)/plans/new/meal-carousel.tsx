"use client";
import React, { useEffect, useRef, useState, useMemo, useCallback } from "react";
import { FaArrowLeft, FaArrowRight } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import { Clock, Flame } from "lucide-react";

export interface CarouselMeal {
  title: string;
  image: string;
  tags: string[];
  time: string;
  calories: number;
}

interface Props {
  meals: CarouselMeal[];
  autoplay?: boolean;
}

function calculateGap(width: number) {
  const minWidth = 1024, maxWidth = 1456, minGap = 48, maxGap = 72;
  if (width <= minWidth) return minGap;
  if (width >= maxWidth) return Math.max(minGap, maxGap + 0.06018 * (width - maxWidth));
  return minGap + (maxGap - minGap) * ((width - minWidth) / (maxWidth - minWidth));
}

export function MealCarousel({ meals, autoplay = true }: Props) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [hoverPrev, setHoverPrev] = useState(false);
  const [hoverNext, setHoverNext] = useState(false);
  const [containerWidth, setContainerWidth] = useState(600);
  const containerRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const len = useMemo(() => meals.length, [meals]);
  const active = useMemo(() => meals[activeIndex], [activeIndex, meals]);

  useEffect(() => {
    function onResize() {
      if (containerRef.current) setContainerWidth(containerRef.current.offsetWidth);
    }
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    if (!autoplay) return;
    timerRef.current = setInterval(() => setActiveIndex((p) => (p + 1) % len), 4000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [autoplay, len]);

  const handleNext = useCallback(() => {
    setActiveIndex((p) => (p + 1) % len);
    if (timerRef.current) clearInterval(timerRef.current);
  }, [len]);

  const handlePrev = useCallback(() => {
    setActiveIndex((p) => (p - 1 + len) % len);
    if (timerRef.current) clearInterval(timerRef.current);
  }, [len]);

  function getImageStyle(index: number): React.CSSProperties {
    const gap = calculateGap(containerWidth);
    const maxStickUp = gap * 0.7;
    const isActive = index === activeIndex;
    const isLeft = (activeIndex - 1 + len) % len === index;
    const isRight = (activeIndex + 1) % len === index;
    if (isActive) return { zIndex: 3, opacity: 1, pointerEvents: "auto", transform: "translateX(0) translateY(0) scale(1) rotateY(0deg)", transition: "all 0.8s cubic-bezier(.4,2,.3,1)" };
    if (isLeft) return { zIndex: 2, opacity: 0.85, pointerEvents: "auto", transform: `translateX(-${gap}px) translateY(-${maxStickUp}px) scale(0.82) rotateY(14deg)`, transition: "all 0.8s cubic-bezier(.4,2,.3,1)" };
    if (isRight) return { zIndex: 2, opacity: 0.85, pointerEvents: "auto", transform: `translateX(${gap}px) translateY(-${maxStickUp}px) scale(0.82) rotateY(-14deg)`, transition: "all 0.8s cubic-bezier(.4,2,.3,1)" };
    return { zIndex: 1, opacity: 0, pointerEvents: "none", transition: "all 0.8s cubic-bezier(.4,2,.3,1)" };
  }

  return (
    <div className="w-full">
      {/* Image stack */}
      <div ref={containerRef} className="relative w-full" style={{ height: 200, perspective: "1000px" }}>
        {meals.map((meal, i) => (
          <img
            key={`${meal.title}-${i}`}
            src={meal.image}
            alt={meal.title}
            className="absolute inset-0 w-full h-full object-cover rounded-2xl shadow-lg"
            style={getImageStyle(i)}
            onError={(e) => { (e.target as HTMLImageElement).style.opacity = "0"; }}
          />
        ))}
      </div>

      {/* Info + controls */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeIndex}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.25 }}
          className="mt-4 px-1"
        >
          <p className="font-bold text-sm leading-snug mb-1" style={{ color: "#EFE3CE" }}>{active.title}</p>
          <div className="flex flex-wrap items-center gap-1.5 mb-2">
            {active.tags.map((tag) => (
              <span key={tag} className="text-xs px-2 py-0.5 rounded-full" style={{ background: "#2A1808", color: "#C8522A" }}>{tag}</span>
            ))}
            <span className="flex items-center gap-0.5 text-xs ml-auto" style={{ color: "#6B4E36" }}>
              <Clock className="w-3 h-3" />{active.time}
            </span>
            <span className="flex items-center gap-0.5 text-xs" style={{ color: "#6B4E36" }}>
              <Flame className="w-3 h-3" />{active.calories}
            </span>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Arrows + dots */}
      <div className="flex gap-3 mt-2">
        <button
          onClick={handlePrev}
          className="w-9 h-9 rounded-full flex items-center justify-center border-none cursor-pointer transition-colors"
          style={{ background: hoverPrev ? "#C8522A" : "#2A1808" }}
          onMouseEnter={() => setHoverPrev(true)}
          onMouseLeave={() => setHoverPrev(false)}
          aria-label="Previous meal"
        >
          <FaArrowLeft size={14} color="#EFE3CE" />
        </button>
        <button
          onClick={handleNext}
          className="w-9 h-9 rounded-full flex items-center justify-center border-none cursor-pointer transition-colors"
          style={{ background: hoverNext ? "#C8522A" : "#2A1808" }}
          onMouseEnter={() => setHoverNext(true)}
          onMouseLeave={() => setHoverNext(false)}
          aria-label="Next meal"
        >
          <FaArrowRight size={14} color="#EFE3CE" />
        </button>

        <div className="flex items-center gap-1 ml-auto">
          {meals.map((_, i) => (
            <button
              key={i}
              onClick={() => { setActiveIndex(i); if (timerRef.current) clearInterval(timerRef.current); }}
              className="rounded-full transition-all border-none cursor-pointer p-0"
              style={{ width: i === activeIndex ? 14 : 5, height: 5, background: i === activeIndex ? "#C8522A" : "#3A2416" }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
