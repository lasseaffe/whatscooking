import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ slug: string; chapterId: string }> };

export async function POST(req: Request, { params }: Params) {
  const { slug, chapterId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: cookbook } = await supabase.from("cookbooks").select("id, user_id").eq("slug", slug).single();
  if (!cookbook || cookbook.user_id !== user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { recipe_id, position, chef_note, creator_meal_photo_url } = await req.json();
  const { data, error } = await supabase
    .from("cookbook_recipes")
    .insert({ chapter_id: chapterId, cookbook_id: cookbook.id, recipe_id, position: position ?? 0, chef_note, creator_meal_photo_url })
    .select("*, recipes(id, title, image_url, cuisine_type, dietary_tags, prep_time_minutes, cook_time_minutes)")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
