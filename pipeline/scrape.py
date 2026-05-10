import re
import json
import time
from typing import Any
from urllib.parse import urlparse

from playwright.sync_api import sync_playwright, Page, TimeoutError as PlaywrightTimeout
from recipe_scrapers import scrape_me

from pipeline.config import CATEGORY_URLS, RECIPES_PER_CATEGORY, SUPABASE_URL, SUPABASE_KEY


def get_existing_urls() -> set[str]:
    """Fetch all source_urls already in Supabase to skip duplicates."""
    if not SUPABASE_URL or not SUPABASE_KEY:
        print("  [scrape] Warning: Supabase credentials not set, skipping dedup check")
        return set()
    try:
        from supabase import create_client
        client = create_client(SUPABASE_URL, SUPABASE_KEY)
        result = client.table("recipes").select("source_url").eq("source", "curated").execute()
        return {row["source_url"] for row in result.data if row.get("source_url")}
    except Exception as e:
        print(f"  [scrape] Dedup check failed: {e}")
        return set()


def collect_recipe_links(page: Page, url: str, limit: int) -> list[str]:
    """Navigate to a category page and collect individual recipe URLs."""
    try:
        page.goto(url, timeout=30000, wait_until="domcontentloaded")
        page.wait_for_timeout(2000)
    except PlaywrightTimeout:
        print(f"  [scrape] Timeout loading {url}")
        return []

    # Collect hrefs that look like individual recipe detail pages (not category/search pages)
    links = page.evaluate("""() => {
        return Array.from(document.querySelectorAll('a[href]'))
            .map(a => a.href)
            .filter(href => {
                // Bon Appétit individual recipes: /recipe/<slug>
                if (href.includes('bonappetit.com/recipe/') &&
                    !/bonappetit\\.com\\/recipe\\/?$/.test(href)) return true;
                return false;
            })
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
    """Extract structured recipe data via Playwright (primary) or recipe-scrapers fallback."""
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
    """Extract ld+json recipe data using an already-open Playwright page (bypasses bot detection)."""
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
            # Handle @graph wrapper
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


def scrape_category(category: str, existing_urls: set[str]) -> list[dict[str, Any]]:
    """Scrape RECIPES_PER_CATEGORY recipes for a given category."""
    sources = CATEGORY_URLS.get(category, {})
    if not sources:
        print(f"  [scrape] No URLs configured for category: {category}")
        return []

    collected = []
    with sync_playwright() as pw:
        browser = pw.chromium.launch(headless=True)
        page = browser.new_page()
        page.set_extra_http_headers({"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"})

        for source_name, category_url in sources.items():
            if len(collected) >= RECIPES_PER_CATEGORY:
                break
            print(f"  [scrape] Collecting links from {source_name}...")
            links = collect_recipe_links(page, category_url, limit=10)

            for link in links:
                if len(collected) >= RECIPES_PER_CATEGORY:
                    break
                if link in existing_urls:
                    print(f"  [scrape] Skip (already in DB): {link}")
                    continue
                print(f"  [scrape] Extracting: {link}")
                recipe = extract_recipe(link, page=page)
                if recipe and recipe.get("title") and recipe.get("ingredients"):
                    collected.append(recipe)
                    time.sleep(1.5)  # polite delay between requests

        browser.close()

    return collected
