"use client";

import { useState } from "react";
import { Flame, Dumbbell, Users, ExternalLink } from "lucide-react";
import { PremiumExtract } from "./premium-extract";
import { InstructionsWithTips } from "./instructions-with-tips";

interface Ingredient { name: string; amount?: number | null; unit?: string | null }

interface RecipeData {
  id: string;
  title: string;
  description?: string | null;
  image_url?: string | null;
  source_url?: string | null;
  cuisine_type?: string | null;
  dietary_tags?: string[] | null;
  servings?: number | null;
  calories?: number | null;
  protein_g?: number | null;
  carbs_g?: number | null;
  fat_g?: number | null;
  prep_time_minutes?: number | null;
  cook_time_minutes?: number | null;
  ingredients?: Ingredient[];
  instructions?: string[];
}

function getIngredientEmoji(name: string): string {
  const lower = name.toLowerCase();
  const quick: [string, string][] = [
    ["tomato","🍅"],["chicken","🍗"],["beef","🥩"],["pork","🥩"],["fish","🐟"],
    ["salmon","🐟"],["shrimp","🦐"],["egg","🥚"],["milk","🥛"],["butter","🧈"],
    ["cheese","🧀"],["onion","🧅"],["garlic","🧄"],["carrot","🥕"],["potato","🥔"],
    ["rice","🍚"],["pasta","🍝"],["flour","🌾"],["sugar","🍬"],["salt","🧂"],
    ["pepper","🧂"],["oil","🫒"],["lemon","🍋"],["lime","🍋"],["orange","🍊"],
    ["basil","🌿"],["parsley","🌿"],["thyme","🌿"],["cumin","🌶️"],["paprika","🌶️"],
    ["chocolate","🍫"],["wine","🍷"],["broth","🫙"],["stock","🫙"],["honey","🍯"],
    ["mushroom","🍄"],["spinach","🥬"],["bean","🫘"],["avocado","🥑"],["corn","🌽"],
  ];
  for (const [key, emoji] of quick) { if (lower.includes(key)) return emoji; }
  return "🍽️";
}

export function PremiumRecipeView({ initialRecipe }: { initialRecipe: RecipeData }) {
  const [recipe, setRecipe] = useState<RecipeData>(initialRecipe);

  const hasFullRecipe = (recipe.instructions ?? []).length >= 2 && (recipe.ingredients ?? []).length >= 3;
  const isPremium = !hasFullRecipe;

  const ingredients = (recipe.ingredients ?? []) as Ingredient[];
  const instructions = (recipe.instructions ?? []) as string[];
  const totalTime = (recipe.prep_time_minutes ?? 0) + (recipe.cook_time_minutes ?? 0);

  function handleExtracted(extracted: Record<string, unknown>) {
    setRecipe((prev) => ({ ...prev, ...extracted }));
  }

  return (
    <div>
      {/* Image */}
      {recipe.image_url && (
        <div className="rounded-2xl overflow-hidden mb-6 relative" style={{ height: 300 }}>
          <img src={recipe.image_url} alt={recipe.title} className="w-full h-full object-cover" />
          <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.45) 0%, transparent 60%)" }} />
          {recipe.cuisine_type && (
            <span className="absolute bottom-4 left-4 text-xs font-medium px-3 py-1.5 rounded-full"
              style={{ background: "rgba(13,9,7,0.8)", color: "#EFE3CE", backdropFilter: "blur(4px)" }}>
              {recipe.cuisine_type}
            </span>
          )}
          {recipe.source_url && (
            <a href={recipe.source_url} target="_blank" rel="noopener noreferrer"
              className="absolute top-4 right-4 flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg"
              style={{ background: "rgba(13,9,7,0.75)", color: "#8A6A4A", backdropFilter: "blur(4px)" }}>
              <ExternalLink className="w-3 h-3" /> View original
            </a>
          )}
        </div>
      )}

      {/* Title */}
      <div className="mb-4">
        <div className="flex items-start justify-between gap-4 mb-2">
          <h1 className="text-2xl font-bold leading-snug" style={{ color: "#EFE3CE", fontFamily: "'Libre Baskerville', Georgia, serif" }}>{recipe.title}</h1>
          {recipe.servings && (
            <div className="flex items-center gap-1.5 shrink-0 px-3 py-1.5 rounded-full text-sm font-medium"
              style={{ background: "#2A1808", color: "#C8522A" }}>
              <Users className="w-3.5 h-3.5" />
              {recipe.servings} serves
            </div>
          )}
        </div>
        {recipe.description && (
          <p className="text-sm leading-relaxed" style={{ color: "#8A6A4A", lineHeight: "1.7" }}>{recipe.description}</p>
        )}
      </div>

      {/* Time */}
      {totalTime > 0 && (
        <div className="flex items-center gap-4 mb-5 text-sm" style={{ color: "#6B4E36" }}>
          {recipe.prep_time_minutes && <span>Prep {recipe.prep_time_minutes}m</span>}
          {recipe.cook_time_minutes && <span>Cook {recipe.cook_time_minutes}m</span>}
          {totalTime > 0 && <span className="font-medium" style={{ color: "#EFE3CE" }}>Total {totalTime}m</span>}
        </div>
      )}

      {/* Nutrition */}
      {(recipe.calories || recipe.protein_g || recipe.carbs_g || recipe.fat_g) && (
        <div className="rounded-2xl border px-4 py-3 mb-6 flex flex-wrap gap-4"
          style={{ borderColor: "#3A2416", background: "#1C1209" }}>
          {recipe.calories && (
            <div className="flex items-center gap-2">
              <Flame className="w-4 h-4" style={{ color: "#C8522A" }} />
              <span className="text-sm font-semibold" style={{ color: "#EFE3CE" }}>{recipe.calories} kcal</span>
            </div>
          )}
          {recipe.protein_g && (
            <div className="flex items-center gap-2">
              <Dumbbell className="w-4 h-4" style={{ color: "#828E6F" }} />
              <span className="text-sm font-semibold" style={{ color: "#EFE3CE" }}>{recipe.protein_g}g protein</span>
            </div>
          )}
          {recipe.carbs_g && (
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold px-1.5 py-0.5 rounded" style={{ background: "#2A1808", color: "#C8A030" }}>C</span>
              <span className="text-sm font-semibold" style={{ color: "#EFE3CE" }}>{recipe.carbs_g}g carbs</span>
            </div>
          )}
          {recipe.fat_g && (
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold px-1.5 py-0.5 rounded" style={{ background: "#2A1808", color: "#C8A030" }}>F</span>
              <span className="text-sm font-semibold" style={{ color: "#EFE3CE" }}>{recipe.fat_g}g fat</span>
            </div>
          )}
        </div>
      )}

      {/* Dietary tags */}
      {(recipe.dietary_tags ?? []).length > 0 && (
        <div className="flex flex-wrap gap-2 mb-6">
          {(recipe.dietary_tags as string[]).map((tag) => (
            <span key={tag} className="text-xs px-3 py-1 rounded-full font-medium"
              style={{ background: "#2A1808", color: "#8A6A4A" }}>{tag}</span>
          ))}
        </div>
      )}

      {/* Premium extraction prompt OR full recipe */}
      {isPremium ? (
        <PremiumExtract
          recipeId={recipe.id}
          title={recipe.title}
          sourceUrl={recipe.source_url ?? null}
          onExtracted={handleExtracted}
        />
      ) : (
        <>
          {/* Ingredients */}
          {ingredients.length > 0 && (
            <div className="mb-8">
              <h2 className="text-lg font-bold mb-3" style={{ color: "#EFE3CE", fontFamily: "'Libre Baskerville', Georgia, serif" }}>Ingredients</h2>
              <div className="rounded-2xl border overflow-hidden" style={{ borderColor: "#3A2416" }}>
                {ingredients.map((ing, i) => (
                  <div key={i} className="flex items-center gap-3 px-4 py-3 border-b last:border-b-0 text-sm"
                    style={{ borderColor: "#3A2416", background: i % 2 === 0 ? "#1C1209" : "#161009" }}>
                    <span className="text-lg w-7 text-center">{getIngredientEmoji(ing.name)}</span>
                    <span className="flex-1 font-medium" style={{ color: "#EFE3CE" }}>{ing.name}</span>
                    {(ing.amount || ing.unit) && (
                      <span className="text-sm" style={{ color: "#6B4E36" }}>{ing.amount} {ing.unit}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {instructions.length > 0 && (
            <InstructionsWithTips instructions={instructions} />
          )}
        </>
      )}
    </div>
  );
}
