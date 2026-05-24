// src/lib/cooking-mode-context.tsx
"use client";

import { createContext, useContext, useState, useRef, useCallback, useEffect } from "react";

export type VoiceState = "idle" | "listening" | "speaking";

interface CookingModeContextValue {
  active: boolean;
  activate: () => Promise<void>;
  deactivate: () => void;
  currentStepText: string;
  setCurrentStepText: (text: string) => void;
  voiceEnabled: boolean;
  voiceState: VoiceState;
  setVoiceState: (s: VoiceState) => void;
  toggleVoice: () => void;
}

const CookingModeContext = createContext<CookingModeContextValue>({
  active: false,
  activate: async () => {},
  deactivate: () => {},
  currentStepText: "",
  setCurrentStepText: () => {},
  voiceEnabled: false,
  voiceState: "idle",
  setVoiceState: () => {},
  toggleVoice: () => {},
});

export function CookingModeProvider({ children }: { children: React.ReactNode }) {
  const [active, setActive] = useState(false);
  const [currentStepText, setCurrentStepText] = useState("");
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [voiceState, setVoiceState] = useState<VoiceState>("idle");

  const toggleVoice = useCallback(() => {
    setVoiceEnabled((prev) => {
      if (prev) setVoiceState("idle");
      return !prev;
    });
  }, []);
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
    setVoiceEnabled(false);
    setVoiceState("idle");
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
    <CookingModeContext.Provider value={{ active, activate, deactivate, currentStepText, setCurrentStepText, voiceEnabled, voiceState, setVoiceState, toggleVoice }}>
      {children}
    </CookingModeContext.Provider>
  );
}

export function useCookingMode() {
  return useContext(CookingModeContext);
}
