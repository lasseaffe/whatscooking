// src/app/(app)/cookbooks/cookbooks-client.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { CookbookCover } from "@/components/cookbook-cover";

type CookbookRow = {
  id: string; title: string; tagline: string | null; cover_image_url: string | null;
  theme_color: string; title_font: string; price: number; slug: string;
  view_count: number; created_at: string;
  profiles: { username: string | null; full_name: string | null; avatar_url: string | null } | null;
  cookbook_chapters: { id: string; cookbook_recipes: { id: string }[] }[];
};

const PRICE_OPTS = [{ label: "All", value: "all" }, { label: "Free", value: "free" }, { label: "Paid", value: "paid" }];
const SORT_OPTS  = [{ label: "Newest", value: "newest" }, { label: "Trending", value: "trending" }];

export function CookbooksClient({ initialCookbooks }: { initialCookbooks: CookbookRow[] }) {
  const [price, setPrice] = useState("all");
  const [sort, setSort] = useState("newest");

  const filtered = initialCookbooks
    .filter((c) => price === "all" || (price === "free" ? c.price === 0 : c.price > 0))
    .sort((a, b) => sort === "trending"
      ? b.view_count - a.view_count
      : new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

  function Pill({ opts, active, set }: { opts: { label: string; value: string }[]; active: string; set: (v: string) => void }) {
    return (
      <div className="flex gap-1 rounded-xl p-1" style={{ background: "#F5E6D3" }}>
        {opts.map((o) => (
          <button key={o.value} onClick={() => set(o.value)}
            className="px-3 py-1 rounded-lg text-sm font-medium transition-colors"
            style={{ background: active === o.value ? "#C85A2F" : "transparent", color: active === o.value ? "#fff" : "#3D2817" }}>
            {o.label}
          </button>
        ))}
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-wrap gap-2 mb-6">
        <Pill opts={PRICE_OPTS} active={price} set={setPrice} />
        <Pill opts={SORT_OPTS}  active={sort}  set={setSort} />
        <Link href="/cookbooks/new" className="ml-auto px-4 py-1.5 rounded-xl text-sm font-semibold text-white" style={{ background: "#C85A2F" }}>
          + New Cookbook
        </Link>
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-20 rounded-2xl border border-dashed" style={{ borderColor: "#F5E6D3" }}>
          <p className="text-sm" style={{ color: "#6B5B52" }}>No cookbooks yet. Be the first to create one!</p>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {filtered.map((cb) => {
          const recipeCount = cb.cookbook_chapters.reduce((s, ch) => s + ch.cookbook_recipes.length, 0);
          const creator = cb.profiles;
          return (
            <Link key={cb.id} href={`/cookbooks/${cb.slug}`} className="group block">
              <CookbookCover
                cookbook={cb}
                recipeCount={recipeCount}
                creatorName={creator?.username ?? creator?.full_name ?? null}
                creatorAvatar={creator?.avatar_url ?? null}
              />
            </Link>
          );
        })}
      </div>
    </>
  );
}
