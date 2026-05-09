"use client";

import { useState } from "react";
import type { HouseholdMember, MemberIngredientPreference } from "@/lib/types";

type FitStatus = "green" | "yellow" | "red";

function getMemberFit(
  member: HouseholdMember,
  prefs: MemberIngredientPreference[],
  recipeText: string
): { status: FitStatus; flaggedIngredients: string[] } {
  const lowerText = recipeText.toLowerCase();
  const flagged = prefs
    .filter((p) => lowerText.includes(p.ingredient_text.toLowerCase()))
    .map((p) => p.ingredient_text);

  if (flagged.length > 0) return { status: "red", flaggedIngredients: flagged };
  return { status: "green", flaggedIngredients: [] };
}

const FIT_COLORS: Record<FitStatus, string> = {
  green: "#828E6F",
  yellow: "#C8A030",
  red: "#DC2626",
};

export function FamilyFitBar({
  members,
  memberPrefs,
  recipeTitle,
  recipeDescription,
}: {
  members: HouseholdMember[];
  memberPrefs: Record<string, MemberIngredientPreference[]>;
  recipeTitle: string;
  recipeDescription: string;
}) {
  const [openMemberId, setOpenMemberId] = useState<string | null>(null);
  const recipeText = `${recipeTitle} ${recipeDescription}`;

  if (members.length === 0) return null;

  return (
    <div className="rounded-2xl border p-4" style={{ borderColor: "#3A2416", background: "#1C1209" }}>
      <p className="text-sm font-semibold mb-3" style={{ color: "#EFE3CE" }}>Family fit</p>
      <div className="flex gap-3 flex-wrap">
        {members.map((m) => {
          const { status, flaggedIngredients } = getMemberFit(m, memberPrefs[m.id] ?? [], recipeText);
          const isOpen = openMemberId === m.id;
          return (
            <div key={m.id} className="relative">
              <button
                onClick={() => setOpenMemberId(isOpen ? null : m.id)}
                className="flex flex-col items-center gap-1"
              >
                <span className="text-2xl">{m.avatar_emoji}</span>
                <span className="w-2 h-2 rounded-full" style={{ background: FIT_COLORS[status] }} />
                <span className="text-xs" style={{ color: "#8A6A4A" }}>{m.display_name}</span>
              </button>
              {isOpen && (
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-10 rounded-xl border p-3 min-w-36 shadow-lg"
                  style={{ background: "#1C1209", borderColor: "#3A2416" }}>
                  {flaggedIngredients.length === 0 ? (
                    <p className="text-xs" style={{ color: "#828E6F" }}>No conflicts ✓</p>
                  ) : (
                    <>
                      <p className="text-xs font-medium mb-1" style={{ color: "#DC2626" }}>Conflicts:</p>
                      {flaggedIngredients.map((ing) => (
                        <p key={ing} className="text-xs" style={{ color: "#EFE3CE" }}>• {ing}</p>
                      ))}
                    </>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
