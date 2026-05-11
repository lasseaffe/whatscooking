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

## Recipe Instruction Format — MANDATORY

All recipes in this project use the **3-part expanded educational format**. This is non-negotiable and applies to every recipe, always.

Every recipe must store three JSONB columns on the `recipes` table:

- `core_instruction` — array of strings, one per step. The "What": expanded text with sensory cues, defined terminology, stands alone grammatically.
- `culinary_logic` — array of strings, one per step. The "Why": food science or flavor theory behind the action.
- `pro_technique` — array of strings, one per step. The "How": mechanical, safety-focused, step-by-step technique advice.

**Rules:**
- Never generate a recipe with only a flat `instructions` string. Always produce all three arrays.
- Any AI prompt that generates or modifies recipe instructions must use the culinary educator persona (patient, encouraging, beginner-friendly tone).
- If a recipe enters the DB without these fields (e.g. from Spoonacular), expand them immediately before the upsert — never store unexpanded instructions.
- The original `instructions` field may be kept as a fallback during migration, but must not be the sole source of truth once expansion is complete.

See `docs/superpowers/specs/2026-04-27-expanded-recipe-instructions-design.md` for the full system prompt and schema details.
