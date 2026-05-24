"use client";

import React from "react";

export const DISMISSED_KEY = "wc_voice_prompt_dismissed";

export function shouldShowVoicePrompt(): boolean {
  if (typeof window === "undefined") return false;
  return !localStorage.getItem(DISMISSED_KEY);
}

interface VoicePromptSheetProps {
  onEnable: () => void;
  onDismiss: () => void;
}

export function VoicePromptSheet({ onEnable, onDismiss }: VoicePromptSheetProps) {
  function handleDontAsk() {
    localStorage.setItem(DISMISSED_KEY, "1");
    onDismiss();
  }

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 60,
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
        background: "rgba(0,0,0,0.45)",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 480,
          background: "var(--wc-surface, #1a0f08)",
          borderRadius: "20px 20px 0 0",
          padding: "28px 24px 36px",
          display: "flex",
          flexDirection: "column",
          gap: 8,
        }}
      >
        <p
          style={{
            fontFamily: "var(--font-fraunces, serif)",
            fontSize: 22,
            fontWeight: 700,
            color: "var(--wc-text-heading, #EFE3CE)",
            margin: 0,
          }}
        >
          Cook hands-free?
        </p>
        <p
          style={{
            fontFamily: "var(--font-plus-jakarta-sans, sans-serif)",
            fontSize: 14,
            color: "var(--wc-text-body, #b0a090)",
            margin: "4px 0 20px",
          }}
        >
          The Kitchen Oracle will read steps aloud and listen for your commands.
        </p>

        <button
          onClick={onEnable}
          style={{
            background: "#F4A261",
            color: "#1a0600",
            border: "none",
            borderRadius: 12,
            padding: "14px 0",
            fontFamily: "var(--font-plus-jakarta-sans, sans-serif)",
            fontSize: 16,
            fontWeight: 700,
            cursor: "pointer",
            width: "100%",
          }}
        >
          🎙 Yes, enable voice
        </button>

        <button
          onClick={onDismiss}
          style={{
            background: "rgba(176,125,86,0.10)",
            color: "#b0a090",
            border: "1px solid rgba(176,125,86,0.2)",
            borderRadius: 12,
            padding: "13px 0",
            fontFamily: "var(--font-plus-jakarta-sans, sans-serif)",
            fontSize: 15,
            fontWeight: 500,
            cursor: "pointer",
            width: "100%",
          }}
        >
          Not right now
        </button>

        <button
          onClick={handleDontAsk}
          style={{
            background: "transparent",
            border: "none",
            color: "rgba(176,125,86,0.55)",
            fontFamily: "var(--font-plus-jakarta-sans, sans-serif)",
            fontSize: 12,
            cursor: "pointer",
            padding: "8px 0 0",
            alignSelf: "center",
          }}
        >
          Don't ask me again
        </button>
      </div>
    </div>
  );
}
