import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: cookbook } = await supabase.from("cookbooks").select("id, price").eq("slug", slug).single();
  if (!cookbook) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (cookbook.price > 0) return NextResponse.json({ error: "Paid purchases not yet enabled" }, { status: 402 });

  const { data, error } = await supabase
    .from("cookbook_purchases")
    .upsert({ user_id: user.id, cookbook_id: cookbook.id, amount_paid: 0 }, { onConflict: "user_id,cookbook_id" })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
