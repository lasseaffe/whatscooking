import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ logged: false, logId: null });

  const { searchParams } = new URL(req.url);
  const recipe_id = searchParams.get("recipe_id");
  const date = searchParams.get("date"); // YYYY-MM-DD

  if (!recipe_id || !date) {
    return NextResponse.json({ logged: false, logId: null });
  }

  const dayStart = `${date}T00:00:00.000Z`;
  const dayEnd = `${date}T23:59:59.999Z`;

  const { data } = await supabase
    .from("cook_log")
    .select("id")
    .eq("user_id", user.id)
    .eq("recipe_id", recipe_id)
    .gte("cooked_at", dayStart)
    .lte("cooked_at", dayEnd)
    .limit(1)
    .maybeSingle();

  return NextResponse.json({ logged: !!data, logId: data?.id ?? null });
}
