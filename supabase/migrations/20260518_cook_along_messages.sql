create table if not exists public.cook_along_messages (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  recipe_id   uuid not null references public.recipes(id) on delete cascade,
  role        text not null check (role in ('user', 'assistant')),
  content     text not null,
  step_index  int,
  created_at  timestamptz not null default now()
);

create index if not exists idx_cook_along_messages_lookup
  on public.cook_along_messages (user_id, recipe_id, created_at);

alter table public.cook_along_messages enable row level security;

create policy "users manage own cook along messages"
  on public.cook_along_messages for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
