"""
fix_reported_images.py — Fetch all faulty-image reports from the What's Cooking
API and re-extract a thumbnail for each recipe that has a source_url.

Run via fix_reported_images.bat, or directly:
    python scripts/ingestion/fix_reported_images.py [--cookies path/to/cookies.txt]
"""

import argparse
import json
import os
import subprocess
import sys
import urllib.request
from datetime import datetime
from pathlib import Path

SCRIPT_DIR = Path(__file__).parent
HERO_SHOT = SCRIPT_DIR / "hero_shot.py"
OUTPUT_DIR = Path(__file__).parent.parent.parent / "public" / "recipe-images"
LOG_FILE = Path(__file__).parent.parent.parent / "logs" / "image-fix.log"
API_BASE = os.environ.get("NEXT_PUBLIC_APP_URL", "http://localhost:3002")


def fetch_reports() -> list[dict]:
    url = f"{API_BASE}/api/recipe-reports"
    try:
        with urllib.request.urlopen(url, timeout=10) as resp:
            return json.loads(resp.read())
    except Exception as exc:
        sys.exit(f"Could not reach {url}\nIs the dev server running? ({exc})")


def log(msg: str) -> None:
    ts = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    line = f"[{ts}] {msg}"
    print(line)
    LOG_FILE.parent.mkdir(parents=True, exist_ok=True)
    with open(LOG_FILE, "a", encoding="utf-8") as f:
        f.write(line + "\n")


def fix_recipe(report: dict, cookies_file: str | None) -> bool:
    recipe_id = report.get("recipe_id") or report.get("recipeId", "unknown")
    source_url = report.get("source_url") or report.get("sourceUrl", "")

    if not source_url:
        log(f"SKIP  {recipe_id} — no source_url in report")
        return False

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    out_path = OUTPUT_DIR / f"{recipe_id}.jpg"

    cmd = [sys.executable, str(HERO_SHOT), source_url, "--out", str(out_path)]
    if cookies_file:
        cmd += ["--cookies", cookies_file]

    log(f"FIX   {recipe_id} ← {source_url}")
    result = subprocess.run(cmd, capture_output=True, text=True)

    if result.returncode == 0:
        log(f"OK    {recipe_id} → {out_path}")
        return True
    else:
        log(f"FAIL  {recipe_id} — {result.stderr.strip()}")
        return False


def main() -> None:
    parser = argparse.ArgumentParser(description="Fix all reported faulty recipe images.")
    parser.add_argument("--cookies", default=None, metavar="FILE",
                        help="Netscape cookies.txt for Instagram authentication")
    parser.add_argument("--dry-run", action="store_true",
                        help="Show what would be fixed without running hero_shot.py")
    args = parser.parse_args()

    log("=== fix_reported_images starting ===")
    reports = fetch_reports()

    faulty = [r for r in reports if r.get("issue_type") == "faulty_image"
              or r.get("issueType") == "faulty_image"]

    log(f"Found {len(reports)} total reports, {len(faulty)} faulty_image")

    if not faulty:
        log("Nothing to fix.")
        return

    ok, skipped, failed = 0, 0, 0
    for report in faulty:
        if args.dry_run:
            rid = report.get("recipe_id") or report.get("recipeId", "?")
            url = report.get("source_url") or report.get("sourceUrl", "(no url)")
            print(f"DRY   {rid} ← {url}")
            continue
        result = fix_recipe(report, args.cookies)
        if result is True:
            ok += 1
        elif result is False and (report.get("source_url") or report.get("sourceUrl")):
            failed += 1
        else:
            skipped += 1

    if not args.dry_run:
        log(f"=== Done: {ok} fixed, {skipped} skipped (no url), {failed} failed ===")


if __name__ == "__main__":
    main()
