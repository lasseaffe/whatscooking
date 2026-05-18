import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const maxDuration = 300;
export const dynamic = "force-dynamic";

async function checkImageUrl(url: string): Promise<"ok" | "broken" | "timeout"> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    const res = await fetch(url, { method: "HEAD", signal: controller.signal });
    clearTimeout(timeout);
    return res.ok ? "ok" : "broken";
  } catch {
    return "timeout";
  }
}

export async function POST(req: NextRequest) {
  const adminSecret = req.headers.get("x-admin-secret");
  if (adminSecret !== process.env.ADMIN_SECRET) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const limit: number = body.limit ?? 500;
  const fixBroken: boolean = body.fixBroken ?? false;

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      function send(obj: Record<string, unknown>) {
        controller.enqueue(encoder.encode(JSON.stringify(obj) + "\n"));
      }

      const supabase = await createClient();

      const { data: recipes, error } = await supabase
        .from("recipes")
        .select("id, title, image_url")
        .not("image_url", "is", null)
        .limit(limit);

      if (error) {
        send({ event: "error", message: error.message });
        controller.close();
        return;
      }

      send({ event: "start", total: (recipes ?? []).length });

      let ok = 0;
      let broken = 0;
      let timeouts = 0;
      const brokenList: Array<{ id: string; title: string; url: string }> = [];

      for (let i = 0; i < (recipes ?? []).length; i++) {
        const recipe = recipes![i];
        if (!recipe.image_url) continue;

        const status = await checkImageUrl(recipe.image_url);
        if (status === "ok") {
          ok++;
        } else if (status === "broken") {
          broken++;
          brokenList.push({ id: recipe.id, title: recipe.title ?? "", url: recipe.image_url });
          send({ event: "broken", id: recipe.id, title: recipe.title ?? "", url: recipe.image_url });

          if (fixBroken) {
            // Clear the broken URL so the recipe hero falls back to its default
            await supabase.from("recipes").update({ image_url: null }).eq("id", recipe.id);
          }
        } else {
          timeouts++;
        }

        if ((i + 1) % 10 === 0) {
          send({ event: "progress", checked: i + 1, of: (recipes ?? []).length, ok, broken, timeouts });
        }
      }

      send({ event: "done", ok, broken, timeouts, brokenList });
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
