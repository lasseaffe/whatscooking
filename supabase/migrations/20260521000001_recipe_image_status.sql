alter table public.recipes
  add column if not exists image_status text not null default 'ok';

comment on column public.recipes.image_status is
  'Image health: ok | missing | broken | duplicate | fallback | hidden. '
  'hidden recipes are excluded from browse/discover pages. '
  'Set by scripts/flag-image-issues.mjs and scripts/fix-bad-images.mjs.';

create index if not exists recipes_image_status_idx on public.recipes(image_status);
