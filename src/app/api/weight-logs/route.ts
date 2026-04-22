import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get("limit") ?? "90");

    const { data } = await supabase
      .from("weight_logs")
      .select("id, weight_kg, note, logged_at")
      .eq("user_id", user.id)
      .order("logged_at", { ascending: true })
      .limit(limit);

    return NextResponse.json({ logs: data ?? [] });
  } catch (error) {
    console.error("[weight-logs GET]", error);
    return NextResponse.json({ error: "Failed to fetch logs" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { weight_kg, note, logged_at } = await req.json();
    if (!weight_kg) return NextResponse.json({ error: "weight_kg required" }, { status: 400 });

    const { data, error } = await supabase
      .from("weight_logs")
      .upsert({ user_id: user.id, weight_kg, note, logged_at: logged_at ?? new Date().toISOString().split("T")[0] },
        { onConflict: "user_id,logged_at" })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ log: data });
  } catch (error) {
    console.error("[weight-logs POST]", error);
    return NextResponse.json({ error: "Failed to log weight" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

    await supabase.from("weight_logs").delete().eq("id", id).eq("user_id", user.id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[weight-logs DELETE]", error);
    return NextResponse.json({ error: "Failed to delete log" }, { status: 500 });
  }
}
