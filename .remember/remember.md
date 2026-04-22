# Handoff

## State
Recipe ingestion pipeline fully built and committed at `C:/Users/lasse/Desktop/whatscooking`. All 9 tasks done: sources.py, discover.py, scrape.py, ingest.py, main.py, pytest.ini, GitHub Actions weekly cron (every Monday 3am UTC). 9/9 tests pass. GitHub secrets added by user.

## Next
1. Run DB migration SQL in Supabase SQL editor: `ALTER TABLE recipes ADD COLUMN IF NOT EXISTS source_url text UNIQUE; ALTER TABLE recipes ADD COLUMN IF NOT EXISTS category text;`
2. Trigger first scrape: GitHub Actions → "Weekly Recipe Scrape" → Run workflow (or locally: `py -m scripts.ingestion.main` with real SUPABASE_SERVICE_KEY in `scripts/ingestion/.env`)
3. Verify scraped rows appear in Supabase `recipes` table with `source = 'scraped'`

## Context
- No git remote was configured locally — user may have pushed via gh CLI or GitHub Desktop
- `scripts/ingestion/.env` has placeholder SUPABASE_SERVICE_KEY — needs real service role key from Supabase Dashboard → Project Settings → API
- GOOGLE_CSE_KEY/ID left empty intentionally — DDG handles all discovery for now
