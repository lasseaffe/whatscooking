import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { extractAndSaveRecipe } from "@/lib/extract-recipe";

export const runtime = "nodejs";
export const maxDuration = 300;
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const adminSecret = req.headers.get("x-admin-secret");
  if (adminSecret !== process.env.ADMIN_SECRET) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }

  const supabase = await createClient();

  const { data: recipes, error } = await supabase
    .from("recipes")
    .select("id, title, source, source_url, instructions, ingredients, dish_types")
    .limit(1000);

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }

  const sparse = (recipes ?? []).filter((r) => {
    const instrCount = ((r.instructions ?? []) as string[]).length;
    const ingCount = ((r.ingredients ?? []) as unknown[]).length;
    return instrCount < 3 || ingCount < 3;
  }).map((r) => ({
    id: r.id,
    title: r.title,
    source: r.source,
    source_url: r.source_url,
    instructionCount: ((r.instructions ?? []) as string[]).length,
    ingredientCount: ((r.ingredients ?? []) as unknown[]).length,
    isPremium: ((r.dish_types ?? []) as string[]).includes("premium"),
  }));

  return new Response(JSON.stringify({ sparse, total: (recipes ?? []).length }), {
    headers: { "Content-Type": "application/json" },
  });
}

export async function POST(req: NextRequest) {
  const adminSecret = req.headers.get("x-admin-secret");
  if (adminSecret !== process.env.ADMIN_SECRET) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const ids: string[] = body.ids ?? [];

  if (ids.length === 0) {
    return new Response(JSON.stringify({ error: "No IDs provided" }), { status: 400 });
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      function send(obj: Record<string, unknown>) {
        controller.enqueue(encoder.encode(JSON.stringify(obj) + "\n"));
      }

      send({ event: "start", total: ids.length });

      let fixed = 0;
      let failed = 0;

      for (let i = 0; i < ids.length; i++) {
        const id = ids[i];
        send({ event: "progress", index: i + 1, of: ids.length, id });
        try {
          const result = await extractAndSaveRecipe(id);
          if (result) {
            fixed++;
            send({ event: "item", id, status: "fixed", title: (result as { title?: string }).title });
          } else {
            failed++;
            send({ event: "item", id, status: "no_source" });
          }
        } catch (e) {
          failed++;
          send({ event: "item", id, status: "error", detail: String(e) });
        }
      }

      send({ event: "done", fixed, failed });
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
