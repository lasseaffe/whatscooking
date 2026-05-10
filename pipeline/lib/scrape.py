import re
import json
import time
from typing import Any
from urllib.parse import urlparse

from playwright.sync_api import sync_playwright, Page, TimeoutError as PlaywrightTimeout
from recipe_scrapers import scrape_me


def collect_recipe_links(page: Page, url: str, limit: int) -> list[str]:
    """Navigate to a listing page and collect individual recipe URLs."""
    try:
        page.goto(url, timeout=30000, wait_until="domcontentloaded")
        page.wait_for_timeout(2000)
    except PlaywrightTimeout:
        print(f"  [scrape] Timeout loading {url}")
        return []

    links = page.evaluate("""() => {
        return Array.from(document.querySelectorAll('a[href]'))
            .map(a => a.href)
            .filter(href =>
                (href.includes('bonappetit.com/recipe/') && !/bonappetit\\.com\\/recipe\\/?$/.test(href)) ||
                (href.includes('greatbritishchefs.com/recipes/') && !/greatbritishchefs\\.com\\/recipes\\/?$/.test(href)) ||
                (href.includes('seriouseats.com/') && /seriouseats\\.com\\/[a-z0-9-]+-recipe/.test(href)) ||
                (href.includes('allrecipes.com/recipe/') && !/allrecipes\\.com\\/recipe\\/?$/.test(href))
            )
    }""")

    seen = set()
    unique = []
    for link in links:
        parsed = urlparse(link)
        clean = f"{parsed.scheme}://{parsed.netloc}{parsed.path}".rstrip("/")
        if clean not in seen and len(clean) > 20:
            seen.add(clean)
            unique.append(clean)

    return unique[:limit]


def extract_recipe(url: str, page: Page | None = None) -> dict[str, Any] | None:
    """Extract structured recipe data via Playwright ld+json or recipe-scrapers fallback."""
    if page is not None:
        result = _extract_via_playwright(url, page)
        if result:
            return result

    try:
        scraper = scrape_me(url, wild_mode=True)
        ingredients = scraper.ingredients() or []
        instructions_text = scraper.instructions() or ""
        instructions = [s.strip() for s in re.split(r'\n+|\.\s+', instructions_text) if s.strip()]
        title = scraper.title() or ""
        if title and ingredients:
            return {
                "title": title,
                "ingredients": ingredients,
                "instructions": instructions[:20],
                "image_url": scraper.image() or None,
                "cook_time_minutes": scraper.total_time() or None,
                "prep_time_minutes": None,
                "servings": scraper.yields() or None,
                "cuisine_type": None,
                "dietary_tags": [],
                "source_url": url,
                "source_name": urlparse(url).netloc.replace("www.", "").split(".")[0].title(),
            }
    except Exception:
        pass

    print(f"  [scrape] Could not extract {url}")
    return None


def _extract_via_playwright(url: str, page: Page) -> dict[str, Any] | None:
    try:
        page.goto(url, timeout=30000, wait_until="domcontentloaded")
        page.wait_for_timeout(1500)
        html = page.content()
    except PlaywrightTimeout:
        return None

    matches = re.findall(
        r'<script[^>]+type="application/ld\+json"[^>]*>(.*?)</script>',
        html, re.DOTALL
    )
    for match in matches:
        try:
            data = json.loads(match)
            if isinstance(data, dict) and "@graph" in data:
                data = next((d for d in data["@graph"] if d.get("@type") == "Recipe"), None)
            if isinstance(data, list):
                data = next((d for d in data if d.get("@type") == "Recipe"), None)
            if not data or data.get("@type") != "Recipe":
                continue

            raw_instructions = data.get("recipeInstructions", [])
            instructions = []
            for step in raw_instructions:
                if isinstance(step, str):
                    instructions.append(step.strip())
                elif isinstance(step, dict):
                    text = step.get("text", "").strip()
                    if text:
                        instructions.append(text)

            ingredients = data.get("recipeIngredient", [])
            title = data.get("name", "")
            if not title or not ingredients:
                continue

            image = data.get("image")
            if isinstance(image, list):
                image = image[0] if image else None
            elif isinstance(image, dict):
                image = image.get("url")

            return {
                "title": title,
                "ingredients": ingredients,
                "instructions": instructions,
                "image_url": image,
                "cook_time_minutes": None,
                "prep_time_minutes": None,
                "servings": None,
                "cuisine_type": None,
                "dietary_tags": [],
                "source_url": url,
                "source_name": urlparse(url).netloc.replace("www.", "").split(".")[0].title(),
            }
        except (json.JSONDecodeError, StopIteration):
            continue

    return None


def scrape_urls(urls: list[str], existing_urls: set[str], limit: int) -> list[dict[str, Any]]:
    """Open one Playwright browser, scrape up to `limit` recipes from `urls`, skipping known ones."""
    collected = []
    with sync_playwright() as pw:
        browser = pw.chromium.launch(headless=True)
        try:
            page = browser.new_page()
            page.set_extra_http_headers({"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"})

            for url in urls:
                if len(collected) >= limit:
                    break
                if url in existing_urls:
                    print(f"  [scrape] Skip (already in DB): {url}")
                    continue
                print(f"  [scrape] Extracting: {url}")
                recipe = extract_recipe(url, page=page)
                if recipe and recipe.get("title") and recipe.get("ingredients"):
                    collected.append(recipe)
                    time.sleep(1.5)
        finally:
            browser.close()

    return collected


def get_links_from_listing(listing_url: str, limit: int = 10) -> list[str]:
    """Open a Playwright browser just to collect recipe links from a listing page."""
    with sync_playwright() as pw:
        browser = pw.chromium.launch(headless=True)
        try:
            page = browser.new_page()
            page.set_extra_http_headers({"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"})
            links = collect_recipe_links(page, listing_url, limit)
        finally:
            browser.close()
    return links
