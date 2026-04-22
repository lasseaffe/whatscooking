import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data } = await supabase
      .from("calorie_goals")
      .select("*")
      .eq("user_id", user.id)
      .single();

    return NextResponse.json({ goal: data ?? null });
  } catch (error) {
    console.error("[calorie-goal GET]", error);
    return NextResponse.json({ error: "Failed to fetch goal" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { data, error } = await supabase
      .from("calorie_goals")
      .upsert({ user_id: user.id, ...body })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ goal: data });
  } catch (error) {
    console.error("[calorie-goal POST]", error);
    return NextResponse.json({ error: "Failed to save goal" }, { status: 500 });
  }
}
