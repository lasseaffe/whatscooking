# Unified Recipe Pipeline — Design Spec
**Date:** 2026-05-10
**Project:** What's Cooking
**Status:** Approved

---

## Goal

Replace the existing weekly single-strategy pipeline with a unified multi-category system that automatically populates the `recipes` table with trending, seasonal, haute cuisine, superfood, meal-plan-ready, and standard curated recipes. Runs on two schedules (daily + weekly) via Windows Task Scheduler. Auto-applies to Supabase — no manual SQL review gate. Fully free: local Ollama LLM, free-tier APIs only.

---

## Architecture

```
Task Scheduler: daily 07:00
    └── run.py --schedule=daily
            └── strategies: trending, seasonal

Task Scheduler: weekly Monday 07:00
    └── run.py --schedule=weekly
            └── strategies: standard, haute, superfood, mealplan

run.py (orchestrator)
    │
    ├── strategies/
    │   ├── base.py          # BaseStrategy interface: scrape() → compose() → validate()
    │   ├── trending.py      # PyTrends → recipe URLs → Ollama composite
    │   ├── seasonal.py      # USDA FDC harvest calendar → Ollama composite
    │   ├── haute.py         # Great British Chefs / Serious Eats techniques → Ollama
    │   ├── superfood.py     # USDA FDC nutrient lookup → Ollama composite
    │   ├── mealplan.py      # Balanced macro set → Ollama multi-recipe batch
    │   └── standard.py      # Existing AllRecipes/NYT/Bon Appétit logic (migrated)
    │
    ├── lib/
    │   ├── scrape.py        # Shared Playwright + recipe-scrapers helpers
    │   ├── compose.py       # Shared Ollama HTTP wrapper
    │   ├── validate.py      # Shared field validator
    │   └── apply.py         # Supabase upsert (auto-apply, no SQL files)
    │
    └── config.py            # All constants, schedule mappings, source URLs
```

---

## Strategy Modules

All strategies implement the same `BaseStrategy` ABC from `strategies/base.py`:

```python
class BaseStrategy(ABC):
    @abstractmethod
    def scrape(self) -> list[dict]: ...

    @abstractmethod
    def compose(self, raw: list[dict]) -> dict: ...

    @abstractmethod
    def validate(self, recipe: dict) -> bool: ...
```

The orchestrator calls `scrape() → compose() → validate()` identically for all strategies.

### `trending.py`
- Uses `pytrends` (free, no API key) to pull top 5 rising search terms in the "Food & Drink" category
- Each term fed to Playwright → AllRecipes/Serious Eats to find 2 matching recipe URLs
- Ollama composites one recipe per trending term
- Runs daily — up to 5 new recipes per day
- Tagged: `dietary_tags: ["trending"]`

### `seasonal.py`
- Queries USDA FDC (`api.nal.usda.gov`, free API key) for produce in peak season by current month
- Uses a hardcoded US harvest calendar for v1 (no geo-complexity)
- Selects 4 seasonal ingredients, finds recipe URLs featuring them, Ollama composites
- Runs daily — keeps seasonal content fresh as months turn
- Tagged: `dietary_tags: ["seasonal"]`

### `haute.py`
- Playwright scrapes Great British Chefs and Serious Eats "techniques" sections
- Targets fine-dining-adjacent recipes (sous vide, reductions, plated desserts)
- Ollama prompted to preserve technique fidelity, not just ingredient lists
- Runs weekly — 4 recipes per run
- Tagged: `dish_types: ["fine-dining"]`

### `superfood.py`
- Pulls top 10 nutrient-dense foods from USDA FDC by a target nutrient (rotates weekly: fiber → omega-3 → antioxidants → iron → calcium → vitamin-c)
- Finds recipe URLs featuring those ingredients
- Ollama composites with prompt emphasizing nutritional benefit
- Runs weekly — 4 recipes per run
- Tagged: `dietary_tags: ["superfood"]`

### `mealplan.py`
- No scraping — pure Ollama generation
- Single prompt generates a balanced 7-recipe weekly set: breakfast ×2, lunch ×2, dinner ×3
- Macro targets: ≈2000 kcal/day, 30% protein, 40% carbs, 30% fat
- Runs weekly — 7 recipes per run
- Tagged: `dish_types: ["meal-plan-ready"]`

### `standard.py`
- Migration of existing `scrape.py` + `compose.py` logic
- Sources: AllRecipes, NYT Cooking, Bon Appétit
- 4 categories per run, round-robin rotation
- Unchanged behavior, refactored to implement `BaseStrategy`

---

## `apply.py` — Auto-Apply to Supabase

Replaces the manual SQL file workflow entirely.

```python
def upsert_recipes(recipes: list[dict]) -> ApplyResult:
    # Returns: inserted count, skipped count, error list
```

- Uses Supabase Python SDK with `on_conflict="source_url"` — re-running never creates duplicates
- Credentials loaded from `.env.local`
- Batch upsert per run; per-row errors logged individually, batch continues on partial failure
- No SQL output files — `pipeline/output/` directory is retired

---

## Logging

After each run, `run.py` writes `pipeline/logs/YYYY-MM-DD-HH.log`:

- Strategy name and schedule type
- Recipes attempted / inserted / skipped (dupe) / failed
- Ollama and Supabase errors with full tracebacks

Logs are kept (not gitignored) — they serve as the audit trail replacing the old manual review gate.

---

## Config (`config.py`)

```python
OLLAMA_MODEL = "llama3.2"
OLLAMA_URL = "http://localhost:11434"

SCHEDULE_DAILY = ["trending", "seasonal"]
SCHEDULE_WEEKLY = ["standard", "haute", "superfood", "mealplan"]

RECIPES_PER_STRATEGY = {
    "trending": 5,
    "seasonal": 4,
    "haute": 4,
    "superfood": 4,
    "mealplan": 7,
    "standard": 4,
}

SOURCES = {
    "standard": ["allrecipes.com", "cooking.nytimes.com", "bonappetit.com"],
    "haute": ["greatbritishchefs.com", "seriouseats.com"],
    "superfood": ["allrecipes.com", "seriouseats.com"],
    "trending": ["allrecipes.com", "seriouseats.com"],
    "seasonal": ["allrecipes.com", "cooking.nytimes.com"],
}

USDA_FDC_API_KEY = os.getenv("USDA_FDC_API_KEY")

SUPERFOOD_NUTRIENT_ROTATION = [
    "fiber", "omega-3", "antioxidants", "iron", "calcium", "vitamin-c"
]

STANDARD_CATEGORIES_ROTATION = [
    "main-course", "pasta", "soup", "salad", "breakfast", "dessert",
    "vegetarian", "vegan", "asian", "mediterranean", "mexican", "comfort-food"
]
```

---

## Windows Task Scheduler

| Entry | Trigger | Command |
|---|---|---|
| WC-Daily | Daily 07:00 | `python pipeline/run.py --schedule=daily` |
| WC-Weekly | Monday 07:00 | `python pipeline/run.py --schedule=weekly` |

Working directory: `C:\Users\lasse\Desktop\whatscooking`
Prerequisite: Ollama must be running — script exits with clear error if unreachable.

---

## File Layout

```
whatscooking/pipeline/
  run.py                    # orchestrator — --schedule=daily|weekly
  config.py                 # all constants
  rotation_state.json       # round-robin state (gitignored)

  strategies/
    __init__.py
    base.py                 # BaseStrategy ABC
    trending.py
    seasonal.py
    haute.py
    superfood.py
    mealplan.py
    standard.py             # migrated from current scrape.py + compose.py

  lib/
    __init__.py
    scrape.py               # Playwright + recipe-scrapers helpers
    compose.py              # Ollama HTTP wrapper
    validate.py             # field validator
    apply.py                # Supabase upsert

  logs/                     # run logs, kept as audit trail
  requirements.txt
```

---

## Dependencies (`pipeline/requirements.txt`)

```
playwright
recipe-scrapers
supabase==2.28.3
python-dotenv
pytrends
requests
```

---

## New Environment Variable

Add to `.env.local`:
```
USDA_FDC_API_KEY=   # free registration at api.nal.usda.gov
```

---

## Migration from Existing Pipeline

- `pipeline/scrape.py` → migrated into `strategies/standard.py` + `lib/scrape.py`
- `pipeline/compose.py` → migrated into `lib/compose.py` + `lib/validate.py`
- `pipeline/emit_sql.py` → retired (no SQL files)
- `pipeline/run.py` → replaced by new orchestrator
- `pipeline/output/` → retired; `pipeline/logs/` replaces it

---

## Out of Scope

- Geo-aware seasonality (v1 uses US harvest calendar only)
- Paid APIs or subscriptions of any kind
- Image generation (relies on scraped `image_url` where available, NULL otherwise)
- Nutritional verification (LLM estimates accepted)
- Carbon footprint or ingredient substitution logic
