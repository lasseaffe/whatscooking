"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { continentId } from "@/lib/continent-id";

interface CuisineNavProps {
  continents: string[];
}

export function CuisineNav({ continents }: CuisineNavProps) {
  const [active, setActive] = useState<string | null>(continents[0] ?? null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    if (observerRef.current) observerRef.current.disconnect();

    observerRef.current = new IntersectionObserver(
      (entries) => {
        // Find the first intersecting entry (topmost)
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible.length > 0) {
          const id = visible[0].target.id;
          const continent = continents.find((c) => continentId(c) === id);
          if (continent) setActive(continent);
        }
      },
      { threshold: 0.3 }
    );

    for (const continent of continents) {
      const el = document.getElementById(continentId(continent));
      if (el) observerRef.current.observe(el);
    }

    return () => observerRef.current?.disconnect();
  }, [continents]);

  function scrollTo(continent: string) {
    const el = document.getElementById(continentId(continent));
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <nav className="cuisine-sticky-nav">
      <ul className="cuisine-nav-list">
        {continents.map((continent) => {
          const isActive = active === continent;
          return (
            <li key={continent} style={{ position: "relative" }}>
              <button
                onClick={() => scrollTo(continent)}
                className="cuisine-nav-item"
                aria-current={isActive ? "location" : undefined}
                style={{
                  opacity: isActive ? 1 : 0.55,
                  color: isActive ? "var(--wc-accent-saffron, #F4A261)" : "var(--fg-primary, #EFE3CE)",
                }}
              >
                {continent}
              </button>
              {isActive && (
                <motion.div
                  layoutId="cuisine-nav-indicator"
                  className="cuisine-nav-indicator"
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}
            </li>
          );
        })}
      </ul>
      <style>{`
        .cuisine-sticky-nav {
          position: sticky;
          top: 0;
          z-index: 50;
          background: color-mix(in srgb, var(--wc-surface-2, #3A3430) 85%, transparent);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          border-bottom: 1px solid rgba(255,255,255,0.08);
        }
        [data-theme="light"] .cuisine-sticky-nav {
          border-bottom-color: rgba(0,0,0,0.08);
        }
        .cuisine-nav-list {
          list-style: none;
          margin: 0;
          padding: 0 1.5rem;
          display: flex;
          gap: 0;
          overflow-x: auto;
          scrollbar-width: none;
        }
        .cuisine-nav-list::-webkit-scrollbar { display: none; }
        .cuisine-nav-item {
          font-variant: small-caps;
          font-weight: 700;
          font-size: 0.75rem;
          letter-spacing: 0.1em;
          padding: 0.75rem 1rem;
          background: none;
          border: none;
          cursor: pointer;
          position: relative;
          white-space: nowrap;
          transition: opacity 0.2s ease, color 0.2s ease;
        }
        .cuisine-nav-item:hover {
          opacity: 0.8 !important;
        }
        .cuisine-nav-indicator {
          position: absolute;
          bottom: 0;
          left: 0.5rem;
          right: 0.5rem;
          height: 2px;
          background: var(--wc-accent-saffron, #F4A261);
          border-radius: 1px;
        }
      `}</style>
    </nav>
  );
}

