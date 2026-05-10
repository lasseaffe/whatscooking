import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { spawn } from "child_process";
import { writeFile, mkdir } from "fs/promises";
import { readFileSync } from "fs";
import path from "path";

export const runtime = "nodejs";

const PYTHON = process.env.PYTHON_PATH ?? "python";
const SCRIPTS_DIR = path.join(process.cwd(), "scripts", "ingestion");
const HERO_SHOT = path.join(SCRIPTS_DIR, "hero_shot.py");
const SITE_SCREENSHOTTER = path.join(SCRIPTS_DIR, "site_screenshotter.py");
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
  // 1. Append to recipe-fixes.json (audit log)
  let log: FixLogEntry[] = [];
  try {
    log = JSON.parse(readFileSync(FIXES_LOG, "utf-8"));
  } catch { /* file doesn't exist yet — start fresh */ }
  log.push(entry);
  await writeFile(FIXES_LOG, JSON.stringify(log, null, 2));

  // 2. Upsert fixes/<recipeId>.json (latest fix per recipe)
  await mkdir(FIXES_DIR, { recursive: true });
  await writeFile(
    path.join(FIXES_DIR, `${entry.recipeId}.json`),
    JSON.stringify(entry, null, 2)
  );
}

function isInstagram(url: string): boolean {
  return url.toLowerCase().includes("instagram.com");
}

/**
 * Fire-and-forget image fix.
 * Routes to hero_shot.py for Instagram URLs, site_screenshotter.py for everything else.
 */
function triggerImageFix(recipeId: string, sourceUrl: string): void {
  const outPath = path.join(OUT_DIR, `${recipeId}.jpg`);

  let script: string;
  let args: string[];

  if (isInstagram(sourceUrl)) {
    script = HERO_SHOT;
    args = [script, sourceUrl, "--out", outPath];
    const cookiesFile = process.env.INSTAGRAM_COOKIES_FILE;
    if (cookiesFile) args.push("--cookies", cookiesFile);
  } else {
    script = SITE_SCREENSHOTTER;
    args = [script, sourceUrl, "--out", outPath, "--format", "jpg"];
  }

  const child = spawn(PYTHON, args, { detached: true, stdio: "ignore" });
  child.unref();

  const router = isInstagram(sourceUrl) ? "hero_shot" : "site_screenshotter";
  console.log(`[recipe-reports] fix triggered (${router}) for ${recipeId} ← ${sourceUrl}`);
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
    let resolvedSourceUrl: string | null = sourceUrl;

    // Resolve source_url from DB if not provided
    if (!resolvedSourceUrl && recipeId && issueType === "faulty_image") {
      const { data } = await supabase
        .from("recipes")
        .select("source_url")
        .eq("id", recipeId)
        .single();
      resolvedSourceUrl = data?.source_url ?? null;
    }

    if (issueType === "faulty_image" && file && recipeId) {
      // User-supplied image — save directly, skip scraper
      const buffer = Buffer.from(await file.arrayBuffer());
      await mkdir(OUT_DIR, { recursive: true });
      const dest = path.join(OUT_DIR, `${recipeId}.jpg`);
      await writeFile(dest, buffer);
      fixFilePath = `public/recipe-images/${recipeId}.jpg`;
      fixStatus = "applied";

      // Update Supabase image_url immediately
      await supabase
        .from("recipes")
        .update({ image_url: `/${fixFilePath}` })
        .eq("id", recipeId);

    } else if (issueType === "faulty_image" && recipeId && resolvedSourceUrl) {
      // No user file — fall back to scraper
      fixStatus = "pending";
      triggerImageFix(recipeId, resolvedSourceUrl);

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
        source_url: resolvedSourceUrl,
        fix_file_path: fixFilePath,
        fix_status: fixStatus,
        reporter_id: user?.id ?? null,
        created_at: new Date().toISOString(),
      });
    } catch (err) {
      console.error("[recipe-reports] Supabase insert failed:", err);
    }

    // Local persistence
    if (recipeId) {
      await persistFix({
        recipeId,
        recipeName: recipeName ?? null,
        issueType,
        fixStatus,
        fixFilePath,
        reportedAt: new Date().toISOString(),
        reportId,
      });
    }

    return NextResponse.json({
      ok: true,
      fixTriggered: issueType === "faulty_image" && !file && !!resolvedSourceUrl,
      fixApplied:   fixStatus === "applied",
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
