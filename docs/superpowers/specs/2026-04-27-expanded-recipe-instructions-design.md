# Expanded Educational Recipe Instructions

**Date:** 2026-04-27  
**Status:** Approved  
**Project:** What's Cooking (`C:\Users\lasse\Desktop\whatscooking`)

---

## Overview

Transform all recipe instructions from flat imperative strings into a 3-part educational format that teaches beginners the *what*, *why*, and *how* of every cooking step. Users can toggle their preferred depth via a profile setting, with per-recipe override.

---

## Schema

Three new JSONB columns on the `recipes` table, each an ordered array of strings (index-aligned — index 0 of each array corresponds to step 0):

```sql
ALTER TABLE recipes
  ADD COLUMN core_instruction JSONB,  -- ["Step 1 what...", "Step 2 what..."]
  ADD COLUMN culinary_logic   JSONB,  -- ["Step 1 why...",  "Step 2 why..."]
  ADD COLUMN pro_technique    JSONB;  -- ["Step 1 how...",  "Step 2 how..."]
```

`NULL` on all three columns means the recipe has not yet been expanded. The UI falls back to the original `instructions` field when all three are null.

### Field definitions

| Field | The | Purpose |
|---|---|---|
| `core_instruction` | What | Expanded step text with sensory cues and defined terminology. Stands alone grammatically. |
| `culinary_logic` | Why | Food science or flavor theory behind the action. |
| `pro_technique` | How | Step-by-step mechanical advice — safety, efficiency, tool use. |

---

## Backfill Script

**File:** `scripts/expand-recipe-instructions.ts`

- Reads all recipes from Supabase where `core_instruction IS NULL`
- Sends each recipe's `instructions` array to Claude using the culinary educator system prompt (see AI Prompt section)
- Claude returns a JSON array of `{core_instruction, culinary_logic, pro_technique}` objects, one per step
- Upserts the 3 columns back to Supabase
- Processes in batches of 10 with a short delay between batches to respect rate limits
- Idempotent — safe to re-run; only processes recipes where `core_instruction IS NULL`

---

## New Recipe Generation

All entry points that create or cache recipes must produce all 3 instruction fields:

### `POST /api/recipes/generate`
The AI system prompt adopts the culinary educator persona. Claude returns the full recipe object with `core_instruction`, `culinary_logic`, and `pro_technique` arrays populated.

### `GET /api/recipes/[id]` (Spoonacular fetch + cache)
After fetching from Spoonacular, before upserting to Supabase, call Claude to expand the `instructions` field into all 3 arrays. Store all 3 in the upsert.

No recipe should enter the database without all 3 fields from this point forward.

---

## AI System Prompt (Culinary Educator Persona)

Used in both the backfill script and all recipe generation endpoints:

```
You are a Senior Culinary Educator and Technical Writer. Your task is to expand recipe instructions into a beginner-friendly educational format.

For each instruction step, produce three fields:

1. core_instruction — Precise, expanded text with sensory cues (e.g., "until it smells nutty"). Define any terminology inline. Must make grammatical sense on its own without the other fields.

2. culinary_logic — The science or flavor theory behind this action. Why does this step matter? What goes wrong if skipped?

3. pro_technique — Step-by-step mechanical advice for best results. Focus on safety and efficiency (knife grips, heat management, tool positioning).

Tone: Encouraging, educational, patient. Like a chef-instructor talking to someone who has never cooked before.

Return a JSON array with one object per step:
[
  {
    "core_instruction": "...",
    "culinary_logic": "...",
    "pro_technique": "..."
  }
]

Return only the JSON array. No extra text.
```

---

## User Preferences Schema

Add `instruction_mode` to `user_preferences`:

```sql
ALTER TABLE user_preferences
  ADD COLUMN instruction_mode TEXT NOT NULL DEFAULT 'learner'
  CHECK (instruction_mode IN ('chef', 'learner', 'beginner'));
```

| Mode | Shows |
|---|---|
| `chef` | `core_instruction` only |
| `learner` | `core_instruction` + `culinary_logic` |
| `beginner` | All three fields |

Default: `learner`.

---

## UI

### Profile settings page
Add a mode selector (pill/tab control) for `instruction_mode`. Persists to `user_preferences` on change.

### Recipe detail page
A pill/tab toggle at the top of the instructions section overrides the profile default for the current session only. Toggle state lives in React local state — not persisted.

Display fallback: if all 3 JSONB columns are null (recipe not yet expanded), render the original `instructions` string with no toggle shown.

---

## CLAUDE.md Enforcement

A `CLAUDE.md` entry in the What's Cooking project root permanently locks in this format so all future AI-assisted work follows it. See `CLAUDE.md` for the rule.
