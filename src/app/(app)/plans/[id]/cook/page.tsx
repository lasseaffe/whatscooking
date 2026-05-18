// src/app/(app)/plans/[id]/cook/page.tsx
import { notFound, redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { CookClient } from './cook-client';

type Props = { params: Promise<{ id: string }> };

export default async function CookPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/sign-in');

  const { data: plan } = await supabase
    .from('meal_plans')
    .select('id, user_id, title, status, week_start, duration_days, meals_per_day')
    .eq('id', id)
    .single();
  if (!plan || plan.user_id !== user.id) notFound();

  const { data: entries } = await supabase
    .from('meal_entries')
    .select('id, day_number, meal_type, recipe_id, recipe_title, is_leftover, cooked_at, parent_clientid')
    .eq('meal_plan_id', id)
    .order('day_number')
    .order('meal_type');

  const recipeIds = Array.from(new Set((entries ?? []).map(e => e.recipe_id).filter((x): x is string => x != null)));
  const { data: recipes } = recipeIds.length > 0
    ? await supabase
        .from('recipes')
        .select('id, title, image_url, focal_x, focal_y, prep_time_minutes, cook_time_minutes, calories, ingredients, instructions')
        .in('id', recipeIds)
    : { data: [] };

  return (
    <CookClient
      plan={plan}
      entries={entries ?? []}
      recipes={recipes ?? []}
    />
  );
}
