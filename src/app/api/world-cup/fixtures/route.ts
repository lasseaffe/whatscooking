// src/app/api/world-cup/fixtures/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const todayOnly = searchParams.get("today") === "1";

  const supabase = await createClient();

  let query = supabase
    .from("wc_fixtures")
    .select("*")
    .order("match_date", { ascending: true });

  if (todayOnly) {
    const dayStart = new Date();
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date();
    dayEnd.setHours(23, 59, 59, 999);
    query = query
      .gte("match_date", dayStart.toISOString())
      .lte("match_date", dayEnd.toISOString());
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ fixtures: data ?? [] });
}
