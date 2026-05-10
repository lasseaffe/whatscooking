"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Baby, Loader2, RefreshCw } from "lucide-react";
import {
  type MilestoneKey,
  MILESTONE_KEYS,
  MILESTONE_LABELS,
  type HouseholdMember,
} from "@/lib/family-types";
import type { Recipe } from "@/lib/types";

// ── Styles ────────────────────────────────────────────────────

const selectStyle: React.CSSProperties = {
  background: "#0D0904",
  border: "1px solid #3A2416",
  borderRadius: 6,
  color: "#EFE3CE",
  padding: "6px 10px",
  fontSize: 13,
  outline: "none",
  colorScheme: "dark" as React.CSSProperties["colorScheme"],
  cursor: "pointer",
};

// ── Page ──────────────────────────────────────────────────────

export default function BabyRecipesPage() {
  const [stage, setStage] = useState<MilestoneKey | "">("");
  const [mealType, setMealType] = useState("");
  const [allergenFree, setAllergenFree] = useState(false);
  const [memberId, setMemberId] = useState("");
  const [members, setMembers] = useState<HouseholdMember[]>([]);
  const [membersLoaded, setMembersLoaded] = useState(false);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ── Fetch members when allergen-free is first enabled ────────

  useEffect(() => {
    if (!allergenFree || membersLoaded) return;
    fetch("/api/family/members")
      .then((r) => r.json())
      .then((data) => {
        const list: HouseholdMember[] = data.members ?? [];
        setMembers(list);
        if (list.length > 0) setMemberId(list[0].id);
        setMembersLoaded(true);
      })
      .catch(() => setMembersLoaded(true));
  }, [allergenFree, membersLoaded]);

  // ── Fetch recipes ────────────────────────────────────────────

  const fetchRecipes = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (stage) params.set("stage", stage);
      if (mealType) params.set("meal_type", mealType);
      if (allergenFree) {
        params.set("allergen_free", "true");
        if (memberId) params.set("member_id", memberId);
      }
      const url = `/api/family/baby-recipes${params.toString() ? `?${params}` : ""}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Failed to load recipes (${res.status})`);
      const data = await res.json();
      setRecipes(data.recipes ?? []);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Could not load baby recipes.");
    } finally {
      setLoading(false);
    }
  }, [stage, mealType, allergenFree, memberId]);

  useEffect(() => {
    fetchRecipes();
  }, [fetchRecipes]);

  // ── Handle allergen-free toggle ──────────────────────────────

  function handleAllergenFreeToggle(checked: boolean) {
    setAllergenFree(checked);
    if (!checked) setMemberId("");
  }

  const noMembers = allergenFree && membersLoaded && members.length === 0;

  // ── Render ───────────────────────────────────────────────────

  return (
    <div style={{ maxWidth: 720, margin: "0 auto", padding: "24px 16px 48px" }}>
      {/* Page header */}
      <div style={{ marginBottom: 20 }}>
        <h1
          style={{
            fontFamily: "'Libre Baskerville', Georgia, serif",
            color: "#EFE3CE",
            fontSize: 28,
            fontWeight: 700,
            margin: 0,
          }}
        >
          Baby Recipes
        </h1>
        <p style={{ color: "#8A6A4A", fontSize: 14, margin: "6px 0 0" }}>
          Stage-appropriate recipes for your growing little one
        </p>
      </div>

      {/* Filter bar */}
      <div
        style={{
          background: "#1A1008",
          border: "1px solid #3A2416",
          borderRadius: 10,
          padding: "12px 16px",
          marginBottom: 20,
          display: "flex",
          flexWrap: "wrap",
          gap: 12,
          alignItems: "center",
        }}
      >
        {/* Stage filter */}
        <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
          <label style={{ color: "#8A6A4A", fontSize: 11, fontWeight: 600 }}>
            Stage
          </label>
          <select
            value={stage}
            onChange={(e) => setStage(e.target.value as MilestoneKey | "")}
            style={selectStyle}
          >
            <option value="">All Stages</option>
            {MILESTONE_KEYS.map((k) => (
              <option key={k} value={k}>
                {MILESTONE_LABELS[k]}
              </option>
            ))}
          </select>
        </div>

        {/* Meal type filter */}
        <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
          <label style={{ color: "#8A6A4A", fontSize: 11, fontWeight: 600 }}>
            Meal Type
          </label>
          <select
            value={mealType}
            onChange={(e) => setMealType(e.target.value)}
            style={selectStyle}
          >
            <option value="">Any Type</option>
            <option value="breakfast">Breakfast</option>
            <option value="lunch">Lunch</option>
            <option value="dinner">Dinner</option>
            <option value="snack">Snack</option>
          </select>
        </div>

        {/* Allergen-free toggle */}
        <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
          <label style={{ color: "#8A6A4A", fontSize: 11, fontWeight: 600 }}>
            Allergens
          </label>
          <label
            title={noMembers ? "Add a family member first" : undefined}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              cursor: noMembers ? "not-allowed" : "pointer",
              opacity: noMembers ? 0.5 : 1,
            }}
          >
            <input
              type="checkbox"
              checked={allergenFree}
              disabled={noMembers}
              onChange={(e) => handleAllergenFreeToggle(e.target.checked)}
              style={{ accentColor: "#B07D56", cursor: "pointer" }}
            />
            <span style={{ color: "#EFE3CE", fontSize: 13 }}>
              Hide unintroduced allergens
            </span>
          </label>
        </div>

        {/* Member selector — only shown when allergen-free is on */}
        {allergenFree && members.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
            <label style={{ color: "#8A6A4A", fontSize: 11, fontWeight: 600 }}>
              For member
            </label>
            <select
              value={memberId}
              onChange={(e) => setMemberId(e.target.value)}
              style={selectStyle}
            >
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Loading state */}
      {loading && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 10,
            padding: "48px 0",
            color: "#8A6A4A",
            fontSize: 14,
          }}
        >
          <Loader2
            style={{ width: 20, height: 20, animation: "spin 1s linear infinite" }}
          />
          Finding baby-safe recipes…
        </div>
      )}

      {/* Error state */}
      {!loading && error && (
        <div
          style={{
            background: "#1A1008",
            border: "1px solid #5F3E2D",
            borderRadius: 12,
            padding: 24,
            textAlign: "center",
          }}
        >
          <p style={{ color: "#C0392B", fontSize: 14, margin: "0 0 14px" }}>
            {error}
          </p>
          <button
            onClick={fetchRecipes}
            style={{
              background: "#B07D56",
              border: "none",
              borderRadius: 8,
              color: "#1A1008",
              fontSize: 13,
              fontWeight: 700,
              padding: "8px 16px",
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <RefreshCw style={{ width: 13, height: 13 }} />
            Retry
          </button>
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && recipes.length === 0 && (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 14,
            padding: "48px 16px",
            textAlign: "center",
          }}
        >
          <div
            style={{
              width: 60,
              height: 60,
              borderRadius: 14,
              background: "linear-gradient(135deg, #B07D56, #5F3E2D)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Baby style={{ width: 26, height: 26, color: "#fff" }} />
          </div>
          <p
            style={{
              fontFamily: "'Libre Baskerville', Georgia, serif",
              color: "#EFE3CE",
              fontSize: 18,
              fontWeight: 700,
              margin: 0,
            }}
          >
            No baby recipes found for this stage
          </p>
          <p style={{ color: "#8A6A4A", fontSize: 14, margin: 0, maxWidth: 320 }}>
            Try a different stage or check back as we add more recipes.
          </p>
        </div>
      )}

      {/* Recipe grid */}
      {!loading && !error && recipes.length > 0 && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
            gap: 12,
          }}
        >
          {recipes.map((recipe) => (
            <Link
              key={recipe.id}
              href={`/discover/${recipe.id}`}
              style={{ textDecoration: "none" }}
            >
              <div
                style={{
                  background: "#1A1008",
                  border: "1px solid #3A2416",
                  borderRadius: 10,
                  padding: 16,
                  transition: "border-color 0.15s",
                  cursor: "pointer",
                }}
                onMouseEnter={(e) =>
                  ((e.currentTarget as HTMLDivElement).style.borderColor = "#B07D56")
                }
                onMouseLeave={(e) =>
                  ((e.currentTarget as HTMLDivElement).style.borderColor = "#3A2416")
                }
              >
                {/* Recipe image */}
                {recipe.image_url && (
                  <img
                    src={recipe.image_url}
                    alt={recipe.title}
                    style={{
                      width: "100%",
                      height: 140,
                      objectFit: "cover",
                      borderRadius: 8,
                      marginBottom: 10,
                      display: "block",
                    }}
                  />
                )}

                {/* Title */}
                <p
                  style={{
                    fontFamily: "'Libre Baskerville', Georgia, serif",
                    color: "#EFE3CE",
                    fontSize: 15,
                    fontWeight: 700,
                    margin: "0 0 8px",
                    lineHeight: 1.35,
                  }}
                >
                  {recipe.title}
                </p>

                {/* Baby stage badges */}
                {recipe.baby_stages && recipe.baby_stages.length > 0 && (
                  <div
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: 4,
                      marginBottom: 6,
                    }}
                  >
                    {recipe.baby_stages.map((s) => (
                      <span
                        key={s}
                        style={{
                          background: "#5F3E2D",
                          color: "#B07D56",
                          fontSize: 11,
                          fontWeight: 600,
                          padding: "2px 8px",
                          borderRadius: 20,
                          border: "1px solid #B07D56",
                        }}
                      >
                        {MILESTONE_LABELS[s]}
                      </span>
                    ))}
                  </div>
                )}

                {/* Allergen flags */}
                {recipe.allergen_flags && recipe.allergen_flags.length > 0 && (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                    {recipe.allergen_flags.map((flag) => (
                      <span
                        key={flag}
                        style={{
                          background: "#3A2416",
                          color: "#8A6A4A",
                          fontSize: 11,
                          fontWeight: 500,
                          padding: "2px 7px",
                          borderRadius: 20,
                          textTransform: "capitalize",
                        }}
                      >
                        {flag.replace("_", " ")}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Keyframe for spinner */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
