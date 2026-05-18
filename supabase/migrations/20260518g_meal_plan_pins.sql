-- ============================================================
-- meal_plan_pins
-- Recipes a user has pinned to a plan during the Pinboard browse phase.
-- ============================================================

create table if not exists public.meal_plan_pins (
  id           uuid primary key default gen_random_uuid(),
  meal_plan_id uuid not null references public.meal_plans(id) on delete cascade,
  recipe_id    uuid not null references public.recipes(id) on delete cascade,
  pinned_at    timestamptz not null default now(),
  priority     int not null default 0,
  unique (meal_plan_id, recipe_id)
);

create index if not exists meal_plan_pins_meal_plan_id_idx
  on public.meal_plan_pins(meal_plan_id);

alter table public.meal_plan_pins enable row level security;

drop policy if exists "Pin owners can do anything" on public.meal_plan_pins;
create policy "Pin owners can do anything"
  on public.meal_plan_pins for all
  using (
    exists (
      select 1 from public.meal_plans p
      where p.id = meal_plan_pins.meal_plan_id
        and p.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.meal_plans p
      where p.id = meal_plan_pins.meal_plan_id
        and p.user_id = auth.uid()
    )
  );
