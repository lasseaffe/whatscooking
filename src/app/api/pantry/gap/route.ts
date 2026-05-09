import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

// POST /api/pantry/gap
// Body: { ingredients: { name: string; amount?: number; unit?: string }[] }
// Returns: { missing: { name: string; amount?: number; unit?: string }[] }
// Matching: case-insensitive substring match — "chicken breast" matches pantry "chicken"
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { ingredients } = await req.json() as {
      ingredients: { name: string; amount?: number; unit?: string }[];
    };

    if (!Array.isArray(ingredients) || ingredients.length === 0)
      return NextResponse.json({ missing: [] });

    const { data: pantryItems } = await supabase
      .from("pantry_items")
      .select("name")
      .eq("user_id", user.id);

    const pantryNames = (pantryItems ?? []).map((p) => p.name.toLowerCase());

    const missing = ingredients.filter((ing) => {
      const ingLower = ing.name.toLowerCase();
      return !pantryNames.some((p) => {
        // exact match or pantry contains ingredient name
        if (p === ingLower || p.includes(ingLower)) return true;
        // pantry word appears as whole word in ingredient
        const escaped = p.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        return new RegExp(`\\b${escaped}\\b`).test(ingLower);
      });
    });

    return NextResponse.json({ missing });
  } catch (err) {
    console.error("[pantry/gap POST]", err);
    return NextResponse.json({ error: "Failed to compute gap" }, { status: 500 });
  }
}
