-- ============================================================
-- meal_entries.is_leftover
-- Marks a plan entry as a leftover reheat (not a fresh cook).
-- Drives the per-day density ribbon on /plans/[id] and lets the
-- cook-time aggregation skip entries that don't need fresh cooking.
-- Default false = existing rows stay treated as fresh cooks.
-- ============================================================

alter table public.meal_entries
  add column if not exists is_leftover boolean not null default false;

comment on column public.meal_entries.is_leftover
  is 'True when this entry is a leftover/reheat. Excluded from cook-time aggregation; lights the leftover band in the day density ribbon.';
