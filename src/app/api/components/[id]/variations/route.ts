import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type");

  const supabase = await createClient();

  let query = supabase
    .from("recipes")
    .select(
      "id, title, description, image_url, component_type, variation_type, variation_notes, variation_overrides, cook_time_minutes, prep_time_minutes, servings, ingredients, instructions, creator_approved, created_by, source"
    )
    .eq("is_component", true)
    .eq("is_variation", true)
    .eq("parent_id", id)
    .order("source", { ascending: false }) // 'curated' before community
    .order("title");

  if (type) {
    query = query.eq("variation_type", type);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ variations: data ?? [] });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const {
    title,
    variation_type,
    variation_notes,
    variation_overrides,
    ingredients,
    instructions,
    description,
  } = body;

  if (!title || !variation_type || !variation_notes) {
    return NextResponse.json(
      { error: "title, variation_type, and variation_notes are required" },
      { status: 400 }
    );
  }

  // Fetch parent to inherit component_type
  const { data: parent } = await supabase
    .from("recipes")
    .select("component_type")
    .eq("id", id)
    .single();

  if (!parent) {
    return NextResponse.json({ error: "Parent component not found" }, { status: 404 });
  }

  const { data, error } = await supabase
    .from("recipes")
    .insert({
      source: "user",
      title,
      description: description ?? null,
      is_component: true,
      component_type: parent.component_type,
      is_variation: true,
      parent_id: id,
      variation_type,
      variation_notes,
      variation_overrides: variation_overrides ?? null,
      // Full recipe fields (null for quick-twist)
      ingredients: ingredients ?? [],
      instructions: instructions ?? [],
      is_published: true,
      creator_approved: false,
      created_by: user.id,
    })
    .select("id")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ id: data.id }, { status: 201 });
}
