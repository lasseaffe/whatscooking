"use client";

import { useState, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export interface SodaSlide {
  id: string;
  title: string;
  description: string;
  image_url: string | null;
  source_name: string | null;
  source_url: string | null;
}

export function DirtySodaSlideshow({ slides }: { slides: SodaSlide[] }) {
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);

  const next = useCallback(() => setCurrent((p) => (p + 1) % slides.length), [slides.length]);
  const prev = () => setCurrent((p) => (p - 1 + slides.length) % slides.length);

  useEffect(() => {
    if (paused || slides.length <= 1) return;
    const id = setInterval(next, 4500);
    return () => clearInterval(id);
  }, [paused, next, slides.length]);

  if (!slides.length) return null;

  const slide = slides[current];

  return (
    <div
      className="relative rounded-2xl overflow-hidden"
      style={{ height: 280 }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* Slide images — all stacked, fade in/out */}
      {slides.map((s, i) => (
        <div
          key={s.id}
          className="absolute inset-0 transition-opacity duration-700"
          style={{ opacity: i === current ? 1 : 0 }}
        >
          {s.image_url && (
            <img
              src={s.image_url}
              alt={s.title}
              className="w-full h-full object-cover"
            />
          )}
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(to top, rgba(30,10,5,0.92) 0%, rgba(30,10,5,0.45) 55%, rgba(30,10,5,0.15) 100%)",
            }}
          />
        </div>
      ))}

      {/* HolyFlex badge */}
      <a
        href="https://holyflex.com"
        target="_blank"
        rel="noopener noreferrer"
        className="absolute top-4 right-4 z-10 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold tracking-wide backdrop-blur-sm transition-opacity hover:opacity-90"
        style={{ background: "rgba(200,90,47,0.85)", color: "#fff" }}
      >
        <span>★</span> HolyFlex
      </a>

      {/* Content overlay */}
      <div className="absolute bottom-0 left-0 right-0 z-10 p-5">
        <p className="text-xs font-medium mb-1" style={{ color: "rgba(255,220,180,0.8)" }}>
          Utah Dirty Soda
        </p>
        <h3 className="text-lg font-bold leading-snug mb-1" style={{ color: "#fff" }}>
          {slide.title}
        </h3>
        <p className="text-xs leading-relaxed mb-3 line-clamp-2" style={{ color: "rgba(255,255,255,0.75)" }}>
          {slide.description}
        </p>
        <div className="flex items-center gap-2 flex-wrap">
          <a
            href="/discover"
            className="px-3 py-1.5 rounded-lg text-xs font-semibold"
            style={{ background: "#C85A2F", color: "#fff" }}
          >
            See all dirty sodas →
          </a>
          <a
            href="https://holyflex.com"
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1.5 rounded-lg text-xs font-semibold"
            style={{ background: "rgba(255,255,255,0.15)", color: "#fff", backdropFilter: "blur(4px)" }}
          >
            Try HolyFlex
          </a>
          {slide.source_name && slide.source_url && (
            <span className="text-xs" style={{ color: "rgba(255,255,255,0.45)" }}>
              via {slide.source_name}
            </span>
          )}
        </div>
      </div>

      {/* Prev / Next */}
      {slides.length > 1 && (
        <>
          <button
            onClick={prev}
            className="absolute left-3 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full flex items-center justify-center transition-opacity hover:opacity-100 opacity-60"
            style={{ background: "rgba(0,0,0,0.4)" }}
          >
            <ChevronLeft className="w-4 h-4 text-white" />
          </button>
          <button
            onClick={next}
            className="absolute right-3 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full flex items-center justify-center transition-opacity hover:opacity-100 opacity-60"
            style={{ background: "rgba(0,0,0,0.4)" }}
          >
            <ChevronRight className="w-4 h-4 text-white" />
          </button>

          {/* Dots */}
          <div className="absolute bottom-4 right-5 z-10 flex gap-1.5">
            {slides.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                className="rounded-full transition-all"
                style={{
                  width: i === current ? 16 : 6,
                  height: 6,
                  background: i === current ? "#C85A2F" : "rgba(255,255,255,0.4)",
                }}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
