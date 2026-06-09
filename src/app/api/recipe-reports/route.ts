import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir, appendFile } from "fs/promises";
import path from "path";
import { findImageForRecipe } from "@/lib/image-pipeline";

export const runtime = "nodejs";

const OUT_DIR = path.join(process.cwd(), "public", "recipe-images");
const FIXES_LOG = path.join(process.cwd(), "recipe-fixes.json");
const FIXES_DIR = path.join(process.cwd(), "fixes");
const PENDING_DIR = path.join(process.cwd(), "pending-fixes");

interface FixLogEntry {
  recipeId: string;
  recipeName: string | null;
  issueType: string;
  fixStatus: "applied" | "pending" | "pending_review" | null;
  fixFilePath: string | null;
  reportedAt: string;
  reportId: string;
}

async function persistFix(entry: FixLogEntry): Promise<void> {
  // 1. Append one JSON line to recipe-fixes.json (audit log — atomic append)
  await appendFile(FIXES_LOG, JSON.stringify(entry) + "\n");

  // 2. Upsert fixes/<recipeId>.json (latest fix per recipe)
  await mkdir(FIXES_DIR, { recursive: true });
  await writeFile(
    path.join(FIXES_DIR, `${entry.recipeId}.json`),
    JSON.stringify(entry, null, 2)
  );
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const formData = await req.formData();
    const recipeId   = formData.get("recipeId") as string | null;
    const recipeName = formData.get("recipeName") as string | null;
    const issueType  = formData.get("issueType") as string ?? "other";
    const description = formData.get("description") as string | null;
    const sourceUrl  = formData.get("sourceUrl") as string | null;
    const file       = formData.get("file") as File | null;

    let fixFilePath: string | null = null;
    let fixStatus: "applied" | "pending" | "pending_review" | null = null;
    let newImageUrl: string | null = null;

    if (issueType === "faulty_image" && file && recipeId) {
      // User-supplied image — save directly, skip pipeline
      const buffer = Buffer.from(await file.arrayBuffer());
      await mkdir(OUT_DIR, { recursive: true });
      const dest = path.join(OUT_DIR, `${recipeId}.jpg`);
      await writeFile(dest, buffer);
      fixFilePath = `public/recipe-images/${recipeId}.jpg`;
      fixStatus = "applied";
      newImageUrl = `/${fixFilePath}`;

      // Update Supabase image_url immediately
      await supabase
        .from("recipes")
        .update({ image_url: newImageUrl })
        .eq("id", recipeId);

    } else if (issueType === "faulty_image" && recipeId) {
      // No user file — run pipeline, excluding the source that was just reported bad
      const { data: recipeData } = await supabase
        .from("recipes")
        .select("title, cuisine_type, image_source_credit")
        .eq("id", recipeId)
        .single();

      const currentSource = (recipeData?.image_source_credit as { source?: string } | null)?.source;
      const excludeSources = currentSource ? [currentSource] : [];

      const result = await findImageForRecipe(
        {
          id: recipeId,
          title: recipeData?.title ?? recipeName ?? recipeId,
          cuisine_type: (recipeData as Record<string, unknown>)?.cuisine_type as string | null | undefined,
        },
        { excludeSources }
      );

      if (result) {
        newImageUrl = result.imageUrl;
        fixStatus = "applied";
        const { error: updateErr } = await supabase.from("recipes").update({
          image_url: result.imageUrl,
          image_status: "ok",
          image_legal_tier: result.tier,
          image_source_credit: result.credit,
        }).eq("id", recipeId);
        if (updateErr) console.error("[recipe-reports] image update failed:", updateErr.message);
      } else {
        fixStatus = "pending";
        await supabase.from("recipes").update({ image_status: "needs_manual" }).eq("id", recipeId);
      }

    } else if (issueType === "wrong_info" && file && recipeId) {
      // Save txt for admin review
      const text = await file.text();
      const dir = path.join(PENDING_DIR, recipeId);
      await mkdir(dir, { recursive: true });
      await writeFile(path.join(dir, "description.txt"), text, "utf-8");
      fixFilePath = `pending-fixes/${recipeId}/description.txt`;
      fixStatus = "pending_review";
    }

    // Supabase insert
    const reportId = `r_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    try {
      await supabase.from("recipe_bug_reports").insert({
        id: reportId,
        recipe_id: recipeId ?? null,
        recipe_name: recipeName ?? null,
        issue_type: issueType,
        description: (description ?? "").trim() || null,
        source_url: sourceUrl,
        fix_file_path: fixFilePath,
        fix_status: fixStatus,
        reporter_id: user?.id ?? null,
        created_at: new Date().toISOString(),
      });
    } catch (err) {
      console.error("[recipe-reports] Supabase insert failed:", err);
    }

    // Local persistence (non-blocking — filesystem failure must not affect client response)
    if (recipeId) {
      try {
        await persistFix({
          recipeId,
          recipeName: recipeName ?? null,
          issueType,
          fixStatus,
          fixFilePath,
          reportedAt: new Date().toISOString(),
          reportId,
        });
      } catch (err) {
        console.error("[recipe-reports] persistFix failed:", err);
      }
    }

    return NextResponse.json({
      ok: true,
      fixTriggered: issueType === "faulty_image" && !file,
      fixApplied: fixStatus === "applied",
      newImageUrl,
    });
  } catch (err) {
    console.error("[recipe-reports POST]", err);
    return NextResponse.json({ error: "Failed to save report" }, { status: 500 });
  }
}

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { data, error } = await supabase
      .from("recipe_bug_reports")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return NextResponse.json(data ?? []);
  } catch {
    return NextResponse.json([]);
  }
}
