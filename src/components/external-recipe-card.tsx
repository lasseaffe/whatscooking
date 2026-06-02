import Link from "next/link";
import { Clock } from "lucide-react";
import type { ExternalRecipe } from "@/lib/external-sources/adapters";

const SOURCE_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  themealdb:   { bg: "#0D9488", text: "#fff", label: "TheMealDB" },
  spoonacular: { bg: "#EA580C", text: "#fff", label: "Spoonacular" },
  flavordb:    { bg: "#7C3AED", text: "#fff", label: "FlavorDB" },
};

interface ExternalRecipeCardProps {
  recipe: ExternalRecipe;
}

export function ExternalRecipeCard({ recipe }: ExternalRecipeCardProps) {
  const src = SOURCE_COLORS[recipe.source] ?? SOURCE_COLORS.themealdb;
  const totalTime = (recipe.prepTime ?? 0) + (recipe.cookTime ?? 0);

  return (
    <div className="rounded-2xl overflow-hidden border flex flex-col" style={{ background: "#FBF6EE", borderColor: "#F0E8DC" }}>
      <Link href={`/explore/${recipe.source}/${recipe.externalId}`} className="block relative" style={{ height: 180 }}>
        {recipe.imageUrl ? (
          <img src={recipe.imageUrl} alt={recipe.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full" style={{ background: "#F0E8DC" }} />
        )}
        <span
          className="absolute top-2 right-2 text-xs font-semibold px-2 py-0.5 rounded-full"
          style={{ background: src.bg, color: src.text }}
        >
          {src.label}
        </span>
        {totalTime > 0 && (
          <span className="absolute bottom-2 left-2 flex items-center gap-1 text-xs font-medium text-white bg-black/50 px-2 py-0.5 rounded-full">
            <Clock className="w-3 h-3" /> {totalTime} min
          </span>
        )}
      </Link>

      <div className="p-3 flex flex-col flex-1">
        <Link href={`/explore/${recipe.source}/${recipe.externalId}`}>
          <h3
            className="text-sm font-semibold leading-snug mb-1 line-clamp-2 hover:underline"
            style={{ color: "#3D2817", fontFamily: "'Libre Baskerville', Georgia, serif" }}
          >
            {recipe.title}
          </h3>
        </Link>
        {recipe.cuisineType && (
          <p className="text-xs mb-2" style={{ color: "#A69180" }}>{recipe.cuisineType}</p>
        )}
        <div className="mt-auto">
          <Link
            href={`/explore/${recipe.source}/${recipe.externalId}`}
            className="block w-full text-xs font-semibold py-1.5 rounded-full text-center"
            style={{ background: "#C8522A18", color: "#C8522A", border: "1px solid #C8522A40" }}
          >
            View Recipe
          </Link>
        </div>
      </div>
    </div>
  );
}
