-- ══════════════════════════════════════════════════════════════
-- Ranked Score for published recipes
-- Safe to run at any time — skips gracefully if dependencies
-- (recipe_ratings / recipe_saves) don't exist yet.
-- ══════════════════════════════════════════════════════════════

-- Step 1: add columns to profiles (always safe)
alter table profiles
  add column if not exists ranked_score      numeric(6,2) default 0,
  add column if not exists ranked_tier       text         default 'Newcomer',
  add column if not exists ranked_updated_at timestamptz;

-- Step 2: everything that touches recipe_ratings / recipe_saves
-- is wrapped in a guard so it silently skips if those tables
-- haven't been created yet (run features.sql first to unlock).
do $$
declare
  ratings_exist boolean;
  saves_exist   boolean;
begin
  select exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'recipe_ratings'
  ) into ratings_exist;

  select exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'recipe_saves'
  ) into saves_exist;

  if not ratings_exist or not saves_exist then
    raise notice 'Skipping ranked_score setup: recipe_ratings or recipe_saves table not found. Run features.sql first, then re-run this file.';
    return;
  end if;

  -- ── recalculate function ──────────────────────────────────
  execute $func$
    create or replace function recalculate_ranked_score(target_user_id uuid)
    returns void
    language plpgsql
    security definer
    set search_path = public
    as $f$
    declare
      v_recipe_count  int;
      v_avg_taste     numeric;
      v_total_ratings int;
      v_total_saves   int;
      v_score         numeric;
      v_tier          text;
    begin
      select count(*) into v_recipe_count
      from recipes where created_by = target_user_id;

      if v_recipe_count = 0 then
        update profiles
        set ranked_score = 0, ranked_tier = 'Newcomer', ranked_updated_at = now()
        where id = target_user_id;
        return;
      end if;

      select coalesce(avg(rr.taste), 0), coalesce(count(rr.id), 0)
      into v_avg_taste, v_total_ratings
      from recipe_ratings rr
      join recipes r on r.id = rr.recipe_id
      where r.created_by = target_user_id;

      select coalesce(count(*), 0) into v_total_saves
      from recipe_saves rs
      join recipes r on r.id = rs.recipe_id
      where r.created_by = target_user_id;

      v_score := least(999,
        (v_avg_taste * 20)
        + (ln(v_total_ratings + 1) * 8)
        + (ln(v_total_saves   + 1) * 6)
      );

      v_tier := case
        when v_score >= 800 then 'Legendary Chef'
        when v_score >= 600 then 'Master Chef'
        when v_score >= 400 then 'Expert Cook'
        when v_score >= 200 then 'Home Chef'
        when v_score >= 80  then 'Apprentice'
        else 'Newcomer'
      end;

      update profiles
      set ranked_score = v_score, ranked_tier = v_tier, ranked_updated_at = now()
      where id = target_user_id;
    end;
    $f$;
  $func$;

  -- ── trigger on recipe_ratings ─────────────────────────────
  execute $func$
    create or replace function _trg_ranked_on_rating()
    returns trigger language plpgsql security definer set search_path = public as $f$
    declare v_creator uuid;
    begin
      select created_by into v_creator from recipes
      where id = coalesce(NEW.recipe_id, OLD.recipe_id);
      if v_creator is not null then
        perform recalculate_ranked_score(v_creator);
      end if;
      return coalesce(NEW, OLD);
    end;
    $f$;
  $func$;

  drop trigger if exists trg_ranked_on_rating on recipe_ratings;
  execute 'create trigger trg_ranked_on_rating
    after insert or update or delete on recipe_ratings
    for each row execute function _trg_ranked_on_rating()';

  -- ── trigger on recipe_saves ───────────────────────────────
  execute $func$
    create or replace function _trg_ranked_on_save()
    returns trigger language plpgsql security definer set search_path = public as $f$
    declare v_creator uuid;
    begin
      select created_by into v_creator from recipes
      where id = coalesce(NEW.recipe_id, OLD.recipe_id);
      if v_creator is not null then
        perform recalculate_ranked_score(v_creator);
      end if;
      return coalesce(NEW, OLD);
    end;
    $f$;
  $func$;

  drop trigger if exists trg_ranked_on_save on recipe_saves;
  execute 'create trigger trg_ranked_on_save
    after insert or delete on recipe_saves
    for each row execute function _trg_ranked_on_save()';

  -- ── backfill existing creators ────────────────────────────
  declare
    r record;
  begin
    for r in select distinct created_by from recipes where created_by is not null loop
      perform recalculate_ranked_score(r.created_by);
    end loop;
  end;

  raise notice 'ranked_score setup complete.';
end;
$$;
