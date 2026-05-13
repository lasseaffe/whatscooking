import { chromium, type Page } from "playwright";
import path from "path";
import fs from "fs/promises";
import Anthropic from "@anthropic-ai/sdk";

export type FixMethod =
  | "og_image"
  | "dom_image"
  | "screenshot_image"
  | "json_ld"
  | "vision"
  | "failed";

export type FixResult = {
  reportId: string;
  recipeId: string | null;
  issueType: string;
  fixed: boolean;
  method: FixMethod;
  data?: Record<string, unknown>;
  error?: string;
};

export async function fixReport(
  report: {
    id: string;
    recipe_id: string | null;
    issue_type: string | null;
    source_url: string;
  },
  publicDir: string
): Promise<FixResult> {
  const base: FixResult = {
    reportId: report.id,
    recipeId: report.recipe_id,
    issueType: report.issue_type ?? "unknown",
    fixed: false,
    method: "failed",
  };

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  try {
    await page.goto(report.source_url, {
      waitUntil: "domcontentloaded",
      timeout: 20000,
    });

    if (report.issue_type === "faulty_image") {
      return await fixImageReport(page, report, publicDir, base);
    }
    return await fixDataReport(page, base);
  } catch (err) {
    return { ...base, error: err instanceof Error ? err.message : String(err) };
  } finally {
    await browser.close();
  }
}

async function fixImageReport(
  page: Page,
  report: { recipe_id: string | null },
  publicDir: string,
  base: FixResult
): Promise<FixResult> {
  // Step 1: OG image meta tag
  const ogImage = await page
    .locator("meta[property='og:image']")
    .first()
    .getAttribute("content")
    .catch(() => null);

  if (ogImage && report.recipe_id) {
    const buf = await downloadImage(ogImage);
    if (buf) {
      await saveImage(buf, publicDir, report.recipe_id);
      return {
        ...base,
        fixed: true,
        method: "og_image",
        data: { imageUrl: `/recipe-images/${report.recipe_id}.jpg` },
      };
    }
  }

  // Step 2: Largest visible img by bounding-box area
  if (report.recipe_id) {
    const imgLocators = await page.locator("img").all();
    let bestSrc: string | null = null;
    let bestArea = 0;

    for (const img of imgLocators) {
      const src = await img.getAttribute("src").catch(() => null);
      const box = await img.boundingBox().catch(() => null);
      if (!src || !box) continue;
      const area = box.width * box.height;
      if (area > bestArea && box.width > 200 && box.height > 200) {
        bestArea = area;
        bestSrc = src;
      }
    }

    if (bestSrc) {
      const absoluteSrc = bestSrc.startsWith("http")
        ? bestSrc
        : new URL(bestSrc, page.url()).href;
      const buf = await downloadImage(absoluteSrc);
      if (buf) {
        await saveImage(buf, publicDir, report.recipe_id);
        return {
          ...base,
          fixed: true,
          method: "dom_image",
          data: { imageUrl: `/recipe-images/${report.recipe_id}.jpg` },
        };
      }
    }
  }

  // Step 3: Viewport screenshot as final fallback
  if (report.recipe_id) {
    await page.setViewportSize({ width: 1200, height: 800 });
    const screenshot = await page.screenshot({ type: "jpeg", quality: 85 });
    await saveImage(screenshot, publicDir, report.recipe_id);
    return {
      ...base,
      fixed: true,
      method: "screenshot_image",
      data: { imageUrl: `/recipe-images/${report.recipe_id}.jpg` },
    };
  }

  return base;
}

async function fixDataReport(page: Page, base: FixResult): Promise<FixResult> {
  // Step 1: JSON-LD Recipe schema
  const scriptHandles = await page
    .locator('script[type="application/ld+json"]')
    .all();

  for (const handle of scriptHandles) {
    const text = await handle.textContent().catch(() => null);
    if (!text) continue;
    try {
      const parsed = JSON.parse(text);
      const candidates = Array.isArray(parsed["@graph"])
        ? parsed["@graph"]
        : [parsed];
      const recipe = candidates.find(
        (n: { "@type": string }) => n["@type"] === "Recipe"
      );
      if (recipe) {
        return {
          ...base,
          fixed: true,
          method: "json_ld",
          data: {
            name: recipe.name ?? undefined,
            description: recipe.description ?? undefined,
            ingredients: recipe.recipeIngredient ?? undefined,
            instructions: extractInstructions(recipe.recipeInstructions),
          },
        };
      }
    } catch {
      // malformed ld+json — skip
    }
  }

  // Step 2: Screenshot → Claude vision extraction
  const screenshot = await page.screenshot({
    type: "jpeg",
    quality: 85,
    fullPage: false,
  });

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const msg = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 1024,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image",
            source: {
              type: "base64",
              media_type: "image/jpeg",
              data: screenshot.toString("base64"),
            },
          },
          {
            type: "text",
            text: 'Extract the recipe data from this screenshot. Return only valid JSON: { "name": string, "description": string, "ingredients": string[], "instructions": string[] }. Use null for fields not visible.',
          },
        ],
      },
    ],
  });

  const text =
    msg.content[0].type === "text" ? msg.content[0].text.trim() : "";
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) return { ...base, error: "No JSON in vision response" };

  try {
    const extracted = JSON.parse(jsonMatch[0]);
    return { ...base, fixed: true, method: "vision", data: extracted };
  } catch {
    return { ...base, error: "Vision JSON parse failed" };
  }
}

function extractInstructions(raw: unknown): string[] | undefined {
  if (!Array.isArray(raw)) return undefined;
  return raw.map((s) =>
    typeof s === "string" ? s : (s as { text?: string }).text ?? ""
  );
}

async function saveImage(
  buf: Buffer,
  publicDir: string,
  recipeId: string
): Promise<void> {
  const outputPath = path.join(publicDir, "recipe-images", `${recipeId}.jpg`);
  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, buf);
}

async function downloadImage(url: string): Promise<Buffer | null> {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
    if (!res.ok) return null;
    return Buffer.from(await res.arrayBuffer());
  } catch {
    return null;
  }
}
