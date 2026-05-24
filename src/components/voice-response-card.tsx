"use client";

import React from "react";
import { OracleCard } from "@/hooks/useKitchenOracleVoice";

interface VoiceResponseCardProps {
  card: OracleCard;
}

export function VoiceResponseCard({ card }: VoiceResponseCardProps) {
  if (!card.type) return null;

  if (card.type === "listening") {
    return (
      <>
        <style>{`
          @keyframes waveBar {
            0%, 100% { transform: scaleY(0.3); }
            50% { transform: scaleY(1); }
          }
        `}</style>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "12px 16px",
            borderRadius: 12,
            border: "1px solid rgba(244,162,97,0.35)",
            background: "rgba(244,162,97,0.06)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 3, height: 24 }}>
            {[0, 1, 2, 3, 4].map((i) => (
              <div
                key={i}
                style={{
                  width: 3,
                  height: 20,
                  background: "#F4A261",
                  borderRadius: 2,
                  animation: `waveBar 0.8s ease-in-out infinite`,
                  animationDelay: `${i * 0.12}s`,
                  transformOrigin: "center",
                }}
              />
            ))}
          </div>
          <span
            style={{
              fontFamily: "var(--font-plus-jakarta-sans, sans-serif)",
              fontSize: 13,
              color: "#F4A261",
              fontWeight: 500,
            }}
          >
            Listening…
          </span>
        </div>
      </>
    );
  }

  const isRecovery = card.type === "recovery";
  const bg = isRecovery ? "rgba(232,93,32,0.08)" : "rgba(176,125,86,0.12)";
  const border = isRecovery ? "1px solid rgba(232,93,32,0.22)" : "1px solid rgba(244,162,97,0.18)";
  const iconColor = isRecovery ? "#E85D20" : "#d4aa80";
  const textColor = isRecovery ? "#f0c4a0" : "#d4aa80";
  const icon = isRecovery ? "⚑" : "✦";

  return (
    <div
      style={{
        display: "flex",
        gap: 10,
        padding: "12px 16px",
        borderRadius: 12,
        border,
        background: bg,
      }}
    >
      <span style={{ color: iconColor, fontSize: 14, flexShrink: 0, paddingTop: 1 }}>{icon}</span>
      <span
        style={{
          fontFamily: "var(--font-plus-jakarta-sans, sans-serif)",
          fontSize: 13,
          fontWeight: 500,
          color: textColor,
          lineHeight: 1.5,
        }}
      >
        {card.text}
      </span>
    </div>
  );
}
