# Image Controls (Crop + Chevron) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add admin-editable image crop (2D) + chevron switching to every image surface in What's Cooking, and retrofit Supabase persistence into VenturePath's existing crop feature.

**Architecture:** Global React context (`ImageControlsProvider`) at the root layout holds a single `CropEditorModal` rendered on demand. A `useImageControls` hook drives `currentIndex` + `cropPos` per image, with localStorage as the optimistic layer and Supabase as the durable layer. An `ImageWithControls` wrapper component uses a render-prop pattern so each call site keeps its own image renderer (RecipeImage / next/image / plain img).

**Tech Stack:** Next.js 15 App Router, React 19, Supabase (`@supabase/ssr`), TypeScript, Tailwind, Playwright (new).

---

## File Structure

### WC — create
- `src/lib/image-controls-context.tsx` — provider + context + `CropEditorModal`
- `src/lib/hooks/use-image-controls.ts` — hook
- `src/components/image-with-controls.tsx` — wrapper component (render-prop)
- `src/app/api/image-prefs/route.ts` — GET + POST endpoints
- `supabase/migrations/20260512_image_prefs.sql` — DB migration
- `playwright.config.ts` — Playwright config
- `tests/e2e/image-controls.spec.ts` — E2E tests

### WC — modify
- `src/lib/types.ts` — add `image_urls?: string[]` to Recipe
- `src/app/layout.tsx` — wrap children in `ImageControlsProvider`
- `src/app/(app)/recipes/[id]/recipe-hero-image.tsx`
- `src/components/recipe-card.tsx`
- `src/components/swipe/swipe-cards.tsx`
- `src/components/cookbook-cover.tsx`
- `src/app/(app)/cookbooks/[slug]/chapter/[chapterId]/page.tsx`
- `src/components/meal-photo-gallery.tsx`
- `src/app/(app)/discover/quick-easy-section.tsx`
- `src/app/(app)/saved/saved-client.tsx`
- `src/app/(app)/plans/[id]/saved-recipe-fit.tsx`

### VP — create
- `supabase/migrations/20260512_expedition_image_prefs.sql`

### VP — modify
- `src/hooks/useImagePositions.js` — add Supabase load/save

### Env vars (both apps)
- WC: `ADMIN_EMAIL` (server), `NEXT_PUBLIC_ADMIN_EMAIL` (client)
- VP: already uses `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY`

---

## Task 1: WC — DB migration

**Files:**
- Create: `supabase/migrations/20260512_image_prefs.sql`

- [ ] **Step 1: Write the migration**

```sql
-- supabase/migrations/20260512_image_prefs.sql

-- 1. Add alternate image URL array to recipes
ALTER TABLE recipes ADD COLUMN IF NOT EXISTS image_urls text[] NOT NULL DEFAULT '{}';

-- 2. Generic image preferences table (recipes, cookbooks, chapters)
CREATE TABLE IF NOT EXISTS image_prefs (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  entity_type  text NOT NULL CHECK (entity_type IN ('recipe','cookbook','chapter')),
  entity_id    text NOT NULL,
  image_url    text NOT NULL,
  x            float8 NOT NULL DEFAULT 50,
  y            float8 NOT NULL DEFAULT 50,
  updated_at   timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, entity_type, entity_id, image_url)
);

CREATE INDEX IF NOT EXISTS image_prefs_lookup_idx
  ON image_prefs (user_id, entity_type, entity_id);

-- 3. RLS — each user reads/writes only their own rows
ALTER TABLE image_prefs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users select own image_prefs"
  ON image_prefs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "users insert own image_prefs"
  ON image_prefs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users update own image_prefs"
  ON image_prefs FOR UPDATE
  USING (auth.uid() = user_id);
```

- [ ] **Step 2: Apply migration**

Run in Supabase SQL Editor (WC project), or via CLI:
```bash
cd C:/Users/lasse/Desktop/whatscooking
supabase db push
```
Expected: `image_prefs` table created, `recipes.image_urls` column added.

- [ ] **Step 3: Verify with a probe query**

In Supabase SQL Editor:
```sql
SELECT column_name, data_type FROM information_schema.columns
  WHERE table_name = 'recipes' AND column_name = 'image_urls';
SELECT * FROM image_prefs LIMIT 1;
```
Expected: column exists as `ARRAY`, table query returns 0 rows without error.

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/20260512_image_prefs.sql
git commit -m "feat(db): add image_urls column + image_prefs table with RLS"
```

---

## Task 2: WC — Update Recipe type

**Files:**
- Modify: `src/lib/types.ts` (Recipe interface around line 84)

- [ ] **Step 1: Add `image_urls` to the Recipe interface**

In `src/lib/types.ts`, find the line `image_url?: string;` inside the `Recipe` interface and add immediately below it:

```ts
  image_url?: string;
  image_urls?: string[];  // alternate images (admin-curated)
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd C:/Users/lasse/Desktop/whatscooking
npx tsc --noEmit
```
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/lib/types.ts
git commit -m "feat(types): add image_urls array to Recipe"
```

---

## Task 3: WC — `useImageControls` hook

**Files:**
- Create: `src/lib/hooks/use-image-controls.ts`

- [ ] **Step 1: Write the hook**

```ts
// src/lib/hooks/use-image-controls.ts
"use client";

import { useState, useEffect, useCallback, useContext, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { ImageControlsContext, type EntityType } from "@/lib/image-controls-context";

const DEFAULT_POS = { x: 50, y: 50 };

function localKey(entityId: string, imageUrl: string) {
  return `wc-img-prefs::${entityId}::${imageUrl}`;
}

function readLocal(entityId: string, imageUrl: string): { x: number; y: number } {
  if (typeof window === "undefined" || !imageUrl) return DEFAULT_POS;
  try {
    const raw = localStorage.getItem(localKey(entityId, imageUrl));
    if (!raw) return DEFAULT_POS;
    const p = JSON.parse(raw);
    return { x: typeof p.x === "number" ? p.x : 50, y: typeof p.y === "number" ? p.y : 50 };
  } catch {
    return DEFAULT_POS;
  }
}

function writeLocal(entityId: string, imageUrl: string, pos: { x: number; y: number }) {
  if (typeof window === "undefined" || !imageUrl) return;
  localStorage.setItem(localKey(entityId, imageUrl), JSON.stringify(pos));
}

export function useImageControls(
  entityId: string,
  entityType: EntityType,
  images: string[]
) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const currentUrl = images[currentIndex] ?? "";
  const [cropPos, setCropPos] = useState(() => readLocal(entityId, currentUrl));
  const { openCropEditor: contextOpen, isAdmin, version } = useContext(ImageControlsContext);
  const versionRef = useRef(version);

  // Reload crop when image switches OR when modal commits a new value (version bump)
  useEffect(() => {
    if (!currentUrl) return;
    setCropPos(readLocal(entityId, currentUrl));
    let cancelled = false;
    const supabase = createClient();
    supabase
      .from("image_prefs")
      .select("x, y")
      .eq("entity_type", entityType)
      .eq("entity_id", entityId)
      .eq("image_url", currentUrl)
      .maybeSingle()
      .then(({ data }) => {
        if (cancelled || !data) return;
        const pos = { x: data.x, y: data.y };
        setCropPos(pos);
        writeLocal(entityId, currentUrl, pos);
      });
    return () => { cancelled = true; };
  }, [entityId, entityType, currentUrl, version]);

  // Clamp index if images array shrinks
  useEffect(() => {
    if (currentIndex >= images.length && images.length > 0) {
      setCurrentIndex(0);
    }
  }, [images.length, currentIndex]);

  const goPrev = useCallback(() => {
    if (images.length < 2) return;
    setCurrentIndex(i => (i - 1 + images.length) % images.length);
  }, [images.length]);

  const goNext = useCallback(() => {
    if (images.length < 2) return;
    setCurrentIndex(i => (i + 1) % images.length);
  }, [images.length]);

  const openCropEditor = useCallback(() => {
    if (!currentUrl) return;
    contextOpen({ entityId, entityType, imageUrl: currentUrl, images });
  }, [entityId, entityType, currentUrl, images, contextOpen]);

  return { currentIndex, currentUrl, cropPos, goPrev, goNext, openCropEditor, isAdmin };
}
```

- [ ] **Step 2: Verify TS compiles (will fail until Task 4 lands)**

The context file doesn't exist yet, so `tsc` will error on the import. That's expected — proceed to Task 4 next, which will satisfy the dependency. Do not commit yet.

---

## Task 4: WC — `ImageControlsProvider` + `CropEditorModal`

**Files:**
- Create: `src/lib/image-controls-context.tsx`

- [ ] **Step 1: Write context, provider, and modal in one file**

```tsx
// src/lib/image-controls-context.tsx
"use client";

import { createContext, useState, useEffect, useRef, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";

export type EntityType = "recipe" | "cookbook" | "chapter";

export type CropEditorTarget = {
  entityId: string;
  entityType: EntityType;
  imageUrl: string;
  images: string[];
};

export type ImageControlsContextValue = {
  openCropEditor: (t: CropEditorTarget) => void;
  closeCropEditor: () => void;
  isAdmin: boolean;
  /** Increments every time a crop is saved; consumers can watch it to re-read storage. */
  version: number;
};

export const ImageControlsContext = createContext<ImageControlsContextValue>({
  openCropEditor: () => {},
  closeCropEditor: () => {},
  isAdmin: false,
  version: 0,
});

const DRAG_DEFAULT = { x: 50, y: 50 };

function CropEditorModal({
  target,
  onClose,
  onSaved,
}: {
  target: CropEditorTarget;
  onClose: () => void;
  onSaved: () => void;
}) {
  const imgRef = useRef<HTMLImageElement>(null);
  const dragOrigin = useRef<{ mouseX: number; mouseY: number; startX: number; startY: number } | null>(null);
  const [pos, setPos] = useState(() => {
    if (typeof window === "undefined") return DRAG_DEFAULT;
    try {
      const raw = localStorage.getItem(`wc-img-prefs::${target.entityId}::${target.imageUrl}`);
      if (!raw) return DRAG_DEFAULT;
      const p = JSON.parse(raw);
      return { x: typeof p.x === "number" ? p.x : 50, y: typeof p.y === "number" ? p.y : 50 };
    } catch {
      return DRAG_DEFAULT;
    }
  });
  const [isDragging, setIsDragging] = useState(false);
  const [hasDragged, setHasDragged] = useState(false);

  const onDrag = useCallback((e: MouseEvent) => {
    if (!dragOrigin.current || !imgRef.current) return;
    const rect = imgRef.current.getBoundingClientRect();
    const dx = ((e.clientX - dragOrigin.current.mouseX) / rect.width) * 100;
    const dy = ((e.clientY - dragOrigin.current.mouseY) / rect.height) * 100;
    setPos({
      x: Math.max(0, Math.min(100, dragOrigin.current.startX - dx)),
      y: Math.max(0, Math.min(100, dragOrigin.current.startY - dy)),
    });
  }, []);

  const stopDrag = useCallback(() => {
    setIsDragging(false);
    dragOrigin.current = null;
    window.removeEventListener("mousemove", onDrag);
    window.removeEventListener("mouseup", stopDrag);
  }, [onDrag]);

  function startDrag(e: React.MouseEvent) {
    e.preventDefault();
    dragOrigin.current = { mouseX: e.clientX, mouseY: e.clientY, startX: pos.x, startY: pos.y };
    setIsDragging(true);
    setHasDragged(true);
    window.addEventListener("mousemove", onDrag);
    window.addEventListener("mouseup", stopDrag);
  }

  useEffect(() => {
    return () => {
      window.removeEventListener("mousemove", onDrag);
      window.removeEventListener("mouseup", stopDrag);
    };
  }, [onDrag, stopDrag]);

  async function handleSave() {
    localStorage.setItem(
      `wc-img-prefs::${target.entityId}::${target.imageUrl}`,
      JSON.stringify(pos)
    );
    fetch("/api/image-prefs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        entityType: target.entityType,
        entityId: target.entityId,
        imageUrl: target.imageUrl,
        x: pos.x,
        y: pos.y,
      }),
    }).catch(() => { /* localStorage already written; UI will reconcile on next mount */ });
    onSaved();
    onClose();
  }

  return (
    <div
      data-testid="crop-editor-modal"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      style={{
        position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 9999,
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      }}
    >
      <div style={{ position: "relative", maxWidth: "90vw", maxHeight: "80vh" }}>
        {!hasDragged && (
          <div style={{
            position: "absolute", top: 12, left: "50%", transform: "translateX(-50%)",
            zIndex: 1, background: "rgba(0,0,0,0.6)", color: "#F59E0B",
            padding: "4px 12px", borderRadius: 4, fontSize: 12,
            fontFamily: "var(--font-geist-mono)", letterSpacing: "0.1em", pointerEvents: "none",
          }}>
            DRAG TO REFRAME
          </div>
        )}
        <img
          ref={imgRef}
          data-testid="crop-editor-image"
          src={target.imageUrl}
          alt="Crop preview"
          onMouseDown={startDrag}
          draggable={false}
          style={{
            display: "block", maxWidth: "90vw", maxHeight: "80vh",
            objectFit: "cover",
            objectPosition: `${pos.x}% ${pos.y}%`,
            cursor: isDragging ? "grabbing" : "grab",
            border: isDragging ? "2px dashed #F59E0B" : "2px solid transparent",
            userSelect: "none",
          }}
        />
      </div>
      <div style={{ marginTop: 16, display: "flex", gap: 12 }}>
        <button
          data-testid="crop-editor-cancel"
          onClick={onClose}
          style={{
            padding: "8px 24px", background: "transparent",
            border: "1px solid rgba(255,255,255,0.3)", color: "#fff",
            borderRadius: 6, cursor: "pointer", fontFamily: "var(--font-geist-mono)",
          }}
        >
          Cancel
        </button>
        <button
          data-testid="crop-editor-save"
          onClick={handleSave}
          style={{
            padding: "8px 24px", background: "#F59E0B", border: "none",
            color: "#0D0D0D", borderRadius: 6, cursor: "pointer", fontWeight: 600,
            fontFamily: "var(--font-geist-mono)",
          }}
        >
          Save
        </button>
      </div>
    </div>
  );
}

export function ImageControlsProvider({ children }: { children: React.ReactNode }) {
  const [target, setTarget] = useState<CropEditorTarget | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      setIsAdmin(!!user && user.email === process.env.NEXT_PUBLIC_ADMIN_EMAIL);
    });
  }, []);

  const openCropEditor = useCallback((t: CropEditorTarget) => setTarget(t), []);
  const closeCropEditor = useCallback(() => setTarget(null), []);
  const handleSaved = useCallback(() => setVersion(v => v + 1), []);

  return (
    <ImageControlsContext.Provider value={{ openCropEditor, closeCropEditor, isAdmin, version }}>
      {children}
      {target && (
        <CropEditorModal target={target} onClose={closeCropEditor} onSaved={handleSaved} />
      )}
    </ImageControlsContext.Provider>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```
Expected: no errors (hook from Task 3 and context now both resolve).

- [ ] **Step 3: Commit tasks 3 + 4 together**

```bash
git add src/lib/hooks/use-image-controls.ts src/lib/image-controls-context.tsx
git commit -m "feat(image-controls): add hook, context provider, and crop editor modal"
```

---

## Task 5: WC — `ImageWithControls` wrapper component

**Files:**
- Create: `src/components/image-with-controls.tsx`

- [ ] **Step 1: Write the wrapper**

```tsx
// src/components/image-with-controls.tsx
"use client";

import { useImageControls } from "@/lib/hooks/use-image-controls";
import type { EntityType } from "@/lib/image-controls-context";

type Size = "full" | "card" | "small";

interface Props {
  images: string[];
  entityId: string;
  entityType: EntityType;
  size: Size;
  className?: string;
  children: (currentUrl: string, cropStyle: React.CSSProperties) => React.ReactNode;
}

export function ImageWithControls({
  images, entityId, entityType, size, className, children,
}: Props) {
  const { currentIndex, currentUrl, cropPos, goPrev, goNext, openCropEditor, isAdmin } =
    useImageControls(entityId, entityType, images);

  const cropStyle: React.CSSProperties = currentUrl
    ? { objectPosition: `${cropPos.x}% ${cropPos.y}%` }
    : {};

  const showChevrons = images.length > 1;
  const showDots = images.length > 1 && size !== "small";
  const showCropButton = isAdmin && size !== "small" && !!currentUrl;

  return (
    <div className={`group relative w-full h-full ${className ?? ""}`}>
      {children(currentUrl, cropStyle)}

      {showChevrons && (
        <>
          <button
            type="button"
            data-testid="image-chevron-prev"
            onClick={(e) => { e.stopPropagation(); e.preventDefault(); goPrev(); }}
            aria-label="Previous image"
            className="absolute top-1/2 -translate-y-1/2 left-1 z-20 opacity-0 group-hover:opacity-100 transition-opacity"
            style={{
              width: 32, height: 32, borderRadius: "50%",
              background: "rgba(0,0,0,0.55)", color: "#fff",
              display: "flex", alignItems: "center", justifyContent: "center",
              border: "none", cursor: "pointer",
            }}
          >
            ‹
          </button>
          <button
            type="button"
            data-testid="image-chevron-next"
            onClick={(e) => { e.stopPropagation(); e.preventDefault(); goNext(); }}
            aria-label="Next image"
            className="absolute top-1/2 -translate-y-1/2 right-1 z-20 opacity-0 group-hover:opacity-100 transition-opacity"
            style={{
              width: 32, height: 32, borderRadius: "50%",
              background: "rgba(0,0,0,0.55)", color: "#fff",
              display: "flex", alignItems: "center", justifyContent: "center",
              border: "none", cursor: "pointer",
            }}
          >
            ›
          </button>
        </>
      )}

      {showDots && (
        <div
          data-testid="image-dots"
          className="absolute bottom-2 left-1/2 -translate-x-1/2 z-20 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          {images.map((_, i) => (
            <span
              key={i}
              style={{
                width: i === currentIndex ? 12 : 6, height: 6,
                borderRadius: 3, background: i === currentIndex ? "#fff" : "rgba(255,255,255,0.5)",
                transition: "width 150ms",
              }}
            />
          ))}
        </div>
      )}

      {showCropButton && (
        <button
          type="button"
          data-testid="image-crop-button"
          onClick={(e) => { e.stopPropagation(); e.preventDefault(); openCropEditor(); }}
          aria-label="Edit image crop"
          className="absolute top-1 right-1 z-20 opacity-0 group-hover:opacity-100 transition-opacity"
          style={{
            width: 32, height: 32, borderRadius: 6,
            background: "rgba(0,0,0,0.55)", color: "#F59E0B",
            display: "flex", alignItems: "center", justifyContent: "center",
            border: "none", cursor: "pointer", fontSize: 16,
          }}
        >
          ✂
        </button>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Verify TS compiles**

```bash
npx tsc --noEmit
```
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/image-with-controls.tsx
git commit -m "feat(image-controls): add ImageWithControls wrapper component"
```

---

## Task 6: WC — API route `/api/image-prefs`

**Files:**
- Create: `src/app/api/image-prefs/route.ts`

- [ ] **Step 1: Write the route**

```ts
// src/app/api/image-prefs/route.ts
import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ENTITY_TYPES = ["recipe", "cookbook", "chapter"] as const;
type EntityType = (typeof ENTITY_TYPES)[number];

function isEntityType(v: unknown): v is EntityType {
  return typeof v === "string" && (ENTITY_TYPES as readonly string[]).includes(v);
}

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const entityType = searchParams.get("entityType");
  const entityId = searchParams.get("entityId");
  if (!isEntityType(entityType) || !entityId) {
    return NextResponse.json({ error: "entityType and entityId required" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("image_prefs")
    .select("image_url, x, y")
    .eq("entity_type", entityType)
    .eq("entity_id", entityId)
    .eq("user_id", user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ prefs: data ?? [] });
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (user.email !== process.env.ADMIN_EMAIL) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { entityType, entityId, imageUrl, x, y } = body ?? {};
  if (
    !isEntityType(entityType) ||
    typeof entityId !== "string" || !entityId ||
    typeof imageUrl !== "string" || !imageUrl ||
    typeof x !== "number" || typeof y !== "number"
  ) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const clampedX = Math.max(0, Math.min(100, x));
  const clampedY = Math.max(0, Math.min(100, y));

  const { error } = await supabase
    .from("image_prefs")
    .upsert(
      {
        user_id: user.id,
        entity_type: entityType,
        entity_id: entityId,
        image_url: imageUrl,
        x: clampedX,
        y: clampedY,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,entity_type,entity_id,image_url" }
    );

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 2: Set the admin env vars**

Append to `.env.local` (or update the existing values):
```
ADMIN_EMAIL=lasse.kusch@gmail.com
NEXT_PUBLIC_ADMIN_EMAIL=lasse.kusch@gmail.com
```

- [ ] **Step 3: Smoke test the route**

```bash
npm run dev
```
In another shell, while logged in via the browser:
```bash
curl -i http://localhost:3002/api/image-prefs?entityType=recipe&entityId=test
```
Expected: `401 Unauthorized` (no cookies on curl) — confirms the endpoint is wired.

Then in the browser DevTools console (while logged in):
```js
await fetch("/api/image-prefs?entityType=recipe&entityId=test").then(r => r.json())
```
Expected: `{ prefs: [] }`.

- [ ] **Step 4: Commit**

```bash
git add src/app/api/image-prefs/route.ts
git commit -m "feat(api): add /api/image-prefs GET/POST with admin email gate"
```

---

## Task 7: WC — Mount the provider in root layout

**Files:**
- Modify: `src/app/layout.tsx`

- [ ] **Step 1: Wrap children**

Replace the `<ThemeProvider>` block in `src/app/layout.tsx` with:

```tsx
import { ThemeProvider } from "@/lib/theme-context";
import { PaletteInitializer } from "@/components/palette-switcher";
import { ImageControlsProvider } from "@/lib/image-controls-context";
```

And update the JSX:
```tsx
<ThemeProvider>
  <PaletteInitializer />
  <ImageControlsProvider>
    {children}
  </ImageControlsProvider>
</ThemeProvider>
```

- [ ] **Step 2: Verify app still boots**

```bash
npm run dev
```
Open `http://localhost:3002`. Expected: page renders, no console errors mentioning ImageControls.

- [ ] **Step 3: Commit**

```bash
git add src/app/layout.tsx
git commit -m "feat(image-controls): mount ImageControlsProvider in root layout"
```

---

## Task 8: WC — Wrap `RecipeHeroImage`

**Files:**
- Modify: `src/app/(app)/recipes/[id]/recipe-hero-image.tsx`

- [ ] **Step 1: Replace `RecipeImage` with `ImageWithControls` render-prop**

Replace the entire file with:

```tsx
"use client";

import { RecipeImage } from "@/components/recipe-image";
import { ImageWithControls } from "@/components/image-with-controls";

interface Props {
  recipeId: string;
  imageUrl?: string | null;
  imageUrls?: string[] | null;
  title: string;
  cuisine?: string | null;
  dietaryTags?: string[] | null;
  sourceUrl?: string | null;
  sourceName?: string | null;
}

export function RecipeHeroImage({
  recipeId, imageUrl, imageUrls, title, cuisine, dietaryTags, sourceUrl, sourceName,
}: Props) {
  const images =
    imageUrls && imageUrls.length > 0
      ? imageUrls
      : ([imageUrl].filter(Boolean) as string[]);

  return (
    <div className="overflow-hidden relative w-full h-full">
      <ImageWithControls
        images={images}
        entityId={recipeId}
        entityType="recipe"
        size="full"
      >
        {(currentUrl, cropStyle) => (
          <RecipeImage
            key={currentUrl || "fallback"}
            recipeId={recipeId}
            imageUrl={currentUrl || imageUrl}
            title={title}
            cuisine={cuisine}
            dietaryTags={dietaryTags}
            style={cropStyle}
          />
        )}
      </ImageWithControls>

      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0.08) 0%, transparent 40%, rgba(0,0,0,0.18) 100%)" }}
      />

      {sourceUrl && (
        <a
          href={sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="absolute top-4 right-4 flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg z-10"
          style={{ background: "rgba(13,9,7,0.75)", color: "#8A6A4A", backdropFilter: "blur(4px)" }}
        >
          <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6m0 0v6m0-6L10 14" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          {sourceName ?? "Source"}
        </a>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Find callers of `RecipeHeroImage` and pass `imageUrls`**

```bash
grep -rn "RecipeHeroImage" src/
```
For each call site, add `imageUrls={recipe.image_urls}` next to the existing `imageUrl` prop. Example diff:

```tsx
<RecipeHeroImage
  recipeId={recipe.id}
  imageUrl={recipe.image_url}
  imageUrls={recipe.image_urls}   {/* NEW */}
  title={recipe.title}
  ...
/>
```

- [ ] **Step 3: Manual smoke test**

```bash
npm run dev
```
Visit `/recipes/<any-recipe-id>`. Hover the hero image:
- If admin, you should see the crop icon (✂) top-right.
- If the recipe has `image_urls.length > 1`, chevrons + dots appear.
- Click crop → modal opens. Drag → image reframes. Save → modal closes, hero reflects new crop.

- [ ] **Step 4: Commit**

```bash
git add src/app/(app)/recipes/[id]/
git commit -m "feat(image-controls): wrap RecipeHeroImage with ImageWithControls"
```

---

## Task 9: WC — Wrap `RecipeCard`

**Files:**
- Modify: `src/components/recipe-card.tsx` (lines 105–114)

- [ ] **Step 1: Add import**

At the top of `src/components/recipe-card.tsx` add:
```tsx
import { ImageWithControls } from "@/components/image-with-controls";
```

- [ ] **Step 2: Replace the image block**

Find the existing block at lines 105–114:
```tsx
{/* Full-bleed hero image */}
<div className="absolute inset-0">
  <RecipeImage
    recipeId={recipe.id}
    imageUrl={recipe.image_url}
    title={recipe.title}
    cuisine={(recipe as Recipe & { cuisine_type?: string | null }).cuisine_type}
    dietaryTags={recipe.dietary_tags}
  />
</div>
```

Replace with:
```tsx
{/* Full-bleed hero image */}
<div className="absolute inset-0">
  <ImageWithControls
    images={
      recipe.image_urls && recipe.image_urls.length > 0
        ? recipe.image_urls
        : ([recipe.image_url].filter(Boolean) as string[])
    }
    entityId={recipe.id}
    entityType="recipe"
    size="card"
  >
    {(currentUrl, cropStyle) => (
      <RecipeImage
        key={currentUrl || "fallback"}
        recipeId={recipe.id}
        imageUrl={currentUrl || recipe.image_url}
        title={recipe.title}
        cuisine={(recipe as Recipe & { cuisine_type?: string | null }).cuisine_type}
        dietaryTags={recipe.dietary_tags}
        style={cropStyle}
      />
    )}
  </ImageWithControls>
</div>
```

- [ ] **Step 3: Manual smoke test**

Visit `/discover` (or any page that renders RecipeCard). Hover a card: chevrons appear only if `image_urls.length > 1`. Crop button only if admin.

- [ ] **Step 4: Commit**

```bash
git add src/components/recipe-card.tsx
git commit -m "feat(image-controls): wrap RecipeCard with ImageWithControls"
```

---

## Task 10: WC — Wrap `SwipeCards` (card + preview sheet)

**Files:**
- Modify: `src/components/swipe/swipe-cards.tsx`

- [ ] **Step 1: Locate the two image render sites**

```bash
grep -n "image_url\|<img" src/components/swipe/swipe-cards.tsx
```
There are two sites:
- `RecipeCard` (lines ~32–123) — the card under the user's finger
- `RecipePreviewSheet` (lines ~149–154) — the bottom-sheet preview

- [ ] **Step 2: Add import**

```tsx
import { ImageWithControls } from "@/components/image-with-controls";
```

- [ ] **Step 3: Wrap the card-level image**

In the `RecipeCard` portion of the file, find the `<img src={recipe.image_url}>` block and replace with:

```tsx
<ImageWithControls
  images={
    recipe.image_urls && recipe.image_urls.length > 0
      ? recipe.image_urls
      : ([recipe.image_url].filter(Boolean) as string[])
  }
  entityId={recipe.id}
  entityType="recipe"
  size="card"
>
  {(currentUrl, cropStyle) => (
    currentUrl ? (
      <img
        src={currentUrl}
        alt={recipe.title}
        className="w-full h-full object-cover"
        style={cropStyle}
        draggable={false}
      />
    ) : (
      <div className="w-full h-full flex items-center justify-center text-6xl" style={{ background: "#1E0C04" }}>
        🍽️
      </div>
    )
  )}
</ImageWithControls>
```

- [ ] **Step 4: Wrap the preview sheet image**

In `RecipePreviewSheet`, find the second `<img src={recipe.image_url}>` block (h-56 with bottom-up gradient) and apply the same wrapper using `size="card"`.

- [ ] **Step 5: Manual smoke test**

Visit `/discover`. The active swipe card should show controls on hover (note: swipe gestures may compete with chevron clicks — confirm `e.stopPropagation()` inside the chevron button prevents swipe).

- [ ] **Step 6: Commit**

```bash
git add src/components/swipe/swipe-cards.tsx
git commit -m "feat(image-controls): wrap swipe cards (card + preview) with ImageWithControls"
```

---

## Task 11: WC — Wrap `CookbookCover` + chapter page image

**Files:**
- Modify: `src/components/cookbook-cover.tsx`
- Modify: `src/app/(app)/cookbooks/[slug]/chapter/[chapterId]/page.tsx`

- [ ] **Step 1: Wrap `CookbookCover`**

In `src/components/cookbook-cover.tsx` add import:
```tsx
import { ImageWithControls } from "@/components/image-with-controls";
```

Find the Next.js `<Image>` block (around lines 38–44) and wrap it:

```tsx
<ImageWithControls
  images={cookbook.cover_image_url ? [cookbook.cover_image_url] : []}
  entityId={cookbook.id}
  entityType="cookbook"
  size="card"
>
  {(currentUrl, cropStyle) => (
    currentUrl ? (
      <Image
        key={currentUrl}
        src={currentUrl}
        alt={cookbook.title}
        fill
        sizes="(min-width: 1024px) 400px, 100vw"
        style={{ objectFit: "cover", ...cropStyle }}
      />
    ) : null
  )}
</ImageWithControls>
```

- [ ] **Step 2: Wrap chapter page image**

In `src/app/(app)/cookbooks/[slug]/chapter/[chapterId]/page.tsx` around lines 76–84, add the same import and wrap the `<Image>` block. The `entityId` is the chapter ID, `entityType="chapter"`:

```tsx
<ImageWithControls
  images={
    recipe.creator_meal_photo_url
      ? [recipe.creator_meal_photo_url]
      : recipe.image_url
        ? [recipe.image_url]
        : []
  }
  entityId={chapterId}
  entityType="chapter"
  size="card"
>
  {(currentUrl, cropStyle) => (
    currentUrl ? (
      <Image
        key={currentUrl}
        src={currentUrl}
        alt={recipe.title}
        fill
        sizes="100vw"
        style={{ objectFit: "cover", ...cropStyle }}
      />
    ) : null
  )}
</ImageWithControls>
```

- [ ] **Step 3: Manual smoke test**

Visit `/cookbooks` and `/cookbooks/<slug>/chapter/<id>`. Admin sees the crop icon on hover. Saving updates the position.

- [ ] **Step 4: Commit**

```bash
git add src/components/cookbook-cover.tsx "src/app/(app)/cookbooks/"
git commit -m "feat(image-controls): wrap cookbook cover and chapter image"
```

---

## Task 12: WC — Wrap the four small surfaces

**Files:**
- Modify: `src/components/meal-photo-gallery.tsx`
- Modify: `src/app/(app)/discover/quick-easy-section.tsx`
- Modify: `src/app/(app)/saved/saved-client.tsx`
- Modify: `src/app/(app)/plans/[id]/saved-recipe-fit.tsx`

For each file: add the import, replace the existing image element with the wrapper at `size="small"`. Small surfaces show **chevrons** when multiple images exist but **no crop button** (per the design — too tight for an editor trigger).

- [ ] **Step 1: `quick-easy-section.tsx`**

Add import and replace `<img src={r.image_url} ...>` around lines 91–100 with:

```tsx
<ImageWithControls
  images={
    r.image_urls && r.image_urls.length > 0
      ? r.image_urls
      : ([r.image_url].filter(Boolean) as string[])
  }
  entityId={r.id}
  entityType="recipe"
  size="small"
>
  {(currentUrl, cropStyle) => (
    currentUrl ? (
      <img
        key={currentUrl}
        src={currentUrl}
        alt={r.title}
        className="w-full h-full object-cover"
        style={cropStyle}
      />
    ) : (
      <div className="w-full h-full flex items-center justify-center text-2xl">🍽️</div>
    )
  )}
</ImageWithControls>
```

- [ ] **Step 2: `saved-client.tsx`** — same pattern, around lines 79–87.

- [ ] **Step 3: `saved-recipe-fit.tsx`** — same pattern, around lines 86–89.

- [ ] **Step 4: `meal-photo-gallery.tsx`** — same pattern, around line 69. Each photo gets its own `entityId={photo.id}` and `entityType="recipe"` (treat meal photos as recipe-scoped). `images={[photo.photo_url]}`.

- [ ] **Step 5: Manual smoke test**

Visit `/saved`, `/discover` (quick-easy section), `/plans/<id>`, and a chapter page with meal photos. Confirm hover shows chevrons only when `image_urls.length > 1` and no crop button appears anywhere at this size.

- [ ] **Step 6: Commit**

```bash
git add src/components/meal-photo-gallery.tsx "src/app/(app)/discover/quick-easy-section.tsx" "src/app/(app)/saved/saved-client.tsx" "src/app/(app)/plans/"
git commit -m "feat(image-controls): wrap all small image surfaces (chevron-only)"
```

---

## Task 13: VP — DB migration + Supabase sync

**Files:**
- Create: `C:/Users/lasse/Desktop/venturepath/supabase/migrations/20260512_expedition_image_prefs.sql`
- Modify: `C:/Users/lasse/Desktop/venturepath/src/hooks/useImagePositions.js`

- [ ] **Step 1: Write the VP migration**

```sql
-- supabase/migrations/20260512_expedition_image_prefs.sql

CREATE TABLE IF NOT EXISTS expedition_image_prefs (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  expedition_id text NOT NULL,
  image_url     text NOT NULL,
  x             float8 NOT NULL DEFAULT 50,
  y             float8 NOT NULL DEFAULT 40,
  updated_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, expedition_id, image_url)
);

CREATE INDEX IF NOT EXISTS expedition_image_prefs_lookup_idx
  ON expedition_image_prefs (user_id, expedition_id);

ALTER TABLE expedition_image_prefs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users select own expedition_image_prefs"
  ON expedition_image_prefs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "users insert own expedition_image_prefs"
  ON expedition_image_prefs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users update own expedition_image_prefs"
  ON expedition_image_prefs FOR UPDATE
  USING (auth.uid() = user_id);
```

- [ ] **Step 2: Apply migration in VP's Supabase project**

Run in Supabase SQL Editor for VP's project (`rhuttwfozwawcijjwpeo`).

- [ ] **Step 3: Update `useImagePositions.js`**

Replace the file contents at `C:/Users/lasse/Desktop/venturepath/src/hooks/useImagePositions.js` with:

```js
// src/hooks/useImagePositions.js
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";

const STORAGE_KEY = "vp-img-positions";
const DEFAULT = { x: 50, y: 40 };

function readAll() {
  if (typeof window === "undefined") return {};
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}"); } catch { return {}; }
}

function writeAll(obj) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(obj));
}

function keyFor(expeditionId, imageUrl) {
  return `${expeditionId}::${imageUrl}`;
}

export function useImagePositions(expeditionId) {
  const [positions, setPositions] = useState(() => readAll());

  // Hydrate from Supabase on mount / when expedition changes
  useEffect(() => {
    if (!expeditionId) return;
    let cancelled = false;
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from("expedition_image_prefs")
        .select("image_url, x, y")
        .eq("user_id", user.id)
        .eq("expedition_id", expeditionId);
      if (cancelled || !data) return;
      const merged = readAll();
      for (const row of data) {
        merged[keyFor(expeditionId, row.image_url)] = { x: row.x, y: row.y };
      }
      writeAll(merged);
      setPositions(merged);
    })();
    return () => { cancelled = true; };
  }, [expeditionId]);

  const getPos = useCallback(
    (expId, imageUrl) => positions[keyFor(expId, imageUrl)] ?? DEFAULT,
    [positions]
  );

  const setPos = useCallback(async (expId, imageUrl, pos) => {
    const next = { ...positions, [keyFor(expId, imageUrl)]: pos };
    writeAll(next);
    setPositions(next);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    supabase
      .from("expedition_image_prefs")
      .upsert(
        {
          user_id: user.id,
          expedition_id: expId,
          image_url: imageUrl,
          x: pos.x,
          y: pos.y,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id,expedition_id,image_url" }
      )
      .then(({ error }) => {
        if (error) console.warn("[useImagePositions] supabase upsert failed:", error.message);
      });
  }, [positions]);

  return { getPos, setPos };
}
```

- [ ] **Step 4: Smoke test in VP**

```bash
cd C:/Users/lasse/Desktop/venturepath
npm run dev
```
Open VP at port 3001, navigate to expedition select / trip planner, adjust an image crop, save. Check Supabase: `SELECT * FROM expedition_image_prefs ORDER BY updated_at DESC LIMIT 1;` should show the new row.

Reload the page, verify the crop persists from Supabase even if you clear localStorage:
```js
localStorage.removeItem("vp-img-positions")
location.reload()
```
Expected: the saved crop reappears after the Supabase hydrate completes.

- [ ] **Step 5: Commit (in VP repo)**

```bash
cd C:/Users/lasse/Desktop/venturepath
git add supabase/migrations/20260512_expedition_image_prefs.sql src/hooks/useImagePositions.js
git commit -m "feat(image-positions): persist crop to Supabase with localStorage cache"
```

---

## Task 14: WC — Playwright setup

**Files:**
- Create: `playwright.config.ts`
- Create: `tests/e2e/.gitignore` (just `test-results/` and `playwright-report/`)
- Modify: `package.json` (add scripts)

- [ ] **Step 1: Install Playwright**

```bash
cd C:/Users/lasse/Desktop/whatscooking
npm install -D @playwright/test
npx playwright install chromium
```

- [ ] **Step 2: Write `playwright.config.ts`**

```ts
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  retries: 0,
  reporter: "list",
  use: {
    baseURL: "http://localhost:3002",
    trace: "on-first-retry",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3002",
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
```

- [ ] **Step 3: Add scripts to `package.json`**

In `package.json`'s `"scripts"` block, add:
```json
"test:e2e": "playwright test",
"test:e2e:headed": "playwright test --headed"
```

- [ ] **Step 4: Create `tests/e2e/.gitignore`**

```
test-results/
playwright-report/
```

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json playwright.config.ts tests/e2e/.gitignore
git commit -m "chore(test): add Playwright setup for E2E tests"
```

---

## Task 15: WC — Playwright E2E tests

**Files:**
- Create: `tests/e2e/image-controls.spec.ts`
- Create: `tests/e2e/seed-fixture.sql` (manual reference, applied once)

- [ ] **Step 1: Seed a fixture recipe (one-time)**

Apply via Supabase SQL Editor:
```sql
-- tests/e2e/seed-fixture.sql
INSERT INTO recipes (id, title, source, image_url, image_urls, created_at)
VALUES (
  '00000000-0000-0000-0000-00000000e2e1',
  'E2E Test Recipe',
  'manual',
  'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600',
  ARRAY[
    'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600',
    'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600',
    'https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=600'
  ],
  now()
)
ON CONFLICT (id) DO UPDATE SET
  image_urls = EXCLUDED.image_urls,
  image_url  = EXCLUDED.image_url;
```

Save that file to `tests/e2e/seed-fixture.sql` for future reference, and run it in the WC Supabase SQL Editor.

- [ ] **Step 2: Write the test file**

```ts
// tests/e2e/image-controls.spec.ts
import { test, expect } from "@playwright/test";

const RECIPE_ID = "00000000-0000-0000-0000-00000000e2e1";
const URL1 = "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600";
const URL2 = "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600";

test.describe("Image controls", () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage so each test starts clean
    await page.addInitScript(() => {
      Object.keys(localStorage)
        .filter(k => k.startsWith("wc-img-prefs::"))
        .forEach(k => localStorage.removeItem(k));
    });
  });

  test("chevron cycles through image_urls", async ({ page }) => {
    await page.goto(`/recipes/${RECIPE_ID}`);
    const hero = page.locator(".group").first();
    await hero.hover();

    const img = hero.locator("img").first();
    await expect(img).toHaveAttribute("src", URL1);

    await page.getByTestId("image-chevron-next").first().click();
    await expect(img).toHaveAttribute("src", URL2);

    await page.getByTestId("image-chevron-prev").first().click();
    await expect(img).toHaveAttribute("src", URL1);
  });

  test("crop modal opens and cancels without saving", async ({ page }) => {
    await page.goto(`/recipes/${RECIPE_ID}`);
    const hero = page.locator(".group").first();
    await hero.hover();

    // Requires the test runner to be logged in as ADMIN_EMAIL — see SETUP NOTE below.
    const cropBtn = page.getByTestId("image-crop-button").first();
    await expect(cropBtn).toBeVisible();
    await cropBtn.click();

    await expect(page.getByTestId("crop-editor-modal")).toBeVisible();
    await page.getByTestId("crop-editor-cancel").click();
    await expect(page.getByTestId("crop-editor-modal")).toHaveCount(0);
  });

  test("drag + save persists to localStorage and fires POST", async ({ page }) => {
    let postFired = false;
    await page.route("**/api/image-prefs", (route) => {
      if (route.request().method() === "POST") postFired = true;
      route.continue();
    });

    await page.goto(`/recipes/${RECIPE_ID}`);
    const hero = page.locator(".group").first();
    await hero.hover();
    await page.getByTestId("image-crop-button").first().click();

    const modalImg = page.getByTestId("crop-editor-image");
    const box = await modalImg.boundingBox();
    if (!box) throw new Error("modal image not measured");

    // Drag 80px right, 40px down from the center
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width / 2 + 80, box.y + box.height / 2 + 40, { steps: 10 });
    await page.mouse.up();

    await page.getByTestId("crop-editor-save").click();
    await expect(page.getByTestId("crop-editor-modal")).toHaveCount(0);

    const stored = await page.evaluate((key) => localStorage.getItem(key), `wc-img-prefs::${RECIPE_ID}::${URL1}`);
    expect(stored).not.toBeNull();
    const pos = JSON.parse(stored!);
    expect(pos.x).toBeGreaterThan(0);
    expect(pos.y).toBeGreaterThan(0);
    expect(pos.x).not.toBe(50);  // changed from default
    expect(postFired).toBe(true);
  });

  test("crop persists after reload", async ({ page }) => {
    // Pre-seed localStorage to simulate a previously saved crop
    await page.addInitScript(
      ([key, val]) => localStorage.setItem(key, val),
      [`wc-img-prefs::${RECIPE_ID}::${URL1}`, JSON.stringify({ x: 20, y: 80 })]
    );
    await page.goto(`/recipes/${RECIPE_ID}`);
    const img = page.locator(".group").first().locator("img").first();
    await expect(img).toHaveCSS("object-position", /20%\s+80%/);
  });

  test("non-admin sees chevrons but no crop button", async ({ page, context }) => {
    // This test assumes a non-admin login state or logged-out state.
    await context.clearCookies();
    await page.goto(`/recipes/${RECIPE_ID}`);
    const hero = page.locator(".group").first();
    await hero.hover();
    await expect(page.getByTestId("image-chevron-next").first()).toBeVisible();
    await expect(page.getByTestId("image-crop-button")).toHaveCount(0);
  });
});
```

- [ ] **Step 3: SETUP NOTE — admin login state**

The crop-button tests require a logged-in session whose email matches `NEXT_PUBLIC_ADMIN_EMAIL`. Two options:

**Option A (manual, simplest):** Before running tests, log in once in a browser, copy `cookies` from DevTools → Application → Cookies, paste into `tests/e2e/.auth-state.json` via `page.context().storageState({ path: ... })`. Reference that file in `playwright.config.ts` via `use.storageState`.

**Option B (programmatic):** Add a `global-setup.ts` that logs in via Supabase using email/password and writes a storage state file. Defer to a follow-up plan if Option A is sufficient.

For now: log in manually in dev, then run:
```bash
npx playwright codegen http://localhost:3002 --save-storage tests/e2e/.auth-state.json
```
Add to `playwright.config.ts` under `use`:
```ts
storageState: "tests/e2e/.auth-state.json",
```
And add `tests/e2e/.auth-state.json` to `.gitignore`.

- [ ] **Step 4: Run the tests**

```bash
npm run test:e2e
```
Expected: all 5 tests pass.

- [ ] **Step 5: Commit**

```bash
git add tests/e2e/image-controls.spec.ts tests/e2e/seed-fixture.sql tests/e2e/.gitignore
git commit -m "test(e2e): add Playwright tests for image controls"
```

---

## Self-Review Notes

1. **Spec coverage check** — every spec section is addressed:
   - Provider + context + modal → Task 4
   - Hook → Task 3
   - Wrapper → Task 5
   - DB migration → Tasks 1 (WC) + 13 (VP)
   - API route → Task 6
   - 9 component wraps → Tasks 8–12
   - VP Supabase sync → Task 13
   - Playwright E2E → Tasks 14–15

2. **Naming consistency** — `useImageControls`, `ImageControlsContext`, `ImageControlsProvider`, `ImageWithControls`, `CropEditorModal` are used uniformly throughout. The hook returns the exact shape declared in Task 3 and consumed in Task 5. Storage key format `wc-img-prefs::{entityId}::{imageUrl}` is identical in the hook (Task 3), modal (Task 4), and Playwright tests (Task 15).

3. **Admin gate** — gated server-side via `user.email === process.env.ADMIN_EMAIL` (Task 6), client-side via `NEXT_PUBLIC_ADMIN_EMAIL` (Task 4 provider). Both env vars set in Task 6 Step 2.

4. **`RecipeImage` remount on URL switch** — every wrap site uses `key={currentUrl || "fallback"}` to force the inner image to reset its fallback state.
