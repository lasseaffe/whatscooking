import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function POST() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const secret = process.env.MONITOR_SECRET;
  if (!secret) return NextResponse.json({ error: "MONITOR_SECRET not set" }, { status: 500 });

  const res = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3002"}/api/admin/playwright-fix`, {
    method: "POST",
    headers: { Authorization: `Bearer ${secret}` },
  });

  const body = await res.json();
  return NextResponse.json(body, { status: res.status });
}
