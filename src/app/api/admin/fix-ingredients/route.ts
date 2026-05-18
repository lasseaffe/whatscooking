import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { ai, getModel } from "@/lib/ai";

export const runtime = "nodejs";
export const maxDuration = 300;
export const dynamic = "force-dynamic";

const KNOWN_UNITS = new Set([
  "g", "kg", "ml", "l",
  "oz", "fl oz", "lb", "lbs", "cup", "cups", "tbsp", "tsp",
  "pinch", "dash", "handful", "clove", "cloves", "sprig", "sprigs",
  "slice", "slices", "piece", "pieces", "head", "bunch", "can", "cans",
  "packet", "packets", "sheet", "sheets", "stalk", "stalks",
]);

type RawIngredient = { name: string; amount?: number | null; unit?: string | null; category?: string };

function hasUnknownUnit(ing: RawIngredient): boolean {
  if (!ing.unit) return false;
  return !KNOWN_UNITS.has(ing.unit.toLowerCase().trim());
}

function hasNullAmount(ing: RawIngredient): boolean {
  return ing.amount == null && ing.unit != null && ing.unit.trim() !== "";
}

async function normalizeIngredients(
  title: string,
  ingredients: RawIngredient[],
): Promise<RawIngredient[] | null> {
  const response = await ai.chat.completions.create({
    model: getModel(),
    max_tokens: 1024,
    messages: [
      {
        role: "user",
        content: `Fix the ingredients list for the recipe "${title}".

Current ingredients (may have bad/missing units or amounts):
${JSON.stringify(ingredients, null, 2)}

Rules:
- Normalize all units to standard metric (g, kg, ml, l) or standard culinary (tsp, tbsp, cup, pinch, clove, sprig, etc.)
- Fill in sensible amounts where amount is null but unit exists
- Keep ingredient names unchanged
- Keep category unchanged if present
- Return the full fixed ingredients array as JSON

Return ONLY the JSON array — no markdown, no labels.`,
      },
    ],
  });

  const raw = response.choices[0]?.message?.content?.trim() ?? "";
  const json = raw.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "").trim();
  try {
    const parsed = JSON.parse(json);
    if (Array.isArray(parsed) && parsed.length > 0) return parsed as RawIngredient[];
  } catch {
    const match = json.match(/\[[\s\S]*\]/);
    if (match) {
      try {
        const parsed = JSON.parse(match[0]);
        if (Array.isArray(parsed)) return parsed as RawIngredient[];
      } catch { /* fall through */ }
    }
  }
  return null;
}

export async function POST(req: NextRequest) {
  const adminSecret = req.headers.get("x-admin-secret");
  if (adminSecret !== process.env.ADMIN_SECRET) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const dryRun: boolean = body.dryRun ?? false;
  const limit: number = body.limit ?? 200;
  const scanOnly: boolean = body.scanOnly ?? false;

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      function send(obj: Record<string, unknown>) {
        controller.enqueue(encoder.encode(JSON.stringify(obj) + "\n"));
      }

      const supabase = await createClient();

      const { data: recipes, error } = await supabase
        .from("recipes")
        .select("id, title, ingredients")
        .limit(limit);

      if (error) {
        send({ event: "error", message: error.message });
        controller.close();
        return;
      }

      // Find recipes with ingredient issues
      const flagged = (recipes ?? []).filter((r) => {
        const ings = (r.ingredients ?? []) as RawIngredient[];
        return ings.some((i) => hasUnknownUnit(i) || hasNullAmount(i));
      });

      send({ event: "start", total: (recipes ?? []).length, flagged: flagged.length, scanOnly, dryRun });

      if (scanOnly) {
        for (const r of flagged) {
          const ings = (r.ingredients ?? []) as RawIngredient[];
          const issues = ings
            .filter((i) => hasUnknownUnit(i) || hasNullAmount(i))
            .map((i) => ({ name: i.name, unit: i.unit, amount: i.amount, issue: hasUnknownUnit(i) ? "unknown_unit" : "null_amount" }));
          send({ event: "flagged", id: r.id, title: r.title ?? "", issues });
        }
        send({ event: "done", flagged: flagged.length });
        controller.close();
        return;
      }

      let fixed = 0;
      let failed = 0;

      for (let i = 0; i < flagged.length; i++) {
        const recipe = flagged[i];
        send({ event: "progress", index: i + 1, of: flagged.length, title: recipe.title ?? "" });

        let normalized: RawIngredient[] | null = null;
        try {
          normalized = await normalizeIngredients(
            recipe.title ?? "Unnamed",
            (recipe.ingredients ?? []) as RawIngredient[],
          );
        } catch (aiErr) {
          console.error("AI fix failed for", recipe.id, aiErr);
          failed++;
          send({ event: "item", index: i + 1, title: recipe.title ?? "", status: "ai_error" });
          continue;
        }

        const updated =
          !dryRun && normalized != null
            ? (await supabase.from("recipes").update({ ingredients: normalized }).eq("id", recipe.id)).error === null
            : false;

        if (updated) fixed++;
        send({ event: "item", index: i + 1, title: recipe.title ?? "", status: updated ? "fixed" : dryRun ? "dry_run" : "skipped" });
      }

      send({ event: "done", fixed, failed, flagged: flagged.length });
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson",
      "Transfer-Encoding": "chunked",
      "Cache-Control": "no-cache",
    },
  });
}
