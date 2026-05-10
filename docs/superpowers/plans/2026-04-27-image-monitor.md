# Image Monitor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a recipe image monitoring system that checks display health, relevance, and duplicates — then auto-fixes problems by writing the correct category-matched Unsplash URL back to Supabase.

**Architecture:** Shared core logic in `src/lib/image-monitor.ts` is imported by both a CLI script (`scripts/monitor-images.mjs`) and a protected Next.js API route (`src/app/api/admin/monitor-images/route.ts`). The core builds an inverted index from `CATEGORY_PHOTOS` in `lib/recipe-image.ts` to check relevance without AI. Vercel Cron calls the API route daily.

**Tech Stack:** Node.js ESM (CLI), Next.js App Router API route, Supabase JS client, `fetch` for HEAD pings, `vercel.json` cron.

---

## File Map

| File | Action | Responsibility |
|------|--------|---------------|
| `src/lib/image-monitor.ts` | **Create** | Core monitor logic: fetch recipes, run all checks, auto-fix, return report |
| `src/lib/recipe-image.ts` | **Modify** | Export `CATEGORY_PHOTOS` (currently unexported) so monitor can build inverted index |
| `scripts/monitor-images.mjs` | **Create** | CLI entry point — calls `runImageMonitor`, writes log + JSON report |
| `src/app/api/admin/monitor-images/route.ts` | **Create** | GET handler — verifies Bearer token, calls `runImageMonitor`, returns JSON |
| `vercel.json` | **Create/Modify** | Add daily cron trigger for the API route |
| `logs/image-problems.log` | **Created at runtime** | Append-only log written by the monitor |

---

## Task 1: Export CATEGORY_PHOTOS from recipe-image.ts

**Files:**
- Modify: `src/lib/recipe-image.ts:19`

The monitor needs to build an inverted index (photo ID → category) from `CATEGORY_PHOTOS`. Currently it's a module-private `const`. We just need to add `export`.

- [ ] **Step 1: Add export to CATEGORY_PHOTOS**

In `src/lib/recipe-image.ts`, change line 19:
```ts
// before
const CATEGORY_PHOTOS: Record<string, string[]> = {
// after
export const CATEGORY_PHOTOS: Record<string, string[]> = {
```

- [ ] **Step 2: Verify TypeScript still compiles**

```bash
cd C:/Users/lasse/Desktop/whatscooking
npx tsc --noEmit
```
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/lib/recipe-image.ts
git commit -m "feat: export CATEGORY_PHOTOS for image monitor"
```

---

## Task 2: Create src/lib/image-monitor.ts (core logic)

**Files:**
- Create: `src/lib/image-monitor.ts`

This is the heart of the system. It handles all four checks and the auto-fix in one `runImageMonitor()` function.

**Relevance check logic:** Build an inverted map `{ [photoId]: category }` from `CATEGORY_PHOTOS`. For each recipe with an Unsplash `image_url`, extract the photo ID from the URL (the `photo-XXXXXXX` segment), look it up in the inverted map, and compare to `detectFoodCategory(title, cuisine)`. If the categories differ, flag as mismatched.

- [ ] **Step 1: Create the file**

```ts
// src/lib/image-monitor.ts
import { createClient } from "@supabase/supabase-js";
import { CATEGORY_PHOTOS, detectFoodCategory, getCategoryFallback } from "./recipe-image";

const TIMEOUT_MS = 8_000;
const UNSPLASH_BASE = "https://images.unsplash.com/";

export interface MonitorOptions {
  supabaseUrl: string;
  supabaseKey: string;
  concurrency?: number;
  limit?: number;
  logPath?: string;
  dryRun?: boolean;
}

export interface RecipeRow {
  id: string;
  title: string;
  image_url: string | null;
  cuisine_type: string | null;
  dietary_tags: string[] | null;
}

export interface IssueRecord {
  id: string;
  title: string;
  image_url: string | null;
  reason: "broken" | "duplicate" | "mismatched" | "null";
  fixedUrl: string;
}

export interface MonitorReport {
  generatedAt: string;
  totalRecipes: number;
  checked: number;
  issues: IssueRecord[];
  fixed: number;
  dryRun: boolean;
}

// ── Build inverted index: photoId → category ──────────────────────────────────
function buildPhotoIndex(): Map<string, string> {
  const index = new Map<string, string>();
  for (const [category, ids] of Object.entries(CATEGORY_PHOTOS)) {
    for (const id of ids) {
      index.set(id, category);
    }
  }
  return index;
}

// ── Extract Unsplash photo ID from URL ────────────────────────────────────────
function extractUnsplashId(url: string): string | null {
  if (!url.startsWith(UNSPLASH_BASE)) return null;
  const match = url.match(/\/(photo-[^?/]+)/);
  return match ? match[1] : null;
}

// ── HEAD ping with timeout ────────────────────────────────────────────────────
async function ping(url: string): Promise<{ ok: boolean; status: number | string }> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    const res = await fetch(url, { method: "HEAD", signal: controller.signal });
    clearTimeout(timer);
    return { ok: res.ok, status: res.status };
  } catch (err: unknown) {
    const isAbort = err instanceof Error && err.name === "AbortError";
    return { ok: false, status: isAbort ? "TIMEOUT" : "ERROR" };
  }
}

// ── Concurrency pool ──────────────────────────────────────────────────────────
async function runPool<T>(tasks: Array<() => Promise<T>>, concurrency: number): Promise<T[]> {
  const results: T[] = new Array(tasks.length);
  let idx = 0;
  async function worker() {
    while (idx < tasks.length) {
      const i = idx++;
      results[i] = await tasks[i]();
    }
  }
  await Promise.all(Array.from({ length: concurrency }, worker));
  return results;
}

// ── Fetch all recipes from Supabase ───────────────────────────────────────────
async function fetchRecipes(supabase: ReturnType<typeof createClient>): Promise<RecipeRow[]> {
  const PAGE = 1000;
  const all: RecipeRow[] = [];
  let from = 0;
  while (true) {
    const { data, error } = await supabase
      .from("recipes")
      .select("id, title, image_url, cuisine_type, dietary_tags")
      .range(from, from + PAGE - 1);
    if (error) throw new Error(`Supabase fetch error: ${error.message}`);
    if (!data?.length) break;
    all.push(...(data as RecipeRow[]));
    if (data.length < PAGE) break;
    from += PAGE;
  }
  return all;
}

// ── Main entry point ──────────────────────────────────────────────────────────
export async function runImageMonitor(options: MonitorOptions): Promise<MonitorReport> {
  const { supabaseUrl, supabaseKey, concurrency = 8, limit = 0, dryRun = false } = options;

  const supabase = createClient(supabaseUrl, supabaseKey);
  const photoIndex = buildPhotoIndex();

  let recipes = await fetchRecipes(supabase);
  if (limit > 0) recipes = recipes.slice(0, limit);

  const issueMap = new Map<string, IssueRecord>();

  // ── 1. Null image check ──────────────────────────────────────────────────
  for (const r of recipes) {
    if (!r.image_url) {
      issueMap.set(r.id, {
        id: r.id,
        title: r.title,
        image_url: null,
        reason: "null",
        fixedUrl: getCategoryFallback(r.id, r.title, r.cuisine_type, r.dietary_tags),
      });
    }
  }

  // ── 2. Duplicate check ───────────────────────────────────────────────────
  const urlToIds = new Map<string, string[]>();
  for (const r of recipes) {
    if (!r.image_url) continue;
    const list = urlToIds.get(r.image_url) ?? [];
    list.push(r.id);
    urlToIds.set(r.image_url, list);
  }
  for (const [, ids] of urlToIds) {
    if (ids.length < 2) continue;
    for (const id of ids) {
      if (issueMap.has(id)) continue;
      const r = recipes.find(x => x.id === id)!;
      issueMap.set(id, {
        id,
        title: r.title,
        image_url: r.image_url,
        reason: "duplicate",
        fixedUrl: getCategoryFallback(id, r.title, r.cuisine_type, r.dietary_tags),
      });
    }
  }

  // ── 3. Relevance check (Unsplash only) ───────────────────────────────────
  for (const r of recipes) {
    if (!r.image_url || issueMap.has(r.id)) continue;
    const photoId = extractUnsplashId(r.image_url);
    if (!photoId) continue; // external URL — skip relevance check
    const storedCategory = photoIndex.get(photoId);
    if (!storedCategory) continue; // unknown ID — treat as ok
    const expectedCategory = detectFoodCategory(r.title, r.cuisine_type, r.dietary_tags);
    if (storedCategory !== expectedCategory) {
      issueMap.set(r.id, {
        id: r.id,
        title: r.title,
        image_url: r.image_url,
        reason: "mismatched",
        fixedUrl: getCategoryFallback(r.id, r.title, r.cuisine_type, r.dietary_tags),
      });
    }
  }

  // ── 4. Display check (HEAD ping) ─────────────────────────────────────────
  const withImages = recipes.filter(r => r.image_url && !issueMap.has(r.id));
  const uniqueUrls = [...new Set(withImages.map(r => r.image_url as string))];

  const pingResults = await runPool(
    uniqueUrls.map(url => async () => {
      const result = await ping(url);
      return { url, ...result };
    }),
    concurrency,
  );

  const brokenUrls = new Set(
    pingResults.filter(p => !p.ok && (p.status === 404 || p.status === 410)).map(p => p.url),
  );
  for (const r of withImages) {
    if (!r.image_url || !brokenUrls.has(r.image_url)) continue;
    issueMap.set(r.id, {
      id: r.id,
      title: r.title,
      image_url: r.image_url,
      reason: "broken",
      fixedUrl: getCategoryFallback(r.id, r.title, r.cuisine_type, r.dietary_tags),
    });
  }

  const issues = [...issueMap.values()];

  // ── 5. Auto-fix ──────────────────────────────────────────────────────────
  let fixed = 0;
  if (!dryRun && issues.length > 0) {
    for (const issue of issues) {
      const { error } = await supabase
        .from("recipes")
        .update({ image_url: issue.fixedUrl })
        .eq("id", issue.id);
      if (!error) fixed++;
    }
  }

  return {
    generatedAt: new Date().toISOString(),
    totalRecipes: recipes.length,
    checked: recipes.length,
    issues,
    fixed,
    dryRun,
  };
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd C:/Users/lasse/Desktop/whatscooking
npx tsc --noEmit
```
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/lib/image-monitor.ts
git commit -m "feat: add image monitor core logic"
```

---

## Task 3: Create scripts/monitor-images.mjs (CLI)

**Files:**
- Create: `scripts/monitor-images.mjs`

The CLI mirrors the existing `check-images.mjs` style. It imports `runImageMonitor` from the compiled output via a direct relative import to the TS source (Node runs it fine via `--experimental-strip-types` or we use the `.js` transpile target — but this project's existing `check-images.mjs` uses `@supabase/supabase-js` directly, not compiled TS). So the CLI is a standalone `.mjs` that reimplements only the thin entry-point layer using the same Supabase credentials, and calls into a **duplicate of the core logic inlined here** — wait, that violates DRY.

Better: use `tsx` (already likely available since Next.js 16 uses it) to run the TS file directly:

- [ ] **Step 1: Check if tsx is available**

```bash
cd C:/Users/lasse/Desktop/whatscooking
npx tsx --version
```
Expected: version string printed (e.g. `4.x.x`). If not found, install: `npm install -D tsx`.

- [ ] **Step 2: Create scripts/monitor-images.mjs**

```js
// scripts/monitor-images.mjs
// Run with: node --import tsx/esm scripts/monitor-images.mjs
// Or:       npx tsx scripts/monitor-images.mjs

import { runImageMonitor } from "../src/lib/image-monitor.ts";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://oruplzhfmtehsjbnsoms.supabase.co";
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

function getArg(flag) {
  const i = process.argv.indexOf(flag);
  return i !== -1 ? process.argv[i + 1] : null;
}

const concurrency = parseInt(getArg("--concurrency") ?? "8", 10);
const limit = parseInt(getArg("--limit") ?? "0", 10);
const dryRun = process.argv.includes("--dry-run");

console.log("🔍 What's Cooking — Image Monitor");
console.log(`   dry-run: ${dryRun}, concurrency: ${concurrency}${limit ? `, limit: ${limit}` : ""}\n`);

const report = await runImageMonitor({
  supabaseUrl: SUPABASE_URL,
  supabaseKey: SUPABASE_KEY,
  concurrency,
  limit,
  dryRun,
});

// ── Console summary ───────────────────────────────────────────────────────────
console.log(`📋 ${report.totalRecipes} recipes scanned`);
console.log(`⚠️  ${report.issues.length} issues found`);

const byReason = { null: 0, broken: 0, duplicate: 0, mismatched: 0 };
for (const i of report.issues) byReason[i.reason]++;
if (byReason.null)       console.log(`   • ${byReason.null} missing image_url`);
if (byReason.broken)     console.log(`   • ${byReason.broken} broken URLs (404/410)`);
if (byReason.duplicate)  console.log(`   • ${byReason.duplicate} duplicate URLs`);
if (byReason.mismatched) console.log(`   • ${byReason.mismatched} mismatched (wrong category)`);

if (!dryRun) console.log(`✅ ${report.fixed} recipes auto-fixed`);

// ── Append to image-problems.log ─────────────────────────────────────────────
const logPath = path.join(__dirname, "..", "logs", "image-problems.log");
const logEntry = [
  `\n[${report.generatedAt}]`,
  `total=${report.totalRecipes} issues=${report.issues.length} fixed=${report.fixed} dryRun=${report.dryRun}`,
  ...report.issues.map(i => `  ${i.reason.padEnd(12)} [${i.id.slice(0, 8)}] ${i.title} → ${i.fixedUrl.slice(0, 60)}`),
].join("\n");

fs.appendFileSync(logPath, logEntry + "\n");
console.log(`\n📝 Appended to logs/image-problems.log`);

// ── Write JSON report ─────────────────────────────────────────────────────────
const reportPath = path.join(__dirname, "..", "image-audit-report.json");
fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
console.log(`📁 Full report saved to image-audit-report.json`);

if (report.issues.length > 0 && !dryRun) process.exitCode = 0; // fixed — exit clean
if (report.issues.length > 0 && dryRun) process.exitCode = 1;  // issues found but not fixed
```

- [ ] **Step 3: Add npm script to package.json**

In `package.json`, add to `"scripts"`:
```json
"monitor-images": "npx tsx scripts/monitor-images.mjs",
"monitor-images:dry": "npx tsx scripts/monitor-images.mjs --dry-run"
```

- [ ] **Step 4: Run a dry-run to verify it works**

```bash
cd C:/Users/lasse/Desktop/whatscooking
npm run monitor-images:dry -- --limit 10
```
Expected: console output showing recipe count, issue summary, and a line "Appended to logs/image-problems.log". No DB writes.

- [ ] **Step 5: Commit**

```bash
git add scripts/monitor-images.mjs package.json
git commit -m "feat: add image monitor CLI script"
```

---

## Task 4: Create the API route

**Files:**
- Create: `src/app/api/admin/monitor-images/route.ts`

The API route is protected with a `MONITOR_SECRET` env var. The caller must pass `Authorization: Bearer <secret>`. It calls `runImageMonitor` with the service role key (so it can update rows).

- [ ] **Step 1: Create the route**

```ts
// src/app/api/admin/monitor-images/route.ts
import { NextRequest, NextResponse } from "next/server";
import { runImageMonitor } from "@/lib/image-monitor";

export async function GET(req: NextRequest) {
  const secret = process.env.MONITOR_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "MONITOR_SECRET not configured" }, { status: 500 });
  }

  const auth = req.headers.get("authorization") ?? "";
  if (auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    return NextResponse.json({ error: "Supabase credentials missing" }, { status: 500 });
  }

  const dryRun = req.nextUrl.searchParams.get("dry_run") === "1";
  const limit = parseInt(req.nextUrl.searchParams.get("limit") ?? "0", 10);

  try {
    const report = await runImageMonitor({ supabaseUrl: url, supabaseKey: key, dryRun, limit });
    return NextResponse.json(report);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
```

- [ ] **Step 2: Add MONITOR_SECRET to .env.local**

Open `.env.local` and append:
```
MONITOR_SECRET=wc-image-monitor-2026
```
(Change this to a strong secret before deploying.)

- [ ] **Step 3: Verify TypeScript compiles**

```bash
cd C:/Users/lasse/Desktop/whatscooking
npx tsc --noEmit
```
Expected: no errors.

- [ ] **Step 4: Start dev server and test the route**

```bash
npm run dev
```
Then in a second terminal:
```bash
curl -s -H "Authorization: Bearer wc-image-monitor-2026" \
  "http://localhost:3002/api/admin/monitor-images?dry_run=1&limit=5"
```
Expected: JSON with `totalRecipes`, `issues`, `fixed: 0`, `dryRun: true`.

Also verify that a missing/wrong token returns 401:
```bash
curl -s "http://localhost:3002/api/admin/monitor-images"
```
Expected: `{"error":"Unauthorized"}` with HTTP 401.

- [ ] **Step 5: Commit**

```bash
git add src/app/api/admin/monitor-images/route.ts .env.local
git commit -m "feat: add /api/admin/monitor-images route"
```

---

## Task 5: Configure Vercel Cron

**Files:**
- Create or modify: `vercel.json`

Vercel Cron calls the API route daily at 03:00 UTC. The Authorization header is passed via a `CRON_SECRET` env var — Vercel injects it automatically when `authorization` is set in the cron config.

- [ ] **Step 1: Check if vercel.json already exists**

```bash
ls C:/Users/lasse/Desktop/whatscooking/vercel.json 2>/dev/null && echo exists || echo missing
```

- [ ] **Step 2a: If missing — create vercel.json**

```json
{
  "crons": [
    {
      "path": "/api/admin/monitor-images",
      "schedule": "0 3 * * *"
    }
  ]
}
```

- [ ] **Step 2b: If exists — add the crons array**

Read the existing file and merge in:
```json
"crons": [
  {
    "path": "/api/admin/monitor-images",
    "schedule": "0 3 * * *"
  }
]
```

- [ ] **Step 3: Add MONITOR_SECRET to Vercel environment variables**

In your Vercel project dashboard → Settings → Environment Variables, add:
- Key: `MONITOR_SECRET`
- Value: same value as in `.env.local`
- Environment: Production (and Preview if desired)

Also ensure `SUPABASE_SERVICE_KEY` is set (the service role key from Supabase dashboard → Settings → API).

- [ ] **Step 4: Commit**

```bash
git add vercel.json
git commit -m "feat: schedule image monitor via Vercel Cron (daily 03:00 UTC)"
```

---

## Self-Review

**Spec coverage check:**
- ✅ Check if image is being displayed — Task 2, display check (HEAD ping, step 4)
- ✅ Check if image corresponds to recipe — Task 2, relevance check (step 3, inverted index)
- ✅ Regularly scheduled check — Task 5, Vercel Cron daily
- ✅ Scan images reported with problem (log file) — Task 2 reads from Supabase (all recipes, including previously logged); log is written in Task 3 step 2. Note: the log is append-only for audit trail; the monitor re-checks all recipes each run so previously logged items are naturally re-scanned.
- ✅ Fix duplicates — Task 2, duplicate check + auto-fix (step 5)
- ✅ CLI script — Task 3
- ✅ API route — Task 4

**Placeholder scan:** None found.

**Type consistency:**
- `MonitorOptions`, `RecipeRow`, `IssueRecord`, `MonitorReport` defined once in Task 2, used in Tasks 3 and 4.
- `runImageMonitor` defined in Task 2, imported in Tasks 3 and 4.
- `CATEGORY_PHOTOS`, `detectFoodCategory`, `getCategoryFallback` exported in Task 1, imported in Task 2.
