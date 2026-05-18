import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const maxDuration = 120;
export const dynamic = "force-dynamic";

function normalize(title: string): string {
  return title.toLowerCase().replace(/[^a-z0-9 ]/g, "").replace(/\s+/g, " ").trim();
}

// Trigram-based similarity: returns 0-1
function trigramSimilarity(a: string, b: string): number {
  if (a === b) return 1;
  if (a.length < 3 || b.length < 3) return a === b ? 1 : 0;

  function trigrams(s: string): Set<string> {
    const set = new Set<string>();
    for (let i = 0; i <= s.length - 3; i++) set.add(s.slice(i, i + 3));
    return set;
  }

  const ta = trigrams(a);
  const tb = trigrams(b);
  let intersection = 0;
  for (const t of ta) if (tb.has(t)) intersection++;
  return (2 * intersection) / (ta.size + tb.size);
}

export async function POST(req: NextRequest) {
  const adminSecret = req.headers.get("x-admin-secret");
  if (adminSecret !== process.env.ADMIN_SECRET) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const threshold: number = body.threshold ?? 0.85;
  const limit: number = body.limit ?? 2000;
  const deleteId: string | null = body.deleteId ?? null;

  const supabase = await createClient();

  // Handle delete action
  if (deleteId) {
    const { error } = await supabase.from("recipes").delete().eq("id", deleteId);
    return new Response(JSON.stringify({ deleted: !error, error: error?.message }), {
      headers: { "Content-Type": "application/json" },
    });
  }

  const { data: recipes, error } = await supabase
    .from("recipes")
    .select("id, title, source, created_at")
    .not("title", "is", null)
    .limit(limit);

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }

  const items = (recipes ?? []).map((r) => ({ ...r, normalized: normalize(r.title ?? "") }));
  const pairs: Array<{
    a: { id: string; title: string; source: string | null };
    b: { id: string; title: string; source: string | null };
    similarity: number;
  }> = [];

  for (let i = 0; i < items.length; i++) {
    for (let j = i + 1; j < items.length; j++) {
      const sim = trigramSimilarity(items[i].normalized, items[j].normalized);
      if (sim >= threshold) {
        pairs.push({
          a: { id: items[i].id, title: items[i].title ?? "", source: items[i].source },
          b: { id: items[j].id, title: items[j].title ?? "", source: items[j].source },
          similarity: Math.round(sim * 100),
        });
      }
    }
  }

  pairs.sort((a, b) => b.similarity - a.similarity);

  return new Response(JSON.stringify({ pairs, total: items.length, threshold }), {
    headers: { "Content-Type": "application/json" },
  });
}
