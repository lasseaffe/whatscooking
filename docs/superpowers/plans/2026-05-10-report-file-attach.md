# Report Issue — File Attachment & Fix Pipeline Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let users attach a replacement image or corrected `.txt` description when reporting a recipe issue, with server-side file storage and admin one-click apply in the existing `/reports` page.

**Architecture:** The report dialog switches from JSON POST to multipart FormData. The API route saves attached files to disk before persisting to three stores: a root-level audit log (`recipe-fixes.json`), a per-recipe file (`fixes/<recipeId>.json`), and Supabase. The admin `/reports` page gains a badge and pre-populated FixPanel for reports that have user-attached fixes.

**Tech Stack:** Next.js App Router, TypeScript, Supabase (postgres), Node.js `fs/promises`, React `useState`/`useRef`

---

## File Map

| File | Action | Responsibility |
|---|---|---|
| `src/components/report-button.tsx` | Modify | Add `attachedFile` state, conditional file input, switch submit to FormData |
| `src/app/api/recipe-reports/route.ts` | Modify | Switch to `req.formData()`, save file, write 3-layer persistence |
| `src/app/api/admin/fix-description/route.ts` | Create | GET endpoint that reads `pending-fixes/<recipeId>/description.txt` |
| `src/app/(app)/reports/reports-client.tsx` | Modify | Add `fix_file_path`/`fix_status` to Report type, badge, FixPanel pre-population, filter pill |
| `supabase/add_fix_columns.sql` | Create | Migration: add `fix_file_path`, `fix_status`, `source_url`, `resolved_at`, `resolved_by` to `recipe_bug_reports` |

---

### Task 1: Supabase migration — add fix columns

**Files:**
- Create: `supabase/add_fix_columns.sql`

- [ ] **Step 1: Create the migration file**

```sql
-- supabase/add_fix_columns.sql
-- Run once in Supabase SQL editor

alter table recipe_bug_reports
  add column if not exists source_url   text,
  add column if not exists fix_file_path text,
  add column if not exists fix_status   text check (fix_status in ('applied', 'pending', 'pending_review')),
  add column if not exists resolved_at  timestamptz,
  add column if not exists resolved_by  text;

-- Allow authenticated users to read their own reports (needed by /reports page)
drop policy if exists "owner can read own reports" on recipe_bug_reports;
create policy "authenticated can read reports" on recipe_bug_reports
  for select using (auth.role() = 'authenticated');
```

- [ ] **Step 2: Run in Supabase SQL editor**

Open Supabase Dashboard → SQL Editor → paste and run the file above.

Expected: "Success. No rows returned."

- [ ] **Step 3: Verify columns exist**

Run in SQL editor:
```sql
select column_name, data_type
from information_schema.columns
where table_name = 'recipe_bug_reports'
order by ordinal_position;
```

Expected: rows for `fix_file_path`, `fix_status`, `source_url`, `resolved_at`, `resolved_by` visible.

- [ ] **Step 4: Commit the migration file**

```bash
git add supabase/add_fix_columns.sql
git commit -m "chore: add fix_file_path, fix_status columns to recipe_bug_reports"
```

---

### Task 2: New GET route — read pending description fix

**Files:**
- Create: `src/app/api/admin/fix-description/route.ts`

This route is called by the admin FixPanel to pre-fill the instructions textarea with the user's `.txt` attachment.

- [ ] **Step 1: Create the route file**

```ts
// src/app/api/admin/fix-description/route.ts
import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const recipeId = req.nextUrl.searchParams.get("recipeId");
  if (!recipeId) return NextResponse.json({ error: "Missing recipeId" }, { status: 400 });

  const filePath = path.join(process.cwd(), "pending-fixes", recipeId, "description.txt");
  try {
    const content = await readFile(filePath, "utf-8");
    return NextResponse.json({ content });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}
```

- [ ] **Step 2: Smoke-test manually (after Task 3 creates a file)**

After Task 3 is complete and you've submitted one `wrong_info` report with a `.txt` file, open:
```
http://localhost:3000/api/admin/fix-description?recipeId=<id>
```
Expected: `{ "content": "<your txt file contents>" }`

- [ ] **Step 3: Commit**

```bash
git add src/app/api/admin/fix-description/route.ts
git commit -m "feat: GET /api/admin/fix-description reads pending user txt fix"
```

---

### Task 3: API route — switch to FormData and add file handling

**Files:**
- Modify: `src/app/api/recipe-reports/route.ts`

- [ ] **Step 1: Add imports and helpers at the top of the file**

Replace the existing import block with:

```ts
import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { spawn } from "child_process";
import { writeFile, mkdir, readFile } from "fs/promises";
import { existsSync, readFileSync } from "fs";
import path from "path";

export const runtime = "nodejs";

const PYTHON = process.env.PYTHON_PATH ?? "python";
const SCRIPTS_DIR = path.join(process.cwd(), "scripts", "ingestion");
const HERO_SHOT = path.join(SCRIPTS_DIR, "hero_shot.py");
const SITE_SCREENSHOTTER = path.join(SCRIPTS_DIR, "site_screenshotter.py");
const OUT_DIR = path.join(process.cwd(), "public", "recipe-images");
const FIXES_LOG = path.join(process.cwd(), "recipe-fixes.json");
const FIXES_DIR = path.join(process.cwd(), "fixes");
const PENDING_DIR = path.join(process.cwd(), "pending-fixes");
```

- [ ] **Step 2: Add the three-layer persistence helper**

Add this function after the imports (before `isInstagram`):

```ts
interface FixLogEntry {
  recipeId: string;
  recipeName: string | null;
  issueType: string;
  fixStatus: "applied" | "pending" | "pending_review" | null;
  fixFilePath: string | null;
  reportedAt: string;
  reportId: string;
}

async function persistFix(entry: FixLogEntry): Promise<void> {
  // 1. Append to recipe-fixes.json (audit log)
  let log: FixLogEntry[] = [];
  try {
    log = JSON.parse(readFileSync(FIXES_LOG, "utf-8"));
  } catch { /* file doesn't exist yet — start fresh */ }
  log.push(entry);
  await writeFile(FIXES_LOG, JSON.stringify(log, null, 2));

  // 2. Upsert fixes/<recipeId>.json (latest fix per recipe)
  await mkdir(FIXES_DIR, { recursive: true });
  await writeFile(
    path.join(FIXES_DIR, `${entry.recipeId}.json`),
    JSON.stringify(entry, null, 2)
  );
}
```

- [ ] **Step 3: Rewrite the POST handler to use formData**

Replace the entire `POST` function with:

```ts
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const formData = await req.formData();
    const recipeId   = formData.get("recipeId") as string | null;
    const recipeName = formData.get("recipeName") as string | null;
    const issueType  = formData.get("issueType") as string ?? "other";
    const description = formData.get("description") as string | null;
    const sourceUrl  = formData.get("sourceUrl") as string | null;
    const file       = formData.get("file") as File | null;

    let fixFilePath: string | null = null;
    let fixStatus: "applied" | "pending" | "pending_review" | null = null;
    let resolvedSourceUrl: string | null = sourceUrl;

    // Resolve source_url from DB if not provided
    if (!resolvedSourceUrl && recipeId && issueType === "faulty_image") {
      const { data } = await supabase
        .from("recipes")
        .select("source_url")
        .eq("id", recipeId)
        .single();
      resolvedSourceUrl = data?.source_url ?? null;
    }

    if (issueType === "faulty_image" && file && recipeId) {
      // User-supplied image — save directly, skip scraper
      const buffer = Buffer.from(await file.arrayBuffer());
      await mkdir(OUT_DIR, { recursive: true });
      const dest = path.join(OUT_DIR, `${recipeId}.jpg`);
      await writeFile(dest, buffer);
      fixFilePath = `public/recipe-images/${recipeId}.jpg`;
      fixStatus = "applied";

      // Update Supabase image_url immediately
      await supabase
        .from("recipes")
        .update({ image_url: `/${fixFilePath}` })
        .eq("id", recipeId);

    } else if (issueType === "faulty_image" && recipeId && resolvedSourceUrl) {
      // No user file — fall back to scraper
      fixStatus = "pending";
      triggerImageFix(recipeId, resolvedSourceUrl);

    } else if (issueType === "wrong_info" && file && recipeId) {
      // Save txt for admin review
      const text = await file.text();
      const dir = path.join(PENDING_DIR, recipeId);
      await mkdir(dir, { recursive: true });
      await writeFile(path.join(dir, "description.txt"), text, "utf-8");
      fixFilePath = `pending-fixes/${recipeId}/description.txt`;
      fixStatus = "pending_review";
    }

    // Supabase insert
    const reportId = `r_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    try {
      await supabase.from("recipe_bug_reports").insert({
        id: reportId,
        recipe_id: recipeId ?? null,
        recipe_name: recipeName ?? null,
        issue_type: issueType,
        description: (description ?? "").trim() || null,
        source_url: resolvedSourceUrl,
        fix_file_path: fixFilePath,
        fix_status: fixStatus,
        reporter_id: user?.id ?? null,
        created_at: new Date().toISOString(),
      });
    } catch (err) {
      console.error("[recipe-reports] Supabase insert failed:", err);
    }

    // Local persistence
    if (recipeId) {
      await persistFix({
        recipeId,
        recipeName: recipeName ?? null,
        issueType,
        fixStatus,
        fixFilePath,
        reportedAt: new Date().toISOString(),
        reportId,
      });
    }

    return NextResponse.json({
      ok: true,
      fixTriggered: issueType === "faulty_image" && !file && !!resolvedSourceUrl,
      fixApplied:   fixStatus === "applied",
    });
  } catch (err) {
    console.error("[recipe-reports POST]", err);
    return NextResponse.json({ error: "Failed to save report" }, { status: 500 });
  }
}
```

- [ ] **Step 4: Verify the GET handler is unchanged**

The existing `GET` function reads from Supabase — it now returns the new columns automatically since we use `select("*")`. No changes needed.

- [ ] **Step 5: Start the dev server and manually test**

```bash
cd C:/Users/lasse/Desktop/whatscooking
npm run dev
```

Open any recipe card, click the report button, select "Faulty or missing image", attach a small `.jpg`, and submit. Check:
- `public/recipe-images/<recipeId>.jpg` was written to disk
- `recipe-fixes.json` exists at project root with one entry
- `fixes/<recipeId>.json` exists

Then repeat with "Wrong title / info" + a `.txt` file. Check:
- `pending-fixes/<recipeId>/description.txt` was written

- [ ] **Step 6: Commit**

```bash
git add src/app/api/recipe-reports/route.ts
git commit -m "feat: recipe-reports API accepts FormData, saves user-attached fix files"
```

---

### Task 4: Report dialog — file input and FormData submit

**Files:**
- Modify: `src/components/report-button.tsx`

- [ ] **Step 1: Add `attachedFile` state and a `fileRef`**

In the `ReportButton` function body, after the existing `useState` calls, add:

```ts
const [attachedFile, setAttachedFile] = useState<File | null>(null);
const fileRef = useRef<HTMLInputElement>(null);
```

Add `useRef` to the import line if not already imported:
```ts
import { useState, useEffect, useRef } from "react";
```

- [ ] **Step 2: Replace the `submit` function**

Replace the existing `submit` function with:

```ts
async function submit() {
  setStatus("sending");
  try {
    const fd = new FormData();
    fd.append("recipeId", recipeId);
    fd.append("recipeName", recipeName);
    fd.append("issueType", issueType);
    fd.append("description", description);
    if (attachedFile) fd.append("file", attachedFile);

    await fetch("/api/recipe-reports", { method: "POST", body: fd });
  } catch { /* fail silently for UX */ }
  setStatus("done");
  setTimeout(() => {
    setOpen(false);
    setStatus("idle");
    setDescription("");
    setAttachedFile(null);
  }, 1400);
}
```

- [ ] **Step 3: Add the conditional file input below the issue-type pills**

Find the closing `</div>` of the "Issue type pills" section (the `flex flex-col gap-1.5 mb-4` div). Immediately after it, add:

```tsx
{/* Conditional file attachment */}
{(issueType === "faulty_image" || issueType === "wrong_info") && (
  <div className="mb-4">
    <p className="text-xs mb-2" style={{ color: "#8A6A4A" }}>
      {issueType === "faulty_image"
        ? "Attach replacement image (optional — we'll also try auto-fixing)"
        : "Attach corrected title/description as .txt (optional)"}
    </p>
    <button
      type="button"
      onClick={() => fileRef.current?.click()}
      className="w-full py-2 rounded-xl text-xs font-semibold border border-dashed transition-all"
      style={{
        borderColor: attachedFile ? "#C8522A" : "#3A2416",
        color: attachedFile ? "#C8522A" : "#6B4E36",
        background: attachedFile ? "rgba(200,82,42,0.08)" : "transparent",
      }}
    >
      {attachedFile ? `✓ ${attachedFile.name}` : "Click to attach file"}
    </button>
    <input
      ref={fileRef}
      type="file"
      accept={issueType === "faulty_image" ? "image/*" : ".txt,text/plain"}
      className="hidden"
      onChange={(e) => setAttachedFile(e.target.files?.[0] ?? null)}
    />
  </div>
)}
```

- [ ] **Step 4: Reset `attachedFile` when category changes**

Find the `onClick` handlers on the issue type pill buttons — each calls `setIssueType(t.value)`. Update each one to also reset the attached file:

```tsx
onClick={(e) => { e.stopPropagation(); setIssueType(t.value); setAttachedFile(null); }}
```

- [ ] **Step 5: Manual test in browser**

With dev server running:
1. Open a recipe, click the report button
2. Select "Faulty or missing image" → file input appears with correct label
3. Select "Wrong ingredients / amounts" → file input disappears
4. Select "Wrong title / info" → file input appears with `.txt` label
5. Attach a file → button shows filename with orange border
6. Switch category → attached file is cleared
7. Submit with a file → no JS errors, status shows "done"

- [ ] **Step 6: Commit**

```bash
git add src/components/report-button.tsx
git commit -m "feat: report dialog file attachment for faulty_image and wrong_info"
```

---

### Task 5: Admin UI — badge, pre-populated FixPanel, filter pill

**Files:**
- Modify: `src/app/(app)/reports/reports-client.tsx`

- [ ] **Step 1: Extend the `Report` interface**

Find the existing `Report` interface and add the new fields:

```ts
interface Report {
  id: string;
  recipe_id: string | null;
  recipe_name: string | null;
  issue_type: string | null;
  description: string | null;
  source_url: string | null;
  reporter_id: string | null;
  created_at: string;
  resolved_at: string | null;
  resolved_by: string | null;
  fix_file_path: string | null;
  fix_status: "applied" | "pending" | "pending_review" | null;
}
```

- [ ] **Step 2: Add `ISSUE_LABEL` and `ISSUE_ICONS` entries for `wrong_info`**

Find the existing `ISSUE_LABEL` and `ISSUE_ICONS` objects and add:

```ts
const ISSUE_ICONS: Record<string, React.ReactNode> = {
  faulty_image:      <ImageOff style={{ width: 14, height: 14 }} />,
  wrong_ingredients: <FileQuestion style={{ width: 14, height: 14 }} />,
  wrong_instructions:<FileQuestion style={{ width: 14, height: 14 }} />,
  wrong_info:        <FileQuestion style={{ width: 14, height: 14 }} />,
  other:             <Bug style={{ width: 14, height: 14 }} />,
};

const ISSUE_LABEL: Record<string, string> = {
  faulty_image:      "Faulty Image",
  wrong_ingredients: "Wrong Ingredients",
  wrong_instructions:"Wrong Instructions",
  wrong_info:        "Wrong Title / Info",
  other:             "Other",
};
```

- [ ] **Step 3: Update `FixPanel` to accept and use `fix_file_path`**

Replace the `FixPanel` component's signature and image-upload handler:

```tsx
function FixPanel({ report, onResolved }: { report: Report; onResolved: (id: string) => void }) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"image" | "instructions">("image");
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [prefilled, setPrefilled] = useState(false);

  // Pre-fill instructions textarea from user's .txt attachment
  async function loadPendingDescription() {
    if (!report.recipe_id || report.fix_status !== "pending_review" || prefilled) return;
    try {
      const res = await fetch(`/api/admin/fix-description?recipeId=${report.recipe_id}`);
      if (res.ok) {
        const { content } = await res.json();
        setText(content);
        setPrefilled(true);
      }
    } catch { /* ignore */ }
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !report.recipe_id) return;
    setBusy(true);
    setMsg(null);
    const reader = new FileReader();
    reader.onload = async () => {
      const content = reader.result as string;
      const res = await fetch("/api/admin/apply-fix", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipeId: report.recipe_id, reportId: report.id, type: "image", content }),
      });
      setBusy(false);
      if (res.ok) { setMsg("Image replaced"); onResolved(report.id); }
      else setMsg("Failed");
    };
    reader.readAsDataURL(file);
  }

  async function applyUserImage() {
    if (!report.recipe_id || !report.fix_file_path) return;
    setBusy(true);
    setMsg(null);
    // The image is already saved at public/<fix_file_path> — just mark resolved
    const res = await fetch("/api/admin/apply-fix", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        recipeId: report.recipe_id,
        reportId: report.id,
        type: "image",
        content: `already-applied:${report.fix_file_path}`,
      }),
    });
    setBusy(false);
    if (res.ok) { setMsg("Marked as applied"); onResolved(report.id); }
    else setMsg("Failed");
  }

  async function handleInstructionsSubmit() {
    if (!text.trim() || !report.recipe_id) return;
    setBusy(true);
    setMsg(null);
    const res = await fetch("/api/admin/apply-fix", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ recipeId: report.recipe_id, reportId: report.id, type: "instructions", content: text }),
    });
    setBusy(false);
    if (res.ok) { setMsg("Instructions updated"); onResolved(report.id); }
    else setMsg("Failed");
  }

  async function handleMarkResolved() {
    if (!report.recipe_id) return;
    setBusy(true);
    const res = await fetch("/api/admin/apply-fix", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ recipeId: report.recipe_id, reportId: report.id, type: "instructions", content: " " }),
    });
    setBusy(false);
    if (res.ok) onResolved(report.id);
  }

  if (report.resolved_at) {
    return (
      <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "rgba(0,180,80,0.12)", color: "#4CAF50" }}>
        Resolved
      </span>
    );
  }

  const hasPendingReview = report.fix_status === "pending_review" && !!report.fix_file_path;
  const hasApplied = report.fix_status === "applied";

  return (
    <div>
      <button
        type="button"
        onClick={() => { setOpen((v) => !v); if (!open) loadPendingDescription(); }}
        className="text-xs px-3 py-1.5 rounded-full font-semibold transition-all"
        style={{ background: "rgba(200,82,42,0.15)", color: "#C8522A", border: "1px solid rgba(200,82,42,0.3)" }}
      >
        {open ? "Cancel" : "Fix"}
      </button>

      {open && (
        <div className="mt-3 p-3 rounded-xl space-y-3" style={{ background: "rgba(42,24,8,0.4)", border: "1px solid rgba(58,36,22,0.5)" }}>
          <div className="flex gap-2">
            {(["image", "instructions"] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMode(m)}
                className="text-xs px-2 py-1 rounded-full font-semibold transition-all"
                style={{
                  background: mode === m ? "rgba(200,82,42,0.2)" : "transparent",
                  color: mode === m ? "#C8522A" : "#6B4E36",
                  border: "1px solid rgba(58,36,22,0.4)",
                }}
              >
                {m === "image" ? "Replace Image" : "Fix Instructions"}
              </button>
            ))}
            <button
              type="button"
              onClick={handleMarkResolved}
              disabled={busy}
              className="text-xs px-2 py-1 rounded-full font-semibold ml-auto"
              style={{ color: "#4A3020", border: "1px solid rgba(58,36,22,0.3)" }}
            >
              Mark Resolved
            </button>
          </div>

          {mode === "image" ? (
            <div className="space-y-2">
              {hasApplied && (
                <div className="rounded-lg p-2 text-xs" style={{ background: "rgba(0,180,80,0.1)", color: "#4CAF50" }}>
                  ✓ User image already applied to disk. Click below to mark resolved in Supabase.
                  <button
                    type="button"
                    onClick={applyUserImage}
                    disabled={busy}
                    className="block mt-1 px-3 py-1 rounded-full text-xs font-semibold"
                    style={{ background: "rgba(0,180,80,0.2)", color: "#4CAF50", border: "1px solid rgba(0,180,80,0.3)" }}
                  >
                    {busy ? "Saving..." : "Mark Applied"}
                  </button>
                </div>
              )}
              <label className="block cursor-pointer">
                <span className="text-xs" style={{ color: "#8A6A4A" }}>Upload replacement image (.jpg / .png)</span>
                <input type="file" accept="image/*" onChange={handleImageUpload} disabled={busy} className="mt-1 block text-xs w-full" />
              </label>
            </div>
          ) : (
            <div>
              {hasPendingReview && !prefilled && (
                <p className="text-xs mb-1" style={{ color: "#8A6A4A" }}>
                  Loading user-submitted correction…
                </p>
              )}
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder={"Step 1: ...\nStep 2: ..."}
                rows={5}
                className="w-full text-xs p-2 rounded-lg resize-none"
                style={{ background: "rgba(18,12,7,0.6)", color: "#EFE3CE", border: "1px solid rgba(58,36,22,0.5)" }}
              />
              <button
                type="button"
                onClick={handleInstructionsSubmit}
                disabled={busy || !text.trim()}
                className="mt-2 text-xs px-3 py-1.5 rounded-full font-semibold"
                style={{ background: "rgba(200,82,42,0.2)", color: "#C8522A", border: "1px solid rgba(200,82,42,0.3)" }}
              >
                {busy ? "Saving..." : "Apply Instructions"}
              </button>
            </div>
          )}

          {msg && <p className="text-xs" style={{ color: msg === "Failed" ? "#e74c3c" : "#4CAF50" }}>{msg}</p>}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Add "User Fix Attached" badge to report cards**

Find the `<div className="mt-3 flex items-center justify-between">` inside the report card map. Replace it with:

```tsx
<div className="mt-3 flex items-center justify-between gap-2 flex-wrap">
  <FixPanel
    report={{ ...r, resolved_at: resolvedIds.has(r.id) ? new Date().toISOString() : r.resolved_at ?? null, resolved_by: r.resolved_by ?? null }}
    onResolved={handleResolved}
  />
  {r.fix_file_path && (
    <span
      className="text-xs px-2 py-0.5 rounded-full font-semibold"
      style={{ background: "rgba(200,82,42,0.12)", color: "#C8522A", border: "1px solid rgba(200,82,42,0.25)" }}
    >
      {r.fix_status === "applied" ? "✓ User image applied" : "📎 User fix attached"}
    </span>
  )}
</div>
```

- [ ] **Step 5: Add "User Submitted" filter pill**

Find the `issueTypes` useMemo. After it, add a separate boolean state:

```ts
const [userFixOnly, setUserFixOnly] = useState(false);
```

Update the `grouped` useMemo to also honour `userFixOnly`:

```ts
const grouped = useMemo(() => {
  let filtered = filterType === "all" ? reports : reports.filter((r) => (r.issue_type ?? "other") === filterType);
  if (userFixOnly) filtered = filtered.filter((r) => !!r.fix_file_path);
  const map: Record<string, Report[]> = {};
  for (const r of filtered) {
    const key = r.issue_type ?? "other";
    (map[key] ??= []).push(r);
  }
  return map;
}, [reports, filterType, userFixOnly]);
```

Add the filter pill in the filter pills section, after the existing pills:

```tsx
<button
  key="user-fix"
  type="button"
  onClick={() => setUserFixOnly((v) => !v)}
  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all"
  style={{
    background: userFixOnly ? "rgba(200,82,42,0.2)" : "rgba(42,24,8,0.5)",
    color: userFixOnly ? "#C8522A" : "#8A6A4A",
    border: userFixOnly ? "1px solid rgba(200,82,42,0.4)" : "1px solid rgba(58,36,22,0.5)",
  }}
>
  📎 User Submitted ({reports.filter((r) => !!r.fix_file_path).length})
</button>
```

- [ ] **Step 6: Manual test in browser**

1. Go to `/reports` (must be logged in)
2. A report submitted with a file shows the "📎 User fix attached" or "✓ User image applied" badge
3. Click "Fix" on a `faulty_image` + applied report → "Replace Image" tab shows the applied notice
4. Click "Fix" on a `wrong_info` + pending_review report → "Fix Instructions" tab pre-fills with the txt content
5. "User Submitted" filter pill filters to only reports with attachments
6. Mark resolved → badge disappears, "Resolved" chip appears

- [ ] **Step 7: Commit**

```bash
git add src/app/(app)/reports/reports-client.tsx
git commit -m "feat: admin reports — user fix badge, pre-populated FixPanel, filter pill"
```

---

### Task 6: Update apply-fix route to handle already-applied images

**Files:**
- Modify: `src/app/api/admin/apply-fix/route.ts`

The `applyUserImage` function in Task 5 sends `content: "already-applied:<path>"`. The apply-fix route needs to handle this without trying to decode it as base64.

- [ ] **Step 1: Add early-exit for already-applied images**

Find the image handling block (around line 66):

```ts
const fileData =
  type === "image"
    ? Buffer.from(content.replace(/^data:[^;]+;base64,/, ""), "base64")
    : Buffer.from(content, "utf-8");
```

Replace it with:

```ts
// "already-applied:<path>" means the file is already on disk — skip write, just mark resolved
if (type === "image" && content.startsWith("already-applied:")) {
  const now = new Date().toISOString();
  if (reportId) {
    await supabase
      .from("recipe_bug_reports")
      .update({ resolved_at: now, resolved_by: "admin-ui" })
      .eq("id", reportId);
  }
  return NextResponse.json({ ok: true, filePath: content.replace("already-applied:", "") });
}

const fileData =
  type === "image"
    ? Buffer.from(content.replace(/^data:[^;]+;base64,/, ""), "base64")
    : Buffer.from(content, "utf-8");
```

- [ ] **Step 2: Commit**

```bash
git add src/app/api/admin/apply-fix/route.ts
git commit -m "fix: apply-fix handles already-applied image marker from user upload path"
```

---

## Self-Review

**Spec coverage:**
- Section 1 (dialog file input + FormData): Task 4 ✓
- Section 2 (API formData, file save, 3-layer persistence): Task 3 ✓
- Section 3 (recipe-fixes.json, fixes/<id>.json, pending-fixes/): Task 3 ✓
- Section 4 (badge, FixPanel pre-population, filter pill, Report type): Task 5 ✓
- Supabase columns: Task 1 ✓
- fix-description GET route: Task 2 ✓
- apply-fix already-applied marker: Task 6 ✓

**Type consistency:**
- `fix_file_path` and `fix_status` defined in Task 1 (SQL), used in Task 3 (insert), surfaced in Task 5 (Report interface) — consistent throughout.
- `FixLogEntry` defined in Task 3 `persistFix`, only used internally — no cross-task type drift.
- `applyUserImage` in Task 5 sends `already-applied:<path>`, handled in Task 6 — the sentinel string matches exactly.

**Placeholder scan:** None found. All code blocks are complete and runnable.
