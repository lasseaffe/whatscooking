# Cooking Mode Redesign + Kitchen Oracle Voice — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign the cooking mode step card with ghost illustrations, fixed layout anchors, and mobile-first typography, then add a voice interface that routes commands through the existing Kitchen Oracle AI.

**Architecture:** The visual redesign lives entirely inside `cooking-mode-screen.tsx` and `step-visualization.tsx` — no new components for the layout. The voice system is a new hook (`useKitchenOracleVoice`) and two new components (`VoicePromptSheet`, `VoiceResponseCard`) wired into the existing `CookingModeContext`. Kitchen Oracle Tier 2 voice queries hit the existing `/api/sos-tips` endpoint with an extended payload; a new `/api/voice-oracle` route is added for cleaner separation.

**Tech Stack:** React, TypeScript, Next.js App Router, Web Speech API (`SpeechRecognition` + `speechSynthesis`), existing Supabase/AI stack for Kitchen Oracle, Tailwind + inline styles (matching existing file conventions), `localStorage` for voice prompt dismissal.

---

## File Map

| File | Action |
|---|---|
| `src/components/step-visualization.tsx` | Modify — add 6 new SVG illustrations + background rendering mode |
| `src/lib/cooking-mode-context.tsx` | Modify — add `voiceEnabled`, `voiceState`, `toggleVoice` |
| `src/hooks/useKitchenOracleVoice.ts` | Create — STT loop, Tier 1 command routing, Tier 2 Oracle dispatch, TTS |
| `src/components/voice-prompt-sheet.tsx` | Create — entry bottom sheet with don't-ask-again |
| `src/components/voice-response-card.tsx` | Create — waveform + Oracle answer card rendered inside step area |
| `src/app/api/voice-oracle/route.ts` | Create — POST endpoint for Tier 2 voice queries |
| `src/app/(app)/recipes/[id]/cooking-mode-screen.tsx` | Modify — new top bar, layout anchors, typography, scrim, illustration bg, voice wiring |

---

## Task 1: Background illustration mode in `step-visualization.tsx`

The existing `StepVisualization` renders a framed card with a border. We need a second render mode — `"background"` — that returns a plain `<svg>` element (no wrapper div) sized to fill its container, for use as a CSS-positioned background element.

**Files:**
- Modify: `src/components/step-visualization.tsx`

- [ ] **Step 1: Add `mode` prop to `StepVisualizationProps`**

In `src/components/step-visualization.tsx`, update the interface and the public component:

```tsx
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
```

- [ ] **Step 2: Verify existing usage still works**

Open `cooking-mode-screen.tsx` and confirm `<StepVisualization stepText={enrichedText} />` (no `mode` prop) still renders the card as before — the default `"card"` mode is unchanged.

- [ ] **Step 3: Commit**

```bash
git add src/components/step-visualization.tsx
git commit -m "feat(cooking): add background mode to StepVisualization"
```

---

## Task 2: Six new SVG illustrations in `step-visualization.tsx`

Add the six new keyword groups from the spec. Each is a self-contained SVG function + registry entry.

**Files:**
- Modify: `src/components/step-visualization.tsx`

- [ ] **Step 1: Add `SpiceBowlSVG` function** (before the VISUALIZATIONS array)

```tsx
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
```

- [ ] **Step 2: Add `CoveredPotSVG` function**

```tsx
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
```

- [ ] **Step 3: Add `PlatedDishSVG` function**

```tsx
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
```

- [ ] **Step 4: Add `DicedOnionSVG` function**

```tsx
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
```

- [ ] **Step 5: Add `SoftVegSVG` function** (sauté/soften/sweat)

```tsx
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
```

- [ ] **Step 6: Add `EggsInSauceSVG` function**

```tsx
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
```

- [ ] **Step 7: Register all six new SVGs in the VISUALIZATIONS array**

Add these entries to the `VISUALIZATIONS` array in `step-visualization.tsx`, before the closing `];`:

```tsx
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
```

Note: `sauté`/`saute` already triggers `SearSVG` via the existing registry — leave that entry as-is.

- [ ] **Step 8: Commit**

```bash
git add src/components/step-visualization.tsx
git commit -m "feat(cooking): add 6 new step illustrations (spice, pot, plate, onion, veg, eggs)"
```

---

## Task 3: Voice state in `CookingModeContext`

**Files:**
- Modify: `src/lib/cooking-mode-context.tsx`

- [ ] **Step 1: Extend the context interface and provider**

Replace the contents of `src/lib/cooking-mode-context.tsx` with:

```tsx
"use client";

import { createContext, useContext, useState, useRef, useCallback, useEffect } from "react";

export type VoiceState = "idle" | "listening" | "speaking";

interface CookingModeContextValue {
  active: boolean;
  activate: () => Promise<void>;
  deactivate: () => void;
  currentStepText: string;
  setCurrentStepText: (text: string) => void;
  voiceEnabled: boolean;
  voiceState: VoiceState;
  setVoiceState: (s: VoiceState) => void;
  toggleVoice: () => void;
}

const CookingModeContext = createContext<CookingModeContextValue>({
  active: false,
  activate: async () => {},
  deactivate: () => {},
  currentStepText: "",
  setCurrentStepText: () => {},
  voiceEnabled: false,
  voiceState: "idle",
  setVoiceState: () => {},
  toggleVoice: () => {},
});

export function CookingModeProvider({ children }: { children: React.ReactNode }) {
  const [active, setActive] = useState(false);
  const [currentStepText, setCurrentStepText] = useState("");
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [voiceState, setVoiceState] = useState<VoiceState>("idle");
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);

  const activate = useCallback(async () => {
    setActive(true);
    try {
      if (typeof navigator !== "undefined" && "wakeLock" in navigator) {
        wakeLockRef.current = await (navigator as Navigator & {
          wakeLock: { request: (type: string) => Promise<WakeLockSentinel> };
        }).wakeLock.request("screen");
      }
    } catch {
      // Wake lock not supported or denied — continue without it
    }
  }, []);

  const deactivate = useCallback(() => {
    setActive(false);
    setVoiceEnabled(false);
    setVoiceState("idle");
    if (wakeLockRef.current) {
      wakeLockRef.current.release().catch(() => {});
      wakeLockRef.current = null;
    }
  }, []);

  const toggleVoice = useCallback(() => {
    setVoiceEnabled((prev) => {
      if (prev) setVoiceState("idle");
      return !prev;
    });
  }, []);

  useEffect(() => {
    if (!active) return;
    function handleVisibilityChange() {
      if (document.visibilityState === "visible") activate();
    }
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [active, activate]);

  useEffect(() => {
    return () => {
      if (wakeLockRef.current) wakeLockRef.current.release().catch(() => {});
    };
  }, []);

  return (
    <CookingModeContext.Provider
      value={{ active, activate, deactivate, currentStepText, setCurrentStepText, voiceEnabled, voiceState, setVoiceState, toggleVoice }}
    >
      {children}
    </CookingModeContext.Provider>
  );
}

export function useCookingMode() {
  return useContext(CookingModeContext);
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd C:\Users\lasse\Desktop\whatscooking && npx tsc --noEmit 2>&1 | head -20
```

Expected: no errors referencing `cooking-mode-context.tsx`.

- [ ] **Step 3: Commit**

```bash
git add src/lib/cooking-mode-context.tsx
git commit -m "feat(voice): add voiceEnabled/voiceState/toggleVoice to CookingModeContext"
```

---

## Task 4: `/api/voice-oracle` endpoint

A thin POST endpoint that takes a voice query + step context and returns a Kitchen Oracle response.

**Files:**
- Create: `src/app/api/voice-oracle/route.ts`

- [ ] **Step 1: Check how the existing `/api/sos-tips` calls the AI**

```bash
head -60 "C:\Users\lasse\Desktop\whatscooking\src\app\api\sos-tips\route.ts"
```

Note the import path for the AI client and the model used — use the same.

- [ ] **Step 2: Create the route**

Create `src/app/api/voice-oracle/route.ts`:

```ts
import { NextRequest, NextResponse } from "next/server";
// Use the same AI import pattern as /api/sos-tips — adjust the import below to match
import Anthropic from "@anthropic-ai/sdk";

export const dynamic = "force-dynamic";

interface VoiceOracleRequest {
  query: string;
  recipeName: string;
  stepIndex: number;
  stepText: string;
  ingredients: Array<{ name: string; amount?: number | null; unit?: string | null }>;
}

export async function POST(req: NextRequest) {
  const body = (await req.json()) as VoiceOracleRequest;
  const { query, recipeName, stepIndex, stepText, ingredients } = body;

  if (!query?.trim()) {
    return NextResponse.json({ answer: "" }, { status: 400 });
  }

  const ingredientList = ingredients
    .map((i) => `${i.amount ?? ""} ${i.unit ?? ""} ${i.name}`.trim())
    .join(", ");

  const systemPrompt = `You are the Kitchen Oracle, a friendly and knowledgeable cooking assistant embedded in a recipe app. The user is actively cooking and has spoken a voice command. Give a concise, practical answer in 1-2 sentences maximum — it will be read aloud by text-to-speech. Never use bullet points, headers, or markdown. Speak directly and confidently.

Current recipe: ${recipeName}
Current step (${stepIndex + 1}): ${stepText}
Ingredients: ${ingredientList}`;

  try {
    const client = new Anthropic();
    const message = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 150,
      system: systemPrompt,
      messages: [{ role: "user", content: query }],
    });

    const answer = message.content
      .filter((b) => b.type === "text")
      .map((b) => (b as { type: "text"; text: string }).text)
      .join(" ")
      .trim();

    return NextResponse.json({ answer });
  } catch {
    return NextResponse.json({ answer: "Sorry, I couldn't reach the Kitchen Oracle right now." }, { status: 200 });
  }
}
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
cd C:\Users\lasse\Desktop\whatscooking && npx tsc --noEmit 2>&1 | head -20
```

- [ ] **Step 4: Commit**

```bash
git add src/app/api/voice-oracle/route.ts
git commit -m "feat(voice): add /api/voice-oracle endpoint for Kitchen Oracle voice queries"
```

---

## Task 5: `useKitchenOracleVoice` hook

The core voice logic — STT loop, Tier 1 command dispatch, Tier 2 Oracle calls, TTS.

**Files:**
- Create: `src/hooks/useKitchenOracleVoice.ts`

- [ ] **Step 1: Create the hook**

Create `src/hooks/useKitchenOracleVoice.ts`:

```ts
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { VoiceState } from "@/lib/cooking-mode-context";
import type { Ingredient } from "@/app/(app)/recipes/[id]/cooking-mode-screen";

export type OracleCardType = "listening" | "answer" | "recovery" | null;

export interface OracleCard {
  type: OracleCardType;
  text?: string;
}

interface UseKitchenOracleVoiceOptions {
  voiceEnabled: boolean;
  setVoiceState: (s: VoiceState) => void;
  stepText: string;
  stepIndex: number;
  recipeName: string;
  ingredients: Ingredient[];
  onNext: () => void;
  onPrev: () => void;
  onStartTimer: () => void;
}

// Tier 1 — local commands resolved without API call
const TIER1_NEXT = ["next", "next step", "continue", "go on", "forward"];
const TIER1_PREV = ["go back", "previous", "back", "last step"];
const TIER1_REPEAT = ["repeat that", "read again", "say again", "repeat"];
const TIER1_READ = ["read the step", "read step", "what's the step", "what is the step"];
const TIER1_TIMER = ["start timer", "start the timer", "begin timer"];
const TIER1_STOP = ["stop", "stop listening", "turn off voice", "disable voice", "quiet"];

function matchesTier1(transcript: string, phrases: string[]): boolean {
  const t = transcript.toLowerCase().trim();
  return phrases.some((p) => t === p || t.startsWith(p));
}

function extractIngredientQuery(transcript: string): string | null {
  const m = transcript.toLowerCase().match(/how much (.+)/);
  return m ? m[1].trim() : null;
}

function isTier2(transcript: string): boolean {
  const t = transcript.toLowerCase();
  return (
    t.startsWith("i added too much") ||
    t.startsWith("i put too much") ||
    t.startsWith("what does") ||
    t.startsWith("can i substitute") ||
    t.startsWith("what if i don") ||
    t.startsWith("what if i don't") ||
    t.startsWith("how do i") ||
    t.includes("instead of") ||
    t.includes("substitute")
  );
}

export function useKitchenOracleVoice({
  voiceEnabled,
  setVoiceState,
  stepText,
  stepIndex,
  recipeName,
  ingredients,
  onNext,
  onPrev,
  onStartTimer,
}: UseKitchenOracleVoiceOptions) {
  const [oracleCard, setOracleCard] = useState<OracleCard>({ type: null });
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const cardTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const synthRef = useRef(typeof window !== "undefined" ? window.speechSynthesis : null);

  // Check browser support once
  const sttSupported =
    typeof window !== "undefined" &&
    !!(window.SpeechRecognition || (window as typeof window & { webkitSpeechRecognition?: unknown }).webkitSpeechRecognition);

  const speak = useCallback((text: string) => {
    if (!synthRef.current) return;
    synthRef.current.cancel();
    const utt = new SpeechSynthesisUtterance(text);
    utt.rate = 0.95;
    utt.onstart = () => setVoiceState("speaking");
    utt.onend = () => setVoiceState("listening");
    utt.onerror = () => setVoiceState("listening");
    synthRef.current.speak(utt);
  }, [setVoiceState]);

  const cancelSpeech = useCallback(() => {
    synthRef.current?.cancel();
  }, []);

  const showCard = useCallback((card: OracleCard, autoDismissMs = 8000) => {
    setOracleCard(card);
    if (cardTimeoutRef.current) clearTimeout(cardTimeoutRef.current);
    if (autoDismissMs > 0) {
      cardTimeoutRef.current = setTimeout(() => setOracleCard({ type: null }), autoDismissMs);
    }
  }, []);

  const callOracle = useCallback(async (query: string) => {
    showCard({ type: "answer", text: "…" }, 0);
    try {
      const res = await fetch("/api/voice-oracle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, recipeName, stepIndex, stepText, ingredients }),
      });
      const { answer } = await res.json() as { answer: string };
      const isRecovery =
        query.toLowerCase().startsWith("i added too much") ||
        query.toLowerCase().startsWith("i put too much");
      showCard({ type: isRecovery ? "recovery" : "answer", text: answer });
      speak(answer);
    } catch {
      showCard({ type: "answer", text: "I couldn't reach the Kitchen Oracle right now." });
    }
  }, [recipeName, stepIndex, stepText, ingredients, showCard, speak]);

  const handleTranscript = useCallback((transcript: string) => {
    cancelSpeech();

    if (matchesTier1(transcript, TIER1_STOP)) {
      setVoiceState("idle");
      showCard({ type: null });
      return;
    }
    if (matchesTier1(transcript, TIER1_NEXT)) {
      speak("Next step.");
      onNext();
      return;
    }
    if (matchesTier1(transcript, TIER1_PREV)) {
      speak("Going back.");
      onPrev();
      return;
    }
    if (matchesTier1(transcript, TIER1_REPEAT) || matchesTier1(transcript, TIER1_READ)) {
      speak(stepText);
      return;
    }
    if (matchesTier1(transcript, TIER1_TIMER)) {
      speak("Starting timer.");
      onStartTimer();
      return;
    }

    const ingQuery = extractIngredientQuery(transcript);
    if (ingQuery) {
      const found = ingredients.find((i) => i.name.toLowerCase().includes(ingQuery));
      if (found) {
        const qty = `${found.amount ?? ""} ${found.unit ?? ""}`.trim();
        const answer = qty ? `${qty} of ${found.name}.` : `${found.name} — check the recipe for the exact amount.`;
        showCard({ type: "answer", text: answer });
        speak(answer);
        return;
      }
    }

    if (isTier2(transcript)) {
      callOracle(transcript);
      return;
    }

    // Default: send anything unrecognised to Oracle
    callOracle(transcript);
  }, [cancelSpeech, setVoiceState, showCard, speak, onNext, onPrev, onStartTimer, stepText, ingredients, callOracle]);

  // STT setup and teardown
  useEffect(() => {
    if (!voiceEnabled || !sttSupported) return;

    const SR =
      window.SpeechRecognition ||
      (window as typeof window & { webkitSpeechRecognition: typeof SpeechRecognition }).webkitSpeechRecognition;

    const rec = new SR();
    rec.continuous = true;
    rec.interimResults = false;
    rec.lang = "en-US";

    rec.onresult = (event: SpeechRecognitionEvent) => {
      const transcript = Array.from(event.results)
        .slice(event.resultIndex)
        .filter((r) => r.isFinal)
        .map((r) => r[0].transcript)
        .join(" ")
        .trim();
      if (transcript) handleTranscript(transcript);
    };

    rec.onerror = () => { /* ignore — continuous mode auto-recovers */ };
    rec.onend = () => {
      // Restart if voice is still enabled (continuous mode ended unexpectedly)
      if (voiceEnabled) {
        try { rec.start(); } catch { /* already started */ }
      }
    };

    rec.start();
    setVoiceState("listening");
    showCard({ type: "listening" }, 0);

    // Read the current step aloud when voice mode activates
    speak(stepText);

    recognitionRef.current = rec;

    return () => {
      rec.onend = null;
      rec.stop();
      recognitionRef.current = null;
      cancelSpeech();
      setVoiceState("idle");
      showCard({ type: null });
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [voiceEnabled]);

  // Read new step aloud when step changes while voice is enabled
  useEffect(() => {
    if (!voiceEnabled) return;
    speak(stepText);
    showCard({ type: "listening" }, 0);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stepIndex]);

  return { oracleCard, sttSupported, cancelSpeech };
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd C:\Users\lasse\Desktop\whatscooking && npx tsc --noEmit 2>&1 | head -30
```

Expected: no errors in `useKitchenOracleVoice.ts`.

- [ ] **Step 3: Commit**

```bash
git add src/hooks/useKitchenOracleVoice.ts
git commit -m "feat(voice): add useKitchenOracleVoice hook with Tier 1/2 command routing"
```

---

## Task 6: `VoicePromptSheet` component

**Files:**
- Create: `src/components/voice-prompt-sheet.tsx`

- [ ] **Step 1: Create the component**

Create `src/components/voice-prompt-sheet.tsx`:

```tsx
"use client";

const DISMISSED_KEY = "wc_voice_prompt_dismissed";

interface VoicePromptSheetProps {
  onEnable: () => void;
  onDismiss: () => void;
}

export function VoicePromptSheet({ onEnable, onDismiss }: VoicePromptSheetProps) {
  function handleDontAsk() {
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(DISMISSED_KEY, "1");
    }
    onDismiss();
  }

  return (
    <div
      className="fixed inset-0 z-[200] flex items-end"
      style={{ background: "rgba(13,13,12,0.7)", backdropFilter: "blur(4px)" }}
    >
      <div
        className="w-full rounded-t-2xl p-6 pb-8 flex flex-col gap-4"
        style={{ background: "#2C2724" }}
      >
        {/* Handle */}
        <div className="w-8 h-1 rounded-full mx-auto" style={{ background: "rgba(176,125,86,0.3)" }} />

        <div>
          <h2
            className="text-xl font-bold mb-1"
            style={{ fontFamily: "'Fraunces', Georgia, serif", color: "#EFE3CE" }}
          >
            Cook hands-free?
          </h2>
          <p className="text-sm leading-relaxed" style={{ color: "#a09080" }}>
            The Kitchen Oracle will read each step aloud and listen for your commands — next, go back, how much, and more.
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={onEnable}
            className="w-full h-12 rounded-xl text-sm font-semibold flex items-center justify-center gap-2"
            style={{ background: "#F4A261", color: "#1a0f08" }}
          >
            🎙 Yes, enable voice
          </button>
          <button
            type="button"
            onClick={onDismiss}
            className="w-full h-10 rounded-xl text-sm font-semibold"
            style={{ background: "rgba(176,125,86,0.12)", color: "#B07D56" }}
          >
            Not right now
          </button>
          <button
            type="button"
            onClick={handleDontAsk}
            className="text-xs text-center mt-1"
            style={{ color: "#B07D56", opacity: 0.5 }}
          >
            Don&apos;t ask me again
          </button>
        </div>
      </div>
    </div>
  );
}

export function shouldShowVoicePrompt(): boolean {
  if (typeof localStorage === "undefined") return false;
  return localStorage.getItem(DISMISSED_KEY) !== "1";
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/voice-prompt-sheet.tsx
git commit -m "feat(voice): add VoicePromptSheet component with don't-ask-again logic"
```

---

## Task 7: `VoiceResponseCard` component

The inline card that shows inside the step area — waveform when listening, answer when Oracle responds.

**Files:**
- Create: `src/components/voice-response-card.tsx`

- [ ] **Step 1: Create the component**

Create `src/components/voice-response-card.tsx`:

```tsx
"use client";

import type { OracleCard } from "@/hooks/useKitchenOracleVoice";

interface VoiceResponseCardProps {
  card: OracleCard;
}

export function VoiceResponseCard({ card }: VoiceResponseCardProps) {
  if (!card.type) return null;

  if (card.type === "listening") {
    return (
      <div
        className="mt-4 rounded-xl px-3 py-3 flex items-center gap-3"
        style={{
          background: "rgba(244,162,97,0.08)",
          border: "1px solid rgba(244,162,97,0.25)",
        }}
      >
        <span className="text-xs font-semibold" style={{ color: "#F4A261", opacity: 0.7 }}>
          Listening…
        </span>
        <Waveform />
      </div>
    );
  }

  const isRecovery = card.type === "recovery";

  return (
    <div
      className="mt-4 rounded-xl px-3 py-3 flex items-start gap-2 text-sm leading-relaxed"
      style={{
        background: isRecovery ? "rgba(232,93,32,0.08)" : "rgba(176,125,86,0.12)",
        border: `1px solid ${isRecovery ? "rgba(232,93,32,0.2)" : "rgba(176,125,86,0.22)"}`,
        color: isRecovery ? "#e8a080" : "#d4aa80",
        fontFamily: "'Plus Jakarta Sans', sans-serif",
        fontSize: 13,
        fontWeight: 500,
      }}
    >
      <span style={{ flexShrink: 0, marginTop: 1 }}>{isRecovery ? "⚑" : "✦"}</span>
      <span>{card.text}</span>
    </div>
  );
}

function Waveform() {
  return (
    <div className="flex items-center gap-[3px]" style={{ height: 16 }}>
      {[6, 12, 16, 10, 14, 8].map((h, i) => (
        <div
          key={i}
          style={{
            width: 3,
            height: h,
            background: "#F4A261",
            borderRadius: 2,
            animation: `waveBar 0.8s ease-in-out ${i * 0.1}s infinite`,
          }}
        />
      ))}
      <style>{`
        @keyframes waveBar {
          0%, 100% { transform: scaleY(0.5); opacity: 0.6; }
          50% { transform: scaleY(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/voice-response-card.tsx
git commit -m "feat(voice): add VoiceResponseCard component (waveform + oracle answer)"
```

---

## Task 8: Redesign `cooking-mode-screen.tsx` — mobile top bar + layout anchors + typography

This is the biggest task. We replace the mobile top bar, rewrite the step content area layout, and update all typography. Desktop 3-column layout is unchanged in this task.

**Files:**
- Modify: `src/app/(app)/recipes/[id]/cooking-mode-screen.tsx`

- [ ] **Step 1: Add new imports at the top of the file**

Add these imports alongside the existing ones:

```tsx
import { useCookingMode } from "@/lib/cooking-mode-context";
import { useKitchenOracleVoice } from "@/hooks/useKitchenOracleVoice";
import { VoicePromptSheet, shouldShowVoicePrompt } from "@/components/voice-prompt-sheet";
import { VoiceResponseCard } from "@/components/voice-response-card";
```

- [ ] **Step 2: Add voice state inside `CookingModeScreen`**

Inside the `CookingModeScreen` function body, after the existing `useState` declarations, add:

```tsx
const { voiceEnabled, voiceState, setVoiceState, toggleVoice } = useCookingMode();
const [showVoicePrompt, setShowVoicePrompt] = useState(false);
const [voicePromptChecked, setVoicePromptChecked] = useState(false);
```

- [ ] **Step 3: Add effect to show voice prompt on first mount**

Add this effect after the existing effects in `CookingModeScreen`:

```tsx
useEffect(() => {
  if (voicePromptChecked) return;
  setVoicePromptChecked(true);
  if (sttSupported && shouldShowVoicePrompt()) {
    setShowVoicePrompt(true);
  }
}, [voicePromptChecked, sttSupported]);
```

Note: `sttSupported` comes from the hook wired in Step 4.

- [ ] **Step 4: Wire up `useKitchenOracleVoice` hook**

Add this call inside `CookingModeScreen`, after the `heading`/`body` declarations:

```tsx
const { oracleCard, sttSupported, cancelSpeech } = useKitchenOracleVoice({
  voiceEnabled,
  setVoiceState,
  stepText: enrichedText,
  stepIndex: step,
  recipeName: recipeTitle,
  ingredients: ingredients ?? [],
  onNext: next,
  onPrev: prev,
  onStartTimer: addTimer,
});
```

- [ ] **Step 5: Cancel speech on manual navigation**

Update the `go` function:

```tsx
function go(i: number) {
  cancelSpeech();
  setStep(Math.max(0, Math.min(total - 1, i)));
  setDrawerOpen(false);
  setTooltip(null);
}
```

- [ ] **Step 6: Replace the mobile top bar**

Find and replace the existing mobile top bar (the `<div className="flex md:hidden ...">` block around line 917–935) with:

```tsx
{/* Mobile top bar — fixed, always visible */}
<div
  className="flex md:hidden items-center justify-between px-4 py-3 shrink-0"
  style={{
    background: "rgba(13,13,12,0.95)",
    backdropFilter: "blur(10px)",
    borderBottom: "1px solid rgba(176,125,86,0.12)",
  }}
>
  {/* Left: step counter */}
  <div>
    <div
      className="text-[10px] font-semibold uppercase tracking-[0.2em]"
      style={{ color: "#B07D56", lineHeight: 1 }}
    >
      Step {step + 1} of {total}
    </div>
    <div className="text-[11px] mt-0.5" style={{ color: "#EFE3CE", opacity: 0.4 }}>
      {recipeTitle.length > 22 ? recipeTitle.slice(0, 22) + "…" : recipeTitle}
    </div>
  </div>

  {/* Right: mic icon + exit */}
  <div className="flex items-center gap-2">
    {sttSupported && (
      <button
        type="button"
        onClick={() => { toggleVoice(); }}
        className="w-7 h-7 rounded-full flex items-center justify-center text-sm transition-all"
        style={{
          background:
            voiceEnabled && voiceState === "speaking"
              ? "rgba(176,125,86,0.18)"
              : voiceEnabled
              ? "rgba(244,162,97,0.18)"
              : "rgba(176,125,86,0.10)",
          color:
            voiceEnabled && voiceState === "speaking"
              ? "#d4aa80"
              : voiceEnabled
              ? "#F4A261"
              : "#B07D56",
          opacity: voiceEnabled ? 1 : 0.6,
          boxShadow:
            voiceEnabled
              ? "0 0 0 0 rgba(244,162,97,0.3)"
              : "none",
          animation: voiceEnabled ? "micPulse 1.5s ease-in-out infinite" : "none",
        }}
        aria-label={voiceEnabled ? "Disable voice mode" : "Enable voice mode"}
      >
        {voiceEnabled && voiceState === "speaking" ? "🔊" : "🎙"}
      </button>
    )}
    <button
      type="button"
      onClick={onExit}
      className="w-7 h-7 rounded-full flex items-center justify-center text-sm"
      style={{ background: "rgba(176,125,86,0.12)", color: "#B07D56" }}
      aria-label="Exit cooking mode"
    >
      <X style={{ width: 13, height: 13 }} />
    </button>
  </div>
</div>

{/* Mic pulse animation */}
<style>{`
  @keyframes micPulse {
    0%, 100% { box-shadow: 0 0 0 0 rgba(244,162,97,0.3); }
    50% { box-shadow: 0 0 0 8px rgba(244,162,97,0); }
  }
`}</style>
```

- [ ] **Step 7: Replace the step content area — illustration bg + layout anchors + typography**

Find the step content area — the `<div className="flex-1 overflow-y-auto px-8 ...">` block (around line 938). Replace it with:

```tsx
{/* Step content — illustration bg + flex-end anchor */}
<div
  className="flex-1 relative overflow-hidden"
  style={{ display: "flex", flexDirection: "column", justifyContent: "flex-end" }}
>
  {/* Ghost illustration — centred in background */}
  <div
    className="absolute inset-0 flex items-center justify-center pointer-events-none"
    aria-hidden="true"
    style={{
      opacity: paletteIsLight ? 0.5 : 0.35,
    }}
  >
    <StepVisualization stepText={enrichedText} mode="background" />
  </div>

  {/* Gradient scrim — rises from bottom, keeps text readable */}
  <div
    className="absolute inset-0 pointer-events-none"
    style={{
      background: paletteIsLight
        ? "linear-gradient(to top, #FDFAF6 55%, rgba(253,250,246,0.65) 82%, transparent 100%)"
        : "linear-gradient(to top, #1F1B19 50%, rgba(31,27,25,0.65) 82%, transparent 100%)",
    }}
    aria-hidden="true"
  />

  {/* Text content — sits above scrim */}
  <div
    className="relative z-10 px-5 pb-5 max-w-2xl mx-auto w-full"
    style={{ paddingTop: 140 }}
  >
    {/* Step counter + duration */}
    <div
      className="text-[10px] font-semibold uppercase mb-1"
      style={{ color: "#B07D56", letterSpacing: "0.2em", fontFamily: "'Plus Jakarta Sans', sans-serif" }}
    >
      Step {step + 1} of {total}
    </div>
    <div
      className="text-xs mb-3"
      style={{
        color: "#F4A261",
        opacity: 0.8,
        fontFamily: "'Geist Mono', monospace",
      }}
    >
      {parseStepDuration(enrichedText)}
    </div>

    {/* Heading */}
    <h1
      className="mb-4 leading-tight"
      style={{
        fontFamily: "'Fraunces', Georgia, serif",
        fontSize: "clamp(1.4rem, 5vw, 1.75rem)",
        fontWeight: 700,
        color: paletteIsLight ? "#1a0f08" : "#EFE3CE",
      }}
    >
      <AnnotatedText text={heading} onGlossaryClick={handleGlossaryClick} />
    </h1>

    {/* Body */}
    {(enrichedBodies[step] || body) && (
      <p
        className="mb-4 leading-relaxed"
        style={{
          fontFamily: "'Plus Jakarta Sans', sans-serif",
          fontSize: "clamp(1rem, 4vw, 1.0625rem)",
          color: paletteIsLight ? "#4a3224" : "#b0a090",
          lineHeight: 1.75,
          opacity: bodyLoading ? 0.5 : 1,
          transition: "opacity 0.3s",
        }}
      >
        <AnnotatedText
          text={enrichedBodies[step] || body}
          onGlossaryClick={handleGlossaryClick}
        />
      </p>
    )}

    {/* Voice response card — replaces pro-tip when voice is active */}
    {voiceEnabled && oracleCard.type ? (
      <VoiceResponseCard card={oracleCard} />
    ) : proTip ? (
      <div
        className="flex items-start gap-2 px-3 py-3 rounded-xl text-sm leading-relaxed"
        style={{
          background: paletteIsLight ? "rgba(176,125,86,0.1)" : "rgba(244,162,97,0.08)",
          border: "1px solid rgba(244,162,97,0.18)",
        }}
      >
        <span style={{ color: "#F4A261", flexShrink: 0, fontSize: 13 }}>✦</span>
        <span style={{ color: paletteIsLight ? "#6b5444" : "#d4aa80", fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 13, fontWeight: 500 }}>
          {proTip}
        </span>
      </div>
    ) : null}

    {/* SOS helper — keep existing, below pro-tip */}
    <div className="mt-3">
      <SOSHelper
        key={step}
        stepIndex={step}
        stepText={enrichedText}
        recipeTitle={recipeTitle}
        ingredients={ingredients ?? []}
        prefetchedTip={prefetchedTips[step]}
        prefetchDone={prefetchDone}
      />
    </div>
  </div>
</div>
```

- [ ] **Step 8: Add `paletteIsLight` and `parseStepDuration` helpers**

Add these two helpers near the top of the file alongside the existing `stepHeading`/`stepBody` functions:

```tsx
// Detect light palette from CSS variable — WC sets --wc-floor on :root per palette
function getPaletteIsLight(): boolean {
  if (typeof window === "undefined") return false;
  const bg = getComputedStyle(document.documentElement).getPropertyValue("--wc-floor").trim();
  // Tactile Elegance (light) uses a near-white floor; all dark palettes are dark
  return bg.startsWith("#f") || bg.startsWith("rgb(2") || bg === "#fdfaf6" || bg === "#FDFAF6";
}

// Extract a human-readable duration string from step text ("~ N min" or "~ MM:SS")
function parseStepDuration(text: string): string {
  const minMatch = text.match(/(\d+)\s*(?:to\s*\d+\s*)?min(?:utes?)?/i);
  if (minMatch) return `~ ${minMatch[1]} min`;
  const secMatch = text.match(/(\d+)\s*seconds?/i);
  if (secMatch) return `~ ${secMatch[1]} sec`;
  const timeMatch = text.match(/(\d{1,2}):(\d{2})/);
  if (timeMatch) return `~ ${timeMatch[0]}`;
  return "";
}
```

Add `paletteIsLight` as a state inside `CookingModeScreen`:

```tsx
const [paletteIsLight, setPaletteIsLight] = useState(false);
useEffect(() => {
  setPaletteIsLight(getPaletteIsLight());
}, []);
```

- [ ] **Step 9: Replace the mobile bottom bar**

Find the existing mobile bottom nav/timer area and replace with a clean two-button bar:

```tsx
{/* Bottom bar — Prev / Next only */}
<div
  className="flex md:hidden items-center gap-3 px-4 py-3 shrink-0"
  style={{
    background: "rgba(13,13,12,0.95)",
    backdropFilter: "blur(8px)",
    borderTop: "1px solid rgba(176,125,86,0.12)",
  }}
>
  <button
    type="button"
    onClick={prev}
    disabled={step === 0}
    className="h-11 px-5 rounded-xl text-sm font-semibold flex items-center gap-1"
    style={{
      background: "rgba(176,125,86,0.12)",
      color: "#B07D56",
      opacity: step === 0 ? 0.3 : 1,
    }}
  >
    <ChevronLeft style={{ width: 16, height: 16 }} /> Back
  </button>
  <button
    type="button"
    onClick={step === total - 1 ? () => setDonePhase("pantry") : next}
    className="flex-1 h-11 rounded-xl text-sm font-semibold flex items-center justify-center gap-1"
    style={{ background: "#F4A261", color: "#1a0f08" }}
  >
    {step === total - 1 ? "Finish 🎉" : <>Next <ChevronRight style={{ width: 16, height: 16 }} /></>}
  </button>
</div>
```

- [ ] **Step 10: Add voice prompt sheet to the JSX return**

Inside the main return, immediately after the opening `<div className="fixed inset-0 ...">`, add:

```tsx
{showVoicePrompt && (
  <VoicePromptSheet
    onEnable={() => { setShowVoicePrompt(false); toggleVoice(); }}
    onDismiss={() => setShowVoicePrompt(false)}
  />
)}
```

- [ ] **Step 11: Verify TypeScript compiles**

```bash
cd C:\Users\lasse\Desktop\whatscooking && npx tsc --noEmit 2>&1 | head -40
```

Fix any type errors before committing.

- [ ] **Step 12: Commit**

```bash
git add src/app/(app)/recipes/[id]/cooking-mode-screen.tsx
git commit -m "feat(cooking): redesign step card — ghost illustration, layout anchors, new typography, voice wiring"
```

---

## Task 9: End-to-end verification

- [ ] **Step 1: Start the dev server**

```bash
cd C:\Users\lasse\Desktop\whatscooking && npm run dev
```

Open `http://localhost:3002` in Chrome (mobile viewport 375px via DevTools).

- [ ] **Step 2: Verify step layout**

Open any recipe → Enter cooking mode. Confirm:
- `STEP X OF X` is pinned in the top-right area of the top bar
- Heading appears at consistent vertical position (~40% down)
- Body text is readable without zooming at 375px width
- Progress bar is a thin 2px strip below the top bar

- [ ] **Step 3: Verify illustrations**

Navigate through a recipe containing steps with "dice the onion", "soften", "simmer", "plate". Confirm:
- Correct SVG appears centred behind text
- Dark mode: opacity ≈ 35% (ghostly, not dominant)
- Gradient scrim fades correctly — text is fully readable

- [ ] **Step 4: Verify light mode**

If the app has a palette switcher, switch to "Tactile Elegance". Confirm:
- Illustration is visibly stronger (~50%)
- Background and scrim use light colours (`#FDFAF6`)

- [ ] **Step 5: Verify voice prompt**

Enter cooking mode in Chrome (which supports STT). Confirm bottom sheet appears. Click "Not right now". Exit and re-enter cooking mode — sheet appears again. Now click "Don't ask me again". Exit and re-enter — sheet does NOT appear.

- [ ] **Step 6: Verify mic icon states**

With voice not yet triggered (or after dismissing prompt), tap the mic icon in the top bar. Confirm:
- Icon switches to lit saffron 🎙 state
- Waveform card appears in step area
- Tapping again returns to dimmed state

- [ ] **Step 7: Verify Tier 1 commands**

With voice active, say "next". Confirm step advances. Say "go back". Confirm step retreats. Say "how much [an ingredient from the recipe]". Confirm quantity is read aloud and shown in the response card.

- [ ] **Step 8: Verify Tier 2 command**

Say "I added too much salt". Confirm:
- Card shows loading state briefly
- Recovery answer appears with `⚑` icon and warm-warning colour
- TTS reads the answer

- [ ] **Step 9: Verify TTS cancels on manual nav**

While TTS is speaking, tap Next. Confirm speech stops immediately.

- [ ] **Step 10: Verify Firefox fallback**

Open in Firefox. Confirm mic icon is not visible in top bar, entry prompt does not appear, cooking mode works normally with text only.

- [ ] **Step 11: Final commit**

```bash
git add -A
git commit -m "feat(cooking): cooking mode redesign + Kitchen Oracle voice — complete"
```
