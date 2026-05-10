# Shared Pantry Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a shared pantry feature: create/join a shared pantry via 6-char invite code, real-time sync via Supabase Realtime, both members see and edit items, PantryScramble works on shared items too. Also fix the pantry UI to use category-grouped card design.

**Architecture:** New Supabase tables `shared_pantries`, `shared_pantry_members`, `shared_pantry_items`. Pantry page gets a second "Shared" tab. Supabase Realtime channel subscribes to `shared_pantry_items` changes. New API routes handle create/join/add/remove.

**Tech Stack:** Supabase (PostgreSQL + Realtime), Next.js API Routes, React

---

### Task 1: Database schema migration

**Files:**
- Create: `supabase/migrations/YYYYMMDD_shared_pantry.sql`

- [ ] **Step 1: Create the migration file**

Create `supabase/migrations/20260505_shared_pantry.sql`:

```sql
-- Shared pantries
create table if not exists shared_pantries (
  id          uuid primary key default gen_random_uuid(),
  name        text not null default 'Shared Pantry',
  created_by  uuid not null references auth.users(id) on delete cascade,
  invite_code text not null unique,
  created_at  timestamptz not null default now()
);

-- Members of a shared pantry
create table if not exists shared_pantry_members (
  pantry_id  uuid not null references shared_pantries(id) on delete cascade,
  user_id    uuid not null references auth.users(id) on delete cascade,
  role       text not null default 'editor' check (role in ('owner','editor','viewer')),
  joined_at  timestamptz not null default now(),
  primary key (pantry_id, user_id)
);

-- Items in a shared pantry
create table if not exists shared_pantry_items (
  id          uuid primary key default gen_random_uuid(),
  pantry_id   uuid not null references shared_pantries(id) on delete cascade,
  name        text not null,
  quantity    text,
  unit        text,
  category_id uuid references ingredient_categories(id),
  added_by    uuid references auth.users(id),
  updated_at  timestamptz not null default now()
);

-- RLS policies
alter table shared_pantries        enable row level security;
alter table shared_pantry_members  enable row level security;
alter table shared_pantry_items    enable row level security;

-- shared_pantries: members can read; owner can update/delete
create policy "members can read pantry"
  on shared_pantries for select
  using (
    exists (
      select 1 from shared_pantry_members
      where pantry_id = shared_pantries.id and user_id = auth.uid()
    )
  );

create policy "anyone can create pantry"
  on shared_pantries for insert
  with check (created_by = auth.uid());

create policy "owner can update pantry"
  on shared_pantries for update
  using (created_by = auth.uid());

-- shared_pantry_members: members can read; owner can insert/delete
create policy "members can read membership"
  on shared_pantry_members for select
  using (
    user_id = auth.uid() or
    exists (
      select 1 from shared_pantry_members m2
      where m2.pantry_id = shared_pantry_members.pantry_id and m2.user_id = auth.uid()
    )
  );

create policy "anyone can join (insert own membership)"
  on shared_pantry_members for insert
  with check (user_id = auth.uid());

create policy "members can leave or owner can remove"
  on shared_pantry_members for delete
  using (
    user_id = auth.uid() or
    exists (
      select 1 from shared_pantries
      where id = shared_pantry_members.pantry_id and created_by = auth.uid()
    )
  );

-- shared_pantry_items: members can read; editors/owners can write
create policy "members can read items"
  on shared_pantry_items for select
  using (
    exists (
      select 1 from shared_pantry_members
      where pantry_id = shared_pantry_items.pantry_id and user_id = auth.uid()
    )
  );

create policy "editors can insert items"
  on shared_pantry_items for insert
  with check (
    exists (
      select 1 from shared_pantry_members
      where pantry_id = shared_pantry_items.pantry_id
        and user_id = auth.uid()
        and role in ('owner','editor')
    )
  );

create policy "editors can update items"
  on shared_pantry_items for update
  using (
    exists (
      select 1 from shared_pantry_members
      where pantry_id = shared_pantry_items.pantry_id
        and user_id = auth.uid()
        and role in ('owner','editor')
    )
  );

create policy "editors can delete items"
  on shared_pantry_items for delete
  using (
    exists (
      select 1 from shared_pantry_members
      where pantry_id = shared_pantry_items.pantry_id
        and user_id = auth.uid()
        and role in ('owner','editor')
    )
  );

-- Enable Realtime for shared_pantry_items
alter publication supabase_realtime add table shared_pantry_items;
```

- [ ] **Step 2: Run the migration**

```bash
cd C:\Users\lasse\Desktop\whatscooking
npx supabase db push
```

Or apply manually in the Supabase dashboard SQL editor if `supabase` CLI isn't configured.

Expected: tables `shared_pantries`, `shared_pantry_members`, `shared_pantry_items` created with RLS enabled.

---

### Task 2: Create API routes for shared pantry

**Files:**
- Create: `src/app/api/shared-pantry/route.ts` (create + join)
- Create: `src/app/api/shared-pantry/[id]/items/route.ts` (CRUD items)

- [ ] **Step 3: Create the shared-pantry route (create + join)**

Create `src/app/api/shared-pantry/route.ts`:

```ts
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

function generateCode(): string {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

// POST /api/shared-pantry  body: { action: "create", name? } | { action: "join", code }
export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();

  if (body.action === "create") {
    const code = generateCode();
    const { data: pantry, error } = await supabase
      .from("shared_pantries")
      .insert({ name: body.name ?? "Shared Pantry", created_by: user.id, invite_code: code })
      .select()
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // Add creator as owner member
    await supabase.from("shared_pantry_members").insert({
      pantry_id: pantry.id,
      user_id: user.id,
      role: "owner",
    });

    return NextResponse.json({ pantry, code });
  }

  if (body.action === "join") {
    const code = String(body.code ?? "").toUpperCase();
    if (!code || code.length !== 6) return NextResponse.json({ error: "Invalid code" }, { status: 400 });

    const { data: pantry } = await supabase
      .from("shared_pantries")
      .select("*")
      .eq("invite_code", code)
      .single();
    if (!pantry) return NextResponse.json({ error: "Pantry not found" }, { status: 404 });

    // Check if already a member
    const { data: existing } = await supabase
      .from("shared_pantry_members")
      .select("pantry_id")
      .eq("pantry_id", pantry.id)
      .eq("user_id", user.id)
      .maybeSingle();

    if (!existing) {
      await supabase.from("shared_pantry_members").insert({
        pantry_id: pantry.id,
        user_id: user.id,
        role: "editor",
      });
    }

    return NextResponse.json({ pantry });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}

// GET /api/shared-pantry — list user's shared pantries
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: memberships } = await supabase
    .from("shared_pantry_members")
    .select("role, shared_pantries(id, name, invite_code, created_by, created_at)")
    .eq("user_id", user.id);

  const pantries = (memberships ?? []).map((m) => ({
    ...(m.shared_pantries as Record<string, unknown>),
    role: m.role,
  }));

  return NextResponse.json(pantries);
}
```

- [ ] **Step 4: Create items CRUD route**

Create `src/app/api/shared-pantry/[id]/items/route.ts`:

```ts
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

type Params = { params: Promise<{ id: string }> };

// GET — list items for a shared pantry
export async function GET(_req: Request, { params }: Params) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: items, error } = await supabase
    .from("shared_pantry_items")
    .select("*, ingredient_categories(id, name, emoji, color)")
    .eq("pantry_id", id)
    .order("updated_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(items ?? []);
}

// POST — add item
export async function POST(req: Request, { params }: Params) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { data, error } = await supabase
    .from("shared_pantry_items")
    .insert({
      pantry_id: id,
      name: body.name,
      quantity: body.quantity ?? null,
      unit: body.unit ?? null,
      category_id: body.category_id ?? null,
      added_by: user.id,
    })
    .select("*, ingredient_categories(id, name, emoji, color)")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// DELETE — remove item
export async function DELETE(req: Request, { params }: Params) {
  const { id: pantryId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const itemId = searchParams.get("itemId");
  if (!itemId) return NextResponse.json({ error: "itemId required" }, { status: 400 });

  const { error } = await supabase
    .from("shared_pantry_items")
    .delete()
    .eq("id", itemId)
    .eq("pantry_id", pantryId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
```

---

### Task 3: Create SharedPantryTab component

**Files:**
- Create: `src/app/(app)/pantry/shared-pantry-tab.tsx`

- [ ] **Step 5: Create shared-pantry-tab.tsx**

Create `src/app/(app)/pantry/shared-pantry-tab.tsx`:

```tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, X, Users, Copy, Check, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface SharedPantryItem {
  id: string;
  name: string;
  quantity?: string | null;
  unit?: string | null;
  added_by?: string | null;
  updated_at: string;
  ingredient_categories?: { id: string; name: string; emoji: string; color: string } | null;
}

interface SharedPantry {
  id: string;
  name: string;
  invite_code: string;
  created_by: string;
  role: string;
}

export function SharedPantryTab({ userId }: { userId: string }) {
  const [pantries, setPantries] = useState<SharedPantry[]>([]);
  const [activePantryId, setActivePantryId] = useState<string | null>(null);
  const [items, setItems] = useState<SharedPantryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [showJoin, setShowJoin] = useState(false);
  const [codeCopied, setCodeCopied] = useState(false);
  const [adding, setAdding] = useState(false);
  const [addName, setAddName] = useState("");

  const activePantry = pantries.find((p) => p.id === activePantryId);

  // Load pantries
  useEffect(() => {
    fetch("/api/shared-pantry")
      .then((r) => r.json())
      .then((data: SharedPantry[]) => {
        setPantries(data ?? []);
        if (data?.length > 0) setActivePantryId(data[0].id);
      })
      .finally(() => setLoading(false));
  }, []);

  // Load items when active pantry changes
  const loadItems = useCallback(async () => {
    if (!activePantryId) return;
    const res = await fetch(`/api/shared-pantry/${activePantryId}/items`);
    if (res.ok) setItems(await res.json());
  }, [activePantryId]);

  useEffect(() => { loadItems(); }, [loadItems]);

  // Realtime subscription
  useEffect(() => {
    if (!activePantryId) return;
    const supabase = createClient();
    const channel = supabase
      .channel(`shared-pantry-${activePantryId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "shared_pantry_items", filter: `pantry_id=eq.${activePantryId}` },
        () => { loadItems(); }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [activePantryId, loadItems]);

  async function createPantry() {
    if (!newName.trim()) return;
    const res = await fetch("/api/shared-pantry", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "create", name: newName }),
    });
    if (res.ok) {
      const { pantry } = await res.json();
      setPantries((prev) => [...prev, { ...pantry, role: "owner" }]);
      setActivePantryId(pantry.id);
      setShowCreate(false);
      setNewName("");
    }
  }

  async function joinPantry() {
    if (!joinCode.trim()) return;
    const res = await fetch("/api/shared-pantry", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "join", code: joinCode }),
    });
    if (res.ok) {
      const { pantry } = await res.json();
      setPantries((prev) => [...prev, { ...pantry, role: "editor" }]);
      setActivePantryId(pantry.id);
      setShowJoin(false);
      setJoinCode("");
    }
  }

  async function addItem() {
    if (!addName.trim() || !activePantryId) return;
    setAdding(true);
    const res = await fetch(`/api/shared-pantry/${activePantryId}/items`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: addName }),
    });
    if (res.ok) {
      const item = await res.json();
      setItems((prev) => [item, ...prev]);
      setAddName("");
    }
    setAdding(false);
  }

  async function removeItem(itemId: string) {
    if (!activePantryId) return;
    await fetch(`/api/shared-pantry/${activePantryId}/items?itemId=${itemId}`, { method: "DELETE" });
    setItems((prev) => prev.filter((i) => i.id !== itemId));
  }

  async function copyCode() {
    if (!activePantry) return;
    await navigator.clipboard.writeText(activePantry.invite_code);
    setCodeCopied(true);
    setTimeout(() => setCodeCopied(false), 2000);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin" style={{ color: "#8A6A4A" }} />
      </div>
    );
  }

  if (pantries.length === 0 && !showCreate && !showJoin) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
        <Users style={{ width: 40, height: 40, color: "#3A2416", opacity: 0.4 }} />
        <p className="text-base font-bold" style={{ color: "#EFE3CE", fontFamily: "'Libre Baskerville', Georgia, serif" }}>
          Shared Pantry
        </p>
        <p className="text-sm max-w-xs" style={{ color: "#7A5A40" }}>
          Share your pantry with a partner or housemate. See each other&apos;s ingredients in real time.
        </p>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowCreate(true)}
            className="px-4 py-2 rounded-xl text-sm font-semibold"
            style={{ background: "#C85A2F", color: "#fff" }}
          >
            Create pantry
          </button>
          <button
            onClick={() => setShowJoin(true)}
            className="px-4 py-2 rounded-xl text-sm font-semibold border"
            style={{ borderColor: "rgba(90,50,20,0.4)", color: "#C8A882", background: "transparent" }}
          >
            Join with code
          </button>
        </div>
      </div>
    );
  }

  if (showCreate) {
    return (
      <div className="flex flex-col gap-4 py-8 max-w-sm mx-auto">
        <h3 className="text-base font-bold" style={{ color: "#EFE3CE" }}>Create shared pantry</h3>
        <input
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && createPantry()}
          placeholder="e.g. Our Kitchen"
          className="px-4 py-2.5 rounded-xl border text-sm focus:outline-none"
          style={{ borderColor: "rgba(90,50,20,0.4)", background: "rgba(42,24,8,0.4)", color: "#EFE3CE" }}
          autoFocus
        />
        <div className="flex items-center gap-2">
          <button onClick={createPantry} className="px-4 py-2 rounded-xl text-sm font-semibold" style={{ background: "#C85A2F", color: "#fff" }}>
            Create
          </button>
          <button onClick={() => setShowCreate(false)} className="text-sm" style={{ color: "#6B5040" }}>Cancel</button>
        </div>
      </div>
    );
  }

  if (showJoin) {
    return (
      <div className="flex flex-col gap-4 py-8 max-w-sm mx-auto">
        <h3 className="text-base font-bold" style={{ color: "#EFE3CE" }}>Join with invite code</h3>
        <input
          type="text"
          value={joinCode}
          onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
          onKeyDown={(e) => e.key === "Enter" && joinPantry()}
          placeholder="ABC123"
          maxLength={6}
          className="px-4 py-2.5 rounded-xl border text-sm focus:outline-none font-mono tracking-widest"
          style={{ borderColor: "rgba(90,50,20,0.4)", background: "rgba(42,24,8,0.4)", color: "#EFE3CE" }}
          autoFocus
        />
        <div className="flex items-center gap-2">
          <button onClick={joinPantry} className="px-4 py-2 rounded-xl text-sm font-semibold" style={{ background: "#C85A2F", color: "#fff" }}>
            Join
          </button>
          <button onClick={() => setShowJoin(false)} className="text-sm" style={{ color: "#6B5040" }}>Cancel</button>
        </div>
      </div>
    );
  }

  // Active pantry view
  return (
    <div className="flex flex-col gap-4">
      {/* Pantry header + invite code */}
      {activePantry && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl" style={{ background: "rgba(42,24,8,0.5)", border: "1px solid rgba(90,50,20,0.3)" }}>
          <Users style={{ width: 16, height: 16, color: "#8A6A4A", flexShrink: 0 }} />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold" style={{ color: "#EFE3CE" }}>{activePantry.name}</p>
            <p className="text-xs" style={{ color: "#6B5040" }}>
              Invite code: <span className="font-mono font-bold tracking-widest" style={{ color: "#C8A882" }}>{activePantry.invite_code}</span>
            </p>
          </div>
          <button onClick={copyCode} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium"
            style={{ background: codeCopied ? "rgba(130,142,111,0.2)" : "rgba(90,50,20,0.3)", color: codeCopied ? "#828E6F" : "#C8A882" }}>
            {codeCopied ? <><Check style={{ width: 12, height: 12 }} /> Copied</> : <><Copy style={{ width: 12, height: 12 }} /> Copy code</>}
          </button>
        </div>
      )}

      {/* Add item */}
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={addName}
          onChange={(e) => setAddName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addItem()}
          placeholder="Add ingredient…"
          className="flex-1 px-4 py-2.5 rounded-xl border text-sm focus:outline-none"
          style={{ borderColor: "rgba(90,50,20,0.4)", background: "rgba(42,24,8,0.4)", color: "#EFE3CE" }}
        />
        <button onClick={addItem} disabled={adding || !addName.trim()}
          className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-50"
          style={{ background: "#C85A2F", color: "#fff" }}>
          {adding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus style={{ width: 16, height: 16 }} />}
        </button>
      </div>

      {/* Items list */}
      {items.length === 0 ? (
        <div className="py-12 text-center">
          <p className="text-sm" style={{ color: "#6B5040" }}>No items yet — add something above</p>
        </div>
      ) : (
        <div className="flex flex-col gap-1.5">
          {items.map((item) => (
            <div key={item.id}
              className="flex items-center gap-3 px-4 py-3 rounded-xl group"
              style={{ background: "rgba(42,24,8,0.4)", border: "1px solid rgba(90,50,20,0.2)" }}>
              <span className="text-lg w-7 text-center shrink-0">
                {item.ingredient_categories?.emoji ?? "🍽️"}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold" style={{ color: "#EFE3CE" }}>{item.name}</p>
                {(item.quantity || item.unit) && (
                  <p className="text-xs" style={{ color: "#6B5040" }}>{item.quantity} {item.unit}</p>
                )}
              </div>
              <button
                onClick={() => removeItem(item.id)}
                className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-lg"
                style={{ color: "#A69180" }}
                aria-label="Remove"
              >
                <X style={{ width: 14, height: 14 }} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Footer actions */}
      <div className="flex items-center gap-3 pt-2">
        <button onClick={() => setShowCreate(true)} className="text-xs" style={{ color: "#6B5040" }}>
          + Create another
        </button>
        <button onClick={() => setShowJoin(true)} className="text-xs" style={{ color: "#6B5040" }}>
          + Join another
        </button>
      </div>
    </div>
  );
}
```

---

### Task 4: Add Shared tab to pantry page

**Files:**
- Modify: `src/app/(app)/pantry/page.tsx`
- Modify: `src/app/(app)/pantry/pantry-client.tsx`

- [ ] **Step 6: Read pantry/page.tsx to understand current structure**

```bash
head -30 src/app/(app)/pantry/page.tsx
```

- [ ] **Step 7: Add tab navigation to pantry page**

The pantry page server component passes data to `PantryClient`. We need a tabs wrapper. The simplest approach is to make `PantryClient` accept a `userId` prop and render tabs internally.

In `src/app/(app)/pantry/pantry-client.tsx`, at the top of the component, add tab state:

```tsx
const [tab, setTab] = useState<"mine" | "shared">("mine");
```

At the top of the rendered JSX, add tab buttons before the existing content:
```tsx
<div className="flex items-center gap-1 mb-6">
  {([
    { key: "mine",   label: "My Pantry" },
    { key: "shared", label: "Shared Pantry" },
  ] as const).map(({ key, label }) => (
    <button
      key={key}
      onClick={() => setTab(key)}
      className="px-4 py-2 rounded-xl text-sm font-semibold transition-colors"
      style={{
        background: tab === key ? "rgba(200,90,47,0.2)" : "transparent",
        color: tab === key ? "#C85A2F" : "#8A6A4A",
      }}
    >
      {label}
    </button>
  ))}
</div>
```

Wrap the existing pantry content in `{tab === "mine" && (...)}` and add:
```tsx
{tab === "shared" && <SharedPantryTab userId={userId} />}
```

Add `userId: string` to the `PantryClient` props interface and pass it from the server component.

- [ ] **Step 8: Pass userId from page.tsx to PantryClient**

In `src/app/(app)/pantry/page.tsx`, find where `PantryClient` is rendered and add `userId={user.id}`.

- [ ] **Step 9: TypeScript check**

```bash
cd C:\Users\lasse\Desktop\whatscooking && npx tsc --noEmit 2>&1 | grep -E "pantry|shared" | head -20
```
Expected: no errors.

- [ ] **Step 10: Commit**

```bash
git add supabase/migrations/20260505_shared_pantry.sql src/app/api/shared-pantry/ src/app/(app)/pantry/shared-pantry-tab.tsx src/app/(app)/pantry/pantry-client.tsx src/app/(app)/pantry/page.tsx
git commit -m "feat: shared pantry — create/join via invite code, realtime sync, Supabase RLS"
```
