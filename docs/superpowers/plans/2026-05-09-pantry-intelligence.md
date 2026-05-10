# Pantry Intelligence — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement five high-leverage mental-load reducers: expiry-aware pantry (persisted to DB), "Cook This → pantry gap → shopping list" one-tap flow, ingredient rescue mode, per-person dietary profiles in shared kitchens, and time-aware recipe filtering.

**Architecture:**
- Task 1 migrates expiry dates from localStorage to a new `pantry_items.expires_at` column (nullable `date`), keeping the existing client UI wired to DB instead.
- Tasks 2–3 are pure API routes + lightweight UI additions on the existing recipe detail and pantry pages.
- Task 4 extends `user_preferences` with a `household_dietary_tags` jsonb field and surfaces it in the pantry household view.
- Task 5 adds a `maxReadyMinutes` query param to `/api/recipes/search` (Spoonacular already supports it) and a time-picker to the Discover filter panel.

**Tech Stack:** Next.js App Router, Supabase (PostgreSQL), Tailwind CSS, Lucide icons, existing `addToShoppingList` helper in `src/lib/shopping-list.ts`, OpenAI gpt-4o-mini for rescue suggestions.

---

## File Map

| File | Action | Purpose |
|------|--------|---------|
| `supabase/migrations/20260509_pantry_expiry.sql` | Create | Add `expires_at date` to `pantry_items` |
| `src/app/api/pantry/items/route.ts` | Modify | Accept + persist `expires_at` on POST/PATCH |
| `src/app/api/pantry/items/[id]/route.ts` | Create | PATCH single item (for expiry updates) |
| `src/app/(app)/pantry/pantry-client.tsx` | Modify | Read/write expiry from DB instead of localStorage |
| `src/app/api/pantry/gap/route.ts` | Create | Compare recipe ingredients vs pantry, return missing |
| `src/app/(app)/recipes/[id]/recipe-columns-client.tsx` | Modify | Add "Cook This" button wiring gap → shopping list |
| `src/app/api/pantry/rescue/route.ts` | Create | AI-powered single-ingredient rescue suggestions |
| `src/app/(app)/pantry/pantry-client.tsx` | Modify | Ingredient rescue tap (same file, second pass) |
| `src/app/api/pantry/household-diets/route.ts` | Create | GET/POST household dietary profiles per user |
| `supabase/migrations/20260509_household_diets.sql` | Create | Add `household_dietary_tags` jsonb to `user_preferences` |
| `src/app/(app)/pantry/pantry-client.tsx` | Modify | Household dietary profiles UI (third pass) |
| `src/app/api/recipes/search/route.ts` | Modify | Add `maxReadyMinutes` param forwarding to Spoonacular |
| `src/app/(app)/discover/discover-client.tsx` | Modify | Add time-picker filter chip |

---

## Task 1: Persist expiry dates to DB

**Context:** Expiry dates are currently stored in `localStorage` under key `wc_pantry_expiry_v1`. This means they're invisible on other devices and break in shared-household scenarios. The `pantry_items` table needs a nullable `expires_at date` column. The client already has `setItemExpiry`, `clearItemExpiry`, `getExpiryStatus`, and `suggestExpiryDate` — they just need to write to the DB instead of localStorage.

**Files:**
- Create: `supabase/migrations/20260509_pantry_expiry.sql`
- Modify: `src/app/api/pantry/items/route.ts`
- Create: `src/app/api/pantry/items/[id]/route.ts`
- Modify: `src/app/(app)/pantry/pantry-client.tsx`
- Modify: `src/lib/types.ts`

---

- [ ] **Step 1.1: Write the migration**

Create `supabase/migrations/20260509_pantry_expiry.sql`:

```sql
alter table pantry_items
  add column if not exists expires_at date;

create index if not exists pantry_items_expires_at_idx
  on pantry_items (user_id, expires_at)
  where expires_at is not null;
```

- [ ] **Step 1.2: Apply the migration**

```bash
# Option A — Supabase CLI
npx supabase db push

# Option B — Supabase Dashboard > SQL Editor > paste file contents
```

Expected: column `expires_at` appears in `pantry_items` table. Confirm in Dashboard > Table Editor.

- [ ] **Step 1.3: Add `expires_at` to the `PantryItem` type**

In `src/lib/types.ts`, update `PantryItem`:

```typescript
export interface PantryItem {
  id: string;
  user_id: string;
  name: string;
  category_id?: string;
  category?: IngredientCategory;
  quantity?: string;
  expires_at?: string | null;   // ISO date string "YYYY-MM-DD"
  added_at: string;
}
```

- [ ] **Step 1.4: Update POST to accept `expires_at`**

In `src/app/api/pantry/items/route.ts`, update the POST handler:

```typescript
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { name, quantity, category_id, expires_at } = await req.json();
    if (!name?.trim()) return NextResponse.json({ error: "name required" }, { status: 400 });

    await supabase
      .from("profiles")
      .upsert({ id: user.id, full_name: user.user_metadata?.full_name ?? null }, { onConflict: "id" });

    const { data, error } = await supabase
      .from("pantry_items")
      .insert({
        user_id: user.id,
        name: name.trim(),
        quantity: quantity ?? null,
        category_id: category_id ?? null,
        expires_at: expires_at ?? null,
      })
      .select("*, category:ingredient_categories(id, name, emoji, color)")
      .single();

    if (error) {
      console.error("[pantry/items POST]", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ item: data });
  } catch (err) {
    console.error("[pantry/items POST]", err);
    return NextResponse.json({ error: "Failed to add item" }, { status: 500 });
  }
}
```

- [ ] **Step 1.5: Create PATCH route for updating a single pantry item**

Create `src/app/api/pantry/items/[id]/route.ts`:

```typescript
import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const allowed = ["expires_at", "quantity"] as const;
    const update: Record<string, unknown> = {};
    for (const key of allowed) {
      if (key in body) update[key] = body[key];
    }

    if (Object.keys(update).length === 0)
      return NextResponse.json({ error: "Nothing to update" }, { status: 400 });

    const { data, error } = await supabase
      .from("pantry_items")
      .update(update)
      .eq("id", id)
      .eq("user_id", user.id)
      .select("*, category:ingredient_categories(id, name, emoji, color)")
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ item: data });
  } catch (err) {
    console.error("[pantry/items PATCH]", err);
    return NextResponse.json({ error: "Failed to update item" }, { status: 500 });
  }
}
```

- [ ] **Step 1.6: Wire expiry to DB in pantry-client**

In `src/app/(app)/pantry/pantry-client.tsx`:

**a) Update the `setItemExpiry` function** (replace existing, around line 335):

```typescript
async function setItemExpiry(id: string, date: string) {
  // Optimistic update
  setItems((prev) =>
    prev.map((i) => (i.id === id ? { ...i, expires_at: date } : i))
  );
  setEditingExpiry(null);
  await fetch(`/api/pantry/items/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ expires_at: date }),
  });
}
```

**b) Update `clearItemExpiry`** (replace existing, around line 343):

```typescript
async function clearItemExpiry(id: string) {
  setItems((prev) =>
    prev.map((i) => (i.id === id ? { ...i, expires_at: null } : i))
  );
  await fetch(`/api/pantry/items/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ expires_at: null }),
  });
}
```

**c) Update `getExpiryStatus`** to read from `item.expires_at` instead of `expiryDates[id]`. Find this function (around line 349) and change:

```typescript
function getExpiryStatus(item: PantryItem): null | { label: string; color: string; bg: string; daysLeft: number } {
  const exp = item.expires_at;
  if (!exp) return null;
  const now = new Date();
  const expDate = new Date(exp);
  const daysLeft = Math.ceil((expDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  if (daysLeft < 0) return { label: "Expired", color: "#DC2626", bg: "#FEF2F2", daysLeft };
  if (daysLeft === 0) return { label: "Today!", color: "#EA580C", bg: "#FFF7ED", daysLeft };
  if (daysLeft <= 2) return { label: `${daysLeft}d left`, color: "#D97706", bg: "#FFFBEB", daysLeft };
  if (daysLeft <= 5) return { label: `${daysLeft}d left`, color: "#CA8A04", bg: "#FEFCE8", daysLeft };
  return { label: `${daysLeft}d`, color: "#16A34A", bg: "#F0FDF4", daysLeft };
}
```

**d) Update `handleAdd`** to pass `expires_at` in the POST body (after the categorize call, line ~232):

```typescript
const expiryDate = suggestExpiryDate(name);
const res = await fetch("/api/pantry/items", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ name, quantity: quantityStr, category_id: categoryId ?? null, expires_at: expiryDate }),
});
```

**e) Remove the localStorage-based `expiryDates` state** (the `useState` initialised from `localStorage.getItem("wc_pantry_expiry_v1")`), and remove all references to `expiryDates` map.

**f) Update all `getExpiryStatus(item.id)` call sites** to `getExpiryStatus(item)` (passing the full item object, not just the id).

**g) Update `expiringSoonCount`** to use the new signature:

```typescript
const expiringSoonCount = items.filter((i) => {
  const s = getExpiryStatus(i);
  return s && s.daysLeft <= 3;
}).length;
```

**h) Update the Waste Not `atRisk` filter**:

```typescript
const atRisk = items.filter(i => {
  const s = getExpiryStatus(i);
  return s && s.daysLeft >= 0 && s.daysLeft <= 5;
});
```

- [ ] **Step 1.7: Update pantry server page to fetch `expires_at`**

In `src/app/(app)/pantry/page.tsx`, the query already does `select("*, category:ingredient_categories(id, name, emoji, color)")` — `expires_at` is a direct column so it will be included. No change needed. Confirm by logging `items[0]` in the browser console.

- [ ] **Step 1.8: Commit**

```bash
git add supabase/migrations/20260509_pantry_expiry.sql \
        src/lib/types.ts \
        src/app/api/pantry/items/route.ts \
        src/app/api/pantry/items/[id]/route.ts \
        src/app/(app)/pantry/pantry-client.tsx \
        src/app/(app)/pantry/page.tsx
git commit -m "feat: persist pantry expiry dates to DB instead of localStorage"
```

---

## Task 2: "Cook This" → pantry gap → shopping list (one tap)

**Context:** The recipe detail page (`src/app/(app)/recipes/[id]/page.tsx`) already fetches `pantryData` and passes it as `pantryItems` to `RecipeColumnsClient`. The `IngredientsColumn` component (inside `recipe-columns-client.tsx`) already has "Add all to list" and "Add missing" buttons. The gap calculation needs to be consistent and reliable — do it server-side so it can also be used independently. The existing `addToShoppingList` helper in `src/lib/shopping-list.ts` handles the client-side list state.

**Files:**
- Create: `src/app/api/pantry/gap/route.ts`
- Modify: `src/app/(app)/recipes/[id]/recipe-columns-client.tsx`

---

- [ ] **Step 2.1: Check the existing IngredientsColumn to understand current "Add missing" behavior**

Read `src/app/(app)/recipes/[id]/ingredients-column.tsx` and locate where `pantryItems` is used. The goal is to understand what "missing" already means in the UI — we want to replace it with a cleaner one-tap CTA.

- [ ] **Step 2.2: Create the gap API route**

Create `src/app/api/pantry/gap/route.ts`:

```typescript
import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

// POST /api/pantry/gap
// Body: { ingredients: { name: string; amount?: number; unit?: string }[] }
// Returns: { missing: { name: string; amount?: number; unit?: string }[] }
// Matching: case-insensitive substring match — "chicken breast" matches pantry "chicken"
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { ingredients } = await req.json() as {
      ingredients: { name: string; amount?: number; unit?: string }[];
    };

    if (!Array.isArray(ingredients) || ingredients.length === 0)
      return NextResponse.json({ missing: [] });

    const { data: pantryItems } = await supabase
      .from("pantry_items")
      .select("name")
      .eq("user_id", user.id);

    const pantryNames = (pantryItems ?? []).map((p) => p.name.toLowerCase());

    const missing = ingredients.filter((ing) => {
      const ingLower = ing.name.toLowerCase();
      return !pantryNames.some(
        (p) => p.includes(ingLower) || ingLower.includes(p)
      );
    });

    return NextResponse.json({ missing });
  } catch (err) {
    console.error("[pantry/gap POST]", err);
    return NextResponse.json({ error: "Failed to compute gap" }, { status: 500 });
  }
}
```

- [ ] **Step 2.3: Add "Cook This" CTA to RecipeColumnsClient**

In `src/app/(app)/recipes/[id]/recipe-columns-client.tsx`, add a `CookThisButton` component near the top of the file (after imports):

```typescript
function CookThisButton({
  ingredients,
  pantryItems,
}: {
  ingredients: { name: string; amount?: number | null; unit?: string | null }[];
  pantryItems: { id: string; name: string; quantity?: string | null }[];
}) {
  const [state, setState] = useState<"idle" | "loading" | "done">("idle");
  const [addedCount, setAddedCount] = useState(0);

  async function handleCookThis() {
    setState("loading");
    try {
      const res = await fetch("/api/pantry/gap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ingredients }),
      });
      const json = await res.json() as {
        missing: { name: string; amount?: number; unit?: string }[];
      };
      if (json.missing.length === 0) {
        setState("done");
        setAddedCount(0);
        return;
      }
      addToShoppingList(
        json.missing.map((m) => ({
          name: m.name,
          amount: m.amount !== undefined ? String(m.amount) : undefined,
          unit: m.unit,
        }))
      );
      setAddedCount(json.missing.length);
      setState("done");
    } catch {
      setState("idle");
    }
  }

  if (state === "done") {
    return (
      <div
        className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold"
        style={{ background: "rgba(130,142,111,0.2)", color: "#828E6F", border: "1px solid rgba(130,142,111,0.3)" }}
      >
        <CheckCircle2 style={{ width: 16, height: 16 }} />
        {addedCount === 0
          ? "You have everything!"
          : `${addedCount} missing item${addedCount !== 1 ? "s" : ""} added to list`}
      </div>
    );
  }

  return (
    <button
      onClick={handleCookThis}
      disabled={state === "loading"}
      className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all disabled:opacity-50"
      style={{
        background: "rgba(176,125,86,0.18)",
        color: "#B07D56",
        border: "1px solid rgba(176,125,86,0.3)",
      }}
    >
      {state === "loading"
        ? <Loader2 style={{ width: 16, height: 16 }} className="animate-spin" />
        : <ShoppingCart style={{ width: 16, height: 16 }} />}
      {state === "loading" ? "Checking pantry…" : "Cook This — add missing to list"}
    </button>
  );
}
```

Then, inside the `RecipeColumnsClient` component's render, find the ingredients tab section and place `<CookThisButton>` above the ingredient list. Use `initialIngredients` (the prop) — gap analysis doesn't need scaling, we just need the ingredient names:

```tsx
<CookThisButton
  ingredients={initialIngredients}
  pantryItems={pantryItems}
/>
```

(Place it right above the `<IngredientsColumn>` render, inside the `"ingredients"` tab panel.)

- [ ] **Step 2.4: Verify in browser**

Open a recipe. The "Cook This — add missing to list" button should appear above the ingredient list. Click it. Open `/shopping-list` — missing ingredients should appear. If you already have every ingredient in your pantry, the button should show "You have everything!".

- [ ] **Step 2.5: Commit**

```bash
git add src/app/api/pantry/gap/route.ts \
        src/app/(app)/recipes/[id]/recipe-columns-client.tsx
git commit -m "feat: one-tap Cook This button computes pantry gap and adds missing to shopping list"
```

---

## Task 3: Ingredient rescue mode (single-ingredient → recipe suggestions)

**Context:** The pantry already has a "Waste Not" button that fires `/api/pantry/scramble` for expiring items. Rescue mode is different — it's triggered by tapping any single ingredient and asks "what can I make primarily with this?". The scramble endpoint takes a list; we'll reuse it but pass a single item as the primary, and surface results inline on the ingredient chip.

**Files:**
- Modify: `src/app/(app)/pantry/pantry-client.tsx`

No new API route needed — `/api/pantry/scramble` already accepts `{ ingredients: string[] }` and returns `{ recipes: { title: string; reason: string }[] }`.

---

- [ ] **Step 3.1: Add rescue state to pantry-client**

In `src/app/(app)/pantry/pantry-client.tsx`, add two state variables inside `PantryClient`:

```typescript
const [rescueItemId, setRescueItemId] = useState<string | null>(null);
const [rescueLoading, setRescueLoading] = useState(false);
const [rescueRecipes, setRescueRecipes] = useState<{ title: string; reason: string }[] | null>(null);
```

- [ ] **Step 3.2: Add rescue fetch function**

Inside `PantryClient`, add:

```typescript
async function handleRescue(item: PantryItem) {
  if (rescueItemId === item.id) {
    // Toggle off
    setRescueItemId(null);
    setRescueRecipes(null);
    return;
  }
  setRescueItemId(item.id);
  setRescueLoading(true);
  setRescueRecipes(null);
  try {
    const res = await fetch("/api/pantry/scramble", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ingredients: [item.name] }),
    });
    const json = await res.json();
    setRescueRecipes(json.recipes ?? []);
  } catch {
    setRescueRecipes([]);
  }
  setRescueLoading(false);
}
```

- [ ] **Step 3.3: Add rescue button to each ingredient chip**

In the ingredient chip render (around line 789 in the `catItems.map` block), add a "rescue" button after the expiry calendar button and before the delete button:

```tsx
<button
  type="button"
  onClick={() => handleRescue(item)}
  title="Find recipes using this"
  className="hover:opacity-70 transition-opacity"
  style={{ color: rescueItemId === item.id ? "#C85A2F" : "#A69180" }}
>
  <ChefHat className="w-3 h-3" />
</button>
```

Import `ChefHat` from lucide-react (it's already imported at the top of the file).

- [ ] **Step 3.4: Add the rescue results panel**

After the `grouped items` section (after the closing `</div>` of the flex-wrap chip list), add the rescue results panel. This should render below the category where the rescue button was tapped:

```tsx
{rescueItemId && (() => {
  const rescueItem = items.find(i => i.id === rescueItemId);
  if (!rescueItem) return null;
  return (
    <div className="mt-4 rounded-2xl border p-4" style={{ borderColor: "#E8D4C0", background: "rgba(255,255,255,0.75)" }}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <ChefHat className="w-4 h-4" style={{ color: "#C85A2F" }} />
          <p className="text-sm font-semibold" style={{ color: "#3D2817" }}>
            What to make with {rescueItem.name}
          </p>
        </div>
        <button
          onClick={() => { setRescueItemId(null); setRescueRecipes(null); }}
          className="text-xs" style={{ color: "#A69180" }}
        >
          <X className="w-4 h-4" />
        </button>
      </div>
      {rescueLoading && (
        <div className="flex items-center gap-2 py-4 justify-center">
          <Loader2 className="w-4 h-4 animate-spin" style={{ color: "#C85A2F" }} />
          <span className="text-sm" style={{ color: "#6B5B52" }}>Finding recipes…</span>
        </div>
      )}
      {rescueRecipes && rescueRecipes.length === 0 && (
        <p className="text-xs" style={{ color: "#A69180" }}>No recipes found — try adding more pantry items.</p>
      )}
      {rescueRecipes && rescueRecipes.length > 0 && (
        <div className="flex flex-col gap-2">
          {rescueRecipes.map((r, i) => (
            <div key={i} className="rounded-xl p-3 border" style={{ background: "#fff", borderColor: "#E8D4C0" }}>
              <p className="text-sm font-semibold" style={{ color: "#3D2817" }}>{r.title}</p>
              {r.reason && <p className="text-xs mt-0.5" style={{ color: "#6B5B52" }}>{r.reason}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
})()}
```

Place this block inside the `{pantryView === "mine" && ...}` section, right after the `{Object.entries(grouped).map(...)}` closing tag.

- [ ] **Step 3.5: Verify in browser**

Open the pantry. Click the chef hat icon on any ingredient chip. A panel should appear below with 3–5 recipe suggestions featuring that ingredient prominently. Clicking the icon again (or the X) should close it.

- [ ] **Step 3.6: Commit**

```bash
git add src/app/(app)/pantry/pantry-client.tsx
git commit -m "feat: ingredient rescue mode — tap any pantry item to get recipe suggestions"
```

---

## Task 4: Per-person dietary profiles in shared kitchens

**Context:** The pantry already has a "Household" tab toggle (UI stub only — `householdItems` is an empty array). The household dietary profiles feature adds a second widget on that tab: each household member sets their dietary constraints, and the shared view shows a compatibility legend ("works for everyone", "not for Alex — dairy"). For now, since household grouping (kitchen_groups) isn't live yet (pending manual steps in `manual_to_do.md`), we model this as: the current user can declare _their own_ dietary tags that are stored in `user_preferences.household_dietary_tags` and shown on the household panel as "Your dietary needs".

**Files:**
- Create: `supabase/migrations/20260509_household_diets.sql`
- Create: `src/app/api/pantry/household-diets/route.ts`
- Modify: `src/app/(app)/pantry/pantry-client.tsx`
- Modify: `src/app/(app)/pantry/page.tsx`

---

- [ ] **Step 4.1: Write the migration**

Create `supabase/migrations/20260509_household_diets.sql`:

```sql
alter table user_preferences
  add column if not exists household_dietary_tags text[] default '{}';
```

- [ ] **Step 4.2: Apply the migration**

```bash
npx supabase db push
# OR paste into Supabase Dashboard > SQL Editor
```

Expected: `household_dietary_tags` column appears on `user_preferences`.

- [ ] **Step 4.3: Create the household-diets API route**

Create `src/app/api/pantry/household-diets/route.ts`:

```typescript
import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

const VALID_TAGS = [
  "vegetarian", "vegan", "gluten-free", "dairy-free",
  "keto", "paleo", "low-carb", "high-protein", "halal", "kosher", "nut-free",
] as const;

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data } = await supabase
      .from("user_preferences")
      .select("household_dietary_tags")
      .eq("user_id", user.id)
      .maybeSingle();

    return NextResponse.json({ tags: data?.household_dietary_tags ?? [] });
  } catch (err) {
    console.error("[household-diets GET]", err);
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { tags } = await req.json() as { tags: string[] };
    const sanitised = (tags ?? []).filter((t): t is typeof VALID_TAGS[number] =>
      (VALID_TAGS as readonly string[]).includes(t)
    );

    const { error } = await supabase
      .from("user_preferences")
      .upsert(
        { user_id: user.id, household_dietary_tags: sanitised },
        { onConflict: "user_id" }
      );

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ tags: sanitised });
  } catch (err) {
    console.error("[household-diets POST]", err);
    return NextResponse.json({ error: "Failed to save" }, { status: 500 });
  }
}
```

- [ ] **Step 4.4: Load household dietary tags in the pantry server page**

In `src/app/(app)/pantry/page.tsx`, fetch the tags alongside existing data:

```typescript
import { createClient } from "@/lib/supabase/server";
import { PantryClient } from "./pantry-client";
import type { PantryItem, IngredientCategory } from "@/lib/types";

export default async function PantryPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const [{ data: items }, { data: categories }, { data: prefs }] = await Promise.all([
    supabase
      .from("pantry_items")
      .select("*, category:ingredient_categories(id, name, emoji, color)")
      .eq("user_id", user!.id)
      .order("added_at", { ascending: false }),
    supabase
      .from("ingredient_categories")
      .select("id, name, emoji, color")
      .order("name"),
    supabase
      .from("user_preferences")
      .select("household_dietary_tags")
      .eq("user_id", user!.id)
      .maybeSingle(),
  ]);

  return (
    <PantryClient
      initialItems={(items ?? []) as PantryItem[]}
      categories={(categories ?? []) as IngredientCategory[]}
      initialHouseholdTags={(prefs?.household_dietary_tags ?? []) as string[]}
    />
  );
}
```

- [ ] **Step 4.5: Add dietary profile UI to pantry-client**

In `src/app/(app)/pantry/pantry-client.tsx`:

**a) Update the `Props` interface:**

```typescript
interface Props {
  initialItems: PantryItem[];
  categories: IngredientCategory[];
  initialHouseholdTags: string[];
}
```

**b) Add state and the tag constant** inside `PantryClient`:

```typescript
const DIETARY_TAG_OPTIONS = [
  "vegetarian", "vegan", "gluten-free", "dairy-free",
  "keto", "paleo", "low-carb", "high-protein", "halal", "kosher", "nut-free",
] as const;

const [householdTags, setHouseholdTags] = useState<string[]>(initialHouseholdTags);
const [savingTags, setSavingTags] = useState(false);

async function handleToggleTag(tag: string) {
  const next = householdTags.includes(tag)
    ? householdTags.filter((t) => t !== tag)
    : [...householdTags, tag];
  setHouseholdTags(next);
  setSavingTags(true);
  await fetch("/api/pantry/household-diets", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ tags: next }),
  });
  setSavingTags(false);
}
```

**c) Add the dietary profile widget** inside the `{pantryView === "shared" && ...}` section, below the existing share panel:

```tsx
{/* Dietary profile */}
<div className="mb-5 rounded-2xl border p-4" style={{ borderColor: "#E8D4C0", background: "rgba(255,255,255,0.8)" }}>
  <div className="flex items-center gap-2 mb-3">
    <Leaf className="w-4 h-4" style={{ color: "#16A34A" }} />
    <p className="text-sm font-semibold" style={{ color: "#3D2817" }}>Your dietary needs</p>
    {savingTags && <Loader2 className="w-3 h-3 animate-spin ml-auto" style={{ color: "#A69180" }} />}
  </div>
  <p className="text-xs mb-3" style={{ color: "#6B5B52" }}>
    Tag your restrictions — the household view will flag recipes that don&apos;t work for you.
  </p>
  <div className="flex flex-wrap gap-1.5">
    {DIETARY_TAG_OPTIONS.map((tag) => {
      const active = householdTags.includes(tag);
      return (
        <button
          key={tag}
          type="button"
          onClick={() => handleToggleTag(tag)}
          className="px-3 py-1.5 rounded-full border text-xs font-medium transition-all"
          style={{
            borderColor: active ? "#C85A2F" : "#E8D4C0",
            background: active ? "#FFF0E6" : "#FAF7F2",
            color: active ? "#C85A2F" : "#6B5B52",
          }}
        >
          {tag}
        </button>
      );
    })}
  </div>
  {householdTags.length > 0 && (
    <p className="text-xs mt-3 font-medium" style={{ color: "#C85A2F" }}>
      Active: {householdTags.join(", ")}
    </p>
  )}
</div>
```

- [ ] **Step 4.6: Verify in browser**

Open Pantry → Household tab. A "Your dietary needs" section should appear with toggleable tag chips. Toggle a few on/off. Reload the page — selections should persist (fetched from DB via the page server component).

- [ ] **Step 4.7: Commit**

```bash
git add supabase/migrations/20260509_household_diets.sql \
        src/app/api/pantry/household-diets/route.ts \
        src/app/(app)/pantry/page.tsx \
        src/app/(app)/pantry/pantry-client.tsx
git commit -m "feat: per-person dietary profiles on household pantry tab"
```

---

## Task 5: Time-aware recipe filtering

**Context:** Spoonacular's `/complexSearch` already accepts `maxReadyTime` (total ready time in minutes). Our `/api/recipes/search` route doesn't forward it. The Discover page has a filter panel — we need to add a time picker chip there. The `prep_time_minutes` + `cook_time_minutes` columns exist on local `recipes` rows.

**Files:**
- Modify: `src/app/api/recipes/search/route.ts`
- Modify: `src/app/(app)/discover/discover-client.tsx`

---

- [ ] **Step 5.1: Add `maxReadyMinutes` to the search route**

In `src/app/api/recipes/search/route.ts`, add parsing and forwarding of the new param. Update the GET handler:

```typescript
const maxReadyMinutes = searchParams.get("maxReadyMinutes")
  ? parseInt(searchParams.get("maxReadyMinutes")!)
  : undefined;
```

Then include it in the `searchRecipes` call:

```typescript
const result = await searchRecipes({
  query,
  cuisine,
  diet,
  minCalories,
  maxCalories,
  minProtein,
  maxProtein,
  minCarbs,
  maxCarbs,
  minFat,
  maxFat,
  maxReadyTime: maxReadyMinutes,
  number,
  offset,
});
```

- [ ] **Step 5.2: Check if `searchRecipes` in `src/lib/spoonacular.ts` accepts `maxReadyTime`**

Read `src/lib/spoonacular.ts`. Look for the `searchRecipes` function signature. If `maxReadyTime` is not in the params type, add it:

```typescript
// In the params interface/type:
maxReadyTime?: number;

// In the URL params construction:
if (params.maxReadyTime) url.searchParams.set("maxReadyTime", String(params.maxReadyTime));
```

- [ ] **Step 5.3: Add time-picker chip to discover filter panel**

Read `src/app/(app)/discover/discover-client.tsx` to find where dietary/cuisine filter chips are rendered. Add time options alongside them.

Add a constant near the top of the file:

```typescript
const TIME_OPTIONS = [
  { label: "≤ 15 min", value: 15 },
  { label: "≤ 30 min", value: 30 },
  { label: "≤ 45 min", value: 45 },
  { label: "≤ 60 min", value: 60 },
];
```

Add state:

```typescript
const [maxReadyMinutes, setMaxReadyMinutes] = useState<number | null>(null);
```

Add the time picker chip row in the filter panel (below the diet chips, above the search button):

```tsx
<div>
  <p className="text-xs font-semibold mb-2" style={{ color: "#6B5B52" }}>Ready in</p>
  <div className="flex flex-wrap gap-2">
    {TIME_OPTIONS.map(({ label, value }) => (
      <button
        key={value}
        type="button"
        onClick={() => setMaxReadyMinutes(prev => prev === value ? null : value)}
        className="px-3 py-1.5 rounded-full border text-xs font-medium transition-all"
        style={{
          borderColor: maxReadyMinutes === value ? "#C85A2F" : "#E8D4C0",
          background: maxReadyMinutes === value ? "#FFF0E6" : "#FAF7F2",
          color: maxReadyMinutes === value ? "#C85A2F" : "#6B5B52",
        }}
      >
        {label}
      </button>
    ))}
  </div>
</div>
```

Include `maxReadyMinutes` in the search params when fetching:

```typescript
// In the fetch call that builds the /api/recipes/search URL:
if (maxReadyMinutes) params.set("maxReadyMinutes", String(maxReadyMinutes));
```

Also reset it when the "Clear filters" button is pressed.

- [ ] **Step 5.4: Verify in browser**

Open Discover. In the filter panel, "Ready in" chips should appear. Select "≤ 30 min". Trigger a search. Results should be filtered to recipes under 30 minutes. Confirm by checking a result's time metadata.

- [ ] **Step 5.5: Commit**

```bash
git add src/app/api/recipes/search/route.ts \
        src/lib/spoonacular.ts \
        src/app/(app)/discover/discover-client.tsx
git commit -m "feat: time-aware recipe filtering — Ready in chips in Discover filter panel"
```

---

## Verification Checklist

After all tasks are complete, run through these in the browser:

- [ ] Add a pantry item → confirm `expires_at` appears in Supabase `pantry_items` table
- [ ] Open a recipe → click "Cook This" → open Shopping List → missing items present
- [ ] Tap a chef hat on any pantry ingredient → rescue panel opens with recipes
- [ ] Pantry → Household tab → toggle dietary tags → reload → tags persist
- [ ] Discover → filter panel → select "≤ 30 min" → results are time-filtered
