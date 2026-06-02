-- Read-only helper so CI can detect migration drift using the existing service
-- key. The supabase_migrations schema is not exposed via PostgREST, so this
-- security-definer function surfaces the applied migration versions. Restricted
-- to service_role (CI). See scripts/check-migration-drift.mjs.
create or replace function public.applied_migration_versions()
returns text[]
language sql
security definer
set search_path = ''
as $$
  select coalesce(array_agg(version order by version), '{}')
  from supabase_migrations.schema_migrations;
$$;

revoke all on function public.applied_migration_versions() from public, anon, authenticated;
grant execute on function public.applied_migration_versions() to service_role;
