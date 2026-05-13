@AGENTS.md

## Wiki Knowledge Base
Path: C:\Users\lasse\Desktop\holyflex\claude-obsidian

When you need context not already in this project:
1. Read wiki/hot.md first (recent context, ~500 words)
2. If not enough, read wiki/index.md
3. If you need domain specifics, read wiki/<domain>/_index.md
4. Only then read individual wiki pages

Do NOT read the wiki for general coding questions or things already in this project.

## MANDATORY: Task Logging

**This rule is non-negotiable and must never be skipped.**

After EVERY successfully completed task — no exceptions — append an entry to:
`C:\Users\lasse\Desktop\whatscooking\logs\`

Rules:
- One log file per session, named `YYYY-MM-DD.md` (use today's date)
- Append (never overwrite) — multiple tasks in one day go in the same file
- Write the entry BEFORE reporting the task as done to the user
- If the logs folder does not exist, create it first
- A task is "complete" when code is written, a bug is fixed, a feature is added, a file is changed — any meaningful work

Entry format:
```
## [HH:MM] <short task title>
- What was done (bullet points)
- Files changed
```

**Failure to log is a critical error. Do not skip this step under any circumstances.**

## MANDATORY: Moodboard Maintenance

The in-app moodboard at `/moodboard` is the live design contract. It must never lag the codebase. When you make ANY change that affects design — tokens, fonts, components, patterns, modes (dark/light/the 5 palettes), voice rules, icon family, motion — you MUST, in the same task:

1. **Update `src/app/(app)/moodboard/moodboard.config.ts`** if the change is editorial (a new principle, a new palette name, new vocabulary, new do/don't pair, new motion intent). Token/font/spacing changes propagate automatically — no config edit needed for those.
2. **Append a dated entry to `docs/moodboard.log.md`** with BOTH `### Changed` and `### Ideas / next steps`. Newest entry on top. The Change Log section of the in-app moodboard renders the top 5 entries.
3. **Run `npm run moodboard:check`** and resolve any drift warnings (or update the script's ignored-prefixes allow-list if the new token is intentionally a low-level mechanical primitive).

**Failure to update the moodboard is a critical error.** It is treated with the same severity as a missing task log.

## Recipe Content System - MANDATORY

What's Cooking uses TWO separate enhancement systems for recipe content. They never share a prompt - descriptions and instructions are different texts with different needs.

### Shared layer: Cookbook Voice Contract

Both systems include the same voice contract in their prompts (see `src/lib/enhance/recipe-enhance-prompt.ts` -> `COOKBOOK_VOICE_CONTRACT`).

Required tone: authoritative cookbook voice (Marcella Hazan, Diana Henry, Kenji Lopez-Alt, Yotam Ottolenghi). Banned voice: SEO recipe blogs, travel-purple, BA-bro chumminess, restaurant menu copy.

Hard-banned in any output (validator rejects + retries):
- Adjectives: `delicious, savory, tasty, mouthwatering, perfect, amazing, incredible, scrumptious, yummy, divine, heavenly, decadent, sumptuous, succulent`.
- Chatter words: `just, actually, really, very, literally, honestly, basically, super, simply`.
- Slop phrases: `culinary journey, symphony of flavors, perfect for any occasion, crowd-pleaser, your taste buds will thank you, elevate your cooking, next-level, whip up, classic twist, trust me, hey friends, hands down, without further ado, let's dive in`.
- Exclamation marks in instructions or headnotes.
- `...` for dramatic pause.

Required: contractions where natural (`don't, you'll, it's`). Editorial second person or imperative. Never "I" or "we." Inline foreign-language terms appear in plain text in JSON (renderer adds italics).

### System A: Instructions - Chef-mentor walkthrough

Storage: `recipes.instructions` (text[], plain steps) + `recipes.instructions_enhanced` (jsonb, EnhancedStep[]).

Shape per step:

```ts
type EnhancedStep = {
  header: string;                              // 3-6 word action title, verb-led
  body_text: string;                           // what + why + pitfall
  skill: { beginner: string; pro: string };
  jargon: Array<{ term: string; definition: string }>; // 0-2
  visual_strategy: string;
};
```

Header validator (hard rules, retry-then-reject):
- Must start with an action verb (imperative or gerund) drawn from `HEADER_VERB_OPENERS` in `src/lib/enhance/recipe-enhance-schema.ts`.
- Must be 2-8 words.
- Must not end on a dangling preposition (`in, to, with, on, of, at, for, by, into, from, over, under`).
- Must not appear as a substring inside the first 12 words of `body_text`.

API entry: `POST /api/recipes/enhance` with `target: "instructions"` (default).
- Per-step (`step_index` provided): one Anthropic call, returns `{ step, index }`.
- All-mode (no `step_index`): runs a CONSOLIDATION pre-pass (one extra LLM call) when `instructions.length > 6` and `consolidate !== false`. Merges adjacent micro-steps using `RECIPE_STEP_CONSOLIDATION_PROMPT`. Then parallel per-step enhance on the consolidated list. Response includes `consolidated_steps`, `original_count`, and `steps`.
- The preview modal shows a "N -> M steps" banner when consolidation reduced the count. Accepting persists BOTH `instructions` (consolidated plain) and `instructions_enhanced` (cards).

Cook mode (`cooking-mode-screen.tsx`):
- When `instructions_enhanced[i]` is available, render `step.header` + `step.body_text` directly. No synthetic heading.
- When no enhanced data, omit the heading entirely (just show the "Step N" chip + full plain text body). Do not chop sentences.

### System B: Descriptions - Senior Cookbook Editor headnote

Storage: `recipes.description` (text, plain) + `recipes.description_enhanced` (jsonb, EnhancedDescription).

Shape:

```ts
type EnhancedDescription = {
  headnote_narrative: string;                  // 3-10 sentences of editorial prose (the hero)
  tagline: string;                             // short hook for cards/share previews, <= 25 words
  origin: { cuisine: string; tradition: string };
  technique_signature: string;
  ingredient_signature: string;
  audience: string;
  effort: {
    time_feel: string;
    skill_level: "beginner" | "intermediate" | "advanced";
    forgiving: boolean;
  };
};
```

Headnote rules (validator-enforced):
- 3-10 sentences (terminators `.!?` outside quotes).
- One of three opening hooks: Sensory ("Listen for..."), Context ("This is the dish you make when..."), Technique ("The trick here isn't...").
- Tactile verbs preferred: blister, lacquer, seep, collapse, shatter, fold, bloom, sizzle, puddle, crust, render, rest, weep, snap, crackle.
- One mentorship warning sentence ("Don't be tempted to...").
- All banned terms from the Cookbook Voice Contract rejected.

Soft check (warning only): no two consecutive sentences share the same word count.

API entry: `POST /api/recipes/enhance` with `target: "description"`. One LLM call. Returns `{ description: EnhancedDescription }`. Owner-only PATCH at `/api/recipes/user`.

Render: `EnhancedDescriptionCard` shows the headnote as the editorial hero paragraph, then the four icon-led rows (origin, technique, flavor, audience) plus the effort strip.

### Operational rules

- UGC recipes (`source = 'user'`) should run BOTH enhancers before publishing publicly. Private/draft recipes may keep plain `instructions` and `description` only.
- The diff-preview modal is the only UI surface for accepting enhanced output. Always show original vs. enhanced before persisting.
- Curated/Spoonacular ingest pipelines should run both enhancers server-side before upsert (planned, see `C:\Users\lasse\.claude\plans\scraper-fix.md`).

### Deprecated

The 3-part instruction format (`core_instruction`, `culinary_logic`, `pro_technique`) is dead. Old columns may still exist in the DB; treat as read-only legacy. The replacement is `instructions_enhanced`.

## ECOSYSTEM CONNECTIVITY MANDATE

These three apps (HolyFlex · VenturePath · What's Cooking) are a single ecosystem.
Every feature you build — no exceptions — must consider both layers:

1. **CROSS-TOOL (within this app):** does this feature read from or write to the other tools in this same app? Wire it in, don't leave it isolated.
2. **CROSS-APP (between apps):** does this feature produce or consume data that another app already has or needs? Flag it and plan the connection.

### Cross-App Data Flows (quick reference)

| This app produces       | Consumed by        | Data                                     |
|-------------------------|--------------------|------------------------------------------|
| HolyFlex sabbath prefs  | VP, WC             | Sunday-aware scheduling                  |
| HolyFlex streak events  | WC, VP             | recipe_cooked, expedition_logged         |
| HolyFlex daily verse    | WC, VP             | scripture context for content            |
| VenturePath trip dates  | WC                 | meal planning window for expedition      |
| VenturePath destination | WC                 | cuisine discovery at destination         |
| VenturePath packing     | WC                 | travel shopping list sync                |
| WC dietary prefs        | HF, VP             | allergens, WoW compliance, packing       |
| WC household members    | VP squad           | auto-populate squad from household       |
| WC recipes              | HF communities     | shareable recipe links in discussions    |

### What's Cooking Cross-Tool Wiring

The core data loop must be complete: **Pantry → Recipes → Meal Plan → Shopping → Pantry.**
Every break in this loop forces the user to duplicate work manually.

| Tool                  | Writes to                         | Reads from                           | Status                              |
|-----------------------|-----------------------------------|--------------------------------------|-------------------------------------|
| Recipe Discovery      | saves, meal_entries               | pantry (by-ingredients), allergens   | partial: swipe ignores pantry       |
| Pantry                | pantry items                      | —                                    | GAP: expiry not surfaced to planner |
| Meal Plan             | meal_entries, shopping_items      | recipes, calorie_goals, budget       | partial: no pantry deduction on cook|
| Shopping List         | shopping_items                    | meal_entries, event_menu_items       | GAP: checked → pantry not wired     |
| Events / Dinner Party | event_shopping_items              | recipes (menu items)                 | GAP: guest count not scaling        |
| Family Hub            | member_allergens, reactions       | —                                    | partial: reactions not ranking      |
| Calorie Tracker       | calorie_entries                   | meal_entries (calories)              | partial: no goal validation         |
| Budget                | —                                 | meal_entries cost                    | GAP: no swap suggestions            |
| Cookbooks             | —                                 | recipes                              | GAP: no bulk shopping list          |

**Priority gaps to wire when touching these files:**
- WC-1: Shopping List checked item → modal "Add to pantry with expiry?" → `POST /api/pantry`
- WC-2: Meal Plan "mark as cooked" → `PATCH /api/pantry/deduct` with recipe ingredient quantities
- WC-3: Meal plan page → query pantry expiring ≤2 days → show "Use soon" suggestion row
- WC-4: Events guest count change → scale `event_shopping_items` quantities proportionally
- WC-5: `member_meal_reactions` ratings → weight `/api/recipes/list` discovery ranking

**What's Cooking cross-app outputs to implement:**
- XA-3: VP Squad "Sync from WC household" → read `household_members` via shared Supabase
- XA-4: Mark meal cooked → fire `recipe_cooked` to HolyFlex `/api/streak/tick`

### Mandatory Connectivity Checklist

Run this before logging ANY feature as done:

- [ ] Does this feature write data another tool in this app should react to? If yes: wire the subscription/callback now, not later.
- [ ] Does this feature read data that another tool already produces? If yes: consume from the existing source, don't duplicate.
- [ ] Does this feature affect shared state (dietary prefs, sabbath, timezone, household members, streaks)? If yes: update the shared layer, not just local state.
- [ ] Could this feature fire a cross-app event (streak, push, deep link)? If yes: add the event emission.
- [ ] Could another app's data make this feature meaningfully better? If yes: add a TODO with the exact table/API to pull from.
