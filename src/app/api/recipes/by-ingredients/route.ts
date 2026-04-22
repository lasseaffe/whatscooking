import { findByIngredients } from "@/lib/spoonacular";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const revalidate = 3600; // Cache for 1 hour

/**
 * GET /api/recipes/by-ingredients
 * Find recipes by pantry ingredients
 *
 * Query params:
 * - ingredients: comma-separated ingredient names (required)
 * - number: max results (default 10)
 * - ranking: 'maximizeUsedIngredients' | 'minimizeMissingIngredients' (default: maximize)
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    const ingredientsParam = searchParams.get("ingredients");
    if (!ingredientsParam) {
      return NextResponse.json(
        { error: "ingredients parameter is required" },
        { status: 400 }
      );
    }

    const ingredients = ingredientsParam
      .split(",")
      .map((i) => i.trim())
      .filter(Boolean);

    if (ingredients.length === 0) {
      return NextResponse.json(
        { error: "at least one ingredient is required" },
        { status: 400 }
      );
    }

    const number = searchParams.get("number")
      ? parseInt(searchParams.get("number")!)
      : 10;

    const ranking = (searchParams.get("ranking") as
      | "maximizeUsedIngredients"
      | "minimizeMissingIngredients") || "maximizeUsedIngredients";

    // ranking: 1 = maximise used ingredients, 2 = minimise missing
    const rankingNum = ranking === "minimizeMissingIngredients" ? 2 : 1;
    const result = await findByIngredients(ingredients, {
      number: Math.min(number, 100),
      ranking: rankingNum as 1 | 2,
    });

    return NextResponse.json({
      recipes: result,
      query: { ingredients, ranking, number },
    });
  } catch (error) {
    console.error("[recipes/by-ingredients]", error);
    return NextResponse.json(
      { error: "Failed to find recipes by ingredients" },
      { status: 500 }
    );
  }
}
