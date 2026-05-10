# Dark Rectangles Removal Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove the two dark grey accordion sections ("Kitchen Hacks" and "Premium Instagram Recipes") from the Discover page that look like generic template content.

**Architecture:** The dark rectangles are collapsed accordion `<details>` or expandable sections in `discover-client.tsx`. They render dark-background blocks as section separators. We'll remove their separate accordion UI and instead integrate hacks inline with the main recipe feed, and remove the premium section accordion entirely (premium recipes should just appear in the main grid tagged as "Premium").

**Tech Stack:** React, Next.js, Tailwind / CSS vars

---

### Task 1: Locate and remove the dark accordion sections in discover-client.tsx

**Files:**
- Modify: `src/app/(app)/discover/discover-client.tsx`

- [ ] **Step 1: Find the Kitchen Hacks accordion**

Search for the accordion rendering in `discover-client.tsx`:
```bash
grep -n "Kitchen Hacks\|hacks\|accordion\|ChevronDown\|expandedHacks\|showHacks" src/app/(app)/discover/discover-client.tsx
```

Note the line numbers of the hacks section wrapper div and the premium section wrapper div.

- [ ] **Step 2: Identify the dark background style on those sections**

Look for any `style={{ background:` or `className` with dark colors (`#1`, `#2`, `#3`, `rgba(0`, `rgba(1`, `rgba(2`) on those wrapper divs — these are the dark grey rectangles.

- [ ] **Step 3: Remove the hacks accordion section**

Find the JSX block that renders the "Kitchen Hacks" collapsible section. It will look like:
```tsx
{/* Hacks section */}
<div style={{ background: "..." }}>
  <button onClick={...}>Kitchen Hacks...</button>
  {expanded && <div>...</div>}
</div>
```

Delete the entire block (from the opening `<div>` of the hacks section to its closing `</div>`). The hack recipes data is passed as a prop but no longer displayed as an accordion — hacks can be shown inline or simply removed from the discover page.

- [ ] **Step 4: Remove the Premium Instagram Recipes accordion section**

Find the JSX block that renders "Premium Instagram Recipes" collapsible section. Delete the entire block.

- [ ] **Step 5: Remove unused hacks/premium state variables**

After removing the JSX blocks, TypeScript will warn about unused variables. Remove any `useState` hooks for `expandedHacks`, `expandedPremium`, `showHacks`, `showPremium` or similar that are now unused.

- [ ] **Step 6: Clean up unused props (if any)**

In `src/app/(app)/discover/page.tsx`, the `hacks` and `premiumRecipes` fetches and props may now be unused. If `DiscoverClient` no longer accepts `hacks` or `premiumRecipes` props after the removal, remove those props from both the server component and the client component interface.

- [ ] **Step 7: TypeScript check**

```bash
cd C:\Users\lasse\Desktop\whatscooking && npx tsc --noEmit 2>&1 | head -30
```
Expected: no errors in discover files.

- [ ] **Step 8: Commit**

```bash
git add src/app/(app)/discover/discover-client.tsx src/app/(app)/discover/page.tsx
git commit -m "fix: remove dark grey accordion sections from Discover page"
```
