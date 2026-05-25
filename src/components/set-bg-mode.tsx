"use client";

import { useEffect } from "react";
import { useBgMode, type BgMode } from "@/lib/bg-mode-context";

export function SetBgMode({ mode }: { mode: BgMode }) {
  const { setMode } = useBgMode();
  useEffect(() => {
    setMode(mode);
    return () => setMode("functional");
  }, [mode, setMode]);
  return null;
}
