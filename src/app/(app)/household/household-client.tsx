"use client";

import { useState } from "react";
import Link from "next/link";
import type { HouseholdMember, MemberAgeGroup, MemberFilterStrictness } from "@/lib/types";

const AGE_LABELS: Record<MemberAgeGroup, string> = {
  baby: "Baby",
  child: "Child",
  teen: "Teen",
  adult: "Adult",
};

const STRICTNESS_LABELS: Record<MemberFilterStrictness, { label: string; color: string }> = {
  allergy: { label: "Allergy", color: "#DC2626" },
  dislike: { label: "Dislikes", color: "#C8A030" },
  soft:    { label: "Soft pref", color: "#828E6F" },
};

const EMOJI_OPTIONS = ["🧑", "👶", "🧒", "👦", "👧", "🧑‍🍼", "👨", "👩", "🧓", "🐱", "🐶"];

export function HouseholdClient({ initialMembers }: { initialMembers: HouseholdMember[] }) {
  const [members, setMembers] = useState<HouseholdMember[]>(initialMembers);
  const [showAdd, setShowAdd] = useState(false);
  const [name, setName] = useState("");
  const [emoji, setEmoji] = useState("🧑");
  const [ageGroup, setAgeGroup] = useState<MemberAgeGroup>("adult");
  const [strictness, setStrictness] = useState<MemberFilterStrictness>("dislike");
  const [saving, setSaving] = useState(false);

  async function addMember() {
    if (!name.trim()) return;
    setSaving(true);
    const res = await fetch("/api/household/members", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ display_name: name, avatar_emoji: emoji, age_group: ageGroup, filter_strictness: strictness }),
    });
    const json = await res.json();
    if (json.member) {
      setMembers((prev) => [...prev, json.member]);
      setShowAdd(false);
      setName("");
      setEmoji("🧑");
      setAgeGroup("adult");
      setStrictness("dislike");
    }
    setSaving(false);
  }

  async function deleteMember(id: string) {
    await fetch(`/api/household/members/${id}`, { method: "DELETE" });
    setMembers((prev) => prev.filter((m) => m.id !== id));
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold" style={{ color: "#EFE3CE" }}>Household</h1>
        <button
          onClick={() => setShowAdd(true)}
          className="px-4 py-2 rounded-xl text-sm font-semibold"
          style={{ background: "#C8522A", color: "#fff" }}
        >
          + Add member
        </button>
      </div>

      {members.length === 0 && !showAdd && (
        <div className="rounded-2xl border p-8 text-center" style={{ borderColor: "#3A2416", background: "#1C1209" }}>
          <p className="text-3xl mb-2">🏠</p>
          <p className="font-medium mb-1" style={{ color: "#EFE3CE" }}>No household members yet</p>
          <p className="text-sm" style={{ color: "#6B4E36" }}>Add family members to track everyone&apos;s preferences and tailor meal suggestions.</p>
        </div>
      )}

      <div className="flex flex-col gap-3">
        {members.map((m) => {
          const s = STRICTNESS_LABELS[m.filter_strictness] ?? { label: m.filter_strictness ?? "Unknown", color: "#828E6F" };
          return (
            <div key={m.id} className="rounded-2xl border p-4 flex items-center gap-4" style={{ borderColor: "#3A2416", background: "#1C1209" }}>
              <span className="text-3xl">{m.avatar_emoji}</span>
              <div className="flex-1 min-w-0">
                <p className="font-semibold" style={{ color: "#EFE3CE" }}>{m.display_name}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs" style={{ color: "#6B4E36" }}>{AGE_LABELS[m.age_group] ?? m.age_group ?? "Unknown"}</span>
                  <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ color: s.color, background: "#1C1209", border: `1px solid ${s.color}` }}>{s.label}</span>
                  {m.linked_user_id && <span className="text-xs" style={{ color: "#828E6F" }}>🔗 Linked</span>}
                </div>
              </div>
              <div className="flex gap-2">
                <Link href={`/household/${m.id}`} className="px-3 py-1.5 rounded-lg text-xs font-medium" style={{ background: "#2A1808", color: "#C8A030" }}>
                  View
                </Link>
                <button onClick={() => deleteMember(m.id)} className="px-3 py-1.5 rounded-lg text-xs font-medium" style={{ background: "#2A1808", color: "#DC2626" }}>
                  Remove
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {showAdd && (
        <div className="rounded-2xl border p-5 space-y-4" style={{ borderColor: "#3A2416", background: "#1C1209" }}>
          <h2 className="font-semibold" style={{ color: "#EFE3CE" }}>Add household member</h2>

          <div>
            <label className="text-xs font-medium block mb-1" style={{ color: "#8A6A4A" }}>Name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Emma"
              className="w-full px-3 py-2 rounded-xl text-sm outline-none"
              style={{ background: "#161009", border: "1px solid #3A2416", color: "#EFE3CE" }} />
          </div>

          <div>
            <label className="text-xs font-medium block mb-1" style={{ color: "#8A6A4A" }}>Emoji</label>
            <div className="flex flex-wrap gap-2">
              {EMOJI_OPTIONS.map((e) => (
                <button key={e} onClick={() => setEmoji(e)}
                  className="text-2xl rounded-lg p-1.5 transition-all"
                  style={{ background: emoji === e ? "#2A1808" : "transparent", border: `1px solid ${emoji === e ? "#C8522A" : "#3A2416"}` }}>
                  {e}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-3">
            <div className="flex-1">
              <label className="text-xs font-medium block mb-1" style={{ color: "#8A6A4A" }}>Age group</label>
              <select value={ageGroup} onChange={(e) => setAgeGroup(e.target.value as MemberAgeGroup)}
                className="w-full px-3 py-2 rounded-xl text-sm"
                style={{ background: "#161009", border: "1px solid #3A2416", color: "#EFE3CE" }}>
                {(Object.keys(AGE_LABELS) as MemberAgeGroup[]).map((k) => (
                  <option key={k} value={k}>{AGE_LABELS[k]}</option>
                ))}
              </select>
            </div>
            <div className="flex-1">
              <label className="text-xs font-medium block mb-1" style={{ color: "#8A6A4A" }}>Strictness</label>
              <select value={strictness} onChange={(e) => setStrictness(e.target.value as MemberFilterStrictness)}
                className="w-full px-3 py-2 rounded-xl text-sm"
                style={{ background: "#161009", border: "1px solid #3A2416", color: "#EFE3CE" }}>
                {(Object.keys(STRICTNESS_LABELS) as MemberFilterStrictness[]).map((k) => (
                  <option key={k} value={k}>{STRICTNESS_LABELS[k].label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex gap-2 pt-1">
            <button onClick={() => setShowAdd(false)} className="flex-1 py-2 rounded-xl text-sm" style={{ background: "#2A1808", color: "#8A6A4A" }}>Cancel</button>
            <button onClick={addMember} disabled={saving || !name.trim()} className="flex-1 py-2 rounded-xl text-sm font-semibold disabled:opacity-50" style={{ background: "#C8522A", color: "#fff" }}>
              {saving ? "Adding…" : "Add"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
