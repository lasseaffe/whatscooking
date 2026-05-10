# Design Spec — Tasks B, C, D, E, F
Date: 2026-05-06

## Task B — Fusion [id] Redirect to Full Recipe

### Goal
Replace the static Fusion dish detail page with a server-side redirect to the real recipe when a DB match exists, or a branded "coming soon" fallback that auto-reports the missing recipe.

### Architecture
- File: `src/app/(app)/cuisines/fusion/[id]/page.tsx`
- Change `export const dynamic` from `"force-static"` to `"force-dynamic"`
- Remove `generateStaticParams` (no longer needed for static generation)
- Query: `supabase.from("recipes").select("id").ilike("title", dish.name).maybeSingle()`
- On match → `redirect('/recipes/' + recipe.id)`
- On no match → server-side insert into `recipe_bug_reports` (`issue_type: "missing_recipe"`, `recipe_name: dish.name`, `recipe_id: null`) then render fallback UI

### Fallback UI
- Keeps hero image + dish name + category pill (same visual treatment as current page)
- Replaces ingredients/instructions with a parchment-style "Recipe in the kitchen" card
- Copy: "We're cooking up a full recipe for [dish name]. Check back soon."
- CTA: Back to Fusion Foods link
- No user-visible mention of the auto-report (silent background action)

### Data
- No schema changes — `recipe_bug_reports` already has all needed columns
- `issue_type` = `"missing_recipe"` (new value, same column)
- Auto-report fires only on first render; no dedup logic needed (admin can deduplicate by `recipe_name`)

---

## Task C — Fix Events (& Dinner Parties) JSON Parse Error

### Root Cause
`Unexpected end of JSON input` — the AI model occasionally returns an empty string or the fetch body is empty before `JSON.parse` is called.

### Fix — `src/app/api/events/plan/route.ts`
1. After extracting `text`, check `if (!text.trim())` → return 500 "Model returned empty response"
2. Strip markdown fences before parsing:
   ```ts
   const clean = text.replace(/^```json\s*/,"").replace(/\s*```$/,"").trim();
   const plan = JSON.parse(clean);
   ```
3. Wrap in try/catch (already exists) — keep the existing catch returning 500

### Fix — Dinner Parties
The `/dinner-parties/[id]` page uses a `redirect("/events")` stub — the error here comes from the client calling `/api/dinner-parties` and the response not being JSON when an error occurs. No fix needed in the dinner-parties API route itself (it always returns JSON). The "Dinner & Events" phrasing in the task title refers to the shared Events planner feature only.

---

## Task D — World Cup 2026 Matchday Fixtures Seed Script

### Goal
Populate the empty `wc_fixtures` Supabase table with all 144 group-stage fixtures.

### File
`scripts/seed-wc2026-fixtures.mjs`

### Schema expected by `wc_fixtures`
```
match_date   timestamptz
home_team    text
away_team    text
venue        text
city         text
group_name   text   (e.g. "Group A")
matchday     int    (1, 2, or 3)
```

### Script behaviour
- Reads `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` from `.env.local` via `dotenv`
- Contains hardcoded fixture array (144 rows) based on confirmed WC 2026 group draw
- Upserts with `onConflict: "home_team,away_team,match_date"` for idempotency
- Prints progress: group name + match count after each batch
- Run: `node scripts/seed-wc2026-fixtures.mjs`

### Groups (12 groups × 4 teams = 48 teams, 6 games/group = 72 unique matchups but each counted as one fixture → 48 games per matchday round, 3 matchdays = 144 total)
Groups A–L confirmed per FIFA draw announcement.

---

## Task E — Country Recipe Query on WC Country Page

### Goal
Show real DB recipes on `/cuisines/world-cup-2026/[country]` when they exist.

### Architecture
- File: `src/app/(app)/cuisines/world-cup-2026/[country]/page.tsx`
- Already `force-static` with `generateStaticParams` — keep as-is but add Supabase fetch
- Query: `supabase.from("recipes").select("id, title, image_url").ilike("cuisine_type", nation.cuisine).limit(6)`
- Render section only when `recipes.length > 0`

### UI placement
Between the "Signature Dishes" grid and the Back link.

### UI
- Heading: "Recipes from [nation.cuisine] Cuisine"
- 2-column card grid: image thumbnail (rounded-xl, 80px tall) + title, links to `/recipes/[id]`
- Matching confColor accent for card borders
- No empty state — section is conditionally rendered

### Note on `force-static`
Switching to `force-dynamic` is fine here since the page already queries Supabase for WC data. Add `export const dynamic = "force-dynamic"` and remove `generateStaticParams`.

---

## Task F — Local Qwen Recipe Scraper Script

### Goal
Generate recipes locally using Ollama + Qwen instead of scraping URLs, using the same normalized schema as the existing pipeline.

### File
`scripts/ingestion/qwen_scraper.py`

### Dependencies
- `ollama` (Python SDK: `pip install ollama`)
- `python-dotenv`
- `supabase` (already used in pipeline)
- Reuses `normalize_recipe_scraper` from `scrape.py`

### CLI
```
python qwen_scraper.py "Korean Tacos" --model qwen2.5:7b --upsert
python qwen_scraper.py "Korean Tacos" "Okonomiyaki" --model qwen2.5:7b
```

### Prompt structure
```
You are a recipe database assistant. Return ONLY a JSON object (no markdown) with:
{
  "title": "string",
  "ingredients": ["string"],  // plain text, one per item
  "instructions": ["string"], // one step per item
  "cook_time_minutes": int or null,
  "servings": int or null,
  "cuisine_type": "string"
}

Generate a recipe for: {dish_name}
```

### Processing
1. Call `ollama.chat(model=model, messages=[...])` 
2. Extract `response["message"]["content"]`
3. Strip fences: `re.sub(r'^```json?\s*|\s*```$', '', text, flags=re.MULTILINE).strip()`
4. `json.loads(clean)` → pass to `normalize_recipe_scraper` with `source="ai-generated"`, `source_url=None`
5. If `--upsert`: load `.env.local`, upsert to Supabase `recipes` table

### Upsert conflict target
`on_conflict="title"` — skip if title already exists (prevents duplicates from re-runs)
