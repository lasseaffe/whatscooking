"use client";

import { useTheme } from "@/lib/theme-context";
import { Sun, Moon } from "lucide-react";

interface Props {
  /** compact = icon-only square button (for nav sidebar)
   *  default = icon + label pill */
  variant?: "compact" | "pill";
}

export function ThemeToggle({ variant = "compact" }: Props) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  if (variant === "pill") {
    return (
      <button
        onClick={toggleTheme}
        className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition-all hover:opacity-80"
        style={{
          background: isDark ? "#1C1209" : "#EDE2D4",
          color: isDark ? "#8A6A4A" : "#5D4037",
          border: `1px solid ${isDark ? "#3A2416" : "#C9B89E"}`,
        }}
        aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
        title={isDark ? "Light mode" : "Dark mode"}
      >
        {isDark ? (
          <Sun className="w-3.5 h-3.5 shrink-0" style={{ color: "#C8A030" }} />
        ) : (
          <Moon className="w-3.5 h-3.5 shrink-0" style={{ color: "#5D4037" }} />
        )}
        <span>{isDark ? "Light mode" : "Dark mode"}</span>
      </button>
    );
  }

  // compact — icon-only circle
  return (
    <button
      onClick={toggleTheme}
      className="w-8 h-8 rounded-full flex items-center justify-center transition-all hover:opacity-80"
      style={{
        background: isDark ? "#1C1209" : "#EDE2D4",
        border: `1px solid ${isDark ? "#3A2416" : "#C9B89E"}`,
      }}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      title={isDark ? "Light mode" : "Dark mode"}
    >
      {isDark ? (
        <Sun className="w-4 h-4" style={{ color: "#C8A030" }} />
      ) : (
        <Moon className="w-4 h-4" style={{ color: "#5D4037" }} />
      )}
    </button>
  );
}
