import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: cookbook } = await supabase.from("cookbooks").select("id, user_id").eq("slug", slug).single();
  if (!cookbook || cookbook.user_id !== user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { title, intro_text, cover_image_url, position } = await req.json();
  const { data, error } = await supabase
    .from("cookbook_chapters")
    .insert({ cookbook_id: cookbook.id, title, intro_text, cover_image_url, position: position ?? 0 })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
