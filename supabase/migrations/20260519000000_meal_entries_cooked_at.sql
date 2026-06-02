-- ============================================================
-- meal_entries.cooked_at
-- Marks when a plan entry was cooked. NULL = pending.
-- Setting this column drives the Cook view's checked state and
-- fires a streak event via the application layer (see /api/plans/[id]/entries/[entryId]/cook).
-- ============================================================

alter table public.meal_entries
  add column if not exists cooked_at timestamptz;

create index if not exists meal_entries_cooked_at_idx
  on public.meal_entries(meal_plan_id, cooked_at);

comment on column public.meal_entries.cooked_at is
  'When this entry was last cooked. NULL = pending. Leftover entries cooked_at represents the reheat moment, not the original cook day.';
