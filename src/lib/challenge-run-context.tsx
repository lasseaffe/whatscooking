"use client";

import {
  createContext, useContext, useState, useRef, useEffect, useCallback,
} from "react";
import type { ActiveChallenge } from "@/app/(app)/challenge/types";
import {
  getActiveChallenge, setActiveChallenge, clearActiveChallenge,
} from "@/app/(app)/challenge/utils";

interface ChallengeRunContextValue {
  active: ActiveChallenge | null;
  /** Seconds elapsed since the run started. */
  elapsed: number;
  /** Begin a run: persists it, starts the timer, holds a screen wake-lock. */
  start: (challenge: ActiveChallenge) => void;
  /** End a run (completed or quit): clears persistence + releases wake-lock. */
  clear: () => void;
  /** Re-read persisted state (e.g. after a cross-tab change). */
  refresh: () => void;
}

const ChallengeRunContext = createContext<ChallengeRunContextValue>({
  active: null,
  elapsed: 0,
  start: () => {},
  clear: () => {},
  refresh: () => {},
});

export function ChallengeRunProvider({ children }: { children: React.ReactNode }) {
  const [active, setActive] = useState<ActiveChallenge | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);

  const releaseWakeLock = useCallback(() => {
    if (wakeLockRef.current) {
      wakeLockRef.current.release().catch(() => {});
      wakeLockRef.current = null;
    }
  }, []);

  const acquireWakeLock = useCallback(async () => {
    try {
      if (typeof navigator !== "undefined" && "wakeLock" in navigator) {
        wakeLockRef.current = await (navigator as Navigator & {
          wakeLock: { request: (type: string) => Promise<WakeLockSentinel> };
        }).wakeLock.request("screen");
      }
    } catch {
      // Wake lock unsupported or denied — the run continues without it.
    }
  }, []);

  const refresh = useCallback(() => {
    setActive(getActiveChallenge());
  }, []);

  const start = useCallback((challenge: ActiveChallenge) => {
    setActiveChallenge(challenge);
    setActive(challenge);
    acquireWakeLock();
  }, [acquireWakeLock]);

  const clear = useCallback(() => {
    clearActiveChallenge();
    setActive(null);
    releaseWakeLock();
  }, [releaseWakeLock]);

  // Hydrate from storage on mount; re-acquire wake-lock if a run was already live.
  useEffect(() => {
    const existing = getActiveChallenge();
    setActive(existing);
    if (existing) acquireWakeLock();
    return () => releaseWakeLock();
  }, [acquireWakeLock, releaseWakeLock]);

  // Tick the elapsed timer once per second while a run is live.
  useEffect(() => {
    if (!active) {
      setElapsed(0);
      return;
    }
    const startMs = new Date(active.startedAt).getTime();
    const tick = () => setElapsed(Math.max(0, Math.floor((Date.now() - startMs) / 1000)));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [active]);

  // Keep state honest across tabs / when returning to the app, and re-arm wake-lock.
  useEffect(() => {
    function onFocus() { refresh(); }
    function onVisible() {
      if (document.visibilityState === "visible" && getActiveChallenge()) acquireWakeLock();
    }
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [refresh, acquireWakeLock]);

  return (
    <ChallengeRunContext.Provider value={{ active, elapsed, start, clear, refresh }}>
      {children}
    </ChallengeRunContext.Provider>
  );
}

export function useChallengeRun() {
  return useContext(ChallengeRunContext);
}
