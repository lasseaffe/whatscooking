-- ============================================================
-- Recipe focal point columns
-- Stores AI-detected food subject center as percentages (0-100).
-- NULL = not yet analyzed (UI falls back to 50% / 60%).
-- ============================================================

alter table public.recipes
  add column if not exists focal_x smallint,
  add column if not exists focal_y smallint;

comment on column public.recipes.focal_x is 'AI-detected focal point X% (0-100, left to right). NULL = not yet analyzed.';
comment on column public.recipes.focal_y is 'AI-detected focal point Y% (0-100, top to bottom). NULL = not yet analyzed.';
