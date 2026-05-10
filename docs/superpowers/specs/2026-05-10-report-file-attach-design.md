# Report Issue — File Attachment & Fix Pipeline

**Date:** 2026-05-10
**Status:** Approved

---

## Overview

Extend the "Report a problem" dialog so users can attach a file when reporting a faulty image or wrong title/info. The attached file is saved server-side and surfaced in the existing admin `/reports` page so an admin can apply it in one click.

---

## Section 1 — Report Dialog (client)

**File:** `src/components/report-button.tsx`

A file input appears **below the category pills** when one of two categories is selected:

| Category | Accepts | Label |
|---|---|---|
| `faulty_image` | `image/*` | "Attach replacement image (optional — we'll also try auto-fixing)" |
| `wrong_info` | `.txt` | "Attach corrected title/description as .txt (optional)" |

All other categories show no file input.

**New state:**
```ts
attachedFile: File | null
```

**Submit change:** Switch from `Content-Type: application/json` + `JSON.stringify` to `FormData`. All existing fields appended as form entries; file appended if present. No other UI changes.

**Fix logic (Option C):**
- `faulty_image` + file attached → server uses file directly, skips scraper
- `faulty_image` + no file → existing scraper path (`triggerImageFix`) unchanged
- `wrong_info` + file attached → server saves `.txt` for admin review
- All other categories → no file handling

---

## Section 2 — API Route (server)

**File:** `src/app/api/recipe-reports/route.ts`

Switch `req.json()` → `req.formData()`. Extract all existing fields the same way, plus optional file.

**File save paths:**
```
faulty_image + file  →  public/recipe-images/<recipeId>.jpg   (immediate, skips scraper)
wrong_info   + file  →  pending-fixes/<recipeId>/description.txt
```

**`fix_status` values written:**

| Scenario | `fix_status` |
|---|---|
| `faulty_image` + user file | `"applied"` |
| `faulty_image` + no file, has source_url | `"pending"` (scraper triggered) |
| `wrong_info` + user file | `"pending_review"` |
| All others | `null` |

**Three-layer persistence per report:**
1. Append to `recipe-fixes.json` at project root (append-only audit log)
2. Upsert `fixes/<recipeId>.json` (latest fix state for that recipe)
3. Supabase `recipe_bug_reports` insert — add `fix_file_path` and `fix_status` columns

`fix_file_path` stored as relative path from project root (e.g. `public/recipe-images/abc123.jpg`).

---

## Section 3 — Local Fix Store Structure

```
recipe-fixes.json                        ← append-only log, all reports with fix metadata
fixes/
  <recipeId>.json                        ← latest fix state per recipe (upserted)
  queue.json                             ← existing admin queue (unchanged)
  images/                                ← existing admin-applied images (unchanged)
  instructions/                          ← existing admin-applied instructions (unchanged)
pending-fixes/
  <recipeId>/
    description.txt                      ← corrected description/title from user
```

**Shape of `fixes/<recipeId>.json`:**
```json
{
  "recipeId": "abc123",
  "recipeName": "Spicy Smashed Cucumber Salad",
  "issueType": "wrong_info",
  "fixStatus": "pending_review",
  "fixFilePath": "pending-fixes/abc123/description.txt",
  "reportedAt": "2026-05-10T12:00:00Z",
  "reportId": "r_1234_xyz"
}
```

`recipe-fixes.json` is the same shape but an array — every report appended, never overwritten.

---

## Section 4 — Admin UI

**File:** `src/app/(app)/reports/reports-client.tsx`

Keep the existing `/reports` page. No new Settings page.

**`Report` interface additions** (the TypeScript type in `reports-client.tsx`):
```ts
fix_file_path: string | null;
fix_status: "applied" | "pending" | "pending_review" | null;
```
These are returned by the existing `GET /api/recipe-reports` route once the Supabase columns exist.

**Additions:**

1. **"User Fix Attached" badge** on report cards where `fix_file_path` is present
2. **`FixPanel` — `faulty_image` with attached image:** thumbnail preview of the uploaded file; "Replace Image" action pre-wired to apply it in one click (no re-upload needed)
3. **`FixPanel` — `wrong_info` with attached `.txt`:** instructions textarea pre-filled with file contents, fetched from `pending-fixes/<recipeId>/description.txt` via a small GET call
4. **"User Submitted" filter pill** alongside existing type filters

The existing `apply-fix` route (`src/app/api/admin/apply-fix/route.ts`) handles all writes — no changes needed there.

---

## Data Flow Summary

```
User selects category
  → file input appears (faulty_image / wrong_info only)
  → user attaches file (optional)
  → FormData POST → /api/recipe-reports

Server:
  faulty_image + file  → save to public/recipe-images/<id>.jpg
                       → skip triggerImageFix()
                       → fix_status: "applied"
  faulty_image no file → triggerImageFix() as before
                       → fix_status: "pending"
  wrong_info + file    → save to pending-fixes/<id>/description.txt
                       → fix_status: "pending_review"

  → append recipe-fixes.json
  → upsert fixes/<id>.json
  → insert Supabase recipe_bug_reports (with fix_file_path, fix_status)

Admin at /reports:
  → sees "User Fix Attached" badge
  → one-click apply pre-populated from user file
  → existing apply-fix route writes to disk + Supabase
```

---

## Files Changed

| File | Change |
|---|---|
| `src/components/report-button.tsx` | Add `attachedFile` state, conditional file input, switch to FormData |
| `src/app/api/recipe-reports/route.ts` | Switch to formData(), file save logic, 3-layer persistence |
| `src/app/(app)/reports/reports-client.tsx` | Badge, pre-populated FixPanel, filter pill |
| `recipe-fixes.json` | Created at project root (append-only log) |
| `fixes/<recipeId>.json` | Created per recipe on first fix report |
| `pending-fixes/<recipeId>/description.txt` | Created when wrong_info + txt attached |
