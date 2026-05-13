-- What's Cooking - Enhanced recipe description (structured editorial card)
-- See CLAUDE.md "Recipe Description Format".

alter table recipes
  add column if not exists description_enhanced jsonb;

create index if not exists recipes_description_enhanced_gin
  on recipes using gin (description_enhanced);

comment on column recipes.description_enhanced is
  'EnhancedDescription { tagline, origin: {cuisine, tradition}, technique_signature, ingredient_signature, audience, effort: {time_feel, skill_level, forgiving} }. Populated via POST /api/recipes/enhance with target="description".';