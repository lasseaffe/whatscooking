"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { ChefHat, X } from "lucide-react";

interface Props {
  children: React.ReactNode;
}

export function CookingModeWrapper({ children }: Props) {
  const [active, setActive] = useState(false);
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);

  const activate = useCallback(async () => {
    setActive(true);
    try {
      if (typeof navigator !== "undefined" && "wakeLock" in navigator) {
        wakeLockRef.current = await (navigator as Navigator & { wakeLock: { request: (type: string) => Promise<WakeLockSentinel> } }).wakeLock.request("screen");
      }
    } catch {
      // Wake lock not supported or denied — continue without it
    }
  }, []);

  const deactivate = useCallback(() => {
    setActive(false);
    if (wakeLockRef.current) {
      wakeLockRef.current.release().catch(() => {});
      wakeLockRef.current = null;
    }
  }, []);

  // Re-acquire wake lock when tab becomes visible again (browser may release it on tab hide)
  useEffect(() => {
    if (!active) return;
    function handleVisibilityChange() {
      if (document.visibilityState === "visible" && active) {
        activate();
      }
    }
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [active, activate]);

  // Release on unmount
  useEffect(() => {
    return () => {
      if (wakeLockRef.current) {
        wakeLockRef.current.release().catch(() => {});
      }
    };
  }, []);

  return (
    <div
      className={active ? "cooking-mode-active" : ""}
      style={{ minHeight: "calc(100vh - 48px)", position: "relative" }}
    >
      {children}

      {/* Cooking Mode toggle — fixed bottom-right, always accessible */}
      <div
        style={{
          position: "fixed",
          bottom: "1.5rem",
          right: "1.5rem",
          zIndex: 60,
        }}
      >
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

      {/* Cooking Mode active banner */}
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
            animation: "none",
          }}
          aria-hidden
        />
      )}
    </div>
  );
}
