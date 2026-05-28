-- supabase/migrations/20260525000000_drink_meta.sql
alter table public.recipes
  add column if not exists drink_meta jsonb not null default '{}';
