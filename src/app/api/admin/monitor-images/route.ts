import { NextRequest, NextResponse } from "next/server";
import { runImageMonitor } from "@/lib/image-monitor";

export async function GET(req: NextRequest) {
  const secret = process.env.MONITOR_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "MONITOR_SECRET not configured" }, { status: 500 });
  }

  const auth = req.headers.get("authorization") ?? "";
  if (auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    return NextResponse.json({ error: "Supabase credentials missing" }, { status: 500 });
  }

  const dryRun = req.nextUrl.searchParams.get("dry_run") === "1";
  const limit = parseInt(req.nextUrl.searchParams.get("limit") ?? "0", 10);

  try {
    const report = await runImageMonitor({ supabaseUrl: url, supabaseKey: key, dryRun, limit });
    return NextResponse.json(report);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
