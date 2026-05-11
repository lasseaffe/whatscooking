# Landing Page Enhancements Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a report-issue button to landing page recipe cards, a "Run Fix" button to the existing admin reports page, per-feature animated hover demos on the features grid, and fix mojibake arrow characters in CTAs.

**Architecture:** The codebase already has `recipe_bug_reports` (Supabase), `POST /api/recipe-reports`, `src/app/(app)/reports/page.tsx` with `ReportsClient`, and `src/lib/playwright-fixer.ts`. This plan wires a new `ReportButton` component on the landing page to the existing endpoint, adds a "Run Fix" button to the existing `ReportsClient` that calls the existing `playwright-fix` route, builds 8 CSS-keyframe demo components for the features grid, and patches the button text.

**Tech Stack:** Next.js App Router, TypeScript, Tailwind CSS, Lucide React, `@supabase/supabase-js` (already configured), `playwright` (already in package.json), `MONITOR_SECRET` env var (used by existing `/api/admin/apply-fix` and `/api/admin/playwright-fix` for auth).

---

## File Map

| Action | Path | Responsibility |
|---|---|---|
| Create | `src/components/landing/ReportButton.tsx` | Flag icon + popover + POST to `/api/recipe-reports` |
| Modify | `src/app/page.tsx` | Wire `ReportButton` into recipe cards; add demo expansion to feature cards; fix mojibake |
| Modify | `src/app/(app)/reports/reports-client.tsx` | Add "Run Fix" button that calls `POST /api/admin/playwright-fix` |
| Create | `src/components/landing/feature-demos/MealPlannerDemo.tsx` | Week grid fill animation |
| Create | `src/components/landing/feature-demos/DiscoverDemo.tsx` | Scrolling chip strip animation |
| Create | `src/components/landing/feature-demos/MealSwipeDemo.tsx` | Card slide left/right loop |
| Create | `src/components/landing/feature-demos/ImportDemo.tsx` | Typewriter URL + ingredient reveal |
| Create | `src/components/landing/feature-demos/EventsDemo.tsx` | Calendar diagonal highlight |
| Create | `src/components/landing/feature-demos/PantryDemo.tsx` | Checklist tick-off animation |
| Create | `src/components/landing/feature-demos/CollabDemo.tsx` | Two cursors converge animation |
| Create | `src/components/landing/feature-demos/RecsDemo.tsx` | Stars fill left-to-right |

---

## Task 1: ReportButton component

**Files:**
- Create: `src/components/landing/ReportButton.tsx`

- [ ] **Step 1: Create the component**

```tsx
// src/components/landing/ReportButton.tsx
"use client";

import { useState, useRef, useEffect } from "react";
import { Flag } from "lucide-react";

const ISSUE_TYPES = [
  { value: "faulty_image", label: "Wrong / broken image" },
  { value: "wrong_info",   label: "Wrong title or info" },
  { value: "wrong_ingredients", label: "Wrong ingredients" },
  { value: "wrong_instructions", label: "Wrong instructions" },
  { value: "other",        label: "Other" },
] as const;

type IssueType = (typeof ISSUE_TYPES)[number]["value"];

interface Props {
  recipeId: string;
  recipeTitle: string;
  sourceUrl?: string | null;
  imageUrl?: string | null;
}

export function ReportButton({ recipeId, recipeTitle, sourceUrl, imageUrl }: Props) {
  const [open, setOpen] = useState(false);
  const [issueType, setIssueType] = useState<IssueType>("faulty_image");
  const [detail, setDetail] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "done">("idle");
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [open]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("submitting");
    const fd = new FormData();
    fd.append("recipeId", recipeId);
    fd.append("recipeName", recipeTitle);
    fd.append("issueType", issueType);
    fd.append("description", detail);
    if (sourceUrl) fd.append("sourceUrl", sourceUrl);
    try {
      await fetch("/api/recipe-reports", { method: "POST", body: fd });
      setStatus("done");
      setTimeout(() => { setOpen(false); setStatus("idle"); setDetail(""); }, 1500);
    } catch {
      setStatus("idle");
    }
  }

  return (
    <div ref={ref} className="absolute top-2 right-2 z-10" onClick={(e) => e.preventDefault()}>
      <button
        type="button"
        aria-label="Report issue with this recipe"
        onClick={() => setOpen((v) => !v)}
        className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-full"
        style={{ background: "rgba(0,0,0,0.55)", color: "#EFE3CE" }}
      >
        <Flag style={{ width: 13, height: 13 }} />
      </button>

      {open && (
        <div
          className="absolute top-8 right-0 w-56 rounded-xl p-3 space-y-2.5 shadow-xl"
          style={{ background: "#1A0F08", border: "1px solid rgba(200,120,42,0.3)", zIndex: 50 }}
        >
          {status === "done" ? (
            <p className="text-xs text-center py-2" style={{ color: "#4CAF50" }}>Reported ✓</p>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-2.5">
              <p className="text-xs font-semibold" style={{ color: "#EFE3CE" }}>Report an issue</p>
              <select
                value={issueType}
                onChange={(e) => setIssueType(e.target.value as IssueType)}
                className="w-full text-xs rounded-lg px-2 py-1.5"
                style={{ background: "#110900", color: "#EFE3CE", border: "1px solid rgba(200,120,42,0.25)" }}
              >
                {ISSUE_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
              <textarea
                value={detail}
                onChange={(e) => setDetail(e.target.value.slice(0, 200))}
                placeholder="More details… (optional)"
                rows={2}
                className="w-full text-xs rounded-lg px-2 py-1.5 resize-none"
                style={{ background: "#110900", color: "#EFE3CE", border: "1px solid rgba(200,120,42,0.2)" }}
              />
              <button
                type="submit"
                disabled={status === "submitting"}
                className="w-full text-xs font-semibold py-1.5 rounded-lg transition-opacity hover:opacity-80"
                style={{ background: "#C8782A", color: "#F8F3E8" }}
              >
                {status === "submitting" ? "Sending…" : "Report"}
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Verify it compiles**

```bash
cd C:/Users/lasse/Desktop/whatscooking && npx tsc --noEmit 2>&1 | head -30
```

Expected: no errors for the new file (ignore pre-existing errors if any).

- [ ] **Step 3: Commit**

```bash
cd C:/Users/lasse/Desktop/whatscooking
git add src/components/landing/ReportButton.tsx
git commit -m "feat(wc): ReportButton component for landing recipe cards"
```

---

## Task 2: Wire ReportButton into landing page recipe cards + fix button text

**Files:**
- Modify: `src/app/page.tsx` (lines 419–451 — the Trending Right Now section and Browse button)

- [ ] **Step 1: Open `src/app/page.tsx` and find the recipe card `<a>` element (~line 421)**

The card currently looks like:
```tsx
<a
  key={r.id}
  href={`/recipes/${r.id}`}
  className="group rounded-2xl overflow-hidden flex flex-col"
  style={{ background: "var(--wc-surface-1, #2C2724)", border: "1px solid rgba(255,255,255,0.06)" }}
>
```

- [ ] **Step 2: Add import at top of file and make card relative, wire ReportButton**

Add this import after the existing imports at the top of `page.tsx`:
```tsx
import { ReportButton } from "@/components/landing/ReportButton";
```

Change the card element to add `relative` and render `ReportButton` as first child:
```tsx
<a
  key={r.id}
  href={`/recipes/${r.id}`}
  className="group relative rounded-2xl overflow-hidden flex flex-col"
  style={{ background: "var(--wc-surface-1, #2C2724)", border: "1px solid rgba(255,255,255,0.06)" }}
>
  <ReportButton
    recipeId={r.id}
    recipeTitle={r.title}
    imageUrl={r.image_url}
  />
  {/* existing card children unchanged */}
```

- [ ] **Step 3: Fix the Browse button text (line ~449)**

Find:
```tsx
            Browse all recipes â†'
```

Replace with:
```tsx
            Browse all recipes
```

- [ ] **Step 4: Audit the rest of page.tsx for other mojibake sequences**

Search the file for any of these patterns and fix them:
- `â€"` → replace with `—` (em dash, or use `&mdash;` in JSX, or just `—`)
- `â€˜` / `â€™` → smart quotes — replace with `'` and `'` or `&lsquo;`/`&rsquo;`
- `â€œ` / `â€` → replace with `"` and `"`
- `â†'` → already fixed above

In JSX files use HTML entities or the literal Unicode character. The file currently uses `&ldquo;`, `&rdquo;`, `&apos;` etc. in some places — match that convention.

Actually, looking at the existing file, the mojibake sequences are only in the source comment lines (the `â"€` box-drawing chars in comments) and the arrow. Comments with box-drawing are fine — only fix user-visible strings. The only user-visible one is the button text already fixed in Step 3.

- [ ] **Step 5: Verify compiles**

```bash
cd C:/Users/lasse/Desktop/whatscooking && npx tsc --noEmit 2>&1 | head -30
```

- [ ] **Step 6: Commit**

```bash
cd C:/Users/lasse/Desktop/whatscooking
git add src/app/page.tsx
git commit -m "feat(wc): report button on landing recipe cards, fix button text encoding"
```

---

## Task 3: Add "Run Fix" button to existing ReportsClient

**Files:**
- Modify: `src/app/(app)/reports/reports-client.tsx`

The existing `FixPanel` component has "Replace Image" and "Fix Instructions" modes, but no Playwright-powered auto-fix. We add a "Run Fix" button that calls `POST /api/admin/playwright-fix` (already exists, takes no body — runs all unresolved reports with a source_url).

The auth header required by `playwright-fix/route.ts` uses `MONITOR_SECRET`. Since this is a client component, the secret can't be in the browser. The cleanest approach: add a thin wrapper API route at `src/app/api/admin/run-playwright-fix/route.ts` that reads `MONITOR_SECRET` server-side and proxies to `playwright-fix`. Then the client just calls `/api/admin/run-playwright-fix` with no auth header.

- [ ] **Step 1: Create the wrapper route**

```ts
// src/app/api/admin/run-playwright-fix/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function POST() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const secret = process.env.MONITOR_SECRET;
  if (!secret) return NextResponse.json({ error: "MONITOR_SECRET not set" }, { status: 500 });

  const res = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3002"}/api/admin/playwright-fix`, {
    method: "POST",
    headers: { Authorization: `Bearer ${secret}` },
  });

  const body = await res.json();
  return NextResponse.json(body, { status: res.status });
}
```

- [ ] **Step 2: Add "Run Fix" button to FixPanel in reports-client.tsx**

In `reports-client.tsx`, find the `FixPanel` component's state declarations (~line 47) and add:
```tsx
const [runFixStatus, setRunFixStatus] = useState<"idle" | "running" | "done" | "error">("idle");
```

Find the existing "Mark Resolved" button row in the open panel (the `<div className="flex gap-2">` containing the mode buttons, ~line 155). Add a "Run Fix" button after the "Mark Resolved" button:

```tsx
<button
  type="button"
  onClick={async () => {
    setRunFixStatus("running");
    try {
      const res = await fetch("/api/admin/run-playwright-fix", { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        setRunFixStatus("done");
        setMsg(`Fixed ${data.fixed ?? 0} of ${data.processed ?? 0} reports`);
      } else {
        setRunFixStatus("error");
        setMsg("Run fix failed");
      }
    } catch {
      setRunFixStatus("error");
      setMsg("Run fix failed");
    }
  }}
  disabled={runFixStatus === "running"}
  className="text-xs px-2 py-1 rounded-full font-semibold ml-1 transition-all"
  style={{
    background: runFixStatus === "done" ? "rgba(0,180,80,0.15)" : "rgba(200,120,42,0.15)",
    color: runFixStatus === "done" ? "#4CAF50" : "#C8782A",
    border: `1px solid ${runFixStatus === "done" ? "rgba(0,180,80,0.3)" : "rgba(200,120,42,0.3)"}`,
  }}
>
  {runFixStatus === "running" ? "Running…" : runFixStatus === "done" ? "Done" : "Run Fix"}
</button>
```

- [ ] **Step 3: Verify compiles**

```bash
cd C:/Users/lasse/Desktop/whatscooking && npx tsc --noEmit 2>&1 | head -30
```

- [ ] **Step 4: Commit**

```bash
cd C:/Users/lasse/Desktop/whatscooking
git add src/app/(app)/reports/reports-client.tsx src/app/api/admin/run-playwright-fix/route.ts
git commit -m "feat(wc): Run Fix button in admin reports, proxy route for playwright-fix"
```

---

## Task 4: Feature card demo components (8 files)

**Files:**
- Create: `src/components/landing/feature-demos/MealPlannerDemo.tsx`
- Create: `src/components/landing/feature-demos/DiscoverDemo.tsx`
- Create: `src/components/landing/feature-demos/MealSwipeDemo.tsx`
- Create: `src/components/landing/feature-demos/ImportDemo.tsx`
- Create: `src/components/landing/feature-demos/EventsDemo.tsx`
- Create: `src/components/landing/feature-demos/PantryDemo.tsx`
- Create: `src/components/landing/feature-demos/CollabDemo.tsx`
- Create: `src/components/landing/feature-demos/RecsDemo.tsx`

All components: no external deps, CSS keyframes via inline `<style>`, WC copper `#C8782A` as accent.

- [ ] **Step 1: Create MealPlannerDemo**

```tsx
// src/components/landing/feature-demos/MealPlannerDemo.tsx
export function MealPlannerDemo() {
  const days = ["M","T","W","T","F","S","S"];
  const lunch =  [0.3,0.6,0.2,0.8,0.0,0.5,0.7];
  const dinner = [0.7,0.9,0.5,1.0,0.6,0.3,0.0];
  return (
    <>
      <style>{`
        @keyframes cell-fill {
          0%,100% { opacity: 0.15 }
          50% { opacity: 1 }
        }
      `}</style>
      <div className="w-full px-1 py-2">
        <div className="grid grid-cols-7 gap-1 mb-1">
          {days.map((d,i) => (
            <div key={i} className="text-center font-mono" style={{ fontSize: "7px", color: "rgba(239,227,206,0.35)" }}>{d}</div>
          ))}
        </div>
        {[lunch, dinner].map((row, ri) => (
          <div key={ri} className="grid grid-cols-7 gap-1 mb-1">
            {row.map((op, ci) => (
              <div
                key={ci}
                style={{
                  height: 7,
                  borderRadius: 2,
                  background: op ? `rgba(200,120,42,${op})` : "transparent",
                  border: op ? "none" : "1px solid rgba(200,120,42,0.15)",
                  animation: op ? `cell-fill 2s ease-in-out ${ci * 80}ms infinite` : "none",
                }}
              />
            ))}
          </div>
        ))}
      </div>
    </>
  );
}
```

- [ ] **Step 2: Create DiscoverDemo**

```tsx
// src/components/landing/feature-demos/DiscoverDemo.tsx
const CHIPS = ["Pasta","Tacos","Ramen","Salad","Curry","Sushi","Pizza","Stew"];

export function DiscoverDemo() {
  return (
    <>
      <style>{`
        @keyframes scroll-chips {
          0% { transform: translateX(0) }
          100% { transform: translateX(-50%) }
        }
      `}</style>
      <div className="w-full overflow-hidden py-2">
        <div
          style={{
            display: "flex",
            gap: 6,
            width: "max-content",
            animation: "scroll-chips 6s linear infinite",
          }}
        >
          {[...CHIPS, ...CHIPS].map((c, i) => (
            <span
              key={i}
              className="text-xs px-2.5 py-1 rounded-full whitespace-nowrap"
              style={{
                background: i % 3 === 0 ? "rgba(200,120,42,0.18)" : "rgba(255,255,255,0.06)",
                color: i % 3 === 0 ? "#C8782A" : "rgba(239,227,206,0.5)",
                border: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              {c}
            </span>
          ))}
        </div>
      </div>
    </>
  );
}
```

- [ ] **Step 3: Create MealSwipeDemo**

```tsx
// src/components/landing/feature-demos/MealSwipeDemo.tsx
export function MealSwipeDemo() {
  return (
    <>
      <style>{`
        @keyframes swipe-left {
          0%,30% { transform: translateX(0) rotate(0deg); opacity: 1 }
          45% { transform: translateX(-60px) rotate(-12deg); opacity: 0 }
          50%,80% { transform: translateX(0) rotate(0deg); opacity: 1 }
          95% { transform: translateX(60px) rotate(12deg); opacity: 0 }
          100% { transform: translateX(0) rotate(0deg); opacity: 1 }
        }
        @keyframes icon-left {
          0%,25% { opacity: 0 }
          35%,45% { opacity: 1 }
          50%,100% { opacity: 0 }
        }
        @keyframes icon-right {
          0%,75% { opacity: 0 }
          85%,95% { opacity: 1 }
          100% { opacity: 0 }
        }
      `}</style>
      <div className="relative flex items-center justify-center py-2 h-16">
        <span style={{ position: "absolute", left: "28%", fontSize: 16, animation: "icon-left 4s ease-in-out infinite" }}>✕</span>
        <div
          className="rounded-xl flex items-center justify-center text-xs font-semibold"
          style={{
            width: 70, height: 44,
            background: "rgba(200,120,42,0.18)",
            border: "1px solid rgba(200,120,42,0.3)",
            color: "#C8782A",
            animation: "swipe-left 4s ease-in-out infinite",
          }}
        >
          Recipe
        </div>
        <span style={{ position: "absolute", right: "28%", fontSize: 16, color: "#e74c3c", animation: "icon-right 4s ease-in-out infinite" }}>♥</span>
      </div>
    </>
  );
}
```

- [ ] **Step 4: Create ImportDemo**

```tsx
// src/components/landing/feature-demos/ImportDemo.tsx
const URL_TEXT = "instagram.com/p/abc123";
const INGREDIENTS = ["200g pasta","2 cloves garlic","olive oil"];

export function ImportDemo() {
  return (
    <>
      <style>{`
        @keyframes type-url {
          0% { width: 0 }
          40%,100% { width: 100% }
        }
        @keyframes fade-in-row {
          0%,50% { opacity: 0; transform: translateY(4px) }
          70%,100% { opacity: 1; transform: translateY(0) }
        }
      `}</style>
      <div className="w-full py-2 space-y-1.5">
        <div
          className="text-xs rounded-lg px-2 py-1 overflow-hidden whitespace-nowrap"
          style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(200,120,42,0.2)", color: "rgba(239,227,206,0.6)" }}
        >
          <span style={{ display: "inline-block", overflow: "hidden", animation: "type-url 3s steps(22,end) infinite" }}>
            {URL_TEXT}
          </span>
        </div>
        {INGREDIENTS.map((ing, i) => (
          <div
            key={i}
            className="text-xs px-2 py-0.5 rounded"
            style={{
              color: "rgba(239,227,206,0.55)",
              background: "rgba(255,255,255,0.03)",
              animation: `fade-in-row 3s ease ${i * 0.4 + 1.2}s infinite`,
            }}
          >
            {ing}
          </div>
        ))}
      </div>
    </>
  );
}
```

- [ ] **Step 5: Create EventsDemo**

```tsx
// src/components/landing/feature-demos/EventsDemo.tsx
export function EventsDemo() {
  // 4x7 calendar grid, diagonal highlight pattern
  const cells = Array.from({ length: 28 }, (_, i) => i);
  const highlighted = new Set([0,8,16,24,4,12,20,2,10,18]);
  return (
    <>
      <style>{`
        @keyframes cal-pulse {
          0%,100% { opacity: 0.2 }
          50% { opacity: 1 }
        }
      `}</style>
      <div className="grid grid-cols-7 gap-1 py-2 px-1">
        {cells.map((i) => (
          <div
            key={i}
            style={{
              height: 10,
              borderRadius: 3,
              background: highlighted.has(i) ? "rgba(200,120,42,0.7)" : "rgba(255,255,255,0.06)",
              animation: highlighted.has(i) ? `cal-pulse 2s ease ${(i % 7) * 120}ms infinite` : "none",
            }}
          />
        ))}
      </div>
    </>
  );
}
```

- [ ] **Step 6: Create PantryDemo**

```tsx
// src/components/landing/feature-demos/PantryDemo.tsx
const ITEMS = ["Olive oil","Garlic","Pasta","Tomatoes"];

export function PantryDemo() {
  return (
    <>
      <style>{`
        @keyframes tick-item {
          0%,20% { opacity: 0.3 }
          30%,100% { opacity: 1 }
        }
        @keyframes check-appear {
          0%,20% { transform: scale(0); opacity: 0 }
          30%,100% { transform: scale(1); opacity: 1 }
        }
      `}</style>
      <div className="w-full py-2 space-y-1">
        {ITEMS.map((item, i) => (
          <div
            key={i}
            className="flex items-center gap-2 text-xs px-2 py-0.5"
            style={{
              color: "rgba(239,227,206,0.6)",
              animation: `tick-item 4s ease ${i * 0.5}s infinite`,
            }}
          >
            <span
              style={{
                width: 12, height: 12,
                borderRadius: 3,
                background: "rgba(200,120,42,0.25)",
                border: "1px solid rgba(200,120,42,0.4)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 8, color: "#C8782A",
                animation: `check-appear 4s ease ${i * 0.5}s infinite`,
              }}
            >✓</span>
            {item}
          </div>
        ))}
      </div>
    </>
  );
}
```

- [ ] **Step 7: Create CollabDemo**

```tsx
// src/components/landing/feature-demos/CollabDemo.tsx
export function CollabDemo() {
  return (
    <>
      <style>{`
        @keyframes cursor-a {
          0% { left: 8px }
          60%,100% { left: 50% }
        }
        @keyframes cursor-b {
          0% { right: 8px }
          60%,100% { right: 50% }
        }
      `}</style>
      <div className="relative flex items-center justify-center py-2 h-16">
        {/* Shared card */}
        <div
          className="rounded-xl flex items-center justify-center text-xs"
          style={{
            width: 60, height: 36,
            background: "rgba(200,120,42,0.12)",
            border: "1px solid rgba(200,120,42,0.3)",
            color: "rgba(239,227,206,0.5)",
            position: "relative", zIndex: 1,
          }}
        >
          Menu
        </div>
        {/* Cursor A */}
        <div
          style={{
            position: "absolute", top: "38%",
            width: 10, height: 10, borderRadius: "50%",
            background: "#C8782A",
            animation: "cursor-a 3s ease-in-out infinite",
            zIndex: 2,
          }}
        />
        {/* Cursor B */}
        <div
          style={{
            position: "absolute", top: "55%",
            width: 10, height: 10, borderRadius: "50%",
            background: "#F4A261",
            animation: "cursor-b 3s ease-in-out infinite",
            zIndex: 2,
          }}
        />
      </div>
    </>
  );
}
```

- [ ] **Step 8: Create RecsDemo**

```tsx
// src/components/landing/feature-demos/RecsDemo.tsx
export function RecsDemo() {
  return (
    <>
      <style>{`
        @keyframes star-fill {
          0%,100% { color: rgba(239,227,206,0.15) }
          50% { color: #F2C94C }
        }
      `}</style>
      <div className="flex items-center justify-center gap-1.5 py-4">
        {[0,1,2,3,4].map((i) => (
          <span
            key={i}
            style={{
              fontSize: 18,
              animation: `star-fill 2.5s ease ${i * 200}ms infinite`,
            }}
          >
            ★
          </span>
        ))}
      </div>
    </>
  );
}
```

- [ ] **Step 9: Verify all 8 compile**

```bash
cd C:/Users/lasse/Desktop/whatscooking && npx tsc --noEmit 2>&1 | head -30
```

- [ ] **Step 10: Commit**

```bash
cd C:/Users/lasse/Desktop/whatscooking
git add src/components/landing/feature-demos/
git commit -m "feat(wc): 8 CSS-keyframe feature demo components for landing page"
```

---

## Task 5: Wire feature demos into the features grid in page.tsx

**Files:**
- Modify: `src/app/page.tsx` (the features grid section, ~lines 183–246)

- [ ] **Step 1: Add demo component imports to page.tsx**

Add after existing imports at the top:
```tsx
import { MealPlannerDemo } from "@/components/landing/feature-demos/MealPlannerDemo";
import { DiscoverDemo }    from "@/components/landing/feature-demos/DiscoverDemo";
import { MealSwipeDemo }   from "@/components/landing/feature-demos/MealSwipeDemo";
import { ImportDemo }      from "@/components/landing/feature-demos/ImportDemo";
import { EventsDemo }      from "@/components/landing/feature-demos/EventsDemo";
import { PantryDemo }      from "@/components/landing/feature-demos/PantryDemo";
import { CollabDemo }      from "@/components/landing/feature-demos/CollabDemo";
import { RecsDemo }        from "@/components/landing/feature-demos/RecsDemo";
```

- [ ] **Step 2: Add demo and route to the features array at the bottom of page.tsx**

The existing `features` array (~line 507) has `{ icon, title, description }`. Extend it to add `Demo` and `route`:

```tsx
const features = [
  {
    icon: Sparkles,
    title: "AI Meal Planner",
    description: "Tell us your preferences and get a fully personalised weekly meal plan with shopping lists, built around your life.",
    Demo: MealPlannerDemo,
    route: "/plans",
  },
  {
    icon: Flame,
    title: "Discover & Trending",
    description: "Browse trending recipes from the community. Filter by cuisine, cooking time, dietary needs, or mood.",
    Demo: DiscoverDemo,
    route: "/discover",
  },
  {
    icon: Heart,
    title: "Meal Swipe",
    description: "Swipe through recipes like never before. Like what you see, skip what you don't.",
    Demo: MealSwipeDemo,
    route: "/discover",
  },
  {
    icon: BookOpen,
    title: "Social Recipe Import",
    description: "Spotted something on Instagram or TikTok? Paste the link and we extract every ingredient and step automatically.",
    Demo: ImportDemo,
    route: "/my-recipes/new",
  },
  {
    icon: Calendar,
    title: "Events & Occasions",
    description: "Plan the perfect date night, birthday, or dinner party with AI-curated menus.",
    Demo: EventsDemo,
    route: "/events",
  },
  {
    icon: ShoppingBasket,
    title: "Smart Pantry",
    description: "Track what you have, get alerts before things expire, zero food waste.",
    Demo: PantryDemo,
    route: "/pantry",
  },
  {
    icon: Users,
    title: "Collaborative Cooking",
    description: "Plan meals with family or friends in real time. Share notes, assign courses, and prep together effortlessly.",
    Demo: CollabDemo,
    route: "/plans",
  },
  {
    icon: TrendingUp,
    title: "Smart Recommendations",
    description: "The more you cook, the smarter it gets. Suggestions shaped by your taste, goals, and favourite cuisines.",
    Demo: RecsDemo,
    route: "/discover",
  },
];
```

- [ ] **Step 3: Update the feature card render to show the hover expansion**

The existing card render (~lines 190–244) loops `features.map((f, i) => ...)`. For cards 1–7 (i > 0), the content is just course label + title + description. Update the render so every card (including i===0) has the demo expansion area.

Replace the entire `{features.map((f, i) => (` block with:

```tsx
{features.map((f, i) => (
  <div
    key={i}
    className="p-9 transition-colors feature-cell group"
    style={{ background: "var(--bg-primary, #121211)" }}
  >
    {/* Course label (all cards except 0) */}
    {i > 0 && (
      <div className="flex items-start justify-between mb-6">
        <span className="label-ornament opacity-40" style={{ fontSize: "0.58rem", letterSpacing: "0.3em" }}>
          Course {(i + 1).toString().padStart(2, "0")}
        </span>
      </div>
    )}

    {/* AI Meal Planner mini-grid (always visible for card 0) */}
    {i === 0 && (
      <div className="mb-6">
        <div className="grid grid-cols-7 gap-1 mb-1">
          {["M","T","W","T","F","S","S"].map((d, di) => (
            <div key={di} className="text-center font-mono" style={{ fontSize: "6px", color: "var(--fg-tertiary, #9c9c9b)", paddingBottom: "3px" }}>{d}</div>
          ))}
          {[0.3,0.6,0.2,0.5,0,0.4,0.7].map((op, ci) => (
            <div key={ci} style={{ height: "6px", borderRadius: "2px", background: op ? `rgba(200,120,42,${op})` : "transparent", border: op ? "none" : "1px solid rgba(200,120,42,0.15)" }} />
          ))}
          {[0.7,0.8,0.5,0.9,0.6,0.3,0].map((op, ci) => (
            <div key={ci} style={{ height: "6px", borderRadius: "2px", background: op ? `rgba(200,120,42,${op})` : "transparent", border: op ? "none" : "1px solid rgba(200,120,42,0.15)" }} />
          ))}
        </div>
      </div>
    )}

    <h3
      className="font-serif-display mb-3 group-hover:text-claret transition-colors"
      style={{ color: "var(--fg-primary, #EFE3CE)", fontSize: "1.1rem", fontWeight: 400 }}
    >
      {f.title}
    </h3>
    <p className="text-sm leading-relaxed" style={{ color: "var(--fg-tertiary, #9c9c9b)" }}>
      {f.description}
    </p>

    {/* Hover-reveal demo area */}
    <div
      className="overflow-hidden transition-all duration-500"
      style={{ maxHeight: 0 }}
      // CSS-only: group-hover changes maxHeight via the style below
    >
      <f.Demo />
      <Link
        href={f.route}
        className="inline-block mt-1 text-xs font-semibold transition-opacity hover:opacity-70"
        style={{ color: "var(--wc-copper, #C8782A)", letterSpacing: "0.06em" }}
      >
        Try it
      </Link>
    </div>
  </div>
))}
```

- [ ] **Step 4: Add the CSS-only group-hover max-height expansion**

The `maxHeight: 0` inline style won't animate with `group-hover` via Tailwind alone — we need a CSS rule. Add this to `src/app/globals.css` (at the bottom):

```css
.feature-cell:hover .feature-demo-reveal {
  max-height: 12rem !important;
}
```

And update the demo wrapper div's className in the JSX above:
```tsx
<div className="feature-demo-reveal overflow-hidden transition-all duration-500" style={{ maxHeight: 0 }}>
```

- [ ] **Step 5: Verify compiles, check for TypeScript errors**

```bash
cd C:/Users/lasse/Desktop/whatscooking && npx tsc --noEmit 2>&1 | head -30
```

- [ ] **Step 6: Commit**

```bash
cd C:/Users/lasse/Desktop/whatscooking
git add src/app/page.tsx src/app/globals.css
git commit -m "feat(wc): hover-expand animated demos on feature cards, wire demo components"
```

---

## Task 6: Smoke test

- [ ] **Step 1: Start the dev server**

```bash
cd C:/Users/lasse/Desktop/whatscooking && npm run dev
```

- [ ] **Step 2: Verify landing page at http://localhost:3002**

Check:
- [ ] "Browse all recipes" button shows no arrow, no mojibake
- [ ] Hovering a recipe card reveals the flag icon in the top-right
- [ ] Clicking the flag icon opens the popover with dropdown + textarea + Report button
- [ ] Hovering a feature card reveals the animated demo + "Try it" link

- [ ] **Step 3: Verify admin reports at http://localhost:3002/reports (logged in)**

Check:
- [ ] "Run Fix" button appears in each report's FixPanel
- [ ] Clicking it shows "Running…" state

- [ ] **Step 4: Final commit if any tweaks were made**

```bash
cd C:/Users/lasse/Desktop/whatscooking
git add -p
git commit -m "fix(wc): smoke test adjustments"
```

---

## Self-Review Notes

- **Spec coverage:**
  - Report button on recipe cards ✓ (Task 1–2)
  - API route for reports already exists — ReportButton uses existing `/api/recipe-reports` ✓
  - Admin Run Fix button ✓ (Task 3) — wires to existing `playwright-fixer.ts` via new thin proxy route
  - 8 feature card demos ✓ (Task 4–5)
  - Button text fix ✓ (Task 2, Step 3)

- **No queue.json/scripts/fix-recipe.mjs needed** — the existing Supabase-backed infrastructure handles this fully. Spec was written before discovering the existing system.

- **`MONITOR_SECRET` env var** — must be set in `.env.local` for the proxy route to work. The existing `apply-fix` route already requires it; this is pre-existing infra.

- **`NEXT_PUBLIC_SITE_URL`** — used by the proxy route to self-call. Set to `http://localhost:3002` locally; on Vercel it will be set automatically. Falls back to `http://localhost:3002` if unset.
