# Recipe Ingestion Engine Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Python pipeline that discovers recipe URLs via Google CSE + DuckDuckGo, scrapes structured recipe data, and upserts it into the Supabase `recipes` table — running automatically every Monday via GitHub Actions.

**Architecture:** `main.py` orchestrates three modules: `discover.py` (URL discovery via search APIs), `scrape.py` (extraction via `recipe-scrapers` + `ld+json` fallback), and `ingest.py` (Supabase upsert keyed on `source_url`). Sources are declared in `sources.py` as a plain list — add an entry, commit, and it takes effect next Monday.

**Tech Stack:** Python 3.11, `recipe-scrapers`, `duckduckgo-search`, `google-api-python-client`, `supabase` (Python client), `pytest`, GitHub Actions

---

## File Map

| File | Responsibility |
|---|---|
| `scripts/ingestion/sources.py` | Source config list (domain, category, search queries) |
| `scripts/ingestion/discover.py` | URL discovery: Google CSE then DDG fallback |
| `scripts/ingestion/scrape.py` | Scrape URL → normalized recipe dict |
| `scripts/ingestion/ingest.py` | Upsert recipe dicts into Supabase |
| `scripts/ingestion/main.py` | Orchestrator: load sources → discover → scrape → ingest |
| `scripts/ingestion/requirements.txt` | Python dependencies |
| `scripts/ingestion/tests/test_scrape.py` | Unit tests for normalizer |
| `scripts/ingestion/tests/test_ingest.py` | Unit tests for ingest dedup logic |
| `.github/workflows/weekly-scrape.yml` | Cron job + reminder Issue |

---

## Task 1: Directory structure + requirements.txt

**Files:**
- Create: `scripts/ingestion/requirements.txt`
- Create: `scripts/ingestion/tests/__init__.py`

- [ ] **Step 1: Create directory structure**

```bash
mkdir -p scripts/ingestion/tests
touch scripts/ingestion/__init__.py
touch scripts/ingestion/tests/__init__.py
```

- [ ] **Step 2: Create requirements.txt**

```
recipe-scrapers==15.5.0
duckduckgo-search==6.3.5
google-api-python-client==2.124.0
supabase==2.5.0
requests==2.31.0
pytest==8.1.1
python-dotenv==1.0.1
```

- [ ] **Step 3: Install dependencies**

```bash
cd scripts/ingestion
pip install -r requirements.txt
```

Expected: All packages install without error.

- [ ] **Step 4: Commit**

```bash
git add scripts/ingestion/requirements.txt scripts/ingestion/__init__.py scripts/ingestion/tests/__init__.py
git commit -m "chore: scaffold recipe ingestion pipeline directory"
```

---

## Task 2: sources.py — source config

**Files:**
- Create: `scripts/ingestion/sources.py`

- [ ] **Step 1: Write sources.py**

```python
SOURCES = [
    {
        "name": "AllRecipes",
        "domain": "allrecipes.com",
        "category": "Classic",
        "cuisine_type": None,
        "queries": ["dinner recipes", "easy weeknight meals", "quick chicken recipes"],
        "google_budget": 3,
    },
    {
        "name": "Serious Eats",
        "domain": "seriouseats.com",
        "category": "Haute Cuisine",
        "cuisine_type": None,
        "queries": ["best recipes", "technique recipes"],
        "google_budget": 2,
    },
    {
        "name": "Smitten Kitchen",
        "domain": "smittenkitchen.com",
        "category": "Classic",
        "cuisine_type": None,
        "queries": ["seasonal recipes", "baking recipes"],
        "google_budget": 2,
    },
    {
        "name": "Half Baked Harvest",
        "domain": "halfbakedharvest.com",
        "category": "Comfort",
        "cuisine_type": None,
        "queries": ["weeknight dinner", "meal prep"],
        "google_budget": 2,
    },
    {
        "name": "Epicurious",
        "domain": "epicurious.com",
        "category": "Haute Cuisine",
        "cuisine_type": None,
        "queries": ["chef recipes", "holiday cooking"],
        "google_budget": 2,
    },
]
```

- [ ] **Step 2: Commit**

```bash
git add scripts/ingestion/sources.py
git commit -m "feat(ingestion): add source config"
```

---

## Task 3: discover.py — URL discovery

**Files:**
- Create: `scripts/ingestion/discover.py`

- [ ] **Step 1: Write discover.py**

```python
import os
import time
from typing import Optional
from duckduckgo_search import DDGS
from googleapiclient.discovery import build


def _google_search(query: str, domain: str, api_key: str, cse_id: str, num: int = 10) -> list[str]:
    service = build("customsearch", "v1", developerKey=api_key)
    result = service.cse().list(
        q=f"site:{domain} {query}",
        cx=cse_id,
        num=min(num, 10),
    ).execute()
    items = result.get("items", [])
    return [item["link"] for item in items]


def _ddg_search(query: str, domain: str, num: int = 10) -> list[str]:
    with DDGS() as ddgs:
        results = list(ddgs.text(
            f"site:{domain} {query}",
            max_results=num,
        ))
    time.sleep(1)  # DDG rate limit courtesy
    return [r["href"] for r in results if domain in r.get("href", "")]


def discover_urls(
    source: dict,
    google_api_key: Optional[str],
    google_cse_id: Optional[str],
    per_query_limit: int = 10,
) -> list[str]:
    urls: list[str] = []
    seen: set[str] = set()
    use_google = bool(google_api_key and google_cse_id)
    google_budget = source.get("google_budget", 0) if use_google else 0

    for i, query in enumerate(source["queries"]):
        if i < google_budget and use_google:
            try:
                found = _google_search(query, source["domain"], google_api_key, google_cse_id, per_query_limit)
            except Exception as e:
                print(f"[discover] Google failed for '{query}': {e}, falling back to DDG")
                found = _ddg_search(query, source["domain"], per_query_limit)
        else:
            found = _ddg_search(query, source["domain"], per_query_limit)

        for url in found:
            if url not in seen:
                seen.add(url)
                urls.append(url)

    return urls
```

- [ ] **Step 2: Commit**

```bash
git add scripts/ingestion/discover.py
git commit -m "feat(ingestion): add URL discovery via Google CSE + DDG"
```

---

## Task 4: scrape.py — recipe extraction

**Files:**
- Create: `scripts/ingestion/scrape.py`
- Create: `scripts/ingestion/tests/test_scrape.py`

- [ ] **Step 1: Write failing test**

Create `scripts/ingestion/tests/test_scrape.py`:

```python
from scripts.ingestion.scrape import normalize_recipe_scraper, parse_yield


def test_parse_yield_with_number():
    assert parse_yield("4 servings") == 4


def test_parse_yield_with_just_number():
    assert parse_yield("6") == 6


def test_parse_yield_none():
    assert parse_yield(None) is None


def test_parse_yield_empty():
    assert parse_yield("") is None


def test_normalize_ingredients_list():
    result = normalize_recipe_scraper(
        title="Test",
        ingredients=["2 cups flour", "1 tsp salt"],
        instructions=["Mix.", "Bake."],
        image=None,
        total_time=30,
        yields="4 servings",
        cuisine=None,
        source_url="https://allrecipes.com/recipe/test",
        category="Classic",
        cuisine_type=None,
    )
    assert result["title"] == "Test"
    assert len(result["ingredients"]) == 2
    assert result["ingredients"][0] == {"name": "2 cups flour", "amount": None, "unit": None}
    assert result["cook_time_minutes"] == 30
    assert result["servings"] == 4
    assert result["source_url"] == "https://allrecipes.com/recipe/test"
    assert result["source"] == "scraped"
    assert result["category"] == "Classic"
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd scripts/ingestion
python -m pytest tests/test_scrape.py -v
```

Expected: `ImportError` or `ModuleNotFoundError` — `scrape.py` doesn't exist yet.

- [ ] **Step 3: Write scrape.py**

```python
import json
import re
import time
from typing import Optional
import requests
from recipe_scrapers import scrape_html, scrape_me
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

    return normalize_recipe_scraper(
        title=title,
        ingredients=ingredients,
        instructions=instructions,
        image=data.get("image", [None])[0] if isinstance(data.get("image"), list) else data.get("image"),
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
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
cd scripts/ingestion
python -m pytest tests/test_scrape.py -v
```

Expected: All 6 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add scripts/ingestion/scrape.py scripts/ingestion/tests/test_scrape.py
git commit -m "feat(ingestion): add recipe scraper with ld+json fallback"
```

---

## Task 5: DB migration — add source_url and category columns

**Files:**
- Create: `scripts/ingestion/migrate.py`

- [ ] **Step 1: Write migrate.py**

```python
"""
Run once to add source_url and category columns to the recipes table.
Safe to re-run — uses IF NOT EXISTS.
"""
import os
from supabase import create_client
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.environ["SUPABASE_URL"]
SUPABASE_SERVICE_KEY = os.environ["SUPABASE_SERVICE_KEY"]

supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

# Add columns via raw SQL through the Supabase management API
# Note: Supabase Python client does not expose DDL directly.
# Run these SQL statements in the Supabase SQL editor instead:
SQL = """
ALTER TABLE recipes ADD COLUMN IF NOT EXISTS source_url text UNIQUE;
ALTER TABLE recipes ADD COLUMN IF NOT EXISTS category text;
"""

print("Run the following SQL in the Supabase SQL Editor (https://supabase.com/dashboard):")
print()
print(SQL)
print()
print("Then press Enter to continue...")
input()
print("Migration assumed complete.")
```

- [ ] **Step 2: Run the migration**

```bash
cd scripts/ingestion
python migrate.py
```

Follow the printed instructions: open the Supabase SQL Editor at `https://supabase.com/dashboard`, select the What's Cooking project, paste and run the two `ALTER TABLE` statements.

- [ ] **Step 3: Commit**

```bash
git add scripts/ingestion/migrate.py
git commit -m "feat(ingestion): add migrate.py for source_url + category columns"
```

---

## Task 6: ingest.py — Supabase upsert

**Files:**
- Create: `scripts/ingestion/ingest.py`
- Create: `scripts/ingestion/tests/test_ingest.py`

- [ ] **Step 1: Write failing test**

Create `scripts/ingestion/tests/test_ingest.py`:

```python
from unittest.mock import MagicMock, patch
from scripts.ingestion.ingest import filter_new_urls, build_upsert_payload


def test_filter_new_urls_removes_existing():
    existing = {"https://allrecipes.com/recipe/old", "https://allrecipes.com/recipe/another"}
    candidates = [
        "https://allrecipes.com/recipe/old",
        "https://allrecipes.com/recipe/new",
        "https://allrecipes.com/recipe/another",
        "https://allrecipes.com/recipe/brand-new",
    ]
    result = filter_new_urls(candidates, existing)
    assert result == ["https://allrecipes.com/recipe/new", "https://allrecipes.com/recipe/brand-new"]


def test_filter_new_urls_all_new():
    result = filter_new_urls(["https://a.com/1", "https://a.com/2"], set())
    assert result == ["https://a.com/1", "https://a.com/2"]


def test_build_upsert_payload_strips_none_keys():
    recipe = {
        "title": "Pasta",
        "source_url": "https://allrecipes.com/recipe/pasta",
        "ingredients": [],
        "instructions": [],
        "image_url": None,
        "cook_time_minutes": None,
        "servings": None,
        "cuisine_type": None,
        "source": "scraped",
        "category": "Classic",
        "dish_types": [],
        "dietary_tags": [],
    }
    payload = build_upsert_payload(recipe)
    assert payload["title"] == "Pasta"
    assert "image_url" not in payload
    assert "cook_time_minutes" not in payload


def test_build_upsert_payload_keeps_non_none():
    recipe = {
        "title": "Soup",
        "source_url": "https://allrecipes.com/recipe/soup",
        "ingredients": [{"name": "water", "amount": None, "unit": None}],
        "instructions": ["Boil water."],
        "image_url": "https://img.com/soup.jpg",
        "cook_time_minutes": 20,
        "servings": 4,
        "cuisine_type": "American",
        "source": "scraped",
        "category": "Classic",
        "dish_types": [],
        "dietary_tags": [],
    }
    payload = build_upsert_payload(recipe)
    assert payload["image_url"] == "https://img.com/soup.jpg"
    assert payload["cook_time_minutes"] == 20
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd scripts/ingestion
python -m pytest tests/test_ingest.py -v
```

Expected: `ImportError` — `ingest.py` doesn't exist yet.

- [ ] **Step 3: Write ingest.py**

```python
import os
from typing import Optional
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()


def get_supabase() -> Client:
    url = os.environ["SUPABASE_URL"]
    key = os.environ["SUPABASE_SERVICE_KEY"]
    return create_client(url, key)


def fetch_existing_urls(supabase: Client) -> set[str]:
    result = supabase.table("recipes").select("source_url").not_.is_("source_url", "null").execute()
    return {row["source_url"] for row in result.data if row.get("source_url")}


def filter_new_urls(candidates: list[str], existing: set[str]) -> list[str]:
    return [url for url in candidates if url not in existing]


def build_upsert_payload(recipe: dict) -> dict:
    # Strip None values — don't overwrite existing DB data with nulls
    return {k: v for k, v in recipe.items() if v is not None and v != [] or k in ("ingredients", "instructions", "dish_types", "dietary_tags")}


def upsert_recipes(recipes: list[dict], supabase: Optional[Client] = None) -> tuple[int, int]:
    if supabase is None:
        supabase = get_supabase()

    inserted = 0
    skipped = 0

    for recipe in recipes:
        if not recipe.get("title") or not recipe.get("source_url"):
            skipped += 1
            continue
        payload = build_upsert_payload(recipe)
        try:
            supabase.table("recipes").upsert(
                payload,
                on_conflict="source_url",
                ignore_duplicates=True,
            ).execute()
            inserted += 1
        except Exception as e:
            print(f"[ingest] Failed to upsert {recipe.get('source_url')}: {e}")
            skipped += 1

    return inserted, skipped
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
cd scripts/ingestion
python -m pytest tests/test_ingest.py -v
```

Expected: All 4 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add scripts/ingestion/ingest.py scripts/ingestion/tests/test_ingest.py
git commit -m "feat(ingestion): add Supabase ingest with dedup logic"
```

---

## Task 7: main.py — orchestrator

**Files:**
- Create: `scripts/ingestion/main.py`

- [ ] **Step 1: Write main.py**

```python
import os
import time
from dotenv import load_dotenv
from scripts.ingestion.sources import SOURCES
from scripts.ingestion.discover import discover_urls
from scripts.ingestion.scrape import scrape_url
from scripts.ingestion.ingest import get_supabase, fetch_existing_urls, filter_new_urls, upsert_recipes

load_dotenv()


def run():
    google_api_key = os.environ.get("GOOGLE_CSE_KEY")
    google_cse_id = os.environ.get("GOOGLE_CSE_ID")

    supabase = get_supabase()
    existing_urls = fetch_existing_urls(supabase)
    print(f"[main] {len(existing_urls)} recipes already in DB — will skip these URLs")

    total_inserted = 0
    total_skipped = 0

    for source in SOURCES:
        print(f"\n[main] Processing source: {source['name']}")

        raw_urls = discover_urls(source, google_api_key, google_cse_id)
        new_urls = filter_new_urls(raw_urls, existing_urls)
        print(f"[main] {len(raw_urls)} URLs discovered, {len(new_urls)} new")

        recipes = []
        for url in new_urls:
            recipe = scrape_url(url, source)
            if recipe:
                recipes.append(recipe)
            time.sleep(0.5)  # polite crawl delay

        inserted, skipped = upsert_recipes(recipes, supabase)
        total_inserted += inserted
        total_skipped += skipped
        print(f"[main] {source['name']}: {inserted} inserted, {skipped} skipped")

    print(f"\n[main] Done. Total: {total_inserted} inserted, {total_skipped} skipped/failed")


if __name__ == "__main__":
    run()
```

- [ ] **Step 2: Create .env file for local testing**

Create `scripts/ingestion/.env` (do NOT commit this file):

```
SUPABASE_URL=https://oruplzhfmtehsjbnsoms.supabase.co
SUPABASE_SERVICE_KEY=<your-service-role-key-from-supabase-dashboard>
GOOGLE_CSE_KEY=<your-google-api-key-or-leave-blank>
GOOGLE_CSE_ID=<your-cse-id-or-leave-blank>
```

The service role key is found at: Supabase Dashboard → Project Settings → API → `service_role` (secret key).

If `GOOGLE_CSE_KEY` / `GOOGLE_CSE_ID` are blank, discovery falls back entirely to DuckDuckGo.

- [ ] **Step 3: Add .env to .gitignore**

```bash
echo "scripts/ingestion/.env" >> .gitignore
```

- [ ] **Step 4: Commit**

```bash
git add scripts/ingestion/main.py .gitignore
git commit -m "feat(ingestion): add orchestrator main.py"
```

---

## Task 8: Run first scrape

- [ ] **Step 1: Run the full pipeline**

```bash
cd /path/to/whatscooking
python -m scripts.ingestion.main
```

Expected output (example):
```
[main] 142 recipes already in DB — will skip these URLs
[main] Processing source: AllRecipes
[main] 28 URLs discovered, 28 new
[main] AllRecipes: 21 inserted, 7 skipped
...
[main] Done. Total: 87 inserted, 23 skipped/failed
```

- [ ] **Step 2: Verify in Supabase**

Open Supabase Dashboard → Table Editor → `recipes`. Filter by `source = 'scraped'`. Confirm rows have `title`, `ingredients`, `source_url` populated.

---

## Task 9: GitHub Actions workflow

**Files:**
- Create: `.github/workflows/weekly-scrape.yml`

- [ ] **Step 1: Write weekly-scrape.yml**

```yaml
name: Weekly Recipe Scrape

on:
  schedule:
    - cron: '0 3 * * 1'   # Every Monday 3am UTC
  workflow_dispatch:        # Manual trigger from GitHub UI

jobs:
  scrape:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-python@v5
        with:
          python-version: '3.11'
          cache: 'pip'
          cache-dependency-path: scripts/ingestion/requirements.txt

      - name: Install dependencies
        run: pip install -r scripts/ingestion/requirements.txt

      - name: Run ingestion pipeline
        env:
          SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          SUPABASE_SERVICE_KEY: ${{ secrets.SUPABASE_SERVICE_KEY }}
          GOOGLE_CSE_KEY: ${{ secrets.GOOGLE_CSE_KEY }}
          GOOGLE_CSE_ID: ${{ secrets.GOOGLE_CSE_ID }}
        run: python -m scripts.ingestion.main

      - name: Open reminder issue
        if: success()
        uses: actions/github-script@v7
        with:
          script: |
            const today = new Date().toISOString().split('T')[0];
            await github.rest.issues.create({
              owner: context.repo.owner,
              repo: context.repo.repo,
              title: `Weekly scrape complete (${today}) — add sources for next week?`,
              body: `The weekly recipe scrape just ran.\n\nTo add a new source for next week, edit [\`scripts/ingestion/sources.py\`](../../blob/main/scripts/ingestion/sources.py) and commit.\n\nNo action needed if you're happy with the current sources.`,
              labels: ['recipe-ingestion'],
            });
```

- [ ] **Step 2: Add GitHub Secrets**

Go to: GitHub repo → Settings → Secrets and variables → Actions → New repository secret.

Add these four secrets:
- `SUPABASE_URL` — `https://oruplzhfmtehsjbnsoms.supabase.co`
- `SUPABASE_SERVICE_KEY` — service role key from Supabase Dashboard → Project Settings → API
- `GOOGLE_CSE_KEY` — Google API key (optional, leave empty string if not using)
- `GOOGLE_CSE_ID` — Custom Search Engine ID (optional)

- [ ] **Step 3: Create the `recipe-ingestion` label in GitHub**

```bash
gh label create "recipe-ingestion" --color "E8A87C" --description "Weekly recipe scrape reminders"
```

- [ ] **Step 4: Commit and push**

```bash
git add .github/workflows/weekly-scrape.yml
git commit -m "feat(ingestion): add GitHub Actions weekly scrape workflow"
git push
```

- [ ] **Step 5: Verify workflow appears**

Open GitHub repo → Actions tab. Confirm "Weekly Recipe Scrape" workflow is listed. You can trigger it manually via "Run workflow" to test.

---

## Task 10: Run all tests

- [ ] **Step 1: Run full test suite**

```bash
cd /path/to/whatscooking
python -m pytest scripts/ingestion/tests/ -v
```

Expected: All tests PASS.

- [ ] **Step 2: Final commit**

```bash
git add -A
git commit -m "feat: recipe ingestion engine — Python pipeline with GitHub Actions weekly cron"
git push
```
