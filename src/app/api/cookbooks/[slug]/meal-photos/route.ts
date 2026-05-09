import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ slug: string }> };

export async function GET(_req: Request, { params }: Params) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: cookbook } = await supabase.from("cookbooks").select("id").eq("slug", slug).single();
  if (!cookbook) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { data, error } = await supabase
    .from("cookbook_meal_photos")
    .select("*, profiles(username, avatar_url)")
    .eq("cookbook_id", cookbook.id)
    .eq("is_flagged", false)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: Request, { params }: Params) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: cookbook } = await supabase.from("cookbooks").select("id").eq("slug", slug).single();
  if (!cookbook) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { recipe_id, photo_url, caption } = await req.json();
  const { data, error } = await supabase
    .from("cookbook_meal_photos")
    .insert({ cookbook_id: cookbook.id, recipe_id, user_id: user.id, photo_url, caption })
    .select("*, profiles(username, avatar_url)")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
