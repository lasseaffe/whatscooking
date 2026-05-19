"""Re-pull a recipe from just a title.

Pipeline:
  1. DDG-search the title -> list of candidate URLs
  2. Try recipe_scrapers on each candidate until one parses cleanly
  3. If no candidate yields a usable recipe -> AI-generate via Ollama (qwen3:14b)
  4. Image: scraped image (preferred) -> Playwright fallback -> None (UI handles fallback)
  5. Focal point: run saliency on whatever image we end up with

Returns a recipe dict ready for ingest.upsert_recipes(). Returns None only if
both web-search and AI-generation fail (very rare).
"""

import json
import re
import time
from typing import Optional

import httpx
from ddgs import DDGS
from recipe_scrapers import scrape_me
from recipe_scrapers._exceptions import WebsiteNotImplementedError, NoSchemaFoundInWildMode

from focal_point import detect_focal_point


_OLLAMA_URL = "http://localhost:11434/v1/chat/completions"
_AI_MODEL = "qwen3:8b"
_AI_TIMEOUT = 180.0


def warm_up_ai() -> bool:
    """Preload the AI model into VRAM. First call after model-swap takes ~60s."""
    print(f"[repull] warming up {_AI_MODEL} (first load can take ~60s)...")
    try:
        r = httpx.post(
            _OLLAMA_URL,
            json={"model": _AI_MODEL, "messages": [{"role": "user", "content": "ok"}], "max_tokens": 2},
            timeout=_AI_TIMEOUT,
        )
        r.raise_for_status()
        print(f"[repull] warm-up done")
        return True
    except Exception as e:
        print(f"[repull] warm-up failed: {e}")
        return False


# Hosts known to block bots or have expired CDN signatures - skip them upfront
_BLOCKED_HOSTS = {
    "cookbooks.com",
    "www.cookbooks.com",
    "scontent.cdninstagram.com",
}


def _looks_blocked(url: str) -> bool:
    for bad in _BLOCKED_HOSTS:
        if bad in url:
            return True
    return False


# -- DDG search ----------------------------------------------------

def search_recipe_urls(title: str, max_results: int = 5) -> list[str]:
    """Return up to N candidate recipe URLs for a title, blocked hosts removed."""
    query = f"{title} recipe"
    try:
        with DDGS() as ddgs:
            results = list(ddgs.text(query, max_results=max_results * 3))
        urls = [r["href"] for r in results if r.get("href")]
        return [u for u in urls if not _looks_blocked(u)][:max_results]
    except Exception as e:
        print(f"[repull] DDG search failed for '{title}': {e}")
        return []


# -- Scrape attempt ------------------------------------------------

def _try_scrape(url: str) -> Optional[dict]:
    """Try recipe_scrapers; return normalised dict or None."""
    try:
        scraper = scrape_me(url, wild_mode=True)
        ingredients = scraper.ingredients() or []
        instructions = scraper.instructions_list() or []
        if len(ingredients) < 3 or len(instructions) < 2:
            return None  # too sparse, treat as failure
        return {
            "title": scraper.title(),
            "image_url": scraper.image(),
            "ingredients": [{"name": i, "amount": None, "unit": None} for i in ingredients],
            "instructions": instructions,
            "cook_time_minutes": scraper.total_time(),
            "servings": _parse_yield(scraper.yields()),
            "cuisine_type": scraper.cuisine() if hasattr(scraper, "cuisine") else None,
            "source_url": url,
        }
    except (WebsiteNotImplementedError, NoSchemaFoundInWildMode):
        return None
    except Exception as e:
        print(f"[repull] scrape error on {url}: {e}")
        return None


def _parse_yield(yields_str) -> Optional[int]:
    if not yields_str:
        return None
    m = re.search(r"\d+", str(yields_str))
    return int(m.group()) if m else None


# -- AI fallback (Ollama qwen3:14b) --------------------------------

_AI_PROMPT = """\
You are a culinary expert. Write a complete, accurate home-cook recipe for the dish below.

Dish: {title}
{extras}

Return ONLY valid JSON, no markdown or commentary:
{{
  "description": "2-3 sentence editorial description, no first person, no hashtags",
  "servings": 4,
  "prep_time_minutes": 15,
  "cook_time_minutes": 30,
  "cuisine_type": "italian",
  "dish_types": ["dinner"],
  "dietary_tags": [],
  "ingredients": [
    {{"name": "ingredient", "amount": 1.0, "unit": "cup"}}
  ],
  "instructions": ["Step 1...", "Step 2...", "Step 3..."]
}}

Rules:
- 6 to 14 ingredients
- 4 to 10 instruction steps, each a complete sentence
- dish_types from: breakfast, lunch, dinner, snack, dessert, appetizer, salad, soup, side, drink
- dietary_tags from: vegan, vegetarian, gluten-free, dairy-free, nut-free, low-carb, high-protein, keto, paleo
- Use empty arrays where nothing fits, never null
- All numbers must be valid numbers (not strings)"""


def _ai_generate(title: str, cuisine_hint: Optional[str], tags_hint: Optional[list[str]]) -> Optional[dict]:
    """Generate a full recipe from just a title via Ollama qwen3:14b."""
    extras_parts = []
    if cuisine_hint:
        extras_parts.append(f"Cuisine: {cuisine_hint}")
    if tags_hint:
        extras_parts.append(f"Dietary: {', '.join(tags_hint)}")
    extras = "\n".join(extras_parts)

    payload = {
        "model": _AI_MODEL,
        "messages": [{"role": "user", "content": _AI_PROMPT.format(title=title, extras=extras)}],
        "temperature": 0.4,
        "max_tokens": 1024,
    }
    try:
        resp = httpx.post(_OLLAMA_URL, json=payload, timeout=_AI_TIMEOUT)
        resp.raise_for_status()
        text = resp.json()["choices"][0]["message"]["content"].strip()
        # Strip markdown fences if the model added them
        if text.startswith("```"):
            text = text.split("```")[1].lstrip("json").strip()
        start = text.find("{")
        end = text.rfind("}")
        if start < 0 or end < 0:
            print(f"[repull] AI returned no JSON for '{title}': {text[:200]}")
            return None
        data = json.loads(text[start : end + 1])
        # Light shape validation
        if not isinstance(data.get("ingredients"), list) or not isinstance(data.get("instructions"), list):
            print(f"[repull] AI output shape invalid for '{title}'")
            return None
        return data
    except Exception as e:
        print(f"[repull] AI generation failed for '{title}': {e}")
        return None


# -- Image: scraped or Playwright fallback -------------------------

def _fetch_image_playwright(source_url: str) -> Optional[str]:
    """Try to extract OG image from a page via Playwright."""
    try:
        from playwright.sync_api import sync_playwright
        with sync_playwright() as p:
            browser = p.chromium.launch(headless=True)
            try:
                page = browser.new_page()
                page.goto(source_url, timeout=15000, wait_until="domcontentloaded")
                og = page.query_selector('meta[property="og:image"]')
                if og:
                    content = og.get_attribute("content")
                    if content:
                        return content
                return None
            finally:
                browser.close()
    except Exception:
        return None


def _image_ok(url: Optional[str]) -> bool:
    if not url:
        return False
    try:
        r = httpx.head(url, timeout=5, follow_redirects=True, headers={"User-Agent": "Mozilla/5.0"})
        return r.status_code == 200
    except Exception:
        return False


# -- Main entry point ----------------------------------------------

def repull_recipe(
    title: str,
    cuisine_hint: Optional[str] = None,
    tags_hint: Optional[list[str]] = None,
    category: str = "ai-repull",
) -> Optional[dict]:
    """Re-pull a recipe by title. Returns a dict ready for ingest.upsert_recipes()."""
    # 1. Try web search + scrape
    urls = search_recipe_urls(title, max_results=5)
    scraped: Optional[dict] = None
    for url in urls:
        scraped = _try_scrape(url)
        if scraped:
            break
        time.sleep(0.5)  # be polite to the source

    source = "web-rescrape" if scraped else "ai-generated"
    image_url: Optional[str] = None

    if scraped:
        recipe = scraped
        image_url = recipe.get("image_url")
        if not _image_ok(image_url) and recipe.get("source_url"):
            playwright_image = _fetch_image_playwright(recipe["source_url"])
            if _image_ok(playwright_image):
                image_url = playwright_image
        recipe["image_url"] = image_url if _image_ok(image_url) else None
    else:
        # 2. AI fallback
        ai = _ai_generate(title, cuisine_hint, tags_hint)
        if not ai:
            return None
        recipe = {
            "title": title,
            "description": ai.get("description"),
            "ingredients": ai.get("ingredients", []),
            "instructions": ai.get("instructions", []),
            "prep_time_minutes": ai.get("prep_time_minutes"),
            "cook_time_minutes": ai.get("cook_time_minutes"),
            "servings": ai.get("servings"),
            "cuisine_type": ai.get("cuisine_type") or cuisine_hint,
            "dish_types": ai.get("dish_types", []),
            "dietary_tags": ai.get("dietary_tags", []),
            "image_url": None,
            "source_url": None,
        }

    # 3. Focal point on whatever image we have (saliency, free + local)
    if recipe.get("image_url"):
        fx, fy = detect_focal_point(recipe["image_url"], provider="saliency")
        recipe["focal_x"] = fx
        recipe["focal_y"] = fy

    # 4. Tag the source so we can audit later
    recipe["source"] = source
    recipe["category"] = category
    recipe.setdefault("dish_types", [])
    recipe.setdefault("dietary_tags", [])

    return recipe
