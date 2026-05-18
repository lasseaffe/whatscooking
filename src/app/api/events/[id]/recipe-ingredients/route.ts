import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Params) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: menuItems, error: menuErr } = await supabase
    .from('event_menu_items')
    .select('id, name, recipe_id')
    .eq('party_id', id)
    .not('recipe_id', 'is', null);

  if (menuErr) return NextResponse.json({ error: menuErr.message }, { status: 500 });
  if (!menuItems || menuItems.length === 0) return NextResponse.json([]);

  const recipeIds = menuItems.map(m => m.recipe_id as string);

  const { data: ingredients, error: ingErr } = await supabase
    .from('recipe_ingredients')
    .select('recipe_id, name, quantity, unit')
    .in('recipe_id', recipeIds);

  if (ingErr) return NextResponse.json({ error: ingErr.message }, { status: 500 });

  // Fetch recipe servings so the client can scale quantities by guest count
  const { data: recipes } = await supabase
    .from('recipes')
    .select('id, servings')
    .in('id', recipeIds);

  const servingsMap = new Map((recipes ?? []).map(r => [r.id, r.servings as number | null]));

  const result = menuItems.map(mi => ({
    menuItemId: mi.id,
    menuItemName: mi.name,
    recipeId: mi.recipe_id,
    servings: servingsMap.get(mi.recipe_id as string) ?? null,
    ingredients: (ingredients ?? [])
      .filter(ing => ing.recipe_id === mi.recipe_id)
      .map(ing => ({
        name: ing.name,
        quantity: ing.quantity && ing.unit ? `${ing.quantity} ${ing.unit}` : (ing.quantity ?? null),
        rawQuantity: ing.quantity as number | null,
        unit: ing.unit as string | null,
      })),
  }));

  return NextResponse.json(result);
}
