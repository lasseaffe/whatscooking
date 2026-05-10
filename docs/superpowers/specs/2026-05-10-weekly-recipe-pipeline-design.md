# Weekly Recipe Pipeline — Design Spec
**Date:** 2026-05-10  
**Project:** What's Cooking  
**Status:** Approved

---

## Goal

Automate weekly addition of high-quality curated recipes to the `recipes` table in Supabase. Recipes are composites — inspired by 2-3 real scraped sources, not copies — and output as SQL INSERTs conforming exactly to `seed.sql` schema. Runs locally on Windows, fully cost-free (local LLM, no external APIs beyond Supabase upsert).

---

## Architecture

```
Windows Task Scheduler (weekly, Monday 07:00)
        │
        ▼
  pipeline/run.py  (orchestrator)
        │
   ┌────┴────┐
   │  Stage 1│  scrape.py
   │         │  Playwright → AllRecipes / Serious Eats / NYT Cooking
   │         │  recipe-scrapers extraction → raw_recipes list
   └────┬────┘
        │  raw_recipes (2-3 per target category)
   ┌────┴────┐
   │  Stage 2│  compose.py
   │         │  Ollama HTTP API → composite recipe dict
   │         │  Validates all required fields
   └────┬────┘
        │  validated recipe dicts
   ┌────┴────┐
   │  Stage 3│  emit_sql.py
   │         │  Renders full SQL INSERT matching seed.sql schema
   │         │  Writes to pipeline/output/YYYY-MM-DD.sql
   └─────────┘
        │
   Manual review → Supabase SQL editor / psql apply
```

---

## File Layout

```
whatscooking/pipeline/
  config.py          # all tuneable constants
  run.py             # orchestrator — calls stages in sequence
  scrape.py          # Stage 1: Playwright discovery + recipe-scrapers extraction
  compose.py         # Stage 2: Ollama compositor + field validator
  emit_sql.py        # Stage 3: SQL renderer
  output/            # YYYY-MM-DD.sql + YYYY-MM-DD.log (gitignored)
  requirements.txt   # playwright, recipe-scrapers, supabase, python-dotenv
```

---

## Stage 1 — Scraper (`scrape.py`)

### Sources
- `allrecipes.com` — broad coverage, consistent markup
- `seriouseats.com` — quality/technique-focused
- `cooking.nytimes.com` — editorial, seasonal

### Discovery
Playwright navigates directly to category/search pages on each site and collects 2-3 recipe URLs per target category. No DDG, no Google CSE — zero cost, no IP blocking risk.

### Category Rotation
Each weekly run picks **4 categories** from this rotating list (round-robin, state stored in `pipeline/output/rotation_state.json`):
```
main-course, pasta, soup, salad, breakfast, dessert,
vegetarian, vegan, asian, mediterranean, mexican, comfort-food
```

### Extraction
1. `recipe_scrapers.scrape_me(url, wild_mode=True)` — primary
2. `ld+json` block parsing — fallback if scraper returns incomplete data

Raw output dict per recipe:
```python
{
  "title": str,
  "ingredients": [str],       # raw strings, LLM normalises to {name,amount,unit}
  "instructions": [str],
  "image_url": str | None,
  "cook_time_minutes": int | None,
  "prep_time_minutes": int | None,
  "servings": int | None,
  "cuisine_type": str | None,
  "dietary_tags": [str],
  "source_url": str,
  "source_name": str,
}
```

### Dedup
Before passing to Stage 2, checks `source_url` against Supabase `recipes` table. Skips already-ingested URLs. Uses Supabase Python SDK with `.env.local` credentials.

---

## Stage 2 — LLM Compositor (`compose.py`)

### Model
Ollama HTTP API at `http://localhost:11434`. Model configurable in `config.py` (default: `llama3.2`). Script checks Ollama reachability on startup and logs a clear error if unreachable.

### Prompt Strategy
For each category batch (2-3 raw scraped recipes), send a single prompt:
- Context: the raw recipes as structured text
- Instruction: produce one *composite* recipe inspired by the best techniques and ingredients across the sources — not a copy of any one
- Output format: strict JSON matching the full schema below

### Required Output Schema
```json
{
  "title": "string",
  "description": "string (2-3 sentences, engaging)",
  "cuisine_type": "string",
  "dish_types": ["string"],
  "dietary_tags": ["string"],
  "ingredients": [{"name": "string", "amount": number, "unit": "string"}],
  "instructions": ["string"],
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
  "source_name": "string (comma-joined source names)",
  "source_url": "string (primary source URL)"
}
```

### Validation
After JSON parse, validates:
- `title`, `description`, `instructions` are non-empty strings
- `ingredients` is a non-empty list with `name`/`amount`/`unit` on each item
- `calories > 0`, `servings > 0`, `prep_time_minutes >= 0`, `cook_time_minutes >= 0`
- `dish_types` and `dietary_tags` are lists (can be empty)

Recipes failing validation are logged to the run log and skipped — not inserted with bad data.

### Attribution
- `source = 'curated'`
- `source_name` = comma-joined list of contributing site names
- `source_url` = primary source URL (UNIQUE dedup key in Supabase)

---

## Stage 3 — SQL Emitter (`emit_sql.py`)

Renders each validated recipe dict into a full `INSERT INTO recipes (...)` statement matching `seed.sql` exactly:
- Same column order
- Ingredients as `'[...]'::jsonb`
- `dish_types`, `dietary_tags`, `instructions` as `ARRAY['...', '...']`
- All string values escaped (single-quote safe)

Output: `pipeline/output/YYYY-MM-DD.sql` — one file per run, all recipes for that week in one file.

**Apply manually:** open in Supabase SQL editor or run `psql` — intentional quality gate before data hits production.

---

## Orchestration (`run.py`)

1. Load config + check Ollama reachable
2. Pick this week's 4 categories (round-robin from rotation state)
3. For each category: scrape 2-3 URLs → deduplicate → compose → validate
4. Emit SQL file
5. Write run log: `pipeline/output/YYYY-MM-DD.log`
   - Categories targeted
   - URLs scraped
   - Recipes composed
   - Validation failures (with reason)
   - Output SQL file path

---

## Config (`config.py`)

```python
OLLAMA_MODEL = "llama3.2"
OLLAMA_URL = "http://localhost:11434"
CATEGORIES_PER_RUN = 4
RECIPES_PER_CATEGORY = 2   # scrape sources; LLM composites 1 per category
CATEGORIES_ROTATION = [
    "main-course", "pasta", "soup", "salad", "breakfast", "dessert",
    "vegetarian", "vegan", "asian", "mediterranean", "mexican", "comfort-food"
]
SOURCES = [
    {"name": "AllRecipes", "base_url": "https://www.allrecipes.com"},
    {"name": "Serious Eats", "base_url": "https://www.seriouseats.com"},
    {"name": "NYT Cooking", "base_url": "https://cooking.nytimes.com"},
]
OUTPUT_DIR = "pipeline/output"
# SUPABASE_URL and SUPABASE_KEY loaded from .env.local
```

---

## Windows Task Scheduler

- **Trigger:** Weekly, Monday 07:00
- **Action:** `python pipeline/run.py`
- **Working directory:** `C:\Users\lasse\Desktop\whatscooking`
- **Prerequisite:** Ollama must be running (script exits with clear error if not)

---

## Dependencies (`pipeline/requirements.txt`)

```
playwright
recipe-scrapers
supabase==2.28.3
python-dotenv
```

---

## Out of Scope

- Auto-applying SQL to Supabase (manual review gate is intentional)
- Image generation (relies on existing `image_url` from scraped source)
- Nutritional verification (LLM estimates accepted; no external nutrition API)
