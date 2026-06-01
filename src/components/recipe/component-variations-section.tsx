import { createClient } from "@/lib/supabase/server";
import { ComponentVariationCard } from "./component-variation-card";

interface Props {
  canonicalId: string;
}

export async function ComponentVariationsSection({ canonicalId }: Props) {
  const supabase = await createClient();

  const { data: variations } = await supabase
    .from("recipes")
    .select(
      "id, title, variation_notes, variation_type, variation_overrides, ingredients, source, creator_approved"
    )
    .eq("is_component", true)
    .eq("is_variation", true)
    .eq("parent_id", canonicalId)
    .order("source", { ascending: false })
    .order("title");

  if (!variations || variations.length === 0) return null;

  const curated = variations.filter((v) => v.source === "curated");
  const community = variations.filter((v) => v.source !== "curated");

  return (
    <div className="px-6 lg:px-10 py-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <span className="text-lg">🔀</span>
          <h2 className="font-semibold text-base" style={{ color: "#e2c9a8" }}>
            Variations
          </h2>
          <span
            className="text-xs font-bold px-2 py-0.5 rounded-full"
            style={{ background: "rgba(232,124,62,0.15)", color: "#e87c3e" }}
          >
            {variations.length}
          </span>
        </div>
      </div>

      {/* Curated variations */}
      {curated.length > 0 && (
        <div className="mb-6">
          {curated.length > 0 && community.length > 0 && (
            <p className="text-[11px] font-bold uppercase tracking-widest mb-3" style={{ color: "rgba(226,201,168,0.45)" }}>
              Curated
            </p>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {curated.map((v) => (
              <ComponentVariationCard key={v.id} variation={v as Parameters<typeof ComponentVariationCard>[0]['variation']} />
            ))}
          </div>
        </div>
      )}

      {/* Community variations */}
      {community.length > 0 && (
        <div>
          {curated.length > 0 && (
            <p className="text-[11px] font-bold uppercase tracking-widest mb-3" style={{ color: "rgba(226,201,168,0.45)" }}>
              Community
            </p>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {community.map((v) => (
              <ComponentVariationCard key={v.id} variation={v as Parameters<typeof ComponentVariationCard>[0]['variation']} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
