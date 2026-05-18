import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { recipe_id, recipe_title, source } = await req.json();
  if (!recipe_title) return NextResponse.json({ error: "recipe_title required" }, { status: 400 });

  const validSources = ["plan", "cooking_mode", "recipe_page"];
  const safeSource = validSources.includes(source) ? source : "recipe_page";

  const { data, error } = await supabase
    .from("cook_log")
    .insert({
      user_id: user.id,
      recipe_id: recipe_id ?? null,
      recipe_title,
      source: safeSource,
    })
    .select("id, cooked_at")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Emit streak event (same pattern as cook-entry route)
  supabase.from("streak_events").insert({
    user_id: user.id,
    action_id: "recipe_cooked",
    day: new Date().toISOString().slice(0, 10),
  }).then(() => {}, () => {});

  return NextResponse.json({ id: data.id, cooked_at: data.cooked_at });
}
