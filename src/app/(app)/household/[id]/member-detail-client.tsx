"use client";

import { useState } from "react";
import Link from "next/link";
import type { HouseholdMember, MemberIngredientPreference, MemberFilterStrictness, IngredientSentiment } from "@/lib/types";

type Reaction = {
  id: string;
  rating: 1 | 2 | 3;
  notes: string | null;
  cooked_at: string;
  recipe: { id: string; title: string; image_url: string | null } | null;
};

const STRICTNESS_OPTIONS: { value: MemberFilterStrictness; label: string }[] = [
  { value: "allergy", label: "Allergy (hard filter)" },
  { value: "dislike", label: "Dislikes (−4 per match)" },
  { value: "soft",    label: "Soft preference (−1 per match)" },
];

const SENTIMENT_EMOJI: Record<IngredientSentiment, string> = {
  dislike: "👎",
  avoid:   "🚫",
  love:    "❤️",
};

const RATING_EMOJI: Record<number, string> = { 1: "😞", 2: "😐", 3: "😋" };

export function MemberDetailClient({
  member,
  initialPreferences,
  initialReactions,
}: {
  member: HouseholdMember;
  initialPreferences: MemberIngredientPreference[];
  initialReactions: Reaction[];
}) {
  const [strictness, setStrictness] = useState<MemberFilterStrictness>(member.filter_strictness);
  const [preferences, setPreferences] = useState(initialPreferences);
  const [newIngredient, setNewIngredient] = useState("");
  const [newSentiment, setNewSentiment] = useState<IngredientSentiment>("dislike");
  const [addingPref, setAddingPref] = useState(false);

  async function updateStrictness(value: MemberFilterStrictness) {
    setStrictness(value);
    await fetch(`/api/household/members/${member.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ filter_strictness: value }),
    });
  }

  async function addPreference() {
    if (!newIngredient.trim()) return;
    setAddingPref(true);
    const res = await fetch("/api/household/preferences", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ member_id: member.id, ingredient_text: newIngredient.trim(), sentiment: newSentiment }),
    });
    const json = await res.json();
    if (json.preference) {
      setPreferences((prev) => [json.preference, ...prev]);
      setNewIngredient("");
    }
    setAddingPref(false);
  }

  async function removePref(id: string) {
    await fetch(`/api/household/preferences?id=${id}`, { method: "DELETE" });
    setPreferences((prev) => prev.filter((p) => p.id !== id));
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-8 space-y-8">
      <div className="flex items-center gap-3">
        <Link href="/household" className="text-sm" style={{ color: "#6B4E36" }}>← Household</Link>
      </div>

      <div className="flex items-center gap-4">
        <span className="text-5xl">{member.avatar_emoji}</span>
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "#EFE3CE" }}>{member.display_name}</h1>
          {member.linked_user_id && <p className="text-sm" style={{ color: "#828E6F" }}>🔗 Account linked</p>}
        </div>
      </div>

      {/* Strictness */}
      <div className="rounded-2xl border p-4 space-y-2" style={{ borderColor: "#3A2416", background: "#1C1209" }}>
        <p className="text-sm font-semibold" style={{ color: "#EFE3CE" }}>Filter strictness</p>
        <div className="flex flex-col gap-2">
          {STRICTNESS_OPTIONS.map(({ value, label }) => (
            <button key={value} onClick={() => updateStrictness(value)}
              className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-left"
              style={{ background: strictness === value ? "#2A1808" : "transparent", border: `1px solid ${strictness === value ? "#C8522A" : "#3A2416"}`, color: strictness === value ? "#C8522A" : "#8A6A4A" }}>
              <span className="w-3 h-3 rounded-full border-2 flex-shrink-0" style={{ borderColor: strictness === value ? "#C8522A" : "#3A2416", background: strictness === value ? "#C8522A" : "transparent" }} />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Ingredient preferences */}
      <div className="space-y-3">
        <h2 className="font-semibold" style={{ color: "#EFE3CE" }}>Ingredient preferences</h2>

        <div className="flex gap-2">
          <input value={newIngredient} onChange={(e) => setNewIngredient(e.target.value)}
            placeholder="e.g. broccoli" onKeyDown={(e) => e.key === "Enter" && addPreference()}
            className="flex-1 px-3 py-2 rounded-xl text-sm outline-none"
            style={{ background: "#161009", border: "1px solid #3A2416", color: "#EFE3CE" }} />
          <select value={newSentiment} onChange={(e) => setNewSentiment(e.target.value as IngredientSentiment)}
            className="px-2 py-2 rounded-xl text-sm"
            style={{ background: "#161009", border: "1px solid #3A2416", color: "#EFE3CE" }}>
            <option value="dislike">👎 Dislike</option>
            <option value="avoid">🚫 Avoid</option>
            <option value="love">❤️ Love</option>
          </select>
          <button onClick={addPreference} disabled={addingPref || !newIngredient.trim()}
            className="px-3 py-2 rounded-xl text-sm font-semibold disabled:opacity-50"
            style={{ background: "#C8522A", color: "#fff" }}>
            Add
          </button>
        </div>

        <div className="flex flex-col gap-2">
          {preferences.length === 0 && (
            <p className="text-sm py-4 text-center" style={{ color: "#6B4E36" }}>No preferences recorded yet.</p>
          )}
          {preferences.map((p) => (
            <div key={p.id} className="flex items-center gap-2 px-3 py-2 rounded-xl" style={{ background: "#1C1209", border: "1px solid #3A2416" }}>
              <span className="text-sm">{SENTIMENT_EMOJI[p.sentiment]}</span>
              <span className="text-sm flex-1" style={{ color: "#EFE3CE" }}>{p.ingredient_text}</span>
              {p.source === "inferred" && (
                <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "#2A1808", color: "#C8A030" }}>auto</span>
              )}
              <button onClick={() => removePref(p.id)} className="text-xs" style={{ color: "#6B4E36" }}>✕</button>
            </div>
          ))}
        </div>
      </div>

      {/* Recent reactions */}
      <div className="space-y-3">
        <h2 className="font-semibold" style={{ color: "#EFE3CE" }}>Recent meals</h2>
        {initialReactions.length === 0 && (
          <p className="text-sm py-4 text-center" style={{ color: "#6B4E36" }}>No meal reactions yet.</p>
        )}
        <div className="flex flex-col gap-2">
          {initialReactions.map((r) => (
            <div key={r.id} className="flex items-center gap-3 px-3 py-2 rounded-xl" style={{ background: "#1C1209", border: "1px solid #3A2416" }}>
              <span className="text-xl">{RATING_EMOJI[r.rating]}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate" style={{ color: "#EFE3CE" }}>{r.recipe?.title ?? "Unknown recipe"}</p>
                {r.notes && <p className="text-xs" style={{ color: "#6B4E36" }}>{r.notes}</p>}
              </div>
              <span className="text-xs" style={{ color: "#6B4E36" }}>{new Date(r.cooked_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
