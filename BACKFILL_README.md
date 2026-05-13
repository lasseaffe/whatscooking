# Recipe Enhancement Backfill

## Overview

Two-stage backfill system for enhancing 40k+ existing recipes according to the v2 enhancement system (cookbook voice contract, consolidation, headnotes).

## Stage 1: Pilot with Local Ollama (200 recipes)

**Purpose:** Verify quality and performance with local models before running expensive Claude backfill.

**Run:**
```bash
npm run backfill:pilot
```

**What it does:**
- Enhances first 200 recipes missing `instructions_enhanced` or `description_enhanced`
- Uses Ollama locally (qwen3:14b by default, ~10-15s per recipe)
- Applies same prompts as Stage 2 but with lower quality expectations
- Reports success/failure rate for inspection

**Expected output:**
```
[1/200] Pasta Carbonara                    ... ✅
[2/200] Caesar Salad                       ... ✅
[3/200] Chocolate Cake                     ... ❌
...
📊 Pilot Results:
✅ Enhanced: 195/200
❌ Failed: 5/200
```

**Next step:** Review the enhanced recipes in the UI at `/recipes/[id]`, then decide:
- **Quality looks good?** → Run `npm run backfill:full`
- **Quality needs tweaking?** → Refine prompts in `backfill-enhance-full.mjs` and re-run

## Stage 2: Full Backfill with Claude Sonnet 4.6

**Run (AFTER pilot approval):**
```bash
npm run backfill:full
```

**What it does:**
- Enhances ALL remaining recipes (~40k)
- Uses Claude Sonnet 4.6 via Anthropic API (~$240 total cost)
- Runs ~60 recipes/minute (6-8 hours to completion)
- Logs failures for retry/inspection

**Expected cost:**
- 40k recipes × 2 enhancers (instructions + description) = 80k API calls
- Claude Sonnet 4.6: ~$0.003 per call
- Total: ~$240

**Expected time:**
- 40k recipes ÷ 60/min = ~667 minutes = ~11 hours
- (Sequential processing to avoid rate limits)

**Output format:**
```
📊 Full Backfill Complete:
✅ Enhanced: 39,850/40,000
❌ Failed: 150/40,000

⚠️  Failed recipes (first 20):
  - Broken Recipe 1 (id123): Invalid ingredient format
  - Bad Data Recipe (id456): No title
```

## Prompts Used

### Cookbook Voice Contract (both systems)
- Named exemplars: Marcella Hazan, Diana Henry, Kenji Lopez-Alt, Yotam Ottolenghi
- Banned adjectives: delicious, perfect, amazing, tasty, savory, mouthwatering, etc.
- Banned chatter: just, actually, really, very, simply, without further ado, etc.
- Required: contractions (don't, you'll, it's), no exclamation marks, no "..."
- Tactile verbs: blister, sizzle, fold, bloom, collapse, shatter, render, crust, etc.

### Instructions Enhancement
- Per-step 5-field cards: header (action), body_text (what+why+pitfall), skill ({beginner, pro}), jargon, visual_strategy
- Consolidation pre-pass: merges adjacent micro-steps (19 → 9, etc.) before per-step enhancement
- Header validator: verb-required, 2-8 words, no dangling prepositions

### Description Enhancement
- 3-10 sentence headnote prose (the hero)
- Three opening hooks (sensory, context, technique) — rotates so not always the same
- Structured fields: origin, technique, ingredient signature, audience, effort
- Humanizer post-processor: rhythm check (no same word counts), warning sentence, contractions

## Failure Modes & Recovery

**Common failures:**
1. **Invalid JSON from model:** Model output doesn't parse → logged as failure, recipe skipped
2. **API timeout:** Anthropic API timeout → retries once, then logs as failure
3. **Invalid schema:** Model returns different field names → validator rejects, retries
4. **Malformed recipe data:** Missing title/ingredients → gracefully skipped

**Recovery:**
- After backfill, failed recipes are listed
- Can re-run `npm run backfill:full` on just the failed batch (script only processes unenhanced)
- Or manually enhance via UI: `/recipes/[id]` → Enhance button

## Monitoring

**During backfill:**
```bash
tail -f <output-log> | grep "✅\|❌"
```

**After backfill:**
- Check database: `SELECT COUNT(*) WHERE instructions_enhanced IS NOT NULL`
- Spot-check random recipes in `/recipes/[id]`
- Look for common patterns in failures

## Performance Baseline

**Pilot (Ollama qwen3:14b):**
- 200 recipes in ~30-40 minutes
- ~90-95% success rate expected (varies by model)
- Free but lower quality

**Full (Claude Sonnet 4.6):**
- 40k recipes in ~11 hours
- ~99% success rate expected
- ~$240 cost

## Cleanup After Backfill

Once backfill is complete:
1. Delete backfill scripts (optional): `rm scripts/backfill-*.mjs`
2. Remove npm scripts from `package.json` if desired
3. Commit the enhanced recipe data to git (the database is the source of truth)

## Next Steps

1. **Run pilot:** `npm run backfill:pilot`
2. **Review 5-10 recipes:** Go to `/recipes/[id]` and check enhanced descriptions/instructions in cook mode
3. **Approve:** `npm run backfill:full`
4. **Monitor:** Watch progress, failures logged at end
5. **Verify:** Spot-check 10-20 recipes post-backfill
