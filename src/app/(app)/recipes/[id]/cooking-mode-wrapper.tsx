"use client";

import { ChefHat, X } from "lucide-react";
import { CookingModeProvider, useCookingMode } from "@/lib/cooking-mode-context";

function CookingModeButtons() {
  const { active, activate, deactivate } = useCookingMode();
  return (
    <div style={{ position: "fixed", bottom: "1.5rem", right: "1.5rem", zIndex: 60 }}>
      <div className="group relative">
        {/* Tooltip */}
        <div
          className="absolute bottom-full right-0 mb-2 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-150"
          style={{ background: "rgba(13,9,7,0.95)", color: "#EFE3CE", border: "1px solid rgba(58,36,22,0.6)" }}
        >
          {active
            ? "Exit cooking mode — releases screen lock"
            : "Keep screen on while you cook"}
        </div>

        {active ? (
          <button
            type="button"
            onClick={deactivate}
            aria-label="Exit Cooking Mode"
            className="flex items-center gap-2 font-bold rounded-2xl shadow-2xl transition-all hover:opacity-90 active:scale-95"
            style={{
              minWidth: 44,
              minHeight: 44,
              padding: "0.6rem 1.1rem",
              background: "rgba(200,82,42,0.95)",
              color: "#fff",
              backdropFilter: "blur(8px)",
              border: "1.5px solid rgba(255,255,255,0.15)",
              fontSize: "0.8rem",
            }}
          >
            <X style={{ width: 16, height: 16, flexShrink: 0 }} />
            Exit Cooking Mode
          </button>
        ) : (
          <button
            type="button"
            onClick={activate}
            aria-label="Enter Cooking Mode"
            className="flex items-center gap-2 font-bold rounded-2xl shadow-2xl transition-all hover:opacity-90 active:scale-95"
            style={{
              minWidth: 44,
              minHeight: 44,
              padding: "0.6rem 1.1rem",
              background: "rgba(28,18,9,0.92)",
              color: "var(--wc-pal-accent, #B07D56)",
              backdropFilter: "blur(8px)",
              border: "1.5px solid var(--wc-pal-accent, #B07D56)",
              fontSize: "0.8rem",
            }}
          >
            <ChefHat style={{ width: 16, height: 16, flexShrink: 0 }} />
            Cooking Mode
          </button>
        )}
      </div>
    </div>
  );
}

function CookingModeWrapperInner({ children }: { children: React.ReactNode }) {
  const { active } = useCookingMode();
  return (
    <div
      className={active ? "cooking-mode-active" : ""}
      style={{ minHeight: "calc(100vh - 48px)", position: "relative" }}
    >
      {children}
      <CookingModeButtons />
      {active && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            zIndex: 55,
            height: 3,
            background: "linear-gradient(90deg, #C8522A, #B07D56, #828E6F)",
          }}
          aria-hidden
        />
      )}
    </div>
  );
}

export function CookingModeWrapper({ children }: { children: React.ReactNode }) {
  return (
    <CookingModeProvider>
      <CookingModeWrapperInner>{children}</CookingModeWrapperInner>
    </CookingModeProvider>
  );
}
