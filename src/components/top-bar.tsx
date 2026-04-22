"use client";

import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import {
  Leaf, Shuffle, Zap, Star, Bell, Sparkles, ShoppingBasket,
  X, Plus, ShieldAlert, Check, RefreshCw, Filter,
} from "lucide-react";
import { useDietaryMode } from "@/lib/dietary-mode-context";
import { DIETARY_LABELS, DIETARY_COLORS, type DietaryRestriction } from "@/lib/dietary-substitutions";
import { FlipButton } from "@/components/ui/flip-button";

const UNREAD_NOTIFICATIONS = 2;

const ALL_RESTRICTIONS: DietaryRestriction[] = [
  "vegan", "vegetarian", "gluten-free", "dairy-free",
  "nut-free", "egg-free", "halal", "kosher",
];

// Non-dietary feature buttons (no href on Dietary Filters — it opens a panel)
const NAV_FEATURES = [
  {
    id: "meal-swipe",
    icon: Shuffle,
    title: "Meal Swipe",
    description: "Swipe through recipes, Tinder-style",
    cta: "Start swiping →",
    href: "/swipe",
    premium: false,
  },
  {
    id: "scramble",
    icon: Zap,
    title: "Scramble Together",
    description: "Find recipes from what's already in your pantry",
    cta: "Check pantry →",
    href: "/pantry",
    premium: false,
  },
  {
    id: "premium",
    icon: Star,
    title: "Premium Collection",
    description: "Instagram-sourced recipes with AI-extracted instructions",
    cta: "Unlock recipes →",
    href: "/premium",
    premium: true,
  },
] as const;

export function TopBar() {
  const { restrictions, customAvoid, filterMode, setFilterMode, toggleRestriction, clearRestrictions, addCustomAvoid, removeCustomAvoid, active } = useDietaryMode();

  const [notifOpen, setNotifOpen] = useState(false);
  const [hasRead, setHasRead] = useState(false);
  const [dietaryOpen, setDietaryOpen] = useState(false);
  const [customInput, setCustomInput] = useState("");
  const customInputRef = useRef<HTMLInputElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const dietaryRef = useRef<HTMLDivElement>(null);

  // Close panels on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
      if (dietaryRef.current && !dietaryRef.current.contains(e.target as Node)) {
        setDietaryOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const unread = hasRead ? 0 : UNREAD_NOTIFICATIONS;

  function handleAddCustom(e: React.FormEvent) {
    e.preventDefault();
    const v = customInput.trim().toLowerCase();
    if (v) { addCustomAvoid(v); setCustomInput(""); }
    customInputRef.current?.focus();
  }

  function handleAdaptRecipes() {
    // Panel stays open so user can see active restrictions; just close
    setDietaryOpen(false);
  }

  const restrictionCount = restrictions.length + customAvoid.length;

  return (
    <>
      <style>{`
        /* ── Top bar shell ── */
        .wc-topbar {
          position: sticky;
          top: 0;
          z-index: 50;
          background: var(--wc-bg-base);
          border-bottom: 1px solid var(--wc-border-subtle);
          backdrop-filter: blur(14px);
          -webkit-backdrop-filter: blur(14px);
          flex-shrink: 0;
        }

        .wc-topbar-inner {
          display: flex;
          align-items: center;
          gap: 0;
          padding: 0 24px;
          min-height: 88px;
        }

        /* ── Feature row ── */
        .wc-feature-row {
          display: flex;
          flex: 1;
          gap: 12px;
          align-items: stretch;
        }

        /* ── Individual feature button ── */
        .wc-feat-btn {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          gap: 4px;
          padding: 14px 18px;
          border-radius: 16px;
          text-decoration: none;
          cursor: pointer;
          border: 1px solid transparent;
          background: transparent;
          transition:
            background 0.2s cubic-bezier(0.22,1,0.36,1),
            border-color 0.2s cubic-bezier(0.22,1,0.36,1),
            transform 0.2s cubic-bezier(0.22,1,0.36,1),
            box-shadow 0.2s cubic-bezier(0.22,1,0.36,1);
          position: relative;
          overflow: hidden;
          min-height: 44px;
        }
        .wc-feat-btn:hover {
          background: var(--wc-bg-card);
          border-color: var(--wc-border-default);
          transform: translateY(-2px);
          box-shadow: 0 8px 28px color-mix(in srgb, var(--wc-bg-base) 50%, transparent 50%);
        }
        /* Active (panel open) state for dietary button */
        .wc-feat-btn.wc-feat-active {
          background: var(--wc-bg-card);
          border-color: var(--wc-border-default);
        }

        .wc-feat-icon-wrap {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 30px;
          height: 30px;
          border-radius: 8px;
          background: var(--wc-bg-elevated);
          margin-bottom: 2px;
          color: var(--wc-terracotta);
          transition: background 0.2s cubic-bezier(0.22,1,0.36,1);
          flex-shrink: 0;
        }
        .wc-feat-btn:hover .wc-feat-icon-wrap,
        .wc-feat-btn.wc-feat-active .wc-feat-icon-wrap {
          background: var(--wc-bg-active);
        }

        .wc-feat-title {
          font-family: 'Libre Baskerville', Georgia, serif;
          font-size: 0.82rem;
          font-weight: 700;
          color: var(--wc-text);
          line-height: 1.2;
          white-space: nowrap;
        }

        .wc-feat-desc {
          font-size: 0.7rem;
          font-weight: 400;
          color: var(--wc-text-3);
          line-height: 1.3;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 100%;
        }

        .wc-feat-cta {
          font-size: 0.68rem;
          font-weight: 600;
          color: var(--wc-terracotta);
          margin-top: 2px;
          letter-spacing: 0.01em;
          opacity: 0;
          transform: translateY(4px);
          transition:
            opacity 0.18s cubic-bezier(0.22,1,0.36,1),
            transform 0.18s cubic-bezier(0.22,1,0.36,1);
        }
        .wc-feat-btn:hover .wc-feat-cta,
        .wc-feat-btn.wc-feat-active .wc-feat-cta {
          opacity: 1;
          transform: translateY(0);
        }

        /* ── Premium feature button ── */
        .wc-feat-btn-premium {
          border-color: color-mix(in srgb, var(--wc-gold) 22%, transparent 78%);
          background: color-mix(in srgb, var(--wc-gold-dim) 80%, transparent 20%);
        }
        .wc-feat-btn-premium .wc-feat-icon-wrap {
          color: var(--wc-gold);
          background: color-mix(in srgb, var(--wc-gold) 14%, var(--wc-bg-elevated) 86%);
        }
        .wc-feat-btn-premium .wc-feat-cta { color: var(--wc-gold); opacity: 0; }
        .wc-feat-btn-premium:hover {
          border-color: color-mix(in srgb, var(--wc-gold) 42%, transparent 58%);
          background: color-mix(in srgb, var(--wc-gold) 10%, var(--wc-bg-card) 90%);
          box-shadow: 0 8px 28px color-mix(in srgb, var(--wc-gold) 12%, transparent 88%);
        }
        .wc-feat-btn-premium:hover .wc-feat-cta { color: var(--wc-gold); opacity: 1; }
        .wc-feat-btn-premium::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(
            90deg,
            transparent 0%,
            color-mix(in srgb, var(--wc-gold) 18%, transparent 82%) 50%,
            transparent 100%
          );
          transform: translateX(-100%);
          animation: wc-premium-sweep 3.5s ease-in-out infinite;
          pointer-events: none;
        }
        @keyframes wc-premium-sweep {
          0%   { transform: translateX(-100%); }
          55%  { transform: translateX(100%); }
          100% { transform: translateX(100%); }
        }

        /* ── Dietary panel ── */
        .wc-dietary-panel {
          position: absolute;
          top: calc(100% + 6px);
          left: 0;
          min-width: 340px;
          max-width: 420px;
          border-radius: 16px;
          border: 1px solid var(--wc-border-default);
          background: color-mix(in srgb, var(--wc-bg-base) 97%, transparent 3%);
          backdrop-filter: blur(28px);
          -webkit-backdrop-filter: blur(28px);
          box-shadow: 0 24px 72px rgba(0,0,0,0.55), 0 4px 16px rgba(0,0,0,0.3);
          overflow: hidden;
          animation: wc-panel-in 0.22s cubic-bezier(0.22,1,0.36,1) both;
          transform-origin: top left;
          z-index: 100;
        }
        @keyframes wc-panel-in {
          from { opacity: 0; transform: scale(0.94) translateY(-8px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }

        /* ── Notification button ── */
        .wc-notif-btn {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 34px;
          height: 34px;
          border-radius: 9px;
          border: none;
          background: transparent;
          cursor: pointer;
          color: var(--wc-text-3);
          transition: background 0.15s ease, color 0.15s ease;
          flex-shrink: 0;
          margin-left: 16px;
        }
        .wc-notif-btn:hover { background: var(--wc-bg-hover); color: var(--wc-text); }
        .wc-notif-btn.open { background: var(--wc-bg-active); color: var(--wc-terracotta); }
        .wc-notif-dot {
          position: absolute;
          top: 5px; right: 5px;
          width: 8px; height: 8px;
          border-radius: 50%;
          background: #ef4444;
          border: 1.5px solid var(--wc-bg-base);
          animation: wc-dot-pulse 2s ease-in-out infinite;
        }
        @keyframes wc-dot-pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50%       { transform: scale(1.3); opacity: 0.8; }
        }

        /* ── Notification dropdown ── */
        .wc-notif-panel {
          position: absolute;
          top: calc(100% + 8px);
          right: 0;
          width: 300px;
          border-radius: 14px;
          border: 1px solid var(--wc-border-default);
          background: color-mix(in srgb, var(--wc-bg-base) 96%, transparent 4%);
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
          box-shadow: 0 24px 72px color-mix(in srgb, var(--wc-bg-base) 65%, transparent 35%);
          overflow: hidden;
          animation: wc-notif-in 0.2s cubic-bezier(0.22,1,0.36,1) both;
          transform-origin: top right;
        }
        @keyframes wc-notif-in {
          from { opacity: 0; transform: scale(0.93) translateY(-6px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }

        /* ── Responsive ── */
        @media (max-width: 700px) {
          .wc-topbar-inner {
            padding: 12px 16px;
            min-height: auto;
            flex-wrap: wrap;
            gap: 8px;
            align-items: center;
          }
          .wc-feature-row {
            flex-wrap: wrap;
            order: 2;
            width: 100%;
            gap: 8px;
          }
          .wc-feat-btn {
            flex: 1 1 calc(50% - 4px);
            min-width: 0;
            padding: 10px 12px;
          }
          .wc-feat-desc { display: none; }
          .wc-notif-btn {
            order: 1;
            margin-left: auto;
          }
        }
      `}</style>

      <div className="wc-topbar">
        <div className="wc-topbar-inner">
          {/* ── Feature showcase row ── */}
          <div className="wc-feature-row">

            {/* ── Dietary Filters — opens panel (not a link) ── */}
            <div className="relative" ref={dietaryRef} style={{ flex: 1 }}>
              <button
                className={`wc-feat-btn${dietaryOpen ? " wc-feat-active" : ""}${active ? "" : ""}`}
                style={{ width: "100%", fontFamily: "inherit" }}
                onClick={() => setDietaryOpen((v) => !v)}
              >
                <div className="wc-feat-icon-wrap" style={active ? { color: "var(--wc-sage)" } : {}}>
                  <Leaf style={{ width: 15, height: 15 }} />
                </div>
                <span className="wc-feat-title" style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  Dietary Filters
                  {restrictionCount > 0 && (
                    <span
                      style={{
                        fontSize: "0.6rem",
                        fontWeight: 700,
                        padding: "1px 6px",
                        borderRadius: 99,
                        background: "var(--wc-sage)",
                        color: "var(--wc-bg-base)",
                        fontFamily: "Inter, sans-serif",
                        letterSpacing: "0.04em",
                      }}
                    >
                      {restrictionCount}
                    </span>
                  )}
                </span>
                <span className="wc-feat-desc">
                  {active
                    ? `${restrictionCount} restriction${restrictionCount !== 1 ? "s" : ""} active`
                    : "Set your restrictions once, filtered everywhere"}
                </span>
                <span className="wc-feat-cta">{dietaryOpen ? "Close panel ↑" : "Configure →"}</span>
              </button>

              {/* ── Dietary Filters panel ── */}
              {dietaryOpen && (
                <div className="wc-dietary-panel">
                  {/* Header */}
                  <div
                    className="flex items-center justify-between px-4 py-3"
                    style={{ borderBottom: "1px solid var(--wc-border-subtle)" }}
                  >
                    <div className="flex items-center gap-2">
                      <Leaf style={{ width: 14, height: 14, color: "var(--wc-sage)" }} />
                      <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--wc-text)", fontFamily: "'Libre Baskerville', Georgia, serif" }}>
                        Dietary Filters
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {active && (
                        <button
                          onClick={clearRestrictions}
                          style={{
                            fontSize: "0.7rem",
                            fontWeight: 600,
                            padding: "2px 10px",
                            borderRadius: 99,
                            background: "rgba(176,125,86,0.12)",
                            color: "var(--wc-terracotta)",
                            border: "1px solid rgba(176,125,86,0.25)",
                            cursor: "pointer",
                          }}
                        >
                          Clear all
                        </button>
                      )}
                      <button
                        onClick={() => setDietaryOpen(false)}
                        style={{
                          display: "flex", alignItems: "center", justifyContent: "center",
                          width: 24, height: 24, borderRadius: 6,
                          background: "var(--wc-bg-elevated)",
                          border: "none", cursor: "pointer",
                          color: "var(--wc-text-3)",
                        }}
                      >
                        <X style={{ width: 12, height: 12 }} />
                      </button>
                    </div>
                  </div>

                  <div className="px-4 py-3" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {/* Active restrictions list */}
                    {(restrictions.length > 0 || customAvoid.length > 0) && (
                      <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                        <span style={{ fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--wc-text-4)" }}>
                          Active
                        </span>
                        {restrictions.map((r) => {
                          const cfg = DIETARY_COLORS[r];
                          return (
                            <div
                              key={r}
                              style={{
                                display: "flex", alignItems: "center", gap: 8,
                                padding: "7px 12px", borderRadius: 10,
                                background: "var(--wc-bg-card)",
                                border: `1px solid ${cfg.color}28`,
                              }}
                            >
                              <Leaf style={{ width: 11, height: 11, color: cfg.color, flexShrink: 0 }} />
                              <span style={{ fontSize: "0.78rem", fontWeight: 600, flex: 1, color: cfg.color }}>
                                {DIETARY_LABELS[r]}
                              </span>
                              <button
                                onClick={() => toggleRestriction(r)}
                                style={{
                                  display: "flex", alignItems: "center", justifyContent: "center",
                                  width: 18, height: 18, borderRadius: 99,
                                  background: `${cfg.color}20`, color: cfg.color,
                                  border: "none", cursor: "pointer",
                                }}
                              >
                                <X style={{ width: 9, height: 9 }} />
                              </button>
                            </div>
                          );
                        })}
                        {customAvoid.map((term) => (
                          <div
                            key={term}
                            style={{
                              display: "flex", alignItems: "center", gap: 8,
                              padding: "7px 12px", borderRadius: 10,
                              background: "var(--wc-bg-card)",
                              border: "1px solid rgba(176,125,86,0.2)",
                            }}
                          >
                            <ShieldAlert style={{ width: 11, height: 11, color: "var(--wc-terracotta)", flexShrink: 0 }} />
                            <span style={{ fontSize: "0.78rem", fontWeight: 600, flex: 1, color: "var(--wc-terracotta)", textTransform: "capitalize" }}>
                              No {term}
                            </span>
                            <button
                              onClick={() => removeCustomAvoid(term)}
                              style={{
                                display: "flex", alignItems: "center", justifyContent: "center",
                                width: 18, height: 18, borderRadius: 99,
                                background: "rgba(176,125,86,0.18)", color: "var(--wc-terracotta)",
                                border: "none", cursor: "pointer",
                              }}
                            >
                              <X style={{ width: 9, height: 9 }} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Preset restriction toggles */}
                    <div>
                      <span style={{ fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--wc-text-4)", display: "block", marginBottom: 6 }}>
                        Quick-add
                      </span>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                        {ALL_RESTRICTIONS.map((r) => {
                          const cfg = DIETARY_COLORS[r];
                          const isActive = restrictions.includes(r);
                          return (
                            <button
                              key={r}
                              onClick={() => toggleRestriction(r)}
                              style={{
                                display: "flex", alignItems: "center", gap: 5,
                                padding: "5px 11px", borderRadius: 99,
                                fontSize: "0.72rem", fontWeight: 600,
                                background: isActive ? `${cfg.color}22` : "var(--wc-bg-elevated)",
                                color: isActive ? cfg.color : "var(--wc-text-3)",
                                border: `1px solid ${isActive ? cfg.color + "40" : "var(--wc-border-default)"}`,
                                cursor: "pointer",
                                transition: "all 0.15s ease",
                              }}
                            >
                              {isActive && <Check style={{ width: 9, height: 9 }} />}
                              {DIETARY_LABELS[r]}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Custom avoid input */}
                    <div>
                      <span style={{ fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--wc-text-4)", display: "block", marginBottom: 6 }}>
                        Avoid specific ingredient
                      </span>
                      <form onSubmit={handleAddCustom} style={{ display: "flex", gap: 8 }}>
                        <input
                          ref={customInputRef}
                          value={customInput}
                          onChange={(e) => setCustomInput(e.target.value)}
                          placeholder="e.g. mushrooms, shellfish…"
                          style={{
                            flex: 1,
                            fontSize: "0.78rem",
                            padding: "8px 12px",
                            borderRadius: 10,
                            background: "var(--wc-bg-card)",
                            border: "1px solid var(--wc-border-default)",
                            color: "var(--wc-text)",
                            outline: "none",
                          }}
                        />
                        <button
                          type="submit"
                          disabled={!customInput.trim()}
                          style={{
                            display: "flex", alignItems: "center", justifyContent: "center",
                            width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                            background: "var(--wc-bg-active)",
                            border: "1px solid var(--wc-border-default)",
                            color: "var(--wc-terracotta)",
                            cursor: "pointer",
                            opacity: customInput.trim() ? 1 : 0.35,
                          }}
                        >
                          <Plus style={{ width: 14, height: 14 }} />
                        </button>
                      </form>
                    </div>
                  </div>

                  {/* ── Mode switch + explainer ── */}
                  <div
                    style={{
                      padding: "12px 16px",
                      borderTop: "1px solid var(--wc-border-subtle)",
                      background: "var(--wc-bg-elevated)",
                      display: "flex",
                      flexDirection: "column",
                      gap: 10,
                    }}
                  >
                    {/* Flip toggle row */}
                    <div style={{ display: "flex", gap: 8 }}>
                      <FlipButton
                        frontText="Adapt Meals"
                        backText="Select"
                        from="bottom"
                        onClick={() => setFilterMode("adapt")}
                        style={{ flex: 1 }}
                        frontClassName={
                          filterMode === "adapt"
                            ? "text-xs font-semibold !bg-[#C08F68] !text-white border-0"
                            : "text-xs font-semibold !bg-[var(--wc-bg-active)] !text-[var(--wc-text-3)] !border !border-[var(--wc-border-default)]"
                        }
                        backClassName="text-xs font-semibold !bg-[#C08F68] !text-white"
                      />
                      <FlipButton
                        frontText="Filter Meals"
                        backText="Select"
                        from="bottom"
                        onClick={() => setFilterMode("filter")}
                        style={{ flex: 1 }}
                        frontClassName={
                          filterMode === "filter"
                            ? "text-xs font-semibold !bg-[#C08F68] !text-white border-0"
                            : "text-xs font-semibold !bg-[var(--wc-bg-active)] !text-[var(--wc-text-3)] !border !border-[var(--wc-border-default)]"
                        }
                        backClassName="text-xs font-semibold !bg-[#C08F68] !text-white"
                      />
                    </div>

                    {/* Explainer cards */}
                    <div
                      style={{
                        padding: "10px 12px",
                        borderRadius: 10,
                        background: filterMode === "adapt"
                          ? "color-mix(in srgb, #C08F68 10%, var(--wc-bg-card))"
                          : "color-mix(in srgb, #C08F68 10%, var(--wc-bg-card))",
                        border: "1px solid color-mix(in srgb, #C08F68 25%, transparent)",
                        display: "flex",
                        gap: 10,
                        alignItems: "flex-start",
                      }}
                    >
                      {filterMode === "adapt" ? (
                        <RefreshCw style={{ width: 14, height: 14, color: "#C08F68", flexShrink: 0, marginTop: 1 }} />
                      ) : (
                        <Filter style={{ width: 14, height: 14, color: "#C08F68", flexShrink: 0, marginTop: 1 }} />
                      )}
                      <div>
                        <p style={{ fontSize: "0.75rem", fontWeight: 700, color: "#C08F68", marginBottom: 2 }}>
                          {filterMode === "adapt" ? "Adapt Meals" : "Filter Meals"}
                        </p>
                        <p style={{ fontSize: "0.68rem", color: "var(--wc-text-4)", lineHeight: 1.5 }}>
                          {filterMode === "adapt"
                            ? "All recipes stay visible — forbidden ingredients are automatically swapped when you open a recipe."
                            : "Recipes containing forbidden ingredients are hidden. You only see dishes that naturally match your diet."}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* ── Regular feature link buttons ── */}
            {NAV_FEATURES.map((feat) => {
              const Icon = feat.icon;
              return (
                <Link
                  key={feat.id}
                  href={feat.href}
                  className={`wc-feat-btn${feat.premium ? " wc-feat-btn-premium" : ""}`}
                >
                  <div className="wc-feat-icon-wrap">
                    <Icon style={{ width: 15, height: 15 }} />
                  </div>
                  <span className="wc-feat-title">{feat.title}</span>
                  <span className="wc-feat-desc">{feat.description}</span>
                  <span className="wc-feat-cta">{feat.cta}</span>
                </Link>
              );
            })}
          </div>

          {/* ── Notifications bell (far right) ── */}
          <div className="relative" ref={notifRef} style={{ flexShrink: 0 }}>
            <button
              className={`wc-notif-btn${notifOpen ? " open" : ""}`}
              onClick={() => { setNotifOpen((v) => !v); setHasRead(true); }}
              title="Notifications"
            >
              <Bell style={{ width: 16, height: 16 }} />
              {unread > 0 && <span className="wc-notif-dot" />}
            </button>

            {notifOpen && (
              <div className="wc-notif-panel">
                <div
                  className="flex items-center justify-between px-4 py-3"
                  style={{ borderBottom: "1px solid var(--wc-border-subtle)" }}
                >
                  <span className="text-sm font-bold" style={{ color: "var(--wc-text)" }}>
                    Notifications
                  </span>
                  {unread > 0 && (
                    <span
                      className="text-xs px-2 py-0.5 rounded-full font-bold"
                      style={{
                        background: "rgba(239,68,68,0.15)",
                        color: "#ef4444",
                        border: "1px solid rgba(239,68,68,0.3)",
                      }}
                    >
                      {unread} new
                    </span>
                  )}
                </div>

                <div className="divide-y" style={{ borderColor: "var(--wc-border-subtle)" }}>
                  <NotifItem
                    icon={<Sparkles style={{ width: 14, height: 14 }} />}
                    iconColor="var(--wc-gold)"
                    title="New premium recipes added"
                    body="12 new chef-curated recipes are now available."
                    time="2h ago"
                    unread
                  />
                  <NotifItem
                    icon={<ShoppingBasket style={{ width: 14, height: 14 }} />}
                    iconColor="var(--wc-terracotta)"
                    title="Pantry tip"
                    body="You have items expiring soon. Check your pantry!"
                    time="Yesterday"
                    unread
                  />
                  <NotifItem
                    icon={<Shuffle style={{ width: 14, height: 14 }} />}
                    iconColor="var(--wc-sage)"
                    title="Weekly meal swipe ready"
                    body="Your curated weekly swipe deck is fresh and ready."
                    time="2d ago"
                    unread={false}
                  />
                </div>

                <div className="px-4 py-2.5" style={{ borderTop: "1px solid var(--wc-border-subtle)" }}>
                  <button
                    className="text-xs font-medium w-full text-center hover:opacity-70 transition-opacity"
                    style={{ color: "var(--wc-terracotta)" }}
                  >
                    Mark all as read
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

function NotifItem({
  icon,
  iconColor,
  title,
  body,
  time,
  unread,
}: {
  icon: React.ReactNode;
  iconColor: string;
  title: string;
  body: string;
  time: string;
  unread: boolean;
}) {
  return (
    <div
      className="flex gap-3 px-4 py-3 cursor-pointer"
      style={{
        background: unread ? "var(--wc-bg-hover)" : "transparent",
        transition: "background 0.15s ease",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLDivElement).style.background = "var(--wc-bg-active)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLDivElement).style.background = unread
          ? "var(--wc-bg-hover)"
          : "transparent";
      }}
    >
      <div
        className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
        style={{ background: "var(--wc-bg-elevated)", color: iconColor }}
      >
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p
            className="text-xs font-semibold leading-snug"
            style={{ color: unread ? "var(--wc-text)" : "var(--wc-text-3)" }}
          >
            {title}
          </p>
          {unread && (
            <div className="w-2 h-2 rounded-full shrink-0 mt-1" style={{ background: "#ef4444" }} />
          )}
        </div>
        <p className="text-xs mt-0.5 line-clamp-2" style={{ color: "var(--wc-text-4)" }}>
          {body}
        </p>
        <p className="text-xs mt-1" style={{ color: "var(--wc-text-4)" }}>
          {time}
        </p>
      </div>
    </div>
  );
}
