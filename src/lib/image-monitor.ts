import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { CATEGORY_PHOTOS, detectFoodCategory, getCategoryFallback } from "./recipe-image";

const TIMEOUT_MS = 8_000;
const UNSPLASH_BASE = "https://images.unsplash.com/";

export interface MonitorOptions {
  supabaseUrl: string;
  supabaseKey: string;
  concurrency?: number;
  limit?: number;
  logPath?: string;
  dryRun?: boolean;
}

export interface RecipeRow {
  id: string;
  title: string;
  image_url: string | null;
  cuisine_type: string | null;
  dietary_tags: string[] | null;
}

export interface IssueRecord {
  id: string;
  title: string;
  image_url: string | null;
  reason: "broken" | "duplicate" | "mismatched" | "null";
  fixedUrl: string;
}

export interface MonitorReport {
  generatedAt: string;
  totalRecipes: number;
  checked: number;
  issues: IssueRecord[];
  fixed: number;
  dryRun: boolean;
}

function buildPhotoIndex(): Map<string, string> {
  const index = new Map<string, string>();
  for (const [category, ids] of Object.entries(CATEGORY_PHOTOS)) {
    for (const id of ids) {
      index.set(id, category);
    }
  }
  return index;
}

function extractUnsplashId(url: string): string | null {
  if (!url.startsWith(UNSPLASH_BASE)) return null;
  const match = url.match(/\/(photo-[^?/]+)/);
  return match ? match[1] : null;
}

async function ping(url: string): Promise<{ ok: boolean; status: number | string }> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    const res = await fetch(url, { method: "HEAD", signal: controller.signal });
    clearTimeout(timer);
    return { ok: res.ok, status: res.status };
  } catch (err: unknown) {
    const isAbort = err instanceof Error && err.name === "AbortError";
    return { ok: false, status: isAbort ? "TIMEOUT" : "ERROR" };
  }
}

async function runPool<T>(tasks: Array<() => Promise<T>>, concurrency: number): Promise<T[]> {
  const results: T[] = new Array(tasks.length);
  let idx = 0;
  async function worker() {
    while (idx < tasks.length) {
      const i = idx++;
      results[i] = await tasks[i]();
    }
  }
  await Promise.all(Array.from({ length: concurrency }, worker));
  return results;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function fetchRecipes(supabase: SupabaseClient<any>): Promise<RecipeRow[]> {
  const PAGE = 1000;
  const all: RecipeRow[] = [];
  let from = 0;
  while (true) {
    const { data, error } = await supabase
      .from("recipes")
      .select("id, title, image_url, cuisine_type, dietary_tags")
      .range(from, from + PAGE - 1);
    if (error) throw new Error(`Supabase fetch error: ${error.message}`);
    if (!data?.length) break;
    all.push(...(data as RecipeRow[]));
    if (data.length < PAGE) break;
    from += PAGE;
  }
  return all;
}

export async function runImageMonitor(options: MonitorOptions): Promise<MonitorReport> {
  const { supabaseUrl, supabaseKey, concurrency = 8, limit = 0, dryRun = false } = options;

  const supabase = createClient(supabaseUrl, supabaseKey);
  const photoIndex = buildPhotoIndex();

  let recipes = await fetchRecipes(supabase);
  if (limit > 0) recipes = recipes.slice(0, limit);

  const issueMap = new Map<string, IssueRecord>();

  // 1. Null image check
  for (const r of recipes) {
    if (!r.image_url) {
      issueMap.set(r.id, {
        id: r.id,
        title: r.title,
        image_url: null,
        reason: "null",
        fixedUrl: getCategoryFallback(r.id, r.title, r.cuisine_type, r.dietary_tags),
      });
    }
  }

  // 2. Duplicate check
  const urlToIds = new Map<string, string[]>();
  for (const r of recipes) {
    if (!r.image_url) continue;
    const list = urlToIds.get(r.image_url) ?? [];
    list.push(r.id);
    urlToIds.set(r.image_url, list);
  }
  for (const [, ids] of urlToIds) {
    if (ids.length < 2) continue;
    for (const id of ids) {
      if (issueMap.has(id)) continue;
      const r = recipes.find(x => x.id === id)!;
      issueMap.set(id, {
        id,
        title: r.title,
        image_url: r.image_url,
        reason: "duplicate",
        fixedUrl: getCategoryFallback(id, r.title, r.cuisine_type, r.dietary_tags),
      });
    }
  }

  // 3. Relevance check (Unsplash only)
  for (const r of recipes) {
    if (!r.image_url || issueMap.has(r.id)) continue;
    const photoId = extractUnsplashId(r.image_url);
    if (!photoId) continue;
    const storedCategory = photoIndex.get(photoId);
    if (!storedCategory) continue;
    const expectedCategory = detectFoodCategory(r.title, r.cuisine_type, r.dietary_tags);
    if (storedCategory !== expectedCategory) {
      issueMap.set(r.id, {
        id: r.id,
        title: r.title,
        image_url: r.image_url,
        reason: "mismatched",
        fixedUrl: getCategoryFallback(r.id, r.title, r.cuisine_type, r.dietary_tags),
      });
    }
  }

  // 4. Display check (HEAD ping)
  const withImages = recipes.filter(r => r.image_url && !issueMap.has(r.id));
  const uniqueUrls = [...new Set(withImages.map(r => r.image_url as string))];

  const pingResults = await runPool(
    uniqueUrls.map(url => async () => {
      const result = await ping(url);
      return { url, ...result };
    }),
    concurrency,
  );

  const brokenUrls = new Set(
    pingResults.filter(p => !p.ok && (p.status === 404 || p.status === 410)).map(p => p.url),
  );
  for (const r of withImages) {
    if (!r.image_url || !brokenUrls.has(r.image_url)) continue;
    issueMap.set(r.id, {
      id: r.id,
      title: r.title,
      image_url: r.image_url,
      reason: "broken",
      fixedUrl: getCategoryFallback(r.id, r.title, r.cuisine_type, r.dietary_tags),
    });
  }

  const issues = [...issueMap.values()];

  // 5. Auto-fix
  let fixed = 0;
  if (!dryRun && issues.length > 0) {
    for (const issue of issues) {
      const { error } = await supabase
        .from("recipes")
        .update({ image_url: issue.fixedUrl })
        .eq("id", issue.id);
      if (!error) fixed++;
    }
  }

  return {
    generatedAt: new Date().toISOString(),
    totalRecipes: recipes.length,
    checked: recipes.length,
    issues,
    fixed,
    dryRun,
  };
}
