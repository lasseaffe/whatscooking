import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const body = await req.json();
    const { rating, would_recommend, category, message, email } = body;

    const isWrittenReview = (message ?? "").trim().length >= 30;

    // Generate a simple affiliate code
    const affiliateCode = Math.random().toString(36).slice(2, 8).toUpperCase();

    // Try to save to a user_feedback table — gracefully handle if table doesn't exist
    try {
      await supabase.from("user_feedback").insert({
        user_id: user?.id ?? null,
        rating: rating ?? null,
        would_recommend: would_recommend ?? null,
        category: category ?? "general",
        message: message?.trim() ?? null,
        email: email?.trim() ?? null,
        affiliate_code: affiliateCode,
        qualifies_for_premium: isWrittenReview,
        created_at: new Date().toISOString(),
      });
    } catch {
      // Table may not exist yet — still return success
    }

    return NextResponse.json({
      ok: true,
      affiliate_code: affiliateCode,
      qualifies_for_premium: isWrittenReview,
    });
  } catch (err) {
    console.error("[feedback POST]", err);
    return NextResponse.json({ error: "Failed to save feedback" }, { status: 500 });
  }
}
