import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

type Ctx = { params: Promise<{ id: string }> };

async function canEdit(supabase: Awaited<ReturnType<typeof createClient>>, partyId: string, userId: string) {
  const { data: party } = await supabase.from("dinner_parties").select("host_id").eq("id", partyId).single();
  if (party?.host_id === userId) return true;
  const { data: guest } = await supabase
    .from("dinner_party_guests")
    .select("role")
    .eq("party_id", partyId)
    .eq("user_id", userId)
    .maybeSingle();
  return guest?.role === "editor";
}

export async function GET(_req: Request, { params }: Ctx) {
  const { id } = await params;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("dinner_party_items")
    .select("*, recipe:recipes(id,title,image_url,cuisine_type)")
    .eq("party_id", id)
    .order("position")
    .order("created_at");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: Request, { params }: Ctx) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!await canEdit(supabase, id, user.id))
    return NextResponse.json({ error: "Not authorized to edit this party" }, { status: 403 });

  const body = await req.json();
  const { data, error } = await supabase
    .from("dinner_party_items")
    .insert({
      party_id: id,
      category: body.category ?? "meal",
      title: body.title,
      description: body.description ?? null,
      recipe_id: body.recipe_id ?? null,
      added_by: user.id,
      position: body.position ?? 0,
      notes: body.notes ?? null,
    })
    .select("*, recipe:recipes(id,title,image_url,cuisine_type)")
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}

export async function PATCH(req: Request, { params }: Ctx) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!await canEdit(supabase, id, user.id))
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });

  const body = await req.json();
  const { item_id, ...fields } = body;
  const allowed = ["category","title","description","recipe_id","position","notes"];
  const update = Object.fromEntries(Object.entries(fields).filter(([k]) => allowed.includes(k)));
  const { data, error } = await supabase
    .from("dinner_party_items")
    .update(update)
    .eq("id", item_id)
    .eq("party_id", id)
    .select("*, recipe:recipes(id,title,image_url,cuisine_type)")
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(req: Request, { params }: Ctx) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!await canEdit(supabase, id, user.id))
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });

  const url = new URL(req.url);
  const itemId = url.searchParams.get("item_id");
  if (!itemId) return NextResponse.json({ error: "item_id required" }, { status: 400 });
  await supabase.from("dinner_party_items").delete().eq("id", itemId).eq("party_id", id);
  return NextResponse.json({ ok: true });
}
