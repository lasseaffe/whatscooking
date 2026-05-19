"""Bulk recipe image fixer.

Pass 1 - re-scrape recipes with broken/missing images using Playwright.
Pass 2 - detect and store focal points for all recipes still at the (50, 50) sentinel.

Usage:
    python scripts/fix_images_bulk.py --dry-run
    python scripts/fix_images_bulk.py --pass1-only --limit 20
    python scripts/fix_images_bulk.py --pass2-only --limit 100
    python scripts/fix_images_bulk.py  # both passes, no limit
"""

import argparse
import os
import sys
from typing import Optional

# Force UTF-8 stdout so recipe titles with non-cp1252 characters don't crash the run.
# Also force line-buffering so progress appears in real time when run in the background
# (Python defaults to block-buffering when stdout is not a terminal).
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace", line_buffering=True)
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8", errors="replace", line_buffering=True)

import requests
from dotenv import load_dotenv
from supabase import create_client

load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env.local"))
load_dotenv()

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "ingestion"))

from focal_point import detect_focal_point as _detect_focal_point  # noqa: E402

# Sentinel returned by focal_point.py on any error
_FOCAL_FALLBACK = (50, 60)

# Set later from --provider arg; None = use focal_point.py's env/default
_PROVIDER: Optional[str] = None


def detect_focal_point(image_url: str) -> tuple[int, int]:
    return _detect_focal_point(image_url, provider=_PROVIDER)


# -- Helpers (self-contained, don't depend on scrape.py) -----------

def _image_is_valid(url: Optional[str]) -> bool:
    """Returns True iff url is non-empty and returns HTTP 200."""
    if not url:
        return False
    try:
        resp = requests.head(
            url, timeout=5, allow_redirects=True,
            headers={"User-Agent": "Mozilla/5.0"},
        )
        return resp.status_code == 200
    except Exception:
        return False


def _normalize_url(url: str) -> str:
    """Prepend https:// to scheme-less URLs (e.g. 'www.example.com/recipe')."""
    url = url.strip()
    if url and not url.startswith(("http://", "https://")):
        return "https://" + url
    return url


def _fetch_image_with_page(page, source_url: str) -> Optional[str]:
    """Use an existing Playwright page to fetch the best image from source_url."""
    source_url = _normalize_url(source_url)
    try:
        page.goto(source_url, timeout=15000, wait_until="domcontentloaded")

        og = page.query_selector('meta[property="og:image"]')
        if og:
            content = og.get_attribute("content")
            if content and _image_is_valid(content):
                return content

        imgs = page.query_selector_all(
            "article img, main img, .recipe img, [class*='recipe'] img"
        )
        best_url: Optional[str] = None
        best_area = 0
        for img in imgs:
            src = img.get_attribute("src") or img.get_attribute("data-src") or ""
            if not src or src.startswith("data:"):
                continue
            try:
                w = int(img.get_attribute("width") or "0")
                h = int(img.get_attribute("height") or "0")
                area = w * h
            except (ValueError, TypeError):
                area = 1
            if area >= best_area:
                best_url, best_area = src, area
        return best_url if best_url and _image_is_valid(best_url) else None
    except Exception as e:
        print(f"[playwright] failed for {source_url}: {e}")
        return None


# Backwards-compatible single-shot helper (launches its own browser).
def _fetch_image_playwright(source_url: str) -> Optional[str]:
    try:
        from playwright.sync_api import sync_playwright
        with sync_playwright() as p:
            browser = p.chromium.launch(headless=True)
            try:
                return _fetch_image_with_page(browser.new_page(), source_url)
            finally:
                browser.close()
    except ImportError:
        print("[playwright] not installed - run: pip install playwright && playwright install chromium")
        return None
    except Exception as e:
        print(f"[playwright] failed for {source_url}: {e}")
        return None


# -- Supabase ------------------------------------------------------

def _get_supabase():
    url = os.environ["NEXT_PUBLIC_SUPABASE_URL"]
    key = os.environ["SUPABASE_SERVICE_ROLE_KEY"]
    return create_client(url, key)


def _fetch_all(supabase, query_fn, page_size=500):
    rows, offset = [], 0
    while True:
        batch = query_fn(offset, offset + page_size - 1).execute().data or []
        rows.extend(batch)
        if len(batch) < page_size:
            break
        offset += page_size
    return rows


# -- Pass 1: re-scrape broken images -------------------------------

def pass1_fix_broken_images(supabase, dry_run: bool, limit: Optional[int]):
    """Re-scrape recipes with missing or broken image_url via Playwright."""
    print("\n-- Pass 1: Fix broken images --------------------------------")

    null_rows = (
        supabase.table("recipes")
        .select("id, title, source_url, image_url")
        .is_("image_url", "null")
        .limit(limit or 10000)
        .execute()
        .data or []
    )

    def _query(start, end):
        return (
            supabase.table("recipes")
            .select("id, title, source_url, image_url")
            .not_.is_("image_url", "null")
            .range(start, end)
        )

    all_rows = _fetch_all(supabase, _query)
    broken_rows = []
    print(f"  Checking {len(all_rows)} image URLs (HEAD requests)...")
    for i, row in enumerate(all_rows):
        if limit and len(broken_rows) + len(null_rows) >= limit:
            break
        if i and i % 100 == 0:
            print(f"  ... checked {i}/{len(all_rows)}, found {len(broken_rows)} broken so far")
        if not _image_is_valid(row["image_url"]):
            broken_rows.append(row)

    targets = null_rows + broken_rows
    if limit:
        targets = targets[:limit]

    print(f"  Found {len(null_rows)} null + {len(broken_rows)} broken = {len(targets)} to fix")

    # Filter out targets with no source_url upfront — those are unfixable
    actionable = [r for r in targets if (r.get("source_url") or "").strip()]
    skipped = len(targets) - len(actionable)
    if skipped:
        print(f"  Skipping {skipped} recipes with no source_url (dataset entries)")

    fixed, failed = 0, 0
    if not actionable:
        print(f"  Pass 1 done -- fixed: 0, failed: 0, skipped: {skipped}")
        return 0, skipped

    # Reuse one Playwright browser; restart it every BROWSER_RECYCLE recipes to
    # avoid memory bloat / page crashes that cascade and kill the whole run.
    BROWSER_RECYCLE = 100
    from playwright.sync_api import sync_playwright

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            for i, row in enumerate(actionable):
                if i and i % 25 == 0:
                    print(f"  ... {i}/{len(actionable)} processed (fixed={fixed}, failed={failed})")

                # Recycle the browser periodically to prevent crashes
                if i and i % BROWSER_RECYCLE == 0:
                    print(f"  [recycle] restarting browser at i={i}")
                    try:
                        browser.close()
                    except Exception:
                        pass
                    browser = p.chromium.launch(headless=True)
                    page = browser.new_page()

                rid = row["id"]
                title = row["title"] or "(untitled)"
                source_url = row["source_url"]

                try:
                    new_image = _fetch_image_with_page(page, source_url)
                except Exception as e:
                    # If the page itself crashed (e.g. "Page.goto: Page crashed"),
                    # recreate it so the next recipe can proceed.
                    print(f"  [recover] page error: {e}; recreating page")
                    try:
                        page.close()
                    except Exception:
                        pass
                    try:
                        page = browser.new_page()
                    except Exception:
                        # If the browser itself died, relaunch
                        try:
                            browser.close()
                        except Exception:
                            pass
                        browser = p.chromium.launch(headless=True)
                        page = browser.new_page()
                    new_image = None

                if not new_image:
                    print(f"  FAIL  {title}")
                    failed += 1
                    continue

                fx, fy = detect_focal_point(new_image)
                print(f"  {'DRY ' if dry_run else ''}FIX   {title}  focal=({fx}%,{fy}%)  {new_image[:60]}...")

                if not dry_run:
                    try:
                        supabase.table("recipes").update(
                            {"image_url": new_image, "focal_x": fx, "focal_y": fy}
                        ).eq("id", rid).execute()
                        fixed += 1
                    except Exception as e:
                        print(f"         -> DB error: {e}")
                        failed += 1
                else:
                    fixed += 1
        finally:
            try:
                browser.close()
            except Exception:
                pass

    print(f"  Pass 1 done -- fixed: {fixed}, failed: {failed}, skipped: {skipped}")
    return fixed, failed


# -- Pass 2: fill missing focal points -----------------------------

def pass2_fill_focal_points(supabase, dry_run: bool, limit: Optional[int]):
    """Detect focal points for recipes at the (50, 50) sentinel default."""
    print("\n-- Pass 2: Fill missing focal points ------------------------")

    def _query(start, end):
        return (
            supabase.table("recipes")
            .select("id, title, image_url, focal_x, focal_y")
            .not_.is_("image_url", "null")
            .eq("focal_x", 50)
            .eq("focal_y", 50)
            .range(start, end)
        )

    rows = _fetch_all(supabase, _query)
    if limit:
        rows = rows[:limit]

    print(f"  Found {len(rows)} recipes at sentinel (50, 50)")

    updated, failed = 0, 0
    for row in rows:
        rid = row["id"]
        title = row["title"] or "(untitled)"
        fx, fy = detect_focal_point(row["image_url"])

        if (fx, fy) == _FOCAL_FALLBACK:
            print(f"  FAIL  {title}  (detection failed)")
            failed += 1
            continue

        print(f"  {'DRY ' if dry_run else ''}SET   {title}  focal=({fx}%,{fy}%)")

        if not dry_run:
            try:
                supabase.table("recipes").update(
                    {"focal_x": fx, "focal_y": fy}
                ).eq("id", rid).execute()
                updated += 1
            except Exception as e:
                print(f"         -> DB error: {e}")
                failed += 1
        else:
            updated += 1

    print(f"  Pass 2 done -- updated: {updated}, failed: {failed}")
    return updated, failed


# -- Main ----------------------------------------------------------

def main():
    parser = argparse.ArgumentParser(description="Bulk recipe image fixer")
    parser.add_argument("--dry-run", action="store_true", help="Print actions without writing to DB")
    parser.add_argument("--pass1-only", action="store_true", help="Only run Pass 1 (re-scrape broken images)")
    parser.add_argument("--pass2-only", action="store_true", help="Only run Pass 2 (fill missing focal points)")
    parser.add_argument("--limit", type=int, default=None, help="Max recipes to process per pass")
    parser.add_argument(
        "--provider",
        choices=["saliency", "claude", "ollama"],
        default=None,
        help="Focal point detector. Default: WC_FOCAL_PROVIDER env or 'saliency'.",
    )
    args = parser.parse_args()

    global _PROVIDER
    _PROVIDER = args.provider

    provider_name = _PROVIDER or os.environ.get("WC_FOCAL_PROVIDER") or "saliency"

    if args.dry_run:
        print("DRY RUN - no changes will be written to the database")
    print(f"Focal point provider: {provider_name}")

    supabase = _get_supabase()
    run_pass1 = not args.pass2_only
    run_pass2 = not args.pass1_only

    if provider_name == "ollama":
        from focal_point import warm_up_ollama
        warm_up_ollama()

    if run_pass1:
        pass1_fix_broken_images(supabase, args.dry_run, args.limit)
    if run_pass2:
        pass2_fill_focal_points(supabase, args.dry_run, args.limit)

    print("\nDone.")


if __name__ == "__main__":
    main()
