import { searchRecipes } from "@/lib/spoonacular";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const revalidate = 3600; // Cache for 1 hour

/**
 * GET /api/recipes/search
 * Search recipes with nutrition and diet filters
 *
 * Query params:
 * - query: recipe name/ingredient search
 * - cuisine: cuisine type
 * - diet: dietary filter (vegetarian, vegan, keto, etc)
 * - minCalories, maxCalories
 * - minProtein, maxProtein (grams)
 * - minCarbs, maxCarbs (grams)
 * - minFat, maxFat (grams)
 * - number: results per page (default 20)
 * - offset: pagination offset (default 0)
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    const query = searchParams.get("query") || undefined;
    const cuisine = searchParams.get("cuisine") || undefined;
    const diet = searchParams.get("diet") || undefined;
    const minCalories = searchParams.get("minCalories")
      ? parseInt(searchParams.get("minCalories")!)
      : undefined;
    const maxCalories = searchParams.get("maxCalories")
      ? parseInt(searchParams.get("maxCalories")!)
      : undefined;
    const minProtein = searchParams.get("minProtein")
      ? parseFloat(searchParams.get("minProtein")!)
      : undefined;
    const maxProtein = searchParams.get("maxProtein")
      ? parseFloat(searchParams.get("maxProtein")!)
      : undefined;
    const minCarbs = searchParams.get("minCarbs")
      ? parseFloat(searchParams.get("minCarbs")!)
      : undefined;
    const maxCarbs = searchParams.get("maxCarbs")
      ? parseFloat(searchParams.get("maxCarbs")!)
      : undefined;
    const minFat = searchParams.get("minFat")
      ? parseFloat(searchParams.get("minFat")!)
      : undefined;
    const maxFat = searchParams.get("maxFat")
      ? parseFloat(searchParams.get("maxFat")!)
      : undefined;
    const number = searchParams.get("number")
      ? parseInt(searchParams.get("number")!)
      : 20;
    const offset = searchParams.get("offset")
      ? parseInt(searchParams.get("offset")!)
      : 0;

    const result = await searchRecipes({
      query,
      cuisine,
      diet,
      minCalories,
      maxCalories,
      minProtein,
      maxProtein,
      minCarbs,
      maxCarbs,
      minFat,
      maxFat,
      number,
      offset,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("[recipes/search]", error);
    return NextResponse.json(
      { error: "Failed to search recipes" },
      { status: 500 }
    );
  }
}
