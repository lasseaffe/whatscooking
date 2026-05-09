import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

const VALID_TAGS = [
  "vegetarian", "vegan", "gluten-free", "dairy-free",
  "keto", "paleo", "low-carb", "high-protein", "halal", "kosher", "nut-free",
] as const;

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data } = await supabase
      .from("user_preferences")
      .select("household_dietary_tags")
      .eq("user_id", user.id)
      .maybeSingle();

    return NextResponse.json({ tags: data?.household_dietary_tags ?? [] });
  } catch (err) {
    console.error("[household-diets GET]", err);
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { tags } = await req.json() as { tags: string[] };
    const sanitised = (tags ?? []).filter((t): t is typeof VALID_TAGS[number] =>
      (VALID_TAGS as readonly string[]).includes(t)
    );

    const { error } = await supabase
      .from("user_preferences")
      .upsert(
        { user_id: user.id, household_dietary_tags: sanitised },
        { onConflict: "user_id" }
      );

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ tags: sanitised });
  } catch (err) {
    console.error("[household-diets POST]", err);
    return NextResponse.json({ error: "Failed to save" }, { status: 500 });
  }
}
