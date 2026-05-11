#!/usr/bin/env python3
"""
Batch import curated recipes from local CSV datasets into Supabase.

Run from the whatscooking/ root:
    python scripts/import_datasets.py
    python scripts/import_datasets.py --foodcom-limit 5000 --recipenlg-limit 5000
    python scripts/import_datasets.py --dry-run

Env vars (read from .env.local):
    NEXT_PUBLIC_SUPABASE_URL
    SUPABASE_SERVICE_ROLE_KEY  (preferred) or NEXT_PUBLIC_SUPABASE_ANON_KEY
"""

import csv
import json
import os
import re
import sys
import time
import argparse
from pathlib import Path

from dotenv import load_dotenv
from supabase import create_client, Client

load_dotenv(dotenv_path=".env.local")

SUPABASE_URL = os.getenv("NEXT_PUBLIC_SUPABASE_URL", "")
SUPABASE_KEY = (
    os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    or os.getenv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "")
)

BATCH_SIZE = 500
FOODCOM_CSV  = Path("datasets/foodcom/RAW_recipes.csv")
RECIPENLG_CSV = Path("datasets/recipenlg/RecipeNLG_dataset.csv")

CUISINE_MAP: dict[str, str] = {
    "north-american": "American",   "mexican": "Mexican",
    "italian": "Italian",           "french": "French",
    "chinese": "Chinese",           "japanese": "Japanese",
    "indian": "Indian",             "greek": "Greek",
    "spanish": "Spanish",           "thai": "Thai",
    "vietnamese": "Vietnamese",     "middle-eastern": "Middle Eastern",
    "african": "African",           "caribbean": "Caribbean",
    "german": "German",             "british": "British",
    "irish": "Irish",               "scandinavian": "Scandinavian",
    "portuguese": "Portuguese",     "brazilian": "Brazilian",
    "austrian": "Austrian",         "russian": "Russian",
    "korean": "Korean",             "moroccan": "Moroccan",
}

DIET_TAGS: set[str] = {
    "vegetarian", "vegan", "gluten-free", "dairy-free",
    "kosher", "halal", "low-carb", "keto",
}

DISH_TYPE_MAP: dict[str, str] = {
    "breakfast": "breakfast",       "brunch": "breakfast",
    "lunch": "lunch",               "dinner": "dinner",
    "desserts": "dessert",          "snacks": "snack",
    "beverages": "drink",           "drinks": "drink",
    "appetizers": "appetizer",      "side-dishes": "side dish",
    "main-dish": "main course",     "soups-stews": "soup",
    "breads": "bread",              "salads": "salad",
    "pasta": "pasta",               "sandwiches": "sandwich",
    "pizza": "pizza",
}

# Regex that extracts the content of any single- or double-quoted string
_QUOTED = re.compile(r"['\"]([^'\"]*)['\"]")
# Regex that extracts all numbers (int or float) from a string
_NUMBER = re.compile(r"[-+]?\d*\.?\d+")


def parse_python_list(s: str) -> list[str]:
    """Extract quoted string items from a Python list literal without executing code."""
    if not s:
        return []
    items = [m.strip() for m in _QUOTED.findall(s)]
    return [i for i in items if i]


def parse_number_list(s: str) -> list[float]:
    """Extract all numbers from a numeric list string like '[1.0, 2.5]'."""
    if not s:
        return []
    try:
        return [float(m) for m in _NUMBER.findall(s)]
    except ValueError:
        return []


def parse_tags(tags_raw: str) -> dict:
    """Extract cuisine_type, dietary_tags, dish_types from a Food.com tags string."""
    tags = [t.lower().strip() for t in parse_python_list(tags_raw)]
    cuisine  = next((CUISINE_MAP[t] for t in tags if t in CUISINE_MAP), None)
    dietary  = [t for t in tags if t in DIET_TAGS]
    dish     = list({DISH_TYPE_MAP[t] for t in tags if t in DISH_TYPE_MAP})
    return {"cuisine_type": cuisine, "dietary_tags": dietary, "dish_types": dish}


def parse_nutrition(nutrition_raw: str) -> dict:
    """Parse calories from a Food.com nutrition array (first element = kcal)."""
    nums = parse_number_list(nutrition_raw)
    if nums:
        return {"calories": int(round(nums[0]))}
    return {"calories": None}


def is_quality_foodcom(row: dict) -> bool:
    """Return True if the Food.com row meets minimum quality standards."""
    try:
        n_ing   = int(row.get("n_ingredients", 0))
        n_steps = int(row.get("n_steps", 0))
        minutes = int(row.get("minutes", 0))
        desc    = (row.get("description") or "").strip()
        return n_ing >= 5 and n_steps >= 3 and bool(desc) and 5 <= minutes <= 240
    except (ValueError, TypeError):
        return False


def map_foodcom_row(row: dict) -> dict | None:
    """Map a Food.com CSV row to a Supabase recipe dict. Returns None on quality failure."""
    if not is_quality_foodcom(row):
        return None

    steps           = parse_python_list(row.get("steps", ""))
    ingredients_raw = parse_python_list(row.get("ingredients", ""))

    if len(steps) < 3 or len(ingredients_raw) < 5:
        return None

    title = (row.get("name") or "").strip().title()
    if not title:
        return None

    tag_data  = parse_tags(row.get("tags", ""))
    nutrition = parse_nutrition(row.get("nutrition", ""))
    submitted = row.get("submitted", "")

    return {
        "source":           "dataset",
        "source_name":      "Food.com",
        "source_url":       f"https://www.food.com/recipe/{row['id']}",
        "dataset_name":     "foodcom",
        "title":            title,
        "description":      (row.get("description") or "").strip() or None,
        "image_url":        None,
        "cuisine_type":     tag_data["cuisine_type"],
        "dietary_tags":     tag_data["dietary_tags"],
        "dish_types":       tag_data["dish_types"],
        "ingredients":      [{"name": ing} for ing in ingredients_raw],
        "instructions":     steps,
        "cook_time_minutes": int(row.get("minutes", 0)) or None,
        "prep_time_minutes": None,
        "servings":          None,
        "calories":          nutrition["calories"],
        "created_at":        f"{submitted}T00:00:00Z" if submitted else None,
    }


def is_quality_recipenlg(row: dict) -> bool:
    """Return True if the RecipeNLG row meets minimum quality standards."""
    title = (row.get("title") or "").strip()
    if len(title) < 5:
        return False
    try:
        ings = json.loads(row.get("ingredients", "[]"))
        dirs = json.loads(row.get("directions", "[]"))
        return len(ings) >= 4 and len(dirs) >= 2
    except (json.JSONDecodeError, ValueError):
        return False


def map_recipenlg_row(row: dict) -> dict | None:
    """Map a RecipeNLG CSV row to a Supabase recipe dict. Returns None on quality failure."""
    if not is_quality_recipenlg(row):
        return None

    try:
        ingredients_raw = json.loads(row.get("ingredients", "[]"))
        directions      = json.loads(row.get("directions",   "[]"))
    except json.JSONDecodeError:
        return None

    source_url = (row.get("link") or "").strip() or None
    if not source_url:
        return None

    return {
        "source":           "dataset",
        "source_name":      row.get("source") or "RecipeNLG",
        "source_url":       source_url,
        "dataset_name":     "recipenlg",
        "title":            (row.get("title") or "").strip(),
        "description":      None,
        "image_url":        None,
        "cuisine_type":     None,
        "dietary_tags":     [],
        "dish_types":       [],
        "ingredients":      [{"name": ing} for ing in ingredients_raw],
        "instructions":     [str(d) for d in directions],
        "cook_time_minutes": None,
        "prep_time_minutes": None,
        "servings":          None,
        "calories":          None,
    }


def batch_upsert(supabase: Client, rows: list[dict]) -> int:
    """Upsert rows into Supabase recipes table. Returns count of rows processed."""
    if not rows:
        return 0
    try:
        result = (
            supabase.table("recipes")
            .upsert(rows, ignore_duplicates=True)
            .execute()
        )
        return len(result.data)
    except Exception as e:
        print(f"  [ERROR] batch upsert: {e}")
        return 0


def import_foodcom(supabase: Client, limit: int, dry_run: bool) -> int:
    print(f"\n=== Food.com import (limit={limit:,}) ===")
    total_imported = total_processed = total_filtered = 0
    batch: list[dict] = []
    seen_titles: set[str] = set()

    with open(FOODCOM_CSV, encoding="utf-8", errors="replace") as f:
        reader = csv.DictReader(f)
        for row in reader:
            if total_imported >= limit:
                break
            total_processed += 1
            recipe = map_foodcom_row(row)

            if recipe is None:
                total_filtered += 1
                continue

            title_key = recipe["title"].lower()
            if title_key in seen_titles:
                total_filtered += 1
                continue
            seen_titles.add(title_key)
            batch.append(recipe)

            if len(batch) >= BATCH_SIZE:
                if dry_run:
                    total_imported += len(batch)
                    print(f"  [dry-run] {total_imported:,} so far")
                else:
                    n = batch_upsert(supabase, batch)
                    total_imported += n
                    print(f"  upserted {n}/{len(batch)} — total {total_imported:,}")
                batch = []
                time.sleep(0.1)

    if batch and total_imported < limit:
        if dry_run:
            total_imported += len(batch)
        else:
            total_imported += batch_upsert(supabase, batch)

    print(f"Food.com done — processed={total_processed:,} filtered={total_filtered:,} imported={total_imported:,}")
    return total_imported


def import_recipenlg(supabase: Client, limit: int, dry_run: bool) -> int:
    print(f"\n=== RecipeNLG import (limit={limit:,}) ===")
    total_imported = total_processed = total_filtered = 0
    batch: list[dict] = []
    seen_urls: set[str] = set()

    with open(RECIPENLG_CSV, encoding="utf-8", errors="replace") as f:
        reader = csv.DictReader(f)
        for row in reader:
            if total_imported >= limit:
                break
            total_processed += 1
            recipe = map_recipenlg_row(row)

            if recipe is None:
                total_filtered += 1
                continue

            url = recipe["source_url"]
            if url in seen_urls:
                total_filtered += 1
                continue
            seen_urls.add(url)
            batch.append(recipe)

            if len(batch) >= BATCH_SIZE:
                if dry_run:
                    total_imported += len(batch)
                    print(f"  [dry-run] {total_imported:,} so far")
                else:
                    n = batch_upsert(supabase, batch)
                    total_imported += n
                    print(f"  upserted {n}/{len(batch)} — total {total_imported:,}")
                batch = []
                time.sleep(0.1)

    if batch and total_imported < limit:
        if dry_run:
            total_imported += len(batch)
        else:
            total_imported += batch_upsert(supabase, batch)

    print(f"RecipeNLG done — processed={total_processed:,} filtered={total_filtered:,} imported={total_imported:,}")
    return total_imported


def main() -> None:
    parser = argparse.ArgumentParser(description="Import recipe datasets into Supabase")
    parser.add_argument("--foodcom-limit",   type=int, default=15000)
    parser.add_argument("--recipenlg-limit", type=int, default=15000)
    parser.add_argument("--dry-run", action="store_true",
                        help="Parse and count without writing to Supabase")
    args = parser.parse_args()

    if not SUPABASE_URL or not SUPABASE_KEY:
        print("ERROR: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY must be in .env.local")
        sys.exit(1)

    supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
    total  = import_foodcom(supabase, args.foodcom_limit, args.dry_run)
    total += import_recipenlg(supabase, args.recipenlg_limit, args.dry_run)
    print(f"\n=== Complete: {total:,} total recipes ===")


if __name__ == "__main__":
    main()
