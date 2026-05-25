# Cookbooks Social + Macro Accordion + Autocomplete Fix — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a follow system to Cookbooks, a clickable per-day macro accordion gated on tracking opt-in, and fix the recipe search autocomplete dropdown clipping in the plan builder.

**Architecture:** Three independent sections — each can be committed and tested without the others. Cookbooks social lives entirely in `src/app/(app)/cookbooks/` + a new API route + one migration. The macro accordion extends `MacroSummary` and `WeaveSection`/`WeaveGrid` with lifted state. The autocomplete fix is a single-file portal change.

**Tech Stack:** Next.js App Router, Supabase (Postgres + RLS), React portals, CSS opacity transitions.

---

## File Map

| File | Action | Purpose |
|---|---|---|
| `supabase/migrations/20260521_social_macros.sql` | Create | profile_follows table + person_count/track_intake columns |
| `src/components/cookbook-cover.tsx` | Modify | Emoji gradient default + hover 2×2 collage |
| `src/app/api/cookbooks/follow/route.ts` | Create | POST/DELETE follow/unfollow endpoint |
| `src/app/(app)/cookbooks/page.tsx` | Modify | Fetch followed IDs + recipe images for covers |
| `src/app/(app)/cookbooks/cookbooks-client.tsx` | Modify | Tab filters (Following/Trending/Newest/Free/Paid) + follow button |
| `src/lib/plans/macros.ts` | Modify | Add `aggregateByDay` function |
| `src/components/plans/MacroSummary.tsx` | Modify | Accordion + person count stepper + tracking gate |
| `src/components/plans/WeaveSection.tsx` | Modify | Lift `selectedField` state + compute `dayMacroValues` |
| `src/components/plans/WeaveGrid.tsx` | Modify | Render per-day macro values in column headers |
| `src/app/(app)/plans/[id]/page.tsx` | Modify | Fetch + pass `person_count`, `track_intake`, `profile.track_intake` |
| `src/app/(app)/plans/[id]/plan-builder.tsx` | Modify | Thread new props down to WeaveSection |
| `src/app/api/plans/[id]/route.ts` | Modify | Allow PATCH of `person_count` and `track_intake` |
| `src/app/(app)/settings/settings-client.tsx` | Modify | Global `track_intake` toggle section |
| `src/app/(app)/settings/page.tsx` | Modify | Fetch profile `track_intake` and pass to client |
| `src/components/plans/RecipeSearchBar.tsx` | Modify | Portal + `getBoundingClientRect` dropdown positioning |

---

## SECTION A — Cookbooks Social

---

### Task 1: Migration — profile_follows table

**Files:**
- Create: `supabase/migrations/20260521_social_macros.sql`

- [ ] **Step 1: Write migration**

```sql
-- supabase/migrations/20260521_social_macros.sql

-- ── Cookbooks: follow graph ──────────────────────────────────────────────────
create table if not exists public.profile_follows (
  follower_id  uuid not null references public.profiles(id) on delete cascade,
  following_id uuid not null references public.profiles(id) on delete cascade,
  created_at   timestamptz not null default now(),
  primary key (follower_id, following_id)
);

alter table public.profile_follows enable row level security;

create policy "users manage own follows"
  on public.profile_follows
  for all
  using (follower_id = auth.uid())
  with check (follower_id = auth.uid());

create policy "anyone reads follows"
  on public.profile_follows
  for select
  using (true);

-- ── Meal plans: person count + per-plan tracking opt-in ──────────────────────
alter table public.meal_plans
  add column if not exists person_count integer not null default 1,
  add column if not exists track_intake boolean not null default false;

-- ── Profiles: global tracking opt-in ─────────────────────────────────────────
alter table public.profiles
  add column if not exists track_intake boolean not null default false;
```

- [ ] **Step 2: Apply migration**

```bash
cd C:\Users\lasse\Desktop\whatscooking
npx supabase db push
```

Expected: migration applied with no errors. If `supabase db push` is unavailable run via Supabase Studio SQL editor.

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/20260521_social_macros.sql
git commit -m "feat(db): add profile_follows, person_count, track_intake columns"
```

---

### Task 2: CookbookCover — emoji gradient + hover collage

**Files:**
- Modify: `src/components/cookbook-cover.tsx`

- [ ] **Step 1: Write the updated component**

Replace the entire file with:

```tsx
// src/components/cookbook-cover.tsx
"use client";

import Image from "next/image";
import type { CookbookFont } from "@/lib/cookbook-types";

const FONT_CLASS: Record<CookbookFont, string> = {
  serif:  "font-serif",
  sans:   "font-sans",
  script: "font-serif italic",
};

// Deterministic emoji from title keywords
function coverEmoji(title: string): string {
  const t = title.toLowerCase();
  if (/smoke|fire|grill|bbq|char/.test(t)) return "🔥";
  if (/plant|veg|green|salad|leaf/.test(t)) return "🥗";
  if (/fish|sea|ocean|salmon|tuna|shrimp/.test(t)) return "🐟";
  if (/pasta|italian|noodle/.test(t)) return "🍝";
  if (/sweet|dessert|bake|cake|cookie/.test(t)) return "🍰";
  if (/spice|curry|asian|thai|indian/.test(t)) return "🌶️";
  if (/chicken|poultry|turkey/.test(t)) return "🍗";
  if (/bread|sourdough|loaf/.test(t)) return "🍞";
  if (/soup|stew|broth/.test(t)) return "🍲";
  return "🍽️";
}

interface CookbookCoverProps {
  cookbook: {
    title: string;
    tagline?: string | null;
    cover_image_url?: string | null;
    theme_color: string;
    title_font: CookbookFont | string;
    price: number;
  };
  recipeCount?: number;
  creatorName?: string | null;
  creatorAvatar?: string | null;
  recipeImages?: string[];   // first 4 recipe image URLs for hover collage
  size?: "card" | "hero";
}

export function CookbookCover({
  cookbook, recipeCount, creatorName, creatorAvatar, recipeImages = [], size = "card",
}: CookbookCoverProps) {
  const isHero = size === "hero";
  const fontClass = FONT_CLASS[(cookbook.title_font as CookbookFont)] ?? FONT_CLASS.serif;
  const hasUploadedCover = !!cookbook.cover_image_url;
  const collageImages = recipeImages.filter(Boolean).slice(0, 4);
  const canCollage = !hasUploadedCover && collageImages.length >= 2;

  return (
    <div
      className={`relative overflow-hidden rounded-2xl group ${isHero ? "h-80 md:h-[420px]" : "h-52"} w-full`}
      style={{ background: cookbook.theme_color }}
    >
      {/* Uploaded cover image */}
      {hasUploadedCover && (
        <Image
          src={cookbook.cover_image_url!}
          alt={cookbook.title}
          fill
          className="object-cover"
          sizes={isHero ? "100vw" : "400px"}
        />
      )}

      {/* Gradient + emoji fallback (default when no uploaded cover) */}
      {!hasUploadedCover && (
        <div
          className={`absolute inset-0 flex items-center justify-center text-6xl transition-opacity duration-300 ${canCollage ? "group-hover:opacity-0" : ""}`}
          style={{
            background: `linear-gradient(160deg, ${cookbook.theme_color}dd, ${cookbook.theme_color})`,
          }}
        >
          {coverEmoji(cookbook.title)}
        </div>
      )}

      {/* Hover collage — 2×2 grid of recipe images */}
      {canCollage && (
        <div className="absolute inset-0 grid grid-cols-2 grid-rows-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          {collageImages.map((url, i) => (
            <div key={i} className="relative overflow-hidden">
              <Image
                src={url}
                alt=""
                fill
                className="object-cover"
                sizes="200px"
              />
            </div>
          ))}
        </div>
      )}

      {/* Dark overlay for text legibility */}
      <div className="absolute inset-0" style={{ background: "rgba(0,0,0,0.35)" }} />

      {/* Text layer */}
      <div className="absolute inset-0 flex flex-col justify-end p-4 text-white">
        <span className="self-start mb-2 text-xs font-semibold px-2 py-0.5 rounded-full bg-white/20">
          {cookbook.price === 0 ? "Free" : `$${cookbook.price.toFixed(2)}`}
        </span>
        <h3 className={`${isHero ? "text-3xl" : "text-lg"} font-bold leading-tight ${fontClass}`}>
          {cookbook.title}
        </h3>
        {cookbook.tagline && (
          <p className="text-xs mt-1 opacity-80 line-clamp-1">{cookbook.tagline}</p>
        )}
        {(creatorName || recipeCount !== undefined) && (
          <div className="flex items-center gap-2 mt-2">
            {creatorAvatar && (
              <Image src={creatorAvatar} alt={creatorName ?? ""} width={20} height={20} className="rounded-full" />
            )}
            {creatorName && <span className="text-xs opacity-75">@{creatorName}</span>}
            {recipeCount !== undefined && (
              <span className="text-xs opacity-60 ml-auto">{recipeCount} recipes</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd C:\Users\lasse\Desktop\whatscooking
npx tsc --noEmit 2>&1 | grep cookbook-cover
```

Expected: no errors for this file.

- [ ] **Step 3: Commit**

```bash
git add src/components/cookbook-cover.tsx
git commit -m "feat(cookbooks): emoji gradient fallback + hover recipe collage"
```

---

### Task 3: Follow API route

**Files:**
- Create: `src/app/api/cookbooks/follow/route.ts`

- [ ] **Step 1: Create the route**

```ts
// src/app/api/cookbooks/follow/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { following_id } = await req.json() as { following_id: string };
  if (!following_id) return NextResponse.json({ error: "missing following_id" }, { status: 400 });

  const { error } = await supabase
    .from("profile_follows")
    .insert({ follower_id: user.id, following_id });

  if (error && error.code !== "23505") { // 23505 = unique violation (already following)
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { following_id } = await req.json() as { following_id: string };
  if (!following_id) return NextResponse.json({ error: "missing following_id" }, { status: 400 });

  const { error } = await supabase
    .from("profile_follows")
    .delete()
    .eq("follower_id", user.id)
    .eq("following_id", following_id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/api/cookbooks/follow/route.ts
git commit -m "feat(api): POST/DELETE /api/cookbooks/follow"
```

---

### Task 4: Cookbooks page query + CookbooksClient tab filters + follow button

**Files:**
- Modify: `src/app/(app)/cookbooks/page.tsx`
- Modify: `src/app/(app)/cookbooks/cookbooks-client.tsx`

- [ ] **Step 1: Update page.tsx to fetch profile id, recipe images, and followed creator IDs**

Replace `src/app/(app)/cookbooks/page.tsx`:

```tsx
// src/app/(app)/cookbooks/page.tsx
import { createClient } from "@/lib/supabase/server";
import { CookbooksClient } from "./cookbooks-client";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Cookbooks — What's Cooking" };

export default async function CookbooksPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const [{ data: cookbooks }, { data: follows }] = await Promise.all([
    supabase
      .from("cookbooks")
      .select(`
        id, title, tagline, cover_image_url, theme_color, title_font, price, slug, view_count, created_at,
        profiles(id, username, full_name, avatar_url),
        cookbook_chapters(cookbook_recipes(recipe:recipes(id, image_url)))
      `)
      .eq("status", "published")
      .order("created_at", { ascending: false })
      .limit(48),
    user
      ? supabase
          .from("profile_follows")
          .select("following_id")
          .eq("follower_id", user.id)
      : Promise.resolve({ data: [] }),
  ]);

  const followedCreatorIds = new Set((follows ?? []).map((f) => f.following_id));

  const mapped = (cookbooks ?? []).map((cb) => {
    const profile = Array.isArray(cb.profiles) ? cb.profiles[0] ?? null : cb.profiles;
    const recipeCount = (cb.cookbook_chapters ?? []).reduce(
      (s: number, ch: { cookbook_recipes: { id: string }[] }) => s + ch.cookbook_recipes.length, 0
    );
    // Flatten first 4 recipe image URLs for hover collage
    const recipeImages: string[] = [];
    for (const ch of cb.cookbook_chapters ?? []) {
      for (const cr of ch.cookbook_recipes ?? []) {
        const url = (cr as unknown as { recipe?: { image_url?: string | null } }).recipe?.image_url;
        if (url && recipeImages.length < 4) recipeImages.push(url);
      }
    }
    return { ...cb, profiles: profile, recipeCount, recipeImages };
  });

  return (
    <main className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold" style={{ color: "#3D2817" }}>Cookbooks</h1>
        <p className="text-sm mt-1" style={{ color: "#6B5B52" }}>
          Curated recipe collections from creators around the world
        </p>
      </div>
      <CookbooksClient
        initialCookbooks={mapped}
        userId={user?.id ?? null}
        initialFollowedCreatorIds={[...followedCreatorIds]}
      />
    </main>
  );
}
```

- [ ] **Step 2: Rewrite CookbooksClient with tabs + follow button**

Replace `src/app/(app)/cookbooks/cookbooks-client.tsx`:

```tsx
// src/app/(app)/cookbooks/cookbooks-client.tsx
"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { CookbookCover } from "@/components/cookbook-cover";

type CookbookRow = {
  id: string; title: string; tagline: string | null; cover_image_url: string | null;
  theme_color: string; title_font: string; price: number; slug: string;
  view_count: number; created_at: string; recipeCount: number; recipeImages: string[];
  profiles: { id: string; username: string | null; full_name: string | null; avatar_url: string | null } | null;
};

type Tab = "following" | "trending" | "newest" | "free" | "paid";

const TABS: { label: string; value: Tab }[] = [
  { label: "Following", value: "following" },
  { label: "Trending",  value: "trending" },
  { label: "Newest",    value: "newest" },
  { label: "Free",      value: "free" },
  { label: "Paid",      value: "paid" },
];

interface Props {
  initialCookbooks: CookbookRow[];
  userId: string | null;
  initialFollowedCreatorIds: string[];
}

export function CookbooksClient({ initialCookbooks, userId, initialFollowedCreatorIds }: Props) {
  const anyFollowed = initialFollowedCreatorIds.length > 0;
  const [tab, setTab] = useState<Tab>(anyFollowed ? "following" : "trending");
  const [followedIds, setFollowedIds] = useState<Set<string>>(new Set(initialFollowedCreatorIds));
  const [pending, setPending] = useState<Set<string>>(new Set());

  const filtered = initialCookbooks
    .filter((cb) => {
      const creatorId = cb.profiles?.id ?? "";
      if (tab === "following") return followedIds.has(creatorId);
      if (tab === "free")      return cb.price === 0;
      if (tab === "paid")      return cb.price > 0;
      return true; // trending / newest show all
    })
    .sort((a, b) =>
      tab === "trending"
        ? b.view_count - a.view_count
        : new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

  const toggleFollow = useCallback(async (creatorId: string) => {
    if (!userId || pending.has(creatorId)) return;
    const isFollowing = followedIds.has(creatorId);

    // optimistic update
    setPending(p => new Set([...p, creatorId]));
    setFollowedIds(prev => {
      const next = new Set(prev);
      isFollowing ? next.delete(creatorId) : next.add(creatorId);
      return next;
    });

    try {
      await fetch("/api/cookbooks/follow", {
        method: isFollowing ? "DELETE" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ following_id: creatorId }),
      });
    } catch {
      // rollback on error
      setFollowedIds(prev => {
        const next = new Set(prev);
        isFollowing ? next.add(creatorId) : next.delete(creatorId);
        return next;
      });
    } finally {
      setPending(p => { const next = new Set(p); next.delete(creatorId); return next; });
    }
  }, [userId, followedIds, pending]);

  return (
    <>
      <div className="flex flex-wrap items-center gap-2 mb-6">
        <div className="flex gap-1 rounded-xl p-1 flex-wrap" style={{ background: "#F5E6D3" }}>
          {TABS.map((t) => (
            <button
              key={t.value}
              onClick={() => setTab(t.value)}
              className="px-3 py-1 rounded-lg text-sm font-medium transition-colors"
              style={{
                background: tab === t.value ? "#C85A2F" : "transparent",
                color: tab === t.value ? "#fff" : "#3D2817",
              }}
            >
              {t.label}
            </button>
          ))}
        </div>
        <Link
          href="/cookbooks/new"
          className="ml-auto px-4 py-1.5 rounded-xl text-sm font-semibold text-white"
          style={{ background: "#C85A2F" }}
        >
          + New Cookbook
        </Link>
      </div>

      {/* Empty state for Following tab with no follows */}
      {tab === "following" && filtered.length === 0 && (
        <div className="text-center py-20 rounded-2xl border border-dashed" style={{ borderColor: "#F5E6D3" }}>
          <p className="text-2xl mb-3">👨‍🍳</p>
          <p className="font-semibold mb-1" style={{ color: "#3D2817" }}>No cookbooks from people you follow yet</p>
          <p className="text-sm" style={{ color: "#6B5B52" }}>
            Switch to Trending or Newest and hit <strong>+ Follow</strong> on a creator.
          </p>
        </div>
      )}

      {tab !== "following" && filtered.length === 0 && (
        <div className="text-center py-20 rounded-2xl border border-dashed" style={{ borderColor: "#F5E6D3" }}>
          <p className="text-sm" style={{ color: "#6B5B52" }}>No cookbooks here yet.</p>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {filtered.map((cb) => {
          const creatorId = cb.profiles?.id ?? "";
          const isFollowing = followedIds.has(creatorId);
          const isPending = pending.has(creatorId);

          return (
            <div key={cb.id} className="group relative block">
              <Link href={`/cookbooks/${cb.slug}`}>
                <CookbookCover
                  cookbook={cb}
                  recipeCount={cb.recipeCount}
                  creatorName={cb.profiles?.username ?? cb.profiles?.full_name ?? null}
                  creatorAvatar={cb.profiles?.avatar_url ?? null}
                  recipeImages={cb.recipeImages}
                />
              </Link>

              {/* Follow button — sits outside the Link to avoid nested <a> */}
              {userId && creatorId && cb.profiles?.id !== userId && (
                <button
                  onClick={() => toggleFollow(creatorId)}
                  disabled={isPending}
                  className="absolute bottom-3 right-3 text-xs font-semibold px-3 py-1 rounded-full transition-all"
                  style={{
                    background: isFollowing ? "rgba(255,255,255,0.15)" : "rgba(200,90,47,0.9)",
                    color: "white",
                    backdropFilter: "blur(4px)",
                    border: isFollowing ? "1px solid rgba(255,255,255,0.3)" : "none",
                    opacity: isPending ? 0.6 : 1,
                  }}
                >
                  {isFollowing ? "Following ✓" : "+ Follow"}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
npx tsc --noEmit 2>&1 | grep -E "cookbooks|cookbook-cover"
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/app/(app)/cookbooks/page.tsx src/app/(app)/cookbooks/cookbooks-client.tsx
git commit -m "feat(cookbooks): Following tab + follow button + recipe collage query"
```

---

## SECTION B — Macro Accordion

---

### Task 5: aggregateByDay in macros.ts

**Files:**
- Modify: `src/lib/plans/macros.ts`

- [ ] **Step 1: Add the function at the end of the file**

```ts
// append to src/lib/plans/macros.ts

export function aggregateByDay(
  entries: ProposedEntry[],
  recipes: Record<string, Partial<RecipeMacros>>,
  field: MacroField,
): Record<number, MacroAggregate> {
  const byDay: Record<number, ProposedEntry[]> = {};
  for (const e of entries) {
    if (e.is_leftover) continue;
    (byDay[e.day_number] ??= []).push(e);
  }
  const result: Record<number, MacroAggregate> = {};
  for (const [dayStr, dayEntries] of Object.entries(byDay)) {
    result[Number(dayStr)] = aggregateMacro(dayEntries, recipes, field);
  }
  return result;
}
```

- [ ] **Step 2: Verify no TypeScript errors**

```bash
npx tsc --noEmit 2>&1 | grep "macros.ts"
```

Expected: no output (no errors).

- [ ] **Step 3: Commit**

```bash
git add src/lib/plans/macros.ts
git commit -m "feat(macros): add aggregateByDay helper"
```

---

### Task 6: MacroSummary — accordion + person count stepper + tracking gate

**Files:**
- Modify: `src/components/plans/MacroSummary.tsx`

- [ ] **Step 1: Rewrite MacroSummary**

Replace the entire file:

```tsx
'use client';

import { useEffect, useRef, useState } from 'react';
import { aggregateMacro, aggregateByDay, formatMacro, type MacroField, type RecipeMacros } from '@/lib/plans/macros';
import type { ProposedEntry } from '@/lib/weave-solver';

type RecipeRow = Partial<RecipeMacros> & { id: string; macros_estimated?: boolean | null };

interface Props {
  entries: ProposedEntry[];
  recipes: Record<string, RecipeRow>;
  nutritionalGoals?: Record<string, number>;
  // tracking gate — any one true unlocks accordion
  trackingEnabled: boolean; // (goals non-empty) || plan.track_intake || profile.track_intake
  // person count
  personCount: number;
  onPersonCountChange: (n: number) => void;
  // lifted state — WeaveSection owns this so WeaveGrid can react
  selectedField: MacroField | null;
  onFieldSelect: (field: MacroField | null) => void;
  planId: string;
}

const FIELDS: Array<{ key: MacroField; label: string; unit: string; color: string; goalKey: string }> = [
  { key: 'calories',  label: 'Energy',  unit: 'kcal', color: '#E67E22', goalKey: 'calories' },
  { key: 'protein_g', label: 'Protein', unit: 'g',    color: '#AEB873', goalKey: 'protein_g' },
  { key: 'carbs_g',   label: 'Carbs',   unit: 'g',    color: '#E0B85A', goalKey: 'carbs_g' },
  { key: 'fat_g',     label: 'Fat',     unit: 'g',    color: '#C8522A', goalKey: 'fat_g' },
];

function useLazyEstimator(recipes: Record<string, RecipeRow>) {
  const [estimated, setEstimated] = useState<Record<string, Partial<RecipeMacros>>>({});
  const recipeKey = Object.keys(recipes).sort().join(',');

  useEffect(() => {
    const missing = Object.values(recipes)
      .filter(r => !r.macros_estimated && (r.calories == null || r.protein_g == null))
      .slice(0, 12);
    if (missing.length === 0) return;

    let cancelled = false;
    const queue = [...missing];
    const workers = Array.from({ length: 6 }, async () => {
      while (queue.length > 0 && !cancelled) {
        const r = queue.shift()!;
        try {
          const res = await fetch(`/api/recipes/${r.id}/estimate-macros`, { method: 'POST' });
          if (!res.ok) continue;
          const d = await res.json();
          if (cancelled || !d.macros) continue;
          setEstimated(prev => ({ ...prev, [r.id]: d.macros }));
        } catch { /* swallow */ }
      }
    });
    void Promise.all(workers);
    return () => { cancelled = true; };
  }, [recipeKey]); // eslint-disable-line react-hooks/exhaustive-deps

  return estimated;
}

export function MacroSummary({
  entries, recipes, nutritionalGoals,
  trackingEnabled, personCount, onPersonCountChange,
  selectedField, onFieldSelect, planId,
}: Props) {
  const estimated = useLazyEstimator(recipes);
  const patchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Merge estimated macros into real values
  const merged: Record<string, Partial<RecipeMacros>> = {};
  for (const id of Object.keys(recipes)) {
    merged[id] = { ...estimated[id], ...recipes[id] };
    const real = recipes[id];
    const est = estimated[id];
    if (est) {
      const m = merged[id];
      for (const k of ['calories', 'protein_g', 'carbs_g', 'fat_g', 'fiber_g', 'sugar_g', 'sat_fat_g', 'sodium_mg'] as const) {
        if (real?.[k] == null && est[k] != null) m[k] = est[k];
      }
    }
  }

  const durationDays = entries.length > 0 ? Math.max(...entries.map(e => e.day_number), 1) : 1;
  const MONO = "var(--font-geist-mono, ui-monospace, monospace)";
  const SERIF = "var(--font-fraunces, 'Libre Baskerville', Georgia, serif)";

  const cal = aggregateMacro(entries, merged, 'calories');

  // Persist person count with debounce
  const handlePersonCount = (n: number) => {
    const clamped = Math.max(1, Math.min(20, n));
    onPersonCountChange(clamped);
    if (patchTimer.current) clearTimeout(patchTimer.current);
    patchTimer.current = setTimeout(() => {
      fetch(`/api/plans/${planId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ person_count: clamped }),
      }).catch(() => {/* silent */});
    }, 800);
  };

  const toggleField = (field: MacroField) => {
    if (!trackingEnabled) return;
    onFieldSelect(selectedField === field ? null : field);
  };

  return (
    <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid #2A1E13' }}>
      {/* Header row */}
      <div className="flex items-center justify-between px-5 pt-4 pb-3 gap-4 flex-wrap">
        <h3 style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.16em', textTransform: 'uppercase', color: '#6E573D' }}>
          Week macros — per person
        </h3>

        {/* Person count stepper */}
        <div className="flex items-center gap-2">
          <span style={{ fontFamily: MONO, fontSize: 10, color: '#6E573D' }}>Cooking for</span>
          <button
            onClick={() => handlePersonCount(personCount - 1)}
            className="w-5 h-5 rounded-full flex items-center justify-center text-xs transition-colors"
            style={{ background: '#2A1E13', color: '#9A7E5E', border: '1px solid #3A2A1A' }}
          >−</button>
          <span style={{ fontFamily: MONO, fontSize: 12, color: '#EFE3CE', minWidth: 24, textAlign: 'center' }}>
            {personCount}
          </span>
          <button
            onClick={() => handlePersonCount(personCount + 1)}
            className="w-5 h-5 rounded-full flex items-center justify-center text-xs transition-colors"
            style={{ background: '#2A1E13', color: '#9A7E5E', border: '1px solid #3A2A1A' }}
          >+</button>
        </div>

        <span style={{ fontFamily: MONO, fontSize: 10, color: '#AEB873' }}>
          ✓ {cal.known_slots}/{cal.total_slots} cook days have macros known
        </span>
      </div>

      {/* 4 macro cards */}
      <div className="grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', gap: 1, background: '#2A1E13' }}>
        {FIELDS.map((f) => {
          const agg = aggregateMacro(entries, merged, f.key);
          const total = personCount > 0 ? agg.total / personCount : agg.total;
          const fmt = formatMacro({ ...agg, total }, f.unit);
          const goalPerDay = nutritionalGoals?.[f.goalKey];
          const goal = goalPerDay && goalPerDay > 0 ? (goalPerDay / personCount) * durationDays : null;
          const pct = goal && goal > 0 ? Math.min(1, total / goal) : 0.7;
          const num = fmt.display.replace(f.unit.trim(), '').trim();
          const isSelected = selectedField === f.key;

          return (
            <button
              key={f.key}
              onClick={() => toggleField(f.key)}
              className="px-5 py-4 text-left transition-colors w-full"
              style={{
                background: isSelected ? '#1C150E' : '#15100B',
                cursor: trackingEnabled ? 'pointer' : 'default',
                outline: isSelected ? `1px solid ${f.color}40` : 'none',
              }}
            >
              <div className="flex items-center justify-between">
                <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#6E573D' }}>
                  {f.label}
                </div>
                {trackingEnabled && (
                  <span style={{ color: f.color, fontSize: 10, opacity: 0.7 }}>{isSelected ? '▴' : '▾'}</span>
                )}
              </div>
              <div style={{ fontFamily: SERIF, fontSize: 28, fontWeight: 600, color: fmt.em ? '#6E573D' : '#EFE3CE', marginTop: 6, letterSpacing: '-0.01em', lineHeight: 1 }}>
                {num}
                <span style={{ fontFamily: MONO, fontSize: 12, color: '#9A7E5E', fontWeight: 400, marginLeft: 3 }}>{f.unit}</span>
                {fmt.tilde && <span style={{ fontFamily: MONO, fontSize: 11, color: '#6E573D', marginLeft: 6 }}>~</span>}
              </div>
              <div className="rounded-full overflow-hidden" style={{ height: 4, background: '#241A11', marginTop: 12 }}>
                <span className="block h-full rounded-full" style={{ width: `${pct * 100}%`, background: f.color }} />
              </div>
            </button>
          );
        })}
      </div>

      {/* Accordion — per-day breakdown for selectedField */}
      {trackingEnabled && selectedField && (() => {
        const field = FIELDS.find(f => f.key === selectedField)!;
        const byDay = aggregateByDay(entries, merged, selectedField);
        const dayNums = Array.from({ length: durationDays }, (_, i) => i + 1);
        const maxVal = Math.max(...dayNums.map(d => (byDay[d]?.total ?? 0) / personCount), 1);

        return (
          <div style={{ background: '#15100B', borderTop: `1px solid ${field.color}30`, padding: '12px 20px 16px' }}>
            <div style={{ fontFamily: MONO, fontSize: 9, letterSpacing: '0.16em', textTransform: 'uppercase', color: field.color, marginBottom: 10 }}>
              {field.label} — {field.unit} per person per day
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {dayNums.map(day => {
                const agg = byDay[day];
                const val = agg ? agg.total / personCount : null;
                const pct = val != null ? val / maxVal : 0;
                return (
                  <div key={day} style={{ display: 'grid', gridTemplateColumns: '28px 1fr 44px', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontFamily: MONO, fontSize: 9, color: '#6E573D', textAlign: 'right' }}>D{day}</span>
                    <div style={{ height: 6, background: '#241A11', borderRadius: 3, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${pct * 100}%`, background: field.color, borderRadius: 3, transition: 'width 0.3s ease' }} />
                    </div>
                    <span style={{ fontFamily: MONO, fontSize: 10, fontWeight: 600, color: val != null ? '#EFE3CE' : '#3A2A1A' }}>
                      {val != null ? `${Math.round(val)}${field.unit}` : '—'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })()}
    </div>
  );
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
npx tsc --noEmit 2>&1 | grep MacroSummary
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/plans/MacroSummary.tsx
git commit -m "feat(macros): accordion per-day breakdown + person count stepper + tracking gate"
```

---

### Task 7: WeaveSection — lift selectedField + compute dayMacroValues

**Files:**
- Modify: `src/components/plans/WeaveSection.tsx`

- [ ] **Step 1: Add selectedField state and pass new props**

Find the `return (` in `WeaveSection` and make these changes:

```tsx
// 1. Add new import at top (after existing imports)
import { useState } from 'react';
import { aggregateByDay, type MacroField } from '@/lib/plans/macros';

// 2. Inside the WeaveSection function body, before the return, add:
const [selectedField, setSelectedField] = useState<MacroField | null>(null);
const [personCount, setPersonCount] = useState<number>(props.personCount ?? 1);

// Day macro values for WeaveGrid headers — calories by default, active field when accordion is open
const dayMacroValues: Record<number, number | null> = {};
const activeField = selectedField ?? 'calories';
const byDay = aggregateByDay(state.weave?.entries ?? [], macrosLookup, activeField);
const durationDays2 = props.durationDays;
for (let d = 1; d <= durationDays2; d++) {
  const agg = byDay[d];
  dayMacroValues[d] = agg && agg.known_slots > 0 ? agg.total / personCount : null;
}
```

- [ ] **Step 2: Update MacroSummary usage inside the return JSX**

Find `<MacroSummary` and replace with:

```tsx
<MacroSummary
  entries={state.weave.entries}
  recipes={macrosLookup}
  nutritionalGoals={nutritionalGoals}
  trackingEnabled={props.trackingEnabled}
  personCount={personCount}
  onPersonCountChange={setPersonCount}
  selectedField={selectedField}
  onFieldSelect={setSelectedField}
  planId={props.planId}
/>
```

- [ ] **Step 3: Update WeaveGrid usage to pass dayMacroValues + activeMacroField**

Find `<WeaveGrid` and add two props:

```tsx
<WeaveGrid
  {/* …existing props… */}
  dayMacroValues={dayMacroValues}
  activeMacroField={selectedField}
  activeMacroUnit={selectedField ? { calories: 'kcal', protein_g: 'g', carbs_g: 'g', fat_g: 'g' }[selectedField] : 'kcal'}
  activeMacroColor={selectedField ? { calories: '#E67E22', protein_g: '#AEB873', carbs_g: '#E0B85A', fat_g: '#C8522A' }[selectedField] : '#E67E22'}
/>
```

- [ ] **Step 4: Add `trackingEnabled` + `personCount` to WeaveSection Props interface**

```tsx
// Find the Props interface in WeaveSection.tsx and add:
trackingEnabled: boolean;
personCount: number;
```

- [ ] **Step 5: Verify TypeScript**

```bash
npx tsc --noEmit 2>&1 | grep WeaveSection
```

- [ ] **Step 6: Commit**

```bash
git add src/components/plans/WeaveSection.tsx
git commit -m "feat(macros): lift selectedField to WeaveSection, compute dayMacroValues"
```

---

### Task 8: WeaveGrid — per-day macro values in column headers

**Files:**
- Modify: `src/components/plans/WeaveGrid.tsx`

- [ ] **Step 1: Add new props to WeaveGrid's Props interface**

Find the Props interface and add:

```tsx
dayMacroValues?: Record<number, number | null>;
activeMacroField?: string | null;
activeMacroUnit?: string;
activeMacroColor?: string;
```

- [ ] **Step 2: Replace the day column header rendering**

Find the block that renders day headers (the `Array.from({ length: durationDays }).map` that produces `<div key={i} className="text-center pb-2" ...>`):

```tsx
{Array.from({ length: durationDays }).map((_, i) => {
  const day = i + 1;
  const stats = dayStats(day);
  const macroVal = dayMacroValues?.[day];
  const color = activeMacroColor ?? '#E67E22';
  const unit = activeMacroUnit ?? 'kcal';
  return (
    <div key={i} className="text-center pb-2" style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#C9B79B' }}>
      <div>{dayLabel(day)}</div>
      {/* Per-day macro value */}
      {macroVal != null && (
        <div style={{ fontFamily: MONO, fontSize: 10, color, fontWeight: 600, marginTop: 2 }}>
          {Math.round(macroVal)}{unit}
        </div>
      )}
      {macroVal == null && dayMacroValues && (
        <div style={{ fontSize: 9, color: '#3A2A1A', marginTop: 2 }}>—</div>
      )}
      <DayDensityRibbon cookMinutes={stats.cookMinutes} hasLeftover={stats.hasLeftover} pantryPct={stats.pantryPct} />
    </div>
  );
})}
```

- [ ] **Step 3: Verify TypeScript**

```bash
npx tsc --noEmit 2>&1 | grep WeaveGrid
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/components/plans/WeaveGrid.tsx
git commit -m "feat(macros): show per-day macro values in WeaveGrid column headers"
```

---

### Task 9: Wire person_count + track_intake through plan page, builder, PATCH route, and settings

**Files:**
- Modify: `src/app/(app)/plans/[id]/page.tsx`
- Modify: `src/app/(app)/plans/[id]/plan-builder.tsx`
- Modify: `src/app/api/plans/[id]/route.ts`
- Modify: `src/app/(app)/settings/page.tsx`
- Modify: `src/app/(app)/settings/settings-client.tsx`

- [ ] **Step 1: plan page.tsx — fetch profile.track_intake + pass new plan columns**

In `src/app/(app)/plans/[id]/page.tsx`, update the Supabase query to include the new columns and fetch the user's profile:

```tsx
// Replace the Promise.all block:
const [{ data: plan }, { data: saves }, { data: profile }] = await Promise.all([
  supabase
    .from("meal_plans")
    .select("id, title, duration_days, week_start, meals_per_day, status, pinboard_filters, dietary_filters, nutritional_goals, user_id, person_count, track_intake")
    .eq("id", id)
    .single(),
  supabase
    .from("recipe_saves")
    .select("recipe:recipes!inner(id, title, image_url, dietary_tags, prep_time_minutes, cook_time_minutes, calories, cuisine_type)")
    .eq("user_id", user!.id)
    .order("saved_at", { ascending: false })
    .limit(40),
  supabase
    .from("profiles")
    .select("track_intake")
    .eq("id", user!.id)
    .single(),
]);
```

Then update the `<PlanBuilder>` usage:

```tsx
const hasGoals = Object.keys((plan.nutritional_goals ?? {}) as Record<string, number>).length > 0;
const trackingEnabled = hasGoals || !!plan.track_intake || !!(profile?.track_intake);

<PlanBuilder
  planId={plan.id}
  planTitle={plan.title}
  durationDays={plan.duration_days ?? 7}
  weekStart={plan.week_start ?? null}
  mealsPerDay={plan.meals_per_day ?? 3}
  status={(plan.status ?? "draft") as PlanStatus}
  pinboardFilters={(plan.pinboard_filters ?? {}) as Partial<PinboardFilters>}
  nutritionalGoals={(plan.nutritional_goals ?? {}) as Record<string, number>}
  personCount={plan.person_count ?? 1}
  trackingEnabled={trackingEnabled}
/>
```

- [ ] **Step 2: plan-builder.tsx — add personCount + trackingEnabled props and thread to WeaveSection**

In `src/app/(app)/plans/[id]/plan-builder.tsx`, update `PlanBuilderProps`:

```tsx
export interface PlanBuilderProps {
  planId: string;
  planTitle: string;
  durationDays: number;
  weekStart: string | null;
  mealsPerDay: number;
  status: PlanStatus;
  pinboardFilters: Partial<PinboardFilters>;
  nutritionalGoals?: Record<string, number>;
  personCount: number;       // new
  trackingEnabled: boolean;  // new
}
```

And thread to `<WeaveSection>`:

```tsx
<WeaveSection
  {/* …existing props… */}
  personCount={props.personCount}
  trackingEnabled={props.trackingEnabled}
/>
```

- [ ] **Step 3: PATCH route — allow person_count and track_intake fields**

In `src/app/api/plans/[id]/route.ts`, find the PATCH handler. Locate where the update object is built and add the two new fields to the allowlist:

```ts
// Inside the PATCH handler, find the allowed-fields object (likely called `update` or similar).
// Add these two fields alongside existing ones:
if (body.person_count !== undefined) update.person_count = Math.max(1, Number(body.person_count));
if (body.track_intake !== undefined) update.track_intake = Boolean(body.track_intake);
```

- [ ] **Step 4: settings page.tsx — fetch and pass profile.track_intake**

In `src/app/(app)/settings/page.tsx`, add profile fetch:

```tsx
// At the top of the default export function, fetch the user profile
const supabase = await createClient();
const { data: { user } } = await supabase.auth.getUser();
const { data: profile } = user
  ? await supabase.from("profiles").select("track_intake").eq("id", user.id).single()
  : { data: null };
```

Then pass to `<SettingsClient>`:

```tsx
<SettingsClient trackIntake={profile?.track_intake ?? false} userId={user?.id ?? null} />
```

- [ ] **Step 5: settings-client.tsx — add track_intake toggle section**

In `src/app/(app)/settings/settings-client.tsx`:

**a) Add `useState` import** (it's already imported — verify; if not, add it).

**b) Add `BarChart2` to the lucide import** at the top of the file (alongside existing icons like `Palette`, `Moon`, etc.):
```tsx
import { ..., BarChart2 } from "lucide-react";
```

**c) Replace the `export function SettingsClient()` signature** with:
```tsx
interface SettingsClientProps {
  trackIntake: boolean;
  userId: string | null;
}

export function SettingsClient({ trackIntake: initialTrackIntake, userId }: SettingsClientProps) {
  const { theme, setTheme } = useTheme();
  const [trackIntake, setTrackIntake] = useState(initialTrackIntake);

  const toggleTrackIntake = async (val: boolean) => {
    setTrackIntake(val);
    if (!userId) return;
    await fetch('/api/profile/track-intake', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ track_intake: val }),
    }).catch(() => setTrackIntake(!val));
  };
```

**d) Add this Section just before the closing `</div>` of the SettingsClient return** (after the Report Fixer Section):
```tsx
      {/* ── Nutritional Tracking ── */}
      <Section icon={<BarChart2 style={{ width: 16, height: 16 }} />} title="Nutritional Tracking">
        <p className="text-xs mb-4" style={{ color: "#7A5A40", lineHeight: 1.6 }}>
          When enabled, meal plan macro cards become clickable and show a per-day per-person breakdown.
          Only turn this on if nutritional tracking actively supports your goals.
        </p>
        <div className="flex items-center justify-between">
          <span className="text-sm" style={{ color: trackIntake ? "#EFE3CE" : "#7A5A40" }}>
            {trackIntake ? "Tracking enabled across all plans" : "Tracking off"}
          </span>
          <button
            onClick={() => toggleTrackIntake(!trackIntake)}
            className="relative w-10 h-6 rounded-full transition-colors"
            style={{ background: trackIntake ? "#AEB873" : "#2A1E13", border: "1px solid #3A2A1A" }}
          >
            <span
              className="absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform"
              style={{ transform: trackIntake ? "translateX(16px)" : "translateX(2px)" }}
            />
          </button>
        </div>
      </Section>
```

Note: also create the micro-API route `src/app/api/profile/track-intake/route.ts`:

```ts
// src/app/api/profile/track-intake/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { track_intake } = await req.json() as { track_intake: boolean };
  const { error } = await supabase.from("profiles").update({ track_intake }).eq("id", user.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 6: Verify TypeScript**

```bash
npx tsc --noEmit 2>&1 | grep -E "plan-builder|WeaveSection|settings"
```

Expected: no errors.

- [ ] **Step 7: Commit**

```bash
git add src/app/(app)/plans/[id]/page.tsx src/app/(app)/plans/[id]/plan-builder.tsx
git add src/app/api/plans/[id]/route.ts src/app/api/profile/track-intake/route.ts
git add src/app/(app)/settings/page.tsx src/app/(app)/settings/settings-client.tsx
git commit -m "feat(macros): wire person_count + trackingEnabled gate through plan page and settings"
```

---

## SECTION C — Autocomplete Fix

---

### Task 10: RecipeSearchBar — portal dropdown

**Files:**
- Modify: `src/components/plans/RecipeSearchBar.tsx`

- [ ] **Step 1: Rewrite RecipeSearchBar with portal-based dropdown**

Replace the entire file:

```tsx
'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { RecipeImage } from '@/components/recipe-image';

interface AutocompleteRecipe {
  id: string;
  title: string;
  image_url: string | null;
  focal_x?: number | null;
  focal_y?: number | null;
}

interface Props {
  pinnedIds: Set<string>;
  onTogglePin: (recipe_id: string) => void;
  placeholder?: string;
  variant?: 'hero' | 'slim';
}

interface DropdownRect { top: number; left: number; width: number; }

export function RecipeSearchBar({ pinnedIds, onTogglePin, placeholder = 'Search & add recipes…', variant = 'slim' }: Props) {
  const [q, setQ] = useState('');
  const [results, setResults] = useState<AutocompleteRecipe[]>([]);
  const [open, setOpen] = useState(false);
  const [focusedIdx, setFocusedIdx] = useState(-1);
  const [dropRect, setDropRect] = useState<DropdownRect | null>(null);
  const [mounted, setMounted] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => { setMounted(true); }, []);

  const updateRect = useCallback(() => {
    if (!containerRef.current) return;
    const r = containerRef.current.getBoundingClientRect();
    setDropRect({ top: r.bottom + 4, left: r.left, width: r.width });
  }, []);

  // Reposition on scroll/resize while open
  useEffect(() => {
    if (!open) return;
    updateRect();
    window.addEventListener('scroll', updateRect, { passive: true, capture: true });
    window.addEventListener('resize', updateRect, { passive: true });
    return () => {
      window.removeEventListener('scroll', updateRect, true);
      window.removeEventListener('resize', updateRect);
    };
  }, [open, updateRect]);

  const search = useCallback((query: string) => {
    if (query.length < 2) { setResults([]); setOpen(false); return; }
    const params = new URLSearchParams({ q: query, limit: '8' });
    fetch(`/api/recipes/autocomplete?${params}`)
      .then(r => r.ok ? r.json() : [])
      .then((data: AutocompleteRecipe[]) => {
        setResults(data); setOpen(data.length > 0); setFocusedIdx(-1);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => search(q), 200);
    return () => { if (timer.current) clearTimeout(timer.current); };
  }, [q, search]);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const pick = (recipe: AutocompleteRecipe) => {
    onTogglePin(recipe.id);
    setQ(''); setResults([]); setOpen(false);
    inputRef.current?.focus();
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (!open) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); setFocusedIdx(i => Math.min(i + 1, results.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setFocusedIdx(i => Math.max(i - 1, -1)); }
    else if (e.key === 'Enter' && focusedIdx >= 0) { e.preventDefault(); pick(results[focusedIdx]); }
    else if (e.key === 'Escape') setOpen(false);
  };

  const hero = variant === 'hero';

  const dropdown = open && results.length > 0 && dropRect && mounted
    ? createPortal(
        <ul
          style={{
            position: 'fixed',
            top: dropRect.top,
            left: dropRect.left,
            width: dropRect.width,
            zIndex: 9999,
            background: '#1A120A',
            border: '1px solid #3A2A1A',
            borderRadius: 8,
            boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
            maxHeight: 320,
            overflowY: 'auto',
            margin: 0,
            padding: 0,
            listStyle: 'none',
          }}
        >
          {results.map((r, i) => {
            const pinned = pinnedIds.has(r.id);
            const focused = i === focusedIdx;
            return (
              <li key={r.id}>
                <button
                  onMouseDown={e => { e.preventDefault(); pick(r); }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-left transition-colors"
                  style={{
                    background: focused ? '#2A1F14' : 'transparent',
                    borderBottom: '1px solid #2A1F14',
                  }}
                >
                  <div className="w-8 h-8 rounded overflow-hidden shrink-0" style={{ background: '#2A1F14' }}>
                    <RecipeImage
                      recipeId={r.id} imageUrl={r.image_url} title={r.title}
                      focal_x={r.focal_x} focal_y={r.focal_y} className="w-full h-full"
                    />
                  </div>
                  <span className="flex-1 text-sm line-clamp-1" style={{ color: '#EFE3CE' }}>{r.title}</span>
                  <span className="text-xs shrink-0" style={{ color: pinned ? '#7AA350' : '#6B4E36' }}>
                    {pinned ? '✓ Pinned' : '+ Pin'}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>,
        document.body
      )
    : null;

  return (
    <div ref={containerRef} className="relative flex-1 min-w-0">
      <div className="relative flex items-center">
        <span
          className="absolute pointer-events-none"
          style={{ left: hero ? 18 : 12, color: hero ? '#E67E22' : '#6B4E36', fontSize: hero ? 17 : 14 }}
        >⌕</span>
        <input
          ref={inputRef}
          type="text"
          value={q}
          onChange={e => setQ(e.target.value)}
          onFocus={() => { if (results.length > 0) { setOpen(true); updateRect(); } }}
          onKeyDown={onKeyDown}
          placeholder={placeholder}
          className="w-full focus:outline-none"
          style={hero ? {
            paddingLeft: 44, paddingRight: 16, paddingTop: 14, paddingBottom: 14,
            borderRadius: 14, fontSize: 16,
            background: '#0C0907', border: '1px solid #3A2A1B', color: '#EFE3CE',
          } : {
            paddingLeft: 34, paddingRight: 12, paddingTop: 6, paddingBottom: 6,
            borderRadius: 999, fontSize: 14,
            background: '#241A11', border: '1px solid #3A2A1B', color: '#EFE3CE',
          }}
        />
      </div>
      {dropdown}
    </div>
  );
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
npx tsc --noEmit 2>&1 | grep RecipeSearchBar
```

Expected: no errors.

- [ ] **Step 3: Test manually**

Start the dev server (`npm run dev` in `C:\Users\lasse\Desktop\whatscooking`), open a plan builder, type at least 2 characters in the recipe search bar. Confirm:
- Dropdown renders fully visible (not clipped)
- Results are scrollable if more than ~5 items
- Dropdown repositions when the page is scrolled
- Keyboard navigation (↑↓ Enter Escape) still works
- Clicking outside closes dropdown

- [ ] **Step 4: Commit**

```bash
git add src/components/plans/RecipeSearchBar.tsx
git commit -m "fix(plans): portal-based autocomplete dropdown escapes overflow clipping"
```

---

## Verification Checklist

### Cookbooks
- [ ] Follow a creator → card shows "Following ✓", Following tab shows their cookbooks
- [ ] Unfollow → card updates immediately (optimistic), Following tab removes the book
- [ ] Hover a cookbook card with ≥2 recipe images → gradient fades to collage
- [ ] Cookbook with no recipe images → gradient + emoji only, no broken collage
- [ ] Own cookbooks don't show a Follow button

### Macro Accordion
- [ ] Plan with empty `nutritional_goals` + no `track_intake` → macro cards render, no chevron, not clickable
- [ ] Set `plan.track_intake = true` (via Settings toggle) → chevrons appear, cards are clickable
- [ ] Click Protein card → bar chart expands below all 4 cards; grid column headers show protein g/person
- [ ] Click Protein again → collapses; headers return to kcal
- [ ] Set person count to 2 → all values halve
- [ ] Person count persists after page reload (PATCH was saved)

### Autocomplete
- [ ] In plan builder Pinboard, type "pasta" → dropdown renders above or below the input, fully visible
- [ ] Long result list → dropdown scrolls at 320px max height
- [ ] Scroll the page while dropdown is open → dropdown follows the input position
