-- ══════════════════════════════════════════════════════════════════
-- DINNER PARTIES — social event planning with calendar + social
-- ══════════════════════════════════════════════════════════════════

create table if not exists dinner_parties (
  id              uuid        default gen_random_uuid() primary key,
  host_id         uuid        references auth.users not null,
  title           text        not null,
  description     text,
  scheduled_at    timestamptz not null,
  location        text,
  theme           text,
  linked_plan_id  uuid        references meal_plans(id) on delete set null,
  max_guests      int,
  is_recurring    boolean     default false,
  recurrence_rule text,       -- 'weekly' | 'biweekly' | 'monthly'
  series_id       uuid,       -- links instances of recurring party series
  status          text        default 'planning', -- planning | confirmed | completed | cancelled
  cover_color     text        default '#C85A2F',
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

create table if not exists dinner_party_guests (
  id           uuid        default gen_random_uuid() primary key,
  party_id     uuid        references dinner_parties(id) on delete cascade not null,
  user_id      uuid        references auth.users,
  email        text,
  display_name text,
  rsvp         text        default 'invited', -- invited | accepted | declined | maybe
  note         text,
  invited_at   timestamptz default now(),
  responded_at timestamptz,
  constraint unique_party_user  unique (party_id, user_id),
  constraint unique_party_email unique (party_id, email),
  constraint has_identity check (user_id is not null or email is not null)
);

create table if not exists dinner_party_comments (
  id         uuid        default gen_random_uuid() primary key,
  party_id   uuid        references dinner_parties(id) on delete cascade not null,
  user_id    uuid        references auth.users not null,
  content    text        not null,
  created_at timestamptz default now()
);

-- RLS
alter table dinner_parties         enable row level security;
alter table dinner_party_guests    enable row level security;
alter table dinner_party_comments  enable row level security;

-- Dinner parties: host can do anything; invited users can read
create policy "host full access" on dinner_parties
  for all using (host_id = auth.uid());

create policy "guests can read their parties" on dinner_parties
  for select using (
    id in (
      select party_id from dinner_party_guests
      where user_id = auth.uid()
    )
  );

-- Guests: host manages; self manages own RSVP
create policy "host manages guests" on dinner_party_guests
  for all using (
    party_id in (
      select id from dinner_parties where host_id = auth.uid()
    )
  );

create policy "guest manages own rsvp" on dinner_party_guests
  for update using (user_id = auth.uid());

create policy "guests can read guest list" on dinner_party_guests
  for select using (
    party_id in (
      select id from dinner_parties where host_id = auth.uid()
      union
      select party_id from dinner_party_guests where user_id = auth.uid()
    )
  );

-- Comments: party participants
create policy "party members can comment" on dinner_party_comments
  for all using (
    party_id in (
      select id from dinner_parties where host_id = auth.uid()
      union
      select party_id from dinner_party_guests where user_id = auth.uid()
    )
  );

-- Indexes
create index if not exists idx_dinner_parties_host      on dinner_parties(host_id, scheduled_at desc);
create index if not exists idx_dinner_parties_series    on dinner_parties(series_id);
create index if not exists idx_dp_guests_party          on dinner_party_guests(party_id);
create index if not exists idx_dp_guests_user           on dinner_party_guests(user_id);
create index if not exists idx_dp_comments_party        on dinner_party_comments(party_id, created_at desc);
