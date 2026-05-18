// src/components/social/profile-header.tsx
"use client";

import { useState } from "react";
import Image from "next/image";
import type { PublicProfile, ProfileStats } from "@/lib/types";

interface Props {
  profile: PublicProfile;
  stats: ProfileStats;
  isOwnProfile: boolean;
  initialIsFollowing: boolean;
}

export function ProfileHeader({ profile, stats, isOwnProfile, initialIsFollowing }: Props) {
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
  const [followerCount, setFollowerCount] = useState(stats.follower_count);
  const [loading, setLoading] = useState(false);

  async function toggleFollow() {
    if (loading) return;
    setLoading(true);
    const optimistic = !isFollowing;
    setIsFollowing(optimistic);
    setFollowerCount((c) => c + (optimistic ? 1 : -1));
    try {
      await fetch(`/api/profiles/${profile.username}/follow`, {
        method: optimistic ? "POST" : "DELETE",
      });
    } catch {
      setIsFollowing(!optimistic);
      setFollowerCount((c) => c + (optimistic ? -1 : 1));
    } finally {
      setLoading(false);
    }
  }

  const statItems = [
    { label: "Followers", value: followerCount },
    { label: "Cooks", value: stats.cook_count },
    { label: "Recipes", value: stats.recipe_count },
    { label: "Books", value: stats.cookbook_count },
  ];

  return (
    <div>
      {/* Cover banner */}
      <div
        className="h-24 w-full"
        style={{ background: "linear-gradient(135deg, #3A2010 0%, #1A100A 100%)" }}
      />

      <div className="px-4">
        {/* Avatar row */}
        <div className="flex items-end justify-between -mt-8 mb-3">
          <div
            className="w-16 h-16 rounded-full overflow-hidden border-4 flex-shrink-0 flex items-center justify-center text-2xl font-bold"
            style={{ borderColor: "#0A0604", background: "#2A1808", color: "#C8956C" }}
          >
            {profile.avatar_url ? (
              <Image src={profile.avatar_url} alt={profile.full_name ?? profile.username} width={64} height={64} className="object-cover w-full h-full" />
            ) : (
              (profile.full_name ?? profile.username)[0].toUpperCase()
            )}
          </div>

          {!isOwnProfile && (
            <button
              type="button"
              onClick={toggleFollow}
              disabled={loading}
              className="px-5 py-2 rounded-2xl text-sm font-semibold transition-all disabled:opacity-50"
              style={
                isFollowing
                  ? { background: "#2A1808", color: "#C8956C", border: "1px solid rgba(180,120,60,0.4)" }
                  : { background: "#C8956C", color: "#1A0E04" }
              }
            >
              {isFollowing ? "Following" : "Follow"}
            </button>
          )}
        </div>

        {/* Name + username */}
        <h1 className="text-lg font-bold leading-tight" style={{ fontFamily: "var(--font-fraunces, 'Fraunces', Georgia, serif)", color: "#EFE3CE" }}>
          {profile.full_name ?? profile.username}
        </h1>
        <p className="text-sm mb-2" style={{ color: "#5A3A24" }}>@{profile.username}</p>

        {/* Bio */}
        {profile.bio && (
          <p className="text-sm leading-relaxed mb-4" style={{ color: "#8A6A4A" }}>{profile.bio}</p>
        )}

        {/* Stats strip */}
        <div className="grid grid-cols-4 rounded-2xl overflow-hidden mb-4" style={{ background: "#1A100A", border: "1px solid rgba(180,120,60,0.15)" }}>
          {statItems.map((item, i) => (
            <div
              key={item.label}
              className="py-3 text-center"
              style={{ borderRight: i < 3 ? "1px solid rgba(180,120,60,0.1)" : "none" }}
            >
              <div className="text-base font-bold" style={{ color: "#EFE3CE" }}>{item.value}</div>
              <div className="text-xs mt-0.5" style={{ color: "#5A3A24" }}>{item.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
