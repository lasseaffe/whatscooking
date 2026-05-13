import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

type Ingredient = { name: string; amount?: number | null; unit?: string | null };

function fuzzyMatch(ingredientName: string, pantryName: string): boolean {
  const ing = ingredientName.toLowerCase().trim();
  const pn = pantryName.toLowerCase().trim();
  if (ing === pn) return true;
  const ingWords = ing.split(/\s+/);
  const pantryWords = pn.split(/\s+/);
  return (
    ingWords.some((w) => w.length > 3 && pn.includes(w)) ||
    pantryWords.some((w) => w.length > 3 && ing.includes(w))
  );
}

// POST /api/plans/[id]/cook-entry
// Body: { recipe_id?: string; recipe_title?: string }
// Fuzzy-matches recipe ingredients against pantry, deducts 1 unit per match.
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: planId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Verify plan belongs to user
  const { data: plan } = await supabase
    .from("meal_plans")
    .select("user_id")
    .eq("id", planId)
    .single();
  if (!plan || plan.user_id !== user.id)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { recipe_id, recipe_title } = await req.json();

  // Fetch recipe ingredients
  let ingredients: Ingredient[] = [];
  if (recipe_id) {
    const { data } = await supabase
      .from("recipes")
      .select("ingredients")
      .eq("id", recipe_id)
      .single();
    ingredients = (data?.ingredients ?? []) as Ingredient[];
  } else if (recipe_title) {
    const { data } = await supabase
      .from("recipes")
      .select("ingredients")
      .ilike("title", recipe_title.trim())
      .limit(1)
      .single();
    ingredients = (data?.ingredients ?? []) as Ingredient[];
  }

  if (ingredients.length === 0)
    return NextResponse.json({ deducted: [] });

  // Fetch user's pantry
  const { data: pantry } = await supabase
    .from("pantry_items")
    .select("id, name, quantity")
    .eq("user_id", user.id);

  const pantryItems = pantry ?? [];
  const deducted: string[] = [];

  for (const ing of ingredients) {
    if (!ing.name?.trim()) continue;
    const match = pantryItems.find((p) => fuzzyMatch(ing.name, p.name));
    if (!match) continue;

    const currentQty = match.quantity ?? null;
    if (currentQty === null) continue; // no quantity tracked — skip

    const deductAmt = ing.amount ?? 1;
    const newQty = Math.max(0, currentQty - deductAmt);

    await supabase
      .from("pantry_items")
      .update({ quantity: newQty })
      .eq("id", match.id)
      .eq("user_id", user.id);

    deducted.push(match.name);
  }

  // XA-4: emit recipe_cooked to shared streak_events table (HolyFlex reads this)
  supabase.from("streak_events").insert({
    user_id: user.id,
    action_id: "recipe_cooked",
    day: new Date().toISOString().slice(0, 10),
  }).then(() => {}, () => {});

  return NextResponse.json({ deducted });
}
