import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { ai, getModel } from "@/lib/ai";

export const runtime = "nodejs";
export const maxDuration = 300;

function isBadDescription(description: string | null): boolean {
  if (!description) return true;
  const d = description.trim();
  if (d.length < 20) return true;
  if (d.includes("Exclusive recipe from our curated")) return true;
  if (d.includes("Click to view") || d.includes("Click Extract")) return true;
  if (/\d+K?\s+likes/i.test(d)) return true;
  if (/\d+\s+comments/i.test(d)) return true;
  if (/@\w/.test(d)) return true;
  if (/#\w/.test(d)) return true;
  if (/link in bio/i.test(d)) return true;
  if (/swipe up/i.test(d)) return true;
  if (/recipe below/i.test(d)) return true;
  if (/\bstory\b.*\bIG\b/i.test(d)) return true;
  const emojiCount = (d.match(/[\u{1F300}-\u{1FAFF}]/gu) ?? []).length;
  if (emojiCount > 2) return true;
  return false;
}

const DESCRIPTION_RULES = `
Description writing rules (STRICT — no exceptions):
- 2-3 sentences, 40-55 words
- Sentence 1: key ingredients + texture/flavour profile
- Sentence 2: technique or what makes it special
- Sentence 3 (optional): occasion or reward for the cook
- NO social metadata: likes counts, hashtags, @ handles, brand/sponsor mentions, emojis, "recipe below"
- Write ONLY from the dish name and its real ingredients
- NO first person (I/my/we/our)
- Tone: editorial cookbook (Ottolenghi / NYT Cooking) — NOT social media
- Be specific: name the defining ingredient
- Lead with flavour/texture, NOT nutrition or dietary tags`.trim();

async function rewriteDescription(
  title: string,
  ingredients: Array<{ name: string }> | null,
): Promise<string | null> {
  const keyIngredients = (ingredients ?? [])
    .slice(0, 8)
    .map((i) => i.name)
    .join(", ");

  const response = await ai.chat.completions.create({
    model: getModel(),
    max_tokens: 256,
    messages: [
      {
        role: "user",
        content: `${DESCRIPTION_RULES}

Write a recipe description for:
Dish: ${title}
${keyIngredients ? `Key ingredients: ${keyIngredients}` : ""}

Return ONLY the description text — no JSON, no labels, no quotes.`,
      },
    ],
  });

  const text = response.choices[0]?.message?.content?.trim() ?? null;
  return text && text.length > 20 ? text : null;
}

type Scope = "missing" | "all" | "source:standard" | "source:premium" | "source:dataset";

// Streams newline-delimited JSON progress lines so the caller can show live output.
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
          .select("id, title, description, ingredients, dish_types, source")
          .limit(scope === "all" ? 9999 : limit);

        if (scope === "source:premium") {
          query = query.contains("dish_types", ["premium"]);
        } else if (scope === "source:dataset") {
          query = query.eq("source", "dataset");
        } else if (scope === "source:standard") {
          query = query.not("dish_types", "cs", '["premium"]').not("source", "eq", "dataset");
        }
        // "missing" and "all" use no source filter — isBadDescription handles missing filtering below

        const { data: recipes, error } = await query;
        if (error) {
          send({ event: "error", message: error.message });
          controller.close();
          return;
        }

        const candidates = scope === "all"
          ? (recipes ?? [])
          : (recipes ?? []).filter((r) => isBadDescription(r.description));
        send({
          event: "start",
          total: (recipes ?? []).length,
          candidates: candidates.length,
          scope,
          dryRun,
        });

        let rewritten = 0;
        let failed = 0;

        for (let i = 0; i < candidates.length; i++) {
          const recipe = candidates[i];
          send({
            event: "progress",
            index: i + 1,
            of: candidates.length,
            id: recipe.id,
            title: recipe.title ?? "",
          });

          let newDesc: string | null = null;
          try {
            newDesc = await rewriteDescription(
              recipe.title ?? "Unnamed Recipe",
              recipe.ingredients as Array<{ name: string }> | null,
            );
          } catch (aiErr) {
            console.error("AI call failed for", recipe.id, aiErr);
            failed++;
            send({ event: "item", index: i + 1, title: recipe.title ?? "", status: "ai_error" });
            continue;
          }

          const updated =
            !dryRun && newDesc != null
              ? (await supabase.from("recipes").update({ description: newDesc }).eq("id", recipe.id)).error === null
              : false;

          if (updated) rewritten++;

          send({
            event: "item",
            index: i + 1,
            title: recipe.title ?? "",
            status: updated ? "updated" : dryRun ? "dry_run" : "skipped",
            new: newDesc,
          });
        }

        send({ event: "done", rewritten, failed, candidates: candidates.length });
      } catch (e) {
        console.error("fix-descriptions error:", e);
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
