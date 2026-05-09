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
            <span className="rc-card__badge absolute bottom-4 left-4 font-medium px-3 py-1.5 rounded-full"
              style={{ background: "rgba(13,9,7,0.82)", color: "var(--rc-title, #EFE3CE)", backdropFilter: "blur(4px)" }}>
              {recipe.cuisine_type}
            </span>
          )}
          {recipe.source_url && (
            <a href={recipe.source_url} target="_blank" rel="noopener noreferrer"
              className="rc-card__badge absolute top-4 right-4 flex items-center gap-1 px-3 py-1.5 rounded-lg"
              style={{ background: "rgba(13,9,7,0.78)", color: "var(--rc-meta, #A08060)", backdropFilter: "blur(4px)" }}>
              <ExternalLink className="w-3 h-3" /> View original
            </a>
          )}
        </div>
      )}

      {/* Title */}
      <div className="mb-4">
        <div className="flex items-start justify-between gap-4 mb-2">
          <h1 className="font-bold leading-snug" style={{ color: "var(--rc-title, #EFE3CE)", fontFamily: "'Libre Baskerville', Georgia, serif" }}>{recipe.title}</h1>
          {recipe.servings && (
            <div className="flex items-center gap-1.5 shrink-0 px-3 py-1.5 rounded-full font-medium"
              style={{ background: "var(--rc-badge-bg, #2A1808)", color: "var(--rc-accent-alt, #E85D20)", fontSize: "var(--wc-text-sm, 0.8rem)" }}>
              <Users className="w-3.5 h-3.5" />
              {recipe.servings} serves
            </div>
          )}
        </div>
        {recipe.description && (
          <p className="wc-text-sm leading-relaxed" style={{ color: "var(--rc-sub, #6B4E36)", lineHeight: "1.7" }}>{recipe.description}</p>
        )}
      </div>

      {/* Time */}
      {totalTime > 0 && (
        <div className="flex items-center gap-4 mb-5 wc-text-sm" style={{ color: "var(--rc-sub, #6B4E36)" }}>
          {recipe.prep_time_minutes && <span>Prep {recipe.prep_time_minutes}m</span>}
          {recipe.cook_time_minutes && <span>Cook {recipe.cook_time_minutes}m</span>}
          {totalTime > 0 && <span className="font-semibold" style={{ color: "var(--rc-title, #EFE3CE)" }}>Total {totalTime}m</span>}
        </div>
      )}

      {/* Nutrition */}
      {(recipe.calories || recipe.protein_g || recipe.carbs_g || recipe.fat_g) && (
        <div className="rounded-2xl flex flex-wrap gap-3 mb-6"
          style={{ background: "var(--rc-bg, #1F1B19)", border: "1px solid var(--rc-rim, #3A3430)", padding: "var(--wc-space-2, 1rem)" }}>
          {recipe.calories && (
            <div className="wc-nutrition-chip flex items-center gap-2">
              <Flame className="w-4 h-4" style={{ color: "var(--rc-accent-alt, #E85D20)" }} />
              {recipe.calories} kcal
            </div>
          )}
          {recipe.protein_g && (
            <div className="wc-nutrition-chip flex items-center gap-2">
              <Dumbbell className="w-4 h-4" style={{ color: "#828E6F" }} />
              {recipe.protein_g}g protein
            </div>
          )}
          {recipe.carbs_g && (
            <div className="wc-nutrition-chip flex items-center gap-2">
              <span className="wc-text-xs font-bold px-1.5 py-0.5 rounded"
                style={{ background: "var(--rc-badge-bg, #2A1808)", color: "var(--rc-accent, #F4A261)" }}>C</span>
              {recipe.carbs_g}g carbs
            </div>
          )}
          {recipe.fat_g && (
            <div className="wc-nutrition-chip flex items-center gap-2">
              <span className="wc-text-xs font-bold px-1.5 py-0.5 rounded"
                style={{ background: "var(--rc-badge-bg, #2A1808)", color: "var(--rc-accent, #F4A261)" }}>F</span>
              {recipe.fat_g}g fat
            </div>
          )}
        </div>
      )}

      {/* Dietary tags */}
      {(recipe.dietary_tags ?? []).length > 0 && (
        <div className="flex flex-wrap gap-2 mb-6">
          {(recipe.dietary_tags as string[]).map((tag) => (
            <span key={tag} className="rc-card__badge">{tag}</span>
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
              <h2 className="font-bold mb-3" style={{ color: "var(--rc-title, #EFE3CE)", fontFamily: "'Libre Baskerville', Georgia, serif" }}>Ingredients</h2>
              <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid var(--rc-rim, #3A3430)" }}>
                {ingredients.map((ing, i) => (
                  <div key={i} className="wc-ingredient-row flex items-center gap-3 wc-text-sm">
                    <span className="text-lg w-7 text-center">{getIngredientEmoji(ing.name)}</span>
                    <span className="flex-1 font-medium" style={{ color: "var(--rc-title, #EFE3CE)" }}>{ing.name}</span>
                    {(ing.amount || ing.unit) && (
                      <span style={{ color: "var(--rc-sub, #6B4E36)" }}>{ing.amount} {ing.unit}</span>
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
