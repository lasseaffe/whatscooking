-- Recipe bug reports — run once in Supabase SQL editor
create table if not exists recipe_bug_reports (
  id           uuid primary key default gen_random_uuid(),
  recipe_id    text,
  recipe_name  text,
  issue_type   text not null,
  description  text,
  reporter_id  uuid references auth.users(id) on delete set null,
  created_at   timestamptz not null default now()
);

-- Index for quick lookups by recipe
create index if not exists idx_recipe_bug_reports_recipe_id on recipe_bug_reports(recipe_id);

-- RLS: anyone can insert, only service role can read
alter table recipe_bug_reports enable row level security;

create policy "anyone can report" on recipe_bug_reports
  for insert with check (true);

create policy "owner can read own reports" on recipe_bug_reports
  for select using (reporter_id = auth.uid());
