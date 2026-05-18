-- supabase/migrations/20260518c_cook_log.sql
create table public.cook_log (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  recipe_id     uuid references public.recipes(id) on delete set null,
  recipe_title  text not null,
  cooked_at     timestamptz not null default now(),
  rating        smallint check (rating between 1 and 5),
  notes         text,
  next_time     text,
  photo_url     text,
  source        text not null default 'plan'
                check (source in ('plan', 'cooking_mode', 'recipe_page'))
);

create index cook_log_user_date on public.cook_log (user_id, cooked_at desc);
create index cook_log_recipe    on public.cook_log (recipe_id, cooked_at desc);

alter table public.cook_log enable row level security;

create policy "users manage own cook log"
  on public.cook_log
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
