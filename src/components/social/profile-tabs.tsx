// src/components/social/profile-tabs.tsx
"use client";

import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { CookPostCard } from "./cook-post-card";
import { RecipeCard } from "@/components/recipe-card";
import type { CookPost, Recipe } from "@/lib/types";

type Tab = "cooks" | "recipes" | "cookbooks";

interface Cookbook {
  id: string;
  slug: string;
  title: string;
  cover_image_url: string | null;
  theme_color: string | null;
  tagline: string | null;
  price: number;
}

interface Props {
  username: string;
  userId: string;
  currentUserId?: string;
  initialTab?: Tab;
}

export function ProfileTabs({ username, userId, currentUserId, initialTab = "cooks" }: Props) {
  const [tab, setTab] = useState<Tab>(initialTab);
  const [cooks, setCooks] = useState<CookPost[] | null>(null);
  const [recipes, setRecipes] = useState<Recipe[] | null>(null);
  const [cookbooks, setCookbooks] = useState<Cookbook[] | null>(null);
  const [loading, setLoading] = useState(false);

  async function loadTab(t: Tab) {
    setLoading(true);
    try {
      if (t === "cooks" && cooks === null) {
        const res = await fetch(`/api/profiles/${username}/cooks`);
        const data = await res.json();
        setCooks(data.posts ?? []);
      } else if (t === "recipes" && recipes === null) {
        const res = await fetch(`/api/recipes/list?created_by=${userId}&is_published=true&limit=24`);
        const data = await res.json();
        setRecipes(data.recipes ?? []);
      } else if (t === "cookbooks" && cookbooks === null) {
        const res = await fetch(`/api/cookbooks?user_id=${userId}`);
        const data = await res.json();
        setCookbooks(Array.isArray(data) ? data : []);
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadTab(tab);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  const tabs: { key: Tab; label: string }[] = [
    { key: "cooks", label: "Cooks" },
    { key: "recipes", label: "Recipes" },
    { key: "cookbooks", label: "Cookbooks" },
  ];

  return (
    <div>
      {/* Tab bar */}
      <div className="flex border-b px-4 mb-4" style={{ borderColor: "rgba(180,120,60,0.15)" }}>
        {tabs.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className="px-4 py-3 text-sm font-medium transition-colors relative"
            style={{ color: tab === t.key ? "#C8956C" : "#5A3A24" }}
          >
            {t.label}
            {tab === t.key && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full" style={{ background: "#C8956C" }} />
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="px-4">
        {loading && (
          <div className="flex justify-center py-12">
            <Loader2 className="animate-spin" style={{ width: 24, height: 24, color: "#C8956C" }} />
          </div>
        )}

        {!loading && tab === "cooks" && (
          <div className="space-y-4">
            {(cooks ?? []).length === 0 ? (
              <p className="text-sm py-8 text-center" style={{ color: "#5A3A24" }}>No cooks shared yet.</p>
            ) : (
              (cooks ?? []).map((post) => (
                <CookPostCard key={post.id} post={post} currentUserId={currentUserId} />
              ))
            )}
          </div>
        )}

        {!loading && tab === "recipes" && (
          <div className="grid grid-cols-2 gap-3">
            {(recipes ?? []).length === 0 ? (
              <p className="text-sm py-8 text-center col-span-2" style={{ color: "#5A3A24" }}>No published recipes yet.</p>
            ) : (
              (recipes ?? []).map((recipe) => (
                <RecipeCard key={recipe.id} recipe={recipe} />
              ))
            )}
          </div>
        )}

        {!loading && tab === "cookbooks" && (
          <div className="space-y-3">
            {(cookbooks ?? []).length === 0 ? (
              <p className="text-sm py-8 text-center" style={{ color: "#5A3A24" }}>No published cookbooks yet.</p>
            ) : (
              (cookbooks ?? []).map((cb) => (
                <a
                  key={cb.id}
                  href={`/cookbooks/${cb.slug}`}
                  className="flex items-center gap-3 rounded-2xl p-3"
                  style={{ background: "#1A100A", border: "1px solid rgba(180,120,60,0.15)" }}
                >
                  <div className="w-12 h-14 rounded-lg flex-shrink-0" style={{ background: cb.theme_color ?? "#2A1808" }} />
                  <div>
                    <p className="text-sm font-semibold" style={{ color: "#EFE3CE" }}>{cb.title}</p>
                    {cb.tagline && <p className="text-xs mt-0.5" style={{ color: "#8A6A4A" }}>{cb.tagline}</p>}
                    {cb.price > 0 && <p className="text-xs mt-1 font-semibold" style={{ color: "#C8956C" }}>${cb.price}</p>}
                  </div>
                </a>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
