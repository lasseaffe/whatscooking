"use client";

import Link from "next/link";
import { Plus, Minus, ChevronRight } from "lucide-react";
import type { VariationType, VariationOverrides } from "@/lib/types";

interface Variation {
  id: string;
  title: string;
  variation_notes?: string | null;
  variation_type?: VariationType | null;
  variation_overrides?: VariationOverrides | null;
  ingredients?: Array<{ name: string; amount?: number; unit?: string }> | null;
  source?: string | null;
  creator_approved?: boolean | null;
}

const VARIATION_TYPE_LABEL: Record<VariationType, string> = {
  profile_swap: "Flavor profile",
  dietary:      "Dietary",
  regional:     "Regional",
  twist:        "Community twist",
};

const VARIATION_TYPE_COLOR: Record<VariationType, string> = {
  profile_swap: "#e87c3e",
  dietary:      "#4caf82",
  regional:     "#7c9cbf",
  twist:        "#a78bfa",
};

export function ComponentVariationCard({ variation }: { variation: Variation }) {
  const isQuickTwist = !!variation.variation_overrides && !variation.ingredients?.length;
  const isCurated = variation.source === "curated";
  const type = variation.variation_type;
  const overrides = variation.variation_overrides;

  return (
    <Link
      href={isQuickTwist ? "#" : `/recipes/${variation.id}`}
      className="group block rounded-xl border transition-all"
      style={{
        background: "rgba(42,24,8,0.45)",
        borderColor: "rgba(180,100,40,0.18)",
      }}
      onClick={isQuickTwist ? (e) => e.preventDefault() : undefined}
    >
      <div className="p-4">
        {/* Header row */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm leading-snug truncate" style={{ color: "#e2c9a8" }}>
              {variation.title}
            </p>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            {type && (
              <span
                className="text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded"
                style={{
                  background: `${VARIATION_TYPE_COLOR[type]}22`,
                  color: VARIATION_TYPE_COLOR[type],
                  border: `1px solid ${VARIATION_TYPE_COLOR[type]}44`,
                }}
              >
                {VARIATION_TYPE_LABEL[type]}
              </span>
            )}
            {isCurated && (
              <span className="text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded"
                style={{ background: "rgba(228,135,62,0.12)", color: "#e87c3e", border: "1px solid rgba(228,135,62,0.25)" }}>
                ✦ curated
              </span>
            )}
          </div>
        </div>

        {/* Description */}
        {variation.variation_notes && (
          <p className="text-xs mb-3 line-clamp-2" style={{ color: "rgba(226,201,168,0.65)" }}>
            {variation.variation_notes}
          </p>
        )}

        {/* Quick-twist diff chips */}
        {isQuickTwist && overrides && (
          <div className="flex flex-wrap gap-1.5 mb-2">
            {overrides.added_ingredients?.map((ing) => (
              <span
                key={ing.name}
                className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full"
                style={{ background: "rgba(76,175,130,0.15)", color: "#4caf82", border: "1px solid rgba(76,175,130,0.25)" }}
              >
                <Plus size={10} />
                {ing.name}
              </span>
            ))}
            {overrides.removed_ingredients?.map((name) => (
              <span
                key={name}
                className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full"
                style={{ background: "rgba(220,80,60,0.12)", color: "#e57373", border: "1px solid rgba(220,80,60,0.2)" }}
              >
                <Minus size={10} />
                {name}
              </span>
            ))}
          </div>
        )}

        {/* Step notes for quick twist */}
        {isQuickTwist && overrides?.step_notes && (
          <p className="text-[11px] italic" style={{ color: "rgba(226,201,168,0.5)" }}>
            {overrides.step_notes}
          </p>
        )}

        {/* Full recipe link */}
        {!isQuickTwist && (
          <div className="flex items-center gap-1 text-xs font-medium mt-1 group-hover:opacity-100 opacity-60 transition-opacity"
            style={{ color: "#e87c3e" }}>
            View full recipe <ChevronRight size={12} />
          </div>
        )}
      </div>
    </Link>
  );
}
