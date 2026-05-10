-- supabase/add_fix_columns.sql
-- Run once in Supabase SQL editor

alter table recipe_bug_reports
  add column if not exists source_url   text,
  add column if not exists fix_file_path text,
  add column if not exists fix_status   text check (fix_status in ('applied', 'pending', 'pending_review')),
  add column if not exists resolved_at  timestamptz,
  add column if not exists resolved_by  text;

-- Allow authenticated users to read their own reports (needed by /reports page)
drop policy if exists "owner can read own reports" on recipe_bug_reports;
create policy "authenticated can read reports" on recipe_bug_reports
  for select using (auth.role() = 'authenticated');
