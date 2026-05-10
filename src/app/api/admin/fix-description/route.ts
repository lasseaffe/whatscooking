import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  // Auth check — must be a logged-in user (admin-only route)
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const recipeId = req.nextUrl.searchParams.get("recipeId");
  if (!recipeId) return NextResponse.json({ error: "Missing recipeId" }, { status: 400 });

  // Sanitize: recipeId must be alphanumeric + hyphens/underscores only — prevents path traversal
  if (!/^[a-zA-Z0-9_-]+$/.test(recipeId)) {
    return NextResponse.json({ error: "Invalid recipeId" }, { status: 400 });
  }

  const filePath = path.join(process.cwd(), "pending-fixes", recipeId, "description.txt");
  try {
    const content = await readFile(filePath, "utf-8");
    return NextResponse.json({ content });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}
