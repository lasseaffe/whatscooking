import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ENTITY_TYPES = ["recipe", "cookbook", "chapter"] as const;
type EntityType = (typeof ENTITY_TYPES)[number];

function isEntityType(v: unknown): v is EntityType {
  return typeof v === "string" && (ENTITY_TYPES as readonly string[]).includes(v);
}

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const entityType = searchParams.get("entityType");
  const entityId = searchParams.get("entityId");
  if (!isEntityType(entityType) || !entityId) {
    return NextResponse.json({ error: "entityType and entityId required" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("image_prefs")
    .select("image_url, x, y")
    .eq("entity_type", entityType)
    .eq("entity_id", entityId)
    .eq("user_id", user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ prefs: data ?? [] });
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (user.email !== process.env.ADMIN_EMAIL) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { entityType, entityId, imageUrl, x, y } = body ?? {};
  if (
    !isEntityType(entityType) ||
    typeof entityId !== "string" || !entityId ||
    typeof imageUrl !== "string" || !imageUrl ||
    typeof x !== "number" || typeof y !== "number"
  ) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const clampedX = Math.max(0, Math.min(100, x));
  const clampedY = Math.max(0, Math.min(100, y));

  const { error } = await supabase
    .from("image_prefs")
    .upsert(
      {
        user_id: user.id,
        entity_type: entityType,
        entity_id: entityId,
        image_url: imageUrl,
        x: clampedX,
        y: clampedY,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,entity_type,entity_id,image_url" }
    );

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
