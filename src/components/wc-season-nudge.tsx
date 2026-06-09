"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { X, Trophy } from "lucide-react";

const DISMISS_KEY = "wc-season-nudge-dismissed-v1";

export function WcSeasonNudge() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    try {
      if (!localStorage.getItem(DISMISS_KEY)) setShow(true);
    } catch {
      setShow(true);
    }
  }, []);

  if (!show) return null;

  function dismiss(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    try {
      localStorage.setItem(DISMISS_KEY, "1");
    } catch {
      /* ignore */
    }
    setShow(false);
  }

  return (
    <Link
      href="/world-cup-2026"
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "12px 14px",
        borderRadius: 16,
        textDecoration: "none",
        background: "linear-gradient(135deg, #0A1A08, #16240E)",
        border: "1px solid rgba(244,162,97,0.35)",
        position: "relative",
      }}
    >
      <div
        style={{
          width: 38,
          height: 38,
          borderRadius: 11,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          background: "linear-gradient(135deg, #206820, #0A4010)",
        }}
      >
        <Trophy size={18} style={{ color: "#fff" }} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: "0.84rem", fontWeight: 800, color: "#EFE3CE", lineHeight: 1.2 }}>
          The World Cup is kicking off ⚽
        </p>
        <p style={{ fontSize: "0.72rem", color: "rgba(239,227,206,0.6)", marginTop: 2 }}>
          Pick your teams and cook every matchday — snacks + signature dishes.
        </p>
      </div>
      <span style={{ fontSize: "0.7rem", fontWeight: 800, color: "#F4A261", flexShrink: 0 }}>OPEN →</span>
      <button
        onClick={dismiss}
        aria-label="Dismiss"
        style={{
          position: "absolute",
          top: 6,
          right: 6,
          width: 22,
          height: 22,
          borderRadius: 7,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "rgba(0,0,0,0.25)",
          border: "none",
          color: "rgba(239,227,206,0.5)",
          cursor: "pointer",
        }}
      >
        <X size={13} />
      </button>
    </Link>
  );
}
