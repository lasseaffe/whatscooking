import Link from "next/link";
import type { HeritageNotes } from "@/lib/types";

interface Props {
  notes: HeritageNotes | null | undefined;
  cuisineSlug: string;
  cuisineName: string;
}

export function RecipeHeritageSidebar({ notes, cuisineSlug, cuisineName }: Props) {
  if (!notes) return null;

  return (
    <div
      className="rounded-xl border p-4 h-fit"
      style={{ background: "#0d0b1e", borderColor: "#2d2b55" }}
    >
      <p
        className="text-xs font-bold tracking-widest mb-4"
        style={{ color: "#a78bfa" }}
      >
        HERITAGE NOTES
      </p>

      <div className="mb-4">
        <p
          className="text-xs font-semibold uppercase tracking-wider mb-1.5"
          style={{ color: "#f59e0b" }}
        >
          Origin Story
        </p>
        <p className="text-xs leading-relaxed" style={{ color: "#94a3b8" }}>
          {notes.originStory}
        </p>
      </div>

      <div className="h-px my-3" style={{ background: "#1e1b4b" }} />

      <div className="mb-4">
        <p
          className="text-xs font-semibold uppercase tracking-wider mb-1.5"
          style={{ color: "#f59e0b" }}
        >
          Cultural Occasion
        </p>
        <p className="text-xs leading-relaxed" style={{ color: "#94a3b8" }}>
          {notes.culturalOccasion}
        </p>
      </div>

      <div className="h-px my-3" style={{ background: "#1e1b4b" }} />

      <div className="mb-4">
        <p
          className="text-xs font-semibold uppercase tracking-wider mb-1.5"
          style={{ color: "#f59e0b" }}
        >
          Why This Ingredient Matters
        </p>
        <p className="text-xs leading-relaxed" style={{ color: "#94a3b8" }}>
          {notes.keyIngredientNote}
        </p>
      </div>

      <div className="h-px my-3" style={{ background: "#1e1b4b" }} />

      <Link
        href={`/cuisines/${cuisineSlug}`}
        className="text-xs hover:underline"
        style={{ color: "#a78bfa" }}
      >
        → Explore {cuisineName} Cuisine
      </Link>
    </div>
  );
}
