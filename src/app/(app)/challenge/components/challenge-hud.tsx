"use client";

import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useChallengeRun } from "@/lib/challenge-run-context";
import { CompletionModal } from "./completion-modal";
import { timerView, TIMER_TONE_COLOR, DIFFICULTY_COLOR } from "../utils";

/**
 * Persistent LIVE bar for an active challenge. Mounted once in the app layout so
 * it follows the user everywhere — including on top of Cooking Mode (z-[150] sits
 * above the cooking overlay at z-[100] and the mobile nav at z-40).
 */
export function ChallengeHUD() {
  const { active, elapsed, clear } = useChallengeRun();
  const router = useRouter();
  const pathname = usePathname();
  const [expanded, setExpanded] = useState(false);
  const [completing, setCompleting] = useState(false);

  // The Run screen renders its own telemetry — don't double up there.
  if (!active || pathname === "/challenge/run") return null;

  const timer = timerView(elapsed, active.targetSeconds);
  const tone = TIMER_TONE_COLOR[timer.tone];
  const diff = DIFFICULTY_COLOR[active.difficulty] ?? DIFFICULTY_COLOR.medium;

  return (
    <>
      <motion.div
        initial={{ y: 80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 80, opacity: 0 }}
        transition={{ type: "spring", stiffness: 380, damping: 30 }}
        className="fixed left-1/2 z-[150] w-[calc(100%-24px)] max-w-[560px] -translate-x-1/2"
        style={{ bottom: "calc(env(safe-area-inset-bottom, 0px) + 72px)" }}
      >
        <div
          style={{
            background: "linear-gradient(135deg,#241712,#1F1B19)",
            border: `1px solid ${tone}55`,
            borderRadius: 16,
            boxShadow: `0 10px 40px rgba(0,0,0,0.55), 0 0 0 1px rgba(232,93,32,0.06), 0 0 24px ${tone}22`,
            overflow: "hidden",
          }}
        >
          {/* Collapsed row */}
          <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px" }}>
            <LiveDot tone={timer.tone} />
            <button
              onClick={() => router.push("/challenge/run")}
              style={{
                flex: 1, display: "flex", alignItems: "center", gap: 10,
                background: "none", border: "none", cursor: "pointer", textAlign: "left", minWidth: 0,
              }}
              aria-label="Open challenge run screen"
            >
              <span style={{ fontSize: 22, lineHeight: 1, flexShrink: 0 }}>{active.emoji}</span>
              <span style={{ minWidth: 0 }}>
                <span style={{
                  display: "block", color: "#EFE3CE", fontSize: 14, fontWeight: 700,
                  whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                }}>
                  {active.title}
                </span>
                <span style={{ color: "#A08060", fontSize: 10, letterSpacing: "1.5px", textTransform: "uppercase" }}>
                  Live challenge · tap to open
                </span>
              </span>
            </button>

            <span style={{
              fontFamily: "var(--font-geist-mono, monospace)",
              fontSize: 18, fontWeight: 700, color: tone, fontVariantNumeric: "tabular-nums",
              flexShrink: 0,
            }}>
              {timer.text}
            </span>

            <button
              onClick={() => setExpanded(e => !e)}
              aria-label={expanded ? "Hide rules" : "Show rules"}
              style={{
                flexShrink: 0, width: 30, height: 30, borderRadius: 8, cursor: "pointer",
                background: "rgba(255,255,255,0.04)", border: "1px solid #3A3430",
                color: "#A08060", fontSize: 13, transform: expanded ? "rotate(180deg)" : "none",
                transition: "transform 0.2s",
              }}
            >
              ▾
            </button>

            <button
              onClick={() => setCompleting(true)}
              style={{
                flexShrink: 0, background: "#E85D20", color: "#0d0d0c", border: "none",
                borderRadius: 10, padding: "8px 14px", fontWeight: 800, fontSize: 13, cursor: "pointer",
              }}
            >
              ✓ Done
            </button>
          </div>

          {/* Expanded rules drawer */}
          <AnimatePresence initial={false}>
            {expanded && (
              <motion.div
                key="rules"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
                style={{ overflow: "hidden" }}
              >
                <div style={{ padding: "4px 16px 16px", borderTop: "1px solid #2C2724" }}>
                  <div style={{ display: "flex", gap: 8, alignItems: "center", margin: "12px 0 10px" }}>
                    <span style={{ background: diff.bg, color: diff.text, fontSize: 9, padding: "2px 8px", borderRadius: 20, fontWeight: 700, letterSpacing: "0.5px" }}>
                      {diff.label}
                    </span>
                    {active.requiresProof && (
                      <span style={{ color: "#9c9c9b", fontSize: 10 }}>📸 proof required</span>
                    )}
                  </div>
                  {active.objective && (
                    <p style={{ color: "#EFE3CE", fontSize: 13, fontWeight: 600, margin: "0 0 10px" }}>
                      🎯 {active.objective}
                    </p>
                  )}
                  <ol style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 7 }}>
                    {(active.rules ?? []).map((rule, i) => (
                      <li key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                        <span style={{ color: "#E85D20", fontWeight: 800, fontSize: 12, fontFamily: "var(--font-geist-mono, monospace)", lineHeight: 1.5 }}>
                          {i + 1}
                        </span>
                        <span style={{ color: "#C9BCA8", fontSize: 13, lineHeight: 1.5 }}>{rule}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {completing && (
        <CompletionModal
          active={active}
          finalElapsed={elapsed}
          onClose={() => setCompleting(false)}
          onDone={() => { setCompleting(false); clear(); router.refresh(); }}
        />
      )}
    </>
  );
}

function LiveDot({ tone }: { tone: "live" | "warn" | "over" }) {
  const color = TIMER_TONE_COLOR[tone];
  return (
    <span style={{ position: "relative", display: "inline-flex", width: 10, height: 10, flexShrink: 0 }}>
      <motion.span
        animate={{ scale: [1, 2.4], opacity: [0.55, 0] }}
        transition={{ duration: 1.4, repeat: Infinity, ease: "easeOut" }}
        style={{ position: "absolute", inset: 0, borderRadius: "50%", background: color }}
      />
      <span style={{ position: "relative", width: 10, height: 10, borderRadius: "50%", background: color }} />
    </span>
  );
}
