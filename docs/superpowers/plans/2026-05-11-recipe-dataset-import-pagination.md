# Recipe Dataset Import + Pagination Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Import ~30k curated recipes from two local CSV datasets (Food.com + RecipeNLG) into Supabase and replace the hard-capped 500-row grid with a server-side paginated "Load More" interface.

**Architecture:** A Python script reads both CSVs, applies quality filters, maps fields to the `recipes` schema, and batch-upserts to Supabase using `source_url` as the conflict key. A new Next.js API route serves paginated, server-filtered recipe lists. `AllRecipesClient` fetches from this route instead of filtering 500 rows in memory.

**Tech Stack:** Python 3.11+, supabase-py, python-dotenv, csv (stdlib), re (stdlib), json (stdlib), Next.js App Router API routes, Supabase PostgreSQL (`.ilike`, `.contains`, `.range`)

---

## File Map

| File | Action | Responsibility |
|---|---|---|
| `supabase/migrations/20260511_source_url_unique.sql` | Create | Unique index on `source_url` for idempotent upserts |
| `scripts/__init__.py` | Create | Makes scripts/ a package so tests can import it |
| `scripts/import_datasets.py` | Create | Full ingestion script: parse, filter, map, upsert both datasets |
| `tests/test_import_datasets.py` | Create | Unit tests for all pure mapping/filter functions |
| `src/app/api/recipes/list/route.ts` | Create | Paginated + filtered recipe list API |
| `src/app/(app)/discover/page.tsx` | Modify | Reduce gridRecipes limit to 50, pass total count |
| `src/app/(app)/discover/discover-feed-client.tsx` | Modify | Thread `gridTotal` prop through to AllRecipesClient |
| `src/app/(app)/recipes/all-recipes-client.tsx` | Modify | Server-side filters, Load More pagination |
| `src/app/(app)/recipes/[id]/page.tsx` | Modify | Skip live scrape for dataset-sourced recipes |

---

## Task 1: Supabase Migration — Unique Index on source_url

**Files:**
- Create: `supabase/migrations/20260511_source_url_unique.sql`

- [ ] **Step 1: Create the migration file**

```sql
-- Unique index on source_url to enable idempotent dataset upserts.
-- Partial index (WHERE source_url IS NOT NULL) so NULLs don't conflict.
CREATE UNIQUE INDEX IF NOT EXISTS recipes_source_url_unique
  ON recipes (source_url)
  WHERE source_url IS NOT NULL;
```

- [ ] **Step 2: Run it in the Supabase SQL Editor**

Open the Supabase dashboard → SQL Editor → paste and run. Verify with:

```sql
SELECT indexname FROM pg_indexes
WHERE tablename = 'recipes' AND indexname = 'recipes_source_url_unique';
```

Expected: one row returned.

- [ ] **Step 3: Verify dataset columns exist**

```sql
SELECT column_name FROM information_schema.columns
WHERE table_name = 'recipes' AND column_name IN ('dataset_name', 'source_name');
```

Expected: two rows. If `dataset_name` is missing, run `supabase/migrations/20260511_dataset_source.sql` first (it already exists in the repo).

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/20260511_source_url_unique.sql
git commit -m "feat(db): unique index on recipes.source_url for idempotent dataset upserts"
```

---

## Task 2: Unit Tests for Import Functions

**Files:**
- Create: `tests/test_import_datasets.py`

Write all tests before writing the script — they will fail until Task 3.

- [ ] **Step 1: Create the test file**

```python
# tests/test_import_datasets.py
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

import scripts.import_datasets as imp


class TestParsePythonList:
    def test_parses_valid_list(self):
        assert imp.parse_python_list("['a', 'b', 'c']") == ["a", "b", "c"]

    def test_returns_empty_on_garbage(self):
        assert imp.parse_python_list("not a list") == []

    def test_returns_empty_on_empty_string(self):
        assert imp.parse_python_list("") == []

    def test_strips_whitespace_from_items(self):
        assert imp.parse_python_list("['  flour  ', 'sugar']") == ["flour", "sugar"]


class TestParseNumberList:
    def test_parses_float_list(self):
        result = imp.parse_number_list("[215.7, 7.0, 4.0, 0.0, 15.0, 3.0, 22.0]")
        assert len(result) == 7
        assert abs(result[0] - 215.7) < 0.01

    def test_empty_string(self):
        assert imp.parse_number_list("") == []


class TestParseTags:
    def test_extracts_cuisine(self):
        result = imp.parse_tags("['italian', 'pasta', 'dinner']")
        assert result["cuisine_type"] == "Italian"

    def test_extracts_diet_tags(self):
        result = imp.parse_tags("['vegetarian', 'gluten-free', 'quick']")
        assert "vegetarian" in result["dietary_tags"]
        assert "gluten-free" in result["dietary_tags"]

    def test_extracts_dish_types(self):
        result = imp.parse_tags("['breakfast', 'quick', 'easy']")
        assert "breakfast" in result["dish_types"]

    def test_no_match_returns_none_cuisine(self):
        result = imp.parse_tags("['easy', 'quick', 'weeknight']")
        assert result["cuisine_type"] is None
        assert result["dietary_tags"] == []

    def test_north_american_maps_to_american(self):
        result = imp.parse_tags("['north-american', 'dinner']")
        assert result["cuisine_type"] == "American"


class TestParseNutrition:
    def test_extracts_calories(self):
        result = imp.parse_nutrition("[215.7, 7.0, 4.0, 0.0, 15.0, 3.0, 22.0]")
        assert result["calories"] == 216

    def test_rounds_calories(self):
        result = imp.parse_nutrition("[100.4, 0, 0, 0, 0, 0, 0]")
        assert result["calories"] == 100

    def test_bad_input_returns_none(self):
        result = imp.parse_nutrition("garbage")
        assert result["calories"] is None


class TestIsQualityFoodcom:
    def _row(self, **overrides):
        base = {
            "n_ingredients": "8",
            "n_steps": "5",
            "minutes": "30",
            "description": "A great recipe for everyone",
        }
        return {**base, **overrides}

    def test_passes_quality_row(self):
        assert imp.is_quality_foodcom(self._row()) is True

    def test_fails_too_few_ingredients(self):
        assert imp.is_quality_foodcom(self._row(n_ingredients="3")) is False

    def test_fails_too_few_steps(self):
        assert imp.is_quality_foodcom(self._row(n_steps="2")) is False

    def test_fails_no_description(self):
        assert imp.is_quality_foodcom(self._row(description="")) is False

    def test_fails_too_long(self):
        assert imp.is_quality_foodcom(self._row(minutes="300")) is False

    def test_fails_too_short(self):
        assert imp.is_quality_foodcom(self._row(minutes="2")) is False


class TestMapFoodcomRow:
    def _good_row(self):
        return {
            "name": "chocolate chip cookies",
            "id": "12345",
            "minutes": "45",
            "submitted": "2020-03-15",
            "tags": "['north-american', 'desserts', 'vegetarian']",
            "nutrition": "[250.0, 10.0, 5.0, 2.0, 4.0, 3.0, 8.0]",
            "n_steps": "6",
            "steps": "['preheat oven', 'mix butter and sugar', 'add eggs', 'add flour', 'bake 12 min', 'cool on rack']",
            "description": "Classic chewy cookies everyone loves",
            "ingredients": "['butter', 'sugar', 'eggs', 'flour', 'chocolate chips', 'vanilla', 'baking soda']",
            "n_ingredients": "7",
        }

    def test_maps_title_to_title_case(self):
        result = imp.map_foodcom_row(self._good_row())
        assert result is not None
        assert result["title"] == "Chocolate Chip Cookies"

    def test_sets_source_fields(self):
        result = imp.map_foodcom_row(self._good_row())
        assert result["source"] == "dataset"
        assert result["source_name"] == "Food.com"
        assert result["source_url"] == "https://www.food.com/recipe/12345"

    def test_maps_ingredients_as_name_dicts(self):
        result = imp.map_foodcom_row(self._good_row())
        assert result["ingredients"][0] == {"name": "butter"}
        assert len(result["ingredients"]) == 7

    def test_maps_calories_from_nutrition_first_element(self):
        result = imp.map_foodcom_row(self._good_row())
        assert result["calories"] == 250

    def test_returns_none_for_low_quality(self):
        row = self._good_row()
        row["n_ingredients"] = "2"
        assert imp.map_foodcom_row(row) is None


class TestIsQualityRecipeNLG:
    def test_passes_good_row(self):
        row = {
            "title": "No-Bake Nut Cookies",
            "ingredients": '["brown sugar", "milk", "vanilla", "nuts", "butter"]',
            "directions": '["Mix ingredients.", "Drop on wax paper.", "Let set 30 minutes."]',
        }
        assert imp.is_quality_recipenlg(row) is True

    def test_fails_short_title(self):
        row = {
            "title": "Cake",
            "ingredients": '["a", "b", "c", "d", "e"]',
            "directions": '["step1", "step2"]',
        }
        assert imp.is_quality_recipenlg(row) is False

    def test_fails_too_few_ingredients(self):
        row = {
            "title": "Simple Recipe Thing",
            "ingredients": '["a", "b"]',
            "directions": '["step1", "step2"]',
        }
        assert imp.is_quality_recipenlg(row) is False


class TestMapRecipeNLGRow:
    def _good_row(self):
        return {
            "title": "No-Bake Nut Cookies",
            "ingredients": '["1 c. brown sugar", "1/2 c. milk", "1/2 tsp. vanilla", "1/2 c. nuts", "2 Tbsp. butter", "3 c. rice biscuits"]',
            "directions": '["Mix brown sugar and milk.", "Boil 5 minutes.", "Add vanilla and cereal.", "Drop on wax paper."]',
            "link": "https://www.cookbooks.com/Recipe-Details.aspx?id=44874",
            "source": "Gathered",
        }

    def test_maps_core_fields(self):
        result = imp.map_recipenlg_row(self._good_row())
        assert result is not None
        assert result["title"] == "No-Bake Nut Cookies"
        assert result["source"] == "dataset"
        assert result["source_url"] == "https://www.cookbooks.com/Recipe-Details.aspx?id=44874"

    def test_ingredients_wrapped_as_name_dicts(self):
        result = imp.map_recipenlg_row(self._good_row())
        assert result["ingredients"][0] == {"name": "1 c. brown sugar"}

    def test_returns_none_without_link(self):
        row = self._good_row()
        row["link"] = ""
        assert imp.map_recipenlg_row(row) is None
```

- [ ] **Step 2: Run tests to confirm they all fail (module not found)**

```bash
cd C:\Users\lasse\Desktop\whatscooking
python -m pytest tests/test_import_datasets.py -v 2>&1 | head -10
```

Expected: `ModuleNotFoundError: No module named 'scripts.import_datasets'`

- [ ] **Step 3: Commit the test file**

```bash
git add tests/test_import_datasets.py
git commit -m "test(import): unit tests for dataset mapping and quality filter functions"
```

---

## Task 3: Import Script

**Files:**
- Create: `scripts/__init__.py`
- Create: `scripts/import_datasets.py`

- [ ] **Step 1: Create `scripts/__init__.py`**

```python
```

(Empty file — makes `scripts/` importable as a package.)

- [ ] **Step 2: Create `scripts/import_datasets.py`**

```python
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
            .upsert(rows, on_conflict="source_url", ignore_duplicates=True)
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
```

- [ ] **Step 3: Run the unit tests — all should pass now**

```bash
cd C:\Users\lasse\Desktop\whatscooking
python -m pytest tests/test_import_datasets.py -v
```

Expected: all tests `PASSED`.

- [ ] **Step 4: Dry-run against the real CSVs**

```bash
python scripts/import_datasets.py --foodcom-limit 1000 --recipenlg-limit 1000 --dry-run
```

Expected: prints `[dry-run]` batch lines, ends with `=== Complete: ~2,000 total recipes ===`. Exact number varies based on quality filter pass rate. No Supabase writes.

- [ ] **Step 5: Commit**

```bash
git add scripts/__init__.py scripts/import_datasets.py tests/test_import_datasets.py
git commit -m "feat(import): curated recipe batch importer from Food.com + RecipeNLG datasets"
```

---

## Task 4: Run the Full Import

- [ ] **Step 1: Confirm supabase-py is installed**

```bash
pip show supabase
```

If missing:

```bash
pip install supabase python-dotenv
```

- [ ] **Step 2: Run the full import**

```bash
cd C:\Users\lasse\Desktop\whatscooking
python scripts/import_datasets.py --foodcom-limit 15000 --recipenlg-limit 15000
```

Takes 5–15 minutes. Watch for `[ERROR]` lines — if frequent, check the unique index from Task 1 is applied.

- [ ] **Step 3: Verify counts in Supabase SQL Editor**

```sql
SELECT dataset_name, COUNT(*) AS cnt
FROM recipes
WHERE source = 'dataset'
GROUP BY dataset_name
ORDER BY cnt DESC;
```

Expected: two rows — `foodcom` and `recipenlg`, each with thousands of records.

- [ ] **Step 4: Spot-check a Food.com recipe**

```sql
SELECT id, title, cuisine_type, calories,
       array_length(instructions, 1) AS steps,
       jsonb_array_length(ingredients)   AS ings
FROM recipes
WHERE dataset_name = 'foodcom'
LIMIT 5;
```

Expected: `steps >= 3`, `ings >= 5`, `calories` populated for most rows.

---

## Task 5: Paginated List API Route

**Files:**
- Create: `src/app/api/recipes/list/route.ts`

- [ ] **Step 1: Create the route**

```typescript
// src/app/api/recipes/list/route.ts
import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;

  const page       = Math.max(0, parseInt(searchParams.get("page")  ?? "0"));
  const limit      = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "50")));
  const search     = searchParams.get("search")?.trim()     ?? "";
  const cuisine    = searchParams.get("cuisine")?.trim()    ?? "";
  const tags       = searchParams.get("tags")?.trim()       ?? "";
  const difficulty = searchParams.get("difficulty")?.trim() ?? "";
  const maxTime    = parseInt(searchParams.get("maxTime")   ?? "0") || 0;

  const supabase = await createClient();

  let query = supabase
    .from("recipes")
    .select(
      "id, title, description, image_url, cuisine_type, dish_types, dietary_tags, " +
      "prep_time_minutes, cook_time_minutes, difficulty_level, required_utensils",
      { count: "exact" }
    )
    .or('dish_types.is.null,dish_types.not.cs.{"hack"}')
    .or('dish_types.is.null,dish_types.not.cs.{"premium"}')
    .order("created_at", { ascending: false })
    .range(page * limit, (page + 1) * limit - 1);

  if (search)     query = query.ilike("title", `%${search}%`);
  if (cuisine)    query = query.eq("cuisine_type", cuisine);
  if (difficulty) query = query.eq("difficulty_level", difficulty);
  if (maxTime > 0) query = query.lte("cook_time_minutes", maxTime);

  if (tags) {
    for (const tag of tags.split(",").filter(Boolean)) {
      query = query.contains("dietary_tags", [tag]);
    }
  }

  const { data, count, error } = await query;

  if (error) {
    console.error("[recipes/list]", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    recipes: data ?? [],
    total:   count ?? 0,
    page,
    hasMore: (page + 1) * limit < (count ?? 0),
  });
}
```

- [ ] **Step 2: Smoke test — basic list**

With dev server running:

```
http://localhost:3002/api/recipes/list?page=0&limit=5
```

Expected:
```json
{ "recipes": [...5 items...], "total": 30000, "page": 0, "hasMore": true }
```

- [ ] **Step 3: Smoke test — search filter**

```
http://localhost:3002/api/recipes/list?search=pasta&limit=5
```

Expected: all `recipes[*].title` contain "pasta" (case-insensitive).

- [ ] **Step 4: Commit**

```bash
git add src/app/api/recipes/list/route.ts
git commit -m "feat(api): paginated recipe list route with server-side search and filters"
```

---

## Task 6: Update Discover Page + Feed Client

**Files:**
- Modify: `src/app/(app)/discover/page.tsx`
- Modify: `src/app/(app)/discover/discover-feed-client.tsx`

- [ ] **Step 1: Update gridRecipes query in `discover/page.tsx`**

Find the Promise.all array entry for gridRecipes (around line 82):

```typescript
    supabase
      .from("recipes")
      .select("id, title, description, image_url, cuisine_type, dish_types, dietary_tags, prep_time_minutes, cook_time_minutes, difficulty_level")
      .or('dish_types.is.null,dish_types.not.cs.{"hack"}')
      .or('dish_types.is.null,dish_types.not.cs.{"premium"}')
      .order("created_at", { ascending: false })
      .limit(500),
```

Replace with:

```typescript
    supabase
      .from("recipes")
      .select("id, title, description, image_url, cuisine_type, dish_types, dietary_tags, prep_time_minutes, cook_time_minutes, difficulty_level", { count: "exact" })
      .or('dish_types.is.null,dish_types.not.cs.{"hack"}')
      .or('dish_types.is.null,dish_types.not.cs.{"premium"}')
      .order("created_at", { ascending: false })
      .limit(50),
```

- [ ] **Step 2: Capture the count from destructuring**

Change line ~47 from:

```typescript
    { data: gridRecipes },
```

To:

```typescript
    { data: gridRecipes, count: gridTotal },
```

- [ ] **Step 3: Pass `gridTotal` to `DiscoverFeedClient`**

In the return statement, add the new prop:

```typescript
  return (
    <DiscoverFeedClient
      swipeRecipes={swipeRecipes ?? []}
      trendingRecipes={trendingRaw ?? []}
      trendingTotal={trendingTotal ?? 0}
      pantryMatches={topPantryMatches}
      pantryMatchTotal={allPantryMatches.length}
      pantryItemCount={pantryNames.length}
      quickRecipes={quickRecipes}
      cuisines={cuisines}
      gridRecipes={gridRecipes ?? []}
      gridTotal={gridTotal ?? 0}
      pantryNames={pantryNames}
      isLoggedIn={!!user}
    />
  );
```

- [ ] **Step 4: Update `Props` interface in `discover-feed-client.tsx`**

Add `gridTotal: number` to the Props interface:

```typescript
interface Props {
  swipeRecipes: SwipeRecipe[];
  trendingRecipes: TrendingRecipe[];
  trendingTotal: number;
  pantryMatches: PantryMatch[];
  pantryMatchTotal: number;
  pantryItemCount: number;
  quickRecipes: QuickRecipe[];
  cuisines: CuisineInfo[];
  gridRecipes: GridRecipe[];
  gridTotal: number;
  pantryNames: string[];
  isLoggedIn: boolean;
}
```

Add `gridTotal` to the destructure and pass it to `AllRecipesClient`:

```typescript
export function DiscoverFeedClient({
  swipeRecipes,
  trendingRecipes,
  trendingTotal,
  pantryMatches,
  pantryMatchTotal,
  pantryItemCount,
  quickRecipes,
  cuisines,
  gridRecipes,
  gridTotal,
  pantryNames: _pantryNames,
  isLoggedIn,
}: Props) {
```

Find where `AllRecipesClient` is rendered and update:

```typescript
<AllRecipesClient recipes={gridRecipes} total={gridTotal} />
```

- [ ] **Step 5: Commit**

```bash
git add src/app/(app)/discover/page.tsx src/app/(app)/discover/discover-feed-client.tsx
git commit -m "feat(discover): reduce initial grid to 50 recipes, pass total count for pagination"
```

---

## Task 7: Rework AllRecipesClient — Load More + Server-side Filters

**Files:**
- Modify: `src/app/(app)/recipes/all-recipes-client.tsx`

- [ ] **Step 1: Update imports and component signature**

At the top of the file, ensure `useRef` and `useCallback` are imported:

```typescript
import { useState, useMemo, useRef, useCallback } from "react";
```

Change the export signature from:

```typescript
export function AllRecipesClient({ recipes }: { recipes: Recipe[] }) {
```

To:

```typescript
export function AllRecipesClient({
  recipes: initialRecipes,
  total: initialTotal,
}: {
  recipes: Recipe[];
  total: number;
}) {
```

- [ ] **Step 2: Add server-side state and fetchRecipes**

After the existing `useState` calls, add:

```typescript
  const [displayedRecipes, setDisplayedRecipes] = useState<Recipe[]>(initialRecipes);
  const [page, setPage]     = useState(0);
  const [total, setTotal]   = useState(initialTotal);
  const [hasMore, setHasMore] = useState(initialTotal > initialRecipes.length);
  const [isLoading, setIsLoading] = useState(false);
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchRecipes = useCallback(async (opts: {
    page: number;
    search: string;
    tags: Set<string>;
    diets: Set<string>;
    difficulty: string | null;
    append: boolean;
  }) => {
    setIsLoading(true);
    const params = new URLSearchParams({ page: String(opts.page), limit: "50" });
    if (opts.search.trim()) params.set("search", opts.search.trim());
    if (opts.difficulty)    params.set("difficulty", opts.difficulty);
    const allTags = [...opts.tags, ...opts.diets].filter(Boolean);
    if (allTags.length)     params.set("tags", allTags.join(","));

    try {
      const res = await fetch(`/api/recipes/list?${params}`);
      if (!res.ok) throw new Error("fetch failed");
      const json = await res.json();
      const fetched: Recipe[] = json.recipes ?? [];
      setDisplayedRecipes(prev => opts.append ? [...prev, ...fetched] : fetched);
      setTotal(json.total ?? 0);
      setHasMore(json.hasMore ?? false);
      setPage(opts.page);
    } catch {
      // Keep existing recipes on network failure
    } finally {
      setIsLoading(false);
    }
  }, []);
```

- [ ] **Step 3: Remove the `tagCounts` / `getTagCount` useMemo and `filtered` useMemo**

Delete the `tagCounts` useMemo block, the `getTagCount` function, and the `filtered` useMemo block entirely.

Add this in their place (utensil filter stays client-side on the loaded set):

```typescript
  const localFiltered = useMemo(() => {
    if (utensilFilters.length === 0 || utensilMode !== "positive") return displayedRecipes;
    return displayedRecipes.filter((r) =>
      utensilFilters.some((u) =>
        (r.required_utensils ?? []).some((ru) => ru.toLowerCase().includes(u.toLowerCase()))
      )
    );
  }, [displayedRecipes, utensilFilters, utensilMode]);
```

Replace every reference to `filtered` in the JSX with `localFiltered`.

- [ ] **Step 4: Wire filter toggles to fetchRecipes**

Replace the existing `toggleTag` and `toggleDiet` functions:

```typescript
  const toggleTag = (tag: string) => {
    setActiveTags((prev) => {
      const next = new Set(prev);
      next.has(tag) ? next.delete(tag) : next.add(tag);
      fetchRecipes({ page: 0, search: query, tags: next, diets: activeDiets, difficulty: activeDifficulty, append: false });
      return next;
    });
  };

  const toggleDiet = (diet: string) => {
    setActiveDiets((prev) => {
      const next = new Set(prev);
      next.has(diet) ? next.delete(diet) : next.add(diet);
      fetchRecipes({ page: 0, search: query, tags: activeTags, diets: next, difficulty: activeDifficulty, append: false });
      return next;
    });
  };
```

Find every difficulty button's `onClick` and replace with:

```typescript
onClick={() => {
  const next = activeDifficulty === d ? null : d;
  setActiveDifficulty(next);
  fetchRecipes({ page: 0, search: query, tags: activeTags, diets: activeDiets, difficulty: next, append: false });
}}
```

- [ ] **Step 5: Add debounced search**

Replace the search `onChange`:

```typescript
onChange={(e) => {
  const val = e.target.value;
  setQuery(val);
  if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
  searchTimerRef.current = setTimeout(() => {
    fetchRecipes({ page: 0, search: val, tags: activeTags, diets: activeDiets, difficulty: activeDifficulty, append: false });
  }, 300);
}}
```

- [ ] **Step 6: Update clearAll**

```typescript
  const clearAll = () => {
    setActiveTags(new Set());
    setActiveDiets(new Set());
    setActiveDifficulty(null);
    setQuery("");
    setUtensilFilters([]);
    setDisplayedRecipes(initialRecipes);
    setTotal(initialTotal);
    setHasMore(initialTotal > initialRecipes.length);
    setPage(0);
  };
```

- [ ] **Step 7: Update header count display**

Find:

```typescript
{recipes.length.toLocaleString()} recipes &middot; {filtered.length.toLocaleString()} showing
```

Replace with:

```typescript
{total.toLocaleString()} recipes &middot; {localFiltered.length.toLocaleString()} showing
```

Remove the `{0}` count from `TagPill` calls (replace `count={getTagCount(tag)}` with `count={0}` — tag counts per category are no longer meaningful at 30k scale).

- [ ] **Step 8: Add Load More button after the recipe grid**

Find the closing div of the recipe grid (after the map of `RecipeCard` / list items) and add:

```typescript
      {/* ── Load More ── */}
      {hasMore && (
        <div className="px-6 py-8 flex justify-center">
          <button
            type="button"
            disabled={isLoading}
            onClick={() => fetchRecipes({
              page: page + 1,
              search: query,
              tags: activeTags,
              diets: activeDiets,
              difficulty: activeDifficulty,
              append: true,
            })}
            className="px-8 py-3 rounded-2xl text-sm font-semibold transition-all disabled:opacity-50"
            style={{
              background: "rgba(90,50,20,0.3)",
              color: "#C8A882",
              border: "1px solid rgba(90,50,20,0.5)",
            }}
          >
            {isLoading ? "Loading…" : "Load 50 more recipes"}
          </button>
        </div>
      )}
      {!hasMore && displayedRecipes.length > 50 && (
        <p className="py-6 text-center text-sm" style={{ color: "#4A3020" }}>
          All {total.toLocaleString()} recipes shown
        </p>
      )}
```

- [ ] **Step 9: Manual test checklist**

Open `http://localhost:3002/discover`, scroll to "All Recipes":
- [ ] Total count shows imported recipe count (e.g. "30,000 recipes")
- [ ] Search "pasta" — grid updates after ~300ms with pasta recipes
- [ ] "Load 50 more recipes" button appears; clicking it appends new cards
- [ ] Click "vegetarian" filter — grid resets, shows only vegetarian recipes
- [ ] Click "Clear" — grid resets to initial 50 recipes
- [ ] Opening any recipe card navigates to `/recipes/[id]` with full ingredients + instructions

- [ ] **Step 10: Commit**

```bash
git add src/app/(app)/recipes/all-recipes-client.tsx
git commit -m "feat(recipes): server-side filtered Load More pagination in AllRecipesClient"
```

---

## Task 8: Scrape Guard for Dataset Recipes

**Files:**
- Modify: `src/app/(app)/recipes/[id]/page.tsx`

- [ ] **Step 1: Add `isDatasetRecipe` guard**

Find this block (around line 32):

```typescript
  const isPremiumOrHack = (recipe.dish_types ?? []).some((t: string) => t === "premium" || t === "hack");
  const hasFullContent = ((recipe.instructions as string[] | null)?.length ?? 0) >= 2
    && ((recipe.ingredients as unknown[] | null)?.length ?? 0) >= 3;

  let recipeData = recipe;
  if (isPremiumOrHack && !hasFullContent) {
    const extracted = await extractAndSaveRecipe(id);
    if (extracted) recipeData = extracted as typeof recipe;
  }
```

Replace with:

```typescript
  const isPremiumOrHack = (recipe.dish_types ?? []).some((t: string) => t === "premium" || t === "hack");
  const hasFullContent = ((recipe.instructions as string[] | null)?.length ?? 0) >= 2
    && ((recipe.ingredients as unknown[] | null)?.length ?? 0) >= 3;
  const isDatasetRecipe = recipe.source === "dataset";

  let recipeData = recipe;
  if (isPremiumOrHack && !hasFullContent && !isDatasetRecipe) {
    const extracted = await extractAndSaveRecipe(id);
    if (extracted) recipeData = extracted as typeof recipe;
  }
```

- [ ] **Step 2: Verify in browser**

Get a dataset recipe ID from SQL Editor:

```sql
SELECT id, title FROM recipes WHERE dataset_name = 'foodcom' LIMIT 1;
```

Open `http://localhost:3002/recipes/<id>`. Page renders with full ingredients and instructions. No `[extract]` log in the dev server terminal.

- [ ] **Step 3: Commit**

```bash
git add src/app/(app)/recipes/[id]/page.tsx
git commit -m "fix(recipe-page): skip live scrape for dataset-sourced recipes"
```

---

## Self-Review

**Spec coverage:**
- ✅ ~30k curated recipes imported — Tasks 3–4 (15k Food.com + 15k RecipeNLG)
- ✅ Food.com quality filters (≥5 ing, ≥3 steps, description, 5–240 min) — Task 3 `is_quality_foodcom`
- ✅ RecipeNLG quality filters (≥4 ing, ≥2 directions, title ≥5 chars) — Task 3 `is_quality_recipenlg`
- ✅ `source_url` unique index — Task 1
- ✅ Idempotent upserts — Task 3 `batch_upsert` with `on_conflict="source_url"`
- ✅ `/api/recipes/list` with search, tags, difficulty, cuisine — Task 5
- ✅ 50 recipes per page, Load More button — Tasks 6–7
- ✅ Server-side filtering replaces in-memory 500-row filter — Task 7
- ✅ Total count shown in UI — Tasks 6–7
- ✅ No recipe page changes needed for layout — confirmed (page already complete)
- ✅ Scrape guard for dataset recipes — Task 8
- ✅ Utensil filter preserved as client-side — Task 7 `localFiltered`

**Type consistency:** `Recipe` type in `all-recipes-client.tsx` retains `required_utensils?: string[] | null`. `fetchRecipes` opts are inline-typed and used consistently across all four call sites (toggleTag, toggleDiet, difficulty, Load More, clearAll).

**No placeholders:** All tasks contain complete runnable code and exact commands with expected output.
