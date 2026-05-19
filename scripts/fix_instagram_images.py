"""Refresh expired Instagram CDN images.

Finds recipes whose image_url points at scontent-*.cdninstagram.com (signed
URLs that expire after ~weeks) and re-extracts a fresh JPEG from each post's
original Instagram URL via yt-dlp + OpenCV. Uploads the result to Supabase
Storage so it's permanent.

Prerequisites:
  1. A public Supabase Storage bucket named 'recipe-images' must exist.
  2. Service-role policy allowing INSERT/UPDATE on that bucket.
  3. yt-dlp installed (pip install yt-dlp).
  4. For --cookies-browser chrome: Chrome must be CLOSED (Chrome locks the
     cookie DB). Alternative: export cookies.txt and use --cookies <file>.

Usage:
    python scripts/fix_instagram_images.py --dry-run --limit 3
    python scripts/fix_instagram_images.py --limit 3
    python scripts/fix_instagram_images.py   # full run, ~45 min for ~330 recipes
"""

import argparse
import os
import sys
import tempfile
import time
from datetime import datetime
from pathlib import Path
from typing import Optional

# UTF-8 line-buffered stdout so foreign titles don't crash + background runs
# show progress in real time.
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace", line_buffering=True)
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8", errors="replace", line_buffering=True)

from dotenv import load_dotenv
from supabase import create_client

load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env.local"))
load_dotenv()

# Import hero_shot.py and focal_point.py as a library
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "ingestion"))
from hero_shot import download_reel, extract_hero_frame  # noqa: E402
from focal_point import detect_focal_point  # noqa: E402


BUCKET = "recipe-images"
THROTTLE_SECONDS = 8.0
PROJECT_ROOT = Path(__file__).resolve().parent.parent
SUCCESS_LOG = PROJECT_ROOT / "logs" / "instagram-fix-success.log"
FAILED_LOG = PROJECT_ROOT / "logs" / "instagram-fix-failed.log"


def _get_supabase():
    return create_client(
        os.environ["NEXT_PUBLIC_SUPABASE_URL"],
        os.environ["SUPABASE_SERVICE_ROLE_KEY"],
    )


def _query_broken_instagram(sb) -> list[dict]:
    """Page through all recipes whose image_url is on the Instagram CDN."""
    rows: list[dict] = []
    offset = 0
    page_size = 500
    while True:
        batch = (
            sb.table("recipes")
            .select("id, title, source_url, image_url")
            .ilike("image_url", "%cdninstagram.com%")
            .range(offset, offset + page_size - 1)
            .execute()
            .data
            or []
        )
        rows.extend(batch)
        if len(batch) < page_size:
            break
        offset += page_size
    return rows


def _log(path: Path, msg: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    ts = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    with open(path, "a", encoding="utf-8") as f:
        f.write(f"[{ts}] {msg}\n")


def _process_one(
    sb,
    row: dict,
    cookies_browser: Optional[str],
    cookies_file: Optional[str],
    dry_run: bool,
) -> tuple[str, str]:
    """Returns (status, detail). status in {ok, skip-no-source, skip-not-ig, fail}."""
    rid = row["id"]
    title = (row.get("title") or "(untitled)")[:60]
    src = (row.get("source_url") or "").strip()

    if not src:
        return "skip-no-source", title
    if "instagram.com" not in src:
        return "skip-not-ig", f"{title} ({src[:50]})"
    # Only post/reel URLs are extractable. User profiles, IGTV, stories etc. can't be re-extracted.
    if not any(p in src for p in ("/p/", "/reel/", "/tv/")):
        return "skip-not-post", f"{title} ({src[:50]})"

    if dry_run:
        return "ok", f"{title}  <- {src}"

    with tempfile.TemporaryDirectory(prefix="ig-fix-") as tmpdir:
        # 1. Download the post/reel
        try:
            video_path = download_reel(
                src,
                tmpdir,
                cookies_from_browser=cookies_browser,
                cookies_file=cookies_file,
            )
        except Exception as e:
            return "fail", f"{title}: download — {str(e)[:200]}"

        # 2. Extract best frame
        try:
            _ts, jpeg_path = extract_hero_frame(video_path)
        except Exception as e:
            return "fail", f"{title}: extract — {str(e)[:200]}"

        # 3. Upload to Supabase Storage (upsert so reruns overwrite)
        try:
            with open(jpeg_path, "rb") as f:
                sb.storage.from_(BUCKET).upload(
                    path=f"{rid}.jpg",
                    file=f.read(),
                    file_options={
                        "content-type": "image/jpeg",
                        "upsert": "true",
                        "cache-control": "public, max-age=31536000, immutable",
                    },
                )
        except Exception as e:
            return "fail", f"{title}: upload — {str(e)[:200]}"

        public_url = sb.storage.from_(BUCKET).get_public_url(f"{rid}.jpg")
        # Strip any trailing ?token=... or trailing slash on get_public_url quirks
        public_url = public_url.rstrip("?/")

        # 4. Recompute focal point on the fresh image
        try:
            fx, fy = detect_focal_point(public_url, provider="saliency")
        except Exception:
            fx, fy = 50, 60  # safe fallback

        # 5. Update the recipe row
        try:
            sb.table("recipes").update(
                {"image_url": public_url, "focal_x": fx, "focal_y": fy}
            ).eq("id", rid).execute()
        except Exception as e:
            return "fail", f"{title}: db update — {str(e)[:200]}"

    return "ok", f"{title}  focal=({fx}%,{fy}%)  -> {public_url[:80]}"


def main() -> None:
    parser = argparse.ArgumentParser(description="Refresh expired Instagram CDN images")
    parser.add_argument("--dry-run", action="store_true", help="Print what would happen, no downloads / no DB writes")
    parser.add_argument("--limit", type=int, default=None, help="Cap number of recipes processed")
    parser.add_argument(
        "--cookies-browser",
        default="chrome",
        help="Browser to borrow IG cookies from (chrome, firefox, edge). Browser must be closed. Default: chrome.",
    )
    parser.add_argument(
        "--cookies",
        default=None,
        metavar="FILE",
        help="Path to Netscape cookies.txt. Overrides --cookies-browser if set.",
    )
    args = parser.parse_args()

    if args.dry_run:
        print("DRY-RUN — no downloads or DB writes")
    print(f"Auth: {'cookies-file=' + args.cookies if args.cookies else 'cookies-browser=' + args.cookies_browser}")

    cookies_browser = None if args.cookies else args.cookies_browser
    cookies_file = args.cookies

    sb = _get_supabase()
    rows = _query_broken_instagram(sb)
    print(f"\nFound {len(rows)} recipes with expired Instagram CDN URLs")
    if args.limit:
        rows = rows[: args.limit]
        print(f"  Limited to {len(rows)}")

    if not rows:
        return

    ok = fail = skip = 0
    start = time.time()
    for i, row in enumerate(rows, 1):
        status, detail = _process_one(sb, row, cookies_browser, cookies_file, args.dry_run)
        prefix = "DRY " if args.dry_run else ""
        if status == "ok":
            ok += 1
            print(f"  {prefix}OK    {detail}")
            if not args.dry_run:
                _log(SUCCESS_LOG, f"{row['id']}  {detail}")
        elif status.startswith("skip"):
            skip += 1
            print(f"  SKIP  {status[5:]} {detail}")
        else:
            fail += 1
            print(f"  FAIL  {detail}")
            _log(FAILED_LOG, f"{row['id']}  {detail}")

        if i and i % 25 == 0:
            elapsed = time.time() - start
            print(f"  ... {i}/{len(rows)} (ok={ok}, fail={fail}, skip={skip}, elapsed={elapsed:.0f}s)")

        # Throttle between recipes (except after the last one)
        if not args.dry_run and i < len(rows):
            time.sleep(THROTTLE_SECONDS)

    elapsed = time.time() - start
    print(f"\nDone. ok={ok}, fail={fail}, skip={skip}, total={len(rows)}, elapsed={elapsed:.0f}s")


if __name__ == "__main__":
    main()
