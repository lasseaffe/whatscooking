import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { writeFile, mkdir, readFile } from "fs/promises";
import path from "path";

const MONITOR_SECRET = process.env.MONITOR_SECRET ?? "";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface QueueEntry {
  recipeId: string;
  type: "image" | "instructions";
  path: string;
  status: "pending" | "done";
  addedAt: string;
  appliedAt?: string;
}

const QUEUE_PATH = path.join(process.cwd(), "fixes", "queue.json");

async function readQueue(): Promise<QueueEntry[]> {
  try {
    const raw = await readFile(QUEUE_PATH, "utf-8");
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

async function writeQueue(queue: QueueEntry[]): Promise<void> {
  await writeFile(QUEUE_PATH, JSON.stringify(queue, null, 2), "utf-8");
}

export async function POST(req: NextRequest) {
  const auth = req.headers.get("authorization") ?? "";
  if (MONITOR_SECRET && auth !== `Bearer ${MONITOR_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { recipeId, reportId, type, content } = body as {
    recipeId: string;
    reportId?: string;
    type: "image" | "instructions";
    content: string;
  };

  if (!recipeId || !type || !content) {
    return NextResponse.json({ error: "Missing recipeId, type, or content" }, { status: 400 });
  }

  const fixesDir = path.join(process.cwd(), "fixes");
  const subDir = type === "image" ? "images" : "instructions";
  const ext = type === "image" ? ".jpg" : ".txt";
  const fileName = `${recipeId}${ext}`;
  const filePath = path.join(fixesDir, subDir, fileName);

  await mkdir(path.join(fixesDir, subDir), { recursive: true });

  const fileData =
    type === "image"
      ? Buffer.from(content.replace(/^data:[^;]+;base64,/, ""), "base64")
      : Buffer.from(content, "utf-8");

  await writeFile(filePath, fileData);

  const now = new Date().toISOString();
  if (type === "image") {
    const publicPath = `/recipe-images/${recipeId}.jpg`;
    const destDir = path.join(process.cwd(), "public", "recipe-images");
    await mkdir(destDir, { recursive: true });
    await writeFile(path.join(destDir, `${recipeId}.jpg`), fileData);
    await supabase.from("recipes").update({ image_url: publicPath }).eq("id", recipeId);
  } else {
    const instructions = content
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);
    await supabase.from("recipes").update({ instructions }).eq("id", recipeId);
  }

  if (reportId) {
    await supabase
      .from("recipe_bug_reports")
      .update({ resolved_at: now, resolved_by: "admin-ui" })
      .eq("id", reportId);
  }

  const queue = await readQueue();
  const relativePath = path.join("fixes", subDir, fileName);
  const existing = queue.find((e) => e.recipeId === recipeId && e.type === type);
  if (existing) {
    existing.status = "done";
    existing.appliedAt = now;
  } else {
    queue.push({
      recipeId,
      type,
      path: relativePath,
      status: "done",
      addedAt: now,
      appliedAt: now,
    });
  }
  await writeQueue(queue);

  return NextResponse.json({ ok: true, filePath: relativePath });
}
