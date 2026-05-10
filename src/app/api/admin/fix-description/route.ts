import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const recipeId = req.nextUrl.searchParams.get("recipeId");
  if (!recipeId) return NextResponse.json({ error: "Missing recipeId" }, { status: 400 });

  const filePath = path.join(process.cwd(), "pending-fixes", recipeId, "description.txt");
  try {
    const content = await readFile(filePath, "utf-8");
    return NextResponse.json({ content });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}
