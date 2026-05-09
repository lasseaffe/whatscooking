import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const supabase = await createClient();
  const { searchParams } = new URL(req.url);
  const sort = searchParams.get("sort") ?? "newest";
  const priceFilter = searchParams.get("price");

  let query = supabase
    .from("cookbooks")
    .select(`
      id, title, description, cover_image_url, theme_color, title_font,
      tagline, price, slug, view_count, created_at,
      profiles(username, full_name, avatar_url),
      cookbook_chapters(id, cookbook_recipes(id))
    `)
    .eq("status", "published");

  if (priceFilter === "free") query = query.eq("price", 0);
  if (priceFilter === "paid") query = query.gt("price", 0);
  if (sort === "newest") {
    query = query.order("created_at", { ascending: false });
  } else {
    query = query.order("view_count", { ascending: false });
  }

  const { data, error } = await query.limit(48);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { title, description, cover_image_url, theme_color, title_font, tagline, price, status, slug } = body;
  if (!title || !slug) return NextResponse.json({ error: "title and slug required" }, { status: 400 });

  const { data, error } = await supabase
    .from("cookbooks")
    .insert({ user_id: user.id, title, description, cover_image_url, theme_color, title_font, tagline, price: price ?? 0, status: status ?? "draft", slug })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
