import json
import re
from typing import Optional
import requests
from recipe_scrapers import scrape_me
from recipe_scrapers._exceptions import WebsiteNotImplementedError, NoSchemaFoundInWildMode


def parse_yield(yields_str: Optional[str]) -> Optional[int]:
    if not yields_str:
        return None
    match = re.search(r'\d+', str(yields_str))
    return int(match.group()) if match else None


def normalize_recipe_scraper(
    title: str,
    ingredients: list[str],
    instructions: list[str],
    image: Optional[str],
    total_time: Optional[int],
    yields: Optional[str],
    cuisine: Optional[str],
    source_url: str,
    category: str,
    cuisine_type: Optional[str],
) -> dict:
    return {
        "title": title,
        "ingredients": [{"name": ing, "amount": None, "unit": None} for ing in ingredients],
        "instructions": instructions,
        "image_url": image,
        "cook_time_minutes": total_time,
        "servings": parse_yield(yields),
        "cuisine_type": cuisine or cuisine_type,
        "source_url": source_url,
        "source": "scraped",
        "category": category,
        "dish_types": [],
        "dietary_tags": [],
    }


def _extract_ldjson(html: str) -> Optional[dict]:
    pattern = re.compile(r'<script[^>]+type=["\']application/ld\+json["\'][^>]*>(.*?)</script>', re.DOTALL | re.IGNORECASE)
    for match in pattern.finditer(html):
        try:
            data = json.loads(match.group(1))
            items = data if isinstance(data, list) else [data]
            for item in items:
                if isinstance(item, dict) and item.get("@type") == "Recipe":
                    return item
                if isinstance(item, dict) and "@graph" in item:
                    for node in item["@graph"]:
                        if isinstance(node, dict) and node.get("@type") == "Recipe":
                            return node
        except (json.JSONDecodeError, KeyError):
            continue
    return None


def _parse_ldjson_recipe(data: dict, url: str, source: dict) -> Optional[dict]:
    title = data.get("name", "").strip()
    if not title:
        return None

    raw_ingredients = data.get("recipeIngredient", [])
    ingredients = [str(i).strip() for i in raw_ingredients if i]

    raw_instructions = data.get("recipeInstructions", [])
    if isinstance(raw_instructions, list):
        instructions = []
        for step in raw_instructions:
            if isinstance(step, str):
                instructions.append(step.strip())
            elif isinstance(step, dict):
                text = step.get("text", step.get("name", "")).strip()
                if text:
                    instructions.append(text)
    else:
        instructions = [str(raw_instructions).strip()] if raw_instructions else []

    total_time_str = data.get("totalTime", "")
    total_time = None
    if total_time_str:
        m = re.search(r'PT(?:(\d+)H)?(?:(\d+)M)?', str(total_time_str))
        if m:
            hours = int(m.group(1) or 0)
            mins = int(m.group(2) or 0)
            total_time = hours * 60 + mins

    image = data.get("image")
    if isinstance(image, list):
        image = image[0] if image else None
    elif isinstance(image, dict):
        image = image.get("url")

    return normalize_recipe_scraper(
        title=title,
        ingredients=ingredients,
        instructions=instructions,
        image=image,
        total_time=total_time,
        yields=str(data.get("recipeYield", "")),
        cuisine=data.get("recipeCuisine"),
        source_url=url,
        category=source["category"],
        cuisine_type=source.get("cuisine_type"),
    )


def scrape_url(url: str, source: dict) -> Optional[dict]:
    headers = {"User-Agent": "Mozilla/5.0 (compatible; WhatsCookinBot/1.0; recipe aggregator)"}

    try:
        scraper = scrape_me(url, wild_mode=True)
        return normalize_recipe_scraper(
            title=scraper.title(),
            ingredients=scraper.ingredients(),
            instructions=scraper.instructions_list(),
            image=scraper.image(),
            total_time=scraper.total_time(),
            yields=scraper.yields(),
            cuisine=scraper.cuisine() if hasattr(scraper, "cuisine") else None,
            source_url=url,
            category=source["category"],
            cuisine_type=source.get("cuisine_type"),
        )
    except (WebsiteNotImplementedError, NoSchemaFoundInWildMode):
        pass
    except Exception as e:
        print(f"[scrape] recipe-scrapers failed for {url}: {e}")

    # Fallback: manual ld+json
    try:
        resp = requests.get(url, headers=headers, timeout=10)
        if resp.status_code in (403, 429):
            print(f"[scrape] {resp.status_code} blocked: {url}")
            return None
        resp.raise_for_status()
        ldjson = _extract_ldjson(resp.text)
        if ldjson:
            return _parse_ldjson_recipe(ldjson, url, source)
    except requests.RequestException as e:
        print(f"[scrape] HTTP error for {url}: {e}")

    print(f"[scrape] Could not extract recipe from: {url}")
    return None
