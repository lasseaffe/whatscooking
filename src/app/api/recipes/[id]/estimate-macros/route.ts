// src/app/api/recipes/[id]/estimate-macros/route.ts
export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 30;

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { estimateMacros, ESTIMATOR_VERSION } from "@/lib/macro-estimator";

export async function POST(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  const supabase = await createClient();

  const { data: r, error: readErr } = await supabase
    .from("recipes")
    .select("id, title, ingredients, servings, macros_estimated, estimator_version")
    .eq("id", id)
    .single();
  if (readErr || !r) {
    return NextResponse.json({ error: readErr?.message ?? "not found" }, { status: 404 });
  }

  if (r.macros_estimated && r.estimator_version === ESTIMATOR_VERSION) {
    return NextResponse.json({ skipped: true });
  }

  try {
    const macros = await estimateMacros({
      title: r.title as string,
      ingredients: r.ingredients,
      servings: r.servings as number | null,
    });

    const { error: updateErr } = await supabase
      .from("recipes")
      .update({
        ...macros,
        macros_estimated: true,
        macros_estimated_at: new Date().toISOString(),
        estimator_version: ESTIMATOR_VERSION,
      })
      .eq("id", id);

    if (updateErr) {
      return NextResponse.json({ error: updateErr.message }, { status: 500 });
    }
    return NextResponse.json({ ok: true, macros });
  } catch (e) {
    const message = e instanceof Error ? e.message : "estimator failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
