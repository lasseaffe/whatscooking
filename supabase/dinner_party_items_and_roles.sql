-- ══════════════════════════════════════════════════════════════
-- Dinner Party Items (itinerary) + Guest Roles
-- Run after fix_dinner_party_rls.sql
-- ══════════════════════════════════════════════════════════════

-- Guest roles: editor can add/edit items, viewer is read-only
alter table dinner_party_guests
  add column if not exists role text not null default 'viewer'
    check (role in ('editor', 'viewer'));

-- Items: meals, drinks, desserts, decorations, activities etc.
create table if not exists dinner_party_items (
  id          uuid        default gen_random_uuid() primary key,
  party_id    uuid        references dinner_parties(id) on delete cascade not null,
  category    text        not null default 'meal'
    check (category in ('meal','drink','dessert','snack','decoration','activity','other')),
  title       text        not null,
  description text,
  recipe_id   uuid        references recipes(id) on delete set null,
  added_by    uuid        references auth.users not null,
  position    int         not null default 0,
  notes       text,
  created_at  timestamptz default now()
);

alter table dinner_party_items enable row level security;

-- Read: any party member
create policy "dpi read" on dinner_party_items
  for select using (can_access_party(party_id));

-- Insert/Update/Delete: host OR editor guests only
create policy "dpi write" on dinner_party_items
  for all using (
    is_party_host(party_id)
    or exists (
      select 1 from dinner_party_guests g
      where g.party_id = dinner_party_items.party_id
        and g.user_id = auth.uid()
        and g.role = 'editor'
    )
  );

create index if not exists idx_dpi_party    on dinner_party_items(party_id, position);
create index if not exists idx_dpi_recipe   on dinner_party_items(recipe_id);
create index if not exists idx_dpi_added_by on dinner_party_items(added_by);
