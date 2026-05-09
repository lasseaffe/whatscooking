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
