import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") ?? "";
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "10"), 20);
  if (q.length < 2) return NextResponse.json([]);

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("recipes")
    .select("id, title, image_url, cuisine_type")
    .ilike("title", `%${q}%`)
    .limit(limit);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}
