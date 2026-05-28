import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const ALLOWED_STATUS = new Set([
  "planning",
  "active",
  "completed",
  "draft",
  "woven",
  "cooking",
  "archived",
]);

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: plan } = await supabase.from("meal_plans").select("user_id").eq("id", id).single();
  if (!plan || plan.user_id !== user.id) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await supabase.from("meal_plan_entries").delete().eq("plan_id", id);
  await supabase.from("meal_plans").delete().eq("id", id);
  return NextResponse.json({ deleted: true });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: plan } = await supabase.from("meal_plans").select("user_id").eq("id", id).single();
  if (!plan || plan.user_id !== user.id) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  const update: Record<string, unknown> = {};

  if ("is_public" in body) update.is_public = body.is_public;
  if ("title" in body) update.title = body.title;
  if ("status" in body) {
    if (typeof body.status !== "string" || !ALLOWED_STATUS.has(body.status)) {
      return NextResponse.json({ error: "invalid status" }, { status: 400 });
    }
    update.status = body.status;
  }
  if ("pinboard_filters" in body) {
    if (
      body.pinboard_filters === null ||
      typeof body.pinboard_filters !== "object" ||
      Array.isArray(body.pinboard_filters)
    ) {
      return NextResponse.json(
        { error: "pinboard_filters must be an object" },
        { status: 400 },
      );
    }
    update.pinboard_filters = body.pinboard_filters;
  }

  if (body.person_count !== undefined) update.person_count = Math.max(1, Number(body.person_count));
  if (body.track_intake !== undefined) update.track_intake = Boolean(body.track_intake);

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: "nothing to update" }, { status: 400 });
  }
  update.updated_at = new Date().toISOString();

  const { data, error } = await supabase.from("meal_plans").update(update).eq("id", id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
