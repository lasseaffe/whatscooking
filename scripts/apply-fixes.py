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
