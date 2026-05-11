import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function POST() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const secret = process.env.MONITOR_SECRET;
  if (!secret) return NextResponse.json({ error: "MONITOR_SECRET not set" }, { status: 500 });

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 60000);

  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3002"}/api/admin/playwright-fix`,
      { method: "POST", headers: { Authorization: `Bearer ${secret}` }, signal: controller.signal }
    );
    clearTimeout(timeout);

    let body: unknown;
    try {
      body = await res.json();
    } catch {
      return NextResponse.json({ error: "Invalid response from playwright-fix" }, { status: 502 });
    }

    return NextResponse.json(body, { status: res.status });
  } catch (err) {
    clearTimeout(timeout);
    const msg = err instanceof Error && err.name === "AbortError" ? "playwright-fix timed out" : "Request failed";
    return NextResponse.json({ error: msg }, { status: 504 });
  }
}
