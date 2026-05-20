create table if not exists challenge_definitions (
  id            uuid primary key default gen_random_uuid(),
  title         text not null,
  description   text not null,
  emoji         text not null,
  category      text not null check (category in ('handicap','appliance','speedrun','wildcard','dare')),
  difficulty    text not null check (difficulty in ('easy','medium','hard','insane')),
  requires_proof boolean not null default false,
  is_daily      boolean not null default false,
  is_active     boolean not null default true,
  created_at    timestamptz not null default now()
);

create table if not exists challenge_completions (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  challenge_id  uuid not null references challenge_definitions(id) on delete cascade,
  completed_at  timestamptz not null default now(),
  proof_url     text,
  note          text
);

create table if not exists challenge_reactions (
  id            uuid primary key default gen_random_uuid(),
  completion_id uuid not null references challenge_completions(id) on delete cascade,
  user_id       uuid not null references auth.users(id) on delete cascade,
  created_at    timestamptz not null default now(),
  unique (completion_id, user_id)
);

-- Indexes
create index if not exists challenge_completions_user_idx on challenge_completions(user_id);
create index if not exists challenge_completions_completed_at_idx on challenge_completions(completed_at desc);
create index if not exists challenge_reactions_completion_idx on challenge_reactions(completion_id);

-- RLS
alter table challenge_definitions  enable row level security;
alter table challenge_completions   enable row level security;
alter table challenge_reactions     enable row level security;

-- challenge_definitions: public read
create policy "anyone can read active challenges"
  on challenge_definitions for select using (is_active = true);

-- challenge_completions: read own + household members'; insert own
create policy "users read own completions"
  on challenge_completions for select
  using (user_id = auth.uid());

create policy "users read household completions"
  on challenge_completions for select
  using (
    user_id in (
      select hm.linked_user_id
      from household_members hm
      inner join household_members me on me.kitchen_group_id = hm.kitchen_group_id
      where me.linked_user_id = auth.uid()
        and hm.linked_user_id is not null
    )
  );

create policy "users insert own completions"
  on challenge_completions for insert
  with check (user_id = auth.uid());

-- challenge_reactions: authenticated read/insert; delete own
create policy "authenticated can read reactions"
  on challenge_reactions for select using (auth.uid() is not null);

create policy "authenticated can insert reaction"
  on challenge_reactions for insert with check (user_id = auth.uid());

create policy "users delete own reaction"
  on challenge_reactions for delete using (user_id = auth.uid());

-- Storage bucket for proof photos
insert into storage.buckets (id, name, public)
values ('challenge-proofs', 'challenge-proofs', true)
on conflict (id) do nothing;

create policy "users upload own proof"
  on storage.objects for insert
  with check (bucket_id = 'challenge-proofs' and (storage.foldername(name))[1] = auth.uid()::text);
