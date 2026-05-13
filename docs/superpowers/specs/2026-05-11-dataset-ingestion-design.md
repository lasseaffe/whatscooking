# Dataset Ingestion — Design Spec
**Date:** 2026-05-11  
**Status:** Approved  

## Goal

Reach 10,000 recipes in Supabase by bulk-ingesting two public datasets:
- **Food.com** (Kaggle, 230K recipes + user interactions — highest quality: includes review counts and nutrition)
- **RecipeNLG** (2.2M recipes — breadth fill after Food.com quota)

## Architecture

Single script: `scripts/ingest-datasets.py`

Flow:
1. Download Food.com CSV via Kaggle CLI → `datasets/foodcom/`
2. Download RecipeNLG JSONL via direct URL → `datasets/recipenlg/`
3. Normalize Food.com → recipes schema (top 7K by review count)
4. Normalize RecipeNLG → recipes schema (top 3K, deduped against Food.com titles)
5. Upsert to Supabase in batches of 100
6. Write `datasets/manifest.json`

## Schema Migration

File: `supabase/migrations/20260511_dataset_source.sql`

Changes:
- Drop + recreate `source` CHECK to include `'dataset'`
- Add `dataset_name text` column (values: `'foodcom'`, `'recipenlg'`)

## Normalization

### Food.com → recipes
| CSV column | recipes column | Notes |
|---|---|---|
| `name` | `title` | direct |
| `description` | `description` | direct |
| `ingredients` (string list) | `ingredients` JSONB | `[{name, amount: null, unit: null}]` |
| `steps` (string list) | `instructions` | direct |
| `minutes` | `prep_time_minutes` + `cook_time_minutes` | split 40/60 |
| `tags` | `dietary_tags` | filter to known values |
| `calories` / nutrition | nutrition columns | direct where present |
| — | `source` | `'dataset'` |
| — | `dataset_name` | `'foodcom'` |
| — | `id` | `md5(title + 'foodcom')` as deterministic UUID |

### RecipeNLG → recipes
| JSONL field | recipes column | Notes |
|---|---|---|
| `title` | `title` | direct |
| `ingredients` | `ingredients` JSONB | `[{name, amount: null, unit: null}]` |
| `directions` | `instructions` | direct |
| `source` | `source_name` | site name |
| — | `source` | `'dataset'` |
| — | `dataset_name` | `'recipenlg'` |
| — | `id` | `md5(title + 'recipenlg')` as deterministic UUID |

## Dedup Strategy

- Deterministic UUIDs → upsert on `id` is idempotent; re-running is safe
- RecipeNLG titles deduped against Food.com titles (case-insensitive set)
- Skip rows with empty title or empty ingredients

## Quota

- Food.com: top 7,000 by `n_steps` desc (more steps = more complete recipe)
- RecipeNLG: first 3,000 after dedup
- Total target: 10,000

## Files Changed

- `supabase/migrations/20260511_dataset_source.sql` — schema migration
- `scripts/ingest-datasets.py` — download + normalize + upsert
- `datasets/.gitkeep` — tracks folder without data
- `.gitignore` — excludes `datasets/foodcom/` and `datasets/recipenlg/`
- `datasets/manifest.json` — written post-ingest (counts, timestamps)
