-- Read-only schema inventory for the phantom-proof drift check (object gate in
-- scripts/check-migration-drift.mjs). Lets CI verify that the objects each
-- committed migration creates actually exist. service_role-only.
create or replace function public.schema_inventory()
returns jsonb
language sql
security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'tables', (
      select coalesce(jsonb_agg(table_name order by table_name), '[]')
      from information_schema.tables
      where table_schema = 'public' and table_type = 'BASE TABLE'
    ),
    'columns', (
      select coalesce(jsonb_agg(table_name || '.' || column_name), '[]')
      from information_schema.columns where table_schema = 'public'
    ),
    'types', (
      select coalesce(jsonb_agg(t.typname), '[]')
      from pg_type t join pg_namespace n on n.oid = t.typnamespace
      where n.nspname = 'public' and t.typtype in ('e','c','d')
    ),
    'functions', (
      select coalesce(jsonb_agg(p.proname), '[]')
      from pg_proc p join pg_namespace n on n.oid = p.pronamespace
      where n.nspname = 'public'
    ),
    'enum_values', (
      select coalesce(jsonb_agg(t.typname || '.' || e.enumlabel), '[]')
      from pg_enum e
      join pg_type t on t.oid = e.enumtypid
      join pg_namespace n on n.oid = t.typnamespace
      where n.nspname = 'public'
    )
  );
$$;

revoke all on function public.schema_inventory() from public, anon, authenticated;
grant execute on function public.schema_inventory() to service_role;

-- Note: applied_migration_versions() (the ledger accessor) is defined in
-- 20260526160000_migration_drift_helper.sql — not redefined here.
