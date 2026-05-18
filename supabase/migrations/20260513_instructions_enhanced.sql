-- What's Cooking - Enhanced recipe instructions (5-field per-step)
-- Adds JSONB column `instructions_enhanced` alongside existing `instructions text[]`.
-- See CLAUDE.md "Recipe Instruction Format" for the editorial spec.

alter table recipes
  add column if not exists instructions_enhanced jsonb;

create index if not exists recipes_instructions_enhanced_gin
  on recipes using gin (instructions_enhanced);

comment on column recipes.instructions_enhanced is
  'Array of EnhancedStep objects: { header, body_text, skill: {beginner, pro}, jargon: [{term, definition}], visual_strategy }. Replaces legacy core_instruction/culinary_logic/pro_technique. Populated via POST /api/recipes/enhance.';