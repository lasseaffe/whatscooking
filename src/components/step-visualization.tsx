"use client";

import React from "react";

// ---------------------------------------------------------------------------
// StepVisualization — keyword-matched SVG illustrations for cooking steps.
// Used in cooking mode to show technique diagrams for slicing, plating, etc.
// Add new SVGs here and register them in VISUALIZATIONS below.
// ---------------------------------------------------------------------------

// ── SVG components ──────────────────────────────────────────────────────────

function HalveOnionSVG() {
  return (
    <svg viewBox="0 0 240 110" className="w-full max-w-sm" style={{ height: 90 }}>
      {/* Whole onion left */}
      <ellipse cx="55" cy="58" rx="38" ry="42" fill="#D4A843" stroke="#A07820" strokeWidth="1.5" />
      <ellipse cx="55" cy="58" rx="28" ry="32" fill="none" stroke="#A07820" strokeWidth="0.8" opacity="0.5" />
      <ellipse cx="55" cy="58" rx="18" ry="22" fill="none" stroke="#A07820" strokeWidth="0.8" opacity="0.3" />
      <path d="M55 16 Q62 8 55 2 Q48 8 55 16Z" fill="#4a7a2a" />
      <text x="55" y="107" textAnchor="middle" fontSize="8" fill="#6B5B52">Whole</text>

      {/* Arrow */}
      <path d="M100 58 L118 58" stroke="#B07D56" strokeWidth="2" markerEnd="url(#arr)" />
      <defs>
        <marker id="arr" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
          <path d="M0,0 L6,3 L0,6Z" fill="#B07D56" />
        </marker>
      </defs>

      {/* Halved onion right — cross-section */}
      <ellipse cx="178" cy="58" rx="38" ry="21" fill="#EDD170" stroke="#A07820" strokeWidth="1.5" />
      <ellipse cx="178" cy="58" rx="28" ry="15" fill="none" stroke="#A07820" strokeWidth="0.8" opacity="0.5" />
      <ellipse cx="178" cy="58" rx="18" ry="9" fill="none" stroke="#A07820" strokeWidth="0.8" opacity="0.3" />
      <ellipse cx="178" cy="58" rx="8" ry="4" fill="#c8902a" opacity="0.4" />
      {/* Flat bottom line */}
      <line x1="140" y1="79" x2="216" y2="79" stroke="#A07820" strokeWidth="2" strokeDasharray="3,2" />
      {/* Stem dot */}
      <circle cx="178" cy="37" r="3" fill="#4a7a2a" />
      <text x="178" y="96" textAnchor="middle" fontSize="8" fill="#4a7a2a">Stem up</text>
      <text x="178" y="107" textAnchor="middle" fontSize="8" fill="#6B5B52">Flat side down = stable</text>
    </svg>
  );
}

function KnifeClawSVG() {
  return (
    <svg viewBox="0 0 200 80" className="w-full max-w-xs" style={{ height: 60 }}>
      {/* Hand/claw */}
      <ellipse cx="40" cy="50" rx="28" ry="18" fill="#FDDCB5" stroke="#C4956A" strokeWidth="1.5" />
      <rect x="24" y="32" width="7" height="22" rx="3" fill="#FDDCB5" stroke="#C4956A" strokeWidth="1.5" />
      <rect x="33" y="28" width="7" height="26" rx="3" fill="#FDDCB5" stroke="#C4956A" strokeWidth="1.5" />
      <rect x="42" y="30" width="7" height="24" rx="3" fill="#FDDCB5" stroke="#C4956A" strokeWidth="1.5" />
      <rect x="51" y="33" width="6" height="20" rx="3" fill="#FDDCB5" stroke="#C4956A" strokeWidth="1.5" />
      {/* Knife blade */}
      <path d="M70 42 L190 42 L190 48 Q150 56 70 52 Z" fill="#B0B8C0" stroke="#8a9099" strokeWidth="1" />
      <rect x="70" y="38" width="12" height="16" rx="2" fill="#4a4a4a" />
      <text x="100" y="72" textAnchor="middle" fontSize="9" fill="#6B5B52">Knuckles guide the blade</text>
    </svg>
  );
}

function SearSVG() {
  return (
    <svg viewBox="0 0 200 90" className="w-full max-w-xs" style={{ height: 70 }}>
      <ellipse cx="80" cy="78" rx="50" ry="6" fill="#FF6B00" opacity="0.3" />
      <path d="M55 78 Q58 60 65 55 Q62 70 70 65 Q68 50 78 42 Q76 62 85 58 Q84 48 90 42 Q92 58 98 60 Q95 72 100 68 Q97 78 55 78 Z" fill="#FF6B00" opacity="0.85" />
      <path d="M60 78 Q63 65 68 62 Q65 72 72 68 Q70 58 78 52 Q79 65 84 63 Q83 55 88 50 Q90 63 94 65 Q92 74 98 72 Q97 78 60 78 Z" fill="#FFAD00" opacity="0.9" />
      <ellipse cx="80" cy="76" rx="52" ry="8" fill="#4a4a4a" />
      <rect x="28" y="68" width="104" height="10" rx="3" fill="#3a3a3a" />
      <rect x="28" y="68" width="16" height="5" rx="2" fill="#2a2a2a" />
      <rect x="140" y="70" width="50" height="8" rx="4" fill="#5a4030" />
      {[55, 70, 85, 100].map((x, i) => (
        <ellipse key={i} cx={x} cy={72} rx="6" ry="3" fill={["#FF8C42", "#FFB347", "#FFA07A", "#FFD700"][i]} />
      ))}
      <text x="80" y="92" textAnchor="middle" fontSize="9" fill="#6B5B52">Hot pan → shimmer oil → add food</text>
    </svg>
  );
}

function PlatingDiagramSVG() {
  return (
    <svg viewBox="0 0 220 110" className="w-full max-w-sm" style={{ height: 90 }}>
      {/* Plate */}
      <circle cx="110" cy="55" r="50" fill="none" stroke="#8a7a6a" strokeWidth="2" />
      <circle cx="110" cy="55" r="42" fill="none" stroke="#8a7a6a" strokeWidth="0.5" opacity="0.4" />
      {/* Protein zone — left of centre */}
      <ellipse cx="98" cy="55" rx="22" ry="16" fill="#C8522A" opacity="0.7" />
      <text x="98" y="59" textAnchor="middle" fontSize="7" fill="#fff">protein</text>
      {/* Starch zone — right */}
      <ellipse cx="126" cy="60" rx="14" ry="10" fill="#D4A843" opacity="0.7" />
      <text x="126" y="64" textAnchor="middle" fontSize="7" fill="#fff">starch</text>
      {/* Veg zone — top */}
      <ellipse cx="108" cy="38" rx="10" ry="7" fill="#4a7a2a" opacity="0.8" />
      <text x="108" y="42" textAnchor="middle" fontSize="7" fill="#fff">veg</text>
      {/* Sauce swipe */}
      <path d="M72 72 Q100 80 138 68" fill="none" stroke="#A07820" strokeWidth="3" strokeLinecap="round" />
      <text x="110" y="108" textAnchor="middle" fontSize="8" fill="#6B5B52">Protein at 7 o'clock · sauce swipe</text>
    </svg>
  );
}

function NapkinFoldSVG() {
  return (
    <svg viewBox="0 0 260 100" className="w-full max-w-sm" style={{ height: 80 }}>
      {/* Step 1: flat square */}
      <rect x="10" y="20" width="50" height="50" fill="#EFE3CE" stroke="#B07D56" strokeWidth="1.5" />
      <text x="35" y="82" textAnchor="middle" fontSize="7" fill="#6B5B52">1. Flat</text>

      {/* Arrow */}
      <path d="M68 45 L82 45" stroke="#B07D56" strokeWidth="1.5" markerEnd="url(#arr2)" />
      <defs>
        <marker id="arr2" markerWidth="5" markerHeight="5" refX="3" refY="2.5" orient="auto">
          <path d="M0,0 L5,2.5 L0,5Z" fill="#B07D56" />
        </marker>
      </defs>

      {/* Step 2: folded in half (triangle) */}
      <polygon points="90,70 140,70 115,20" fill="#EFE3CE" stroke="#B07D56" strokeWidth="1.5" />
      <text x="115" y="82" textAnchor="middle" fontSize="7" fill="#6B5B52">2. Diagonal fold</text>

      {/* Arrow */}
      <path d="M148 45 L162 45" stroke="#B07D56" strokeWidth="1.5" markerEnd="url(#arr3)" />
      <defs>
        <marker id="arr3" markerWidth="5" markerHeight="5" refX="3" refY="2.5" orient="auto">
          <path d="M0,0 L5,2.5 L0,5Z" fill="#B07D56" />
        </marker>
      </defs>

      {/* Step 3: bishop's hat */}
      <polygon points="170,70 220,70 215,25 195,45 175,25" fill="#EFE3CE" stroke="#B07D56" strokeWidth="1.5" />
      <text x="195" y="82" textAnchor="middle" fontSize="7" fill="#6B5B52">3. Stand upright</text>
    </svg>
  );
}

function KneadSVG() {
  return (
    <svg viewBox="0 0 220 100" className="w-full max-w-sm" style={{ height: 80 }}>
      {/* Dough blob */}
      <ellipse cx="110" cy="65" rx="70" ry="22" fill="#EDD170" stroke="#A07820" strokeWidth="1.5" />
      {/* Left hand pressing */}
      <ellipse cx="72" cy="52" rx="24" ry="14" fill="#FDDCB5" stroke="#C4956A" strokeWidth="1.5" />
      <rect x="60" y="38" width="8" height="18" rx="4" fill="#FDDCB5" stroke="#C4956A" strokeWidth="1" />
      <rect x="70" y="35" width="8" height="20" rx="4" fill="#FDDCB5" stroke="#C4956A" strokeWidth="1" />
      <rect x="80" y="37" width="7" height="18" rx="4" fill="#FDDCB5" stroke="#C4956A" strokeWidth="1" />
      {/* Right hand */}
      <ellipse cx="148" cy="52" rx="24" ry="14" fill="#FDDCB5" stroke="#C4956A" strokeWidth="1.5" />
      <rect x="132" y="38" width="7" height="18" rx="4" fill="#FDDCB5" stroke="#C4956A" strokeWidth="1" />
      <rect x="142" y="35" width="8" height="20" rx="4" fill="#FDDCB5" stroke="#C4956A" strokeWidth="1" />
      <rect x="152" y="37" width="8" height="18" rx="4" fill="#FDDCB5" stroke="#C4956A" strokeWidth="1" />
      {/* Arrows showing push direction */}
      <path d="M88 60 L100 60" stroke="#C8522A" strokeWidth="2" markerEnd="url(#arrK)" />
      <path d="M132 60 L120 60" stroke="#C8522A" strokeWidth="2" markerEnd="url(#arrK2)" />
      <defs>
        <marker id="arrK" markerWidth="5" markerHeight="5" refX="3" refY="2.5" orient="auto">
          <path d="M0,0 L5,2.5 L0,5Z" fill="#C8522A" />
        </marker>
        <marker id="arrK2" markerWidth="5" markerHeight="5" refX="3" refY="2.5" orient="180">
          <path d="M0,0 L5,2.5 L0,5Z" fill="#C8522A" />
        </marker>
      </defs>
      <text x="110" y="97" textAnchor="middle" fontSize="8" fill="#6B5B52">Heel of palm pushes forward, fold & rotate</text>
    </svg>
  );
}

function RollDoughSVG() {
  return (
    <svg viewBox="0 0 220 90" className="w-full max-w-sm" style={{ height: 75 }}>
      {/* Rolling pin */}
      <rect x="20" y="32" width="180" height="16" rx="8" fill="#8B6340" stroke="#5a3a20" strokeWidth="1.5" />
      <rect x="8" y="28" width="16" height="24" rx="8" fill="#6a4a28" stroke="#5a3a20" strokeWidth="1.5" />
      <rect x="196" y="28" width="16" height="24" rx="8" fill="#6a4a28" stroke="#5a3a20" strokeWidth="1.5" />
      {/* Dough beneath */}
      <ellipse cx="110" cy="70" rx="80" ry="10" fill="#EDD170" stroke="#A07820" strokeWidth="1.5" />
      {/* Motion arrows */}
      <path d="M60 25 L40 20" stroke="#B07D56" strokeWidth="1.5" markerEnd="url(#arrR)" />
      <path d="M160 25 L180 20" stroke="#B07D56" strokeWidth="1.5" markerEnd="url(#arrR2)" />
      <defs>
        <marker id="arrR" markerWidth="5" markerHeight="5" refX="3" refY="2.5" orient="auto">
          <path d="M0,0 L5,2.5 L0,5Z" fill="#B07D56" />
        </marker>
        <marker id="arrR2" markerWidth="5" markerHeight="5" refX="3" refY="2.5" orient="auto">
          <path d="M0,0 L5,2.5 L0,5Z" fill="#B07D56" />
        </marker>
      </defs>
      <text x="110" y="88" textAnchor="middle" fontSize="8" fill="#6B5B52">Roll away from body with even pressure</text>
    </svg>
  );
}

function SpiceBowlSVG() {
  return (
    <svg viewBox="0 0 220 100" className="w-full max-w-sm" style={{ height: 80 }}>
      {/* Bowl */}
      <path d="M50 55 Q50 85 110 85 Q170 85 170 55 Z" fill="#2d2926" stroke="#B07D56" strokeWidth="1.5" />
      <ellipse cx="110" cy="55" rx="60" ry="12" fill="#3a3430" stroke="#B07D56" strokeWidth="1.5" />
      {/* Spice mounds */}
      <ellipse cx="88" cy="52" rx="16" ry="7" fill="#C8522A" opacity="0.85" />
      <ellipse cx="115" cy="50" rx="14" ry="6" fill="#D4A843" opacity="0.8" />
      <ellipse cx="140" cy="53" rx="12" ry="5" fill="#8B4513" opacity="0.75" />
      {/* Floating aroma particles */}
      <circle cx="85" cy="38" r="2" fill="#C8522A" opacity="0.5" />
      <circle cx="110" cy="32" r="2.5" fill="#D4A843" opacity="0.45" />
      <circle cx="135" cy="36" r="2" fill="#C8522A" opacity="0.4" />
      <circle cx="98" cy="26" r="1.5" fill="#D4A843" opacity="0.35" />
      <circle cx="122" cy="24" r="1.5" fill="#C8522A" opacity="0.3" />
      {/* Spoon */}
      <ellipse cx="168" cy="38" rx="8" ry="5" fill="#B0B8C0" stroke="#8a9099" strokeWidth="1" />
      <line x1="168" y1="42" x2="160" y2="62" stroke="#B0B8C0" strokeWidth="2" strokeLinecap="round" />
      <text x="110" y="98" textAnchor="middle" fontSize="8" fill="#6B5B52">Bloom in hot fat — 60 seconds</text>
    </svg>
  );
}

function CoveredPotSVG() {
  return (
    <svg viewBox="0 0 220 100" className="w-full max-w-sm" style={{ height: 80 }}>
      {/* Pot body */}
      <rect x="30" y="50" width="160" height="38" rx="10" fill="#3a3634" stroke="#5a5452" strokeWidth="1.5" />
      {/* Lid */}
      <rect x="26" y="40" width="168" height="14" rx="7" fill="#4a4848" stroke="#5a5452" strokeWidth="1.5" />
      <ellipse cx="110" cy="40" rx="16" ry="6" fill="#5a5856" stroke="#6a6664" strokeWidth="1" />
      {/* Side handles */}
      <rect x="10" y="56" width="20" height="12" rx="6" fill="#4a4644" stroke="#5a5452" strokeWidth="1" />
      <rect x="190" y="56" width="20" height="12" rx="6" fill="#4a4644" stroke="#5a5452" strokeWidth="1" />
      {/* Steam wisps from lid gap */}
      <path d="M80 40 Q77 30 81 22" stroke="#EFE3CE" strokeWidth="1.5" fill="none" strokeLinecap="round" opacity="0.3" />
      <path d="M110 40 Q107 29 111 20" stroke="#EFE3CE" strokeWidth="1.5" fill="none" strokeLinecap="round" opacity="0.35" />
      <path d="M140 40 Q137 30 141 22" stroke="#EFE3CE" strokeWidth="1.5" fill="none" strokeLinecap="round" opacity="0.28" />
      {/* Bubble hint through pot */}
      <circle cx="80" cy="72" r="5" fill="#B83232" opacity="0.3" />
      <circle cx="115" cy="76" r="7" fill="#B83232" opacity="0.25" />
      <circle cx="148" cy="70" r="4" fill="#B83232" opacity="0.28" />
      <text x="110" y="98" textAnchor="middle" fontSize="8" fill="#6B5B52">Low bubble — stir every few minutes</text>
    </svg>
  );
}

function PlatedDishSVG() {
  return (
    <svg viewBox="0 0 220 110" className="w-full max-w-sm" style={{ height: 90 }}>
      {/* Plate rim */}
      <circle cx="110" cy="55" r="52" fill="none" stroke="#8a7a6a" strokeWidth="2" />
      <circle cx="110" cy="55" r="44" fill="none" stroke="#8a7a6a" strokeWidth="0.5" opacity="0.3" />
      {/* Protein — left-centre */}
      <ellipse cx="100" cy="55" rx="24" ry="17" fill="#C8522A" opacity="0.75" />
      {/* Starch — right */}
      <ellipse cx="128" cy="60" rx="15" ry="11" fill="#D4A843" opacity="0.7" />
      {/* Veg — top */}
      <ellipse cx="107" cy="38" rx="11" ry="8" fill="#4a7a2a" opacity="0.8" />
      {/* Sauce swipe */}
      <path d="M68 74 Q100 82 142 69" fill="none" stroke="#A07820" strokeWidth="3.5" strokeLinecap="round" opacity="0.6" />
      {/* Herb dots */}
      <circle cx="104" cy="50" r="2" fill="#4a7a2a" opacity="0.9" />
      <circle cx="115" cy="56" r="1.5" fill="#4a7a2a" opacity="0.8" />
      <circle cx="96" cy="58" r="1.5" fill="#4a7a2a" opacity="0.85" />
      <text x="110" y="108" textAnchor="middle" fontSize="8" fill="#6B5B52">Protein at 7 o'clock · sauce swipe · herbs</text>
    </svg>
  );
}

function DicedOnionSVG() {
  return (
    <svg viewBox="0 0 220 100" className="w-full max-w-sm" style={{ height: 80 }}>
      {/* Cutting board */}
      <rect x="10" y="60" width="200" height="28" rx="6" fill="#8B6340" opacity="0.5" />
      {/* Onion half — flat side down */}
      <ellipse cx="90" cy="56" rx="44" ry="28" fill="#D4A843" opacity="0.75" />
      <ellipse cx="90" cy="56" rx="33" ry="21" fill="none" stroke="#A07820" strokeWidth="0.8" opacity="0.5" />
      <ellipse cx="90" cy="56" rx="22" ry="13" fill="none" stroke="#A07820" strokeWidth="0.8" opacity="0.35" />
      {/* Grid cut lines */}
      <line x1="60" y1="56" x2="120" y2="56" stroke="#8B4513" strokeWidth="0.8" opacity="0.5" strokeDasharray="3 2" />
      <line x1="72" y1="36" x2="72" y2="72" stroke="#8B4513" strokeWidth="0.8" opacity="0.5" strokeDasharray="3 2" />
      <line x1="90" y1="30" x2="90" y2="74" stroke="#8B4513" strokeWidth="0.8" opacity="0.5" strokeDasharray="3 2" />
      <line x1="108" y1="36" x2="108" y2="72" stroke="#8B4513" strokeWidth="0.8" opacity="0.5" strokeDasharray="3 2" />
      {/* Root end dot */}
      <circle cx="46" cy="56" r="4" fill="#6B4A20" opacity="0.6" />
      {/* Knife */}
      <rect x="148" y="30" width="5" height="42" rx="1.5" fill="#B0B8C0" opacity="0.8" />
      <path d="M148 30 L153 30 L155 70 L148 70Z" fill="#9aa0a8" opacity="0.5" />
      <rect x="147" y="68" width="7" height="10" rx="2.5" fill="#8B6340" opacity="0.9" />
      <text x="90" y="96" textAnchor="middle" fontSize="8" fill="#6B5B52">Keep root intact — holds shape as you cut</text>
    </svg>
  );
}

function SoftVegSVG() {
  return (
    <svg viewBox="0 0 220 100" className="w-full max-w-sm" style={{ height: 80 }}>
      {/* Pan shadow */}
      <ellipse cx="100" cy="88" rx="72" ry="8" fill="#181410" opacity="0.35" />
      {/* Pan body */}
      <rect x="28" y="52" width="144" height="36" rx="10" fill="#2d2926" stroke="#4a4340" strokeWidth="1.5" />
      <rect x="32" y="56" width="136" height="28" rx="8" fill="#222018" />
      {/* Translucent veg pieces */}
      <ellipse cx="65" cy="70" rx="18" ry="10" fill="#D4A843" opacity="0.55" />
      <ellipse cx="65" cy="70" rx="13" ry="7" fill="#E8C060" opacity="0.35" />
      <ellipse cx="100" cy="66" rx="15" ry="9" fill="#D4A843" opacity="0.5" />
      <ellipse cx="134" cy="70" rx="16" ry="9" fill="#D4A843" opacity="0.52" />
      {/* Handle */}
      <rect x="172" y="60" width="40" height="10" rx="5" fill="#4a4744" />
      {/* Small flame */}
      <path d="M40 52 Q38 44 43 40 Q40 48 48 45 Q42 38 52 34 Q49 44 55 42 Q53 52 47 52Z" fill="#F97316" opacity="0.5" />
      <path d="M70 52 Q68 45 73 41 Q70 49 77 46 Q72 40 80 37 Q78 47 83 45 Q81 52 75 52Z" fill="#F97316" opacity="0.45" />
      {/* Steam */}
      <path d="M65 52 Q62 43 66 37" stroke="#EFE3CE" strokeWidth="1.2" fill="none" strokeLinecap="round" opacity="0.2" />
      <path d="M100 52 Q97 43 101 37" stroke="#EFE3CE" strokeWidth="1.2" fill="none" strokeLinecap="round" opacity="0.18" />
      <text x="100" y="98" textAnchor="middle" fontSize="8" fill="#6B5B52">Medium heat · no browning · just softening</text>
    </svg>
  );
}

function EggsInSauceSVG() {
  return (
    <svg viewBox="0 0 220 100" className="w-full max-w-sm" style={{ height: 80 }}>
      {/* Pan */}
      <ellipse cx="100" cy="88" rx="72" ry="8" fill="#181410" opacity="0.3" />
      <rect x="28" y="46" width="144" height="42" rx="10" fill="#2d2926" stroke="#4a4340" strokeWidth="1.5" />
      <rect x="32" y="50" width="136" height="34" rx="8" fill="#222018" />
      {/* Tomato sauce surface */}
      <ellipse cx="100" cy="67" rx="58" ry="16" fill="#8B2020" opacity="0.6" />
      <ellipse cx="100" cy="65" rx="54" ry="14" fill="#B83232" opacity="0.7" />
      {/* Egg 1 */}
      <ellipse cx="72" cy="63" rx="16" ry="11" fill="#EFE3CE" opacity="0.92" />
      <ellipse cx="72" cy="63" rx="7" ry="6" fill="#F4A261" />
      {/* Egg 2 */}
      <ellipse cx="128" cy="63" rx="16" ry="11" fill="#EFE3CE" opacity="0.92" />
      <ellipse cx="128" cy="63" rx="7" ry="6" fill="#F4A261" />
      {/* Herb dots */}
      <circle cx="78" cy="58" r="2" fill="#4a7a2a" opacity="0.85" />
      <circle cx="100" cy="56" r="1.5" fill="#4a7a2a" opacity="0.8" />
      <circle cx="122" cy="59" r="2" fill="#4a7a2a" opacity="0.82" />
      {/* Handle */}
      <rect x="172" y="58" width="36" height="10" rx="5" fill="#4a4744" />
      {/* Steam */}
      <path d="M72 46 Q70 37 74 30" stroke="#EFE3CE" strokeWidth="1.2" fill="none" strokeLinecap="round" opacity="0.18" />
      <path d="M128 46 Q126 37 130 30" stroke="#EFE3CE" strokeWidth="1.2" fill="none" strokeLinecap="round" opacity="0.16" />
      <text x="100" y="98" textAnchor="middle" fontSize="8" fill="#6B5B52">Whites set · yolks wobble · don't overcook</text>
    </svg>
  );
}

// ── Keyword → SVG registry ───────────────────────────────────────────────────

interface VisualizationEntry {
  keywords: string[];
  render: () => React.ReactElement;
  label: string;
}

const VISUALIZATIONS: VisualizationEntry[] = [
  {
    keywords: ["halve", "half the onion", "halving", "cut the onion in half", "halved onion"],
    render: HalveOnionSVG,
    label: "How to halve an onion",
  },
  {
    keywords: ["slice", "dice", "chop", "mince", "julienne", "knife", "grip the"],
    render: KnifeClawSVG,
    label: "Knife claw grip",
  },
  {
    keywords: ["sear", "sauté", "saute", "stir-fry", "stir fry", "fry", "brown the"],
    render: SearSVG,
    label: "Hot pan technique",
  },
  {
    keywords: ["plate", "plating", "serve", "serving", "arrange on", "presentation"],
    render: PlatingDiagramSVG,
    label: "Plating diagram",
  },
  {
    keywords: ["fold the napkin", "napkin fold", "folding napkins"],
    render: NapkinFoldSVG,
    label: "Napkin fold",
  },
  {
    keywords: ["knead", "kneading"],
    render: KneadSVG,
    label: "Kneading technique",
  },
  {
    keywords: ["roll out", "rolling pin", "roll the dough"],
    render: RollDoughSVG,
    label: "Rolling dough",
  },
  {
    keywords: ["bloom", "toast the spice", "add spice", "add the spice", "add cumin", "add paprika", "add coriander", "spice into"],
    render: SpiceBowlSVG,
    label: "Blooming spices",
  },
  {
    keywords: ["simmer", "reduce", "low heat", "low and slow", "lid on", "cover and cook"],
    render: CoveredPotSVG,
    label: "Simmer with lid",
  },
  {
    keywords: ["plate", "plating", "serve", "serving", "arrange on", "presentation", "garnish"],
    render: PlatedDishSVG,
    label: "Plating guide",
  },
  {
    keywords: ["dice the onion", "chop the onion", "mince the onion", "finely chop", "finely dice"],
    render: DicedOnionSVG,
    label: "Dicing an onion",
  },
  {
    keywords: ["soften", "sweat", "translucent", "softened onion", "cook the onion", "cook onion"],
    render: SoftVegSVG,
    label: "Softening veg",
  },
  {
    keywords: ["crack", "nestle", "egg into", "eggs into", "crack the egg", "crack an egg"],
    render: EggsInSauceSVG,
    label: "Eggs in sauce",
  },
];

// ── Public component ─────────────────────────────────────────────────────────

interface StepVisualizationProps {
  stepText: string;
  mode?: "card" | "background"; // default: "card"
}

export function StepVisualization({ stepText, mode = "card" }: StepVisualizationProps): React.ReactElement | null {
  const lower = stepText.toLowerCase();
  const match = VISUALIZATIONS.find((v) =>
    v.keywords.some((kw) => lower.includes(kw))
  );
  if (!match) return null;

  if (mode === "background") {
    // Return only the SVG, no wrapper — caller handles positioning and opacity
    return <>{match.render()}</>;
  }

  return (
    <div
      className="my-5 flex flex-col items-center gap-1 px-4 py-3 rounded-xl"
      style={{ background: "rgba(42,24,8,0.35)", border: "1px solid rgba(176,125,86,0.2)" }}
    >
      {match.render()}
      <p className="text-xs font-semibold uppercase tracking-widest mt-1" style={{ color: "#B07D56" }}>
        {match.label}
      </p>
    </div>
  );
}
