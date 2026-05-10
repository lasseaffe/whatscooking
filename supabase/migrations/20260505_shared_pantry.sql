-- Shared pantries
create table if not exists shared_pantries (
  id          uuid primary key default gen_random_uuid(),
  name        text not null default 'Shared Pantry',
  created_by  uuid not null references auth.users(id) on delete cascade,
  invite_code text not null unique,
  created_at  timestamptz not null default now()
);

-- Members of a shared pantry
create table if not exists shared_pantry_members (
  pantry_id  uuid not null references shared_pantries(id) on delete cascade,
  user_id    uuid not null references auth.users(id) on delete cascade,
  role       text not null default 'editor' check (role in ('owner','editor','viewer')),
  joined_at  timestamptz not null default now(),
  primary key (pantry_id, user_id)
);

-- Items in a shared pantry
create table if not exists shared_pantry_items (
  id          uuid primary key default gen_random_uuid(),
  pantry_id   uuid not null references shared_pantries(id) on delete cascade,
  name        text not null,
  quantity    text,
  unit        text,
  category_id uuid references ingredient_categories(id),
  added_by    uuid references auth.users(id),
  updated_at  timestamptz not null default now()
);

-- RLS
alter table shared_pantries        enable row level security;
alter table shared_pantry_members  enable row level security;
alter table shared_pantry_items    enable row level security;

create policy "members can read pantry"
  on shared_pantries for select
  using (
    exists (
      select 1 from shared_pantry_members
      where pantry_id = shared_pantries.id and user_id = auth.uid()
    )
  );

create policy "anyone can create pantry"
  on shared_pantries for insert
  with check (created_by = auth.uid());

create policy "owner can update pantry"
  on shared_pantries for update
  using (created_by = auth.uid());

create policy "members can read membership"
  on shared_pantry_members for select
  using (
    user_id = auth.uid() or
    exists (
      select 1 from shared_pantry_members m2
      where m2.pantry_id = shared_pantry_members.pantry_id and m2.user_id = auth.uid()
    )
  );

create policy "anyone can join (insert own membership)"
  on shared_pantry_members for insert
  with check (user_id = auth.uid());

create policy "members can leave or owner can remove"
  on shared_pantry_members for delete
  using (
    user_id = auth.uid() or
    exists (
      select 1 from shared_pantries
      where id = shared_pantry_members.pantry_id and created_by = auth.uid()
    )
  );

create policy "members can read items"
  on shared_pantry_items for select
  using (
    exists (
      select 1 from shared_pantry_members
      where pantry_id = shared_pantry_items.pantry_id and user_id = auth.uid()
    )
  );

create policy "editors can insert items"
  on shared_pantry_items for insert
  with check (
    exists (
      select 1 from shared_pantry_members
      where pantry_id = shared_pantry_items.pantry_id
        and user_id = auth.uid()
        and role in ('owner','editor')
    )
  );

create policy "editors can update items"
  on shared_pantry_items for update
  using (
    exists (
      select 1 from shared_pantry_members
      where pantry_id = shared_pantry_items.pantry_id
        and user_id = auth.uid()
        and role in ('owner','editor')
    )
  );

create policy "editors can delete items"
  on shared_pantry_items for delete
  using (
    exists (
      select 1 from shared_pantry_members
      where pantry_id = shared_pantry_items.pantry_id
        and user_id = auth.uid()
        and role in ('owner','editor')
    )
  );

-- Enable Realtime for shared_pantry_items
alter publication supabase_realtime add table shared_pantry_items;
