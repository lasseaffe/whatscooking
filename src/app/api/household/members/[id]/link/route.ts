import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

// POST /api/household/members/[id]/link
// Body: { email } — sends an invite; when they sign up, they can link via PATCH
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { email } = await req.json().catch(() => ({}));
  if (!email) return NextResponse.json({ error: "email required" }, { status: 400 });

  // Check the member belongs to this owner
  const { data: member } = await supabase
    .from("household_members")
    .select("id")
    .eq("id", id)
    .eq("owner_user_id", user.id)
    .single();

  if (!member) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Admin lookup not available from server client — return invite instructions.
  // A full invite flow requires Supabase Auth email templates or a service-role client.
  return NextResponse.json({
    linked: false,
    message: "Ask them to create an account, then link manually from their profile.",
  });
}
