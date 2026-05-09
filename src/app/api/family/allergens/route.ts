import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { ALLERGEN_KEYS, type AllergenKey } from "@/lib/family-types";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { member_id, allergen_key } = await req.json() as {
      member_id: string;
      allergen_key: AllergenKey;
    };

    if (!member_id || !ALLERGEN_KEYS.includes(allergen_key)) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("member_allergens")
      .upsert(
        { member_id, allergen_key, introduced_by: user.id },
        { onConflict: "member_id,allergen_key" }
      )
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ allergen: data }, { status: 201 });
  } catch (err) {
    console.error("[family/allergens POST]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { member_id, allergen_key } = await req.json() as {
      member_id: string;
      allergen_key: AllergenKey;
    };

    if (!member_id || !ALLERGEN_KEYS.includes(allergen_key)) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const { error } = await supabase
      .from("member_allergens")
      .delete()
      .eq("member_id", member_id)
      .eq("allergen_key", allergen_key);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[family/allergens DELETE]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
