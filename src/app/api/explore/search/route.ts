import { NextRequest, NextResponse } from "next/server";
import type { ExternalRecipe } from "@/lib/external-sources/adapters";
import { fetchTheMealDB, fetchSpoonacular } from "@/lib/external-sources/adapters";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const source = searchParams.get("source") ?? "themealdb";
  const query  = searchParams.get("q")?.trim() ?? "";

  if (!query) return NextResponse.json({ recipes: [] });

  let recipes: ExternalRecipe[] = [];
  if (source === "themealdb")   recipes = await fetchTheMealDB(query);
  else if (source === "spoonacular") recipes = await fetchSpoonacular(query);

  return NextResponse.json({ recipes });
}
