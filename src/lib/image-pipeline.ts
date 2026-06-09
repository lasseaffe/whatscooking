// src/lib/image-pipeline.ts

const FETCH_TIMEOUT_MS = 10_000;

// ── Types ─────────────────────────────────────────────────────────────────────

export interface ImageResult {
  imageUrl: string;
  credit: {
    source: string;
    author?: string;
    license?: string;
    licenseUrl?: string;
    sourcePageUrl?: string;
  };
  tier: 1 | 2;
}

export interface RecipeLike {
  id: string;
  title: string;
  cuisine_type?: string | null;
  image_source_credit?: { source: string } | null;
}

export interface FindImageOptions {
  /** Sources to skip — use to avoid re-fetching the source that was just reported as bad */
  excludeSources?: string[];
  /** Injected keys (for testing). Falls back to process.env. */
  pixabayKey?: string;
  unsplashKey?: string;
}

// ── Food keyword acceptance filter ────────────────────────────────────────────
// An image must contain at least one of these in its tags/description
// to be accepted. Pixabay's category=food filter handles most cases already;
// this is the safety net for Wikimedia and Unsplash results.

const FOOD_KEYWORDS = new Set([
  'food', 'dish', 'meal', 'recipe', 'cooking', 'cuisine', 'eat', 'eating',
  'plate', 'bowl', 'dinner', 'lunch', 'breakfast', 'dessert', 'appetizer',
  'snack', 'baked', 'fried', 'grilled', 'roasted', 'soup', 'salad', 'pasta',
  'pizza', 'burger', 'steak', 'chicken', 'beef', 'fish', 'seafood',
  'vegetable', 'veggie', 'fruit', 'cheese', 'bread', 'cake', 'cookie',
  'pie', 'sauce', 'curry', 'rice', 'noodle', 'sushi', 'ramen', 'taco',
  'sandwich', 'omelet', 'egg', 'bacon', 'sausage', 'ham', 'chocolate',
  'spice', 'herb', 'garlic', 'onion', 'tomato', 'kitchen', 'chef', 'cook',
  'bake', 'fry', 'roast', 'ingredient', 'flavor', 'taste', 'delicious',
]);

export function hasFoodKeyword(text: string): boolean {
  const lower = text.toLowerCase();
  for (const kw of FOOD_KEYWORDS) {
    if (lower.includes(kw)) return true;
  }
  return false;
}

// ── Fetch helper ──────────────────────────────────────────────────────────────

async function fetchJson(url: string, headers: Record<string, string> = {}): Promise<unknown> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { Accept: 'application/json', ...headers },
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

// ── Source 1: Pixabay ─────────────────────────────────────────────────────────
// Free API, no attribution required, category=food filter built-in.
// Docs: https://pixabay.com/api/docs/

async function searchPixabay(query: string, apiKey: string): Promise<ImageResult | null> {
  const url =
    `https://pixabay.com/api/?key=${apiKey}` +
    `&q=${encodeURIComponent(query)}` +
    `&image_type=photo&category=food&orientation=horizontal&per_page=5&safesearch=true`;

  const data = (await fetchJson(url)) as { hits?: Array<{ webformatURL: string; tags: string; pageURL: string; user: string }> } | null;
  const hit = data?.hits?.find((h) => hasFoodKeyword(h.tags));
  if (!hit) return null;

  return {
    imageUrl: hit.webformatURL,
    credit: {
      source: 'pixabay',
      author: hit.user,
      license: 'Pixabay License',
      licenseUrl: 'https://pixabay.com/service/license-summary/',
      sourcePageUrl: hit.pageURL,
    },
    tier: 1,
  };
}

// ── Source 2: Wikimedia Commons ───────────────────────────────────────────────
// No API key needed. CC-licensed. Searches file namespace (ns=6).

async function searchWikimedia(query: string): Promise<ImageResult | null> {
  const API = 'https://commons.wikimedia.org/w/api.php';
  const searchUrl =
    `${API}?action=query&list=search` +
    `&srsearch=${encodeURIComponent(query + ' food')}` +
    `&srnamespace=6&format=json&srlimit=5&origin=*`;

  const data = (await fetchJson(searchUrl)) as { query?: { search?: Array<{ title: string }> } } | null;
  const results = data?.query?.search ?? [];

  for (const result of results) {
    // Skip obviously non-food files
    const lowerTitle = result.title.toLowerCase();
    if (lowerTitle.match(/map|logo|flag|icon|diagram|chart|coat_of_arms|emblem/)) continue;
    if (!hasFoodKeyword(lowerTitle) && !hasFoodKeyword(query)) continue;

    const infoUrl =
      `${API}?action=query&titles=${encodeURIComponent(result.title)}` +
      `&prop=imageinfo&iiprop=url|extmetadata&format=json&origin=*`;

    const data2 = (await fetchJson(infoUrl)) as { query?: { pages?: Record<string, { imageinfo?: Array<{ url: string; extmetadata?: Record<string, { value: string }> }> }> } } | null;
    const pages = Object.values(data2?.query?.pages ?? {});
    const info = pages[0]?.imageinfo?.[0];
    if (!info?.url) continue;

    // Skip SVGs and non-image types
    if (info.url.match(/\.svg$|\.pdf$/i)) continue;

    const meta = info.extmetadata ?? {};
    const license = meta['LicenseShortName']?.value ?? 'CC';
    const licenseUrl = meta['LicenseUrl']?.value ?? 'https://creativecommons.org/licenses/';
    const author = (meta['Artist']?.value ?? 'Wikimedia contributor').replace(/<[^>]+>/g, '').trim();

    return {
      imageUrl: info.url,
      credit: {
        source: 'wikimedia',
        author,
        license,
        licenseUrl,
        sourcePageUrl: `https://commons.wikimedia.org/wiki/${encodeURIComponent(result.title)}`,
      },
      tier: 2,
    };
  }

  return null;
}

// ── Source 3: Unsplash API search ─────────────────────────────────────────────
// Free tier: 50 req/hour. Attribution required (stored in image_source_credit).
// Docs: https://unsplash.com/documentation#search-photos

async function searchUnsplash(query: string, apiKey: string): Promise<ImageResult | null> {
  const url =
    `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query + ' food')}` +
    `&per_page=5&orientation=landscape&content_filter=high`;

  const data = (await fetchJson(url, { Authorization: `Client-ID ${apiKey}` })) as {
    results?: Array<{
      urls: { regular: string };
      alt_description?: string | null;
      description?: string | null;
      user: { name: string; links: { html: string } };
      links: { html: string };
    }>;
  } | null;

  const photo = data?.results?.find((r) => {
    const text = `${r.alt_description ?? ''} ${r.description ?? ''}`;
    return hasFoodKeyword(text);
  });
  if (!photo) return null;

  return {
    imageUrl: photo.urls.regular,
    credit: {
      source: 'unsplash',
      author: photo.user.name,
      license: 'Unsplash License',
      licenseUrl: 'https://unsplash.com/license',
      sourcePageUrl: photo.links.html,
    },
    tier: 2,
  };
}

// ── Ingredient fallback query builder ─────────────────────────────────────────
// Strips common title prefixes to get a more specific ingredient/dish keyword.

const STRIP_PREFIXES =
  /^(easy|quick|best|simple|classic|homemade|traditional|authentic|perfect|amazing|delicious|creamy|crispy|crunchy|fluffy|cheesy|spicy|healthy|old-fashioned|restaurant.style|copycat|one.pot|slow.cooker|instant.pot|air.fryer)\s+/gi;

export function buildIngredientQuery(title: string): string {
  const stripped = title.replace(STRIP_PREFIXES, '').trim();
  // Take last 2–3 words to focus on the key ingredient/dish noun
  const words = stripped.split(/\s+/).filter((w) => w.length > 2);
  return words.slice(-3).join(' ');
}

// ── Main pipeline ─────────────────────────────────────────────────────────────

export async function findImageForRecipe(
  recipe: RecipeLike,
  opts: FindImageOptions = {},
): Promise<ImageResult | null> {
  const excluded = new Set(opts.excludeSources ?? []);
  const pixabayKey = opts.pixabayKey ?? process.env.PIXABAY_API_KEY ?? '';
  const unsplashKey = opts.unsplashKey ?? process.env.UNSPLASH_ACCESS_KEY ?? '';

  const titleQuery = recipe.title;
  const fallbackQuery = buildIngredientQuery(recipe.title);

  // --- Pass 1: search by recipe title ---

  if (!excluded.has('pixabay') && pixabayKey) {
    const r = await searchPixabay(titleQuery, pixabayKey);
    if (r) return r;
  }

  if (!excluded.has('wikimedia')) {
    const r = await searchWikimedia(titleQuery);
    if (r) return r;
  }

  if (!excluded.has('unsplash') && unsplashKey) {
    const r = await searchUnsplash(titleQuery, unsplashKey);
    if (r) return r;
  }

  // --- Pass 2: ingredient keyword fallback (only if different from full title) ---

  if (fallbackQuery !== titleQuery && fallbackQuery.length > 3) {
    if (!excluded.has('pixabay') && pixabayKey) {
      const r = await searchPixabay(fallbackQuery, pixabayKey);
      if (r) return r;
    }
    if (!excluded.has('wikimedia')) {
      const r = await searchWikimedia(fallbackQuery);
      if (r) return r;
    }
    if (!excluded.has('unsplash') && unsplashKey) {
      const r = await searchUnsplash(fallbackQuery, unsplashKey);
      if (r) return r;
    }
  }

  return null; // caller should fall back to curated bank
}
