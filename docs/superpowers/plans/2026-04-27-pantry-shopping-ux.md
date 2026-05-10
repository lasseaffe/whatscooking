# Pantry & Shopping List UX Enhancement — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add shopping list sort-by-aisle, export/share (txt/PDF/image/OS share), and a full collaborative kitchen (groups + real-time shared lists + push notifications).

**Architecture:** Three independent phases. Phase A (sort) and Phase B (export) are pure client-side with no DB changes. Phase C (groups) migrates the shopping list to Supabase and adds real-time subscriptions, push notifications, and group management UI. Each phase ships independently.

**Tech Stack:** Next.js 15 App Router, Supabase (Postgres + Realtime + Auth), React context, `jspdf`, `html2canvas`, Web Share API, Web Push / VAPID, Service Worker

---

## Phase A — Shopping List Sort / Group Mode

### Task A1: Extend ShoppingItem type with category fields

**Files:**
- Modify: `src/lib/shopping-list.ts`

- [ ] **Step 1: Update the `ShoppingItem` type**

Open `src/lib/shopping-list.ts` and replace the existing type:

```ts
"use client";

export type ShoppingItem = {
  id: string;
  name: string;
  amount?: string;
  unit?: string;
  recipeTitle?: string;
  checked: boolean;
  category_id?: string;
  category_name?: string;
};
```

Leave all existing functions (`loadShoppingList`, `saveShoppingList`, `addToShoppingList`, `toggleShoppingItem`, `removeShoppingItem`, `clearCheckedItems`) unchanged — the new fields are optional so existing stored JSON will deserialize fine.

- [ ] **Step 2: Commit**

```bash
git add src/lib/shopping-list.ts
git commit -m "feat(shopping): extend ShoppingItem with optional category fields"
```

---

### Task A2: Build grouping utility functions

**Files:**
- Create: `src/lib/shopping-list-grouping.ts`

- [ ] **Step 1: Create the file**

```ts
import type { ShoppingItem } from "./shopping-list";

export type SortMode = "recipe" | "aisle" | "recipe+aisle";

export const SORT_KEY = "wc_shopping_sort_v1";

export function loadSortMode(): SortMode {
  try {
    const v = localStorage.getItem(SORT_KEY);
    if (v === "recipe" || v === "aisle" || v === "recipe+aisle") return v;
  } catch {}
  return "recipe";
}

export function saveSortMode(mode: SortMode): void {
  try { localStorage.setItem(SORT_KEY, mode); } catch {}
}

/** Group unchecked items by recipe title. */
export function groupByRecipe(items: ShoppingItem[]): Record<string, ShoppingItem[]> {
  return items.reduce<Record<string, ShoppingItem[]>>((acc, item) => {
    const key = item.recipeTitle ?? "Other";
    (acc[key] ??= []).push(item);
    return acc;
  }, {});
}

/** Group unchecked items by aisle/category. */
export function groupByAisle(items: ShoppingItem[]): Record<string, ShoppingItem[]> {
  return items.reduce<Record<string, ShoppingItem[]>>((acc, item) => {
    const key = item.category_name ?? "Uncategorized";
    (acc[key] ??= []).push(item);
    return acc;
  }, {});
}

/**
 * Nested: recipe → category sub-groups.
 * Returns Record<recipeTitle, Record<categoryName, ShoppingItem[]>>
 */
export function groupByRecipeAndAisle(
  items: ShoppingItem[],
): Record<string, Record<string, ShoppingItem[]>> {
  return items.reduce<Record<string, Record<string, ShoppingItem[]>>>((acc, item) => {
    const recipe = item.recipeTitle ?? "Other";
    const aisle = item.category_name ?? "Uncategorized";
    ((acc[recipe] ??= {})[aisle] ??= []).push(item);
    return acc;
  }, {});
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/shopping-list-grouping.ts
git commit -m "feat(shopping): add grouping utility functions for sort modes"
```

---

### Task A3: Auto-categorize items missing a category

**Files:**
- Create: `src/lib/shopping-list-categorize.ts`

This calls the existing `/api/pantry/categorize` endpoint (POST, `{ ingredients: string[] }` → `{ categorized: Record<string, { id, name, emoji?, color? }> }`) and caches results in localStorage to avoid repeat API calls.

- [ ] **Step 1: Create the file**

```ts
"use client";

import { loadShoppingList, saveShoppingList } from "./shopping-list";

const CACHE_KEY = "wc_shopping_cat_cache_v1";

function loadCache(): Record<string, { id: string; name: string }> {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
}

function saveCache(cache: Record<string, { id: string; name: string }>): void {
  try { localStorage.setItem(CACHE_KEY, JSON.stringify(cache)); } catch {}
}

/**
 * For every shopping list item lacking a category, call /api/pantry/categorize,
 * cache results, and patch the items in localStorage.
 * Returns the updated list.
 */
export async function categorizeMissingItems() {
  const items = loadShoppingList();
  const cache = loadCache();

  const uncategorized = items
    .filter((i) => !i.category_id && !cache[i.name.toLowerCase()])
    .map((i) => i.name);

  if (uncategorized.length === 0) {
    // Apply cached values to any items that have a cache hit but no category_id
    const updated = items.map((item) => {
      const cached = cache[item.name.toLowerCase()];
      if (cached && !item.category_id) {
        return { ...item, category_id: cached.id, category_name: cached.name };
      }
      return item;
    });
    saveShoppingList(updated);
    return updated;
  }

  try {
    const res = await fetch("/api/pantry/categorize", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ingredients: uncategorized }),
    });
    if (!res.ok) return items;
    const { categorized } = await res.json() as {
      categorized: Record<string, { id: string; name: string }>;
    };

    const newCache = { ...cache };
    for (const [name, cat] of Object.entries(categorized)) {
      newCache[name.toLowerCase()] = cat;
    }
    saveCache(newCache);

    const updated = items.map((item) => {
      const cat = newCache[item.name.toLowerCase()];
      if (cat && !item.category_id) {
        return { ...item, category_id: cat.id, category_name: cat.name };
      }
      return item;
    });
    saveShoppingList(updated);
    return updated;
  } catch {
    return items;
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/shopping-list-categorize.ts
git commit -m "feat(shopping): auto-categorize items via AI endpoint with localStorage cache"
```

---

### Task A4: Add sort toggle + grouping UI to the shopping list

**Files:**
- Modify: `src/app/(app)/shopping-list/shopping-list-client.tsx`

- [ ] **Step 1: Replace the file with the updated version**

```tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import {
  ShoppingCart, Trash2, CheckCircle2, Circle, X,
  PackageCheck, Plus, LayoutList, Store, BookOpen,
} from "lucide-react";
import {
  type ShoppingItem,
  loadShoppingList,
  addToShoppingList,
  toggleShoppingItem,
  removeShoppingItem,
  clearCheckedItems,
} from "@/lib/shopping-list";
import {
  type SortMode,
  loadSortMode,
  saveSortMode,
  groupByRecipe,
  groupByAisle,
  groupByRecipeAndAisle,
} from "@/lib/shopping-list-grouping";
import { categorizeMissingItems } from "@/lib/shopping-list-categorize";
import { RichTextarea } from "@/components/ui/rich-textarea";

const NOTES_KEY = "wc_shopping_notes_v1";

const SORT_MODES: { value: SortMode; label: string; Icon: React.ElementType }[] = [
  { value: "recipe",       label: "By recipe",   Icon: BookOpen },
  { value: "aisle",        label: "By aisle",    Icon: Store },
  { value: "recipe+aisle", label: "Nested",      Icon: LayoutList },
];

function ItemRow({
  item,
  onToggle,
  onRemove,
  isLast,
}: {
  item: ShoppingItem;
  onToggle: (id: string) => void;
  onRemove: (id: string) => void;
  isLast: boolean;
}) {
  return (
    <div
      className="flex items-center gap-3 px-4 py-3"
      style={{ borderBottom: isLast ? "none" : "1px solid rgba(42,24,8,0.5)" }}
    >
      <button onClick={() => onToggle(item.id)} className="shrink-0 hover:opacity-80" aria-label="Toggle">
        {item.checked
          ? <CheckCircle2 style={{ width: 20, height: 20, color: "#828E6F" }} />
          : <Circle style={{ width: 20, height: 20, color: "#3A2416" }} />}
      </button>
      <span
        className={`flex-1 text-sm ${item.checked ? "line-through" : ""}`}
        style={{ color: item.checked ? "#5A3A28" : "var(--wc-text, #EFE3CE)" }}
      >
        {[item.amount, item.unit, item.name].filter(Boolean).join(" ")}
      </span>
      <button onClick={() => onRemove(item.id)} className="shrink-0 hover:opacity-70" aria-label="Remove">
        <X style={{ width: 14, height: 14, color: "#5A3A28" }} />
      </button>
    </div>
  );
}

function GroupBlock({
  label,
  items,
  onToggle,
  onRemove,
  labelColor = "#6B4E36",
}: {
  label: string;
  items: ShoppingItem[];
  onToggle: (id: string) => void;
  onRemove: (id: string) => void;
  labelColor?: string;
}) {
  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-wider mb-2 px-1" style={{ color: labelColor }}>
        {label}
      </p>
      <div
        className="rounded-2xl overflow-hidden"
        style={{ border: "1px solid rgba(42,24,8,0.6)", background: "rgba(26,16,8,0.6)" }}
      >
        {items.map((item, idx) => (
          <ItemRow
            key={item.id}
            item={item}
            onToggle={onToggle}
            onRemove={onRemove}
            isLast={idx === items.length - 1}
          />
        ))}
      </div>
    </div>
  );
}

export function ShoppingListClient() {
  const [items, setItems] = useState<ShoppingItem[]>([]);
  const [quickAdd, setQuickAdd] = useState("");
  const [notes, setNotes] = useState("");
  const [sortMode, setSortMode] = useState<SortMode>("recipe");

  useEffect(() => {
    setSortMode(loadSortMode());
    setItems(loadShoppingList());
    try { setNotes(localStorage.getItem(NOTES_KEY) ?? ""); } catch {}
    // Background: categorize any items missing a category
    categorizeMissingItems().then(setItems).catch(() => {});
  }, []);

  const handleSortChange = useCallback((mode: SortMode) => {
    setSortMode(mode);
    saveSortMode(mode);
  }, []);

  const handleQuickAdd = useCallback(() => {
    const name = quickAdd.trim();
    if (!name) return;
    setItems(addToShoppingList([{ name }]));
    setQuickAdd("");
    // Re-categorize after adding
    categorizeMissingItems().then(setItems).catch(() => {});
  }, [quickAdd]);

  const handleNotesChange = useCallback((v: string) => {
    setNotes(v);
    try { localStorage.setItem(NOTES_KEY, v); } catch {}
  }, []);

  const handleToggle = useCallback((id: string) => { setItems(toggleShoppingItem(id)); }, []);
  const handleRemove = useCallback((id: string) => { setItems(removeShoppingItem(id)); }, []);
  const handleClearChecked = useCallback(() => { setItems(clearCheckedItems()); }, []);

  const unchecked = items.filter((i) => !i.checked);
  const checked = items.filter((i) => i.checked);

  return (
    <div className="min-h-screen px-4 py-8 sm:px-8" style={{ background: "var(--wc-bg-base, #1A0E06)" }}>
      <div className="max-w-xl mx-auto flex flex-col gap-6">

        {/* Header */}
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0"
            style={{ background: "rgba(176,125,86,0.18)", border: "1px solid rgba(176,125,86,0.3)" }}
          >
            <ShoppingCart style={{ width: 18, height: 18, color: "var(--wc-pal-accent, #B07D56)" }} />
          </div>
          <div>
            <h1 className="text-xl font-bold" style={{ color: "var(--wc-text, #EFE3CE)", fontFamily: "'Libre Baskerville', Georgia, serif" }}>
              My Shopping List
            </h1>
            <p className="text-xs" style={{ color: "#6B4E36" }}>
              {unchecked.length} item{unchecked.length !== 1 ? "s" : ""} to buy
            </p>
          </div>
          {checked.length > 0 && (
            <button
              onClick={handleClearChecked}
              className="ml-auto flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full transition-all hover:opacity-80"
              style={{ background: "rgba(42,24,8,0.6)", border: "1px solid rgba(58,36,22,0.6)", color: "#8A6A4A" }}
            >
              <Trash2 style={{ width: 11, height: 11 }} />
              Clear {checked.length} done
            </button>
          )}
        </div>

        {/* Sort toggle */}
        <div className="flex gap-1.5">
          {SORT_MODES.map(({ value, label, Icon }) => (
            <button
              key={value}
              onClick={() => handleSortChange(value)}
              className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full transition-all"
              style={{
                background: sortMode === value ? "rgba(176,125,86,0.25)" : "rgba(42,24,8,0.4)",
                border: sortMode === value ? "1px solid rgba(176,125,86,0.5)" : "1px solid rgba(42,24,8,0.5)",
                color: sortMode === value ? "#B07D56" : "#6B4E36",
              }}
            >
              <Icon style={{ width: 11, height: 11 }} />
              {label}
            </button>
          ))}
        </div>

        {/* Quick-add */}
        <div className="flex gap-2">
          <input
            type="text"
            value={quickAdd}
            onChange={(e) => setQuickAdd(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleQuickAdd()}
            placeholder="Add an item…"
            className="flex-1 px-3 py-2 rounded-xl text-sm focus:outline-none placeholder:opacity-40"
            style={{ background: "#1C1209", border: "1px solid #3A2416", color: "#EFE3CE" }}
          />
          <button
            onClick={handleQuickAdd}
            disabled={!quickAdd.trim()}
            className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-opacity disabled:opacity-30"
            style={{ background: "rgba(176,125,86,0.18)", border: "1px solid rgba(176,125,86,0.3)", color: "#B07D56" }}
          >
            <Plus style={{ width: 16, height: 16 }} />
          </button>
        </div>

        {/* Notes */}
        <div>
          <p className="text-xs font-bold uppercase tracking-wider mb-2 px-1" style={{ color: "#6B4E36" }}>Notes</p>
          <RichTextarea value={notes} onChange={handleNotesChange} placeholder="Jot down notes, quantities, store sections…" rows={4} theme="dark" />
        </div>

        {/* Empty state */}
        {items.length === 0 && (
          <div className="rounded-2xl p-10 flex flex-col items-center gap-3 text-center" style={{ background: "rgba(26,16,8,0.5)", border: "1px dashed rgba(42,24,8,0.7)" }}>
            <PackageCheck style={{ width: 36, height: 36, color: "#3A2416" }} />
            <p className="text-sm font-semibold" style={{ color: "#6B4E36" }}>Your list is empty</p>
            <p className="text-xs leading-relaxed" style={{ color: "#4A3020" }}>
              Open a recipe and use <strong style={{ color: "#8A6A4A" }}>Add all to list</strong> or <strong style={{ color: "#8A6A4A" }}>Add missing</strong> to populate it.
            </p>
          </div>
        )}

        {/* Grouped unchecked items */}
        {sortMode === "recipe" &&
          Object.entries(groupByRecipe(unchecked)).map(([recipe, recipeItems]) => (
            <GroupBlock key={recipe} label={recipe} items={recipeItems} onToggle={handleToggle} onRemove={handleRemove} />
          ))}

        {sortMode === "aisle" &&
          Object.entries(groupByAisle(unchecked)).map(([aisle, aisleItems]) => (
            <GroupBlock key={aisle} label={aisle} items={aisleItems} onToggle={handleToggle} onRemove={handleRemove} />
          ))}

        {sortMode === "recipe+aisle" &&
          Object.entries(groupByRecipeAndAisle(unchecked)).map(([recipe, aisleMap]) => (
            <div key={recipe} className="flex flex-col gap-3">
              <p className="text-xs font-bold uppercase tracking-wider px-1" style={{ color: "#8A6A4A" }}>{recipe}</p>
              {Object.entries(aisleMap).map(([aisle, aisleItems]) => (
                <GroupBlock key={aisle} label={aisle} items={aisleItems} onToggle={handleToggle} onRemove={handleRemove} labelColor="#5A3A28" />
              ))}
            </div>
          ))}

        {/* Checked / in-cart */}
        {checked.length > 0 && (
          <div>
            <p className="text-xs font-bold uppercase tracking-wider mb-2 px-1" style={{ color: "#4A3020" }}>In cart ({checked.length})</p>
            <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid rgba(42,24,8,0.4)", background: "rgba(18,12,7,0.5)", opacity: 0.6 }}>
              {checked.map((item, idx) => (
                <ItemRow key={item.id} item={item} onToggle={handleToggle} onRemove={handleRemove} isLast={idx === checked.length - 1} />
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
```

- [ ] **Step 2: Install no new deps — verify existing imports compile**

```bash
cd /c/Users/lasse/Desktop/whatscooking && npx tsc --noEmit 2>&1 | head -30
```

Expected: no errors related to the new files.

- [ ] **Step 3: Commit**

```bash
git add src/app/\(app\)/shopping-list/shopping-list-client.tsx
git commit -m "feat(shopping): add sort-by-recipe/aisle/nested toggle UI"
```

---

## Phase B — Export & Share

### Task B1: Install export dependencies

**Files:** `package.json`

- [ ] **Step 1: Install**

```bash
cd /c/Users/lasse/Desktop/whatscooking && npm install jspdf html2canvas
```

- [ ] **Step 2: Verify types are available**

```bash
npx tsc --noEmit 2>&1 | head -20
```

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add jspdf and html2canvas for shopping list export"
```

---

### Task B2: Build export utility

**Files:**
- Create: `src/lib/shopping-list-export.ts`

- [ ] **Step 1: Create the file**

```ts
"use client";

import type { ShoppingItem } from "./shopping-list";
import type { SortMode } from "./shopping-list-grouping";
import { groupByRecipe, groupByAisle, groupByRecipeAndAisle } from "./shopping-list-grouping";

/** Render the list as a plain-text string using the active sort mode. */
export function toPlainText(items: ShoppingItem[], mode: SortMode): string {
  const date = new Date().toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });
  const lines: string[] = [`🛒 My Shopping List — ${date}`, ""];

  const unchecked = items.filter((i) => !i.checked);

  function formatItem(item: ShoppingItem): string {
    return `• ${[item.amount, item.unit, item.name].filter(Boolean).join(" ")}`;
  }

  if (mode === "recipe") {
    for (const [group, groupItems] of Object.entries(groupByRecipe(unchecked))) {
      lines.push(group, ...groupItems.map(formatItem), "");
    }
  } else if (mode === "aisle") {
    for (const [group, groupItems] of Object.entries(groupByAisle(unchecked))) {
      lines.push(group, ...groupItems.map(formatItem), "");
    }
  } else {
    for (const [recipe, aisleMap] of Object.entries(groupByRecipeAndAisle(unchecked))) {
      lines.push(recipe);
      for (const [aisle, aisleItems] of Object.entries(aisleMap)) {
        lines.push(`  ${aisle}`, ...aisleItems.map((i) => `  ${formatItem(i)}`));
      }
      lines.push("");
    }
  }

  if (items.some((i) => i.checked)) {
    lines.push("— Already in cart —", ...items.filter((i) => i.checked).map(formatItem));
  }

  return lines.join("\n").trim();
}

/** Download a .txt file. */
export function downloadTxt(items: ShoppingItem[], mode: SortMode): void {
  const text = toPlainText(items, mode);
  const blob = new Blob([text], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `shopping-list-${Date.now()}.txt`;
  a.click();
  URL.revokeObjectURL(url);
}

/** Download a branded PDF. */
export async function downloadPdf(items: ShoppingItem[], mode: SortMode): Promise<void> {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "mm", format: "a4" });

  const MARGIN = 18;
  const PAGE_WIDTH = 210;
  const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;
  let y = MARGIN;

  // Branded header
  doc.setFillColor(26, 14, 6); // #1A0E06
  doc.rect(0, 0, PAGE_WIDTH, 22, "F");
  doc.setTextColor(176, 125, 86); // #B07D56
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("What's Cooking", MARGIN, 14);
  doc.setTextColor(239, 227, 206); // #EFE3CE
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  const date = new Date().toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });
  doc.text(`My Shopping List — ${date}`, PAGE_WIDTH - MARGIN, 14, { align: "right" });
  y = 30;

  function addGroup(label: string, groupItems: ShoppingItem[], indent = 0) {
    if (y > 270) { doc.addPage(); y = MARGIN; }
    doc.setTextColor(107, 78, 54); // #6B4E36
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.text(label.toUpperCase(), MARGIN + indent, y);
    y += 5;
    doc.setTextColor(239, 227, 206);
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    for (const item of groupItems) {
      if (y > 275) { doc.addPage(); y = MARGIN; }
      const text = `• ${[item.amount, item.unit, item.name].filter(Boolean).join(" ")}`;
      const wrapped = doc.splitTextToSize(text, CONTENT_WIDTH - indent);
      doc.text(wrapped, MARGIN + indent, y);
      y += wrapped.length * 5 + 1;
    }
    y += 3;
  }

  const unchecked = items.filter((i) => !i.checked);

  if (mode === "recipe") {
    for (const [group, groupItems] of Object.entries(groupByRecipe(unchecked))) addGroup(group, groupItems);
  } else if (mode === "aisle") {
    for (const [group, groupItems] of Object.entries(groupByAisle(unchecked))) addGroup(group, groupItems);
  } else {
    for (const [recipe, aisleMap] of Object.entries(groupByRecipeAndAisle(unchecked))) {
      addGroup(recipe, [], 0);
      for (const [aisle, aisleItems] of Object.entries(aisleMap)) addGroup(aisle, aisleItems, 5);
    }
  }

  doc.save(`shopping-list-${Date.now()}.pdf`);
}

/** Download a PNG screenshot of the list element (id="shopping-list-export-target"). */
export async function downloadImage(items: ShoppingItem[]): Promise<void> {
  const el = document.getElementById("shopping-list-export-target");
  if (!el) throw new Error("Export target element not found");
  const { default: html2canvas } = await import("html2canvas");
  const canvas = await html2canvas(el, { backgroundColor: "#1A0E06", useCORS: true });
  const url = canvas.toDataURL("image/png");
  const a = document.createElement("a");
  a.href = url;
  a.download = `shopping-list-${Date.now()}.png`;
  a.click();
}

/** Share via Web Share API; falls back to clipboard. */
export async function shareList(items: ShoppingItem[], mode: SortMode): Promise<void> {
  const text = toPlainText(items, mode);
  if (navigator.share) {
    await navigator.share({ title: "My Shopping List", text });
  } else {
    await navigator.clipboard.writeText(text);
    alert("Shopping list copied to clipboard!");
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/shopping-list-export.ts
git commit -m "feat(shopping): add txt/PDF/image/share export utilities"
```

---

### Task B3: Add export button and bottom sheet to shopping list UI

**Files:**
- Modify: `src/app/(app)/shopping-list/shopping-list-client.tsx`

- [ ] **Step 1: Add the share button and bottom sheet**

At the top of the file add these imports after the existing ones:

```tsx
import { Share2, FileText, FileImage, Printer, X as XIcon } from "lucide-react";
import { downloadTxt, downloadPdf, downloadImage, shareList } from "@/lib/shopping-list-export";
```

Add state inside `ShoppingListClient`:

```tsx
const [showExport, setShowExport] = useState(false);
const [exporting, setExporting] = useState<string | null>(null);
```

Add handlers inside `ShoppingListClient` (after `handleClearChecked`):

```tsx
const handleExport = useCallback(async (format: string) => {
  setExporting(format);
  try {
    if (format === "txt")   downloadTxt(items, sortMode);
    if (format === "pdf")   await downloadPdf(items, sortMode);
    if (format === "image") await downloadImage(items);
    if (format === "share") await shareList(items, sortMode);
  } catch (e) {
    console.error(e);
  } finally {
    setExporting(null);
    setShowExport(false);
  }
}, [items, sortMode]);
```

In the header row, add a Share button before the "Clear done" button:

```tsx
<button
  onClick={() => setShowExport(true)}
  className="ml-auto flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full transition-all hover:opacity-80"
  style={{ background: "rgba(42,24,8,0.6)", border: "1px solid rgba(58,36,22,0.6)", color: "#8A6A4A" }}
  aria-label="Export / Share"
>
  <Share2 style={{ width: 11, height: 11 }} />
  Share
</button>
```

Add the bottom sheet at the bottom of the return statement (before the closing `</div></div>`):

```tsx
{showExport && (
  <div
    className="fixed inset-0 z-50 flex items-end justify-center"
    style={{ background: "rgba(0,0,0,0.6)" }}
    onClick={() => setShowExport(false)}
  >
    <div
      className="w-full max-w-md rounded-t-3xl p-6 flex flex-col gap-3"
      style={{ background: "#1C1209", border: "1px solid #3A2416" }}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-center justify-between mb-1">
        <p className="text-sm font-bold" style={{ color: "#EFE3CE" }}>Share / Export</p>
        <button onClick={() => setShowExport(false)} aria-label="Close">
          <XIcon style={{ width: 16, height: 16, color: "#6B4E36" }} />
        </button>
      </div>
      {[
        { key: "share",  label: "Share (OS share sheet)", Icon: Share2 },
        { key: "txt",    label: "Plain text (.txt)",      Icon: FileText },
        { key: "pdf",    label: "PDF",                    Icon: Printer },
        { key: "image",  label: "Image (.png)",           Icon: FileImage },
      ].map(({ key, label, Icon }) => (
        <button
          key={key}
          onClick={() => handleExport(key)}
          disabled={!!exporting}
          className="flex items-center gap-3 px-4 py-3 rounded-2xl transition-all hover:opacity-80 disabled:opacity-40"
          style={{ background: "rgba(176,125,86,0.1)", border: "1px solid rgba(176,125,86,0.2)", color: "#EFE3CE" }}
        >
          <Icon style={{ width: 18, height: 18, color: "#B07D56" }} />
          <span className="text-sm">{exporting === key ? "Working…" : label}</span>
        </button>
      ))}
    </div>
  </div>
)}
```

Wrap the main content div with an id for html2canvas:

```tsx
<div id="shopping-list-export-target" className="max-w-xl mx-auto flex flex-col gap-6">
```

- [ ] **Step 2: Type-check**

```bash
cd /c/Users/lasse/Desktop/whatscooking && npx tsc --noEmit 2>&1 | head -30
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/app/\(app\)/shopping-list/shopping-list-client.tsx
git commit -m "feat(shopping): add Share/Export bottom sheet with txt, PDF, image, OS share"
```

---

## Phase C — Collaborative Kitchen

### Task C1: Supabase schema migration

**Files:**
- Create: `supabase/migrations/20260427_collaborative_kitchen.sql`

- [ ] **Step 1: Create migration file**

```sql
-- Enable pgcrypto for gen_random_bytes if not already enabled
create extension if not exists pgcrypto;

-- ── Kitchen Groups ────────────────────────────────────────────
create table kitchen_groups (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  created_by  uuid references auth.users not null,
  created_at  timestamptz default now()
);

alter table kitchen_groups enable row level security;

create policy "Members can read their groups"
  on kitchen_groups for select
  using (
    exists (
      select 1 from kitchen_group_members
      where kitchen_group_members.group_id = kitchen_groups.id
        and kitchen_group_members.user_id = auth.uid()
    )
  );

create policy "Authenticated users can create groups"
  on kitchen_groups for insert
  with check (auth.uid() = created_by);

create policy "Owners can update/delete their groups"
  on kitchen_groups for update using (auth.uid() = created_by);

create policy "Owners can delete their groups"
  on kitchen_groups for delete using (auth.uid() = created_by);

-- ── Group Members ─────────────────────────────────────────────
create table kitchen_group_members (
  id         uuid primary key default gen_random_uuid(),
  group_id   uuid references kitchen_groups on delete cascade not null,
  user_id    uuid references auth.users on delete cascade not null,
  role       text check (role in ('owner', 'member')) default 'member',
  joined_at  timestamptz default now(),
  unique(group_id, user_id)
);

alter table kitchen_group_members enable row level security;

create policy "Members can read group membership"
  on kitchen_group_members for select
  using (
    exists (
      select 1 from kitchen_group_members m2
      where m2.group_id = kitchen_group_members.group_id
        and m2.user_id = auth.uid()
    )
  );

create policy "Users can insert themselves"
  on kitchen_group_members for insert
  with check (auth.uid() = user_id);

create policy "Owners can remove members"
  on kitchen_group_members for delete
  using (
    auth.uid() = user_id or
    exists (
      select 1 from kitchen_group_members m2
      where m2.group_id = kitchen_group_members.group_id
        and m2.user_id = auth.uid()
        and m2.role = 'owner'
    )
  );

-- ── Personal Shopping Items (replaces localStorage) ───────────
create table personal_shopping_items (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid references auth.users on delete cascade not null,
  name         text not null,
  amount       text,
  unit         text,
  recipe_title text,
  category_id  uuid references ingredient_categories,
  checked      boolean default false,
  updated_at   timestamptz default now()
);

alter table personal_shopping_items enable row level security;

create policy "Users own their personal shopping items"
  on personal_shopping_items for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ── Group Shopping Items (real-time shared list) ──────────────
create table group_shopping_items (
  id           uuid primary key default gen_random_uuid(),
  group_id     uuid references kitchen_groups on delete cascade not null,
  added_by     uuid references auth.users,
  name         text not null,
  amount       text,
  unit         text,
  recipe_title text,
  category_id  uuid references ingredient_categories,
  checked      boolean default false,
  checked_by   uuid references auth.users,
  updated_at   timestamptz default now()
);

alter table group_shopping_items enable row level security;

create policy "Group members can read group shopping items"
  on group_shopping_items for select
  using (
    exists (
      select 1 from kitchen_group_members
      where kitchen_group_members.group_id = group_shopping_items.group_id
        and kitchen_group_members.user_id = auth.uid()
    )
  );

create policy "Group members can insert group shopping items"
  on group_shopping_items for insert
  with check (
    exists (
      select 1 from kitchen_group_members
      where kitchen_group_members.group_id = group_shopping_items.group_id
        and kitchen_group_members.user_id = auth.uid()
    )
  );

create policy "Group members can update group shopping items"
  on group_shopping_items for update
  using (
    exists (
      select 1 from kitchen_group_members
      where kitchen_group_members.group_id = group_shopping_items.group_id
        and kitchen_group_members.user_id = auth.uid()
    )
  );

create policy "Group members can delete group shopping items"
  on group_shopping_items for delete
  using (
    exists (
      select 1 from kitchen_group_members
      where kitchen_group_members.group_id = group_shopping_items.group_id
        and kitchen_group_members.user_id = auth.uid()
    )
  );

-- ── Group Invites ─────────────────────────────────────────────
create table kitchen_group_invites (
  id             uuid primary key default gen_random_uuid(),
  group_id       uuid references kitchen_groups on delete cascade not null,
  created_by     uuid references auth.users not null,
  invited_email  text,
  token          text unique default encode(gen_random_bytes(32), 'hex'),
  expires_at     timestamptz default now() + interval '7 days',
  accepted_at    timestamptz
);

alter table kitchen_group_invites enable row level security;

create policy "Anyone with token can read an invite"
  on kitchen_group_invites for select
  using (true);

create policy "Group members can create invites"
  on kitchen_group_invites for insert
  with check (
    exists (
      select 1 from kitchen_group_members
      where kitchen_group_members.group_id = kitchen_group_invites.group_id
        and kitchen_group_members.user_id = auth.uid()
    )
  );

create policy "Invite creator can update (mark accepted)"
  on kitchen_group_invites for update
  using (true);

-- Enable Realtime on group_shopping_items
alter publication supabase_realtime add table group_shopping_items;
```

- [ ] **Step 2: Apply migration**

```bash
cd /c/Users/lasse/Desktop/whatscooking && npx supabase db push
```

If the Supabase CLI is not installed locally, apply the SQL directly in the Supabase Dashboard → SQL Editor.

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/20260427_collaborative_kitchen.sql
git commit -m "feat(db): add kitchen groups, shared/personal shopping, invite schema"
```

---

### Task C2: Add types for collaborative kitchen

**Files:**
- Modify: `src/lib/types.ts`

- [ ] **Step 1: Append new types at the end of `src/lib/types.ts`**

```ts
// ============================================================
// Collaborative Kitchen
// ============================================================

export interface KitchenGroup {
  id: string;
  name: string;
  created_by: string;
  created_at: string;
  members?: KitchenGroupMember[];
}

export interface KitchenGroupMember {
  id: string;
  group_id: string;
  user_id: string;
  role: "owner" | "member";
  joined_at: string;
  profile?: { full_name?: string; avatar_url?: string };
}

export interface PersonalShoppingItem {
  id: string;
  user_id: string;
  name: string;
  amount?: string;
  unit?: string;
  recipe_title?: string;
  category_id?: string;
  category_name?: string;
  checked: boolean;
  updated_at: string;
}

export interface GroupShoppingItem {
  id: string;
  group_id: string;
  added_by: string;
  name: string;
  amount?: string;
  unit?: string;
  recipe_title?: string;
  category_id?: string;
  category_name?: string;
  checked: boolean;
  checked_by?: string;
  updated_at: string;
  added_by_profile?: { full_name?: string; avatar_url?: string };
}

export interface KitchenGroupInvite {
  id: string;
  group_id: string;
  created_by: string;
  invited_email?: string;
  token: string;
  expires_at: string;
  accepted_at?: string;
  group?: KitchenGroup;
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/types.ts
git commit -m "feat(types): add KitchenGroup, GroupShoppingItem, PersonalShoppingItem types"
```

---

### Task C3: Kitchen context provider

**Files:**
- Create: `src/lib/kitchen-context.tsx`

This provider holds which context is active (personal vs. a group) and is consumed by the pantry and shopping list pages.

- [ ] **Step 1: Create the file**

```tsx
"use client";

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import type { KitchenGroup } from "./types";

const CONTEXT_KEY = "wc_kitchen_context_v1";

type KitchenContextValue = {
  activeGroupId: string | null; // null = personal
  activeGroup: KitchenGroup | null;
  groups: KitchenGroup[];
  setActiveGroup: (group: KitchenGroup | null) => void;
  setGroups: (groups: KitchenGroup[]) => void;
};

const KitchenContext = createContext<KitchenContextValue>({
  activeGroupId: null,
  activeGroup: null,
  groups: [],
  setActiveGroup: () => {},
  setGroups: () => {},
});

export function KitchenContextProvider({ children }: { children: ReactNode }) {
  const [activeGroup, setActiveGroupState] = useState<KitchenGroup | null>(null);
  const [groups, setGroups] = useState<KitchenGroup[]>([]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(CONTEXT_KEY);
      if (saved) setActiveGroupState(JSON.parse(saved));
    } catch {}
  }, []);

  const setActiveGroup = useCallback((group: KitchenGroup | null) => {
    setActiveGroupState(group);
    try {
      if (group) localStorage.setItem(CONTEXT_KEY, JSON.stringify(group));
      else localStorage.removeItem(CONTEXT_KEY);
    } catch {}
  }, []);

  return (
    <KitchenContext.Provider
      value={{
        activeGroupId: activeGroup?.id ?? null,
        activeGroup,
        groups,
        setActiveGroup,
        setGroups,
      }}
    >
      {children}
    </KitchenContext.Provider>
  );
}

export function useKitchenContext() {
  return useContext(KitchenContext);
}
```

- [ ] **Step 2: Wrap the app layout with the provider**

Open `src/app/(app)/layout.tsx` (or the nearest wrapping layout). Import and add `KitchenContextProvider`:

```tsx
import { KitchenContextProvider } from "@/lib/kitchen-context";

// Inside the return:
<KitchenContextProvider>
  {children}
</KitchenContextProvider>
```

- [ ] **Step 3: Commit**

```bash
git add src/lib/kitchen-context.tsx src/app/\(app\)/layout.tsx
git commit -m "feat(context): add KitchenContextProvider for personal/group switching"
```

---

### Task C4: Groups API routes

**Files:**
- Create: `src/app/api/groups/route.ts`
- Create: `src/app/api/groups/[id]/members/route.ts`
- Create: `src/app/api/groups/[id]/shopping/route.ts`
- Create: `src/app/api/invite/[token]/route.ts`

- [ ] **Step 1: Create `src/app/api/groups/route.ts`**

```ts
import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

// GET /api/groups — list all groups the current user belongs to
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await supabase
    .from("kitchen_group_members")
    .select("group_id, role, kitchen_groups(id, name, created_by, created_at)")
    .eq("user_id", user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const groups = (data ?? []).map((row: any) => ({ ...row.kitchen_groups, role: row.role }));
  return NextResponse.json({ groups });
}

// POST /api/groups — create a new group
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { name } = await req.json();
  if (!name?.trim()) return NextResponse.json({ error: "name required" }, { status: 400 });

  const { data: group, error: groupErr } = await supabase
    .from("kitchen_groups")
    .insert({ name: name.trim(), created_by: user.id })
    .select()
    .single();

  if (groupErr) return NextResponse.json({ error: groupErr.message }, { status: 500 });

  // Add creator as owner
  await supabase.from("kitchen_group_members").insert({
    group_id: group.id,
    user_id: user.id,
    role: "owner",
  });

  return NextResponse.json({ group });
}
```

- [ ] **Step 2: Create `src/app/api/groups/[id]/members/route.ts`**

```ts
import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

// GET /api/groups/[id]/members — list members with profile data
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: groupId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await supabase
    .from("kitchen_group_members")
    .select("id, group_id, user_id, role, joined_at, profiles(full_name, avatar_url)")
    .eq("group_id", groupId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ members: data });
}

// DELETE /api/groups/[id]/members?user_id=... — remove a member (or self-leave)
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: groupId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const targetUserId = new URL(req.url).searchParams.get("user_id") ?? user.id;

  const { error } = await supabase
    .from("kitchen_group_members")
    .delete()
    .eq("group_id", groupId)
    .eq("user_id", targetUserId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 3: Create `src/app/api/groups/[id]/shopping/route.ts`**

```ts
import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

// GET /api/groups/[id]/shopping — fetch all items for the group
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: groupId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await supabase
    .from("group_shopping_items")
    .select("*, added_by_profile:profiles!added_by(full_name, avatar_url)")
    .eq("group_id", groupId)
    .order("updated_at", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ items: data });
}

// POST /api/groups/[id]/shopping — add an item
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: groupId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { name, amount, unit, recipe_title, category_id } = body;
  if (!name?.trim()) return NextResponse.json({ error: "name required" }, { status: 400 });

  const { data, error } = await supabase
    .from("group_shopping_items")
    .insert({ group_id: groupId, added_by: user.id, name: name.trim(), amount, unit, recipe_title, category_id })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ item: data });
}

// PATCH /api/groups/[id]/shopping — toggle checked
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: groupId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { item_id, checked } = await req.json();

  const { data, error } = await supabase
    .from("group_shopping_items")
    .update({ checked, checked_by: checked ? user.id : null, updated_at: new Date().toISOString() })
    .eq("id", item_id)
    .eq("group_id", groupId)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ item: data });
}

// DELETE /api/groups/[id]/shopping?item_id=... — remove an item
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: groupId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const itemId = new URL(req.url).searchParams.get("item_id");
  if (!itemId) return NextResponse.json({ error: "item_id required" }, { status: 400 });

  const { error } = await supabase
    .from("group_shopping_items")
    .delete()
    .eq("id", itemId)
    .eq("group_id", groupId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 4: Create `src/app/api/invite/[token]/route.ts`**

```ts
import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

// GET /api/invite/[token] — look up invite info (public, no auth required)
export async function GET(_req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("kitchen_group_invites")
    .select("id, group_id, expires_at, accepted_at, kitchen_groups(id, name)")
    .eq("token", token)
    .single();

  if (error || !data) return NextResponse.json({ error: "Invite not found" }, { status: 404 });
  if (data.accepted_at) return NextResponse.json({ error: "Invite already used" }, { status: 410 });
  if (new Date(data.expires_at) < new Date()) return NextResponse.json({ error: "Invite expired" }, { status: 410 });

  return NextResponse.json({ invite: data });
}

// POST /api/invite/[token] — accept invite (auth required)
export async function POST(_req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: invite, error } = await supabase
    .from("kitchen_group_invites")
    .select("id, group_id, expires_at, accepted_at")
    .eq("token", token)
    .single();

  if (error || !invite) return NextResponse.json({ error: "Invite not found" }, { status: 404 });
  if (invite.accepted_at) return NextResponse.json({ error: "Invite already used" }, { status: 410 });
  if (new Date(invite.expires_at) < new Date()) return NextResponse.json({ error: "Invite expired" }, { status: 410 });

  // Add user to group (upsert — if already a member, this is a no-op due to unique constraint)
  await supabase.from("kitchen_group_members").upsert({
    group_id: invite.group_id,
    user_id: user.id,
    role: "member",
  }, { onConflict: "group_id,user_id" });

  // Mark invite accepted
  await supabase.from("kitchen_group_invites").update({ accepted_at: new Date().toISOString() }).eq("id", invite.id);

  return NextResponse.json({ ok: true, group_id: invite.group_id });
}
```

- [ ] **Step 5: Also create personal shopping API route**

Create `src/app/api/shopping/personal/route.ts`:

```ts
import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

// GET — fetch all personal shopping items
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await supabase
    .from("personal_shopping_items")
    .select("*")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ items: data });
}

// POST — add item
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { name, amount, unit, recipe_title, category_id } = await req.json();
  if (!name?.trim()) return NextResponse.json({ error: "name required" }, { status: 400 });

  const { data, error } = await supabase
    .from("personal_shopping_items")
    .insert({ user_id: user.id, name: name.trim(), amount, unit, recipe_title, category_id })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ item: data });
}

// PATCH — toggle checked
export async function PATCH(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { item_id, checked } = await req.json();
  const { data, error } = await supabase
    .from("personal_shopping_items")
    .update({ checked, updated_at: new Date().toISOString() })
    .eq("id", item_id)
    .eq("user_id", user.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ item: data });
}

// DELETE — remove item
export async function DELETE(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const itemId = new URL(req.url).searchParams.get("item_id");
  if (!itemId) return NextResponse.json({ error: "item_id required" }, { status: 400 });

  const { error } = await supabase
    .from("personal_shopping_items")
    .delete()
    .eq("id", itemId)
    .eq("user_id", user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 6: Commit**

```bash
git add src/app/api/groups/ src/app/api/invite/ src/app/api/shopping/
git commit -m "feat(api): add groups, personal shopping, and invite API routes"
```

---

### Task C5: localStorage → Supabase migration + personal shopping list hook

**Files:**
- Create: `src/lib/personal-shopping.ts`

- [ ] **Step 1: Create the file**

```ts
"use client";

import type { PersonalShoppingItem } from "./types";

const MIGRATED_KEY = "wc_shopping_migrated_v1";

/**
 * On first run after deploy, migrate existing localStorage shopping list to Supabase.
 * Idempotent — won't re-migrate if already done.
 */
export async function migrateLocalStorageToSupabase(): Promise<void> {
  try {
    if (localStorage.getItem(MIGRATED_KEY)) return;
    const raw = localStorage.getItem("wc_shopping_list_v1");
    if (!raw) { localStorage.setItem(MIGRATED_KEY, "1"); return; }
    const items = JSON.parse(raw) as Array<{
      name: string; amount?: string; unit?: string; recipeTitle?: string;
    }>;
    if (items.length === 0) { localStorage.setItem(MIGRATED_KEY, "1"); return; }

    await fetch("/api/shopping/personal/migrate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items }),
    });

    localStorage.setItem(MIGRATED_KEY, "1");
  } catch {}
}

export async function fetchPersonalItems(): Promise<PersonalShoppingItem[]> {
  const res = await fetch("/api/shopping/personal");
  if (!res.ok) return [];
  const { items } = await res.json();
  return items ?? [];
}

export async function addPersonalItem(
  item: Pick<PersonalShoppingItem, "name" | "amount" | "unit" | "recipe_title" | "category_id">,
): Promise<PersonalShoppingItem | null> {
  const res = await fetch("/api/shopping/personal", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(item),
  });
  if (!res.ok) return null;
  return (await res.json()).item;
}

export async function togglePersonalItem(item_id: string, checked: boolean): Promise<void> {
  await fetch("/api/shopping/personal", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ item_id, checked }),
  });
}

export async function removePersonalItem(item_id: string): Promise<void> {
  await fetch(`/api/shopping/personal?item_id=${item_id}`, { method: "DELETE" });
}
```

- [ ] **Step 2: Create the migration API route**

Create `src/app/api/shopping/personal/migrate/route.ts`:

```ts
import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

// POST — bulk upsert from localStorage migration
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { items } = await req.json();
  if (!Array.isArray(items)) return NextResponse.json({ error: "items array required" }, { status: 400 });

  const rows = items
    .filter((i: any) => i.name?.trim())
    .map((i: any) => ({
      user_id: user.id,
      name: i.name.trim(),
      amount: i.amount ?? null,
      unit: i.unit ?? null,
      recipe_title: i.recipeTitle ?? null,
      checked: i.checked ?? false,
    }));

  if (rows.length === 0) return NextResponse.json({ ok: true });

  const { error } = await supabase.from("personal_shopping_items").upsert(rows, {
    onConflict: "user_id,name",
    ignoreDuplicates: true,
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, migrated: rows.length });
}
```

- [ ] **Step 3: Commit**

```bash
git add src/lib/personal-shopping.ts src/app/api/shopping/
git commit -m "feat(shopping): migrate localStorage to Supabase on first load"
```

---

### Task C6: Group shopping list hook with real-time

**Files:**
- Create: `src/lib/group-shopping.ts`

- [ ] **Step 1: Create the file**

```ts
"use client";

import { createClient } from "@/lib/supabase/client";
import type { GroupShoppingItem } from "./types";

export async function fetchGroupItems(groupId: string): Promise<GroupShoppingItem[]> {
  const res = await fetch(`/api/groups/${groupId}/shopping`);
  if (!res.ok) return [];
  const { items } = await res.json();
  return items ?? [];
}

export async function addGroupItem(
  groupId: string,
  item: Pick<GroupShoppingItem, "name" | "amount" | "unit" | "recipe_title" | "category_id">,
): Promise<GroupShoppingItem | null> {
  const res = await fetch(`/api/groups/${groupId}/shopping`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(item),
  });
  if (!res.ok) return null;
  return (await res.json()).item;
}

export async function toggleGroupItem(groupId: string, itemId: string, checked: boolean): Promise<void> {
  await fetch(`/api/groups/${groupId}/shopping`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ item_id: itemId, checked }),
  });
}

export async function removeGroupItem(groupId: string, itemId: string): Promise<void> {
  await fetch(`/api/groups/${groupId}/shopping?item_id=${itemId}`, { method: "DELETE" });
}

type ChangeHandler = (payload: { eventType: "INSERT" | "UPDATE" | "DELETE"; new: GroupShoppingItem; old: { id: string } }) => void;

/**
 * Subscribe to real-time changes on group_shopping_items for a given group.
 * Returns an unsubscribe function.
 */
export function subscribeToGroupShopping(groupId: string, onChange: ChangeHandler): () => void {
  const supabase = createClient();
  const channel = supabase
    .channel(`group-shopping:${groupId}`)
    .on(
      "postgres_changes" as any,
      {
        event: "*",
        schema: "public",
        table: "group_shopping_items",
        filter: `group_id=eq.${groupId}`,
      },
      (payload: any) => onChange(payload),
    )
    .subscribe();

  return () => { supabase.removeChannel(channel); };
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/group-shopping.ts
git commit -m "feat(shopping): add group shopping helpers + Supabase Realtime subscription"
```

---

### Task C7: Group management UI page

**Files:**
- Create: `src/app/(app)/groups/page.tsx`

- [ ] **Step 1: Create the page**

```tsx
import { createClient } from "@/lib/supabase/server";
import { GroupsClient } from "./groups-client";

export default async function GroupsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return <GroupsClient userId={user?.id ?? ""} />;
}
```

- [ ] **Step 2: Create `src/app/(app)/groups/groups-client.tsx`**

```tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { Users, Plus, Link, LogOut, Trash2, Copy } from "lucide-react";
import type { KitchenGroup, KitchenGroupMember } from "@/lib/types";
import { useKitchenContext } from "@/lib/kitchen-context";

export function GroupsClient({ userId }: { userId: string }) {
  const { groups, setGroups, setActiveGroup } = useKitchenContext();
  const [newGroupName, setNewGroupName] = useState("");
  const [creating, setCreating] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<KitchenGroup | null>(null);
  const [members, setMembers] = useState<KitchenGroupMember[]>([]);
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const loadGroups = useCallback(async () => {
    const res = await fetch("/api/groups");
    if (res.ok) {
      const { groups: g } = await res.json();
      setGroups(g ?? []);
    }
  }, [setGroups]);

  useEffect(() => { loadGroups(); }, [loadGroups]);

  const handleCreate = useCallback(async () => {
    const name = newGroupName.trim();
    if (!name) return;
    setCreating(true);
    const res = await fetch("/api/groups", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    if (res.ok) {
      setNewGroupName("");
      await loadGroups();
    }
    setCreating(false);
  }, [newGroupName, loadGroups]);

  const loadMembers = useCallback(async (group: KitchenGroup) => {
    setSelectedGroup(group);
    setInviteLink(null);
    const res = await fetch(`/api/groups/${group.id}/members`);
    if (res.ok) {
      const { members: m } = await res.json();
      setMembers(m ?? []);
    }
  }, []);

  const handleGenerateInvite = useCallback(async () => {
    if (!selectedGroup) return;
    const res = await fetch(`/api/groups/${selectedGroup.id}/invite`, { method: "POST" });
    if (res.ok) {
      const { token } = await res.json();
      const link = `${window.location.origin}/invite/${token}`;
      setInviteLink(link);
    }
  }, [selectedGroup]);

  const handleCopy = useCallback(async () => {
    if (!inviteLink) return;
    await navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [inviteLink]);

  const handleLeave = useCallback(async (group: KitchenGroup) => {
    if (!confirm(`Leave "${group.name}"?`)) return;
    await fetch(`/api/groups/${group.id}/members?user_id=${userId}`, { method: "DELETE" });
    setActiveGroup(null);
    await loadGroups();
    setSelectedGroup(null);
  }, [userId, setActiveGroup, loadGroups]);

  return (
    <div className="min-h-screen px-4 py-8 sm:px-8" style={{ background: "var(--wc-bg-base, #1A0E06)" }}>
      <div className="max-w-xl mx-auto flex flex-col gap-6">

        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ background: "rgba(176,125,86,0.18)", border: "1px solid rgba(176,125,86,0.3)" }}>
            <Users style={{ width: 18, height: 18, color: "#B07D56" }} />
          </div>
          <div>
            <h1 className="text-xl font-bold" style={{ color: "#EFE3CE", fontFamily: "'Libre Baskerville', Georgia, serif" }}>Kitchen Groups</h1>
            <p className="text-xs" style={{ color: "#6B4E36" }}>Share pantry & shopping lists with your household</p>
          </div>
        </div>

        {/* Create group */}
        <div className="flex gap-2">
          <input
            value={newGroupName}
            onChange={(e) => setNewGroupName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleCreate()}
            placeholder="New group name (e.g. Household)…"
            className="flex-1 px-3 py-2 rounded-xl text-sm focus:outline-none placeholder:opacity-40"
            style={{ background: "#1C1209", border: "1px solid #3A2416", color: "#EFE3CE" }}
          />
          <button onClick={handleCreate} disabled={creating || !newGroupName.trim()} className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 disabled:opacity-30" style={{ background: "rgba(176,125,86,0.18)", border: "1px solid rgba(176,125,86,0.3)", color: "#B07D56" }}>
            <Plus style={{ width: 16, height: 16 }} />
          </button>
        </div>

        {/* Group list */}
        {groups.length === 0 && (
          <p className="text-sm text-center py-8" style={{ color: "#4A3020" }}>No groups yet. Create one above or accept an invite link.</p>
        )}

        {groups.map((group) => (
          <div key={group.id} className="rounded-2xl overflow-hidden" style={{ border: "1px solid rgba(42,24,8,0.6)", background: "rgba(26,16,8,0.6)" }}>
            <div className="flex items-center gap-3 px-4 py-3">
              <span className="flex-1 text-sm font-semibold" style={{ color: "#EFE3CE" }}>{group.name}</span>
              <button onClick={() => loadMembers(group)} className="text-xs px-2 py-1 rounded-lg hover:opacity-80" style={{ color: "#B07D56" }}>Manage</button>
              <button onClick={() => handleLeave(group)} className="hover:opacity-70" aria-label="Leave group">
                <LogOut style={{ width: 14, height: 14, color: "#5A3A28" }} />
              </button>
            </div>

            {selectedGroup?.id === group.id && (
              <div className="border-t px-4 py-4 flex flex-col gap-3" style={{ borderColor: "rgba(42,24,8,0.5)" }}>
                <p className="text-xs font-bold uppercase tracking-wider" style={{ color: "#6B4E36" }}>Members</p>
                {members.map((m) => (
                  <div key={m.id} className="flex items-center gap-2 text-sm" style={{ color: "#EFE3CE" }}>
                    <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold" style={{ background: "#3A2416", color: "#B07D56" }}>
                      {(m.profile?.full_name ?? "?")[0].toUpperCase()}
                    </div>
                    <span>{m.profile?.full_name ?? m.user_id.slice(0, 8)}</span>
                    <span className="text-xs ml-auto" style={{ color: "#5A3A28" }}>{m.role}</span>
                  </div>
                ))}

                <button onClick={handleGenerateInvite} className="flex items-center gap-2 text-xs px-3 py-2 rounded-xl mt-1 hover:opacity-80" style={{ background: "rgba(176,125,86,0.1)", border: "1px solid rgba(176,125,86,0.2)", color: "#B07D56" }}>
                  <Link style={{ width: 12, height: 12 }} />
                  Generate invite link
                </button>

                {inviteLink && (
                  <div className="flex items-center gap-2">
                    <input readOnly value={inviteLink} className="flex-1 px-2 py-1 rounded-lg text-xs" style={{ background: "#1C1209", border: "1px solid #3A2416", color: "#8A6A4A" }} />
                    <button onClick={handleCopy} className="text-xs px-2 py-1 rounded-lg hover:opacity-80" style={{ color: "#B07D56" }}>
                      {copied ? "Copied!" : <Copy style={{ width: 12, height: 12 }} />}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Add invite generation endpoint**

Create `src/app/api/groups/[id]/invite/route.ts`:

```ts
import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

// POST /api/groups/[id]/invite — generate an invite token
export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: groupId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await supabase
    .from("kitchen_group_invites")
    .insert({ group_id: groupId, created_by: user.id })
    .select("token")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ token: data.token });
}
```

- [ ] **Step 4: Commit**

```bash
git add src/app/\(app\)/groups/ src/app/api/groups/
git commit -m "feat(groups): add group management UI and invite generation"
```

---

### Task C8: Invite acceptance page

**Files:**
- Create: `src/app/invite/[token]/page.tsx`

- [ ] **Step 1: Create the page**

```tsx
import { InviteClient } from "./invite-client";

export default async function InvitePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return <InviteClient token={token} />;
}
```

- [ ] **Step 2: Create `src/app/invite/[token]/invite-client.tsx`**

```tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import type { KitchenGroupInvite } from "@/lib/types";

export function InviteClient({ token }: { token: string }) {
  const router = useRouter();
  const [invite, setInvite] = useState<KitchenGroupInvite | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error" | "success">("loading");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    fetch(`/api/invite/${token}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.error) { setErrorMsg(d.error); setStatus("error"); }
        else { setInvite(d.invite); setStatus("ready"); }
      })
      .catch(() => { setErrorMsg("Failed to load invite"); setStatus("error"); });
  }, [token]);

  const handleAccept = async () => {
    setStatus("loading");
    const res = await fetch(`/api/invite/${token}`, { method: "POST" });
    const data = await res.json();
    if (data.error) { setErrorMsg(data.error); setStatus("error"); return; }
    setStatus("success");
    setTimeout(() => router.push("/shopping-list"), 1500);
  };

  const groupName = (invite as any)?.kitchen_groups?.name ?? "a household";

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: "#1A0E06" }}>
      <div className="max-w-sm w-full rounded-3xl p-8 flex flex-col gap-5 text-center" style={{ background: "rgba(26,16,8,0.9)", border: "1px solid rgba(176,125,86,0.2)" }}>
        <h1 className="text-2xl font-bold" style={{ color: "#EFE3CE", fontFamily: "'Libre Baskerville', Georgia, serif" }}>
          Kitchen Invite
        </h1>

        {status === "loading" && <p style={{ color: "#6B4E36" }}>Loading…</p>}

        {status === "error" && (
          <p className="text-sm" style={{ color: "#C85A2F" }}>{errorMsg}</p>
        )}

        {status === "ready" && (
          <>
            <p className="text-sm" style={{ color: "#EFE3CE" }}>
              You've been invited to join <strong style={{ color: "#B07D56" }}>{groupName}</strong> — share pantry and shopping lists in real time.
            </p>
            <button
              onClick={handleAccept}
              className="py-3 rounded-2xl text-sm font-bold transition-all hover:opacity-90"
              style={{ background: "#B07D56", color: "#1A0E06" }}
            >
              Accept & Join
            </button>
            <button onClick={() => router.push("/")} className="text-xs" style={{ color: "#5A3A28" }}>
              Decline
            </button>
          </>
        )}

        {status === "success" && (
          <p className="text-sm" style={{ color: "#828E6F" }}>You joined {groupName}! Redirecting…</p>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add src/app/invite/
git commit -m "feat(invite): add invite acceptance page"
```

---

### Task C9: Context switcher pill in Shopping List + real-time group mode

**Files:**
- Modify: `src/app/(app)/shopping-list/shopping-list-client.tsx`

The shopping list now supports two data modes: personal (Supabase `personal_shopping_items`) and group (Supabase `group_shopping_items` with Realtime). Add the switcher and wire up both modes.

- [ ] **Step 1: Add imports and group-mode state**

At the top of the file, add:

```tsx
import { useKitchenContext } from "@/lib/kitchen-context";
import {
  fetchPersonalItems, addPersonalItem, togglePersonalItem,
  removePersonalItem, migrateLocalStorageToSupabase,
} from "@/lib/personal-shopping";
import {
  fetchGroupItems, addGroupItem, toggleGroupItem,
  removeGroupItem, subscribeToGroupShopping,
} from "@/lib/group-shopping";
import type { PersonalShoppingItem, GroupShoppingItem } from "@/lib/types";
```

- [ ] **Step 2: Replace the `useEffect` and handler logic**

The component now branches on `activeGroupId`. Replace the existing `useEffect` block and all handlers with:

```tsx
const { activeGroupId, activeGroup, groups, setActiveGroup } = useKitchenContext();

// On mount: run migration once, then load items for current context
useEffect(() => {
  migrateLocalStorageToSupabase().then(() => reloadItems());
  setSortMode(loadSortMode());
  try { setNotes(localStorage.getItem(NOTES_KEY) ?? ""); } catch {}
}, []);

// Reload whenever context changes
useEffect(() => { reloadItems(); }, [activeGroupId]);

// Real-time subscription for group mode
useEffect(() => {
  if (!activeGroupId) return;
  const unsub = subscribeToGroupShopping(activeGroupId, (payload) => {
    if (payload.eventType === "INSERT") {
      setItems((prev) => [...prev, payload.new as any]);
    } else if (payload.eventType === "UPDATE") {
      setItems((prev) => prev.map((i) => i.id === payload.new.id ? payload.new as any : i));
    } else if (payload.eventType === "DELETE") {
      setItems((prev) => prev.filter((i) => i.id !== payload.old.id));
    }
  });
  return unsub;
}, [activeGroupId]);

const reloadItems = useCallback(async () => {
  if (activeGroupId) {
    const groupItems = await fetchGroupItems(activeGroupId);
    setItems(groupItems as any[]);
  } else {
    const personal = await fetchPersonalItems();
    setItems(personal as any[]);
  }
}, [activeGroupId]);

const handleQuickAdd = useCallback(async () => {
  const name = quickAdd.trim();
  if (!name) return;
  if (activeGroupId) {
    const item = await addGroupItem(activeGroupId, { name, amount: undefined, unit: undefined, recipe_title: undefined, category_id: undefined });
    if (item) setItems((prev) => [...prev, item as any]);
  } else {
    const item = await addPersonalItem({ name, amount: undefined, unit: undefined, recipe_title: undefined, category_id: undefined });
    if (item) setItems((prev) => [...prev, item as any]);
  }
  setQuickAdd("");
}, [quickAdd, activeGroupId]);

const handleToggle = useCallback(async (id: string) => {
  const item = items.find((i) => i.id === id);
  if (!item) return;
  const next = !item.checked;
  setItems((prev) => prev.map((i) => i.id === id ? { ...i, checked: next } : i));
  if (activeGroupId) await toggleGroupItem(activeGroupId, id, next);
  else await togglePersonalItem(id, next);
}, [items, activeGroupId]);

const handleRemove = useCallback(async (id: string) => {
  setItems((prev) => prev.filter((i) => i.id !== id));
  if (activeGroupId) await removeGroupItem(activeGroupId, id);
  else await removePersonalItem(id);
}, [activeGroupId]);

const handleClearChecked = useCallback(async () => {
  const toRemove = items.filter((i) => i.checked);
  setItems((prev) => prev.filter((i) => !i.checked));
  for (const item of toRemove) {
    if (activeGroupId) await removeGroupItem(activeGroupId, item.id);
    else await removePersonalItem(item.id);
  }
}, [items, activeGroupId]);
```

- [ ] **Step 3: Add the context switcher pill above the sort toggle**

```tsx
{/* Context switcher */}
{groups.length > 0 && (
  <div className="flex gap-1.5 flex-wrap">
    <button
      onClick={() => setActiveGroup(null)}
      className="text-xs font-semibold px-3 py-1.5 rounded-full transition-all"
      style={{
        background: !activeGroupId ? "rgba(176,125,86,0.25)" : "rgba(42,24,8,0.4)",
        border: !activeGroupId ? "1px solid rgba(176,125,86,0.5)" : "1px solid rgba(42,24,8,0.5)",
        color: !activeGroupId ? "#B07D56" : "#6B4E36",
      }}
    >
      Personal
    </button>
    {groups.map((g) => (
      <button
        key={g.id}
        onClick={() => setActiveGroup(g)}
        className="text-xs font-semibold px-3 py-1.5 rounded-full transition-all"
        style={{
          background: activeGroupId === g.id ? "rgba(176,125,86,0.25)" : "rgba(42,24,8,0.4)",
          border: activeGroupId === g.id ? "1px solid rgba(176,125,86,0.5)" : "1px solid rgba(42,24,8,0.5)",
          color: activeGroupId === g.id ? "#B07D56" : "#6B4E36",
        }}
      >
        {g.name}
      </button>
    ))}
  </div>
)}
```

- [ ] **Step 4: Commit**

```bash
git add src/app/\(app\)/shopping-list/shopping-list-client.tsx
git commit -m "feat(shopping): wire personal/group context switching with real-time Realtime"
```

---

### Task C10: Merged group pantry view in Pantry page

**Files:**
- Modify: `src/app/(app)/pantry/pantry-client.tsx`

- [ ] **Step 1: Add group pantry fetching**

Add a new API route first: `src/app/api/groups/[id]/pantry/route.ts`:

```ts
import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

// GET /api/groups/[id]/pantry — merged pantry for all group members
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: groupId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Fetch all member user_ids for this group
  const { data: members, error: mErr } = await supabase
    .from("kitchen_group_members")
    .select("user_id, profiles(full_name, avatar_url)")
    .eq("group_id", groupId);

  if (mErr) return NextResponse.json({ error: mErr.message }, { status: 500 });

  const userIds = (members ?? []).map((m: any) => m.user_id);
  if (userIds.length === 0) return NextResponse.json({ items: [] });

  const { data: items, error: iErr } = await supabase
    .from("pantry_items")
    .select("*, category:ingredient_categories(id, name, emoji, color)")
    .in("user_id", userIds);

  if (iErr) return NextResponse.json({ error: iErr.message }, { status: 500 });

  // Attach member profile to each item
  const profileMap = new Map((members ?? []).map((m: any) => [m.user_id, m.profiles]));
  const enriched = (items ?? []).map((item: any) => ({
    ...item,
    owner_profile: profileMap.get(item.user_id) ?? null,
    is_mine: item.user_id === user.id,
  }));

  return NextResponse.json({ items: enriched });
}
```

- [ ] **Step 2: Add context switcher + group pantry to `pantry-client.tsx`**

At the top of the file add:

```tsx
import { useKitchenContext } from "@/lib/kitchen-context";
```

Inside `PantryClient` component add:

```tsx
const { activeGroupId, activeGroup, groups, setActiveGroup } = useKitchenContext();
const [groupItems, setGroupItems] = useState<any[]>([]);

useEffect(() => {
  if (activeGroupId) {
    fetch(`/api/groups/${activeGroupId}/pantry`)
      .then((r) => r.json())
      .then((d) => setGroupItems(d.items ?? []));
  } else {
    setGroupItems([]);
  }
}, [activeGroupId]);
```

Add the context switcher pill above the search bar (same pattern as Task C9 Step 3). In group mode, render `groupItems` (merged) instead of the personal `items` prop for the main list view. Items with `is_mine: false` should show an avatar initial badge and have their delete/add buttons disabled.

- [ ] **Step 3: Commit**

```bash
git add src/app/\(app\)/pantry/pantry-client.tsx src/app/api/groups/
git commit -m "feat(pantry): add merged group pantry view with owner avatars"
```

---

### Task C11: Push notifications (service worker + VAPID)

**Files:**
- Create: `public/sw.js`
- Create: `src/lib/push-notifications.ts`
- Create: `src/app/api/push/subscribe/route.ts`
- Create: `supabase/functions/notify-group-shopping/index.ts`

- [ ] **Step 1: Create service worker `public/sw.js`**

```js
self.addEventListener("push", (event) => {
  const data = event.data?.json() ?? {};
  event.waitUntil(
    self.registration.showNotification(data.title ?? "What's Cooking", {
      body: data.body ?? "Your shopping list was updated.",
      icon: "/icon-192.png",
      badge: "/icon-96.png",
      data: { url: data.url ?? "/shopping-list" },
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(
    clients.openWindow(event.notification.data.url)
  );
});
```

- [ ] **Step 2: Generate VAPID keys**

```bash
npx web-push generate-vapid-keys
```

Save the output. Add to `.env.local`:
```
NEXT_PUBLIC_VAPID_PUBLIC_KEY=<public_key>
VAPID_PRIVATE_KEY=<private_key>
VAPID_SUBJECT=mailto:hello@whatscooking.app
```

- [ ] **Step 3: Install web-push**

```bash
npm install web-push
npm install --save-dev @types/web-push
```

- [ ] **Step 4: Create subscription storage table**

Add to the migration file (or run separately in Supabase Dashboard):

```sql
create table push_subscriptions (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references auth.users on delete cascade not null unique,
  subscription jsonb not null,
  updated_at  timestamptz default now()
);
alter table push_subscriptions enable row level security;
create policy "Users own their subscriptions"
  on push_subscriptions for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
```

- [ ] **Step 5: Create `src/lib/push-notifications.ts`**

```ts
"use client";

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!;

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

export async function registerPushNotifications(): Promise<boolean> {
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) return false;

  const permission = await Notification.requestPermission();
  if (permission !== "granted") return false;

  const reg = await navigator.serviceWorker.register("/sw.js");
  const subscription = await reg.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
  });

  await fetch("/api/push/subscribe", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(subscription),
  });

  return true;
}
```

- [ ] **Step 6: Create `src/app/api/push/subscribe/route.ts`**

```ts
import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const subscription = await req.json();

  await supabase.from("push_subscriptions").upsert(
    { user_id: user.id, subscription, updated_at: new Date().toISOString() },
    { onConflict: "user_id" },
  );

  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 7: Create Supabase Edge Function `supabase/functions/notify-group-shopping/index.ts`**

```ts
import webpush from "npm:web-push";

const VAPID_PUBLIC_KEY = Deno.env.get("VAPID_PUBLIC_KEY")!;
const VAPID_PRIVATE_KEY = Deno.env.get("VAPID_PRIVATE_KEY")!;
const VAPID_SUBJECT = Deno.env.get("VAPID_SUBJECT") ?? "mailto:hello@whatscooking.app";

webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

Deno.serve(async (req) => {
  const payload = await req.json();
  const record = payload.record ?? payload.new;
  if (!record) return new Response("no record", { status: 400 });

  const { group_id, added_by, name, id: item_id } = record;

  // Fetch group members
  const membersRes = await fetch(
    `${SUPABASE_URL}/rest/v1/kitchen_group_members?group_id=eq.${group_id}&select=user_id`,
    { headers: { apikey: SERVICE_ROLE_KEY, Authorization: `Bearer ${SERVICE_ROLE_KEY}` } },
  );
  const members: { user_id: string }[] = await membersRes.json();

  // Exclude the person who added the item
  const recipients = members.filter((m) => m.user_id !== added_by).map((m) => m.user_id);

  // Fetch sender profile
  const profileRes = await fetch(
    `${SUPABASE_URL}/rest/v1/profiles?id=eq.${added_by}&select=full_name`,
    { headers: { apikey: SERVICE_ROLE_KEY, Authorization: `Bearer ${SERVICE_ROLE_KEY}` } },
  );
  const [profile] = await profileRes.json();
  const senderName = profile?.full_name ?? "Someone";

  if (recipients.length === 0) return new Response("no recipients", { status: 200 });

  // Fetch push subscriptions for recipients
  const inList = recipients.map((id) => `"${id}"`).join(",");
  const subRes = await fetch(
    `${SUPABASE_URL}/rest/v1/push_subscriptions?user_id=in.(${inList})&select=subscription`,
    { headers: { apikey: SERVICE_ROLE_KEY, Authorization: `Bearer ${SERVICE_ROLE_KEY}` } },
  );
  const subs: { subscription: webpush.PushSubscription }[] = await subRes.json();

  const notifPayload = JSON.stringify({
    title: "What's Cooking",
    body: `${senderName} added "${name}" to the shopping list`,
    url: "/shopping-list",
  });

  await Promise.all(
    subs.map((s) => webpush.sendNotification(s.subscription, notifPayload).catch(() => {}))
  );

  return new Response("ok");
});
```

- [ ] **Step 8: Deploy edge function**

```bash
npx supabase functions deploy notify-group-shopping --no-verify-jwt
```

Set the VAPID secrets on Supabase:
```bash
npx supabase secrets set VAPID_PUBLIC_KEY=<key> VAPID_PRIVATE_KEY=<key>
```

Create a database webhook in Supabase Dashboard → Database → Webhooks:
- Table: `group_shopping_items`
- Event: `INSERT`
- URL: `https://<project-ref>.supabase.co/functions/v1/notify-group-shopping`

- [ ] **Step 9: Call `registerPushNotifications()` when user joins a group**

In `invite-client.tsx`, after a successful accept:

```tsx
import { registerPushNotifications } from "@/lib/push-notifications";

// After handleAccept succeeds:
await registerPushNotifications();
```

- [ ] **Step 10: Commit**

```bash
git add public/sw.js src/lib/push-notifications.ts src/app/api/push/ supabase/functions/
git commit -m "feat(push): add service worker, VAPID push notifications, edge function"
```

---

## Self-Review Against Spec

| Spec requirement | Covered by |
|---|---|
| Sort by recipe / aisle / recipe+aisle | Tasks A1–A4 |
| Persist sort mode in localStorage | Task A2 (`saveSortMode`) |
| AI auto-categorize for missing categories | Task A3 |
| Export txt | Task B2 (`downloadTxt`) |
| Export PDF branded | Task B2 (`downloadPdf`) |
| Export image (html2canvas) | Task B2 (`downloadImage`) |
| OS share sheet + clipboard fallback | Task B2 (`shareList`) |
| Export uses active sort mode | Tasks B2–B3 (passes `sortMode`) |
| Bottom sheet UI for export | Task B3 |
| DB schema: kitchen_groups, members, shopping, invites | Task C1 |
| RLS policies for all tables | Task C1 |
| Supabase Realtime enabled on group_shopping_items | Task C1 |
| PersonalShoppingItem / GroupShoppingItem types | Task C2 |
| KitchenContextProvider | Task C3 |
| Groups CRUD API | Task C4 |
| Personal shopping API | Task C4 Step 5 |
| localStorage → Supabase migration | Task C5 |
| Real-time subscription hook | Task C6 |
| Group management UI + invite generation | Task C7 |
| Invite acceptance page | Task C8 |
| Context switcher in shopping list | Task C9 |
| Personal + group mode data switching | Task C9 |
| Merged group pantry view + owner avatars | Task C10 |
| Push notifications: service worker | Task C11 |
| Push: VAPID + subscription storage | Task C11 |
| Push: Edge Function + DB webhook | Task C11 |
| Push: register on group join | Task C11 Step 9 |
| In-app toasts on Realtime INSERT | (handled by Realtime handler in C9 — add a toast library call there if desired) |

**Note on in-app toasts:** The Realtime handler in Task C9 updates state but doesn't show a toast for other users' adds. After Task C9 is done, add this inside the `subscribeToGroupShopping` INSERT branch when `payload.new.added_by !== currentUserId`:
```tsx
// Simple in-app notification — no library needed
setToast(`${payload.new.added_by_profile?.full_name ?? "Someone"} added "${payload.new.name}"`);
```
And render a `toast` div that fades out after 3 seconds.
