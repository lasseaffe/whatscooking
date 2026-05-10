"""
site_screenshotter.py — Extract a hero image from any standard recipe website URL.

Usage:
    python site_screenshotter.py <url> [--out hero.jpg] [--format jpg|png]

Dependencies: playwright, pillow
    playwright install chromium   # run once after pip install
"""

import argparse
import json
import re
import sys
import tempfile
from pathlib import Path
from typing import Optional

try:
    from playwright.sync_api import sync_playwright, Page, ElementHandle, Error as PlaywrightError
except ImportError:
    sys.exit("Missing dependency: pip install playwright && playwright install chromium")

try:
    from PIL import Image
except ImportError:
    sys.exit("Missing dependency: pip install pillow")


# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

USER_AGENT = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
    "AppleWebKit/537.36 (KHTML, like Gecko) "
    "Chrome/124.0.0.0 Safari/537.36"
)

# Common ad/banner sizes to skip (width, height)
AD_SIZES = {(300, 250), (728, 90), (160, 600), (320, 50), (300, 600), (970, 250)}

# Popup close-button selectors, tried in order
POPUP_SELECTORS = [
    "[aria-label*='close' i]",
    "[aria-label*='dismiss' i]",
    "button[class*='close' i]",
    "button[class*='dismiss' i]",
    "button[class*='reject' i]",
    "[id*='cookie'] button",
    "[class*='cookie'] button",
    "[class*='newsletter'] button[class*='close' i]",
    "[class*='modal'] button[class*='close' i]",
    "[class*='overlay'] button",
]

# High-z-index elements that block the centre of the page
OVERLAY_SCRIPT = """
() => {
    const blockers = [];
    document.querySelectorAll('*').forEach(el => {
        const s = window.getComputedStyle(el);
        const z = parseInt(s.zIndex, 10);
        if (z > 999 && s.position !== 'static' && s.display !== 'none') {
            const r = el.getBoundingClientRect();
            const cx = window.innerWidth / 2, cy = window.innerHeight / 2;
            if (r.left < cx && r.right > cx && r.top < cy && r.bottom > cy) {
                blockers.push(el);
            }
        }
    });
    return blockers.length;
}
"""


# ---------------------------------------------------------------------------
# Popup / overlay dismissal
# ---------------------------------------------------------------------------

def dismiss_popups(page: Page) -> None:
    """Best-effort dismissal of cookie banners, newsletter modals, etc."""
    for selector in POPUP_SELECTORS:
        try:
            btns = page.query_selector_all(selector)
            for btn in btns[:2]:  # click at most 2 per selector to avoid loops
                if btn.is_visible():
                    btn.click(timeout=1500)
        except PlaywrightError:
            pass

    # If a high-z overlay still covers the centre, try pressing Escape
    try:
        overlay_count = page.evaluate(OVERLAY_SCRIPT)
        if overlay_count:
            page.keyboard.press("Escape")
    except PlaywrightError:
        pass


# ---------------------------------------------------------------------------
# Lazy-load trigger
# ---------------------------------------------------------------------------

def trigger_lazy_load(page: Page, steps: int = 8) -> None:
    """Scroll down the page in steps to trigger lazy-loaded images."""
    page.evaluate("""
        async (steps) => {
            const delay = ms => new Promise(r => setTimeout(r, ms));
            const h = document.body.scrollHeight;
            for (let i = 1; i <= steps; i++) {
                window.scrollTo(0, (h / steps) * i);
                await delay(200);
            }
            window.scrollTo(0, 0);
        }
    """, steps)
    page.wait_for_load_state("networkidle", timeout=8000)


# ---------------------------------------------------------------------------
# ld+json schema.org extraction
# ---------------------------------------------------------------------------

def schema_image_selector(page: Page) -> Optional[str]:
    """
    Parse ld+json blocks for Recipe schema. Returns a CSS selector string
    that isolates the schema-declared image, or None.
    """
    scripts = page.query_selector_all('script[type="application/ld+json"]')
    for script in scripts:
        try:
            data = json.loads(script.inner_text())
        except (json.JSONDecodeError, PlaywrightError):
            continue

        # Handle @graph arrays
        items = data if isinstance(data, list) else [data]
        for item in items:
            if isinstance(item, dict) and item.get("@graph"):
                items.extend(item["@graph"])

        for item in items:
            if not isinstance(item, dict):
                continue
            recipe_types = {"Recipe", "http://schema.org/Recipe", "https://schema.org/Recipe"}
            if item.get("@type") not in recipe_types:
                continue

            img = item.get("image")
            if not img:
                continue

            # image can be a string URL, a list, or an ImageObject
            img_url = None
            if isinstance(img, str):
                img_url = img
            elif isinstance(img, list):
                img_url = img[0] if img else None
            elif isinstance(img, dict):
                img_url = img.get("url") or img.get("contentUrl")

            if img_url:
                # Try to locate the element by its src attribute
                return f'img[src="{img_url}"], img[data-src="{img_url}"]'

    return None


# ---------------------------------------------------------------------------
# Hero candidate detection
# ---------------------------------------------------------------------------

def score_image_candidates(page: Page) -> list[tuple[float, ElementHandle]]:
    """
    Return (score, element) pairs for all img elements, sorted best-first.
    Scoring: prefers large, near the top of the page, non-ad dimensions.
    """
    viewport_height = page.viewport_size["height"]  # type: ignore[index]
    page_height: float = page.evaluate("document.body.scrollHeight") or viewport_height

    images = page.query_selector_all("img")
    results = []

    for img in images:
        try:
            box = img.bounding_box()
            if not box:
                continue
        except PlaywrightError:
            continue

        w, h = box["width"], box["height"]

        # Minimum size filter
        if w < 200 or h < 150:
            continue

        # Skip ad-sized images
        if (round(w), round(h)) in AD_SIZES:
            continue

        area = w * h

        # Position score: top 60% of page scores 1.0, falls off linearly
        y_relative = box["y"] / page_height
        position_score = max(0.0, 1.0 - (y_relative / 0.6)) if y_relative <= 0.6 else 0.0

        # Area score: log-scaled so a 1000×700 image >> a 400×300 one
        import math
        area_score = math.log10(max(area, 1)) / 7.0  # 10^7 ≈ 10M px = 1.0

        score = 0.6 * area_score + 0.4 * position_score
        results.append((score, img))

    results.sort(key=lambda x: x[0], reverse=True)
    return results


# ---------------------------------------------------------------------------
# Core function
# ---------------------------------------------------------------------------

def capture_recipe_hero(
    url: str,
    output_path: str = "hero.jpg",
    fmt: str = "jpg",
    width: int = 1200,
    height: int = 800,
) -> str:
    """
    Load `url`, find the recipe hero image, screenshot it, and save to `output_path`.
    Returns the final output path.
    """
    with sync_playwright() as pw:
        browser = pw.chromium.launch(headless=True)
        context = browser.new_context(
            user_agent=USER_AGENT,
            viewport={"width": width, "height": height},
            locale="en-US",
        )
        page = context.new_page()

        # ----- Load page -----
        try:
            page.goto(url, wait_until="domcontentloaded", timeout=30_000)
        except PlaywrightError as exc:
            browser.close()
            raise RuntimeError(f"Failed to load URL: {exc}") from exc

        # ----- Dismiss popups before scrolling -----
        dismiss_popups(page)

        # ----- Trigger lazy load -----
        try:
            trigger_lazy_load(page)
        except PlaywrightError:
            pass  # not fatal

        # ----- Dismiss any popups that appeared during scroll -----
        dismiss_popups(page)

        # ----- Find best candidate -----
        target_element: Optional[ElementHandle] = None

        # 1. Try schema.org ld+json
        schema_sel = schema_image_selector(page)
        if schema_sel:
            try:
                target_element = page.query_selector(schema_sel)
            except PlaywrightError:
                pass

        # 2. Fallback: largest high-position image
        if target_element is None:
            candidates = score_image_candidates(page)
            if candidates:
                target_element = candidates[0][1]

        # ----- Screenshot -----
        with tempfile.NamedTemporaryFile(suffix=".png", delete=False) as tmp:
            tmp_path = tmp.name

        if target_element:
            try:
                target_element.screenshot(path=tmp_path)
                print("Captured hero element screenshot.")
            except PlaywrightError:
                # Element may have disappeared — fall back to viewport screenshot
                target_element = None

        if target_element is None:
            # Top-fold fallback: screenshot the visible viewport
            page.screenshot(path=tmp_path, clip={"x": 0, "y": 0, "width": width, "height": height})
            print("Fell back to top-fold viewport screenshot.")

        browser.close()

    # ----- Convert / save with Pillow -----
    img = Image.open(tmp_path).convert("RGB")
    Path(tmp_path).unlink(missing_ok=True)

    if fmt.lower() == "jpg":
        img.save(output_path, "JPEG", quality=85, optimize=True)
    else:
        img.save(output_path, "PNG", optimize=True)

    return output_path


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------

def main() -> None:
    parser = argparse.ArgumentParser(
        description="Screenshot the hero image from a recipe website."
    )
    parser.add_argument("url", help="Recipe page URL")
    parser.add_argument("--out", default="hero.jpg", help="Output file path")
    parser.add_argument("--format", choices=["jpg", "png"], default="jpg", help="Output format")
    parser.add_argument("--width", type=int, default=1200, help="Viewport width")
    parser.add_argument("--height", type=int, default=800, help="Viewport height")
    args = parser.parse_args()

    print(f"Loading: {args.url}")
    try:
        out = capture_recipe_hero(
            args.url,
            output_path=args.out,
            fmt=args.format,
            width=args.width,
            height=args.height,
        )
    except RuntimeError as exc:
        sys.exit(str(exc))

    print(f"Done → {out}")


if __name__ == "__main__":
    main()
