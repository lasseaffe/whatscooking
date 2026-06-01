// src/app/api/world-cup/menu/route.ts
// Build a single-evening matchday menu for a fixture (snacks + nation dishes).
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { buildMatchdayMenu } from "@/lib/wc2026-matchday-menu";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const home = searchParams.get("home")?.trim();
  const away = searchParams.get("away")?.trim();
  if (!home || !away) {
    return NextResponse.json({ error: "Missing home/away" }, { status: 400 });
  }

  const supabase = await createClient();
  const menu = await buildMatchdayMenu(supabase, home, away);
  if (!menu) return NextResponse.json({ error: "Unknown team code" }, { status: 404 });

  return NextResponse.json({ menu });
}
