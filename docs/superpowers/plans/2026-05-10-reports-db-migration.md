# What's Cooking — Reports DB Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make Supabase the single source of truth for all report + fix state by adding fix-tracking columns to `recipe_bug_reports`, migrating existing `queue.json` data into the DB, and updating all scripts and UI to query Supabase instead of reading/writing `queue.json`.

**Architecture:** Additive DB migration (no destructive changes to existing columns) + one-time migration script + updated Python fixer + updated API route + updated admin UI. `queue.json` is renamed to `queue.archive.json` after migration and no longer written to.

**Tech Stack:** Supabase (PostgreSQL), Next.js App Router API routes, Python 3 (`supabase-py`), React (admin UI), existing `recipe_bug_reports` table.

---

## File Map

| File | Action | Responsibility |
|------|--------|----------------|
| `supabase/migrations/20260510_add_fix_columns.sql` | Create | Additive migration: 6 new columns + index on `recipe_bug_reports` |
| `scripts/migrate-queue-to-db.mjs` | Create | One-time script: reads `fixes/queue.json`, upserts fix_status into Supabase |
| `scripts/apply-fixes.py` | Modify | Replace all `queue.json` reads/writes with Supabase queries |
| `src/app/api/recipe-reports/route.ts` | Modify | Set `fix_status='queued'` and `fix_queued_at` on new faulty_image reports |
| `src/app/(app)/reports/reports-client.tsx` | Modify | Show `fix_status` badge + `fix_log` history per report |
| `fixes/queue.json` | Retire | Rename to `fixes/queue.archive.json` after migration |

---

## Task 1: DB migration

**Files:**
- Create: `supabase/migrations/20260510_add_fix_columns.sql`

- [ ] **Step 1: Create the migration file**

```sql
-- supabase/migrations/20260510_add_fix_columns.sql
-- Additive migration: adds fix-tracking columns to recipe_bug_reports.
-- Safe to run multiple times (uses IF NOT EXISTS / DO $$ pattern).

ALTER TABLE recipe_bug_reports
  ADD COLUMN IF NOT EXISTS fix_status text NOT NULL DEFAULT 'none'
    CHECK (fix_status IN ('none', 'queued', 'in_progress', 'applied', 'failed', 'skipped')),
  ADD COLUMN IF NOT EXISTS fix_type text
    CHECK (fix_type IN ('image', 'instructions', 'llm_description', 'manual')),
  ADD COLUMN IF NOT EXISTS fix_path text,
  ADD COLUMN IF NOT EXISTS fix_attempts integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS fix_log jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS fix_queued_at timestamptz;

-- Index for efficient "give me all queued fixes" queries
CREATE INDEX IF NOT EXISTS idx_bug_reports_fix_status
  ON recipe_bug_reports(fix_status);

-- Admin-only write policy for fix columns.
-- If no role system exists, these writes go via service_role key in scripts.
-- This policy allows authenticated users with role='admin' in JWT to update.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'recipe_bug_reports'
    AND policyname = 'admin_update_fix_fields'
  ) THEN
    CREATE POLICY admin_update_fix_fields ON recipe_bug_reports
      FOR UPDATE
      USING (
        (auth.jwt() ->> 'role') = 'admin'
        OR auth.role() = 'service_role'
      )
      WITH CHECK (
        (auth.jwt() ->> 'role') = 'admin'
        OR auth.role() = 'service_role'
      );
  END IF;
END $$;
```

- [ ] **Step 2: Run migration in Supabase**

Open the Supabase dashboard → SQL Editor → paste the file content → Run.

Or if Supabase CLI is installed:
```
supabase db push
```

- [ ] **Step 3: Verify columns exist**

In Supabase SQL Editor:
```sql
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'recipe_bug_reports'
  AND column_name IN ('fix_status','fix_type','fix_path','fix_attempts','fix_log','fix_queued_at')
ORDER BY column_name;
```

Expected: 6 rows returned, `fix_status` default is `'none'`, `fix_log` default is `'[]'`.

- [ ] **Step 4: Commit**

```
git add supabase/migrations/20260510_add_fix_columns.sql
git commit -m "feat: add fix-tracking columns to recipe_bug_reports"
```

---

## Task 2: One-time queue.json migration script

**Files:**
- Create: `scripts/migrate-queue-to-db.mjs`

- [ ] **Step 1: Check what's in queue.json**

```
node -e "const q = require('./fixes/queue.json'); console.log(q.length, 'entries'); console.log(q.slice(0,2));"
```

Note the count and shape of entries.

- [ ] **Step 2: Create `scripts/migrate-queue-to-db.mjs`**

You need the Supabase URL and service role key. Find them in `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
```

```js
// scripts/migrate-queue-to-db.mjs
// One-time migration: sync fixes/queue.json entries into recipe_bug_reports.fix_status
// Run once, then rename queue.json to queue.archive.json.

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load .env.local
const envFile = path.join(__dirname, '..', '.env.local');
if (fs.existsSync(envFile)) {
  fs.readFileSync(envFile, 'utf8').split('\n').forEach(line => {
    const [k, ...v] = line.trim().split('=');
    if (k && v.length && !process.env[k]) process.env[k] = v.join('=');
  });
}

const SUPABASE_URL      = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const QUEUE_FILE        = path.join(__dirname, '..', 'fixes', 'queue.json');

if (!SUPABASE_URL || !SUPABASE_ROLE_KEY) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

async function supabaseUpdate(recipeId, patch) {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/recipe_bug_reports?recipe_id=eq.${recipeId}&fix_status=eq.none`,
    {
      method: 'PATCH',
      headers: {
        apikey:          SUPABASE_ROLE_KEY,
        Authorization:   `Bearer ${SUPABASE_ROLE_KEY}`,
        'Content-Type':  'application/json',
        Prefer:          'return=representation',
      },
      body: JSON.stringify(patch),
    }
  );
  if (!res.ok) throw new Error(`Supabase error ${res.status}: ${await res.text()}`);
  return res.json();
}

const queue = JSON.parse(fs.readFileSync(QUEUE_FILE, 'utf8'));
console.log(`\n📋  Migrating ${queue.length} queue entries to Supabase\n`);

let migrated = 0, orphaned = 0;

for (const entry of queue) {
  const fixStatus = entry.status === 'done' ? 'applied' : 'queued';
  const patch = {
    fix_status:     fixStatus,
    fix_type:       entry.type === 'image' ? 'image' : 'instructions',
    fix_path:       entry.path ?? null,
    fix_queued_at:  entry.addedAt ?? new Date().toISOString(),
    fix_log: entry.status === 'done' ? [{
      attempt:    1,
      ran_at:     entry.appliedAt ?? entry.addedAt,
      method:     'python_script',
      result:     'ok',
      detail:     'Migrated from queue.json',
    }] : [],
  };

  try {
    const updated = await supabaseUpdate(entry.recipeId, patch);
    if (updated.length === 0) {
      console.log(`  ⚠️  Orphaned (no matching report): ${entry.recipeId} [${entry.type}]`);
      orphaned++;
    } else {
      console.log(`  ✅  ${entry.recipeId} → fix_status: ${fixStatus}`);
      migrated++;
    }
  } catch (e) {
    console.log(`  ✖  ${entry.recipeId}: ${e.message}`);
  }
}

console.log(`\n──────────────────────────────────────────────`);
console.log(`Migrated: ${migrated}, Orphaned: ${orphaned}`);
console.log(`\nNext: rename fixes/queue.json → fixes/queue.archive.json\n`);
```

- [ ] **Step 3: Run the migration**

```
cd C:\Users\lasse\Desktop\whatscooking
node scripts/migrate-queue-to-db.mjs
```

Expected: each queue entry logged as `✅` (migrated) or `⚠️` (orphaned — no matching report in DB).

- [ ] **Step 4: Rename queue.json**

```
rename fixes\queue.json queue.archive.json
```

- [ ] **Step 5: Commit**

```
git add scripts/migrate-queue-to-db.mjs fixes/queue.archive.json
git rm fixes/queue.json
git commit -m "feat: migrate queue.json to Supabase, retire local queue file"
```

---

## Task 3: Update `apply-fixes.py`

**Files:**
- Modify: `scripts/apply-fixes.py`

- [ ] **Step 1: Read the current file before editing**

Open `scripts/apply-fixes.py` and locate:
- The section that reads `fixes/queue.json`
- The section that writes `status: "done"` back to `queue.json`
- The Supabase client setup (it already uses supabase-py)

- [ ] **Step 2: Replace queue.json read with Supabase query**

Find and replace the queue-population block. The new pattern queries Supabase for `fix_status = 'queued'`:

```python
# Replace the block that scans fixes/ and reads queue.json with:

def get_pending_reports(supabase_client):
    """Fetch all reports queued for fixing from Supabase."""
    result = supabase_client.table('recipe_bug_reports') \
        .select('id, recipe_id, recipe_name, issue_type, fix_type, fix_path, fix_attempts, fix_log') \
        .eq('fix_status', 'queued') \
        .execute()
    return result.data
```

- [ ] **Step 3: Replace queue.json write with Supabase update**

Find and replace the block that marks entries as done in queue.json:

```python
import datetime

def mark_fix_applied(supabase_client, report_id, fix_type, fix_path, old_attempts, old_log):
    """Mark a report as fixed in Supabase."""
    now = datetime.datetime.utcnow().isoformat() + 'Z'
    new_log_entry = {
        'attempt':  old_attempts + 1,
        'ran_at':   now,
        'method':   'python_script',
        'result':   'ok',
        'detail':   f'Fix applied: {fix_type} at {fix_path}',
    }
    supabase_client.table('recipe_bug_reports').update({
        'fix_status':   'applied',
        'resolved_at':  now,
        'resolved_by':  'apply-fixes-script',
        'fix_attempts': old_attempts + 1,
        'fix_log':      old_log + [new_log_entry],
    }).eq('id', report_id).execute()

def mark_fix_failed(supabase_client, report_id, error_msg, old_attempts, old_log):
    """Mark a report fix as failed in Supabase."""
    now = datetime.datetime.utcnow().isoformat() + 'Z'
    new_log_entry = {
        'attempt':  old_attempts + 1,
        'ran_at':   now,
        'method':   'python_script',
        'result':   'error',
        'detail':   error_msg,
    }
    supabase_client.table('recipe_bug_reports').update({
        'fix_status':   'failed',
        'fix_attempts': old_attempts + 1,
        'fix_log':      old_log + [new_log_entry],
    }).eq('id', report_id).execute()
```

- [ ] **Step 4: Update the main fix loop**

Replace the loop that iterates over `queue.json` entries with one that uses the Supabase results:

```python
def main():
    supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
    pending = get_pending_reports(supabase)
    print(f'\n🔧  {len(pending)} reports queued for fixing\n')

    for report in pending:
        rid        = report['id']
        recipe_id  = report['recipe_id']
        fix_type   = report['fix_type']   # 'image' | 'instructions' | None
        fix_path   = report['fix_path']   # local file path | None
        attempts   = report['fix_attempts']
        log        = report['fix_log'] or []

        print(f'  ▶  {recipe_id} [{fix_type}]')

        # Mark in_progress to prevent double-processing
        supabase.table('recipe_bug_reports').update({
            'fix_status': 'in_progress'
        }).eq('id', rid).execute()

        try:
            if fix_type == 'image' and fix_path and os.path.exists(fix_path):
                apply_image_fix(supabase, recipe_id, fix_path)
                mark_fix_applied(supabase, rid, fix_type, fix_path, attempts, log)
                print(f'     ✅ Image applied')

            elif fix_type == 'instructions' and fix_path and os.path.exists(fix_path):
                apply_instructions_fix(supabase, recipe_id, fix_path)
                mark_fix_applied(supabase, rid, fix_type, fix_path, attempts, log)
                print(f'     ✅ Instructions applied')

            else:
                error = f'fix_type={fix_type}, fix_path={fix_path} — file not found or type unrecognised'
                mark_fix_failed(supabase, rid, error, attempts, log)
                print(f'     ✖  {error}')

        except Exception as e:
            mark_fix_failed(supabase, rid, str(e), attempts, log)
            print(f'     ✖  {e}')
```

- [ ] **Step 5: Remove all remaining `queue.json` references**

Search the file for any remaining `queue.json` references:
```
python -c "
with open('scripts/apply-fixes.py') as f:
    for i, line in enumerate(f, 1):
        if 'queue.json' in line or 'queue_file' in line.lower():
            print(f'{i}: {line.rstrip()}')
"
```

Delete or comment out any remaining queue.json lines found.

- [ ] **Step 6: Test apply-fixes.py**

Queue a test fix in Supabase SQL Editor:
```sql
UPDATE recipe_bug_reports
SET fix_status = 'queued', fix_type = 'image', fix_path = 'fixes/images/test.jpg'
WHERE id = (SELECT id FROM recipe_bug_reports LIMIT 1);
```

Run the script (no actual file needed — it will fail gracefully with `mark_fix_failed`):
```
python scripts/apply-fixes.py
```

Expected: report moves to `fix_status = 'failed'` with a `fix_log` entry. No crash.

- [ ] **Step 7: Commit**

```
git add scripts/apply-fixes.py
git commit -m "feat: apply-fixes.py reads/writes Supabase instead of queue.json"
```

---

## Task 4: Update API route to set fix_status on submission

**Files:**
- Modify: `src/app/api/recipe-reports/route.ts`

- [ ] **Step 1: Find the insert block in the route**

Open `src/app/api/recipe-reports/route.ts`. Find the `supabase.from('recipe_bug_reports').insert(...)` call.

- [ ] **Step 2: Add fix_status and fix_queued_at to the insert payload**

In the insert call, add these fields for `faulty_image` reports:

```typescript
// Inside the POST handler, update the insert payload:
const now = new Date().toISOString();
const isFaultyImage = issueType === 'faulty_image';

const { data: report, error: insertError } = await supabase
  .from('recipe_bug_reports')
  .insert({
    recipe_id:      recipeId,
    recipe_name:    recipeName,
    issue_type:     issueType,
    description:    description ?? null,
    source_url:     sourceUrl ?? null,
    reporter_id:    reporterId ?? null,
    // NEW: fix tracking
    fix_status:     isFaultyImage ? 'queued' : 'none',
    fix_type:       isFaultyImage ? 'image' : null,
    fix_queued_at:  isFaultyImage ? now : null,
  })
  .select()
  .single();
```

- [ ] **Step 3: Update the fix_status to 'failed' if the screenshot spawner errors**

After the spawned background job (the `hero_shot.py` / `site_screenshotter.py` call), if the spawn itself throws synchronously, update fix_status:

```typescript
// After spawning the background screenshot job:
try {
  spawnScreenshotJob(sourceUrl, recipeId); // existing call — keep as-is
} catch (spawnErr) {
  // Non-fatal — report was saved, just the auto-fix didn't start
  await supabase
    .from('recipe_bug_reports')
    .update({ fix_status: 'failed', fix_log: [{ attempt: 1, ran_at: now, method: 'screenshot_spawn', result: 'error', detail: String(spawnErr) }] })
    .eq('id', report.id);
}
```

- [ ] **Step 4: Verify in browser**

Submit a faulty_image report via the report button. In Supabase dashboard, check `recipe_bug_reports` — the new row should have `fix_status = 'queued'`.

- [ ] **Step 5: Commit**

```
git add src/app/api/recipe-reports/route.ts
git commit -m "feat: set fix_status=queued on faulty_image report submission"
```

---

## Task 5: Update admin reports UI

**Files:**
- Modify: `src/app/(app)/reports/reports-client.tsx`

- [ ] **Step 1: Add fix_status to the Supabase query**

In `reports-client.tsx`, find the data fetch (likely a `supabase.from('recipe_bug_reports').select(...)` call or a server component fetch). Add the new columns to the select:

```typescript
.select('id, recipe_id, recipe_name, issue_type, description, source_url, created_at, resolved_at, resolved_by, fix_status, fix_type, fix_path, fix_attempts, fix_log, fix_queued_at')
```

- [ ] **Step 2: Add fix_status badge to the report list**

Find the JSX where each report row is rendered. Add a colored badge after the issue_type pill:

```tsx
// Fix status badge — add next to existing issue_type badge
const FIX_STATUS_STYLE: Record<string, { bg: string; text: string; label: string }> = {
  none:        { bg: 'rgba(107,114,128,0.15)', text: '#6b7280', label: 'No fix' },
  queued:      { bg: 'rgba(251,191,36,0.15)',  text: '#fbbf24', label: 'Queued' },
  in_progress: { bg: 'rgba(96,165,250,0.15)',  text: '#60a5fa', label: 'In progress' },
  applied:     { bg: 'rgba(34,197,94,0.15)',   text: '#22c55e', label: 'Applied' },
  failed:      { bg: 'rgba(239,68,68,0.15)',   text: '#ef4444', label: 'Failed' },
  skipped:     { bg: 'rgba(107,114,128,0.15)', text: '#6b7280', label: 'Skipped' },
};

// In the report row JSX:
{(() => {
  const s = FIX_STATUS_STYLE[report.fix_status] ?? FIX_STATUS_STYLE.none;
  return (
    <span style={{
      fontSize: 9, fontFamily: 'monospace', letterSpacing: '0.1em',
      padding: '2px 6px', borderRadius: 3,
      background: s.bg, color: s.text,
    }}>
      {s.label}
    </span>
  );
})()}
```

- [ ] **Step 3: Add fix_log history panel**

Below each report row (in its expanded/detail view), add a collapsible fix log:

```tsx
{report.fix_log?.length > 0 && (
  <details style={{ marginTop: 8 }}>
    <summary style={{ fontSize: 9, fontFamily: 'monospace', color: '#6b7280', cursor: 'pointer', letterSpacing: '0.1em' }}>
      FIX LOG ({report.fix_log.length} attempt{report.fix_log.length !== 1 ? 's' : ''})
    </summary>
    <div style={{ marginTop: 6, display: 'flex', flexDirection: 'column', gap: 4 }}>
      {report.fix_log.map((entry: { attempt: number; ran_at: string; method: string; result: string; detail: string }, i: number) => (
        <div key={i} style={{
          fontSize: 9, fontFamily: 'monospace', padding: '4px 8px',
          background: entry.result === 'ok' ? 'rgba(34,197,94,0.08)' : 'rgba(239,68,68,0.08)',
          border: `1px solid ${entry.result === 'ok' ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)'}`,
          borderRadius: 3, color: '#9ca3af',
        }}>
          #{entry.attempt} · {entry.method} · {entry.result === 'ok' ? '✓' : '✖'} · {new Date(entry.ran_at).toLocaleString()}
          {entry.detail && <div style={{ color: '#6b7280', marginTop: 2 }}>{entry.detail}</div>}
        </div>
      ))}
    </div>
  </details>
)}
```

- [ ] **Step 4: Add "Queue for fix" button**

In the admin fix panel (where the existing "Fix" button is), add a "Queue for fix" option that sets `fix_status = 'queued'`:

```tsx
async function queueForFix(reportId: string) {
  await fetch('/api/admin/apply-fix', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ reportId, action: 'queue' }),
  });
  // Optimistic UI update or refresh
}

// In JSX:
<button
  onClick={() => queueForFix(report.id)}
  style={{
    fontSize: 9, fontFamily: 'monospace', letterSpacing: '0.1em',
    padding: '4px 10px', borderRadius: 3, cursor: 'pointer',
    background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.3)',
    color: '#fbbf24', textTransform: 'uppercase',
  }}
>
  Queue for fix
</button>
```

- [ ] **Step 5: Handle the `action: 'queue'` in `/api/admin/apply-fix`**

Open `src/app/api/admin/apply-fix/route.ts`. Add a branch for the `queue` action:

```typescript
if (action === 'queue') {
  await supabase
    .from('recipe_bug_reports')
    .update({
      fix_status:    'queued',
      fix_queued_at: new Date().toISOString(),
    })
    .eq('id', reportId);
  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 6: Test in browser**

1. Open `/app/reports` in the dev server
2. Verify fix_status badges appear on all reports (most should show "No fix")
3. Click "Queue for fix" on a report → badge updates to "Queued"
4. Run `python scripts/apply-fixes.py` → badge updates to "Applied" or "Failed"
5. Expand a report with a fix_log → history renders correctly

- [ ] **Step 7: Commit**

```
git add src/app/(app)/reports/reports-client.tsx src/app/api/admin/apply-fix/route.ts
git commit -m "feat: show fix_status and fix_log in admin reports UI"
```

---

## Task 6: Update `run-recipe-fixes.bat`

**Files:**
- Modify: `C:\Users\lasse\Desktop\run-recipe-fixes.bat`

- [ ] **Step 1: Read the current bat file content**

Open `C:\Users\lasse\Desktop\run-recipe-fixes.bat` and note all menu options.

- [ ] **Step 2: Remove the "populate queue" option, update wording**

The existing bat has a menu with options including one that populates `queue.json` from the `fixes/` folder. Remove that option. Update the remaining options to reflect that the queue is now in Supabase:

```bat
@echo off
title What's Cooking — Fix Runner
:menu
cls
echo.
echo  ============================================
echo   What's Cooking — Fix Pipeline
echo   Queue is now stored in Supabase DB
echo  ============================================
echo.
echo  [1] Apply all queued fixes (reads from Supabase)
echo  [2] Backup bug reports to backups/ folder
echo  [3] Exit
echo.
set /p CHOICE="Choose: "
if "%CHOICE%"=="1" goto apply
if "%CHOICE%"=="2" goto backup
if "%CHOICE%"=="3" exit
goto menu

:apply
cd /d C:\Users\lasse\Desktop\whatscooking
python scripts/apply-fixes.py
pause
goto menu

:backup
cd /d C:\Users\lasse\Desktop\whatscooking
python scripts/backup-reports.py
pause
goto menu
```

- [ ] **Step 3: Verify the bat works**

Double-click the bat → menu renders → choose option 1 → `apply-fixes.py` runs against Supabase.

- [ ] **Step 4: Commit**

```
git add .
git commit -m "feat: complete reports DB migration — queue.json retired, Supabase is source of truth"
```

---

## Self-Review

**Spec coverage check:**

| Spec requirement | Covered by |
|---|---|
| Add 6 columns to `recipe_bug_reports` | Task 1 |
| Index on `fix_status` | Task 1 |
| RLS policy for admin/service_role writes | Task 1 |
| One-time migration script for existing queue.json | Task 2 |
| Retire `queue.json` → `queue.archive.json` | Task 2 |
| `apply-fixes.py` queries Supabase for queued fixes | Task 3 |
| `apply-fixes.py` writes fix_status / fix_log to Supabase | Task 3 |
| No remaining queue.json writes in apply-fixes.py | Task 3 step 5 |
| API route sets fix_status='queued' on faulty_image submit | Task 4 |
| Admin UI: fix_status badge per report | Task 5 |
| Admin UI: fix_log history panel | Task 5 |
| Admin UI: "Queue for fix" button | Task 5 |
| `run-recipe-fixes.bat` updated | Task 6 |

All spec requirements covered. Type consistency: `fix_status` values (`'none'`, `'queued'`, `'in_progress'`, `'applied'`, `'failed'`, `'skipped'`) are consistent across migration SQL, Python script, API route, and UI constants. `fix_log` entry shape (`attempt`, `ran_at`, `method`, `result`, `detail`) is consistent across Task 3 and Task 5.
