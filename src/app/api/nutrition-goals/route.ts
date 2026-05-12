// src/app/api/nutrition-goals/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getUserNutritionGoals } from "@/lib/nutrition-goals";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const goals = await getUserNutritionGoals(user.id);
  return NextResponse.json(goals);
}
