# Nav Reorder Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restructure the sidebar nav so Discover / Meal Swipe / World Cuisines (with Fusion + World Cup as children) / All Recipes are the top-level Discover items.

**Architecture:** Single file change to `NAV_GROUPS` constant in `app-nav.tsx`. The `World Cuisines` item gets a `children` flyout containing Fusion Foods and World Cup 2026. All Recipes and Meal Swipe become direct (no-flyout) Discover items.

**Tech Stack:** React, Next.js App Router, lucide-react icons

---

### Task 1: Update NAV_GROUPS in app-nav.tsx

**Files:**
- Modify: `src/components/app-nav.tsx:27-83`

**Current structure** (lines 27-83):
```
Discover
  └── All Recipes (parent with children: All Recipes, Meal Swipe, World Cuisines, World Cup)
Plan & Host: Meal Plans, Dinner & Events, Nutrient Tracker
Kitchen
  └── My Pantry (parent with children: My Pantry, Shopping List)
```

**Target structure:**
```
Discover
  ├── Discover        → /discover  (no children)
  ├── Meal Swipe      → /swipe     (no children)
  ├── World Cuisines  → /cuisines  (parent with children: Fusion Foods, World Cup 2026)
  └── All Recipes     → /recipes   (no children)
Plan & Host: unchanged
Kitchen: unchanged
```

- [ ] **Step 1: Open the file and note the current imports at lines 1-16**

Confirm `Globe`, `Trophy`, `Shuffle`, `UtensilsCrossed`, `Compass` are imported (or add `Compass` for Discover). Current imports line 6-8:
```ts
ChefHat, UtensilsCrossed, ShoppingBasket, Calendar, PartyPopper,
Target, LogOut, Shuffle, Globe, Trophy,
ChevronRight, ShoppingCart,
```
`Compass` is not imported — add it for the Discover nav item.

- [ ] **Step 2: Add Compass to the import**

In `src/components/app-nav.tsx` line 5-9, change:
```ts
import {
  ChefHat, UtensilsCrossed, ShoppingBasket, Calendar, PartyPopper,
  Target, LogOut, Shuffle, Globe, Trophy,
  ChevronRight, ShoppingCart,
} from "lucide-react";
```
to:
```ts
import {
  ChefHat, UtensilsCrossed, ShoppingBasket, Calendar, PartyPopper,
  Target, LogOut, Shuffle, Globe, Trophy, Compass,
  ChevronRight, ShoppingCart,
} from "lucide-react";
```

- [ ] **Step 3: Replace NAV_GROUPS with new structure**

Replace lines 27-83 (the entire `NAV_GROUPS` constant):
```ts
const NAV_GROUPS: NavGroup[] = [
  {
    group: "Discover",
    items: [
      {
        href: "/discover",
        label: "Discover",
        icon: Compass,
        desc: "",
      },
      {
        href: "/swipe",
        label: "Meal Swipe",
        icon: Shuffle,
        desc: "",
      },
      {
        href: "/cuisines",
        label: "World Cuisines",
        icon: Globe,
        desc: "",
        children: [
          { href: "/cuisines/fusion",        label: "Fusion Foods",   icon: Globe,  desc: "" },
          { href: "/cuisines/world-cup-2026", label: "World Cup 2026", icon: Trophy, desc: "" },
        ],
      },
      {
        href: "/recipes",
        label: "All Recipes",
        icon: UtensilsCrossed,
        desc: "",
      },
    ],
  },
  {
    group: "Plan & Host",
    items: [
      { href: "/plans",           label: "Meal Plans",       icon: Calendar,    desc: "" },
      { href: "/events",          label: "Dinner & Events",  icon: PartyPopper, desc: "" },
      { href: "/calorie-tracker", label: "Nutrient Tracker", icon: Target,      desc: "" },
    ],
  },
  {
    group: "Kitchen",
    items: [
      {
        href: "/pantry",
        label: "My Pantry",
        icon: ShoppingBasket,
        desc: "",
        children: [
          { href: "/pantry",        label: "My Pantry",     icon: ShoppingBasket, desc: "" },
          { href: "/shopping-list", label: "Shopping List", icon: ShoppingCart,   desc: "" },
        ],
      },
    ],
  },
];
```

- [ ] **Step 4: Verify TypeScript compiles**

```bash
cd C:\Users\lasse\Desktop\whatscooking && npx tsc --noEmit
```
Expected: no errors related to `app-nav.tsx`.

- [ ] **Step 5: Commit**

```bash
git add src/components/app-nav.tsx
git commit -m "feat: reorder sidebar nav — Discover/Swipe/World Cuisines/All Recipes structure"
```
