# AI Backfill Automation — Design Spec
**Date:** 2026-05-20
**Project:** What's Cooking
**Status:** Approved

---

## Context

26,353 recipes in Supabase need two types of AI-generated content:
1. **Descriptions** — `recipes.description` field: null/empty/missing on most records
2. **Enhanced instructions** — `recipes.instructions_enhanced` field: null on most records

Manual chunk-by-chunk pasting into an LLM is not viable at this scale. This spec defines two fully automated backfill scripts using the OpenRouter API (free tier by default, swappable via `--model` flag).

---

## Scripts

### `scripts/backfill-descriptions.mjs`
Fills `recipes.description` where null, empty, or literally `"description missing"`.

### `scripts/backfill-instructions.mjs`
Fills `recipes.instructions_enhanced` where null.

---

## Shared Architecture

Both scripts follow the same engine pattern:

```
Supabase fetch (missing only)
  → queue
  → concurrency pool (2 workers)
      → OpenRouter call with taxonomy prompt
      → parse + validate response
      → retry up to 3× with exponential backoff on 429/5xx
      → on permanent failure: log to *-failed.txt, continue
  → batch write to Supabase every 50 recipes
  → checkpoint save every 50 recipes
```

### Concurrency
- **2 parallel requests** — safe for OpenRouter free tier
- Exponential backoff: 2s → 4s → 8s on 429 responses

### Checkpointing
- Each script writes a `scripts/chunks/.checkpoint-{mode}.json` with last processed recipe ID
- On restart, skips already-processed recipes
- Safe to kill and resume at any time

### Flags
```
--dry-run          Print what would be processed, no API calls, no writes
--limit=N          Stop after N recipes (for testing)
--model=<id>       OpenRouter model ID (default: meta-llama/llama-3.1-8b-instruct)
--concurrency=N    Parallel workers (default: 2)
--reset            Ignore checkpoint, start from scratch
```

### Environment
Uses existing `.env.local`:
- `OPENROUTER_API_KEY`
- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

---

## Description Taxonomy Prompt

See full spec: `docs/superpowers/specs/2026-05-20-recipe-description-taxonomy-design.md`

**Input per recipe:** title + first 6 ingredients (from `ingredients` column)
**Output format:** `HOOK: ...\nBODY: ...` parsed into `{hook}\n{body}` string
**Stored in:** `recipes.description`

Validation: hook must be ≤ 25 words, body must be ≥ 30 words. If validation fails → retry once → fallback to skip.

---

## Instruction Enhancement Taxonomy Prompt

Existing 4-beat system from `scripts/backfill-enhance-full-ollama.mjs`, ported to OpenRouter.

**Input per recipe:** title + raw instructions (array or newline-separated string)
**Output per step:** JSON object with fields: `header`, `body_text`, `skill.beginner`, `skill.pro`, `jargon[]`, `visual_strategy`
**Stored in:** `recipes.instructions_enhanced` (JSONB array, one object per step)

Validation: each step object must have non-empty `header` and `body_text`. Invalid steps fall back to `{header: stepText.slice(0,60), body_text: stepText, skill:{beginner:'',pro:''}, jargon:[], visual_strategy:''}`.

---

## Supabase Write Strategy

- Batch upsert every 50 recipes using `supabase.from('recipes').upsert([...], {onConflict: 'id'})`
- Write `description` or `instructions_enhanced` only — no other fields touched
- On write error: log warning, continue (don't lose the batch)

---

## Output Files

```
scripts/chunks/.checkpoint-descriptions.json   — resume state
scripts/chunks/.checkpoint-instructions.json   — resume state
scripts/chunks/descriptions-failed.txt         — recipes that failed after 3 retries
scripts/chunks/instructions-failed.txt         — recipes that failed after 3 retries
```

---

## Cost Estimate (free tier)

`meta-llama/llama-3.1-8b-instruct` on OpenRouter free tier:
- Rate limited but $0 cost
- Descriptions: ~300 tokens/recipe × 26K = ~8M tokens
- Instructions: ~800 tokens/recipe × 26K = ~20M tokens
- Estimated time at 2 concurrent + free tier limits: 8–24 hours per script (run overnight)

To upgrade: `--model=anthropic/claude-haiku-4-5` ≈ $3–6 total for descriptions.

---

## Files to Create

- `scripts/backfill-descriptions.mjs`
- `scripts/backfill-instructions.mjs`
- `scripts/lib/openrouter.mjs` — shared OpenRouter client with retry logic
- `scripts/lib/supabase-env.mjs` — shared env loader + Supabase client (already partially exists in other scripts; extract)
- `scripts/lib/checkpoint.mjs` — shared checkpoint read/write
