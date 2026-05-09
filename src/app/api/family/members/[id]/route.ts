import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json() as { name?: string; date_of_birth?: string | null };

    const updates: { name?: string; date_of_birth?: string | null } = {};
    if (body.name !== undefined) updates.name = body.name;
    if (body.date_of_birth !== undefined) updates.date_of_birth = body.date_of_birth;

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 });
    }

    const { data: member, error } = await supabase
      .from("household_members")
      .update(updates)
      .eq("id", id)
      .eq("created_by", user.id)
      .select()
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return NextResponse.json({ error: "Member not found" }, { status: 404 });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    if (!member) return NextResponse.json({ error: "Member not found" }, { status: 404 });
    return NextResponse.json({ member });
  } catch (err) {
    console.error("[family/members PATCH]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { error, count } = await supabase
      .from("household_members")
      .delete({ count: "exact" })
      .eq("id", id)
      .eq("created_by", user.id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    if (count === 0) return NextResponse.json({ error: "Member not found" }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[family/members DELETE]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
