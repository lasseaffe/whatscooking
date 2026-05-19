import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const focal_x = typeof body?.focal_x === "number" ? Math.round(Math.min(100, Math.max(0, body.focal_x))) : null;
  const focal_y = typeof body?.focal_y === "number" ? Math.round(Math.min(100, Math.max(0, body.focal_y))) : null;

  if (focal_x === null || focal_y === null) {
    return NextResponse.json({ error: "focal_x and focal_y (0-100) are required" }, { status: 400 });
  }

  const { error } = await supabase
    .from("recipes")
    .update({ focal_x, focal_y })
    .eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ focal_x, focal_y });
}
