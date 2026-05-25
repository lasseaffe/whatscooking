"use client";

import { createContext, useContext, useState } from "react";

export type BgMode = "hero" | "functional" | "cook" | "plan";

const BG_OPACITY_MAP: Record<BgMode, string> = {
  hero:       "var(--wc-overlay-bg-hero)",
  functional: "var(--wc-overlay-bg-functional)",
  cook:       "var(--wc-overlay-bg-cook)",
  plan:       "var(--wc-overlay-bg-functional)",
};

type Ctx = { mode: BgMode; opacity: string; setMode: (m: BgMode) => void };

const BgModeContext = createContext<Ctx>({
  mode: "functional",
  opacity: "var(--wc-overlay-bg-functional)",
  setMode: () => {},
});

export function BgModeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<BgMode>("functional");
  return (
    <BgModeContext.Provider value={{ mode, opacity: BG_OPACITY_MAP[mode], setMode }}>
      {children}
    </BgModeContext.Provider>
  );
}

export function useBgMode() {
  return useContext(BgModeContext);
}
