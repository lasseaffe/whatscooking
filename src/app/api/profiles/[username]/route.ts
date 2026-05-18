import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ username: string }> }
) {
  const { username } = await params;
  const supabase = await createClient();

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("id, username, full_name, avatar_url, bio, created_at")
    .eq("username", username)
    .single();

  if (error || !profile) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  const [
    { count: follower_count },
    { count: following_count },
    { count: cook_count },
    { count: recipe_count },
    { count: cookbook_count },
  ] = await Promise.all([
    supabase.from("user_follows").select("*", { count: "exact", head: true }).eq("following_id", profile.id),
    supabase.from("user_follows").select("*", { count: "exact", head: true }).eq("follower_id", profile.id),
    supabase.from("cook_posts").select("*", { count: "exact", head: true }).eq("user_id", profile.id),
    supabase.from("recipes").select("*", { count: "exact", head: true }).eq("created_by", profile.id).eq("is_published", true),
    supabase.from("cookbooks").select("*", { count: "exact", head: true }).eq("user_id", profile.id).eq("status", "published"),
  ]);

  // Check if the requesting user is following this profile
  const { data: { user } } = await supabase.auth.getUser();
  let is_following = false;
  if (user) {
    const { data: follow } = await supabase
      .from("user_follows")
      .select("follower_id")
      .eq("follower_id", user.id)
      .eq("following_id", profile.id)
      .single();
    is_following = !!follow;
  }

  return NextResponse.json({
    profile,
    stats: {
      follower_count: follower_count ?? 0,
      following_count: following_count ?? 0,
      cook_count: cook_count ?? 0,
      recipe_count: recipe_count ?? 0,
      cookbook_count: cookbook_count ?? 0,
    },
    is_following,
  });
}
