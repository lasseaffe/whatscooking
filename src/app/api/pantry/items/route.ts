import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { name, quantity, category_id } = await req.json();
    if (!name?.trim()) return NextResponse.json({ error: "name required" }, { status: 400 });

    // Ensure a profile row exists for this user (handles accounts created before
    // the on_auth_user_created trigger was in place — without it pantry_items FK fails)
    await supabase
      .from("profiles")
      .upsert({ id: user.id, full_name: user.user_metadata?.full_name ?? null }, { onConflict: "id" });

    const { data, error } = await supabase
      .from("pantry_items")
      .insert({
        user_id: user.id,
        name: name.trim(),
        quantity: quantity ?? null,
        category_id: category_id ?? null,
      })
      .select("*, category:ingredient_categories(id, name, emoji, color)")
      .single();

    if (error) {
      console.error("[pantry/items POST]", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ item: data });
  } catch (err) {
    console.error("[pantry/items POST]", err);
    return NextResponse.json({ error: "Failed to add item" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

    const { error } = await supabase
      .from("pantry_items")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[pantry/items DELETE]", err);
    return NextResponse.json({ error: "Failed to delete item" }, { status: 500 });
  }
}
