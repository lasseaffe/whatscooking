import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("cookbooks")
    .select(`
      *,
      profiles(username, full_name, avatar_url),
      cookbook_chapters(
        *, cookbook_recipes(*, recipes(id, title, image_url, cuisine_type, dietary_tags, prep_time_minutes, cook_time_minutes))
      )
    `)
    .eq("slug", slug)
    .single();

  if (error || !data) return NextResponse.json({ error: "Not found" }, { status: 404 });
  await supabase.from("cookbooks").update({ view_count: (data.view_count ?? 0) + 1 }).eq("id", data.id);
  return NextResponse.json(data);
}

export async function PATCH(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();

  // Fetch current status before update to detect publish flip
  const { data: current } = await supabase
    .from("cookbooks")
    .select("status")
    .eq("slug", slug)
    .eq("user_id", user.id)
    .single();

  const { data, error } = await supabase
    .from("cookbooks")
    .update(body)
    .eq("slug", slug)
    .eq("user_id", user.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Fire-and-forget: log to activity_feed when status flips to published
  if (current?.status !== "published" && body.status === "published") {
    supabase.from("activity_feed").insert({
      user_id: user.id,
      action_type: "published",
      metadata: { cookbook_id: data.id, cookbook_title: data.title },
    }).then(({ error: feedError }) => {
      if (feedError) console.error("[cookbooks activity_feed]", feedError);
    });
  }

  return NextResponse.json(data);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { error } = await supabase.from("cookbooks").delete().eq("slug", slug).eq("user_id", user.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
