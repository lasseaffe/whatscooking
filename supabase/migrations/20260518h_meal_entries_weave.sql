-- ============================================================
-- meal_entries Weave columns
-- source: provenance of this entry (pinned/suggestion/manual)
--         Note: leftover-ness is a separate concern carried by
--         the existing is_leftover boolean (migration 20260518e).
-- parent_clientid: for leftover entries, the clientid of the cook-day entry
-- locked: whether reweave can replace this cell
-- ============================================================

alter table public.meal_entries
  add column if not exists source           text not null default 'manual',
  add column if not exists parent_clientid  uuid,
  add column if not exists locked           boolean not null default false;

alter table public.meal_entries
  drop constraint if exists meal_entries_source_check;

alter table public.meal_entries
  add constraint meal_entries_source_check
    check (source in ('pinned','suggestion','manual'));

comment on column public.meal_entries.source is
  'Provenance: pinned = explicit user pin; suggestion = solver-filled; manual = legacy or direct edit. Leftover-ness is orthogonal (see is_leftover).';
comment on column public.meal_entries.parent_clientid is
  'When is_leftover=true: the clientid of the parent cook-day entry. Removing the leftover restores the parent''s active cook time.';
comment on column public.meal_entries.locked is
  'When true, the Weave solver will not replace this entry during reweave.';
