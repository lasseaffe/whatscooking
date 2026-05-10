# Fix Pipeline Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a complete fix pipeline for recipe reports: folder-based manual fix input, admin UI fix panel, NDJSON backups, and llama.cpp replacing Ollama to eliminate 300s timeouts.

**Architecture:** A `fixes/` folder acts as the input source for replacement images and instructions, synced via `queue.json`. A new API route `/api/admin/apply-fix` handles both UI uploads and folder-drop flow. `backup-reports.py` dumps all Supabase reports to NDJSON daily. llama.cpp runs as a persistent HTTP server on port 8080, replacing Ollama with no timeout cap.

**Tech Stack:** Next.js App Router, Python 3, Supabase Python client, llama.cpp server binary, NDJSON

---

## File Map

| Action | File | Responsibility |
|--------|------|----------------|
| CREATE | `fixes/images/.gitkeep` | Tracks empty folder in git |
| CREATE | `fixes/instructions/.gitkeep` | Tracks empty folder in git |
| CREATE | `fixes/queue.json` | Pending/done fix manifest |
| CREATE | `backups/.gitkeep` | Tracks empty folder in git |
| CREATE | `scripts/apply-fixes.py` | CLI batch runner: scan folder → apply to Supabase |
| CREATE | `scripts/backup-reports.py` | Dump recipe_bug_reports → NDJSON |
| CREATE | `src/app/api/admin/apply-fix/route.ts` | API: receive fix from UI, write file, update Supabase |
| CREATE | `supabase/migrations/20260509_report_resolution.sql` | Add resolved_at, resolved_by columns |
| MODIFY | `src/app/(app)/reports/reports-client.tsx` | Add per-report fix panel UI |
| MODIFY | `scripts/ingestion/enrich.py` | Point to llama.cpp on port 8080 |
| MODIFY | `scripts/ingestion/llama_scraper.py` | Point to llama.cpp HTTP endpoint |

---

## Task 1: Scaffold folders and queue.json

**Files:**
- Create: `fixes/images/.gitkeep`
- Create: `fixes/instructions/.gitkeep`
- Create: `fixes/queue.json`
- Create: `backups/.gitkeep`

- [ ] **Step 1: Create folder structure**

In PowerShell from the project root (`C:\Users\lasse\Desktop\whatscooking`):

```powershell
New-Item -ItemType Directory -Force fixes/images, fixes/instructions, backups
New-Item -ItemType File -Force fixes/images/.gitkeep, fixes/instructions/.gitkeep, backups/.gitkeep
```

- [ ] **Step 2: Write queue.json**

Create `fixes/queue.json` with content:
```json
[]
```

- [ ] **Step 3: Commit**

```powershell
git add fixes/ backups/
git commit -m "feat: scaffold fixes/ and backups/ folders with queue.json"
```

---

## Task 2: Database migration — add resolution columns

**Files:**
- Create: `supabase/migrations/20260509_report_resolution.sql`

- [ ] **Step 1: Write migration file**

Create `supabase/migrations/20260509_report_resolution.sql`:

```sql
ALTER TABLE recipe_bug_reports
  ADD COLUMN IF NOT EXISTS resolved_at timestamptz,
  ADD COLUMN IF NOT EXISTS resolved_by text;
```

- [ ] **Step 2: Apply migration**

Run in Supabase SQL editor (dashboard → SQL editor → paste and run), OR via CLI:

```powershell
# If supabase CLI is installed:
npx supabase db push
```

- [ ] **Step 3: Verify**

In Supabase dashboard, open Table Editor → `recipe_bug_reports` → confirm `resolved_at` and `resolved_by` columns exist.

- [ ] **Step 4: Commit**

```powershell
git add supabase/migrations/20260509_report_resolution.sql
git commit -m "feat: add resolved_at and resolved_by to recipe_bug_reports"
```

---

## Task 3: backup-reports.py

**Files:**
- Create: `scripts/backup-reports.py`

- [ ] **Step 1: Write the script**

Create `scripts/backup-reports.py`:

```python
"""
backup-reports.py — Export all recipe_bug_reports rows to NDJSON.

Usage:
    python scripts/backup-reports.py

Output: backups/reports-YYYY-MM-DD.ndjson (deduplicates on re-run)
"""

import json
import os
import sys
from datetime import date
from pathlib import Path

from dotenv import load_dotenv

load_dotenv(Path(__file__).parent.parent / ".env.local")

from supabase import create_client

SUPABASE_URL = os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    print("[ERROR] Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local")
    sys.exit(1)

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

def fetch_all_reports() -> list[dict]:
    rows = []
    page = 0
    page_size = 1000
    while True:
        result = (
            supabase.table("recipe_bug_reports")
            .select("*")
            .range(page * page_size, (page + 1) * page_size - 1)
            .execute()
        )
        batch = result.data or []
        rows.extend(batch)
        if len(batch) < page_size:
            break
        page += 1
    return rows

def main():
    backups_dir = Path(__file__).parent.parent / "backups"
    backups_dir.mkdir(exist_ok=True)

    today = date.today().isoformat()
    output_path = backups_dir / f"reports-{today}.ndjson"

    print(f"[INFO] Fetching all reports from Supabase...")
    fresh_rows = fetch_all_reports()
    print(f"[INFO] Fetched {len(fresh_rows)} rows")

    existing: dict[str, dict] = {}
    if output_path.exists():
        for line in output_path.read_text(encoding="utf-8").splitlines():
            line = line.strip()
            if line:
                row = json.loads(line)
                existing[row["id"]] = row

    for row in fresh_rows:
        existing[row["id"]] = row

    with output_path.open("w", encoding="utf-8") as f:
        for row in existing.values():
            f.write(json.dumps(row, ensure_ascii=False) + "\n")

    print(f"[OK] Written {len(existing)} records to {output_path}")

if __name__ == "__main__":
    main()
```

- [ ] **Step 2: Test it**

```powershell
cd C:\Users\lasse\Desktop\whatscooking
python scripts/backup-reports.py
```

Expected output:
```
[INFO] Fetching all reports from Supabase...
[INFO] Fetched N rows
[OK] Written N records to backups/reports-2026-05-09.ndjson
```

Open `backups/reports-2026-05-09.ndjson` and confirm each line is valid JSON with an `id` field.

- [ ] **Step 3: Run a second time to verify deduplication**

```powershell
python scripts/backup-reports.py
```

File should have the same number of lines (not doubled).

- [ ] **Step 4: Commit**

```powershell
git add scripts/backup-reports.py
git commit -m "feat: add backup-reports.py for NDJSON export of recipe_bug_reports"
```

---

## Task 4: apply-fixes.py

**Files:**
- Create: `scripts/apply-fixes.py`

- [ ] **Step 1: Write the script**

Create `scripts/apply-fixes.py`:

```python
"""
apply-fixes.py — Apply manually-supplied replacement images and instructions to Supabase.

Usage:
    # Scan fixes/ folder and apply all pending:
    python scripts/apply-fixes.py

    # Populate queue.json from a backup file (does NOT auto-apply):
    python scripts/apply-fixes.py --from-backup backups/reports-2026-05-09.ndjson

Drop replacement files as:
    fixes/images/{recipeId}.jpg   (or .png, .webp)
    fixes/instructions/{recipeId}.txt
"""

import argparse
import base64
import json
import os
import sys
from datetime import datetime, timezone
from pathlib import Path

from dotenv import load_dotenv

ROOT = Path(__file__).parent.parent
load_dotenv(ROOT / ".env.local")

from supabase import create_client

SUPABASE_URL = os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
APP_URL = os.environ.get("NEXT_PUBLIC_APP_URL", "http://localhost:3000")

if not SUPABASE_URL or not SUPABASE_KEY:
    print("[ERROR] Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local")
    sys.exit(1)

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

QUEUE_PATH = ROOT / "fixes" / "queue.json"
IMAGES_DIR = ROOT / "fixes" / "images"
INSTRUCTIONS_DIR = ROOT / "fixes" / "instructions"
IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}


def load_queue() -> list[dict]:
    if not QUEUE_PATH.exists():
        return []
    return json.loads(QUEUE_PATH.read_text(encoding="utf-8"))


def save_queue(queue: list[dict]) -> None:
    QUEUE_PATH.write_text(json.dumps(queue, indent=2, ensure_ascii=False), encoding="utf-8")


def scan_folder_into_queue(queue: list[dict]) -> list[dict]:
    done_keys = {(e["recipeId"], e["type"]) for e in queue if e["status"] == "done"}
    existing_keys = {(e["recipeId"], e["type"]) for e in queue}

    for img_file in IMAGES_DIR.iterdir():
        if img_file.suffix.lower() in IMAGE_EXTENSIONS:
            key = (img_file.stem, "image")
            if key not in existing_keys:
                queue.append({
                    "recipeId": img_file.stem,
                    "type": "image",
                    "path": str(img_file.relative_to(ROOT)),
                    "status": "pending",
                    "addedAt": datetime.now(timezone.utc).isoformat(),
                })

    for txt_file in INSTRUCTIONS_DIR.iterdir():
        if txt_file.suffix.lower() == ".txt":
            key = (txt_file.stem, "instructions")
            if key not in existing_keys:
                queue.append({
                    "recipeId": txt_file.stem,
                    "type": "instructions",
                    "path": str(txt_file.relative_to(ROOT)),
                    "status": "pending",
                    "addedAt": datetime.now(timezone.utc).isoformat(),
                })

    return queue


def apply_image_fix(recipe_id: str, file_path: Path) -> bool:
    bucket = "recipe-images"
    storage_path = f"{recipe_id}.jpg"
    with file_path.open("rb") as f:
        data = f.read()
    try:
        supabase.storage.from_(bucket).upload(
            storage_path, data,
            file_options={"content-type": "image/jpeg", "upsert": "true"}
        )
        public_url = supabase.storage.from_(bucket).get_public_url(storage_path)
        supabase.table("recipes").update({"image_url": public_url}).eq("id", recipe_id).execute()
        return True
    except Exception as e:
        print(f"  [WARN] Storage upload failed, falling back to direct URL: {e}")
        # Fallback: store local public path
        dest = ROOT / "public" / "recipe-images" / f"{recipe_id}.jpg"
        dest.parent.mkdir(parents=True, exist_ok=True)
        dest.write_bytes(data)
        public_url = f"/recipe-images/{recipe_id}.jpg"
        supabase.table("recipes").update({"image_url": public_url}).eq("id", recipe_id).execute()
        return True


def apply_instructions_fix(recipe_id: str, file_path: Path) -> bool:
    text = file_path.read_text(encoding="utf-8").strip()
    instructions = [line.strip() for line in text.splitlines() if line.strip()]
    supabase.table("recipes").update({"instructions": instructions}).eq("id", recipe_id).execute()
    return True


def resolve_report(recipe_id: str) -> None:
    supabase.table("recipe_bug_reports").update({
        "resolved_at": datetime.now(timezone.utc).isoformat(),
        "resolved_by": "apply-fixes-script",
    }).eq("recipe_id", recipe_id).is_("resolved_at", "null").execute()


def load_from_backup(backup_path: Path, queue: list[dict]) -> list[dict]:
    if not backup_path.exists():
        print(f"[ERROR] Backup file not found: {backup_path}")
        sys.exit(1)

    existing_keys = {(e["recipeId"], e["type"]) for e in queue}
    added = 0

    for line in backup_path.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line:
            continue
        row = json.loads(line)
        if row.get("resolved_at"):
            continue
        recipe_id = row.get("recipe_id")
        issue_type = row.get("issue_type")
        if not recipe_id:
            continue
        fix_type = "image" if issue_type == "faulty_image" else "instructions" if "instruction" in (issue_type or "") else None
        if not fix_type:
            continue
        key = (recipe_id, fix_type)
        if key not in existing_keys:
            queue.append({
                "recipeId": recipe_id,
                "type": fix_type,
                "path": None,
                "status": "pending",
                "addedAt": datetime.now(timezone.utc).isoformat(),
                "fromBackup": str(backup_path.name),
            })
            existing_keys.add(key)
            added += 1

    print(f"[INFO] Added {added} entries from backup (drop replacement files then re-run without --from-backup)")
    return queue


def main():
    parser = argparse.ArgumentParser(description="Apply manual recipe fixes to Supabase")
    parser.add_argument("--from-backup", metavar="PATH", help="Populate queue from a backup NDJSON file")
    args = parser.parse_args()

    queue = load_queue()

    if args.from_backup:
        queue = load_from_backup(Path(args.from_backup), queue)
        save_queue(queue)
        return

    queue = scan_folder_into_queue(queue)
    save_queue(queue)

    pending = [e for e in queue if e["status"] == "pending"]
    print(f"[INFO] {len(pending)} pending fix(es)")

    applied = skipped = errors = 0

    for entry in pending:
        recipe_id = entry["recipeId"]
        fix_type = entry["type"]
        file_path = ROOT / entry["path"] if entry.get("path") else None

        if not file_path or not file_path.exists():
            print(f"  [SKIP] {recipe_id} ({fix_type}) — file not found: {entry.get('path')}")
            skipped += 1
            continue

        print(f"  [APPLY] {recipe_id} ({fix_type}) ← {file_path.name}")
        try:
            if fix_type == "image":
                ok = apply_image_fix(recipe_id, file_path)
            else:
                ok = apply_instructions_fix(recipe_id, file_path)

            if ok:
                resolve_report(recipe_id)
                entry["status"] = "done"
                entry["appliedAt"] = datetime.now(timezone.utc).isoformat()
                applied += 1
            else:
                errors += 1
        except Exception as e:
            print(f"  [ERROR] {recipe_id}: {e}")
            errors += 1

    save_queue(queue)
    print(f"\n[DONE] Applied: {applied}  Skipped: {skipped}  Errors: {errors}")


if __name__ == "__main__":
    main()
```

- [ ] **Step 2: Test folder scan with a dummy file**

```powershell
# Copy any .jpg into fixes/images/ named after a real recipe ID from your DB
# Then:
python scripts/apply-fixes.py
```

Expected:
```
[INFO] 1 pending fix(es)
  [APPLY] <recipeId> (image) ← <recipeId>.jpg
[DONE] Applied: 1  Skipped: 0  Errors: 0
```

Check `fixes/queue.json` — entry should show `"status": "done"`.
Check Supabase `recipes` table — `image_url` should be updated.

- [ ] **Step 3: Test --from-backup**

```powershell
python scripts/apply-fixes.py --from-backup backups/reports-2026-05-09.ndjson
```

Expected: prints "Added N entries from backup", `queue.json` updated with pending entries (no files applied yet).

- [ ] **Step 4: Commit**

```powershell
git add scripts/apply-fixes.py
git commit -m "feat: add apply-fixes.py CLI batch runner"
```

---

## Task 5: API route — /api/admin/apply-fix

**Files:**
- Create: `src/app/api/admin/apply-fix/route.ts`

- [ ] **Step 1: Write the route**

Create `src/app/api/admin/apply-fix/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { writeFile, mkdir, readFile } from "fs/promises";
import { existsSync } from "fs";
import path from "path";

const MONITOR_SECRET = process.env.MONITOR_SECRET ?? "";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface QueueEntry {
  recipeId: string;
  type: "image" | "instructions";
  path: string;
  status: "pending" | "done";
  addedAt: string;
  appliedAt?: string;
}

const QUEUE_PATH = path.join(process.cwd(), "fixes", "queue.json");

async function readQueue(): Promise<QueueEntry[]> {
  try {
    const raw = await readFile(QUEUE_PATH, "utf-8");
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

async function writeQueue(queue: QueueEntry[]): Promise<void> {
  await writeFile(QUEUE_PATH, JSON.stringify(queue, null, 2), "utf-8");
}

export async function POST(req: NextRequest) {
  const auth = req.headers.get("authorization") ?? "";
  if (MONITOR_SECRET && auth !== `Bearer ${MONITOR_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { recipeId, reportId, type, content } = body as {
    recipeId: string;
    reportId?: string;
    type: "image" | "instructions";
    content: string;
  };

  if (!recipeId || !type || !content) {
    return NextResponse.json({ error: "Missing recipeId, type, or content" }, { status: 400 });
  }

  const fixesDir = path.join(process.cwd(), "fixes");
  const subDir = type === "image" ? "images" : "instructions";
  const ext = type === "image" ? ".jpg" : ".txt";
  const fileName = `${recipeId}${ext}`;
  const filePath = path.join(fixesDir, subDir, fileName);

  await mkdir(path.join(fixesDir, subDir), { recursive: true });

  // Write file to fixes folder
  const fileData =
    type === "image"
      ? Buffer.from(content.replace(/^data:[^;]+;base64,/, ""), "base64")
      : Buffer.from(content, "utf-8");

  await writeFile(filePath, fileData);

  // Update Supabase recipes table
  const now = new Date().toISOString();
  if (type === "image") {
    const publicPath = `/recipe-images/${recipeId}.jpg`;
    const destDir = path.join(process.cwd(), "public", "recipe-images");
    await mkdir(destDir, { recursive: true });
    await writeFile(path.join(destDir, `${recipeId}.jpg`), fileData);
    await supabase.from("recipes").update({ image_url: publicPath }).eq("id", recipeId);
  } else {
    const instructions = content
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);
    await supabase.from("recipes").update({ instructions }).eq("id", recipeId);
  }

  // Resolve the bug report
  if (reportId) {
    await supabase
      .from("recipe_bug_reports")
      .update({ resolved_at: now, resolved_by: "admin-ui" })
      .eq("id", reportId);
  }

  // Update queue.json
  const queue = await readQueue();
  const relativePath = path.join("fixes", subDir, fileName);
  const existing = queue.find((e) => e.recipeId === recipeId && e.type === type);
  if (existing) {
    existing.status = "done";
    existing.appliedAt = now;
  } else {
    queue.push({
      recipeId,
      type,
      path: relativePath,
      status: "done",
      addedAt: now,
      appliedAt: now,
    });
  }
  await writeQueue(queue);

  return NextResponse.json({ ok: true, filePath: relativePath });
}
```

- [ ] **Step 2: Test the route manually**

With the dev server running (`npm run dev`), run in PowerShell:

```powershell
$body = @{
  recipeId = "test-recipe-id"
  type = "instructions"
  content = "Step 1: Cook pasta.`nStep 2: Add sauce."
} | ConvertTo-Json

Invoke-WebRequest -Uri "http://localhost:3000/api/admin/apply-fix" `
  -Method POST `
  -Headers @{ "Content-Type" = "application/json"; "Authorization" = "Bearer $env:MONITOR_SECRET" } `
  -Body $body
```

Expected: `{"ok":true,"filePath":"fixes/instructions/test-recipe-id.txt"}`

Check `fixes/instructions/test-recipe-id.txt` exists with the content.

- [ ] **Step 3: Commit**

```powershell
git add src/app/api/admin/apply-fix/route.ts
git commit -m "feat: add /api/admin/apply-fix route"
```

---

## Task 6: Admin UI — Fix panel in reports-client.tsx

**Files:**
- Modify: `src/app/(app)/reports/reports-client.tsx`

- [ ] **Step 1: Update the Report interface and add state**

In `src/app/(app)/reports/reports-client.tsx`, replace the existing `Report` interface and `ReportsClient` function opening:

```typescript
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
}
```

- [ ] **Step 2: Add the FixPanel component**

Add this component above `ReportsClient` (after the existing constants):

```typescript
function FixPanel({ report, onResolved }: { report: Report; onResolved: (id: string) => void }) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"image" | "instructions">("image");
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const isImage = report.issue_type === "faulty_image";

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

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
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
            <label className="block cursor-pointer">
              <span className="text-xs" style={{ color: "#8A6A4A" }}>Upload replacement image (.jpg / .png)</span>
              <input type="file" accept="image/*" onChange={handleImageUpload} disabled={busy} className="mt-1 block text-xs w-full" />
            </label>
          ) : (
            <div>
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

- [ ] **Step 3: Wire onResolved into ReportsClient**

In the `ReportsClient` function, add resolved tracking state after the existing `filterType` state:

```typescript
const [resolvedIds, setResolvedIds] = useState<Set<string>>(new Set());

function handleResolved(id: string) {
  setResolvedIds((prev) => new Set([...prev, id]));
}
```

- [ ] **Step 4: Add FixPanel to each report card**

Inside the report card `div` (after the `source_url` block, before the closing `</div>`), add:

```typescript
<div className="mt-3 flex items-center justify-between">
  <FixPanel
    report={{ ...r, resolved_at: resolvedIds.has(r.id) ? new Date().toISOString() : r.resolved_at ?? null, resolved_by: r.resolved_by ?? null }}
    onResolved={handleResolved}
  />
</div>
```

- [ ] **Step 5: Start dev server and verify**

```powershell
npm run dev
```

Open `http://localhost:3000/reports`. Each report card should have a "Fix" button. Click it — image upload and instructions textarea should appear. Upload a test image and confirm the file appears in `fixes/images/` and Supabase is updated.

- [ ] **Step 6: Commit**

```powershell
git add src/app/(app)/reports/reports-client.tsx
git commit -m "feat: add FixPanel to reports UI — image upload and instructions editor"
```

---

## Task 7: Switch enrich.py and llama_scraper.py to llama.cpp

**Files:**
- Modify: `scripts/ingestion/enrich.py` lines 14–16
- Modify: `scripts/ingestion/llama_scraper.py` — replace `ollama.chat` with HTTP call

**Note:** llama.cpp server must be downloaded and started first (one-time setup — see below).

- [ ] **Step 1: Download llama.cpp (one-time)**

Go to: `https://github.com/ggerganov/llama.cpp/releases/latest`

Download the Windows pre-built binary: `llama-<version>-bin-win-noavx-x64.zip` (or the AVX2 variant if your CPU supports it — check with `wmic cpu get caption` in PowerShell).

Extract to `C:\Users\lasse\llama.cpp\` (or any permanent location).

- [ ] **Step 2: Export Ollama model to GGUF (one-time)**

```powershell
# Create models folder in project
mkdir C:\Users\lasse\Desktop\whatscooking\models

# Export from Ollama cache — finds the model blob and copies it
# Ollama stores models at %LOCALAPPDATA%\Ollama\models\blobs
# Easiest: use ollama show to find path, then copy
ollama show --modelfile llama3.2:1b
```

Alternatively, download a pre-quantized GGUF directly from HuggingFace (search "llama-3.2-1b GGUF Q4_K_M"). Place the `.gguf` file in `models/`.

- [ ] **Step 3: Start llama.cpp server (do this before running scripts)**

```powershell
# Adjust path to your llama-server.exe and model file
C:\Users\lasse\llama.cpp\llama-server.exe `
  -m C:\Users\lasse\Desktop\whatscooking\models\llama-3.2-1b-q4_k_m.gguf `
  --host 0.0.0.0 --port 8080 -n -1 --threads 4 --ctx-size 2048
```

Leave this window open. The server is ready when you see: `llama server listening`.

- [ ] **Step 4: Update enrich.py**

In `scripts/ingestion/enrich.py`, replace lines 14–16:

```python
# Before:
OLLAMA_URL = "http://localhost:11434/v1/chat/completions"
AI_MODEL   = "llama3.2:1b"
```

```python
# After:
LLAMA_CPP_URL = "http://localhost:8080/v1/chat/completions"
AI_MODEL = "llama-3.2-1b"  # label only; llama.cpp uses whatever model is loaded
```

Also update `_call_ollama` → rename to `_call_llm` and change the URL reference:

```python
def _call_llm(prompt: str) -> str:
    payload = json.dumps({
        "model": AI_MODEL,
        "stream": False,
        "messages": [{"role": "user", "content": prompt}],
        "max_tokens": 300,
    }).encode()

    req = urllib.request.Request(
        LLAMA_CPP_URL,
        data=payload,
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    with urllib.request.urlopen(req) as resp:  # no timeout= — let it run
        data = json.loads(resp.read())
    return (data.get("choices", [{}])[0].get("message", {}).get("content") or "").strip()
```

Update `_is_ollama_available` → rename to `_is_llm_available`:

```python
def _is_llm_available() -> bool:
    try:
        urllib.request.urlopen("http://localhost:8080/health", timeout=3)
        return True
    except urllib.error.URLError:
        return False
```

Update `enrich_recipe` to call the renamed functions:

```python
def enrich_recipe(recipe: dict) -> dict:
    if not _is_llm_available():
        return recipe
    # ... rest unchanged, but replace _call_ollama with _call_llm
```

- [ ] **Step 5: Update llama_scraper.py**

`llama_scraper.py` uses the `ollama` Python library directly. Replace the `generate_recipe` function's LLM call with an HTTP call to llama.cpp:

Add to imports at the top (remove `import ollama`):
```python
import urllib.request
import urllib.error
```

Add constant after imports:
```python
LLAMA_CPP_URL = "http://localhost:8080/v1/chat/completions"
```

Replace the `generate_recipe` function body's try block:

```python
def generate_recipe(dish_name: str, model: str) -> dict | None:
    prompt = PROMPT_TEMPLATE.format(dish_name=dish_name)
    payload = json.dumps({
        "model": model,
        "stream": False,
        "messages": [{"role": "user", "content": prompt}],
        "max_tokens": 600,
    }).encode()
    req = urllib.request.Request(
        LLAMA_CPP_URL,
        data=payload,
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    try:
        with urllib.request.urlopen(req) as resp:  # no timeout — let it run
            data = json.loads(resp.read())
        raw = data["choices"][0]["message"]["content"]
    except Exception as e:
        print(f"[ERROR] llama.cpp call failed for '{dish_name}': {e}")
        return None

    clean = strip_fences(raw)
    try:
        data = json.loads(clean)
    except json.JSONDecodeError as e:
        print(f"[ERROR] JSON parse failed for '{dish_name}': {e}")
        print(f"  Raw response: {raw[:300]}")
        return None

    recipe = normalize_recipe_scraper(
        title=data.get("title", dish_name),
        ingredients=data.get("ingredients", []),
        instructions=data.get("instructions", []),
        image=None,
        total_time=data.get("cook_time_minutes"),
        yields=str(data.get("servings")) if data.get("servings") is not None else None,
        cuisine=data.get("cuisine_type"),
        source_url=None,
        category="ai-generated",
        cuisine_type=data.get("cuisine_type"),
    )
    recipe["source"] = "ai-generated"
    recipe["source_url"] = None
    return recipe
```

- [ ] **Step 6: Test enrich.py with llama.cpp running**

```powershell
cd C:\Users\lasse\Desktop\whatscooking
python -c "
from scripts.ingestion.enrich import enrich_recipe
result = enrich_recipe({'title': 'Spaghetti Carbonara', 'ingredients': [{'name': 'pasta'}, {'name': 'eggs'}, {'name': 'pancetta'}]})
print(result.get('description'))
"
```

Expected: a 2-3 sentence description printed (no timeout error).

- [ ] **Step 7: Commit**

```powershell
git add scripts/ingestion/enrich.py scripts/ingestion/llama_scraper.py
git commit -m "feat: switch enrich.py and llama_scraper.py to llama.cpp (no timeout)"
```

---

## Verification Checklist

- [ ] Drop `{realRecipeId}.jpg` in `fixes/images/`, run `python scripts/apply-fixes.py` — Supabase `image_url` updated, `queue.json` shows `done`
- [ ] Run `python scripts/backup-reports.py` twice — same line count both times, valid NDJSON
- [ ] Run `python scripts/apply-fixes.py --from-backup backups/reports-2026-05-09.ndjson` — pending entries appear in `queue.json`
- [ ] Open `/reports` in browser — each report has a "Fix" button
- [ ] Upload a replacement image via UI — file appears in `fixes/images/`, Supabase updated, report shows "Resolved"
- [ ] With llama.cpp server running, run `enrich.py` on a slow recipe — completes without timeout
