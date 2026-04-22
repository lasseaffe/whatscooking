import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type");
  const q = searchParams.get("q");

  let query = supabase
    .from("meal_plans")
    .select("*")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false });

  if (type && type !== "all") query = query.eq("plan_type", type);
  if (q) query = query.ilike("title", `%${q}%`);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { title, cuisine, plan_type, serves, start_date, end_date, description, is_public, dietary_tags, tags } = body;

  if (!title?.trim()) return NextResponse.json({ error: "Title is required" }, { status: 400 });

  const { data, error } = await supabase
    .from("meal_plans")
    .insert({
      user_id: user.id,
      title,
      cuisine: cuisine ?? null,
      plan_type: plan_type ?? null,
      serves: serves ?? 2,
      start_date: start_date ?? null,
      end_date: end_date ?? null,
      description: description ?? null,
      is_public: is_public ?? false,
      dietary_tags: dietary_tags ?? [],
      tags: tags ?? [],
      status: "draft",
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(data, { status: 201 });
}
