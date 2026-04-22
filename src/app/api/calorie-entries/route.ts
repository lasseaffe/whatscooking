import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const date = searchParams.get("date") ?? new Date().toISOString().split("T")[0];

    const { data } = await supabase
      .from("calorie_entries")
      .select("*")
      .eq("user_id", user.id)
      .eq("logged_at", date)
      .order("created_at", { ascending: true });

    return NextResponse.json({ entries: data ?? [] });
  } catch (error) {
    console.error("[calorie-entries GET]", error);
    return NextResponse.json({ error: "Failed to fetch entries" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    if (!body.description || !body.calories) {
      return NextResponse.json({ error: "description and calories required" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("calorie_entries")
      .insert({ user_id: user.id, ...body, logged_at: body.logged_at ?? new Date().toISOString().split("T")[0] })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ entry: data });
  } catch (error) {
    console.error("[calorie-entries POST]", error);
    return NextResponse.json({ error: "Failed to add entry" }, { status: 500 });
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

    await supabase.from("calorie_entries").delete().eq("id", id).eq("user_id", user.id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[calorie-entries DELETE]", error);
    return NextResponse.json({ error: "Failed to delete entry" }, { status: 500 });
  }
}
