import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export async function DELETE(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  // Verify ownership
  const { data: recipe } = await supabase
    .from("recipes")
    .select("created_by, source")
    .eq("id", id)
    .single();

  if (!recipe || recipe.source !== "user" || recipe.created_by !== user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Clean up dependants first
  await supabase.from("recipe_saves").delete().eq("recipe_id", id);
  await supabase.from("recipe_ratings").delete().eq("recipe_id", id);
  await supabase.from("recipes").delete().eq("id", id);

  return NextResponse.json({ deleted: true });
}
