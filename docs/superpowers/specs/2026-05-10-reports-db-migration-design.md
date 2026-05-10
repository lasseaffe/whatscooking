# What's Cooking — Reports & Fix Pipeline DB Migration
**Date:** 2026-05-10  
**Status:** Awaiting approval  
**Target window:** Separate from VenturePath work

---

## Context

What's Cooking already has a working report + fix pipeline:
- Users click ⚠️ on recipe cards → report submitted to `recipe_bug_reports` Supabase table
- Admin views `/app/reports` dashboard
- Fixes applied via `scripts/apply-fixes.py` (local Python) writing to `fixes/` folder
- `fixes/queue.json` tracks pending/done status locally

The current system has a gap: **the local `queue.json` and the Supabase `recipe_bug_reports` table are not in sync**. Fixes applied via the admin UI update the DB but not `queue.json`. Fixes applied via `apply-fixes.py` update `queue.json` but rely on the DB for report lookups. This creates reconciliation problems and makes it impossible to know the true state of all issues from one place.

This spec migrates the pipeline to treat **Supabase as the single source of truth** for all report + fix state, eliminating `queue.json` as a parallel tracking mechanism.

---

## Current State

```
recipe_bug_reports (Supabase)
  ├── id, recipe_id, recipe_name, issue_type, description
  ├── source_url, reporter_id
  ├── created_at, resolved_at, resolved_by
  └── [NO: fix_status, fix_attempts, fix_log]

fixes/queue.json (local)
  ├── recipeId, type, path, status
  ├── addedAt, appliedAt
  └── [NOT SYNCED with DB]

fixes/images/{recipeId}.jpg     ← local files
fixes/instructions/{recipeId}.txt
```

**Problems:**
1. `queue.json` and DB diverge — no single source of truth
2. No history of LLM fix attempts (what was tried, what failed)
3. `apply-fixes.py` must be given report context manually (no DB query)
4. Admin dashboard can't show fix pipeline status alongside report status

---

## Target State

```
recipe_bug_reports (Supabase) — EXTENDED
  ├── existing columns (unchanged)
  ├── fix_status: "none" | "queued" | "in_progress" | "applied" | "failed" | "skipped"
  ├── fix_type: "image" | "instructions" | "llm_description" | "manual" | null
  ├── fix_path: "fixes/images/xxx.jpg" | null   ← local file path if applicable
  ├── fix_attempts: int (default 0)
  ├── fix_log: jsonb[]   ← array of attempt records
  └── fix_queued_at: timestamptz | null

fix_log entry shape:
  { attempt: int, ran_at: ISO, method: "python_script"|"llm"|"admin_ui",
    result: "ok"|"error", detail: "string" }
```

`fixes/queue.json` is **retired**. The Python script and LLM fixer query Supabase directly.

---

## Migration Plan

### Step 1 — DB Schema Migration

Add columns to `recipe_bug_reports`:

```sql
ALTER TABLE recipe_bug_reports
  ADD COLUMN fix_status text NOT NULL DEFAULT 'none'
    CHECK (fix_status IN ('none','queued','in_progress','applied','failed','skipped')),
  ADD COLUMN fix_type text
    CHECK (fix_type IN ('image','instructions','llm_description','manual')),
  ADD COLUMN fix_path text,
  ADD COLUMN fix_attempts int NOT NULL DEFAULT 0,
  ADD COLUMN fix_log jsonb NOT NULL DEFAULT '[]',
  ADD COLUMN fix_queued_at timestamptz;

CREATE INDEX idx_bug_reports_fix_status ON recipe_bug_reports(fix_status);
```

### Step 2 — Migrate existing queue.json entries

One-time migration script (`scripts/migrate-queue-to-db.mjs`):
1. Read `fixes/queue.json`
2. For each entry, find matching `recipe_bug_reports` row by `recipe_id`
3. Update `fix_status` to `"applied"` if `status === "done"`, else `"queued"`
4. Set `fix_queued_at`, `fix_path` from queue entry
5. Log any entries with no matching DB row (orphaned)

### Step 3 — Update `apply-fixes.py`

Replace all `queue.json` reads/writes with Supabase queries:

```python
# Before: scan fixes/ folder → populate queue.json
# After:  query Supabase for fix_status = 'queued'

pending = supabase.table('recipe_bug_reports') \
    .select('*') \
    .eq('fix_status', 'queued') \
    .execute().data

for report in pending:
    supabase.table('recipe_bug_reports').update({
        'fix_status': 'in_progress'
    }).eq('id', report['id']).execute()
    
    # ... apply fix ...
    
    supabase.table('recipe_bug_reports').update({
        'fix_status': 'applied',
        'resolved_at': now(),
        'resolved_by': 'apply-fixes-script',
        'fix_attempts': report['fix_attempts'] + 1,
        'fix_log': report['fix_log'] + [{ 'attempt': ..., 'result': 'ok', ... }]
    }).eq('id', report['id']).execute()
```

### Step 4 — Update Admin UI (`/app/reports`)

- Add `fix_status` column/badge to report list (color-coded: queued=yellow, applied=green, failed=red)
- "Queue for fix" button → sets `fix_status = 'queued'`, `fix_queued_at = now()`
- Expand row to show `fix_log` history (collapsible JSON viewer or timeline)
- "Mark skipped" button → `fix_status = 'skipped'`

### Step 5 — Update API route (`/api/recipe-reports`)

When a new report is submitted with `issue_type = 'faulty_image'`:
- Set `fix_status = 'queued'` immediately (was previously fire-and-forget)
- Set `fix_queued_at = now()`
- Still spawn the screenshot scraper as before (background job)
- When scraper completes → update `fix_status = 'applied'` or `'failed'`

### Step 6 — Retire queue.json

- Keep `fixes/queue.json` on disk as archive (rename to `fixes/queue.archive.json`)
- Remove all read/write references from scripts
- Update `run-recipe-fixes.bat` to remove the "populate queue" menu option

---

## RLS Policy

The new columns are on an existing table. Existing RLS policies apply:
- Reporters can insert (unchanged)
- `fix_status`, `fix_log`, `fix_path` are admin-only writes → add policy:

```sql
CREATE POLICY "admin_update_fix_fields" ON recipe_bug_reports
  FOR UPDATE USING (auth.jwt() ->> 'role' = 'admin')
  WITH CHECK (auth.jwt() ->> 'role' = 'admin');
```

If no role system exists yet, scope to `service_role` key only (used by scripts).

---

## What Does NOT Change

- Report button UI (`/src/components/report-button.tsx`) — no changes
- Report modal fields — no changes  
- `recipe_bug_reports` existing columns — no changes, only additive
- `fixes/images/` and `fixes/instructions/` folders — still used for local file staging
- `scripts/scraping/fix_recipe_titles.mjs` (Ollama title fixer) — separate concern, not in scope

---

## Files to Create / Modify

| File | Action |
|------|--------|
| `supabase/migrations/YYYYMMDD_add_fix_columns.sql` | Create — DB migration |
| `scripts/migrate-queue-to-db.mjs` | Create — one-time migration |
| `scripts/apply-fixes.py` | Modify — replace queue.json with Supabase |
| `src/app/api/recipe-reports/route.ts` | Modify — set fix_status on submit |
| `src/app/(app)/reports/reports-client.tsx` | Modify — show fix status + log |
| `fixes/queue.json` | Retire → rename to queue.archive.json |

---

## Out of Scope (This Spec)

- LLM-powered description fixing for recipes (separate feature)
- Automated fix scheduling / cron (manual `.bat` trigger only)
- Public-facing fix status (admin only)
- Changing the report button UI or issue types

---

## Open Questions

- Is there an existing `role` claim on the Supabase JWT, or do fix-column writes need to be service_role only?
- Should `fix_log` be capped (e.g. max 10 entries) to avoid unbounded JSONB growth?
