-- supabase/migrations/20260518d_social_layer.sql

-- ── 1. cook_posts (public social surface) ────────────────────
create table public.cook_posts (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  recipe_id   uuid references public.recipes(id) on delete set null,
  photo_url   text,
  note        text check (char_length(note) <= 280),
  created_at  timestamptz not null default now()
);

create index idx_cook_posts_user_id  on public.cook_posts(user_id, created_at desc);
create index idx_cook_posts_recipe_id on public.cook_posts(recipe_id);

alter table public.cook_posts enable row level security;

create policy "cook_posts public read"
  on public.cook_posts for select using (true);

create policy "cook_posts owner insert"
  on public.cook_posts for insert
  with check (auth.uid() = user_id);

create policy "cook_posts owner delete"
  on public.cook_posts for delete
  using (auth.uid() = user_id);

-- ── 2. cook_post_likes ────────────────────────────────────────
create table public.cook_post_likes (
  user_id    uuid not null references auth.users(id) on delete cascade,
  post_id    uuid not null references public.cook_posts(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, post_id)
);

alter table public.cook_post_likes enable row level security;

create policy "cook_post_likes public read"
  on public.cook_post_likes for select using (true);

create policy "cook_post_likes owner write"
  on public.cook_post_likes for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ── 3. recipe_comments: add post_id ──────────────────────────
alter table public.recipe_comments
  add column if not exists post_id uuid references public.cook_posts(id) on delete cascade;

create index if not exists idx_recipe_comments_post_id
  on public.recipe_comments(post_id, created_at desc);

-- ── 4. profiles: enforce username not null ────────────────────
do $$
declare
  r record;
  candidate text;
  counter int;
begin
  for r in select id from public.profiles where username is null loop
    candidate := 'user_' || substring(r.id::text, 1, 8);
    counter := 2;
    while exists (select 1 from public.profiles where username = candidate) loop
      candidate := 'user_' || substring(r.id::text, 1, 8) || '_' || counter;
      counter := counter + 1;
    end loop;
    update public.profiles set username = candidate where id = r.id;
  end loop;
end $$;

alter table public.profiles alter column username set not null;

-- ── 5. user_preferences: add share_activity ──────────────────
alter table public.user_preferences
  add column if not exists share_activity boolean not null default false;
