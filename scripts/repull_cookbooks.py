"""Re-pull all cookbooks.com recipes using the new logic system.

Phases:
  1. Count cookbooks.com recipes
  2. Backup their (id, title, cuisine_type, dietary_tags) to JSON
  3. DELETE them from Supabase (--apply only)
  4. For each title, run scripts.ingestion.repull.repull_recipe()
  5. INSERT the new recipes back

Usage:
    python scripts/repull_cookbooks.py --dry-run --limit 3   # safe test
    python scripts/repull_cookbooks.py --dry-run             # show plan, no deletes/inserts
    python scripts/repull_cookbooks.py --apply               # actually delete + re-ingest
"""

import argparse
import json
import os
import sys
import time
from datetime import datetime
from typing import Optional

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace", line_buffering=True)
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8", errors="replace", line_buffering=True)

from dotenv import load_dotenv
from supabase import create_client

load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env.local"))
load_dotenv()

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "ingestion"))

from repull import repull_recipe, warm_up_ai  # noqa: E402

BACKUP_DIR = os.path.join(os.path.dirname(__file__), "..", ".repull-backups")


def _get_supabase():
    return create_client(
        os.environ["NEXT_PUBLIC_SUPABASE_URL"],
        os.environ["SUPABASE_SERVICE_ROLE_KEY"],
    )


def _fetch_cookbooks_recipes(supabase, limit: Optional[int]) -> list[dict]:
    """Page through all cookbooks.com recipes."""
    rows: list[dict] = []
    offset = 0
    page_size = 500
    while True:
        q = (
            supabase.table("recipes")
            .select("id, title, cuisine_type, dietary_tags")
            .ilike("source_url", "%cookbooks.com%")
            .range(offset, offset + page_size - 1)
        )
        batch = q.execute().data or []
        rows.extend(batch)
        if len(batch) < page_size:
            break
        offset += page_size
        if limit and len(rows) >= limit:
            return rows[:limit]
    return rows[:limit] if limit else rows


def _backup(rows: list[dict]) -> str:
    os.makedirs(BACKUP_DIR, exist_ok=True)
    ts = datetime.utcnow().strftime("%Y-%m-%dT%H-%M-%S")
    path = os.path.join(BACKUP_DIR, f"cookbooks-{ts}.json")
    with open(path, "w", encoding="utf-8") as f:
        json.dump(rows, f, ensure_ascii=False, indent=2)
    return path


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--apply", action="store_true", help="Actually delete + re-ingest. Default is dry-run.")
    ap.add_argument("--dry-run", action="store_true", help="Same as default (no DB writes).")
    ap.add_argument("--limit", type=int, default=None, help="Cap number of recipes processed.")
    args = ap.parse_args()

    dry = not args.apply
    print(f"Mode: {'DRY-RUN' if dry else 'APPLY'}")
    if args.limit:
        print(f"Limit: {args.limit}")

    sb = _get_supabase()

    # Phase 1: Count
    count = (
        sb.table("recipes")
        .select("id", count="exact")
        .ilike("source_url", "%cookbooks.com%")
        .execute()
        .count
    )
    print(f"\nPhase 1: {count} cookbooks.com recipes in DB")

    if count == 0:
        print("Nothing to do.")
        return

    # Phase 2: Backup
    print("\nPhase 2: Fetching titles + tags for backup...")
    rows = _fetch_cookbooks_recipes(sb, args.limit)
    print(f"  Fetched {len(rows)} recipes")
    backup_path = _backup(rows)
    print(f"  Backup saved -> {backup_path}")

    # Phase 3: Delete (apply mode only)
    if dry:
        print(f"\nPhase 3: [DRY] Would DELETE {len(rows)} cookbooks.com recipes")
    else:
        print(f"\nPhase 3: DELETE {len(rows)} cookbooks.com recipes...")
        ids = [r["id"] for r in rows]
        # Delete in chunks to avoid huge IN clauses
        for i in range(0, len(ids), 100):
            chunk = ids[i : i + 100]
            sb.table("recipes").delete().in_("id", chunk).execute()
        print("  Deleted.")

    # Phase 4 + 5: Re-pull + insert
    print(f"\nPhase 4/5: Re-pulling {len(rows)} recipes...")
    warm_up_ai()  # preload the AI model so the first recipe doesn't time out
    scraped, ai_gen, failed = 0, 0, 0
    for i, row in enumerate(rows, 1):
        title = row.get("title") or ""
        if not title.strip():
            failed += 1
            continue

        if i % 10 == 0 or i == 1:
            print(f"  ... {i}/{len(rows)} (scraped={scraped}, ai={ai_gen}, failed={failed})")

        try:
            new = repull_recipe(
                title=title,
                cuisine_hint=row.get("cuisine_type"),
                tags_hint=row.get("dietary_tags") or None,
            )
        except Exception as e:
            print(f"  EXC   {title}: {e}")
            failed += 1
            continue

        if not new:
            print(f"  FAIL  {title}")
            failed += 1
            continue

        if new.get("source") == "web-rescrape":
            scraped += 1
            tag = "SCRAPE"
        else:
            ai_gen += 1
            tag = "AIGEN "

        focal = f"focal=({new.get('focal_x', '?')}%,{new.get('focal_y', '?')}%)" if new.get("focal_x") else ""
        src_short = (new.get("source_url") or "")[:50]
        print(f"  {'DRY ' if dry else ''}{tag} {title} {focal} {src_short}")

        if not dry:
            try:
                sb.table("recipes").upsert(new, on_conflict="source_url").execute()
            except Exception as e:
                print(f"         -> insert error: {e}")
                failed += 1

        # Be polite to DDG between recipes
        time.sleep(1.0)

    print(f"\nDone. scraped={scraped}, ai-generated={ai_gen}, failed={failed}, total={len(rows)}")


if __name__ == "__main__":
    main()
