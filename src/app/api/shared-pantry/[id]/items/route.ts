import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Params) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: items, error } = await supabase
    .from("shared_pantry_items")
    .select("*, ingredient_categories(id, name, emoji, color)")
    .eq("pantry_id", id)
    .order("updated_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(items ?? []);
}

export async function POST(req: Request, { params }: Params) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { data, error } = await supabase
    .from("shared_pantry_items")
    .insert({
      pantry_id: id,
      name: body.name,
      quantity: body.quantity ?? null,
      unit: body.unit ?? null,
      category_id: body.category_id ?? null,
      added_by: user.id,
    })
    .select("*, ingredient_categories(id, name, emoji, color)")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(req: Request, { params }: Params) {
  const { id: pantryId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const itemId = searchParams.get("itemId");
  if (!itemId) return NextResponse.json({ error: "itemId required" }, { status: 400 });

  const { error } = await supabase
    .from("shared_pantry_items")
    .delete()
    .eq("id", itemId)
    .eq("pantry_id", pantryId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
