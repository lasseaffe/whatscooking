"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useChallengeRun } from "@/lib/challenge-run-context";
import { CompletionModal } from "../components/completion-modal";
import {
  timerView, TIMER_TONE_COLOR, DIFFICULTY_COLOR,
  CATEGORY_GRADIENT, CATEGORY_LABEL,
} from "../utils";

export function RunScreen() {
  const { active, elapsed, clear } = useChallengeRun();
  const router = useRouter();
  const [completing, setCompleting] = useState(false);
  const [confirmQuit, setConfirmQuit] = useState(false);
  const [tipOpen, setTipOpen] = useState(false);

  // Empty state — no dead end (Apple 4.2): always offer a way back into the game.
  if (!active) {
    return (
      <div style={{
        position: "fixed", inset: 0, zIndex: 100, background: "#0d0d0c",
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        textAlign: "center", padding: 28,
      }}>
        <div style={{ fontSize: 52, marginBottom: 14 }}>🎲</div>
        <h1 style={{ fontFamily: "var(--font-fraunces, Georgia, serif)", color: "#EFE3CE", fontSize: 26, margin: "0 0 8px" }}>
          No challenge running
        </h1>
        <p style={{ color: "#A08060", fontSize: 14, maxWidth: 320, margin: "0 0 24px" }}>
          Spin the wheel or pick a challenge to start a live run — rules, timer and all.
        </p>
        <button
          onClick={() => router.push("/challenge")}
          style={{
            background: "#E85D20", color: "#0d0d0c", border: "none", borderRadius: 12,
            padding: "13px 28px", fontWeight: 800, fontSize: 15, cursor: "pointer",
          }}
        >
          Browse Challenges
        </button>
      </div>
    );
  }

  const timer = timerView(elapsed, active.targetSeconds);
  const tone = TIMER_TONE_COLOR[timer.tone];
  const diff = DIFFICULTY_COLOR[active.difficulty];
  const grad = CATEGORY_GRADIENT[active.category];

  // Countdown progress (speedrun only): fraction of par remaining.
  const progress = active.targetSeconds != null
    ? Math.max(0, Math.min(1, (active.targetSeconds - elapsed) / active.targetSeconds))
    : null;

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 100, background: "#0d0d0c", display: "flex", flexDirection: "column" }}>
      {/* Category-tinted ambient wash */}
      <div style={{ position: "absolute", inset: 0, background: grad, opacity: 0.5, pointerEvents: "none" }} />
      <div style={{
        position: "absolute", inset: 0, pointerEvents: "none",
        background: `radial-gradient(ellipse at 50% -10%, ${tone}1f 0%, transparent 60%)`,
      }} />

      {/* Telemetry bar */}
      <div style={{
        position: "relative", display: "flex", alignItems: "center", justifyContent: "space-between",
        gap: 12, padding: "16px 20px", borderBottom: "1px solid rgba(255,255,255,0.06)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <LiveDot tone={timer.tone} />
          <span style={{ color: tone, fontSize: 11, fontWeight: 800, letterSpacing: "2px", textTransform: "uppercase" }}>
            {timer.tone === "over" ? "Over Par" : "Live"}
          </span>
          <span style={{ color: "#6b5c4c", fontSize: 11, letterSpacing: "1px", textTransform: "uppercase" }}>
            · {CATEGORY_LABEL[active.category]}
          </span>
        </div>
        <button
          onClick={() => setConfirmQuit(true)}
          style={{
            background: "rgba(255,255,255,0.05)", border: "1px solid #3A3430", color: "#C9BCA8",
            borderRadius: 9, padding: "7px 14px", fontSize: 12, fontWeight: 600, cursor: "pointer",
          }}
        >
          ✕ Quit
        </button>
      </div>

      {/* Big timer */}
      <div style={{ position: "relative", textAlign: "center", padding: "26px 20px 8px" }}>
        <motion.div
          key={timer.tone}
          initial={{ scale: 0.96 }}
          animate={{ scale: 1 }}
          style={{
            fontFamily: "var(--font-geist-mono, monospace)", fontSize: "clamp(3.2rem, 14vw, 5.5rem)",
            fontWeight: 700, color: tone, lineHeight: 1, fontVariantNumeric: "tabular-nums",
            textShadow: `0 0 40px ${tone}33`,
          }}
        >
          {timer.text}
        </motion.div>
        {active.targetSeconds != null && (
          <div style={{ maxWidth: 320, margin: "12px auto 0" }}>
            <div style={{ height: 6, borderRadius: 99, background: "rgba(255,255,255,0.08)", overflow: "hidden" }}>
              <motion.div
                animate={{ width: `${(progress ?? 0) * 100}%` }}
                transition={{ ease: "linear", duration: 0.9 }}
                style={{ height: "100%", background: tone, borderRadius: 99 }}
              />
            </div>
            <div style={{ color: "#6b5c4c", fontSize: 11, marginTop: 6, fontFamily: "var(--font-geist-mono, monospace)" }}>
              {timer.tone === "over" ? "TIME'S UP — finish strong" : `par ${Math.floor(active.targetSeconds / 60)}:00`}
            </div>
          </div>
        )}
      </div>

      {/* Scrollable content */}
      <div style={{ position: "relative", flex: 1, overflowY: "auto", padding: "8px 22px 28px" }}>
        <div style={{ maxWidth: 540, margin: "0 auto" }}>
          {/* Headline */}
          <div style={{ textAlign: "center", marginBottom: 20 }}>
            <div style={{ fontSize: 54, marginBottom: 6 }}>{active.emoji}</div>
            <h1 style={{
              fontFamily: "var(--font-fraunces, Georgia, serif)", color: "#EFE3CE",
              fontSize: "clamp(2rem, 5vw, 3.2rem)", lineHeight: 1.05, margin: "0 0 12px", letterSpacing: "-0.02em",
            }}>
              {active.title}
            </h1>
            <div style={{ display: "flex", gap: 8, justifyContent: "center", alignItems: "center", flexWrap: "wrap" }}>
              <span style={{ background: diff.bg, color: diff.text, fontSize: 10, padding: "3px 12px", borderRadius: 20, fontWeight: 700, letterSpacing: "0.5px" }}>
                {diff.label}
              </span>
              <span style={{ color: "#9c9c9b", fontSize: 12 }}>
                {active.requiresProof ? "📸 Proof required" : "✓ No proof needed"}
              </span>
            </div>
          </div>

          {/* Objective */}
          {active.objective && (
            <div style={{
              background: "rgba(232,93,32,0.08)", border: "1px solid rgba(232,93,32,0.25)",
              borderRadius: 12, padding: "14px 18px", marginBottom: 18, textAlign: "center",
            }}>
              <div style={{ color: "#E85D20", fontSize: 10, fontWeight: 800, letterSpacing: "2px", textTransform: "uppercase", marginBottom: 5 }}>
                🎯 The Objective
              </div>
              <p style={{ color: "#EFE3CE", fontSize: 16, fontWeight: 600, margin: 0, lineHeight: 1.4 }}>
                {active.objective}
              </p>
            </div>
          )}

          {/* Rules — kitchen-manuscript card */}
          <div style={{
            background: "linear-gradient(180deg,#1F1B19,#191512)",
            border: "1px solid #3A3430", borderRadius: 14, padding: "20px 22px", marginBottom: 16,
          }}>
            <div style={{ color: "#A08060", fontSize: 11, fontWeight: 800, letterSpacing: "2.5px", textTransform: "uppercase", marginBottom: 16 }}>
              The Rules
            </div>
            <ol style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 14 }}>
              {active.rules.map((rule, i) => (
                <li key={i} style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
                  <span style={{
                    flexShrink: 0, fontFamily: "var(--font-geist-mono, monospace)", color: "#E85D20",
                    fontWeight: 800, fontSize: 15, lineHeight: 1.5, minWidth: 18,
                  }}>
                    {i + 1}
                  </span>
                  <span style={{ fontFamily: "var(--font-libre-baskerville, Georgia, serif)", color: "#D9C9B2", fontSize: 15, lineHeight: 1.6 }}>
                    {rule}
                  </span>
                </li>
              ))}
            </ol>
          </div>

          {/* Strategy tip (collapsible) */}
          {active.strategyTip && (
            <div style={{ marginBottom: 4 }}>
              <button
                onClick={() => setTipOpen(o => !o)}
                style={{
                  width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
                  background: "rgba(255,255,255,0.03)", border: "1px solid #2C2724", borderRadius: 12,
                  padding: "12px 16px", cursor: "pointer", color: "#C9BCA8", fontSize: 13, fontWeight: 600,
                }}
              >
                <span>💡 Strategy tip</span>
                <span style={{ transform: tipOpen ? "rotate(180deg)" : "none", transition: "transform 0.2s", color: "#A08060" }}>▾</span>
              </button>
              <AnimatePresence initial={false}>
                {tipOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
                    style={{ overflow: "hidden" }}
                  >
                    <p style={{ color: "#A08060", fontSize: 14, lineHeight: 1.6, padding: "12px 16px 0", margin: 0, fontStyle: "italic" }}>
                      {active.strategyTip}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>

      {/* Action bar */}
      <div style={{
        position: "relative", display: "flex", gap: 12, padding: "14px 20px",
        paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 14px)",
        borderTop: "1px solid rgba(255,255,255,0.06)", background: "rgba(13,13,12,0.6)", backdropFilter: "blur(8px)",
      }}>
        <button
          onClick={() => router.push("/discover")}
          style={{
            flex: 1, background: "transparent", border: "1px solid #3A3430", color: "#EFE3CE",
            borderRadius: 12, padding: "14px", fontSize: 14, fontWeight: 600, cursor: "pointer",
          }}
        >
          🍳 Open a recipe to cook
        </button>
        <button
          onClick={() => setCompleting(true)}
          style={{
            flex: 1, background: "#E85D20", color: "#0d0d0c", border: "none",
            borderRadius: 12, padding: "14px", fontSize: 15, fontWeight: 800, cursor: "pointer",
          }}
        >
          ✓ Mark Done
        </button>
      </div>

      {/* Quit confirm */}
      <AnimatePresence>
        {confirmQuit && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{
              position: "fixed", inset: 0, zIndex: 120, background: "rgba(9,9,8,0.8)", backdropFilter: "blur(6px)",
              display: "flex", alignItems: "center", justifyContent: "center", padding: 24,
            }}
          >
            <div style={{ background: "#171716", border: "1px solid #272726", borderRadius: 18, padding: 24, maxWidth: 340, textAlign: "center" }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>🏳️</div>
              <h2 style={{ color: "#EFE3CE", fontSize: 17, margin: "0 0 6px" }}>Abandon this challenge?</h2>
              <p style={{ color: "#A08060", fontSize: 13, margin: "0 0 18px" }}>Your timer stops and the run won&apos;t be recorded.</p>
              <div style={{ display: "flex", gap: 10 }}>
                <button
                  onClick={() => setConfirmQuit(false)}
                  style={{ flex: 1, background: "transparent", border: "1px solid #272726", color: "#e7e7e6", borderRadius: 10, padding: "11px", fontSize: 13, cursor: "pointer" }}
                >
                  Keep going
                </button>
                <button
                  onClick={() => { clear(); router.push("/challenge"); }}
                  style={{ flex: 1, background: "#2A2220", border: "none", color: "#e07a7a", borderRadius: 10, padding: "11px", fontSize: 13, fontWeight: 700, cursor: "pointer" }}
                >
                  Abandon
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {completing && (
        <CompletionModal
          active={active}
          finalElapsed={elapsed}
          onClose={() => setCompleting(false)}
          onDone={() => { setCompleting(false); clear(); router.push("/challenge"); }}
        />
      )}
    </div>
  );
}

function LiveDot({ tone }: { tone: "live" | "warn" | "over" }) {
  const color = TIMER_TONE_COLOR[tone];
  return (
    <span style={{ position: "relative", display: "inline-flex", width: 10, height: 10 }}>
      <motion.span
        animate={{ scale: [1, 2.4], opacity: [0.55, 0] }}
        transition={{ duration: 1.4, repeat: Infinity, ease: "easeOut" }}
        style={{ position: "absolute", inset: 0, borderRadius: "50%", background: color }}
      />
      <span style={{ position: "relative", width: 10, height: 10, borderRadius: "50%", background: color }} />
    </span>
  );
}
