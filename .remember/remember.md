# Handoff

## State
AI backfill automation fully built and tested on `feat/streaks-today-push` (WC master). Scripts: `scripts/backfill-descriptions.mjs` and `scripts/backfill-instructions.mjs`. Shared lib at `scripts/lib/`. 7 commits merged. Both scripts tested live against Supabase — write confirmed working. NOT yet run at full scale (26K recipes).

## Next
1. Run descriptions backfill overnight: `node scripts/backfill-descriptions.mjs` (free tier llama, ~8-24h)
2. Run instructions backfill after descriptions complete: `node scripts/backfill-instructions.mjs`
3. Check `scripts/chunks/descriptions-failed.txt` and `instructions-failed.txt` after each run

## Context
- Supabase upsert fails with NOT NULL constraint — scripts use individual `.update().eq('id')` calls instead
- `cook_method` and `occasion` columns don't exist in DB; descriptions script uses `cuisine_type` and `dish_types` instead
- Checkpoint files in `scripts/chunks/.checkpoint-{mode}.json` — use `--reset` to restart from scratch
- To upgrade model: `--model=anthropic/claude-haiku-4-5` (~$3-6 total, much better quality)
