// src/lib/cooking-mode-context.tsx
"use client";

import { createContext, useContext, useState, useRef, useCallback, useEffect } from "react";

interface CookingModeContextValue {
  active: boolean;
  activate: () => Promise<void>;
  deactivate: () => void;
  currentStepText: string;
  setCurrentStepText: (text: string) => void;
}

const CookingModeContext = createContext<CookingModeContextValue>({
  active: false,
  activate: async () => {},
  deactivate: () => {},
  currentStepText: "",
  setCurrentStepText: () => {},
});

export function CookingModeProvider({ children }: { children: React.ReactNode }) {
  const [active, setActive] = useState(false);
  const [currentStepText, setCurrentStepText] = useState("");
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);

  const activate = useCallback(async () => {
    setActive(true);
    try {
      if (typeof navigator !== "undefined" && "wakeLock" in navigator) {
        wakeLockRef.current = await (navigator as Navigator & {
          wakeLock: { request: (type: string) => Promise<WakeLockSentinel> };
        }).wakeLock.request("screen");
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

  // Re-acquire wake lock when tab becomes visible again
  useEffect(() => {
    if (!active) return;
    function handleVisibilityChange() {
      if (document.visibilityState === "visible") activate();
    }
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [active, activate]);

  // Release on unmount
  useEffect(() => {
    return () => {
      if (wakeLockRef.current) wakeLockRef.current.release().catch(() => {});
    };
  }, []);

  return (
    <CookingModeContext.Provider value={{ active, activate, deactivate, currentStepText, setCurrentStepText }}>
      {children}
    </CookingModeContext.Provider>
  );
}

export function useCookingMode() {
  return useContext(CookingModeContext);
}
