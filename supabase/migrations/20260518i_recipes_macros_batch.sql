-- ============================================================
-- Recipes: macro estimator metadata + batch-friendly flag
-- ============================================================

alter table public.recipes
  add column if not exists sat_fat_g           numeric,
  add column if not exists macros_estimated    boolean not null default false,
  add column if not exists macros_estimated_at timestamptz,
  add column if not exists estimator_version   text,
  add column if not exists batch_friendly      boolean not null default false;

comment on column public.recipes.macros_estimated is
  'True when macro fields were filled by the display-time LLM estimator (vs. source data).';
comment on column public.recipes.estimator_version is
  'Version tag of the estimator prompt; allows mass invalidation on prompt change.';
comment on column public.recipes.batch_friendly is
  'Recipe scales well for cook-once-eat-twice. Used by the Weave solver to plan leftover days.';
