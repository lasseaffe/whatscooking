import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { ai, getModel } from "@/lib/ai";

export const runtime = "nodejs";
export const maxDuration = 300;
export const dynamic = "force-dynamic";

type Scope = "missing" | "all" | "source:standard" | "source:premium" | "source:dataset";

function isThinInstructions(instructions: string[] | null): boolean {
  if (!instructions || instructions.length === 0) return true;
  if (instructions.length < 3) return true;
  const totalChars = instructions.join("").length;
  if (totalChars < 200) return true;
  return false;
}

async function rewriteInstructions(
  title: string,
  ingredients: Array<{ name: string; amount?: number; unit?: string }> | null,
): Promise<string[] | null> {
  const keyIngredients = (ingredients ?? [])
    .slice(0, 10)
    .map((i) => [i.amount, i.unit, i.name].filter(Boolean).join(" "))
    .join(", ");

  const response = await ai.chat.completions.create({
    model: getModel(),
    max_tokens: 1024,
    messages: [
      {
        role: "user",
        content: `You are writing recipe instructions in the style of a professional cookbook editor (Ottolenghi / NYT Cooking style).

Write step-by-step cooking instructions for:
Dish: ${title}
${keyIngredients ? `Key ingredients: ${keyIngredients}` : ""}

Rules:
- 6-10 numbered steps
- Each step: 1-3 sentences, clear and actionable
- Include temperature/time where relevant
- No marketing language, no emojis
- Return a JSON array of strings, one string per step
- Example: ["Preheat oven to 200°C.", "Dice the onion finely.", ...]

Return ONLY the JSON array — no markdown, no labels.`,
      },
    ],
  });

  const raw = response.choices[0]?.message?.content?.trim() ?? "";
  // Strip markdown code fences if present
  const json = raw.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "").trim();
  try {
    const parsed = JSON.parse(json);
    if (Array.isArray(parsed) && parsed.length >= 3) return parsed as string[];
  } catch {
    // Try to extract array from response
    const match = json.match(/\[[\s\S]*\]/);
    if (match) {
      try {
        const parsed = JSON.parse(match[0]);
        if (Array.isArray(parsed) && parsed.length >= 3) return parsed as string[];
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
  const limit: number = body.limit ?? 500;
  const scope: Scope = body.scope ?? "missing";

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      function send(obj: Record<string, unknown>) {
        controller.enqueue(encoder.encode(JSON.stringify(obj) + "\n"));
      }

      let supabase: Awaited<ReturnType<typeof createClient>>;
      try {
        supabase = await createClient();
      } catch (e) {
        send({ event: "error", message: "Supabase init failed", detail: String(e) });
        controller.close();
        return;
      }

      try {
        let query = supabase
          .from("recipes")
          .select("id, title, instructions, ingredients, dish_types, source")
          .limit(scope === "all" ? 9999 : limit);

        if (scope === "source:premium") {
          query = query.contains("dish_types", ["premium"]);
        } else if (scope === "source:dataset") {
          query = query.eq("source", "dataset");
        } else if (scope === "source:standard") {
          query = query.not("dish_types", "cs", '["premium"]').not("source", "eq", "dataset");
        }

        const { data: recipes, error } = await query;
        if (error) {
          send({ event: "error", message: error.message });
          controller.close();
          return;
        }

        const candidates = scope === "all"
          ? (recipes ?? [])
          : (recipes ?? []).filter((r) => isThinInstructions(r.instructions as string[] | null));

        send({ event: "start", total: (recipes ?? []).length, candidates: candidates.length, scope, dryRun });

        let rewritten = 0;
        let failed = 0;

        for (let i = 0; i < candidates.length; i++) {
          const recipe = candidates[i];
          send({ event: "progress", index: i + 1, of: candidates.length, id: recipe.id, title: recipe.title ?? "" });

          let newInstructions: string[] | null = null;
          try {
            newInstructions = await rewriteInstructions(
              recipe.title ?? "Unnamed Recipe",
              recipe.ingredients as Array<{ name: string; amount?: number; unit?: string }> | null,
            );
          } catch (aiErr) {
            console.error("AI call failed for", recipe.id, aiErr);
            failed++;
            send({ event: "item", index: i + 1, title: recipe.title ?? "", status: "ai_error" });
            continue;
          }

          const updated =
            !dryRun && newInstructions != null
              ? (await supabase.from("recipes").update({ instructions: newInstructions }).eq("id", recipe.id)).error === null
              : false;

          if (updated) rewritten++;

          send({
            event: "item",
            index: i + 1,
            title: recipe.title ?? "",
            status: updated ? "updated" : dryRun ? "dry_run" : "skipped",
            stepCount: newInstructions?.length,
          });
        }

        send({ event: "done", rewritten, failed, candidates: candidates.length });
      } catch (e) {
        console.error("fix-instructions error:", e);
        send({ event: "error", message: "Unexpected error", detail: String(e) });
      }

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
