alter table pantry_items
  add column if not exists expires_at date;

create index if not exists pantry_items_expires_at_idx
  on pantry_items (user_id, expires_at)
  where expires_at is not null;
