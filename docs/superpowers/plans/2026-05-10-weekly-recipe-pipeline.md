# Weekly Recipe Pipeline Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a local weekly pipeline that scrapes real recipe sites with Playwright, composites new recipes via a local Ollama LLM, and emits valid SQL INSERTs matching `seed.sql` schema — ready to review and apply to Supabase.

**Architecture:** Three-stage Python pipeline: (1) Playwright scrapes AllRecipes/Serious Eats/NYT Cooking, (2) Ollama HTTP API composites a new recipe from 2-3 real sources per category, (3) SQL emitter writes a `.sql` file matching `seed.sql` exactly. Runs via Windows Task Scheduler weekly.

**Tech Stack:** Python 3.x, Playwright (sync API), recipe-scrapers, supabase-py 2.28.3, python-dotenv, Ollama (local HTTP API), pytest

---

## File Map

```
whatscooking/pipeline/
  config.py                   # all constants — model, URLs, category rotation
  run.py                      # orchestrator — calls stages in sequence, writes log
  scrape.py                   # Stage 1: Playwright discovery + recipe-scrapers extraction
  compose.py                  # Stage 2: Ollama compositor + field validator
  emit_sql.py                 # Stage 3: SQL renderer → output/YYYY-MM-DD.sql
  requirements.txt            # Python dependencies
  output/                     # generated .sql and .log files (gitignored)
  rotation_state.json         # tracks which categories were used last week
tests/pipeline/
  test_compose.py             # unit tests for compose.py validator + prompt builder
  test_emit_sql.py            # unit tests for SQL rendering
  conftest.py                 # shared fixtures
```

---

## Task 1: Project Scaffold + Config

**Files:**
- Create: `pipeline/config.py`
- Create: `pipeline/requirements.txt`
- Create: `pipeline/output/.gitkeep`
- Modify: `.gitignore` (add `pipeline/output/*.sql`, `pipeline/output/*.log`, `pipeline/rotation_state.json`)
- Create: `tests/pipeline/conftest.py`

- [ ] **Step 1: Create `pipeline/requirements.txt`**

```
playwright==1.44.0
recipe-scrapers==14.55.0
supabase==2.28.3
python-dotenv==1.0.1
pytest==8.2.0
requests==2.32.3
```

- [ ] **Step 2: Create `pipeline/config.py`**

```python
import os
from dotenv import load_dotenv

load_dotenv(dotenv_path=".env.local")

OLLAMA_URL = "http://localhost:11434"
OLLAMA_MODEL = "llama3.2"
OLLAMA_TIMEOUT = 120  # seconds

CATEGORIES_PER_RUN = 4
RECIPES_PER_CATEGORY = 2  # scraped sources; LLM composites 1 per category

CATEGORIES_ROTATION = [
    "main-course", "pasta", "soup", "salad",
    "breakfast", "dessert", "vegetarian", "vegan",
    "asian", "mediterranean", "mexican", "comfort-food",
]

# Per-category search URLs for each source site
CATEGORY_URLS = {
    "main-course": {
        "AllRecipes": "https://www.allrecipes.com/recipes/80/main-dish/",
        "Serious Eats": "https://www.seriouseats.com/mains-recipes-5117806",
    },
    "pasta": {
        "AllRecipes": "https://www.allrecipes.com/recipes/95/main-dish/pasta/",
        "Serious Eats": "https://www.seriouseats.com/pasta-recipes-5117824",
    },
    "soup": {
        "AllRecipes": "https://www.allrecipes.com/recipes/94/soups-stews-and-chili/",
        "Serious Eats": "https://www.seriouseats.com/soup-recipes-5117827",
    },
    "salad": {
        "AllRecipes": "https://www.allrecipes.com/recipes/96/salad/",
        "Serious Eats": "https://www.seriouseats.com/salad-recipes-5117825",
    },
    "breakfast": {
        "AllRecipes": "https://www.allrecipes.com/recipes/78/breakfast-and-brunch/",
        "Serious Eats": "https://www.seriouseats.com/breakfast-and-brunch-recipes-5117807",
    },
    "dessert": {
        "AllRecipes": "https://www.allrecipes.com/recipes/79/desserts/",
        "Serious Eats": "https://www.seriouseats.com/dessert-recipes-5117811",
    },
    "vegetarian": {
        "AllRecipes": "https://www.allrecipes.com/recipes/87/everyday-cooking/vegetarian/",
        "Serious Eats": "https://www.seriouseats.com/vegetarian-recipes-5117830",
    },
    "vegan": {
        "AllRecipes": "https://www.allrecipes.com/recipes/1116/everyday-cooking/vegan/",
        "Serious Eats": "https://www.seriouseats.com/vegan-recipes-5117829",
    },
    "asian": {
        "AllRecipes": "https://www.allrecipes.com/recipes/233/world-cuisine/asian/",
        "Serious Eats": "https://www.seriouseats.com/asian-recipes-5117804",
    },
    "mediterranean": {
        "AllRecipes": "https://www.allrecipes.com/recipes/723/world-cuisine/european/greek/",
        "Serious Eats": "https://www.seriouseats.com/mediterranean-recipes-5117820",
    },
    "mexican": {
        "AllRecipes": "https://www.allrecipes.com/recipes/728/world-cuisine/latin-american/mexican/",
        "Serious Eats": "https://www.seriouseats.com/mexican-recipes-5117821",
    },
    "comfort-food": {
        "AllRecipes": "https://www.allrecipes.com/recipes/1642/everyday-cooking/",
        "Serious Eats": "https://www.seriouseats.com/comfort-food-recipes-5117809",
    },
}

OUTPUT_DIR = "pipeline/output"
ROTATION_STATE_FILE = "pipeline/rotation_state.json"

SUPABASE_URL = os.getenv("NEXT_PUBLIC_SUPABASE_URL", "")
SUPABASE_KEY = os.getenv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "")
```

- [ ] **Step 3: Create `pipeline/output/.gitkeep`**

Create an empty file at `pipeline/output/.gitkeep`.

- [ ] **Step 4: Update `.gitignore`**

Append to `.gitignore`:
```
pipeline/output/*.sql
pipeline/output/*.log
pipeline/rotation_state.json
```

- [ ] **Step 5: Create `tests/pipeline/conftest.py`**

```python
import pytest

@pytest.fixture
def sample_raw_recipe():
    return {
        "title": "Test Pasta",
        "ingredients": ["200g spaghetti", "2 eggs", "100g pancetta", "50g Pecorino"],
        "instructions": ["Boil pasta.", "Fry pancetta.", "Mix eggs and cheese.", "Combine off heat."],
        "image_url": "https://images.unsplash.com/photo-test?w=800&q=80",
        "cook_time_minutes": 20,
        "prep_time_minutes": 10,
        "servings": 2,
        "cuisine_type": "Italian",
        "dietary_tags": [],
        "source_url": "https://www.seriouseats.com/test-pasta",
        "source_name": "Serious Eats",
    }

@pytest.fixture
def sample_composed_recipe():
    return {
        "title": "Silky Carbonara",
        "description": "A Roman classic done right — guanciale rendered until crisp.",
        "cuisine_type": "Italian",
        "dish_types": ["main course", "pasta"],
        "dietary_tags": [],
        "ingredients": [
            {"name": "spaghetti", "amount": 400, "unit": "g"},
            {"name": "guanciale", "amount": 150, "unit": "g"},
            {"name": "eggs", "amount": 4, "unit": "whole"},
            {"name": "Pecorino Romano", "amount": 80, "unit": "g"},
        ],
        "instructions": ["Cook pasta.", "Render guanciale.", "Mix eggs and cheese.", "Combine off heat."],
        "prep_time_minutes": 10,
        "cook_time_minutes": 20,
        "servings": 4,
        "calories": 620,
        "protein_g": 28,
        "carbs_g": 72,
        "fat_g": 22,
        "fiber_g": 3,
        "sugar_g": 2,
        "sodium_mg": 780,
        "source_name": "Serious Eats, AllRecipes",
        "source_url": "https://www.seriouseats.com/best-pasta-carbonara-recipe",
    }
```

- [ ] **Step 6: Install dependencies**

```bash
cd C:\Users\lasse\Desktop\whatscooking
pip install -r pipeline/requirements.txt
playwright install chromium
```

Expected: All packages install without error. Chromium browser downloaded.

- [ ] **Step 7: Commit scaffold**

```bash
git add pipeline/ tests/pipeline/ .gitignore
git commit -m "feat(pipeline): scaffold weekly recipe pipeline structure"
```

---

## Task 2: SQL Emitter (`emit_sql.py`)

Build first — it's pure data transformation with no external dependencies, easiest to TDD.

**Files:**
- Create: `pipeline/emit_sql.py`
- Create: `tests/pipeline/test_emit_sql.py`

- [ ] **Step 1: Write failing tests**

Create `tests/pipeline/test_emit_sql.py`:

```python
import pytest
from pipeline.emit_sql import recipe_to_sql, escape_sql_string, format_jsonb_ingredients, format_sql_array


def test_escape_sql_string_handles_single_quotes():
    assert escape_sql_string("It's good") == "It''s good"


def test_escape_sql_string_plain():
    assert escape_sql_string("Hello") == "Hello"


def test_format_jsonb_ingredients():
    ingredients = [{"name": "pasta", "amount": 200, "unit": "g"}]
    result = format_jsonb_ingredients(ingredients)
    assert result == '[{"name": "pasta", "amount": 200, "unit": "g"}]'


def test_format_sql_array_strings():
    result = format_sql_array(["main course", "pasta"])
    assert result == "ARRAY['main course','pasta']"


def test_format_sql_array_empty():
    result = format_sql_array([])
    assert result == "ARRAY[]::text[]"


def test_recipe_to_sql_contains_insert(sample_composed_recipe):
    sql = recipe_to_sql(sample_composed_recipe)
    assert sql.startswith("insert into recipes (")


def test_recipe_to_sql_contains_title(sample_composed_recipe):
    sql = recipe_to_sql(sample_composed_recipe)
    assert "Silky Carbonara" in sql


def test_recipe_to_sql_contains_curated_source(sample_composed_recipe):
    sql = recipe_to_sql(sample_composed_recipe)
    assert "'curated'" in sql


def test_recipe_to_sql_contains_jsonb_cast(sample_composed_recipe):
    sql = recipe_to_sql(sample_composed_recipe)
    assert "::jsonb" in sql


def test_recipe_to_sql_escapes_quotes():
    recipe = {
        "title": "Chef's Special",
        "description": "It's great.",
        "cuisine_type": "American",
        "dish_types": ["main course"],
        "dietary_tags": [],
        "ingredients": [{"name": "chicken", "amount": 1, "unit": "whole"}],
        "instructions": ["Cook it."],
        "prep_time_minutes": 5,
        "cook_time_minutes": 30,
        "servings": 4,
        "calories": 400,
        "protein_g": 30,
        "carbs_g": 10,
        "fat_g": 15,
        "fiber_g": 1,
        "sugar_g": 0,
        "sodium_mg": 500,
        "source_name": "Test",
        "source_url": "https://example.com/test",
    }
    sql = recipe_to_sql(recipe)
    assert "Chef''s Special" in sql
    assert "It''s great." in sql
```

- [ ] **Step 2: Run tests — verify they fail**

```bash
cd C:\Users\lasse\Desktop\whatscooking
python -m pytest tests/pipeline/test_emit_sql.py -v
```

Expected: `ModuleNotFoundError: No module named 'pipeline.emit_sql'`

- [ ] **Step 3: Implement `pipeline/emit_sql.py`**

```python
import json
from datetime import date
from pathlib import Path
from typing import Any


def escape_sql_string(value: str) -> str:
    return value.replace("'", "''")


def format_jsonb_ingredients(ingredients: list[dict]) -> str:
    return json.dumps(ingredients, ensure_ascii=False)


def format_sql_array(items: list[str]) -> str:
    if not items:
        return "ARRAY[]::text[]"
    escaped = [f"'{escape_sql_string(i)}'" for i in items]
    return f"ARRAY[{','.join(escaped)}]"


def recipe_to_sql(recipe: dict[str, Any]) -> str:
    def s(val: Any) -> str:
        if val is None:
            return "NULL"
        return f"'{escape_sql_string(str(val))}'"

    def n(val: Any) -> str:
        if val is None:
            return "NULL"
        return str(val)

    ingredients_json = escape_sql_string(format_jsonb_ingredients(recipe["ingredients"]))
    instructions_sql = format_sql_array(recipe["instructions"])
    dish_types_sql = format_sql_array(recipe.get("dish_types", []))
    dietary_tags_sql = format_sql_array(recipe.get("dietary_tags", []))

    return (
        f"insert into recipes (\n"
        f"  source, source_name, source_url,\n"
        f"  title, description, image_url,\n"
        f"  cuisine_type, dish_types, dietary_tags,\n"
        f"  ingredients, instructions,\n"
        f"  prep_time_minutes, cook_time_minutes, servings,\n"
        f"  calories, protein_g, carbs_g, fat_g, fiber_g, sugar_g, sodium_mg\n"
        f") values (\n"
        f"  'curated', {s(recipe.get('source_name'))}, {s(recipe.get('source_url'))},\n"
        f"  {s(recipe['title'])},\n"
        f"  {s(recipe.get('description', ''))},\n"
        f"  {s(recipe.get('image_url'))},\n"
        f"  {s(recipe.get('cuisine_type'))},\n"
        f"  {dish_types_sql}, {dietary_tags_sql},\n"
        f"  '{ingredients_json}'::jsonb,\n"
        f"  {instructions_sql},\n"
        f"  {n(recipe.get('prep_time_minutes'))}, {n(recipe.get('cook_time_minutes'))}, {n(recipe.get('servings'))},\n"
        f"  {n(recipe.get('calories'))}, {n(recipe.get('protein_g'))}, {n(recipe.get('carbs_g'))},\n"
        f"  {n(recipe.get('fat_g'))}, {n(recipe.get('fiber_g'))}, {n(recipe.get('sugar_g'))}, {n(recipe.get('sodium_mg'))}\n"
        f");"
    )


def write_sql_file(recipes: list[dict], output_dir: str = "pipeline/output") -> str:
    Path(output_dir).mkdir(parents=True, exist_ok=True)
    filename = f"{date.today().isoformat()}.sql"
    filepath = Path(output_dir) / filename

    header = (
        "-- What's Cooking — Weekly Curated Recipes\n"
        f"-- Generated: {date.today().isoformat()}\n"
        "-- Review before applying to Supabase\n\n"
    )

    statements = "\n\n".join(recipe_to_sql(r) for r in recipes)

    with open(filepath, "w", encoding="utf-8") as f:
        f.write(header + statements + "\n")

    return str(filepath)
```

- [ ] **Step 4: Add `pipeline/__init__.py`**

Create an empty `pipeline/__init__.py` so Python treats it as a package.

- [ ] **Step 5: Add `tests/pipeline/__init__.py`**

Create an empty `tests/pipeline/__init__.py`.

- [ ] **Step 6: Add `pytest.ini` if not present**

Check if `pytest.ini` exists at project root. If not, create it:

```ini
[pytest]
pythonpath = .
```

- [ ] **Step 7: Run tests — verify they pass**

```bash
python -m pytest tests/pipeline/test_emit_sql.py -v
```

Expected: All 10 tests PASS.

- [ ] **Step 8: Commit**

```bash
git add pipeline/__init__.py pipeline/emit_sql.py tests/pipeline/__init__.py tests/pipeline/test_emit_sql.py pytest.ini
git commit -m "feat(pipeline): SQL emitter with full seed.sql-compatible output"
```

---

## Task 3: LLM Compositor (`compose.py`)

**Files:**
- Create: `pipeline/compose.py`
- Create: `tests/pipeline/test_compose.py`

- [ ] **Step 1: Write failing tests**

Create `tests/pipeline/test_compose.py`:

```python
import pytest
from pipeline.compose import build_prompt, validate_recipe, REQUIRED_FIELDS


def test_validate_recipe_passes_valid(sample_composed_recipe):
    errors = validate_recipe(sample_composed_recipe)
    assert errors == []


def test_validate_recipe_missing_title():
    recipe = {"description": "Good", "ingredients": [{"name": "x", "amount": 1, "unit": "g"}],
               "instructions": ["Cook."], "calories": 400, "servings": 2,
               "prep_time_minutes": 5, "cook_time_minutes": 10,
               "protein_g": 10, "carbs_g": 20, "fat_g": 5,
               "fiber_g": 1, "sugar_g": 2, "sodium_mg": 300}
    errors = validate_recipe(recipe)
    assert any("title" in e for e in errors)


def test_validate_recipe_zero_calories():
    recipe = {"title": "Test", "description": "Good",
               "ingredients": [{"name": "x", "amount": 1, "unit": "g"}],
               "instructions": ["Cook."], "calories": 0, "servings": 2,
               "prep_time_minutes": 5, "cook_time_minutes": 10,
               "protein_g": 10, "carbs_g": 20, "fat_g": 5,
               "fiber_g": 1, "sugar_g": 2, "sodium_mg": 300}
    errors = validate_recipe(recipe)
    assert any("calories" in e for e in errors)


def test_validate_recipe_empty_ingredients():
    recipe = {"title": "Test", "description": "Good",
               "ingredients": [], "instructions": ["Cook."],
               "calories": 400, "servings": 2,
               "prep_time_minutes": 5, "cook_time_minutes": 10,
               "protein_g": 10, "carbs_g": 20, "fat_g": 5,
               "fiber_g": 1, "sugar_g": 2, "sodium_mg": 300}
    errors = validate_recipe(recipe)
    assert any("ingredients" in e for e in errors)


def test_validate_recipe_missing_ingredient_fields():
    recipe = {"title": "Test", "description": "Good",
               "ingredients": [{"name": "pasta"}],  # missing amount + unit
               "instructions": ["Cook."], "calories": 400, "servings": 2,
               "prep_time_minutes": 5, "cook_time_minutes": 10,
               "protein_g": 10, "carbs_g": 20, "fat_g": 5,
               "fiber_g": 1, "sugar_g": 2, "sodium_mg": 300}
    errors = validate_recipe(recipe)
    assert any("amount" in e or "unit" in e for e in errors)


def test_build_prompt_contains_source_titles(sample_raw_recipe):
    raw_recipes = [sample_raw_recipe, {**sample_raw_recipe, "title": "Other Pasta"}]
    prompt = build_prompt(raw_recipes, category="pasta")
    assert "Test Pasta" in prompt
    assert "Other Pasta" in prompt
    assert "pasta" in prompt.lower()


def test_build_prompt_requests_json_output(sample_raw_recipe):
    prompt = build_prompt([sample_raw_recipe], category="pasta")
    assert "JSON" in prompt
```

- [ ] **Step 2: Run tests — verify they fail**

```bash
python -m pytest tests/pipeline/test_compose.py -v
```

Expected: `ModuleNotFoundError: No module named 'pipeline.compose'`

- [ ] **Step 3: Implement `pipeline/compose.py`**

```python
import json
import requests
from typing import Any
from pipeline.config import OLLAMA_URL, OLLAMA_MODEL, OLLAMA_TIMEOUT

REQUIRED_FIELDS = [
    "title", "description", "ingredients", "instructions",
    "calories", "servings", "prep_time_minutes", "cook_time_minutes",
    "protein_g", "carbs_g", "fat_g", "fiber_g", "sugar_g", "sodium_mg",
]

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


def build_prompt(raw_recipes: list[dict], category: str) -> str:
    sources_text = ""
    for i, r in enumerate(raw_recipes, 1):
        sources_text += f"\n--- Source {i}: {r.get('source_name', 'Unknown')} ---\n"
        sources_text += f"Title: {r['title']}\n"
        sources_text += f"Ingredients: {', '.join(r.get('ingredients', []))}\n"
        instructions = r.get('instructions', [])
        sources_text += f"Instructions: {' '.join(instructions[:5])}\n"
        sources_text += f"URL: {r.get('source_url', '')}\n"

    return f"""You are a professional recipe developer creating composite recipes for a meal planning app.

I have scraped {len(raw_recipes)} real {category} recipes from cooking websites. Your task is to create ONE new composite recipe inspired by the best techniques and ingredients from these sources. Do NOT copy any single recipe — combine the best ideas into something new.

{sources_text}

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


def check_ollama_reachable() -> bool:
    try:
        r = requests.get(f"{OLLAMA_URL}/api/tags", timeout=5)
        return r.status_code == 200
    except Exception:
        return False


def compose_recipe(raw_recipes: list[dict], category: str) -> dict[str, Any] | None:
    prompt = build_prompt(raw_recipes, category)

    try:
        response = requests.post(
            f"{OLLAMA_URL}/api/generate",
            json={"model": OLLAMA_MODEL, "prompt": prompt, "stream": False},
            timeout=OLLAMA_TIMEOUT,
        )
        response.raise_for_status()
    except Exception as e:
        print(f"  [compose] Ollama request failed: {e}")
        return None

    raw_text = response.json().get("response", "")

    # Strip markdown fences if present
    text = raw_text.strip()
    if text.startswith("```"):
        text = text.split("```")[1]
        if text.startswith("json"):
            text = text[4:]
        text = text.strip()
    if text.endswith("```"):
        text = text[:-3].strip()

    try:
        recipe = json.loads(text)
    except json.JSONDecodeError as e:
        print(f"  [compose] JSON parse failed: {e}")
        print(f"  [compose] Raw response: {raw_text[:500]}")
        return None

    errors = validate_recipe(recipe)
    if errors:
        print(f"  [compose] Validation failed for '{recipe.get('title', '?')}': {errors}")
        return None

    return recipe
```

- [ ] **Step 4: Run tests — verify they pass**

```bash
python -m pytest tests/pipeline/test_compose.py -v
```

Expected: All 7 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add pipeline/compose.py tests/pipeline/test_compose.py
git commit -m "feat(pipeline): LLM compositor with Ollama HTTP API and field validator"
```

---

## Task 4: Scraper (`scrape.py`)

**Files:**
- Create: `pipeline/scrape.py`

No unit tests for the scraper — Playwright tests require a live browser and real network. Manual verification in Task 6 instead.

- [ ] **Step 1: Implement `pipeline/scrape.py`**

```python
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
```

- [ ] **Step 2: Commit**

```bash
git add pipeline/scrape.py
git commit -m "feat(pipeline): Playwright scraper with recipe-scrapers + ld+json fallback"
```

---

## Task 5: Orchestrator + Run Log (`run.py`)

**Files:**
- Create: `pipeline/run.py`

- [ ] **Step 1: Implement `pipeline/run.py`**

```python
import json
import sys
import logging
from datetime import date
from pathlib import Path

from pipeline.config import (
    CATEGORIES_ROTATION, CATEGORIES_PER_RUN,
    OUTPUT_DIR, ROTATION_STATE_FILE
)
from pipeline.compose import check_ollama_reachable, compose_recipe
from pipeline.scrape import scrape_category, get_existing_urls
from pipeline.emit_sql import write_sql_file


def setup_logging(output_dir: str) -> logging.Logger:
    Path(output_dir).mkdir(parents=True, exist_ok=True)
    log_path = Path(output_dir) / f"{date.today().isoformat()}.log"

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


def load_rotation_state() -> int:
    """Return the index of the next category to start from."""
    state_path = Path(ROTATION_STATE_FILE)
    if state_path.exists():
        try:
            return json.loads(state_path.read_text())["next_index"]
        except Exception:
            pass
    return 0


def save_rotation_state(next_index: int) -> None:
    Path(ROTATION_STATE_FILE).write_text(json.dumps({"next_index": next_index}))


def pick_categories(start_index: int) -> tuple[list[str], int]:
    """Pick CATEGORIES_PER_RUN categories round-robin, return (categories, new_next_index)."""
    total = len(CATEGORIES_ROTATION)
    indices = [(start_index + i) % total for i in range(CATEGORIES_PER_RUN)]
    categories = [CATEGORIES_ROTATION[i] for i in indices]
    next_index = (start_index + CATEGORIES_PER_RUN) % total
    return categories, next_index


def main() -> None:
    logger = setup_logging(OUTPUT_DIR)
    logger.info("=== Weekly Recipe Pipeline starting ===")

    # Check Ollama
    if not check_ollama_reachable():
        logger.error("Ollama is not reachable at http://localhost:11434. Start Ollama and retry.")
        sys.exit(1)
    logger.info("Ollama reachable ✓")

    # Pick this week's categories
    start_index = load_rotation_state()
    categories, next_index = pick_categories(start_index)
    logger.info(f"Categories this run: {categories}")

    # Fetch existing URLs for dedup
    existing_urls = get_existing_urls()
    logger.info(f"Existing curated URLs in DB: {len(existing_urls)}")

    composed_recipes = []
    validation_failures = []

    for category in categories:
        logger.info(f"--- Category: {category} ---")

        # Stage 1: Scrape
        raw_recipes = scrape_category(category, existing_urls)
        logger.info(f"  Scraped {len(raw_recipes)} raw recipes for '{category}'")

        if len(raw_recipes) < 1:
            logger.warning(f"  Not enough scraped recipes for '{category}', skipping composition")
            continue

        # Stage 2: Compose
        recipe = compose_recipe(raw_recipes, category)
        if recipe is None:
            msg = f"Composition failed for category '{category}'"
            logger.warning(f"  {msg}")
            validation_failures.append(msg)
            continue

        composed_recipes.append(recipe)
        logger.info(f"  Composed: '{recipe['title']}'")

    # Stage 3: Emit SQL
    if composed_recipes:
        sql_path = write_sql_file(composed_recipes, OUTPUT_DIR)
        logger.info(f"SQL written to: {sql_path}")
    else:
        logger.warning("No recipes composed this run — no SQL file written")
        sql_path = None

    # Save rotation state
    save_rotation_state(next_index)

    # Summary
    logger.info("=== Run complete ===")
    logger.info(f"  Categories targeted: {categories}")
    logger.info(f"  Recipes composed: {len(composed_recipes)}")
    logger.info(f"  Validation failures: {len(validation_failures)}")
    if validation_failures:
        for f in validation_failures:
            logger.info(f"    - {f}")
    if sql_path:
        logger.info(f"  Output: {sql_path}")
        logger.info("  Next step: review SQL file and apply via Supabase SQL editor")


if __name__ == "__main__":
    main()
```

- [ ] **Step 2: Commit**

```bash
git add pipeline/run.py
git commit -m "feat(pipeline): orchestrator with rotation state, logging, and run summary"
```

---

## Task 6: Manual End-to-End Verification

No automated test possible here (requires live Ollama + network). Run manually to verify the full pipeline.

- [ ] **Step 1: Ensure Ollama is running with a model**

```bash
ollama list
```

Expected: At least one model listed (e.g. `llama3.2`). If none: `ollama pull llama3.2`

Update `OLLAMA_MODEL` in `pipeline/config.py` to match your installed model name.

- [ ] **Step 2: Run the pipeline**

```bash
cd C:\Users\lasse\Desktop\whatscooking
python pipeline/run.py
```

Expected output (example):
```
10:00:00 INFO === Weekly Recipe Pipeline starting ===
10:00:01 INFO Ollama reachable ✓
10:00:01 INFO Categories this run: ['main-course', 'pasta', 'soup', 'salad']
10:00:01 INFO Existing curated URLs in DB: 42
10:00:01 INFO --- Category: main-course ---
10:00:15 INFO   Scraped 2 raw recipes for 'main-course'
10:01:10 INFO   Composed: 'Herb-Crusted Chicken with Roasted Vegetables'
...
10:05:00 INFO SQL written to: pipeline/output/2026-05-10.sql
10:05:00 INFO === Run complete ===
```

- [ ] **Step 3: Inspect the generated SQL file**

Open `pipeline/output/2026-05-10.sql`. Verify:
- Each recipe has a full INSERT statement
- `ingredients` column contains valid JSONB (`[{"name":...,"amount":...,"unit":...}]`)
- `instructions` is `ARRAY['Step 1.','Step 2.',...]`
- No NULL in `title`, `calories`, `servings`
- `source='curated'` on every row

- [ ] **Step 4: Apply one recipe to Supabase as a test**

Copy a single INSERT from the SQL file. Run it in Supabase SQL editor. Verify the recipe appears in the app's discover/meals page.

- [ ] **Step 5: Commit verification result**

```bash
git add pipeline/rotation_state.json
git commit -m "chore(pipeline): save initial rotation state after first verified run"
```

---

## Task 7: Windows Task Scheduler Setup

- [ ] **Step 1: Create the scheduled task via PowerShell**

Open PowerShell as Administrator and run:

```powershell
$action = New-ScheduledTaskAction `
    -Execute "python" `
    -Argument "pipeline\run.py" `
    -WorkingDirectory "C:\Users\lasse\Desktop\whatscooking"

$trigger = New-ScheduledTaskTrigger -Weekly -DaysOfWeek Monday -At 7:00AM

$settings = New-ScheduledTaskSettingsSet `
    -ExecutionTimeLimit (New-TimeSpan -Hours 2) `
    -RestartCount 1 `
    -RestartInterval (New-TimeSpan -Minutes 10)

Register-ScheduledTask `
    -TaskName "WhatsCooking-WeeklyRecipes" `
    -Action $action `
    -Trigger $trigger `
    -Settings $settings `
    -Description "Weekly recipe pipeline: scrape + compose + emit SQL"
```

- [ ] **Step 2: Verify task registered**

```powershell
Get-ScheduledTask -TaskName "WhatsCooking-WeeklyRecipes" | Select-Object TaskName, State
```

Expected: `TaskName: WhatsCooking-WeeklyRecipes  State: Ready`

- [ ] **Step 3: Test-run via Task Scheduler**

```powershell
Start-ScheduledTask -TaskName "WhatsCooking-WeeklyRecipes"
Start-Sleep -Seconds 10
Get-ScheduledTaskInfo -TaskName "WhatsCooking-WeeklyRecipes" | Select-Object LastRunTime, LastTaskResult
```

Expected: `LastTaskResult: 0` (success)

- [ ] **Step 4: Commit task documentation note**

Add a comment at the top of `pipeline/run.py`:

```python
# Scheduled via Windows Task Scheduler: weekly Monday 07:00
# Setup: see docs/superpowers/plans/2026-05-10-weekly-recipe-pipeline.md Task 7
```

```bash
git add pipeline/run.py
git commit -m "docs(pipeline): note Task Scheduler registration in run.py"
```

---

## Self-Review

**Spec coverage check:**
- ✅ Stage 1 scraper (Playwright + recipe-scrapers + ld+json fallback) — Task 4
- ✅ Dedup against Supabase — Task 4 (`get_existing_urls`)
- ✅ Category rotation with state persistence — Task 5
- ✅ Stage 2 Ollama compositor with validation — Task 3
- ✅ Stage 3 SQL emitter matching seed.sql exactly — Task 2
- ✅ Run log (`.log` file) — Task 5
- ✅ Windows Task Scheduler — Task 7
- ✅ `config.py` with all constants — Task 1
- ✅ `requirements.txt` — Task 1
- ✅ Manual verification gate before applying SQL — Task 6

**Placeholder scan:** No TBDs, no "implement later" — all code is complete.

**Type consistency:**
- `compose_recipe()` returns `dict | None` — matches usage in `run.py`
- `scrape_category()` returns `list[dict]` — matches usage in `run.py`
- `write_sql_file()` accepts `list[dict]` — matches `composed_recipes` in `run.py`
- `recipe_to_sql()` used internally by `write_sql_file()` — consistent
