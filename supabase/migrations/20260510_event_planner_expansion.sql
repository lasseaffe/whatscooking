-- 1. Guest permission roles
alter table dinner_party_guests
  add column if not exists role text not null default 'viewer';

-- 2. Event invite token (one per event, anyone with token can RSVP)
alter table dinner_parties
  add column if not exists invite_token uuid unique default gen_random_uuid();

-- 3. Shopping item categories
alter table event_shopping_items
  add column if not exists category text not null default 'other';

-- 4. Location option types
alter table event_location_options
  add column if not exists location_type text;
