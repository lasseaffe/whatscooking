"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { X, Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export type FeatureTag = { id: string; name: string; label: string };

interface TagInputProps {
  recipeId: string;
  initialTags: FeatureTag[];
}

export function TagInput({ recipeId, initialTags }: TagInputProps) {
  const [assigned, setAssigned] = useState<FeatureTag[]>(initialTags);
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<FeatureTag[]>([]);
  const [allTags, setAllTags] = useState<FeatureTag[]>([]);
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();

  useEffect(() => {
    supabase.from("wc_feature_tags").select("id, name, label").order("label")
      .then(({ data }) => setAllTags(data ?? []));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!query.trim()) { setSuggestions([]); return; }
    const assignedIds = new Set(assigned.map((t) => t.id));
    setSuggestions(
      allTags.filter(
        (t) => !assignedIds.has(t.id) && t.label.toLowerCase().includes(query.toLowerCase())
      ).slice(0, 8)
    );
  }, [query, allTags, assigned]);

  const assignTag = useCallback(async (tag: FeatureTag) => {
    setAssigned((prev) => [...prev, tag]);
    setQuery("");
    setSuggestions([]);
    setOpen(false);
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from("wc_recipe_feature_tags").insert({
      recipe_id: recipeId,
      tag_id: tag.id,
      assigned_by: user?.id,
      ai_assigned: false,
    });
  }, [recipeId, supabase]);

  const createAndAssign = useCallback(async () => {
    const label = query.trim();
    const name = label.toLowerCase().replace(/\s+/g, "-");
    if (!name) return;
    const { data: { user } } = await supabase.auth.getUser();
    const { data: tag, error } = await supabase
      .from("wc_feature_tags")
      .insert({ name, label, created_by: user?.id })
      .select("id, name, label")
      .single();
    if (error || !tag) return;
    setAllTags((prev) => [...prev, tag]);
    await assignTag(tag);
  }, [query, supabase, assignTag]);

  const removeTag = useCallback(async (tag: FeatureTag) => {
    setAssigned((prev) => prev.filter((t) => t.id !== tag.id));
    await supabase.from("wc_recipe_feature_tags")
      .delete()
      .eq("recipe_id", recipeId)
      .eq("tag_id", tag.id);
  }, [recipeId, supabase]);

  const exactMatch = allTags.find((t) => t.label.toLowerCase() === query.trim().toLowerCase());

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        {assigned.map((tag) => (
          <span key={tag.id} style={{
            display: "inline-flex", alignItems: "center", gap: 5,
            padding: "4px 10px", borderRadius: 99,
            fontSize: "0.72rem", fontWeight: 600,
            background: "rgba(176,125,86,0.15)",
            color: "#C8913A",
            border: "1px solid rgba(176,125,86,0.3)",
          }}>
            {tag.label}
            <button onClick={() => removeTag(tag)} style={{ display: "flex", alignItems: "center", background: "none", border: "none", cursor: "pointer", color: "#8A6A4A", padding: 0 }}>
              <X style={{ width: 10, height: 10 }} />
            </button>
          </span>
        ))}
      </div>

      <div style={{ position: "relative" }}>
        <div style={{ display: "flex", gap: 6 }}>
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
            onFocus={() => setOpen(true)}
            onBlur={() => setTimeout(() => setOpen(false), 150)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                if (suggestions.length > 0) assignTag(suggestions[0]);
                else if (query.trim()) createAndAssign();
              }
              if (e.key === "Escape") setOpen(false);
            }}
            placeholder="Add tag… (type to search or create)"
            style={{
              flex: 1, fontSize: "0.8rem", padding: "8px 12px",
              borderRadius: 10, background: "var(--wc-bg-card, #1C1209)",
              border: "1px solid var(--wc-border-default, #3A2416)",
              color: "var(--wc-text, #EFE3CE)", outline: "none",
            }}
          />
          {query.trim() && !exactMatch && (
            <button onClick={createAndAssign} title="Create new tag"
              style={{ display: "flex", alignItems: "center", gap: 5, padding: "8px 12px", borderRadius: 10, fontSize: "0.75rem", fontWeight: 600, background: "rgba(176,125,86,0.12)", border: "1px solid rgba(176,125,86,0.25)", color: "#B07D56", cursor: "pointer", whiteSpace: "nowrap" }}>
              <Plus style={{ width: 11, height: 11 }} /> Create &quot;{query.trim()}&quot;
            </button>
          )}
        </div>

        {open && suggestions.length > 0 && (
          <div style={{
            position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, zIndex: 100,
            background: "var(--wc-bg-base, #1A0E06)", border: "1px solid var(--wc-border-default, #3A2416)",
            borderRadius: 10, overflow: "hidden", boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
          }}>
            {suggestions.map((tag) => (
              <button key={tag.id} onMouseDown={() => assignTag(tag)} style={{
                display: "block", width: "100%", textAlign: "left",
                padding: "8px 14px", fontSize: "0.8rem", fontWeight: 500,
                color: "var(--wc-text-3, #9A7A58)", background: "none", border: "none", cursor: "pointer",
                transition: "background 0.1s ease",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "var(--wc-bg-hover)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
              >
                {tag.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
