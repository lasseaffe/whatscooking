"use client";

import { useState } from "react";
import { Clock } from "lucide-react";

// ---------------------------------------------------------------------------
// Step category detection
// Each category has keyword patterns and a colour
// ---------------------------------------------------------------------------
export interface TimeSegment {
  label: string;
  minutes: number;
  color: string;
  textColor: string;
  icon: string;
}

interface StepCategory {
  label: string;
  color: string;
  textColor: string;
  icon: string;
  patterns: RegExp[];
}

const STEP_CATEGORIES: StepCategory[] = [
  {
    label: "Chop & Prep",
    color: "#FDE68A",
    textColor: "#78350F",
    icon: "🔪",
    patterns: [
      /\b(chop|dice|mince|slice|julienne|cut|peel|trim|shred|grate|zest|crush|halv|quarter|cube|segment)\b/i,
      /\b(prepare|prep|measure|weigh|portion)\b/i,
    ],
  },
  {
    label: "Marinate",
    color: "#D9F99D",
    textColor: "#365314",
    icon: "🫙",
    patterns: [
      /\b(marinat|soak|rest|refrigerat|overnight|sit)\b/i,
    ],
  },
  {
    label: "Sauté & Fry",
    color: "#FCA5A5",
    textColor: "#7F1D1D",
    icon: "🍳",
    patterns: [
      /\b(sauté|saute|sautéing|sauteing|fry|frying|pan.fry|deep.fry|stir.fry|shallow.fry|cook.*oil|heat.*oil|cook.*butter|sear|brown|crisp|caramelise|caramelize)\b/i,
      /\b(sweat|render|toast)\b/i,
    ],
  },
  {
    label: "Boil & Simmer",
    color: "#93C5FD",
    textColor: "#1E3A5F",
    icon: "♨️",
    patterns: [
      /\b(boil|simmer|blanch|poach|steam|reduce|deglaze|braise|stew|bring to a boil|boiling water|salted water)\b/i,
      /\b(cook.*pasta|cook.*rice|cook.*noodle|cook.*lentil|cook.*bean)\b/i,
    ],
  },
  {
    label: "Bake & Roast",
    color: "#F9A8D4",
    textColor: "#831843",
    icon: "🔥",
    patterns: [
      /\b(bak|roast|broil|grill|oven|preheat|400|375|425|450|325|350|°[CF]|degrees)\b/i,
    ],
  },
  {
    label: "Mix & Whisk",
    color: "#C4B5FD",
    textColor: "#4C1D95",
    icon: "🥣",
    patterns: [
      /\b(whisk|mix|blend|stir|beat|fold|combine|toss|knead|pulse|process|incorporate|emulsif|season)\b/i,
    ],
  },
  {
    label: "Rest & Cool",
    color: "#A7F3D0",
    textColor: "#065F46",
    icon: "⏱️",
    patterns: [
      /\b(rest|cool|chill|refrigerat|let sit|set aside|room temp|remove from heat)\b/i,
    ],
  },
  {
    label: "Assemble",
    color: "#E0E7FF",
    textColor: "#3730A3",
    icon: "🍽️",
    patterns: [
      /\b(assemble|layer|serve|plate|arrange|garnish|top with|drizzle|sprinkle|finish)\b/i,
    ],
  },
];

function categoriseStep(step: string): StepCategory {
  for (const cat of STEP_CATEGORIES) {
    if (cat.patterns.some((p) => p.test(step))) return cat;
  }
  // Fallback
  return {
    label: "Cook",
    color: "#FED7AA",
    textColor: "#9A3412",
    icon: "🍴",
    patterns: [],
  };
}

// ---------------------------------------------------------------------------
// Time distribution logic
// We parse the instruction steps looking for explicit time mentions,
// then distribute the remaining time proportionally across unclaimed steps.
// ---------------------------------------------------------------------------
function extractMinutes(text: string): number | null {
  // Patterns like "15 min", "2 hours", "1.5 hrs", "30–40 minutes"
  const hourMatch = text.match(/(\d+(?:\.\d+)?)\s*(?:hour|hr)s?/i);
  const minMatch = text.match(/(\d+)(?:–\d+)?\s*(?:minute|min)s?/i);
  let total = 0;
  if (hourMatch) total += parseFloat(hourMatch[1]) * 60;
  if (minMatch) total += parseInt(minMatch[1]);
  return total > 0 ? total : null;
}

export function buildTimeSegments(
  instructions: string[],
  prepTimeMinutes: number,
  cookTimeMinutes: number
): TimeSegment[] {
  if (!instructions.length && !prepTimeMinutes && !cookTimeMinutes) return [];

  // Always start with a Prep segment if prepTime > 0
  const segments: TimeSegment[] = [];

  if (prepTimeMinutes > 0) {
    segments.push({
      label: "Prep",
      minutes: prepTimeMinutes,
      color: "#FEF08A",
      textColor: "#713F12",
      icon: "📋",
    });
  }

  // Now distribute cook time across instruction steps
  if (cookTimeMinutes > 0 && instructions.length > 0) {
    // 1. Extract any explicit time mentions per step
    const stepMins: (number | null)[] = instructions.map(extractMinutes);
    const explicitTotal = stepMins.reduce<number>((acc, m) => acc + (m ?? 0), 0);
    const unclaimedSteps = stepMins.filter((m) => m === null).length;
    const remainingMins = Math.max(0, cookTimeMinutes - explicitTotal);
    const perUnclaimed = unclaimedSteps > 0 ? remainingMins / unclaimedSteps : 0;

    // 2. Categorise each step
    const rawSegments: { cat: StepCategory; mins: number }[] = instructions.map((step, i) => ({
      cat: categoriseStep(step),
      mins: stepMins[i] ?? perUnclaimed,
    }));

    // 3. Merge consecutive same-category steps and round mins
    const merged: { cat: StepCategory; mins: number }[] = [];
    for (const seg of rawSegments) {
      if (seg.mins < 0.5) continue; // skip effectively zero-time steps
      const last = merged[merged.length - 1];
      if (last && last.cat.label === seg.cat.label) {
        last.mins += seg.mins;
      } else {
        merged.push({ cat: seg.cat, mins: seg.mins });
      }
    }

    // 4. Scale merged segments so they sum exactly to cookTimeMinutes
    const mergedTotal = merged.reduce((a, b) => a + b.mins, 0);
    const scale = mergedTotal > 0 ? cookTimeMinutes / mergedTotal : 1;

    for (const seg of merged) {
      const mins = Math.max(1, Math.round(seg.mins * scale));
      segments.push({
        label: seg.cat.label,
        minutes: mins,
        color: seg.cat.color,
        textColor: seg.cat.textColor,
        icon: seg.cat.icon,
      });
    }
  } else if (cookTimeMinutes > 0) {
    segments.push({
      label: "Cook",
      minutes: cookTimeMinutes,
      color: "#FED7AA",
      textColor: "#9A3412",
      icon: "🍴",
    });
  }

  return segments;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
interface Props {
  prepTimeMinutes: number;
  cookTimeMinutes: number;
  instructions: string[];
}

export function TimeBreakdownBar({ prepTimeMinutes, cookTimeMinutes, instructions }: Props) {
  const [hovered, setHovered] = useState<number | null>(null);
  const segments = buildTimeSegments(instructions, prepTimeMinutes, cookTimeMinutes);
  const totalMins = segments.reduce((a, b) => a + b.minutes, 0);

  if (totalMins === 0 || segments.length === 0) return null;

  const formatTime = (mins: number) => {
    if (mins < 60) return `${Math.round(mins)}m`;
    const h = Math.floor(mins / 60);
    const m = Math.round(mins % 60);
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
  };

  return (
    <div className="mb-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4" style={{ color: "#C85A2F" }} />
          <span className="text-sm font-semibold" style={{ color: "#3D2817" }}>
            {formatTime(totalMins)} total
          </span>
        </div>
        {hovered !== null && (
          <div className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full transition-all"
            style={{ background: segments[hovered].color, color: segments[hovered].textColor }}>
            <span>{segments[hovered].icon}</span>
            <span className="font-semibold">{segments[hovered].label}</span>
            <span>· {formatTime(segments[hovered].minutes)}</span>
          </div>
        )}
      </div>

      {/* Bar */}
      <div className="flex rounded-full overflow-hidden h-5 gap-px" style={{ background: "#F5E6D3" }}>
        {segments.map((seg, i) => {
          const pct = (seg.minutes / totalMins) * 100;
          const isHovered = hovered === i;
          return (
            <div
              key={i}
              style={{
                width: `${pct}%`,
                background: seg.color,
                transform: isHovered ? "scaleY(1.15)" : "scaleY(1)",
                transformOrigin: "center",
                transition: "transform 0.15s ease, filter 0.15s ease",
                filter: isHovered ? "brightness(0.9)" : "none",
                minWidth: pct < 3 ? 4 : undefined,
                cursor: "pointer",
              }}
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
            />
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-3">
        {segments.map((seg, i) => (
          <div
            key={i}
            className="flex items-center gap-1.5 cursor-default"
            onMouseEnter={() => setHovered(i)}
            onMouseLeave={() => setHovered(null)}
          >
            <div
              className="w-2.5 h-2.5 rounded-sm shrink-0"
              style={{ background: seg.color, outline: hovered === i ? `2px solid ${seg.textColor}` : "none" }}
            />
            <span className="text-xs" style={{ color: hovered === i ? seg.textColor : "#6B5B52", fontWeight: hovered === i ? 600 : 400 }}>
              {seg.icon} {seg.label}
            </span>
            <span className="text-xs" style={{ color: "#A69180" }}>{formatTime(seg.minutes)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
