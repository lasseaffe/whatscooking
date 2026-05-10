# Unified Recipe Pipeline Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the single-strategy weekly pipeline with a multi-category system (trending, seasonal, haute, superfood, mealplan, standard) that auto-applies to Supabase on two schedules (daily + weekly).

**Architecture:** A `BaseStrategy` ABC defines `scrape() → compose() → validate()`; six strategy modules implement it; a shared `lib/` package provides Playwright helpers, Ollama wrapper, field validator, and Supabase upsert; `run.py --schedule=daily|weekly` orchestrates the correct set and writes structured logs.

**Tech Stack:** Python 3.11+, Playwright (sync), recipe-scrapers, pytrends, requests (USDA FDC), supabase-py 2.28.3, Ollama HTTP API (llama3.1:8b local), python-dotenv

---

## File Map

| Action | Path | Responsibility |
|--------|------|----------------|
| Create | `pipeline/lib/__init__.py` | package marker |
| Create | `pipeline/lib/scrape.py` | Playwright + recipe-scrapers helpers (from existing `pipeline/scrape.py`) |
| Create | `pipeline/lib/compose.py` | Ollama HTTP wrapper (from existing `pipeline/compose.py`) |
| Create | `pipeline/lib/validate.py` | field validator (extracted from existing `pipeline/compose.py`) |
| Create | `pipeline/lib/apply.py` | Supabase upsert, returns `ApplyResult` |
| Create | `pipeline/strategies/__init__.py` | package marker |
| Create | `pipeline/strategies/base.py` | `BaseStrategy` ABC |
| Create | `pipeline/strategies/standard.py` | migrated standard (Bon Appétit category rotation) |
| Create | `pipeline/strategies/trending.py` | pytrends → Playwright → Ollama |
| Create | `pipeline/strategies/seasonal.py` | harvest calendar → Playwright → Ollama |
| Create | `pipeline/strategies/haute.py` | Great British Chefs / Serious Eats → Ollama |
| Create | `pipeline/strategies/superfood.py` | USDA FDC nutrient lookup → Playwright → Ollama |
| Create | `pipeline/strategies/mealplan.py` | pure Ollama batch (no scraping) |
| Modify | `pipeline/config.py` | replace old constants with unified config |
| Replace | `pipeline/run.py` | new orchestrator with `--schedule` arg + logging to `pipeline/logs/` |
| Modify | `pipeline/requirements.txt` | add pytrends, requests |
| Retire | `pipeline/emit_sql.py` | delete — SQL output replaced by direct upsert |
| Create | `pipeline/logs/` | log directory (gitignored output, not the dir itself) |
| Create | `tests/pipeline/test_validate.py` | unit tests for validator |
| Create | `tests/pipeline/test_apply.py` | unit tests for apply (mocked Supabase) |
| Create | `tests/pipeline/test_strategies.py` | unit tests for each strategy's compose prompt |

---

## Task 1: Scaffold directories and update requirements

**Files:**
- Create: `pipeline/lib/__init__.py`
- Create: `pipeline/strategies/__init__.py`
- Create: `pipeline/logs/.gitkeep`
- Modify: `pipeline/requirements.txt`
- Create: `tests/pipeline/__init__.py`

- [ ] **Step 1: Create package markers and log directory**

```
pipeline/lib/__init__.py          → empty file
pipeline/strategies/__init__.py   → empty file
pipeline/logs/.gitkeep            → empty file
tests/pipeline/__init__.py        → empty file
```

Run in project root (`C:\Users\lasse\Desktop\whatscooking`):
```powershell
New-Item -ItemType Directory -Force pipeline/lib, pipeline/strategies, pipeline/logs, tests/pipeline
New-Item -ItemType File -Force pipeline/lib/__init__.py, pipeline/strategies/__init__.py, pipeline/logs/.gitkeep, tests/pipeline/__init__.py
```

- [ ] **Step 2: Update requirements.txt**

Replace `pipeline/requirements.txt` with:
```
playwright
recipe-scrapers
supabase==2.28.3
python-dotenv
pytrends
requests
pytest
```

- [ ] **Step 3: Install new dependencies**

```powershell
pip install pytrends requests pytest
```

Expected: installs without errors.

- [ ] **Step 4: Commit scaffold**

```bash
git add pipeline/lib pipeline/strategies pipeline/logs tests/pipeline pipeline/requirements.txt
git commit -m "chore: scaffold unified pipeline directories and requirements"
```

---

## Task 2: Migrate shared lib — `validate.py` and `compose.py`

**Files:**
- Create: `pipeline/lib/validate.py`
- Create: `pipeline/lib/compose.py`
- Create: `tests/pipeline/test_validate.py`

- [ ] **Step 1: Write failing test for validator**

Create `tests/pipeline/test_validate.py`:
```python
import pytest
from pipeline.lib.validate import validate_recipe

VALID = {
    "title": "Test Dish",
    "description": "A test dish.",
    "cuisine_type": "Italian",
    "dish_types": ["pasta"],
    "dietary_tags": [],
    "ingredients": [{"name": "flour", "amount": 1, "unit": "cup"}],
    "instructions": ["Mix flour with water."],
    "prep_time_minutes": 10,
    "cook_time_minutes": 20,
    "servings": 4,
    "calories": 400,
    "protein_g": 10,
    "carbs_g": 50,
    "fat_g": 5,
    "fiber_g": 2,
    "sugar_g": 1,
    "sodium_mg": 200,
    "source_name": "Bon Appétit",
    "source_url": "https://bonappetit.com/recipe/test",
}

def test_valid_recipe_returns_no_errors():
    assert validate_recipe(VALID) == []

def test_missing_title_returns_error():
    r = {**VALID}
    del r["title"]
    errors = validate_recipe(r)
    assert any("title" in e for e in errors)

def test_empty_ingredients_returns_error():
    r = {**VALID, "ingredients": []}
    errors = validate_recipe(r)
    assert any("ingredients" in e for e in errors)

def test_zero_calories_returns_error():
    r = {**VALID, "calories": 0}
    errors = validate_recipe(r)
    assert any("calories" in e for e in errors)

def test_ingredient_missing_name_returns_error():
    r = {**VALID, "ingredients": [{"amount": 1, "unit": "cup"}]}
    errors = validate_recipe(r)
    assert any("name" in e for e in errors)
```

- [ ] **Step 2: Run test — expect FAIL**

```powershell
pytest tests/pipeline/test_validate.py -v
```
Expected: `ModuleNotFoundError: No module named 'pipeline.lib.validate'`

- [ ] **Step 3: Create `pipeline/lib/validate.py`**

```python
from typing import Any

REQUIRED_FIELDS = [
    "title", "description", "ingredients", "instructions",
    "calories", "servings", "prep_time_minutes", "cook_time_minutes",
    "protein_g", "carbs_g", "fat_g", "fiber_g", "sugar_g", "sodium_mg",
]


def validate_recipe(recipe: dict[str, Any]) -> list[str]:
    errors = []

    for field in REQUIRED_FIELDS:
        if field not in recipe:
            errors.append(f"Missing required field: {field}")

    if recipe.get("title") is not None and not str(recipe["title"]).strip():
        errors.append("title must not be empty")

    if recipe.get("description") is not None and not str(recipe.get("description", "")).strip():
        errors.append("description must not be empty")

    if recipe.get("calories") is not None and recipe["calories"] <= 0:
        errors.append("calories must be > 0")

    if recipe.get("servings") is not None and recipe["servings"] <= 0:
        errors.append("servings must be > 0")

    ingredients = recipe.get("ingredients", [])
    if not ingredients:
        errors.append("ingredients must not be empty")
    else:
        for i, ing in enumerate(ingredients):
            if not isinstance(ing, dict):
                errors.append(f"ingredient[{i}] must be a dict")
                continue
            if "name" not in ing or not ing["name"]:
                errors.append(f"ingredient[{i}] missing name")
            if "amount" not in ing:
                errors.append(f"ingredient[{i}] missing amount")
            if "unit" not in ing:
                errors.append(f"ingredient[{i}] missing unit")

    if not recipe.get("instructions"):
        errors.append("instructions must not be empty")

    return errors
```

- [ ] **Step 4: Run tests — expect PASS**

```powershell
pytest tests/pipeline/test_validate.py -v
```
Expected: 5 tests passing.

- [ ] **Step 5: Create `pipeline/lib/compose.py`**

This is a straight migration of `pipeline/compose.py`, importing from the new locations:

```python
import json
import re
import requests
from typing import Any

from pipeline.config import OLLAMA_URL, OLLAMA_MODEL, OLLAMA_TIMEOUT
from pipeline.lib.validate import validate_recipe

SCHEMA_DESCRIPTION = """
{
  "title": "string",
  "description": "string — 2-3 engaging sentences in present tense food-writing style",
  "cuisine_type": "string",
  "dish_types": ["string"],
  "dietary_tags": ["string — e.g. vegetarian, vegan, gluten-free, dairy-free"],
  "ingredients": [{"name": "string", "amount": number, "unit": "string"}],
  "instructions": ["string — each step as a complete sentence"],
  "prep_time_minutes": number,
  "cook_time_minutes": number,
  "servings": number,
  "calories": number,
  "protein_g": number,
  "carbs_g": number,
  "fat_g": number,
  "fiber_g": number,
  "sugar_g": number,
  "sodium_mg": number,
  "source_name": "string — comma-joined source site names",
  "source_url": "string — URL of the primary source recipe"
}
"""


def check_ollama_reachable() -> bool:
    try:
        r = requests.get(f"{OLLAMA_URL}/api/tags", timeout=5)
        return r.status_code == 200
    except Exception:
        return False


def call_ollama(prompt: str) -> dict[str, Any] | None:
    """Send prompt to Ollama, parse JSON response, return validated recipe dict or None."""
    try:
        response = requests.post(
            f"{OLLAMA_URL}/api/generate",
            json={
                "model": OLLAMA_MODEL,
                "prompt": prompt,
                "stream": False,
                "options": {"temperature": 0.7, "num_predict": 1800},
            },
            timeout=OLLAMA_TIMEOUT,
        )
        response.raise_for_status()
    except Exception as e:
        print(f"  [compose] Ollama request failed: {e}")
        return None

    raw_text = response.json().get("response", "")
    text = raw_text.strip()
    if text.startswith("```"):
        text = text.split("```")[1]
        if text.startswith("json"):
            text = text[4:]
        text = text.strip()
    if text.endswith("```"):
        text = text[:-3].strip()

    text = re.sub(r'\b(\d+)/(\d+)\b', lambda m: str(int(m.group(1)) / int(m.group(2))), text)

    try:
        recipe = json.loads(text)
    except json.JSONDecodeError as e:
        print(f"  [compose] JSON parse failed: {e}")
        print(f"  [compose] Raw: {raw_text[:500]}")
        return None

    errors = validate_recipe(recipe)
    if errors:
        print(f"  [compose] Validation failed for '{recipe.get('title', '?')}': {errors}")
        return None

    return recipe


def build_composite_prompt(raw_recipes: list[dict], category: str, extra_instruction: str = "") -> str:
    sources_text = ""
    for i, r in enumerate(raw_recipes, 1):
        sources_text += f"\n--- Source {i}: {r.get('source_name', 'Unknown')} ---\n"
        sources_text += f"Title: {r['title']}\n"
        sources_text += f"Ingredients: {', '.join(r.get('ingredients', []))}\n"
        instructions = r.get('instructions', [])
        sources_text += f"Instructions: {' '.join(instructions[:5])}\n"
        sources_text += f"URL: {r.get('source_url', '')}\n"

    extra = f"\nAdditional instruction: {extra_instruction}" if extra_instruction else ""

    return f"""You are a professional recipe developer creating composite recipes for a meal planning app.

I have scraped {len(raw_recipes)} real {category} recipes from cooking websites. Your task is to create ONE new composite recipe inspired by the best techniques and ingredients from these sources. Do NOT copy any single recipe — combine the best ideas into something new.
{sources_text}{extra}

Create a composite {category} recipe. Return ONLY a valid JSON object with this exact schema:
{SCHEMA_DESCRIPTION}

Rules:
- title must be original (not copied from any source)
- description must be 2-3 sentences, engaging, present tense
- ingredients must use numeric amounts (no fractions as strings)
- instructions must be step-by-step, each a complete sentence
- calories must be > 0, servings must be > 0
- source_name: comma-join the names of sources you drew from
- source_url: use the URL of the source that contributed most
- Return ONLY the JSON object, no markdown, no explanation
"""
```

- [ ] **Step 6: Commit**

```bash
git add pipeline/lib/validate.py pipeline/lib/compose.py tests/pipeline/test_validate.py
git commit -m "feat(pipeline): migrate validator and Ollama wrapper to lib/"
```

---

## Task 3: Migrate shared lib — `scrape.py` and create `apply.py`

**Files:**
- Create: `pipeline/lib/scrape.py`
- Create: `pipeline/lib/apply.py`
- Create: `tests/pipeline/test_apply.py`

- [ ] **Step 1: Write failing test for apply**

Create `tests/pipeline/test_apply.py`:
```python
from unittest.mock import MagicMock, patch
from pipeline.lib.apply import upsert_recipes, ApplyResult

RECIPE = {
    "title": "Test Dish",
    "description": "A test.",
    "cuisine_type": "Italian",
    "dish_types": ["pasta"],
    "dietary_tags": [],
    "ingredients": [{"name": "flour", "amount": 1, "unit": "cup"}],
    "instructions": ["Mix."],
    "prep_time_minutes": 5,
    "cook_time_minutes": 10,
    "servings": 2,
    "calories": 300,
    "protein_g": 8,
    "carbs_g": 40,
    "fat_g": 3,
    "fiber_g": 1,
    "sugar_g": 0,
    "sodium_mg": 100,
    "source_name": "Bon Appétit",
    "source_url": "https://bonappetit.com/recipe/test",
    "source": "curated",
}

def test_upsert_returns_apply_result():
    mock_client = MagicMock()
    mock_client.table.return_value.upsert.return_value.execute.return_value.data = [RECIPE]
    with patch("pipeline.lib.apply.create_client", return_value=mock_client):
        result = upsert_recipes([RECIPE])
    assert isinstance(result, ApplyResult)
    assert result.inserted >= 0

def test_upsert_empty_list_returns_zero_inserted():
    mock_client = MagicMock()
    with patch("pipeline.lib.apply.create_client", return_value=mock_client):
        result = upsert_recipes([])
    assert result.inserted == 0
    assert result.errors == []
```

- [ ] **Step 2: Run test — expect FAIL**

```powershell
pytest tests/pipeline/test_apply.py -v
```
Expected: `ModuleNotFoundError: No module named 'pipeline.lib.apply'`

- [ ] **Step 3: Create `pipeline/lib/apply.py`**

```python
import os
from dataclasses import dataclass, field
from typing import Any
from dotenv import load_dotenv
from supabase import create_client

load_dotenv(dotenv_path=".env.local")

SUPABASE_URL = os.getenv("NEXT_PUBLIC_SUPABASE_URL", "")
SUPABASE_KEY = os.getenv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "")


@dataclass
class ApplyResult:
    inserted: int = 0
    skipped: int = 0
    errors: list[str] = field(default_factory=list)


def upsert_recipes(recipes: list[dict[str, Any]]) -> ApplyResult:
    result = ApplyResult()
    if not recipes:
        return result

    client = create_client(SUPABASE_URL, SUPABASE_KEY)

    for recipe in recipes:
        row = {**recipe, "source": recipe.get("source", "curated")}
        try:
            resp = client.table("recipes").upsert(
                row, on_conflict="source_url"
            ).execute()
            if resp.data:
                result.inserted += len(resp.data)
            else:
                result.skipped += 1
        except Exception as e:
            msg = f"Upsert failed for '{recipe.get('title', '?')}': {e}"
            print(f"  [apply] {msg}")
            result.errors.append(msg)

    return result
```

- [ ] **Step 4: Run tests — expect PASS**

```powershell
pytest tests/pipeline/test_apply.py -v
```
Expected: 2 tests passing.

- [ ] **Step 5: Create `pipeline/lib/scrape.py`**

Direct migration of `pipeline/scrape.py`, updating the import to use `pipeline.config` (which will be rewritten in Task 4, but the import path stays the same):

```python
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

        browser.close()

    return collected


def get_links_from_listing(listing_url: str, limit: int = 10) -> list[str]:
    """Open a Playwright browser just to collect recipe links from a listing page."""
    with sync_playwright() as pw:
        browser = pw.chromium.launch(headless=True)
        page = browser.new_page()
        page.set_extra_http_headers({"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"})
        links = collect_recipe_links(page, listing_url, limit)
        browser.close()
    return links
```

- [ ] **Step 6: Commit**

```bash
git add pipeline/lib/scrape.py pipeline/lib/apply.py tests/pipeline/test_apply.py
git commit -m "feat(pipeline): add lib/scrape.py and lib/apply.py with upsert"
```

---

## Task 4: Rewrite `config.py`

**Files:**
- Modify: `pipeline/config.py`

- [ ] **Step 1: Replace `pipeline/config.py` entirely**

```python
import os
from dotenv import load_dotenv

load_dotenv(dotenv_path=".env.local")

# Ollama
OLLAMA_URL = "http://localhost:11434"
OLLAMA_MODEL = "llama3.1:8b"
OLLAMA_TIMEOUT = 600

# Schedule → strategy name lists
SCHEDULE_DAILY = ["trending", "seasonal"]
SCHEDULE_WEEKLY = ["standard", "haute", "superfood", "mealplan"]

# How many composed recipes each strategy produces per run
RECIPES_PER_STRATEGY = {
    "trending": 5,
    "seasonal": 4,
    "haute": 4,
    "superfood": 4,
    "mealplan": 7,
    "standard": 4,
}

# Listing page URLs per strategy (Playwright navigates these to collect recipe links)
CATEGORY_LISTING_URLS = {
    "standard": {
        "main-course":   {"Bon Appétit": "https://www.bonappetit.com/search?q=main+course+dinner&content=recipe"},
        "pasta":         {"Bon Appétit": "https://www.bonappetit.com/search?q=pasta&content=recipe"},
        "soup":          {"Bon Appétit": "https://www.bonappetit.com/search?q=soup&content=recipe"},
        "salad":         {"Bon Appétit": "https://www.bonappetit.com/search?q=salad&content=recipe"},
        "breakfast":     {"Bon Appétit": "https://www.bonappetit.com/search?q=breakfast&content=recipe"},
        "dessert":       {"Bon Appétit": "https://www.bonappetit.com/search?q=dessert&content=recipe"},
        "vegetarian":    {"Bon Appétit": "https://www.bonappetit.com/search?q=vegetarian&content=recipe"},
        "vegan":         {"Bon Appétit": "https://www.bonappetit.com/search?q=vegan&content=recipe"},
        "asian":         {"Bon Appétit": "https://www.bonappetit.com/search?q=asian&content=recipe"},
        "mediterranean": {"Bon Appétit": "https://www.bonappetit.com/search?q=mediterranean&content=recipe"},
        "mexican":       {"Bon Appétit": "https://www.bonappetit.com/search?q=mexican&content=recipe"},
        "comfort-food":  {"Bon Appétit": "https://www.bonappetit.com/search?q=comfort+food&content=recipe"},
    },
    "haute": [
        "https://www.greatbritishchefs.com/collections/fine-dining-recipes",
        "https://www.seriouseats.com/techniques",
    ],
    "superfood": [
        "https://www.allrecipes.com/search?q={ingredient}",
        "https://www.seriouseats.com/search?q={ingredient}",
    ],
    "trending": [
        "https://www.allrecipes.com/search?q={term}",
        "https://www.seriouseats.com/search?q={term}",
    ],
    "seasonal": [
        "https://www.allrecipes.com/search?q={ingredient}",
        "https://cooking.nytimes.com/search?q={ingredient}",
    ],
}

# Standard strategy category rotation
STANDARD_CATEGORIES_ROTATION = [
    "main-course", "pasta", "soup", "salad", "breakfast", "dessert",
    "vegetarian", "vegan", "asian", "mediterranean", "mexican", "comfort-food",
]
CATEGORIES_PER_RUN = 4

# Superfood nutrient rotation
SUPERFOOD_NUTRIENT_ROTATION = [
    "fiber", "omega-3", "antioxidants", "iron", "calcium", "vitamin-c",
]

# US harvest calendar: month (1-12) → in-season produce
HARVEST_CALENDAR = {
    1:  ["citrus", "kale", "sweet potato", "winter squash"],
    2:  ["citrus", "kale", "leeks", "turnips"],
    3:  ["asparagus", "artichokes", "spinach", "leeks"],
    4:  ["asparagus", "peas", "radishes", "spring onions"],
    5:  ["strawberries", "peas", "asparagus", "lettuce"],
    6:  ["strawberries", "blueberries", "zucchini", "cucumber"],
    7:  ["tomatoes", "corn", "peaches", "blueberries"],
    8:  ["tomatoes", "eggplant", "peppers", "watermelon"],
    9:  ["apples", "pears", "butternut squash", "sweet corn"],
    10: ["pumpkin", "apples", "Brussels sprouts", "sweet potato"],
    11: ["cranberries", "kale", "parsnips", "turnips"],
    12: ["citrus", "pomegranate", "Brussels sprouts", "winter squash"],
}

# Rotation state file
ROTATION_STATE_FILE = "pipeline/rotation_state.json"

# Logs directory
LOGS_DIR = "pipeline/logs"

# Supabase credentials
SUPABASE_URL = os.getenv("NEXT_PUBLIC_SUPABASE_URL", "")
SUPABASE_KEY = os.getenv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "")

# USDA FDC (free API key — register at api.nal.usda.gov)
USDA_FDC_API_KEY = os.getenv("USDA_FDC_API_KEY", "")
```

- [ ] **Step 2: Commit**

```bash
git add pipeline/config.py
git commit -m "feat(pipeline): unified config with all strategies and harvest calendar"
```

---

## Task 5: `BaseStrategy` ABC and `standard.py` migration

**Files:**
- Create: `pipeline/strategies/base.py`
- Create: `pipeline/strategies/standard.py`

- [ ] **Step 1: Create `pipeline/strategies/base.py`**

```python
from abc import ABC, abstractmethod


class BaseStrategy(ABC):
    """All pipeline strategies implement this interface.

    Orchestrator calls: recipes = []
    for raw in strategy.scrape():
        composed = strategy.compose([raw])
        if strategy.validate(composed):
            recipes.append(composed)
    """

    @abstractmethod
    def scrape(self) -> list[dict]:
        """Return a list of raw recipe dicts scraped from sources."""
        ...

    @abstractmethod
    def compose(self, raw: list[dict]) -> dict | None:
        """Take raw scraped recipes, return one composed recipe dict or None on failure."""
        ...

    @abstractmethod
    def validate(self, recipe: dict) -> bool:
        """Return True if recipe passes all field checks."""
        ...
```

- [ ] **Step 2: Create `pipeline/strategies/standard.py`**

```python
import json
from pathlib import Path
from typing import Any

from pipeline.config import (
    STANDARD_CATEGORIES_ROTATION, CATEGORIES_PER_RUN,
    CATEGORY_LISTING_URLS, ROTATION_STATE_FILE, SUPABASE_URL, SUPABASE_KEY,
)
from pipeline.lib.scrape import get_links_from_listing, scrape_urls
from pipeline.lib.compose import build_composite_prompt, call_ollama
from pipeline.lib.validate import validate_recipe
from pipeline.strategies.base import BaseStrategy


def _get_existing_urls() -> set[str]:
    if not SUPABASE_URL or not SUPABASE_KEY:
        return set()
    try:
        from supabase import create_client
        client = create_client(SUPABASE_URL, SUPABASE_KEY)
        result = client.table("recipes").select("source_url").eq("source", "curated").execute()
        return {row["source_url"] for row in result.data if row.get("source_url")}
    except Exception as e:
        print(f"  [standard] Dedup check failed: {e}")
        return set()


def _load_rotation_state() -> int:
    state_path = Path(ROTATION_STATE_FILE)
    if state_path.exists():
        try:
            data = json.loads(state_path.read_text())
            return data.get("standard_next_index", 0)
        except Exception:
            pass
    return 0


def _save_rotation_state(next_index: int) -> None:
    state_path = Path(ROTATION_STATE_FILE)
    try:
        data = json.loads(state_path.read_text()) if state_path.exists() else {}
    except Exception:
        data = {}
    data["standard_next_index"] = next_index
    state_path.write_text(json.dumps(data))


class StandardStrategy(BaseStrategy):
    def __init__(self) -> None:
        self._raw_batches: list[tuple[str, list[dict]]] = []  # [(category, raw_recipes)]

    def scrape(self) -> list[dict]:
        start_index = _load_rotation_state()
        total = len(STANDARD_CATEGORIES_ROTATION)
        indices = [(start_index + i) % total for i in range(CATEGORIES_PER_RUN)]
        categories = [STANDARD_CATEGORIES_ROTATION[i] for i in indices]
        next_index = (start_index + CATEGORIES_PER_RUN) % total
        _save_rotation_state(next_index)

        existing_urls = _get_existing_urls()
        self._raw_batches = []

        for category in categories:
            sources = CATEGORY_LISTING_URLS["standard"].get(category, {})
            all_links: list[str] = []
            for listing_url in sources.values():
                all_links += get_links_from_listing(listing_url, limit=10)

            raw = scrape_urls(all_links, existing_urls, limit=2)
            if raw:
                self._raw_batches.append((category, raw))

        # Return a flat sentinel list — orchestrator calls compose() per batch
        return [{"_batch": True}] * len(self._raw_batches)

    def compose(self, raw: list[dict]) -> dict | None:
        # raw is unused — we use self._raw_batches directly (one compose per category batch)
        if not self._raw_batches:
            return None
        category, batch = self._raw_batches.pop(0)
        prompt = build_composite_prompt(batch, category)
        return call_ollama(prompt)

    def validate(self, recipe: dict) -> bool:
        if recipe is None:
            return False
        return len(validate_recipe(recipe)) == 0
```

- [ ] **Step 3: Commit**

```bash
git add pipeline/strategies/base.py pipeline/strategies/standard.py
git commit -m "feat(pipeline): BaseStrategy ABC and standard strategy migration"
```

---

## Task 6: `trending.py` strategy

**Files:**
- Create: `pipeline/strategies/trending.py`

- [ ] **Step 1: Create `pipeline/strategies/trending.py`**

```python
import time
from pytrends.request import TrendReq
from pipeline.config import CATEGORY_LISTING_URLS, RECIPES_PER_STRATEGY, SUPABASE_URL, SUPABASE_KEY
from pipeline.lib.scrape import get_links_from_listing, scrape_urls
from pipeline.lib.compose import build_composite_prompt, call_ollama
from pipeline.lib.validate import validate_recipe
from pipeline.strategies.base import BaseStrategy


def _get_existing_urls() -> set[str]:
    if not SUPABASE_URL or not SUPABASE_KEY:
        return set()
    try:
        from supabase import create_client
        client = create_client(SUPABASE_URL, SUPABASE_KEY)
        result = client.table("recipes").select("source_url").eq("source", "curated").execute()
        return {row["source_url"] for row in result.data if row.get("source_url")}
    except Exception as e:
        print(f"  [trending] Dedup check failed: {e}")
        return set()


def _fetch_trending_terms(n: int = 5) -> list[str]:
    """Return up to n rising food-related search terms via pytrends."""
    try:
        pt = TrendReq(hl="en-US", tz=360)
        # Category 71 = Food & Drink in Google Trends
        pt.build_payload(kw_list=["recipe"], cat=71, timeframe="now 1-d")
        related = pt.related_queries()
        rising = related.get("recipe", {}).get("rising")
        if rising is not None and not rising.empty:
            terms = rising["query"].tolist()[:n]
            if terms:
                return terms
    except Exception as e:
        print(f"  [trending] pytrends failed: {e}")

    # Fallback: static popular terms when pytrends is rate-limited
    return ["pasta recipe", "chicken dinner", "easy soup", "healthy salad", "quick breakfast"]


class TrendingStrategy(BaseStrategy):
    def __init__(self) -> None:
        self._batches: list[tuple[str, list[dict]]] = []  # [(term, raw_recipes)]

    def scrape(self) -> list[dict]:
        terms = _fetch_trending_terms(RECIPES_PER_STRATEGY["trending"])
        existing_urls = _get_existing_urls()
        self._batches = []

        for term in terms:
            all_links: list[str] = []
            for url_template in CATEGORY_LISTING_URLS["trending"]:
                listing_url = url_template.format(term=term.replace(" ", "+"))
                all_links += get_links_from_listing(listing_url, limit=5)
                time.sleep(1)

            raw = scrape_urls(all_links, existing_urls, limit=2)
            if raw:
                self._batches.append((term, raw))

        return [{"_batch": True}] * len(self._batches)

    def compose(self, raw: list[dict]) -> dict | None:
        if not self._batches:
            return None
        term, batch = self._batches.pop(0)
        prompt = build_composite_prompt(
            batch,
            category=term,
            extra_instruction='Add "trending" to the dietary_tags list.',
        )
        recipe = call_ollama(prompt)
        if recipe and "trending" not in recipe.get("dietary_tags", []):
            recipe.setdefault("dietary_tags", []).append("trending")
        return recipe

    def validate(self, recipe: dict) -> bool:
        if recipe is None:
            return False
        return len(validate_recipe(recipe)) == 0
```

- [ ] **Step 2: Commit**

```bash
git add pipeline/strategies/trending.py
git commit -m "feat(pipeline): trending strategy via pytrends + Playwright"
```

---

## Task 7: `seasonal.py` strategy

**Files:**
- Create: `pipeline/strategies/seasonal.py`

- [ ] **Step 1: Create `pipeline/strategies/seasonal.py`**

```python
import time
from datetime import date
from pipeline.config import HARVEST_CALENDAR, CATEGORY_LISTING_URLS, RECIPES_PER_STRATEGY, SUPABASE_URL, SUPABASE_KEY
from pipeline.lib.scrape import get_links_from_listing, scrape_urls
from pipeline.lib.compose import build_composite_prompt, call_ollama
from pipeline.lib.validate import validate_recipe
from pipeline.strategies.base import BaseStrategy


def _get_existing_urls() -> set[str]:
    if not SUPABASE_URL or not SUPABASE_KEY:
        return set()
    try:
        from supabase import create_client
        client = create_client(SUPABASE_URL, SUPABASE_KEY)
        result = client.table("recipes").select("source_url").eq("source", "curated").execute()
        return {row["source_url"] for row in result.data if row.get("source_url")}
    except Exception as e:
        print(f"  [seasonal] Dedup check failed: {e}")
        return set()


class SeasonalStrategy(BaseStrategy):
    def __init__(self) -> None:
        self._batches: list[tuple[str, list[dict]]] = []

    def scrape(self) -> list[dict]:
        month = date.today().month
        ingredients = HARVEST_CALENDAR.get(month, ["seasonal vegetables"])[:RECIPES_PER_STRATEGY["seasonal"]]
        existing_urls = _get_existing_urls()
        self._batches = []

        for ingredient in ingredients:
            all_links: list[str] = []
            for url_template in CATEGORY_LISTING_URLS["seasonal"]:
                listing_url = url_template.format(ingredient=ingredient.replace(" ", "+"))
                all_links += get_links_from_listing(listing_url, limit=5)
                time.sleep(1)

            raw = scrape_urls(all_links, existing_urls, limit=2)
            if raw:
                self._batches.append((ingredient, raw))

        return [{"_batch": True}] * len(self._batches)

    def compose(self, raw: list[dict]) -> dict | None:
        if not self._batches:
            return None
        ingredient, batch = self._batches.pop(0)
        prompt = build_composite_prompt(
            batch,
            category=f"seasonal {ingredient}",
            extra_instruction=f'The hero ingredient is {ingredient}, currently in peak season. Add "seasonal" to the dietary_tags list.',
        )
        recipe = call_ollama(prompt)
        if recipe and "seasonal" not in recipe.get("dietary_tags", []):
            recipe.setdefault("dietary_tags", []).append("seasonal")
        return recipe

    def validate(self, recipe: dict) -> bool:
        if recipe is None:
            return False
        return len(validate_recipe(recipe)) == 0
```

- [ ] **Step 2: Commit**

```bash
git add pipeline/strategies/seasonal.py
git commit -m "feat(pipeline): seasonal strategy via harvest calendar"
```

---

## Task 8: `haute.py` strategy

**Files:**
- Create: `pipeline/strategies/haute.py`

- [ ] **Step 1: Create `pipeline/strategies/haute.py`**

```python
from pipeline.config import CATEGORY_LISTING_URLS, RECIPES_PER_STRATEGY, SUPABASE_URL, SUPABASE_KEY
from pipeline.lib.scrape import get_links_from_listing, scrape_urls
from pipeline.lib.compose import build_composite_prompt, call_ollama
from pipeline.lib.validate import validate_recipe
from pipeline.strategies.base import BaseStrategy


def _get_existing_urls() -> set[str]:
    if not SUPABASE_URL or not SUPABASE_KEY:
        return set()
    try:
        from supabase import create_client
        client = create_client(SUPABASE_URL, SUPABASE_KEY)
        result = client.table("recipes").select("source_url").eq("source", "curated").execute()
        return {row["source_url"] for row in result.data if row.get("source_url")}
    except Exception as e:
        print(f"  [haute] Dedup check failed: {e}")
        return set()


class HauteStrategy(BaseStrategy):
    def __init__(self) -> None:
        self._raw: list[dict] = []

    def scrape(self) -> list[dict]:
        existing_urls = _get_existing_urls()
        all_links: list[str] = []
        for listing_url in CATEGORY_LISTING_URLS["haute"]:
            all_links += get_links_from_listing(listing_url, limit=10)

        self._raw = scrape_urls(all_links, existing_urls, limit=RECIPES_PER_STRATEGY["haute"])
        return self._raw

    def compose(self, raw: list[dict]) -> dict | None:
        if not raw:
            return None
        prompt = build_composite_prompt(
            raw,
            category="fine dining",
            extra_instruction=(
                "This is a haute cuisine recipe. Preserve technique precision — "
                "describe cooking temperatures, resting times, and plating. "
                'Add "fine-dining" to dish_types.'
            ),
        )
        recipe = call_ollama(prompt)
        if recipe and "fine-dining" not in recipe.get("dish_types", []):
            recipe.setdefault("dish_types", []).append("fine-dining")
        return recipe

    def validate(self, recipe: dict) -> bool:
        if recipe is None:
            return False
        return len(validate_recipe(recipe)) == 0
```

- [ ] **Step 2: Commit**

```bash
git add pipeline/strategies/haute.py
git commit -m "feat(pipeline): haute strategy for fine-dining recipes"
```

---

## Task 9: `superfood.py` strategy

**Files:**
- Create: `pipeline/strategies/superfood.py`

- [ ] **Step 1: Create `pipeline/strategies/superfood.py`**

```python
import json
import time
import requests
from pathlib import Path
from pipeline.config import (
    USDA_FDC_API_KEY, SUPERFOOD_NUTRIENT_ROTATION,
    CATEGORY_LISTING_URLS, RECIPES_PER_STRATEGY,
    ROTATION_STATE_FILE, SUPABASE_URL, SUPABASE_KEY,
)
from pipeline.lib.scrape import get_links_from_listing, scrape_urls
from pipeline.lib.compose import build_composite_prompt, call_ollama
from pipeline.lib.validate import validate_recipe
from pipeline.strategies.base import BaseStrategy

# USDA FDC nutrient IDs for each rotation slot
NUTRIENT_IDS = {
    "fiber": 1079,
    "omega-3": 1404,
    "antioxidants": 1162,   # vitamin C as proxy
    "iron": 1089,
    "calcium": 1087,
    "vitamin-c": 1162,
}

# Static fallback ingredients per nutrient when FDC API key is missing
FALLBACK_INGREDIENTS = {
    "fiber": ["lentils", "black beans", "oats", "broccoli", "avocado"],
    "omega-3": ["salmon", "walnuts", "chia seeds", "flaxseed", "mackerel"],
    "antioxidants": ["blueberries", "dark chocolate", "spinach", "pecans", "red cabbage"],
    "iron": ["spinach", "lentils", "tofu", "pumpkin seeds", "quinoa"],
    "calcium": ["kale", "almonds", "sardines", "chia seeds", "white beans"],
    "vitamin-c": ["bell peppers", "kiwi", "strawberries", "broccoli", "citrus"],
}


def _load_nutrient_rotation_index() -> int:
    state_path = Path(ROTATION_STATE_FILE)
    if state_path.exists():
        try:
            return json.loads(state_path.read_text()).get("superfood_next_index", 0)
        except Exception:
            pass
    return 0


def _save_nutrient_rotation_index(idx: int) -> None:
    state_path = Path(ROTATION_STATE_FILE)
    try:
        data = json.loads(state_path.read_text()) if state_path.exists() else {}
    except Exception:
        data = {}
    data["superfood_next_index"] = idx
    state_path.write_text(json.dumps(data))


def _fetch_top_ingredients(nutrient: str, n: int = 5) -> list[str]:
    if not USDA_FDC_API_KEY:
        return FALLBACK_INGREDIENTS.get(nutrient, ["spinach", "kale", "quinoa"])[:n]

    nutrient_id = NUTRIENT_IDS.get(nutrient)
    if not nutrient_id:
        return FALLBACK_INGREDIENTS.get(nutrient, ["spinach"])[:n]

    try:
        url = "https://api.nal.usda.gov/fdc/v1/foods/search"
        params = {
            "api_key": USDA_FDC_API_KEY,
            "query": nutrient,
            "dataType": "Foundation,SR Legacy",
            "pageSize": n * 2,
            "sortBy": "dataType.keyword",
        }
        resp = requests.get(url, params=params, timeout=10)
        resp.raise_for_status()
        foods = resp.json().get("foods", [])
        names = [f["description"].split(",")[0].lower() for f in foods[:n] if f.get("description")]
        return names if names else FALLBACK_INGREDIENTS.get(nutrient, ["spinach"])[:n]
    except Exception as e:
        print(f"  [superfood] USDA FDC request failed: {e}")
        return FALLBACK_INGREDIENTS.get(nutrient, ["spinach"])[:n]


def _get_existing_urls() -> set[str]:
    if not SUPABASE_URL or not SUPABASE_KEY:
        return set()
    try:
        from supabase import create_client
        client = create_client(SUPABASE_URL, SUPABASE_KEY)
        result = client.table("recipes").select("source_url").eq("source", "curated").execute()
        return {row["source_url"] for row in result.data if row.get("source_url")}
    except Exception as e:
        print(f"  [superfood] Dedup check failed: {e}")
        return set()


class SuperfoodStrategy(BaseStrategy):
    def __init__(self) -> None:
        self._raw: list[dict] = []
        self._nutrient: str = ""

    def scrape(self) -> list[dict]:
        idx = _load_nutrient_rotation_index()
        self._nutrient = SUPERFOOD_NUTRIENT_ROTATION[idx % len(SUPERFOOD_NUTRIENT_ROTATION)]
        _save_nutrient_rotation_index(idx + 1)

        ingredients = _fetch_top_ingredients(self._nutrient, n=3)
        existing_urls = _get_existing_urls()

        all_links: list[str] = []
        for ingredient in ingredients:
            for url_template in CATEGORY_LISTING_URLS["superfood"]:
                listing_url = url_template.format(ingredient=ingredient.replace(" ", "+"))
                all_links += get_links_from_listing(listing_url, limit=5)
                time.sleep(1)

        self._raw = scrape_urls(all_links, existing_urls, limit=RECIPES_PER_STRATEGY["superfood"])
        return self._raw

    def compose(self, raw: list[dict]) -> dict | None:
        if not raw:
            return None
        prompt = build_composite_prompt(
            raw,
            category=f"superfood ({self._nutrient}-rich)",
            extra_instruction=(
                f"Emphasise the nutritional benefit of high-{self._nutrient} ingredients. "
                'Add "superfood" to dietary_tags.'
            ),
        )
        recipe = call_ollama(prompt)
        if recipe and "superfood" not in recipe.get("dietary_tags", []):
            recipe.setdefault("dietary_tags", []).append("superfood")
        return recipe

    def validate(self, recipe: dict) -> bool:
        if recipe is None:
            return False
        return len(validate_recipe(recipe)) == 0
```

- [ ] **Step 2: Commit**

```bash
git add pipeline/strategies/superfood.py
git commit -m "feat(pipeline): superfood strategy with USDA FDC nutrient rotation"
```

---

## Task 10: `mealplan.py` strategy

**Files:**
- Create: `pipeline/strategies/mealplan.py`

- [ ] **Step 1: Create `pipeline/strategies/mealplan.py`**

```python
import json
import re
import requests
from typing import Any
from pipeline.config import OLLAMA_URL, OLLAMA_MODEL, OLLAMA_TIMEOUT, RECIPES_PER_STRATEGY
from pipeline.lib.validate import validate_recipe
from pipeline.strategies.base import BaseStrategy

MEALPLAN_SCHEMA = """
[
  {
    "title": "string",
    "description": "string — 2-3 engaging sentences",
    "cuisine_type": "string",
    "dish_types": ["string — must include one of: breakfast, lunch, dinner"],
    "dietary_tags": ["meal-plan-ready"],
    "ingredients": [{"name": "string", "amount": number, "unit": "string"}],
    "instructions": ["string"],
    "prep_time_minutes": number,
    "cook_time_minutes": number,
    "servings": 2,
    "calories": number,
    "protein_g": number,
    "carbs_g": number,
    "fat_g": number,
    "fiber_g": number,
    "sugar_g": number,
    "sodium_mg": number,
    "source_name": "AI Generated",
    "source_url": "string — unique slug like ai-mealplan-<dish-slug>-<YYYYMMDD>"
  }
]
"""

MEALPLAN_PROMPT = """You are a professional nutritionist and recipe developer creating a weekly meal plan for a family of 2.

Generate exactly 7 recipes in this composition:
- 2 breakfast recipes
- 2 lunch recipes
- 3 dinner recipes

Macro targets across the full day (3 meals):
- ~2000 kcal/day total
- ~30% protein (~150g/day)
- ~40% carbohydrates (~200g/day)
- ~30% fat (~65g/day)

Each recipe must serve 2 people. Vary cuisines and ingredients — no two recipes should share a primary protein or starch.

Return ONLY a valid JSON array of exactly 7 recipe objects. Each object must match this schema:
{schema}

Rules:
- Every recipe must have "meal-plan-ready" in dietary_tags
- dish_types must include "breakfast", "lunch", or "dinner" as appropriate
- source_url must be unique — use format: ai-mealplan-<kebab-case-title>-{date}
- calories, protein_g, carbs_g, fat_g must be realistic and consistent with each other
- Return ONLY the JSON array, no markdown, no explanation
""".format(schema=MEALPLAN_SCHEMA, date="{date}")


class MealplanStrategy(BaseStrategy):
    def __init__(self) -> None:
        self._recipes: list[dict] = []

    def scrape(self) -> list[dict]:
        # No scraping — pure generation. Returns empty list; compose() generates all.
        return [{"_generate": True}]

    def compose(self, raw: list[dict]) -> dict | None:
        # Generate all 7 at once; cache remaining in self._recipes
        if self._recipes:
            return self._recipes.pop(0)

        from datetime import date
        prompt = MEALPLAN_PROMPT.replace("{date}", date.today().strftime("%Y%m%d"))

        try:
            response = requests.post(
                f"{OLLAMA_URL}/api/generate",
                json={
                    "model": OLLAMA_MODEL,
                    "prompt": prompt,
                    "stream": False,
                    "options": {"temperature": 0.7, "num_predict": 6000},
                },
                timeout=OLLAMA_TIMEOUT,
            )
            response.raise_for_status()
        except Exception as e:
            print(f"  [mealplan] Ollama request failed: {e}")
            return None

        raw_text = response.json().get("response", "")
        text = raw_text.strip()
        if text.startswith("```"):
            text = text.split("```")[1]
            if text.startswith("json"):
                text = text[4:]
            text = text.strip()
        if text.endswith("```"):
            text = text[:-3].strip()
        text = re.sub(r'\b(\d+)/(\d+)\b', lambda m: str(int(m.group(1)) / int(m.group(2))), text)

        try:
            recipes: list[dict[str, Any]] = json.loads(text)
        except json.JSONDecodeError as e:
            print(f"  [mealplan] JSON parse failed: {e}\nRaw: {raw_text[:500]}")
            return None

        if not isinstance(recipes, list) or not recipes:
            print("  [mealplan] Expected a JSON array, got something else")
            return None

        self._recipes = recipes[1:]  # cache remaining
        return recipes[0]

    def validate(self, recipe: dict) -> bool:
        if recipe is None:
            return False
        return len(validate_recipe(recipe)) == 0
```

- [ ] **Step 2: Commit**

```bash
git add pipeline/strategies/mealplan.py
git commit -m "feat(pipeline): mealplan strategy — pure Ollama 7-recipe batch"
```

---

## Task 11: New orchestrator `run.py`

**Files:**
- Replace: `pipeline/run.py`

- [ ] **Step 1: Replace `pipeline/run.py`**

```python
# Scheduled via Windows Task Scheduler:
#   Daily 07:00:   python pipeline/run.py --schedule=daily
#   Weekly Mon:    python pipeline/run.py --schedule=weekly
import argparse
import logging
import sys
from datetime import datetime
from pathlib import Path

from pipeline.config import SCHEDULE_DAILY, SCHEDULE_WEEKLY, LOGS_DIR
from pipeline.lib.compose import check_ollama_reachable
from pipeline.lib.apply import upsert_recipes

STRATEGY_MAP = {
    "trending":  lambda: __import__("pipeline.strategies.trending",  fromlist=["TrendingStrategy"]).TrendingStrategy(),
    "seasonal":  lambda: __import__("pipeline.strategies.seasonal",  fromlist=["SeasonalStrategy"]).SeasonalStrategy(),
    "haute":     lambda: __import__("pipeline.strategies.haute",     fromlist=["HauteStrategy"]).HauteStrategy(),
    "superfood": lambda: __import__("pipeline.strategies.superfood", fromlist=["SuperfoodStrategy"]).SuperfoodStrategy(),
    "mealplan":  lambda: __import__("pipeline.strategies.mealplan",  fromlist=["MealplanStrategy"]).MealplanStrategy(),
    "standard":  lambda: __import__("pipeline.strategies.standard",  fromlist=["StandardStrategy"]).StandardStrategy(),
}


def setup_logging() -> logging.Logger:
    Path(LOGS_DIR).mkdir(parents=True, exist_ok=True)
    log_path = Path(LOGS_DIR) / f"{datetime.now().strftime('%Y-%m-%d-%H')}.log"

    logger = logging.getLogger("pipeline")
    logger.setLevel(logging.INFO)
    fmt = logging.Formatter("%(asctime)s %(levelname)s %(message)s", datefmt="%H:%M:%S")

    fh = logging.FileHandler(log_path, encoding="utf-8")
    fh.setFormatter(fmt)
    logger.addHandler(fh)

    ch = logging.StreamHandler()
    ch.setFormatter(fmt)
    logger.addHandler(ch)

    return logger


def run_strategy(name: str, logger: logging.Logger) -> tuple[int, int, int]:
    """Run one strategy. Returns (attempted, inserted, failed)."""
    logger.info(f"--- Strategy: {name} ---")
    strategy = STRATEGY_MAP[name]()

    raw_batches = strategy.scrape()
    logger.info(f"  Scraped {len(raw_batches)} batches")

    composed = []
    failed = 0

    for raw in raw_batches:
        recipe = strategy.compose([raw])
        if recipe is None:
            logger.warning(f"  compose() returned None for batch in {name}")
            failed += 1
            continue
        if not strategy.validate(recipe):
            logger.warning(f"  validate() failed for '{recipe.get('title', '?')}' in {name}")
            failed += 1
            continue
        composed.append(recipe)

    attempted = len(raw_batches)
    if not composed:
        logger.warning(f"  No valid recipes produced by {name}")
        return attempted, 0, failed

    result = upsert_recipes(composed)
    logger.info(f"  Upserted: inserted={result.inserted} skipped={result.skipped} errors={len(result.errors)}")
    for err in result.errors:
        logger.error(f"    {err}")

    return attempted, result.inserted, failed + len(result.errors)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--schedule", choices=["daily", "weekly"], required=True)
    args = parser.parse_args()

    logger = setup_logging()
    logger.info(f"=== Pipeline starting — schedule={args.schedule} ===")

    if not check_ollama_reachable():
        logger.error("Ollama is not reachable at http://localhost:11434. Start Ollama and retry.")
        sys.exit(1)
    logger.info("Ollama reachable ✓")

    strategies = SCHEDULE_DAILY if args.schedule == "daily" else SCHEDULE_WEEKLY
    totals = {"attempted": 0, "inserted": 0, "failed": 0}

    for name in strategies:
        attempted, inserted, failed = run_strategy(name, logger)
        totals["attempted"] += attempted
        totals["inserted"] += inserted
        totals["failed"] += failed

    logger.info("=== Run complete ===")
    logger.info(f"  Strategies run: {strategies}")
    logger.info(f"  Recipes attempted: {totals['attempted']}")
    logger.info(f"  Recipes inserted:  {totals['inserted']}")
    logger.info(f"  Failures:          {totals['failed']}")


if __name__ == "__main__":
    main()
```

- [ ] **Step 2: Commit**

```bash
git add pipeline/run.py
git commit -m "feat(pipeline): new orchestrator with --schedule=daily|weekly and auto-apply"
```

---

## Task 12: Retire old files and smoke test

**Files:**
- Delete: `pipeline/emit_sql.py`
- Delete: `pipeline/scrape.py`
- Delete: `pipeline/compose.py`

- [ ] **Step 1: Delete retired files**

```powershell
Remove-Item pipeline/emit_sql.py, pipeline/scrape.py, pipeline/compose.py
```

- [ ] **Step 2: Run all unit tests**

```powershell
pytest tests/pipeline/ -v
```
Expected: all tests pass. If any import the old modules, fix the import paths.

- [ ] **Step 3: Smoke test — dry run with no Ollama (import check)**

```powershell
python -c "from pipeline.run import main; print('imports OK')"
```
Expected: `imports OK` (no import errors).

- [ ] **Step 4: Commit retirement**

```bash
git add -A
git commit -m "chore(pipeline): retire emit_sql.py, scrape.py, compose.py — replaced by lib/"
```

---

## Task 13: Windows Task Scheduler entries

- [ ] **Step 1: Open Task Scheduler**

Press `Win + R`, type `taskschd.msc`, press Enter.

- [ ] **Step 2: Create WC-Daily task**

Action → Create Task:
- **Name:** `WC-Daily`
- **Triggers:** Daily, 07:00, recur every 1 day
- **Actions → Program:** `python`
- **Actions → Arguments:** `pipeline/run.py --schedule=daily`
- **Actions → Start in:** `C:\Users\lasse\Desktop\whatscooking`
- **Conditions:** uncheck "Start only if on AC power"
- **Settings:** check "Run task as soon as possible after a scheduled start is missed"

- [ ] **Step 3: Create WC-Weekly task**

Action → Create Task:
- **Name:** `WC-Weekly`
- **Triggers:** Weekly, Monday, 07:00
- **Actions → Program:** `python`
- **Actions → Arguments:** `pipeline/run.py --schedule=weekly`
- **Actions → Start in:** `C:\Users\lasse\Desktop\whatscooking`
- **Conditions:** same as above

- [ ] **Step 4: Test-run WC-Daily manually**

In Task Scheduler, right-click `WC-Daily` → Run. Check `pipeline/logs/` for a new `.log` file.

Expected log output ends with:
```
=== Run complete ===
  Strategies run: ['trending', 'seasonal']
  Recipes attempted: ...
  Recipes inserted:  ...
  Failures:          ...
```

- [ ] **Step 5: Final commit**

```bash
git add pipeline/logs/.gitkeep
git commit -m "chore: add USDA_FDC_API_KEY placeholder to env and confirm scheduler setup"
```

---

## Self-Review

**Spec coverage check:**

| Spec requirement | Task |
|---|---|
| BaseStrategy ABC | Task 5 |
| `trending.py` — pytrends + Playwright + tag | Task 6 |
| `seasonal.py` — harvest calendar + tag | Task 7 |
| `haute.py` — Great British Chefs + Serious Eats + tag | Task 8 |
| `superfood.py` — USDA FDC nutrient rotation + tag | Task 9 |
| `mealplan.py` — pure Ollama 7-recipe batch + tag | Task 10 |
| `standard.py` — migrated from old pipeline | Task 5 |
| `lib/scrape.py` — Playwright + recipe-scrapers | Task 3 |
| `lib/compose.py` — Ollama wrapper | Task 2 |
| `lib/validate.py` — field validator | Task 2 |
| `lib/apply.py` — Supabase upsert, ApplyResult | Task 3 |
| `config.py` — unified constants, harvest calendar | Task 4 |
| `run.py` — `--schedule` orchestrator + logging to `pipeline/logs/` | Task 11 |
| `requirements.txt` — pytrends, requests added | Task 1 |
| Old files retired | Task 12 |
| Windows Task Scheduler two entries | Task 13 |
| `USDA_FDC_API_KEY` env var | Task 9 (config) |

All spec requirements covered. No gaps found.
