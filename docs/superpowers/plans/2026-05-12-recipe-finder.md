# Recipe Finder + Quick & Easy Carousel — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an Akinator-style "Help me decide" bottom-drawer wizard to the Discover feed that narrows 40k recipes to 20 personalised picks, and upgrade the Quick & Easy strip to a proper prev/next carousel.

**Architecture:** A new `POST /api/recipes/finder` route accepts wizard answers + free text, applies SQL hard-filters then JS scoring (vibe clusters, pantry match, dish hint) and returns 20 recipes. On the client, `FinderDrawer` runs the one-question-at-a-time wizard; on completion it closes and `FinderResultsSection` pins a carousel below the Quick & Easy strip inside `DiscoverFeedClient`. The Quick & Easy strip (`QuickEasySection`) is upgraded independently with `framer-motion` arrow/dot controls.

**Tech Stack:** Next.js App Router, TypeScript, Supabase (PostgREST), framer-motion, lucide-react, Jest (jsdom) for unit tests.

---

## File Map

| File | Action |
|---|---|
| `src/app/(app)/discover/quick-easy-section.tsx` | Modify — add carousel prev/next/dots |
| `src/lib/finder-parse.ts` | Create — free-text keyword parser |
| `src/lib/__tests__/finder-parse.test.ts` | Create — Jest unit tests |
| `src/app/api/recipes/finder/route.ts` | Create — POST endpoint |
| `src/components/finder-drawer.tsx` | Create — bottom-sheet wizard |
| `src/components/finder-results-section.tsx` | Create — pinned results carousel |
| `src/app/(app)/discover/discover-feed-client.tsx` | Modify — wire finder state + components |

> **Note:** `DiscoverFeedClient` (in `discover-feed-client.tsx`) is the real page component — the one rendered by `page.tsx`. `DiscoverClient` in `discover-client.tsx` is a separate component not used by this page; leave it untouched.

---

## Task 1: Quick & Easy Carousel

**Files:**
- Modify: `src/app/(app)/discover/quick-easy-section.tsx`

- [ ] **Step 1: Replace the file with the carousel version**

```tsx
// src/app/(app)/discover/quick-easy-section.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface QuickRecipe {
  id: string;
  title: string;
  image_url?: string | null;
  prep_time_minutes?: number | null;
  cook_time_minutes?: number | null;
}

interface Props {
  recipes: QuickRecipe[];
}

const CARD_WIDTH = 110;
const CARD_GAP = 12;
const CARD_STEP = CARD_WIDTH + CARD_GAP;
const VISIBLE = 4;

export function QuickEasySection({ recipes }: Props) {
  const [index, setIndex] = useState(0);

  if (recipes.length < 3) return null;

  const maxIndex = Math.max(0, recipes.length - VISIBLE);

  return (
    <div
      className="px-4 py-5"
      style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
    >
      <div className="flex items-center justify-between mb-3">
        <h2
          className="text-sm font-bold"
          style={{ color: "var(--wc-text, #EFE3CE)", fontFamily: "'Libre Baskerville', Georgia, serif" }}
        >
          ⚡ Quick &amp; Easy
        </h2>
        <div className="flex items-center gap-2">
          <span className="text-xs" style={{ color: "var(--fg-secondary, #8A6A4A)" }}>
            Under 20 min
          </span>
          {index > 0 && (
            <button
              onClick={() => setIndex((i) => Math.max(0, i - 1))}
              className="w-6 h-6 rounded-full flex items-center justify-center"
              style={{ background: "#C8522A", color: "#fff" }}
              aria-label="Previous"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
          )}
          {index < maxIndex && (
            <button
              onClick={() => setIndex((i) => Math.min(maxIndex, i + 1))}
              className="w-6 h-6 rounded-full flex items-center justify-center"
              style={{ background: "#C8522A", color: "#fff" }}
              aria-label="Next"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      <div className="overflow-hidden">
        <motion.div
          className="flex"
          style={{ gap: CARD_GAP, width: recipes.length * CARD_STEP }}
          animate={{ x: -(index * CARD_STEP) }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        >
          {recipes.map((r) => {
            const totalTime = (r.prep_time_minutes ?? 0) + (r.cook_time_minutes ?? 0);
            return (
              <Link
                key={r.id}
                href={`/recipes/${r.id}`}
                className="flex-shrink-0 rounded-xl overflow-hidden"
                style={{
                  width: CARD_WIDTH,
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.07)",
                }}
              >
                <div className="overflow-hidden" style={{ height: 72 }}>
                  {r.image_url ? (
                    <img src={r.image_url} alt={r.title} className="w-full h-full object-cover" />
                  ) : (
                    <div
                      className="w-full h-full flex items-center justify-center text-2xl"
                      style={{ background: "#2A1804" }}
                    >
                      🍽️
                    </div>
                  )}
                </div>
                <div className="p-1.5">
                  <p
                    className="text-xs font-semibold leading-tight line-clamp-2 mb-1"
                    style={{ color: "var(--wc-text, #EFE3CE)" }}
                  >
                    {r.title}
                  </p>
                  {totalTime > 0 && (
                    <span
                      className="text-xs font-semibold"
                      style={{ color: "var(--wc-accent-saffron, #F4A261)" }}
                    >
                      ⚡ {totalTime} min
                    </span>
                  )}
                </div>
              </Link>
            );
          })}
        </motion.div>
      </div>

      {recipes.length > VISIBLE && (
        <div className="flex justify-center gap-1.5 mt-3">
          {Array.from({ length: maxIndex + 1 }, (_, i) => (
            <button
              key={i}
              onClick={() => setIndex(i)}
              className="rounded-full transition-all"
              style={{
                width: i === index ? 20 : 6,
                height: 6,
                background: i === index ? "#C8522A" : "#3A2416",
              }}
              aria-label={`Go to slide ${i + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Verify it compiles**

```bash
cd C:/Users/lasse/Desktop/whatscooking
npx tsc --noEmit --project tsconfig.json 2>&1 | head -20
```

Expected: no errors relating to `quick-easy-section.tsx`.

- [ ] **Step 3: Commit**

```bash
git add src/app/\(app\)/discover/quick-easy-section.tsx
git commit -m "feat(discover): upgrade Quick & Easy to prev/next carousel"
```

---

## Task 2: Free-Text Parser Utility

**Files:**
- Create: `src/lib/finder-parse.ts`
- Create: `src/lib/__tests__/finder-parse.test.ts`

- [ ] **Step 1: Write the failing tests first**

```ts
// src/lib/__tests__/finder-parse.test.ts
import { parseFinderText } from "../finder-parse";

describe("parseFinderText", () => {
  it("detects quick time from 'quick meal'", () => {
    expect(parseFinderText("quick meal").maxMinutes).toBe(30);
  });

  it("detects ≤15 min from 'under 15 minutes'", () => {
    expect(parseFinderText("under 15 minutes").maxMinutes).toBe(15);
  });

  it("detects vegan dietary tag", () => {
    expect(parseFinderText("vegan pasta please").dietary).toContain("vegan");
  });

  it("detects gluten-free", () => {
    expect(parseFinderText("gluten free option").dietary).toContain("gluten-free");
  });

  it("detects spicy exclusion", () => {
    expect(parseFinderText("no spice please").excludeKeywords).toContain("spicy");
  });

  it("detects pantry mode from 'use what I've got'", () => {
    expect(parseFinderText("use what I've got").pantryMode).toBe("pantry");
  });

  it("detects dish hint 'pasta'", () => {
    expect(parseFinderText("I want pasta tonight").dishHint).toBe("pasta");
  });

  it("detects comfort vibe from 'cozy'", () => {
    expect(parseFinderText("something cozy and warm").vibe).toBe("comfort");
  });

  it("detects impress vibe from 'fancy'", () => {
    expect(parseFinderText("something fancy for guests").vibe).toBe("impress");
  });

  it("returns empty hints for empty string", () => {
    expect(parseFinderText("")).toEqual({});
  });

  it("does not mix up 'not spicy' with vibe detection", () => {
    const result = parseFinderText("quick vegan pasta not spicy");
    expect(result.maxMinutes).toBe(30);
    expect(result.dietary).toContain("vegan");
    expect(result.dishHint).toBe("pasta");
    expect(result.excludeKeywords).toContain("spicy");
  });
});
```

- [ ] **Step 2: Run tests — verify they fail**

```bash
cd C:/Users/lasse/Desktop/whatscooking
npx jest src/lib/__tests__/finder-parse.test.ts --no-coverage 2>&1 | tail -10
```

Expected: `Cannot find module '../finder-parse'`

- [ ] **Step 3: Create the implementation**

```ts
// src/lib/finder-parse.ts
export interface ParsedFinderHints {
  maxMinutes?: 15 | 30 | 60;
  dietary?: string[];
  excludeKeywords?: string[];
  dishHint?: string;
  pantryMode?: "pantry";
  vibe?: "lazy" | "date-night" | "fuel" | "comfort" | "clean" | "impress";
}

const DISH_HINTS = [
  "pasta", "curry", "soup", "salad", "steak", "pizza", "burger",
  "sushi", "risotto", "tacos", "ramen", "bowl", "stew", "sandwich",
];

export function parseFinderText(text: string): ParsedFinderHints {
  if (!text.trim()) return {};
  const t = text.toLowerCase();
  const hints: ParsedFinderHints = {};

  // Time
  if (/\b(15 min|under 15|super quick|5 min|10 min)\b/.test(t)) {
    hints.maxMinutes = 15;
  } else if (/\b(quick|fast|speedy|30 min|half.?hour)\b/.test(t)) {
    hints.maxMinutes = 30;
  } else if (/\b(60 min|1 hour|one hour)\b/.test(t)) {
    hints.maxMinutes = 60;
  }

  // Dietary
  const dietary: string[] = [];
  if (/\bvegan\b/.test(t)) dietary.push("vegan");
  if (/\bvegetarian\b/.test(t)) dietary.push("vegetarian");
  if (/\bgluten.?free\b/.test(t)) dietary.push("gluten-free");
  if (/\bdairy.?free\b/.test(t)) dietary.push("dairy-free");
  if (/\bhalal\b/.test(t)) dietary.push("halal");
  if (dietary.length > 0) hints.dietary = dietary;

  // Exclude keywords
  const exclude: string[] = [];
  if (/\b(no spice|not spicy|mild|no heat|no chilli|no chili|no pepper)\b/.test(t)) {
    exclude.push("spicy");
  }
  if (exclude.length > 0) hints.excludeKeywords = exclude;

  // Pantry mode
  if (/\b(use what|from the fridge|pantry|what i.?ve got|ingredients? i have|leftovers?)\b/.test(t)) {
    hints.pantryMode = "pantry";
  }

  // Vibe — evaluated in priority order; first match wins
  if (/\b(fancy|impress|dinner party|guests?|special occasion|showstopper)\b/.test(t)) {
    hints.vibe = "impress";
  } else if (/\b(date|romantic|nice dinner|intimate)\b/.test(t)) {
    hints.vibe = "date-night";
  } else if (/\b(comfort|cosy|cozy|warming|hearty)\b/.test(t)) {
    hints.vibe = "comfort";
  } else if (/\b(healthy|light|clean|fresh|lean)\b/.test(t)) {
    hints.vibe = "clean";
  } else if (/\b(fuel|energy|protein|post.?workout|power)\b/.test(t)) {
    hints.vibe = "fuel";
  } else if (/\b(lazy|easy|simple|effortless|couch)\b/.test(t)) {
    hints.vibe = "lazy";
  }

  // Dish hint — first match wins
  for (const dish of DISH_HINTS) {
    if (new RegExp(`\\b${dish}\\b`).test(t)) {
      hints.dishHint = dish;
      break;
    }
  }

  return hints;
}
```

- [ ] **Step 4: Run tests — verify they all pass**

```bash
npx jest src/lib/__tests__/finder-parse.test.ts --no-coverage 2>&1 | tail -10
```

Expected: `Tests: 11 passed, 11 total`

- [ ] **Step 5: Commit**

```bash
git add src/lib/finder-parse.ts src/lib/__tests__/finder-parse.test.ts
git commit -m "feat(finder): add free-text keyword parser with tests"
```

---

## Task 3: Finder API Route

**Files:**
- Create: `src/app/api/recipes/finder/route.ts`

- [ ] **Step 1: Create the route**

```ts
// src/app/api/recipes/finder/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type VibeKey = "lazy" | "date-night" | "fuel" | "comfort" | "clean" | "impress";

const VIBE_BOOST: Record<VibeKey, string[]> = {
  lazy:        ["dinner", "pasta", "soup", "casserole", "stew"],
  "date-night":["french", "italian", "seafood", "steak"],
  fuel:        ["breakfast", "snack", "salad", "sandwich", "bowl"],
  comfort:     ["soup", "pasta", "bake", "curry", "pie", "chowder"],
  clean:       ["salad", "vegan", "vegetarian", "bowl", "smoothie"],
  impress:     ["french", "seafood", "tart", "risotto"],
};

const VIBE_SUPPRESS: Record<string, string[]> = {
  lazy:        ["salad"],
  "date-night":["snack"],
  clean:       ["fried", "dessert"],
};

const VIBE_LABELS: Record<string, string> = {
  lazy:        "Lazy night in",
  "date-night":"Date night vibes",
  fuel:        "Quick fuel",
  comfort:     "Comfort food",
  clean:       "Clean eating",
  impress:     "Impress guests",
};

interface FinderBody {
  vibe?: VibeKey;
  maxMinutes?: number | null;
  dietary?: string[];
  pantryMode?: "pantry" | "shop" | "any";
  freeText?: string;
  excludeKeywords?: string[];
  dishHint?: string;
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const body: FinderBody = await req.json().catch(() => ({}));
  const { vibe, maxMinutes, dietary, pantryMode, excludeKeywords, dishHint } = body;

  // ── 1. Build SQL query ──────────────────────────────────────
  let query = supabase
    .from("recipes")
    .select(
      "id, title, description, image_url, cuisine_type, dish_types, dietary_tags, prep_time_minutes, cook_time_minutes"
    )
    .not("dish_types", "cs", '{"drink"}')
    .not("dish_types", "cs", '{"hack"}')
    .not("dish_types", "cs", '{"premium"}');

  // Dietary hard filter
  if (dietary?.length) {
    for (const d of dietary) {
      query = query.contains("dietary_tags", [d]);
    }
  }

  // Time proxy filter — JS pass below is the precise gate
  if (maxMinutes) {
    query = query.lte("prep_time_minutes", maxMinutes);
  }

  // Exclude keyword titles
  if (excludeKeywords?.length) {
    for (const kw of excludeKeywords) {
      query = query.not("title", "ilike", `%${kw}%`);
    }
  }

  const { data: candidates } = await query.limit(300);
  if (!candidates?.length) {
    return NextResponse.json({ results: [], profile: null });
  }

  // ── 2. JS-level precise time filter ─────────────────────────
  const pool = maxMinutes
    ? candidates.filter(
        (r) => (r.prep_time_minutes ?? 0) + (r.cook_time_minutes ?? 0) <= maxMinutes
      )
    : candidates;

  // ── 3. Pantry items (title-level match) ─────────────────────
  let pantryNames: string[] = [];
  if (pantryMode === "pantry" && user) {
    const { data: items } = await supabase
      .from("pantry_items")
      .select("name")
      .eq("user_id", user.id);
    pantryNames = (items ?? []).map((i: { name: string }) => i.name.toLowerCase());
  }

  // ── 4. Score candidates ─────────────────────────────────────
  const boosts = vibe ? (VIBE_BOOST[vibe] ?? []) : [];
  const suppresses = vibe ? (VIBE_SUPPRESS[vibe] ?? []) : [];

  type Candidate = (typeof pool)[number];
  const scored = pool.map((r: Candidate) => {
    let score = 0;

    for (const t of r.dish_types ?? []) {
      const tl = t.toLowerCase();
      if (boosts.some((b) => tl.includes(b))) score += 3;
      if (suppresses.some((s) => tl.includes(s))) score -= 2;
    }

    if (r.cuisine_type) {
      const cl = r.cuisine_type.toLowerCase();
      if (boosts.some((b) => cl.includes(b))) score += 2;
      if (suppresses.some((s) => cl.includes(s))) score -= 1;
    }

    if (dishHint) {
      if (r.title.toLowerCase().includes(dishHint)) score += 3;
      else if (r.description?.toLowerCase().includes(dishHint)) score += 1;
    }

    if (pantryNames.length > 0) {
      const titleLower = r.title.toLowerCase();
      const matches = pantryNames.filter((p) => titleLower.includes(p)).length;
      score += Math.min(matches * 2, 4);
    }

    if (r.image_url) score += 1;

    return { ...r, _score: score };
  });

  scored.sort((a, b) => b._score - a._score);

  // ── 5. Build result set: top-12 deterministic + 8 shuffled ──
  const top12 = scored.slice(0, 12);
  const restPool = [...scored.slice(12, 32)];
  for (let i = restPool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [restPool[i], restPool[j]] = [restPool[j], restPool[i]];
  }
  const results = [...top12, ...restPool.slice(0, 8)].map(
    ({ _score: _, ...r }) => r
  );

  return NextResponse.json({
    results,
    profile: {
      vibeLabel: vibe ? (VIBE_LABELS[vibe] ?? null) : null,
      timeLabel: maxMinutes ? `≤ ${maxMinutes} min` : null,
    },
  });
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit 2>&1 | grep "finder/route"
```

Expected: no output (no errors in that file).

- [ ] **Step 3: Smoke-test the endpoint manually**

Start the dev server (`npm run dev`) in a separate terminal, then:

```bash
curl -s -X POST http://localhost:3002/api/recipes/finder \
  -H "Content-Type: application/json" \
  -d '{"vibe":"comfort","maxMinutes":30}' | node -e "const d=require('fs').readFileSync('/dev/stdin','utf8'); const j=JSON.parse(d); console.log('results:', j.results?.length, 'profile:', JSON.stringify(j.profile))"
```

Expected: `results: 20 profile: {"vibeLabel":"Comfort food","timeLabel":"≤ 30 min"}` (or fewer if DB has <20 matching recipes).

- [ ] **Step 4: Commit**

```bash
git add src/app/api/recipes/finder/route.ts
git commit -m "feat(finder): add POST /api/recipes/finder endpoint"
```

---

## Task 4: FinderDrawer Component

**Files:**
- Create: `src/components/finder-drawer.tsx`

- [ ] **Step 1: Create the shared types file entry — add `FinderAnswers` and `FinderResult` exports to the component**

```tsx
// src/components/finder-drawer.tsx
"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronRight, Loader2 } from "lucide-react";
import { parseFinderText } from "@/lib/finder-parse";
import type { Recipe } from "@/lib/types";

export type FinderAnswers = {
  vibe?: string;
  maxMinutes?: 15 | 30 | 60 | null;
  dietary?: string;
  pantryMode?: "pantry" | "shop" | "any";
  freeText?: string;
};

export interface FinderResult {
  recipes: Recipe[];
  profile: { vibeLabel: string | null; timeLabel: string | null };
}

interface Props {
  onClose: () => void;
  onResults: (result: FinderResult, answers: FinderAnswers) => void;
  initial?: FinderAnswers;
}

type QuestionKey = "vibe" | "maxMinutes" | "dietary" | "pantryMode";

interface Option {
  value: string | number | null;
  label: string;
  emoji: string;
  desc?: string;
}

const QUESTIONS: Array<{ key: QuestionKey; question: string; options: Option[] }> = [
  {
    key: "vibe",
    question: "What's the vibe?",
    options: [
      { value: "lazy",        label: "Lazy night in",   emoji: "😴", desc: "easy, warming, no fuss" },
      { value: "date-night",  label: "Date night",      emoji: "🍷", desc: "Italian, French, seafood" },
      { value: "fuel",        label: "Quick fuel",      emoji: "⚡", desc: "fast, filling, energising" },
      { value: "comfort",     label: "Comfort food",    emoji: "😋", desc: "cosy, hearty, satisfying" },
      { value: "clean",       label: "Clean eating",    emoji: "🌿", desc: "fresh, light, nutritious" },
      { value: "impress",     label: "Impress guests",  emoji: "🤩", desc: "showstopper, special" },
    ],
  },
  {
    key: "maxMinutes",
    question: "How much time?",
    options: [
      { value: 15,   label: "Under 15 min", emoji: "⚡", desc: "eggs, toast, stir-fry" },
      { value: 30,   label: "30 minutes",   emoji: "🕐", desc: "curries, pasta, burgers" },
      { value: 60,   label: "An hour",      emoji: "🍖", desc: "roasts, risotto, bakes" },
      { value: null, label: "All day",      emoji: "🌅", desc: "slow braises, bread" },
    ],
  },
  {
    key: "dietary",
    question: "Any dietary needs?",
    options: [
      { value: "none",        label: "None",        emoji: "🍽️" },
      { value: "vegan",       label: "Vegan",       emoji: "🌱" },
      { value: "vegetarian",  label: "Vegetarian",  emoji: "🥦" },
      { value: "gluten-free", label: "Gluten-free", emoji: "🌾" },
      { value: "dairy-free",  label: "Dairy-free",  emoji: "🥛" },
      { value: "halal",       label: "Halal",       emoji: "☪️" },
    ],
  },
  {
    key: "pantryMode",
    question: "Use pantry items?",
    options: [
      { value: "pantry", label: "Yes please",     emoji: "🥬", desc: "prioritise what I have" },
      { value: "shop",   label: "I'll shop fresh", emoji: "🛒", desc: "any ingredients fine" },
      { value: "any",    label: "Surprise me",    emoji: "✨", desc: "whatever works best" },
    ],
  },
];

const ANSWER_LABELS: Record<string, string> = {
  lazy:         "😴 Lazy night",
  "date-night": "🍷 Date night",
  fuel:         "⚡ Quick fuel",
  comfort:      "😋 Comfort food",
  clean:        "🌿 Clean eating",
  impress:      "🤩 Impress guests",
  "15":         "⚡ ≤15 min",
  "30":         "🕐 ≤30 min",
  "60":         "🍖 ≤60 min",
  "null":       "🌅 All day",
  none:         "🍽️ No restrictions",
  vegan:        "🌱 Vegan",
  vegetarian:   "🥦 Vegetarian",
  "gluten-free":"🌾 Gluten-free",
  "dairy-free": "🥛 Dairy-free",
  halal:        "☪️ Halal",
  pantry:       "🥬 Using pantry",
  shop:         "🛒 Shopping fresh",
  any:          "✨ Surprise me",
};

export function FinderDrawer({ onClose, onResults, initial }: Props) {
  const [freeText, setFreeText] = useState(initial?.freeText ?? "");
  const [answers, setAnswers] = useState<FinderAnswers>(initial ?? {});
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Pre-fill wizard questions from parsed free text on open
  useEffect(() => {
    if (initial?.freeText) {
      const hints = parseFinderText(initial.freeText);
      setAnswers((prev) => ({
        ...prev,
        ...(hints.vibe && !prev.vibe ? { vibe: hints.vibe } : {}),
        ...(hints.maxMinutes != null && prev.maxMinutes == null
          ? { maxMinutes: hints.maxMinutes }
          : {}),
        ...(hints.dietary?.length && !prev.dietary
          ? { dietary: hints.dietary[0] }
          : {}),
        ...(hints.pantryMode && !prev.pantryMode
          ? { pantryMode: hints.pantryMode }
          : {}),
      }));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleAnswer(key: QuestionKey, value: string | number | null) {
    const newAnswers: FinderAnswers = {
      ...answers,
      [key]: value === "none" ? undefined : value,
    };
    setAnswers(newAnswers);

    if (step < QUESTIONS.length - 1) {
      setTimeout(() => setStep((s) => s + 1), 150);
    } else {
      void fireAPI(newAnswers);
    }
  }

  function clearAnswer(key: QuestionKey) {
    const newAnswers = { ...answers };
    delete newAnswers[key];
    setAnswers(newAnswers);
    setStep(QUESTIONS.findIndex((q) => q.key === key));
  }

  async function fireAPI(answersToSend: FinderAnswers) {
    setLoading(true);
    setError(null);

    const hints = parseFinderText(freeText);

    const body = {
      vibe: answersToSend.vibe ?? hints.vibe,
      maxMinutes:
        answersToSend.maxMinutes !== undefined
          ? answersToSend.maxMinutes
          : hints.maxMinutes,
      dietary:
        answersToSend.dietary && answersToSend.dietary !== "none"
          ? [
              answersToSend.dietary,
              ...(hints.dietary ?? []).filter((d) => d !== answersToSend.dietary),
            ]
          : (hints.dietary ?? []),
      pantryMode: answersToSend.pantryMode ?? hints.pantryMode ?? "any",
      freeText: freeText || undefined,
      excludeKeywords: hints.excludeKeywords,
      dishHint: hints.dishHint,
    };

    try {
      const res = await fetch("/api/recipes/finder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("Request failed");
      const data = await res.json();

      const fullAnswers: FinderAnswers = {
        ...answersToSend,
        freeText: freeText || undefined,
      };
      localStorage.setItem("wc-finder-answers", JSON.stringify(fullAnswers));

      onResults(
        { recipes: data.results as Recipe[], profile: data.profile },
        fullAnswers
      );
      onClose();
    } catch {
      setError("Something went wrong — try again.");
      setLoading(false);
    }
  }

  const answeredKeys = QUESTIONS.slice(0, step)
    .map((q) => q.key)
    .filter((k) => answers[k] !== undefined);

  const progress = step / QUESTIONS.length;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end"
      style={{ background: "rgba(0,0,0,0.7)" }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", stiffness: 400, damping: 40 }}
        className="w-full rounded-t-2xl"
        style={{
          background: "#140C06",
          border: "1px solid #3A2416",
          borderBottom: "none",
          maxHeight: "90vh",
          overflowY: "auto",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-8 h-1 rounded-full" style={{ background: "#3A2416" }} />
        </div>

        <div className="px-5 pb-10">
          {/* Close */}
          <div className="flex justify-end mb-1">
            <button onClick={onClose} style={{ color: "#6B4E36" }}>
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Free text — always pinned at top */}
          <div className="mb-5">
            <p className="text-xs font-semibold mb-2" style={{ color: "#8A6A4A" }}>
              What are you in the mood for?
            </p>
            <input
              autoFocus
              type="text"
              value={freeText}
              onChange={(e) => setFreeText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && freeText.trim()) void fireAPI(answers);
              }}
              placeholder="quick vegan pasta, nothing spicy, use what I've got…"
              className="w-full px-4 py-3 rounded-xl text-sm focus:outline-none"
              style={{
                background: "#1C1209",
                border: "1.5px solid #C8522A50",
                color: "#EFE3CE",
              }}
            />
            {freeText.trim() && (
              <p className="text-xs mt-1.5" style={{ color: "#6B4E36" }}>
                Press Enter to search, or answer below for better results
              </p>
            )}
          </div>

          {/* Progress bar */}
          <div
            className="h-0.5 rounded-full mb-5 overflow-hidden"
            style={{ background: "rgba(255,255,255,0.06)" }}
          >
            <motion.div
              className="h-full rounded-full"
              style={{ background: "#C8522A" }}
              animate={{ width: `${progress * 100}%` }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            />
          </div>

          {/* Answered summary chips */}
          {answeredKeys.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {answeredKeys.map((key) => {
                const val = answers[key as keyof FinderAnswers];
                const label = ANSWER_LABELS[String(val)] ?? String(val);
                return (
                  <button
                    key={key}
                    onClick={() => clearAnswer(key)}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium"
                    style={{
                      background: "rgba(200,82,42,0.15)",
                      border: "1px solid #C8522A40",
                      color: "#C8522A",
                    }}
                  >
                    {label}
                    <X className="w-3 h-3" />
                  </button>
                );
              })}
            </div>
          )}

          {/* Active question */}
          {!loading && step < QUESTIONS.length && (
            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.15 }}
              >
                <span
                  className="text-xs font-bold uppercase tracking-widest"
                  style={{ color: "#C8522A" }}
                >
                  Question {step + 1} of {QUESTIONS.length}
                </span>
                <h3
                  className="text-base font-extrabold mt-1 mb-4"
                  style={{
                    color: "#EFE3CE",
                    fontFamily: "'Libre Baskerville', Georgia, serif",
                  }}
                >
                  {QUESTIONS[step].question}
                </h3>
                <div className="flex flex-col gap-2">
                  {QUESTIONS[step].options.map((opt) => (
                    <button
                      key={String(opt.value)}
                      onClick={() => handleAnswer(QUESTIONS[step].key, opt.value)}
                      className="flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all hover:scale-[1.01]"
                      style={{
                        background: "rgba(42,24,8,0.6)",
                        border: "1px solid #3A2416",
                      }}
                    >
                      <span style={{ fontSize: "1.25rem", lineHeight: 1 }}>
                        {opt.emoji}
                      </span>
                      <div className="flex-1">
                        <div
                          className="text-sm font-semibold"
                          style={{ color: "#EFE3CE" }}
                        >
                          {opt.label}
                        </div>
                        {opt.desc && (
                          <div
                            className="text-xs mt-0.5"
                            style={{ color: "#6B4E36" }}
                          >
                            {opt.desc}
                          </div>
                        )}
                      </div>
                      <ChevronRight
                        className="w-4 h-4 shrink-0"
                        style={{ color: "#3A2416" }}
                      />
                    </button>
                  ))}
                </div>
              </motion.div>
            </AnimatePresence>
          )}

          {/* Loading */}
          {loading && (
            <div
              className="flex flex-col items-center justify-center py-12 gap-3"
            >
              <Loader2
                className="w-6 h-6 animate-spin"
                style={{ color: "#C8522A" }}
              />
              <p className="text-sm font-medium" style={{ color: "#EFE3CE" }}>
                Finding your 20 picks…
              </p>
            </div>
          )}

          {/* Error */}
          {error && !loading && (
            <p className="text-sm text-center mt-4" style={{ color: "#C8522A" }}>
              {error}
            </p>
          )}

          {/* Skip */}
          {!loading && step < QUESTIONS.length && (
            <button
              onClick={() => void fireAPI(answers)}
              className="w-full mt-5 text-xs text-center py-2"
              style={{ color: "#6B4E36" }}
            >
              Skip remaining questions →
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit 2>&1 | grep "finder-drawer"
```

Expected: no output.

- [ ] **Step 3: Commit**

```bash
git add src/components/finder-drawer.tsx
git commit -m "feat(finder): add FinderDrawer bottom-sheet wizard component"
```

---

## Task 5: FinderResultsSection Component

**Files:**
- Create: `src/components/finder-results-section.tsx`

- [ ] **Step 1: Create the component**

```tsx
// src/components/finder-results-section.tsx
"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, X, Wand2 } from "lucide-react";
import { RecipeCard } from "@/components/recipe-card";
import type { Recipe } from "@/lib/types";

interface Props {
  recipes: Recipe[];
  profile: { vibeLabel: string | null; timeLabel: string | null };
  onRefine: () => void;
  onDismiss: () => void;
}

const VISIBLE = 4;

export function FinderResultsSection({ recipes, profile, onRefine, onDismiss }: Props) {
  const [index, setIndex] = useState(0);

  if (recipes.length === 0) return null;

  const maxIndex = Math.max(0, recipes.length - VISIBLE);
  const summaryParts = [profile.vibeLabel, profile.timeLabel].filter(Boolean) as string[];

  return (
    <section
      className="px-4 py-5"
      style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <Wand2 className="w-4 h-4" style={{ color: "#C8522A" }} />
            <span
              className="font-bold text-sm"
              style={{
                color: "#EFE3CE",
                fontFamily: "'Libre Baskerville', Georgia, serif",
              }}
            >
              Your Picks
            </span>
            <span
              className="text-xs font-semibold px-2 py-0.5 rounded-full border"
              style={{
                background: "#2A1808",
                borderColor: "#C8522A40",
                color: "#C8522A",
              }}
            >
              {recipes.length} recipes
            </span>
          </div>
          {summaryParts.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {summaryParts.map((part) => (
                <span
                  key={part}
                  className="text-xs px-2.5 py-1 rounded-full font-medium"
                  style={{
                    background: "rgba(200,82,42,0.12)",
                    border: "1px solid #C8522A30",
                    color: "#C8522A",
                  }}
                >
                  {part}
                </span>
              ))}
            </div>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0 ml-3">
          <button
            onClick={onRefine}
            className="text-xs font-semibold px-3 py-1.5 rounded-full"
            style={{
              background: "#2A1808",
              color: "#C8522A",
              border: "1px solid #C8522A40",
            }}
          >
            ✏️ Refine
          </button>
          <button
            onClick={onDismiss}
            className="w-7 h-7 rounded-full flex items-center justify-center"
            style={{ background: "#2A1808", color: "#6B4E36" }}
            aria-label="Dismiss picks"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Carousel */}
      <div className="relative">
        {index > 0 && (
          <button
            onClick={() => setIndex((i) => Math.max(0, i - 1))}
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-10 w-9 h-9 rounded-full flex items-center justify-center shadow-lg transition-transform hover:scale-110"
            style={{ background: "#C8522A", color: "#fff" }}
            aria-label="Previous"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        )}

        <div className="overflow-hidden">
          <motion.div
            className="flex gap-4"
            animate={{
              x: `calc(-${index * (100 / VISIBLE)}% - ${(index * 16) / VISIBLE}px)`,
            }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            style={{ width: `${(recipes.length / VISIBLE) * 100}%` }}
          >
            {recipes.map((recipe) => (
              <div
                key={recipe.id}
                style={{ width: `${100 / recipes.length}%`, flexShrink: 0 }}
              >
                <RecipeCard recipe={recipe} />
              </div>
            ))}
          </motion.div>
        </div>

        {index < maxIndex && (
          <button
            onClick={() => setIndex((i) => Math.min(maxIndex, i + 1))}
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-10 w-9 h-9 rounded-full flex items-center justify-center shadow-lg transition-transform hover:scale-110"
            style={{ background: "#C8522A", color: "#fff" }}
            aria-label="Next"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        )}

        {recipes.length > VISIBLE && (
          <div className="flex justify-center gap-1.5 mt-3">
            {Array.from({ length: maxIndex + 1 }, (_, i) => (
              <button
                key={i}
                onClick={() => setIndex(i)}
                className="rounded-full transition-all"
                style={{
                  width: i === index ? 20 : 6,
                  height: 6,
                  background: i === index ? "#C8522A" : "#3A2416",
                }}
                aria-label={`Go to slide ${i + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit 2>&1 | grep "finder-results"
```

Expected: no output.

- [ ] **Step 3: Commit**

```bash
git add src/components/finder-results-section.tsx
git commit -m "feat(finder): add FinderResultsSection pinned carousel component"
```

---

## Task 6: Wire Into DiscoverFeedClient

**Files:**
- Modify: `src/app/(app)/discover/discover-feed-client.tsx`

- [ ] **Step 1: Add imports and state**

Add to the top of `discover-feed-client.tsx`, after the existing imports:

```tsx
import { useState } from "react";
import { AnimatePresence } from "framer-motion";
import { Wand2 } from "lucide-react";
import { FinderDrawer, type FinderAnswers, type FinderResult } from "@/components/finder-drawer";
import { FinderResultsSection } from "@/components/finder-results-section";
import type { Recipe } from "@/lib/types";
```

- [ ] **Step 2: Add finder state inside `DiscoverFeedClient` function body**

Add these three lines at the top of the `DiscoverFeedClient` function body (before the `return`):

```tsx
const [showFinder, setShowFinder] = useState(false);
const [finderResult, setFinderResult] = useState<FinderResult | null>(null);
const [finderAnswers, setFinderAnswers] = useState<FinderAnswers | null>(null);
```

- [ ] **Step 3: Add the "Help me decide" button section**

In the JSX, add this block immediately after `<QuickEasySection recipes={quickRecipes} />` and before the World Cuisines `<div>`:

```tsx
{/* ── 4b. Finder — "Help me decide" ── */}
<div
  className="px-4 py-4"
  style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
>
  <div className="flex items-center gap-3">
    <button
      onClick={() => setShowFinder(true)}
      className="flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-bold transition-all hover:opacity-90"
      style={{ background: "#C8522A", color: "#fff" }}
    >
      <Wand2 className="w-4 h-4" />
      {finderResult ? "✏️ Refine picks" : "Help me decide"}
    </button>
    {finderResult && (
      <button
        onClick={() => { setFinderResult(null); setFinderAnswers(null); }}
        className="text-xs font-medium px-3 py-2 rounded-full"
        style={{ color: "#6B4E36", background: "#1C1209", border: "1px solid #3A2416" }}
      >
        ✕ Clear
      </button>
    )}
    {!finderResult && (
      <span className="text-xs" style={{ color: "#6B4E36" }}>
        Answer 4 quick questions — we&apos;ll find 20 recipes for you
      </span>
    )}
  </div>
</div>

{/* ── 4c. Finder results carousel (when available) ── */}
{finderResult && (
  <FinderResultsSection
    recipes={finderResult.recipes as Recipe[]}
    profile={finderResult.profile}
    onRefine={() => setShowFinder(true)}
    onDismiss={() => { setFinderResult(null); setFinderAnswers(null); }}
  />
)}
```

- [ ] **Step 4: Add the drawer at the bottom of the JSX return, before the closing `</div>`**

```tsx
{/* ── Finder Drawer (portal-style fixed overlay) ── */}
<AnimatePresence>
  {showFinder && (
    <FinderDrawer
      onClose={() => setShowFinder(false)}
      onResults={(result, answers) => {
        setFinderResult(result);
        setFinderAnswers(answers);
      }}
      initial={finderAnswers ?? undefined}
    />
  )}
</AnimatePresence>
```

- [ ] **Step 5: Verify TypeScript compiles with zero errors**

```bash
npx tsc --noEmit 2>&1 | head -30
```

Expected: no output.

- [ ] **Step 6: Run the full test suite**

```bash
npm test -- --passWithNoTests 2>&1 | tail -15
```

Expected: all tests pass including the finder-parse unit tests.

- [ ] **Step 7: Manual smoke test in the browser**

Start dev server: `npm run dev`

Open `http://localhost:3002/discover`

Verify:
1. Quick & Easy strip shows prev/next arrows when there are > 4 recipes; dots appear below; clicking next animates the cards.
2. "Help me decide" button is visible below the Quick & Easy strip.
3. Clicking it opens the bottom sheet with the free-text input focused.
4. Typing in free text + pressing Enter fires the API and the drawer closes.
5. Tapping through all 4 questions auto-advances and fires on Q4 answer.
6. After completion, "Your Picks" carousel appears above the World Cuisines section.
7. "Refine picks" re-opens the drawer with prior answers as chips.
8. "✕ Clear" removes the results section.

- [ ] **Step 8: Commit**

```bash
git add src/app/\(app\)/discover/discover-feed-client.tsx
git commit -m "feat(finder): wire FinderDrawer and FinderResultsSection into DiscoverFeedClient"
```

---

## Self-Review Checklist

- [x] **Quick & Easy carousel** — Task 1 covers the full component rewrite with prev/next/dots.
- [x] **Free text as first thing in drawer** — Task 4 puts `<input autoFocus>` before the progress bar and questions.
- [x] **One question at a time, auto-advance** — `handleAnswer` sets step+1 after 150ms; Q4 answer fires API.
- [x] **Previous answers as dismissible chips** — `answeredKeys` slice + `clearAnswer` resets step.
- [x] **Skip remaining** — fires `fireAPI(answers)` with whatever is answered so far.
- [x] **localStorage persistence** — written in `fireAPI` before calling `onResults`; read back as `initial` when "Refine" re-opens.
- [x] **Drawer closes → results pin below Quick & Easy** — Task 6 positions `FinderResultsSection` in the feed.
- [x] **Vibe cluster mapping** — `VIBE_BOOST` / `VIBE_SUPPRESS` in route.ts.
- [x] **Time filter SQL proxy + JS precise cut** — documented in route, implemented.
- [x] **Pantry scoring (title-level)** — route fetches pantry_items when `pantryMode === "pantry"`.
- [x] **`HeroFilterCard` untouched** — it lives in `DiscoverClient`, not used by `DiscoverFeedClient`.
- [x] **`force-dynamic` on API route** — present.
- [x] **Tests** — finder-parse unit tests in Task 2.
