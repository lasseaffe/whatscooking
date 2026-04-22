# Recipe Ingestion Engine — Design Spec

**Date:** 2026-04-21  
**Project:** What's Cooking  
**Status:** Approved

---

## Goal

Automatically populate the Supabase `recipes` table with ~250 new recipes per week by scraping multiple recipe sites, with zero manual intervention after setup.

---

## Architecture

```
scripts/
  ingestion/
    discover.py       # search Google CSE + DuckDuckGo → recipe URLs
    scrape.py         # recipe-scrapers → normalized recipe dicts
    ingest.py         # Supabase upsert, dedup by source_url
    sources.py        # source config: sites, categories, search queries
    main.py           # orchestrator: discover → scrape → ingest
    requirements.txt
.github/
  workflows/
    weekly-scrape.yml # cron: every Monday 3am UTC, opens reminder Issue
```

**Data flow:**
1. `main.py` loads source configs from `sources.py`
2. `discover.py` queries Google CSE (≤99 hits/day total across all sources) then DuckDuckGo for overflow → deduped URL list
3. URLs already in Supabase `source_url` are skipped before scraping
4. `scrape.py` runs each URL through `recipe-scrapers`, falls back to manual `ld+json` parsing
5. `ingest.py` upserts to Supabase using `source_url` as unique key

---

## Sources

| Site | Domain | Category | Search queries |
|---|---|---|---|
| AllRecipes | allrecipes.com | Classic | dinner recipes, easy weeknight meals |
| Serious Eats | seriouseats.com | Haute Cuisine | best recipes, technique recipes |
| Smitten Kitchen | smittenkitchen.com | Classic | seasonal recipes, baking |
| Half Baked Harvest | halfbakedharvest.com | Comfort | weeknight dinner, meal prep |
| Epicurious | epicurious.com | Haute Cuisine | chef recipes, holiday cooking |

**Target:** ~50 new recipes/source × 5 sources = ~250 new recipes/week.

To add a source: edit `sources.py` and commit — takes effect the next Monday run.

---

## Discovery

- **Google CSE:** `site:<domain> <query>` — budget ~15 queries/source, ~10 results each
- **DuckDuckGo:** `duckduckgo-search` Python library (free, no key) for overflow
- Dedup: URL set deduped in-memory, then checked against Supabase before scraping

---

## Data Mapping

| `recipe-scrapers` field | Supabase column |
|---|---|
| `title()` | `title` |
| `ingredients()` | `ingredients` (jsonb) |
| `instructions()` | `instructions` |
| `image()` | `image_url` |
| `total_time()` | `cook_time_minutes` |
| `yields()` | `servings` |
| canonical URL | `source_url` (unique key, upsert key) |
| source config `category` | `category` |
| source config `cuisine_type` | `cuisine_type` |
| `"scraped"` literal | `source` |

---

## GitHub Actions Workflow

- **Schedule:** `cron: '0 3 * * 1'` (every Monday 3am UTC)
- **Secrets needed:** `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`, `GOOGLE_CSE_ID`, `GOOGLE_CSE_KEY`
- **Reminder:** workflow opens a GitHub Issue each run: "Weekly scrape complete — want to add sources for next week? Edit scripts/ingestion/sources.py"
- **No approval gate** — fully automated, runs unconditionally

---

## Error Handling

- 403/429 → skip URL, log, continue
- Parse failure → log warning, skip
- Supabase upsert conflict on `source_url` → skip silently
- All errors to stdout (visible in GitHub Actions run logs)

---

## Schema Assumption

The existing `recipes` table is used as-is. No migrations needed — all mapped columns already exist.
