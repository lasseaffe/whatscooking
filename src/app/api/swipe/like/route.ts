import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { recipe_id } = await req.json();
  if (!recipe_id) return NextResponse.json({ error: "recipe_id required" }, { status: 400 });

  const { error } = await supabase
    .from("swipe_likes")
    .upsert({ user_id: user.id, recipe_id }, { onConflict: "user_id,recipe_id" });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const recipe_id = url.searchParams.get("recipe_id");
  if (!recipe_id) return NextResponse.json({ error: "recipe_id required" }, { status: 400 });

  await supabase.from("swipe_likes").delete()
    .eq("user_id", user.id).eq("recipe_id", recipe_id);

  return NextResponse.json({ ok: true });
}

export async function GET(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const limit = parseInt(url.searchParams.get("limit") ?? "100");

  const { data, error } = await supabase
    .from("swipe_likes")
    .select("recipe_id, liked_at, recipe:recipes(id, title, image_url, cuisine_type, dietary_tags, prep_time_minutes, cook_time_minutes, calories, difficulty_level)")
    .eq("user_id", user.id)
    .order("liked_at", { ascending: false })
    .limit(limit);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
