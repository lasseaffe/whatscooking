import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import path from "path";
import { fixReport, type FixResult } from "@/lib/playwright-fixer";

export const runtime = "nodejs";

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function POST() {
  const supabase = getSupabase();

  const { data: reports, error } = await supabase
    .from("recipe_bug_reports")
    .select("id, recipe_id, issue_type, source_url")
    .is("resolved_at", null)
    .not("source_url", "is", null)
    .limit(20);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const publicDir = path.join(process.cwd(), "public");
  const results: FixResult[] = [];

  for (const report of reports ?? []) {
    if (!report.source_url) continue;

    const fixResult = await fixReport(
      {
        id: report.id,
        recipe_id: report.recipe_id ?? null,
        issue_type: report.issue_type ?? null,
        source_url: report.source_url,
      },
      publicDir
    );

    results.push(fixResult);

    if (!fixResult.fixed || !report.recipe_id) continue;

    // Apply data updates to the recipes table
    const recipeUpdate: Record<string, unknown> = {};
    const d = fixResult.data ?? {};

    if (d.imageUrl) recipeUpdate.image_url = d.imageUrl;
    if (d.name) recipeUpdate.title = d.name;
    if (d.description) recipeUpdate.description = d.description;
    if (d.ingredients) recipeUpdate.ingredients = d.ingredients;
    if (d.instructions) recipeUpdate.instructions = d.instructions;

    if (Object.keys(recipeUpdate).length > 0) {
      await supabase
        .from("recipes")
        .update(recipeUpdate)
        .eq("id", report.recipe_id);
    }

    // Mark report resolved
    await supabase
      .from("recipe_bug_reports")
      .update({
        resolved_at: new Date().toISOString(),
        resolved_by: "playwright-auto",
        fix_status: "applied",
      })
      .eq("id", report.id);
  }

  return NextResponse.json({
    processed: results.length,
    fixed: results.filter((r) => r.fixed).length,
    failed: results.filter((r) => !r.fixed).length,
    results,
  });
}
