# Navigation & Layout Redesign — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restructure the sidebar nav into three groups (Discover / Plan & Host / Kitchen), slim down the top bar to four elements, merge dinner-parties into /events, and fix z-index so the sidebar always layers above every other element.

**Architecture:** All changes are surgical edits to three existing files (`app-nav.tsx`, `top-bar.tsx`, `cuisine-nav.tsx`) plus two redirect shims for the dinner-parties routes. No new files are created. The NAV_GROUPS array is the single source of truth for sidebar structure.

**Tech Stack:** Next.js 15 App Router, TypeScript, Tailwind CSS, Lucide React icons

---

## File Map

| File | Change |
|------|--------|
| `src/components/app-nav.tsx` | Replace NAV_GROUPS, bump nav z-index from `z-40` to `z-50` |
| `src/components/top-bar.tsx` | Remove 3 feature cards, slim height to 52px, add Premium pill, reorder elements |
| `src/components/cuisine-nav.tsx` | Lower `.cuisine-sticky-nav` z-index from 50 to 40 |
| `src/app/(app)/dinner-parties/page.tsx` | Replace with redirect to `/events` |
| `src/app/(app)/dinner-parties/[id]/page.tsx` | Replace with redirect to `/events` |

---

## Task 1: Update sidebar NAV_GROUPS

**Files:**
- Modify: `src/components/app-nav.tsx`

- [ ] **Step 1: Replace the NAV_GROUPS constant**

Open `src/components/app-nav.tsx`. Find the `NAV_GROUPS` array (starts around line 27). Replace it entirely with:

```typescript
const NAV_GROUPS: NavGroup[] = [
  {
    group: "Discover",
    items: [
      {
        href: "/recipes",
        label: "All Recipes",
        icon: UtensilsCrossed,
        desc: "",
        children: [
          { href: "/recipes",        label: "All Recipes",    icon: UtensilsCrossed, desc: "" },
          { href: "/swipe",          label: "Meal Swipe",     icon: Shuffle,         desc: "" },
          { href: "/cuisines",       label: "World Cuisines", icon: Globe,           desc: "" },
          { href: "/world-cup-2026", label: "World Cup 2026", icon: Trophy,          desc: "" },
        ],
      },
    ],
  },
  {
    group: "Plan & Host",
    items: [
      {
        href: "/plans",
        label: "Meal Plans",
        icon: Calendar,
        desc: "",
      },
      {
        href: "/events",
        label: "Dinner & Events",
        icon: PartyPopper,
        desc: "",
      },
      {
        href: "/calorie-tracker",
        label: "Nutrient Tracker",
        icon: Target,
        desc: "",
      },
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

- [ ] **Step 2: Remove unused imports**

In the same file, check the imports block at the top. Remove `Heart`, `BookOpen` from the lucide import if they are no longer used anywhere else in the file. The remaining needed icons are: `ChefHat`, `UtensilsCrossed`, `ShoppingBasket`, `Calendar`, `PartyPopper`, `Target`, `LogOut`, `Shuffle`, `Globe`, `Trophy`, `ChevronRight`, `ShoppingCart`.

- [ ] **Step 3: Bump sidebar z-index**

Find the `<nav>` element (around line 361). It has `className` containing `z-40`. Change it to `z-50`:

```tsx
// Before
className={`wc-nav flex flex-col border-r h-screen fixed top-0 left-0 z-40${flyout ? " wc-nav--flyout-open" : ""}`}

// After
className={`wc-nav flex flex-col border-r h-screen fixed top-0 left-0 z-50${flyout ? " wc-nav--flyout-open" : ""}`}
```

- [ ] **Step 4: Verify in browser**

Start the dev server (`npm run dev`). Open the app. Hover the sidebar to expand it. Confirm:
- Three groups: Discover, Plan & Host, Kitchen
- Discover flyout shows: All Recipes, Meal Swipe, World Cuisines, World Cup 2026
- Kitchen flyout shows: My Pantry, Shopping List
- Plan & Host shows: Meal Plans, Dinner & Events, Nutrient Tracker as flat items (no flyout)
- No broken links (clicking each item navigates correctly)

- [ ] **Step 5: Commit**

```bash
cd "C:\Users\lasse\Desktop\whatscooking"
git add src/components/app-nav.tsx
git commit -m "feat: restructure sidebar into Discover/Plan & Host/Kitchen groups"
```

---

## Task 2: Fix cuisine nav z-index

**Files:**
- Modify: `src/components/cuisine-nav.tsx`

- [ ] **Step 1: Lower the z-index in the inline style block**

Open `src/components/cuisine-nav.tsx`. Find the `<style>` block (around line 75). Change `z-index: 50` to `z-index: 40`:

```css
/* Before */
.cuisine-sticky-nav {
  position: sticky;
  top: 0;
  z-index: 50;

/* After */
.cuisine-sticky-nav {
  position: sticky;
  top: 0;
  z-index: 40;
```

- [ ] **Step 2: Verify in browser**

Navigate to `/cuisines`. Hover the sidebar to expand it. Confirm the expanded sidebar overlaps the cuisine continent picker bar — not the other way around.

- [ ] **Step 3: Commit**

```bash
git add src/components/cuisine-nav.tsx
git commit -m "fix: lower cuisine nav z-index so expanded sidebar renders above it"
```

---

## Task 3: Add dinner-parties redirect shims

**Files:**
- Modify: `src/app/(app)/dinner-parties/page.tsx`
- Modify: `src/app/(app)/dinner-parties/[id]/page.tsx`

- [ ] **Step 1: Replace dinner-parties index page with redirect**

Open `src/app/(app)/dinner-parties/page.tsx`. Replace the entire file content with:

```typescript
import { redirect } from "next/navigation";

export default function DinnerPartiesPage() {
  redirect("/events");
}
```

- [ ] **Step 2: Replace dinner-parties detail page with redirect**

Open `src/app/(app)/dinner-parties/[id]/page.tsx`. Replace the entire file content with:

```typescript
import { redirect } from "next/navigation";

export default function DinnerPartyDetailPage() {
  redirect("/events");
}
```

- [ ] **Step 3: Verify redirects work**

In the browser, navigate to `/dinner-parties`. Confirm it redirects to `/events`. Navigate to `/dinner-parties/any-id`. Confirm it also redirects to `/events`.

- [ ] **Step 4: Commit**

```bash
git add src/app/(app)/dinner-parties/page.tsx src/app/(app)/dinner-parties/[id]/page.tsx
git commit -m "feat: redirect /dinner-parties to /events (merged routes)"
```

---

## Task 4: Slim down the top bar

**Files:**
- Modify: `src/components/top-bar.tsx`

- [ ] **Step 1: Remove unused NAV_FEATURES and their imports**

Open `src/components/top-bar.tsx`. Delete the entire `NAV_FEATURES` constant (lines ~21–49). Also remove these now-unused lucide imports: `Shuffle`, `Zap`, `Star`, `Sparkles` — but keep `Leaf`, `X`, `Plus`, `Check`, `RefreshCw`, `Filter`, `ShieldAlert`, `Bell`, `User`, `Settings`.

- [ ] **Step 2: Replace the topbar inner layout**

Find the `<div className="wc-topbar-inner">` block. Replace everything inside it with this slimmer layout:

```tsx
<div className="wc-topbar-inner">

  {/* ── Dietary Filters (left) ── */}
  <div className="relative" ref={dietaryRef}>
    <button
      className={`wc-slim-btn${dietaryOpen ? " wc-slim-btn--active" : ""}`}
      onClick={() => setDietaryOpen((v) => !v)}
    >
      <Leaf style={{ width: 13, height: 13, color: active ? "var(--wc-sage)" : "var(--wc-text-3)" }} />
      <span style={{ fontSize: "0.75rem", fontWeight: 600, color: active ? "var(--wc-sage)" : "var(--wc-text-3)" }}>
        Dietary Filters
        {restrictionCount > 0 && (
          <span style={{
            marginLeft: 6,
            fontSize: "0.6rem",
            fontWeight: 700,
            padding: "1px 6px",
            borderRadius: 99,
            background: "var(--wc-sage)",
            color: "var(--wc-bg-base)",
          }}>
            {restrictionCount}
          </span>
        )}
      </span>
    </button>

    {/* Dietary panel — unchanged, keep existing JSX here */}
    {dietaryOpen && (
      <div className="wc-dietary-panel">
        {/* ... keep all existing dietary panel content unchanged ... */}
      </div>
    )}
  </div>

  {/* ── Spacer ── */}
  <div style={{ flex: 1 }} />

  {/* ── Premium pill ── */}
  <Link href="/premium" className="wc-slim-btn" style={{ gap: 5 }}>
    <Star style={{ width: 12, height: 12, color: "var(--wc-gold, #D4A84B)" }} />
    <span style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--wc-gold, #D4A84B)" }}>Premium</span>
  </Link>

  {/* ── Profile icon ── */}
  <Link href="/profile" className="wc-icon-btn" title="Profile">
    <User style={{ width: 15, height: 15 }} />
  </Link>

  {/* ── Settings icon ── */}
  <Link href="/settings" className="wc-icon-btn" title="Settings">
    <Settings style={{ width: 15, height: 15 }} />
  </Link>

  {/* ── Notifications bell (keep existing JSX) ── */}
  <div className="relative" ref={notifRef} style={{ flexShrink: 0 }}>
    {/* ... keep all existing notification button + panel JSX unchanged ... */}
  </div>

</div>
```

- [ ] **Step 3: Update the CSS style block**

Inside the `<style>` tag at the top of `TopBar`, replace the `.wc-topbar-inner`, `.wc-feature-row`, `.wc-feat-btn*` blocks with these new rules (keep the dietary panel, notification, and responsive rules):

```css
.wc-topbar-inner {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 20px;
  min-height: 52px;
}

.wc-slim-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 99px;
  border: 1px solid var(--wc-border-default);
  background: transparent;
  cursor: pointer;
  text-decoration: none;
  transition: background 0.15s ease, border-color 0.15s ease;
  flex-shrink: 0;
  font-family: inherit;
}
.wc-slim-btn:hover,
.wc-slim-btn--active {
  background: var(--wc-bg-hover);
  border-color: var(--wc-border-strong, rgba(90,50,20,0.7));
}

.wc-icon-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  border: none;
  background: transparent;
  cursor: pointer;
  color: var(--wc-text-3);
  text-decoration: none;
  transition: background 0.15s ease, color 0.15s ease;
  flex-shrink: 0;
}
.wc-icon-btn:hover { background: var(--wc-bg-hover); color: var(--wc-text); }

/* Lower dietary panel z-index so sidebar sits above it */
.wc-dietary-panel {
  z-index: 40;
}
```

Also delete the `@keyframes wc-premium-sweep` block and all `.wc-feat-btn*` CSS rules — they are no longer used.

- [ ] **Step 4: Remove unused state and refs**

In the `TopBar` function body, remove:
- `notifOpen`, `setNotifOpen`, `hasRead`, `setHasRead` state — keep these (notifications still work)
- Remove: `customInput`, `setCustomInput`, `customInputRef` — keep these (dietary panel still works)
- Nothing extra to remove — the notifications bell and dietary panel logic are fully preserved

- [ ] **Step 5: Verify in browser**

Refresh the app. Confirm:
- Top bar height is noticeably thinner (~52px vs old 88px)
- Left side: "Dietary Filters" pill with leaf icon — clicking opens the panel
- Center: empty space
- Right side: "Premium" gold pill → "Profile" icon → "Settings" icon → bell
- No shimmer animation on Premium
- Dietary panel still works correctly
- Notifications panel still works correctly

- [ ] **Step 6: Commit**

```bash
git add src/components/top-bar.tsx
git commit -m "feat: slim top bar to 52px, remove feature cards, add premium pill"
```

---

## Task 5: Final integration check

- [ ] **Step 1: Full navigation smoke test**

With `npm run dev` running, verify:
1. Sidebar expanded → overlaps dietary panel ✓
2. Sidebar expanded on `/cuisines` → overlaps continent nav bar ✓
3. `/dinner-parties` → redirects to `/events` ✓
4. `/dinner-parties/test-id` → redirects to `/events` ✓
5. All sidebar links navigate without 404 ✓
6. Top bar dietary filter panel opens and functions ✓
7. Top bar premium pill links to `/premium` ✓
8. Top bar profile icon links to `/profile` ✓
9. Notification bell opens panel ✓

- [ ] **Step 2: Commit**

```bash
git add -A
git commit -m "feat: complete nav/layout redesign — Spec A done"
```
