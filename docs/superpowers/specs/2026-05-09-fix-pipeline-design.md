# Fix Pipeline Design
_Date: 2026-05-09_

## Context

What's Cooking has a report mechanism (`recipe_bug_reports` in Supabase + `ReportButton` component) but no complete workflow for actually resolving those reports. The gap is:

1. No manual fix input channel (admin needs to supply replacement images/instructions)
2. No durable local backup of reports
3. Local LLM scripts (Ollama) time out at 300s on slow hardware

This spec designs a complete pipeline: folder-based fix input, admin UI fix panel, llama.cpp as a persistent local LLM, and NDJSON backups.

---

## Folder Structure

```
whatscooking/
├── fixes/
│   ├── images/          # drop {recipeId}.jpg/.png here to replace image
│   ├── instructions/    # drop {recipeId}.txt here to replace instructions
│   └── queue.json       # auto-managed manifest of pending/done fixes
├── backups/
│   └── reports-YYYY-MM-DD.ndjson
└── scripts/
    ├── apply-fixes.py
    └── backup-reports.py
```

### queue.json schema
```json
[
  {
    "recipeId": "abc123",
    "type": "image",
    "path": "fixes/images/abc123.jpg",
    "status": "pending",
    "addedAt": "2026-05-09T10:00:00Z"
  }
]
```

`apply-fixes.py` is the authority: it scans the folder, syncs `queue.json`, applies changes to Supabase, then marks entries `done`.

---

## llama.cpp (Replaces Ollama)

**Why:** Ollama enforces a 300s request timeout. llama.cpp's server has no such limit — it runs until the generation finishes, regardless of hardware speed.

**Setup:**
```bash
# Download pre-built binary from https://github.com/ggerganov/llama.cpp/releases
# Export existing Ollama model to GGUF (one-time):
ollama export llama3.2:1b > models/llama-3.2-1b.gguf

# Start persistent server:
llama-server.exe -m models/llama-3.2-1b.gguf --host 0.0.0.0 --port 8080 -n -1 --threads 4
```

**Code change:** In `enrich.py` and `llama_scraper.py`, change base URL:
```python
# Before:
base_url = "http://localhost:11434/v1"
# After:
base_url = "http://localhost:8080/v1"
```

The OpenAI-compatible `/v1/chat/completions` endpoint is identical — no other code changes needed.

**Flags:**
- `-n -1` — unlimited generation length
- `--threads 4` — tune to leave headroom for other apps
- `--ctx-size 2048` — keep low on slow hardware to reduce memory pressure

---

## Admin UI — Manual Fix Panel

**Location:** Extend existing `src/app/(app)/reports/reports-client.tsx`

**Per-report, new actions:**
- **Replace image**: file upload input → `POST /api/admin/apply-fix` with base64 image
- **Replace instructions**: textarea → `POST /api/admin/apply-fix` with text content
- **Mark resolved**: closes report without content change

**New API route:** `src/app/api/admin/apply-fix/route.ts`

```
POST /api/admin/apply-fix
Authorization: Bearer {MONITOR_SECRET}

Body:
{
  "recipeId": "abc123",
  "reportId": "rep456",
  "type": "image" | "instructions",
  "content": "<base64 string or plain text>"
}

Response:
{
  "ok": true,
  "filePath": "fixes/images/abc123.jpg"
}
```

**What the route does:**
1. Decode content, write to `fixes/{type}s/{recipeId}.{ext}`
2. Update Supabase `recipes` table (`image_url` or `instructions`)
3. Set `recipe_bug_reports.resolved_at = now()`, `resolved_by = "admin-ui"`
4. Append entry to `queue.json` with `status: "done"`

---

## apply-fixes.py (CLI batch runner)

```bash
# Apply all pending files in fixes/ folder:
python scripts/apply-fixes.py

# Apply from a backup file (reprocess old reports):
python scripts/apply-fixes.py --from-backup backups/reports-2026-05-09.ndjson
```

**Logic:**
1. Scan `fixes/images/` and `fixes/instructions/` for files
2. Match filename stem to `recipeId`
3. Sync `queue.json` (add new, skip already-done)
4. For each pending entry: upload file to Supabase Storage OR update `image_url` directly, update recipe row
5. Mark entry `done` in `queue.json`
6. Print summary: N applied, N skipped, N errors

**`--from-backup` mode:**
- Reads NDJSON file
- Filters rows where `resolved_at IS NULL`
- Adds matching `recipeId` entries to `queue.json` as pending
- Does NOT auto-apply — user still drops replacement files, then runs without the flag

---

## backup-reports.py

```bash
python scripts/backup-reports.py
```

**Logic:**
1. Fetch all rows from `recipe_bug_reports` via Supabase Python client
2. Load existing backup file for today if it exists
3. Deduplicate by `id`
4. Write/append to `backups/reports-YYYY-MM-DD.ndjson`

Safe to run repeatedly. Each line is a complete JSON object.

---

## Database Migration

Add two columns to `recipe_bug_reports`:

```sql
ALTER TABLE recipe_bug_reports
  ADD COLUMN IF NOT EXISTS resolved_at timestamptz,
  ADD COLUMN IF NOT EXISTS resolved_by text;
```

---

## Files to Create/Modify

| Action | File |
|--------|------|
| CREATE | `fixes/images/.gitkeep` |
| CREATE | `fixes/instructions/.gitkeep` |
| CREATE | `fixes/queue.json` (empty array `[]`) |
| CREATE | `backups/.gitkeep` |
| CREATE | `scripts/apply-fixes.py` |
| CREATE | `scripts/backup-reports.py` |
| CREATE | `src/app/api/admin/apply-fix/route.ts` |
| MODIFY | `src/app/(app)/reports/reports-client.tsx` — add fix panel UI |
| MODIFY | `scripts/ingestion/enrich.py` — change base URL to port 8080 |
| MODIFY | `scripts/ingestion/llama_scraper.py` — change base URL to port 8080 |
| MODIFY | `supabase/` — migration for resolved_at / resolved_by |

---

## Verification

1. **Folder flow**: Drop a test `.jpg` named after a real recipe ID into `fixes/images/`, run `apply-fixes.py`, confirm `image_url` updated in Supabase and `queue.json` shows `done`
2. **Admin UI flow**: Open `/reports`, find a faulty_image report, upload a replacement, confirm file appears in `fixes/images/` and Supabase updated
3. **llama.cpp**: Start server, run `enrich.py` on a recipe that previously timed out, confirm it completes
4. **Backup**: Run `backup-reports.py`, open NDJSON file, confirm all report rows present
5. **Restore flow**: Run `apply-fixes.py --from-backup`, confirm unresolved reports added to `queue.json` as pending
