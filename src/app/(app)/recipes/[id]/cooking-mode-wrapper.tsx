"use client";

import React from "react";
import { ChefHat } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { CookingModeProvider, useCookingMode } from "@/lib/cooking-mode-context";
import { CookingModeScreen } from "./cooking-mode-screen";
import { SetBgMode } from "@/components/set-bg-mode";

export interface CookingModeWrapperProps {
  children: React.ReactNode;
  recipeTitle: string;
  chefName?: string | null;
  rating?: string | null;
  reviewCount?: number;
  imageUrl?: string | null;
  baseServings?: number | null;
  instructions?: string[];
  ingredients?: { name: string; amount?: number | null; unit?: string | null }[];
}

function CookingModeWrapperInner({
  children,
  recipeTitle,
  chefName,
  rating,
  reviewCount,
  imageUrl,
  baseServings,
  instructions = [],
  ingredients = [],
}: CookingModeWrapperProps) {
  const { active, activate, deactivate } = useCookingMode();

  if (active) {
    return (
      <>
        <SetBgMode mode="cook" />
        <CookingModeScreen
        recipeTitle={recipeTitle}
        chefName={chefName}
        rating={rating ? parseFloat(rating) : null}
        reviewCount={reviewCount}
        imageUrl={imageUrl}
        baseServings={baseServings ?? 2}
        instructions={instructions}
        ingredients={ingredients}
        onExit={deactivate}
      />
      </>
    );
  }

  return (
    <div style={{ minHeight: "calc(100vh - 48px)", position: "relative" }}>
      <SetBgMode mode="functional" />
      {children}
    </div>
  );
}

// Sticky mobile CTA — appears when comments section scrolls into view
export function MobileStickyCTA({ hasInstructions }: { hasInstructions: boolean }) {
  const { activate } = useCookingMode();
  const [visible, setVisible] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!hasInstructions) return;
    const el = sentinelRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => setVisible(entry.isIntersecting),
      { threshold: 0 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [hasInstructions]);

  return (
    <>
      {/* Invisible sentinel placed at the top of the comments/interactions section */}
      <div ref={sentinelRef} aria-hidden="true" />
      {visible && hasInstructions && (
        <div
          className="fixed bottom-0 left-0 right-0 z-50 lg:hidden px-4 pb-4 pt-2"
          style={{ background: "linear-gradient(to top, rgba(13,10,7,0.98) 60%, transparent)" }}
        >
          <button
            type="button"
            onClick={activate}
            className="w-full flex items-center justify-center gap-3 rounded-2xl font-bold text-base transition-all hover:opacity-90 active:scale-[0.98]"
            style={{
              padding: "1rem 1.5rem",
              background: "linear-gradient(135deg, rgba(200,82,42,0.25) 0%, rgba(176,125,86,0.18) 100%)",
              border: "1.5px solid var(--wc-pal-accent, #B07D56)",
              color: "var(--wc-pal-accent, #B07D56)",
            }}
          >
            <ChefHat style={{ width: 20, height: 20, flexShrink: 0 }} />
            Start Cooking Mode
          </button>
        </div>
      )}
    </>
  );
}

export function CookingModeWrapper(props: CookingModeWrapperProps) {
  return (
    <CookingModeProvider>
      <CookingModeWrapperInner {...props} />
    </CookingModeProvider>
  );
}

// Standalone CTA — must be rendered inside a CookingModeWrapper (shared context).
export function CookingModeCTA({ commentsRef: _commentsRef }: { commentsRef?: React.RefObject<HTMLElement | null> }) {
  const { activate } = useCookingMode();
  const [isSticky, setIsSticky] = useState(true);

  useEffect(() => {
    const sentinel = document.getElementById("cta-sentinel");
    if (!sentinel) return;
    const observer = new IntersectionObserver(
      ([entry]) => setIsSticky(!entry.isIntersecting),
      { threshold: 0 }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, []);

  const btn = (
    <button
      type="button"
      onClick={activate}
      aria-label="Enter Cooking Mode"
      className="flex items-center justify-center gap-3 rounded-2xl font-bold transition-all hover:opacity-90 active:scale-[0.98] shadow-lg"
      style={{
        padding: "1rem 1.5rem",
        background: "linear-gradient(135deg, rgba(200,82,42,0.18) 0%, rgba(176,125,86,0.12) 100%)",
        border: "1.5px solid var(--wc-pal-accent, #B07D56)",
        color: "var(--wc-pal-accent, #B07D56)",
        fontSize: "1rem",
      }}
    >
      <ChefHat style={{ width: 20, height: 20, flexShrink: 0 }} />
      <span>Start Cooking Mode</span>
      <span className="text-xs font-normal opacity-60 hidden sm:inline" style={{ marginLeft: 4 }}>
        — keeps screen on
      </span>
    </button>
  );

  return (
    <>
      {/* Desktop: static below image */}
      <div className="hidden lg:block w-full">{btn}</div>
      {/* Mobile: sticky center-bottom when sentinel not visible */}
      <div className={`lg:hidden ${isSticky ? "fixed bottom-4 left-1/2 -translate-x-1/2 z-40" : "relative mt-4"}`}>
        {btn}
      </div>
    </>
  );
}
