"use client";

import { useEffect } from "react";
import Link from "next/link";
import type { CuisineInfo } from "@/lib/cuisines";

function flagEmoji(code: string): string {
  if (code.length !== 2) return "";
  return String.fromCodePoint(...[...code.toUpperCase()].map(c => c.charCodeAt(0) + 127397));
}

// Deterministic rotation: seeded by dish name so it looks organic but never changes
function stampRotation(name: string): number {
  const seed = name.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  return ((seed % 11) - 5) * 1.2; // range: -6deg to +6deg
}

interface Props {
  cuisine: CuisineInfo;
  recipeCount: number;
  onClose: () => void;
}

export function CuisinePassport({ cuisine, recipeCount, onClose }: Props) {
  const isUnlocked = recipeCount >= 3;
  const stampsEarned = Math.min(recipeCount, cuisine.keyDishes.length);

  // Close on Escape
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <div className="passport-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="passport-modal" role="dialog" aria-modal="true" aria-label={`${cuisine.name} Passport`}>

        {/* Passport cover strip */}
        <div
          className="passport-cover"
          style={{
            background: `linear-gradient(135deg, ${cuisine.color}22, ${cuisine.color}44)`,
            borderBottom: `3px solid ${cuisine.color}`,
          }}
        >
          {/* Decorative guilloche lines */}
          <div className="passport-guilloche" aria-hidden>
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="guilloche-line" style={{ top: `${i * 8}%`, opacity: 0.06 }} />
            ))}
          </div>

          <div className="passport-cover-inner">
            <div>
              <div className="passport-subtitle">CUISINE PASSPORT</div>
              <h2 className="passport-country" style={{ color: cuisine.color }}>
                {flagEmoji(cuisine.flag)} {cuisine.name}
              </h2>
              <p className="passport-tagline">&ldquo;{cuisine.tagline}&rdquo;</p>
            </div>

            {/* Status badge */}
            <div
              className="passport-status"
              style={{
                background: isUnlocked
                  ? "linear-gradient(135deg, #F4A900, #E08800)"
                  : "rgba(255,255,255,0.08)",
                color: isUnlocked ? "#fff" : "rgba(255,255,255,0.4)",
                border: isUnlocked ? "none" : "1px solid rgba(255,255,255,0.12)",
              }}
            >
              {isUnlocked ? "✦ VISA GRANTED" : `${recipeCount}/3 recipes`}
            </div>
          </div>
        </div>

        {/* Stamp pages */}
        <div className="passport-body">
          <div className="passport-stamps-heading">Entry Stamps</div>

          <div className="passport-stamps-grid">
            {cuisine.keyDishes.map((dish, i) => {
              const earned = i < stampsEarned;
              const rot = stampRotation(dish);

              return (
                <div
                  key={dish}
                  className={`passport-stamp ${earned ? "stamp-earned" : "stamp-pending"}`}
                  style={{
                    transform: earned ? `rotate(${rot}deg)` : "none",
                    borderColor: earned ? cuisine.color : "rgba(255,255,255,0.1)",
                    background: earned
                      ? `${cuisine.color}18`
                      : "rgba(255,255,255,0.03)",
                    boxShadow: earned
                      ? `0 2px 12px ${cuisine.color}30, inset 0 0 0 1px ${cuisine.color}40`
                      : "none",
                  }}
                >
                  {earned ? (
                    <>
                      <div className="stamp-inner-ring" style={{ borderColor: `${cuisine.color}50` }} />
                      <span className="stamp-flag">{flagEmoji(cuisine.flag)}</span>
                      <span className="stamp-dish" style={{ color: cuisine.color }}>{dish}</span>
                      <span className="stamp-mark" style={{ color: cuisine.color }}>✦</span>
                    </>
                  ) : (
                    <span className="stamp-empty">?</span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Progress bar */}
          <div className="passport-progress-wrap">
            <div className="passport-progress-label">
              <span style={{ color: "rgba(255,255,255,0.5)" }}>Collection progress</span>
              <span style={{ color: cuisine.color, fontWeight: 700 }}>
                {recipeCount} / {cuisine.keyDishes.length} dishes
              </span>
            </div>
            <div className="passport-progress-track">
              <div
                className="passport-progress-fill"
                style={{
                  width: `${Math.min(100, (recipeCount / cuisine.keyDishes.length) * 100)}%`,
                  background: `linear-gradient(90deg, ${cuisine.color}, #F4A900)`,
                }}
              />
            </div>
          </div>

          {/* CTA */}
          <div className="passport-cta-row">
            <Link
              href={`/cuisines/${cuisine.slug}`}
              className="passport-cta-btn"
              style={{
                background: `linear-gradient(135deg, ${cuisine.color}, ${cuisine.color}cc)`,
              }}
              onClick={onClose}
            >
              Explore {cuisine.name} Recipes →
            </Link>
            <button className="passport-close-btn" onClick={onClose}>
              Close
            </button>
          </div>
        </div>
      </div>

      <style>{`
        .passport-overlay {
          position: fixed;
          inset: 0;
          z-index: 9999;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 16px;
          background: rgba(5, 3, 1, 0.75);
          backdrop-filter: blur(8px);
          animation: overlay-in 0.2s ease;
        }
        @keyframes overlay-in {
          from { opacity: 0; }
          to   { opacity: 1; }
        }

        .passport-modal {
          width: 100%;
          max-width: 420px;
          border-radius: 20px;
          overflow: hidden;
          background: #1a1410;
          border: 1px solid rgba(255,255,255,0.1);
          box-shadow: 0 32px 80px rgba(0,0,0,0.7);
          animation: modal-in 0.25s cubic-bezier(0.34,1.56,0.64,1);
        }
        @keyframes modal-in {
          from { transform: scale(0.88) translateY(20px); opacity: 0; }
          to   { transform: scale(1) translateY(0); opacity: 1; }
        }

        .passport-cover {
          position: relative;
          padding: 20px 20px 18px;
          overflow: hidden;
        }
        .passport-guilloche {
          position: absolute;
          inset: 0;
          pointer-events: none;
        }
        .guilloche-line {
          position: absolute;
          left: 0; right: 0;
          height: 1px;
          background: currentColor;
          color: white;
        }
        .passport-cover-inner {
          position: relative;
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 12px;
        }
        .passport-subtitle {
          font-size: 0.6rem;
          font-weight: 800;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: rgba(255,255,255,0.35);
          margin-bottom: 4px;
        }
        .passport-country {
          font-size: 1.4rem;
          font-weight: 900;
          font-family: 'Libre Baskerville', Georgia, serif;
          line-height: 1.1;
          margin: 0 0 6px;
        }
        .passport-tagline {
          font-size: 0.72rem;
          color: rgba(255,255,255,0.4);
          font-style: italic;
          margin: 0;
        }
        .passport-status {
          flex-shrink: 0;
          padding: 6px 12px;
          border-radius: 999px;
          font-size: 0.65rem;
          font-weight: 800;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          white-space: nowrap;
          margin-top: 4px;
        }

        .passport-body {
          padding: 18px 20px 20px;
        }
        .passport-stamps-heading {
          font-size: 0.6rem;
          font-weight: 700;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          color: rgba(255,255,255,0.3);
          margin-bottom: 14px;
        }

        .passport-stamps-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 10px;
          margin-bottom: 18px;
        }

        .passport-stamp {
          aspect-ratio: 1;
          border-radius: 50%;
          border: 2px solid;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          position: relative;
          transition: transform 0.2s ease;
          gap: 2px;
        }
        .stamp-earned:hover {
          transform: rotate(0deg) scale(1.08) !important;
        }

        .stamp-inner-ring {
          position: absolute;
          inset: 5px;
          border-radius: 50%;
          border: 1px dashed;
          pointer-events: none;
        }

        .stamp-flag {
          font-size: 1rem;
          line-height: 1;
        }
        .stamp-dish {
          font-size: 0.44rem;
          font-weight: 700;
          text-align: center;
          line-height: 1.2;
          padding: 0 4px;
          letter-spacing: -0.01em;
        }
        .stamp-mark {
          font-size: 0.5rem;
          opacity: 0.7;
        }
        .stamp-pending {
          opacity: 0.3;
        }
        .stamp-empty {
          font-size: 1rem;
          opacity: 0.2;
          color: white;
        }

        .passport-progress-wrap {
          margin-bottom: 16px;
        }
        .passport-progress-label {
          display: flex;
          justify-content: space-between;
          font-size: 0.7rem;
          margin-bottom: 6px;
        }
        .passport-progress-track {
          height: 5px;
          background: rgba(255,255,255,0.08);
          border-radius: 999px;
          overflow: hidden;
        }
        .passport-progress-fill {
          height: 100%;
          border-radius: 999px;
          transition: width 0.6s cubic-bezier(0.34,1.56,0.64,1);
        }

        .passport-cta-row {
          display: flex;
          gap: 10px;
          align-items: center;
        }
        .passport-cta-btn {
          flex: 1;
          display: block;
          text-align: center;
          padding: 10px 16px;
          border-radius: 10px;
          color: #fff;
          font-weight: 700;
          font-size: 0.8rem;
          text-decoration: none;
          transition: opacity 0.15s ease;
        }
        .passport-cta-btn:hover {
          opacity: 0.85;
        }
        .passport-close-btn {
          padding: 10px 14px;
          border-radius: 10px;
          background: rgba(255,255,255,0.07);
          color: rgba(255,255,255,0.45);
          font-size: 0.78rem;
          font-weight: 600;
          border: none;
          cursor: pointer;
          transition: background 0.15s ease;
        }
        .passport-close-btn:hover {
          background: rgba(255,255,255,0.12);
          color: rgba(255,255,255,0.7);
        }
      `}</style>
    </div>
  );
}
