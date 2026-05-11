-- supabase/migrations/20260511000000_subscriptions.sql

create type subscription_tier as enum ('free','solo_plus','household');
create type subscription_status as enum ('active','trialing','past_due','canceled','grandfathered','free');

create table public.subscriptions (
  user_id              uuid primary key references auth.users(id) on delete cascade,
  rc_user_id           text not null,
  tier                 subscription_tier not null default 'free',
  status               subscription_status not null default 'free',
  current_period_end   timestamptz,
  trial_end_at         timestamptz,
  cancel_at_period_end boolean not null default false,
  stripe_customer_id   text,
  rc_entitlement       text,
  billing_period       text check (billing_period in ('monthly','annual')),
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

create index subscriptions_status_idx on public.subscriptions (status);
create index subscriptions_trial_end_idx on public.subscriptions (trial_end_at) where trial_end_at is not null;

create table public.subscription_events (
  id          bigserial primary key,
  user_id     uuid references auth.users(id) on delete set null,
  event_type  text not null,
  source      text not null check (source in ('revenuecat','stripe','system')),
  payload     jsonb not null,
  created_at  timestamptz not null default now()
);

create index subscription_events_user_idx on public.subscription_events (user_id, created_at desc);

alter table public.subscriptions enable row level security;
alter table public.subscription_events enable row level security;

create policy "users read own subscription"
  on public.subscriptions for select
  using (auth.uid() = user_id);

create policy "users read own subscription events"
  on public.subscription_events for select
  using (auth.uid() = user_id);

-- Trigger to keep updated_at fresh on writes
create or replace function public.set_subscription_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger subscriptions_updated_at
  before update on public.subscriptions
  for each row execute function public.set_subscription_updated_at();
