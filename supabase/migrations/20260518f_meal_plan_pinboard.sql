-- ============================================================
-- Meal plan Pinboard state
-- Adds: extended status enum, pinboard filter state, last-woven timestamp
-- ============================================================

alter table public.meal_plans
  drop constraint if exists meal_plans_status_check;

alter table public.meal_plans
  add constraint meal_plans_status_check
    check (status in ('planning','active','completed','woven','cooking','archived'));

alter table public.meal_plans
  add column if not exists pinboard_filters jsonb not null default '{}'::jsonb,
  add column if not exists last_woven_at    timestamptz;

comment on column public.meal_plans.pinboard_filters is
  'Last-used Pinboard chip state. Shape: { diet: text[], time_weeknight: int, time_weekend: int, squad_size: int, pantry_aware: bool, anti_repeat: text, batch_enabled: bool, inspiration_tags: text[] }';
comment on column public.meal_plans.last_woven_at is
  'When the Weave solver last produced suggestions for this plan.';
