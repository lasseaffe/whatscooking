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

    # Collect all <a> hrefs that look like recipe pages
    links = page.evaluate("""() => {
        return Array.from(document.querySelectorAll('a[href]'))
            .map(a => a.href)
            .filter(href => href.includes('/recipe') || href.includes('-recipe'))
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


def extract_recipe(url: str) -> dict[str, Any] | None:
    """Extract structured recipe data from a URL using recipe-scrapers."""
    try:
        scraper = scrape_me(url, wild_mode=True)
        ingredients = scraper.ingredients() or []
        instructions_text = scraper.instructions() or ""
        instructions = [s.strip() for s in re.split(r'\n+|\.\s+', instructions_text) if s.strip()]

        return {
            "title": scraper.title() or "",
            "ingredients": ingredients,
            "instructions": instructions[:20],  # cap at 20 steps
            "image_url": scraper.image() or None,
            "cook_time_minutes": scraper.total_time() or None,
            "prep_time_minutes": None,
            "servings": scraper.yields() or None,
            "cuisine_type": None,
            "dietary_tags": [],
            "source_url": url,
            "source_name": urlparse(url).netloc.replace("www.", "").split(".")[0].title(),
        }
    except Exception as e:
        # Fallback: try ld+json extraction
        return _extract_ldjson(url, e)


def _extract_ldjson(url: str, original_error: Exception) -> dict[str, Any] | None:
    """Fallback extraction using ld+json from raw page HTML."""
    try:
        import requests
        resp = requests.get(url, timeout=15, headers={"User-Agent": "Mozilla/5.0"})
        matches = re.findall(
            r'<script[^>]+type="application/ld\+json"[^>]*>(.*?)</script>',
            resp.text, re.DOTALL
        )
        for match in matches:
            try:
                data = json.loads(match)
                if isinstance(data, list):
                    data = next((d for d in data if d.get("@type") == "Recipe"), None)
                if data and data.get("@type") == "Recipe":
                    raw_instructions = data.get("recipeInstructions", [])
                    instructions = []
                    for step in raw_instructions:
                        if isinstance(step, str):
                            instructions.append(step)
                        elif isinstance(step, dict):
                            instructions.append(step.get("text", ""))
                    return {
                        "title": data.get("name", ""),
                        "ingredients": data.get("recipeIngredient", []),
                        "instructions": [s for s in instructions if s],
                        "image_url": (data.get("image") or [None])[0] if isinstance(data.get("image"), list) else data.get("image"),
                        "cook_time_minutes": None,
                        "prep_time_minutes": None,
                        "servings": None,
                        "cuisine_type": None,
                        "dietary_tags": [],
                        "source_url": url,
                        "source_name": urlparse(url).netloc.replace("www.", "").split(".")[0].title(),
                    }
            except json.JSONDecodeError:
                continue
    except Exception:
        pass

    print(f"  [scrape] Could not extract {url}: {original_error}")
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
                recipe = extract_recipe(link)
                if recipe and recipe.get("title") and recipe.get("ingredients"):
                    collected.append(recipe)
                    time.sleep(1.5)  # polite delay between requests

        browser.close()

    return collected
