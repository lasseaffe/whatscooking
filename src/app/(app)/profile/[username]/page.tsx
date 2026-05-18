// src/app/(app)/profile/[username]/page.tsx
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ProfileHeader } from "@/components/social/profile-header";
import { ProfileTabs } from "@/components/social/profile-tabs";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ username: string }>;
}

export default async function PublicProfilePage({ params }: Props) {
  const { username } = await params;
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, username, full_name, avatar_url, bio, created_at")
    .eq("username", username)
    .single();

  if (!profile) notFound();

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

  const { data: { user } } = await supabase.auth.getUser();
  let isFollowing = false;
  let isOwnProfile = false;

  if (user) {
    isOwnProfile = user.id === profile.id;
    if (!isOwnProfile) {
      const { data: follow } = await supabase
        .from("user_follows")
        .select("follower_id")
        .eq("follower_id", user.id)
        .eq("following_id", profile.id)
        .single();
      isFollowing = !!follow;
    }
  }

  const stats = {
    follower_count: follower_count ?? 0,
    following_count: following_count ?? 0,
    cook_count: cook_count ?? 0,
    recipe_count: recipe_count ?? 0,
    cookbook_count: cookbook_count ?? 0,
  };

  return (
    <div className="min-h-screen pb-20" style={{ background: "#0A0604" }}>
      <ProfileHeader
        profile={profile}
        stats={stats}
        isOwnProfile={isOwnProfile}
        initialIsFollowing={isFollowing}
      />
      <ProfileTabs
        username={profile.username}
        userId={profile.id}
        currentUserId={user?.id}
        initialTab="cooks"
      />
    </div>
  );
}
