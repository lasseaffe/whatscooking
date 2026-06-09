// src/lib/__tests__/image-pipeline.test.ts
import {
  hasFoodKeyword,
  buildIngredientQuery,
  findImageForRecipe,
  type RecipeLike,
} from '../image-pipeline';

const RECIPE: RecipeLike = { id: 'r1', title: 'Spaghetti Carbonara' };
const OPTS = { pixabayKey: 'px_test', unsplashKey: 'us_test' };

// ── hasFoodKeyword ─────────────────────────────────────────────────────────────

test('hasFoodKeyword: matches food term in tags', () => {
  expect(hasFoodKeyword('pasta, italian, food, dinner')).toBe(true);
});

test('hasFoodKeyword: rejects non-food text', () => {
  expect(hasFoodKeyword('landscape, nature, mountain, sky')).toBe(false);
});

test('hasFoodKeyword: case-insensitive', () => {
  expect(hasFoodKeyword('CHICKEN wings')).toBe(true);
});

// ── buildIngredientQuery ───────────────────────────────────────────────────────

test('buildIngredientQuery: strips common prefix', () => {
  expect(buildIngredientQuery('Easy Chicken Tikka Masala')).toBe('Chicken Tikka Masala');
});

test('buildIngredientQuery: returns last 3 words for long titles', () => {
  expect(buildIngredientQuery('Classic Homemade Slow Cooker Beef Stew')).toBe('Cooker Beef Stew');
});

test('buildIngredientQuery: returns full title if short', () => {
  expect(buildIngredientQuery('Ramen')).toBe('Ramen');
});

// ── findImageForRecipe ─────────────────────────────────────────────────────────

const PIXABAY_HIT = {
  webformatURL: 'https://cdn.pixabay.com/photo/test.jpg',
  tags: 'pasta, food, italian',
  pageURL: 'https://pixabay.com/photos/test',
  user: 'testuser',
};

const PIXABAY_NON_FOOD_HIT = {
  webformatURL: 'https://cdn.pixabay.com/photo/other.jpg',
  tags: 'landscape, nature, mountain',
  pageURL: 'https://pixabay.com/photos/other',
  user: 'testuser2',
};

beforeEach(() => {
  jest.resetAllMocks();
});

test('findImageForRecipe: returns Pixabay result when tags contain food keyword', async () => {
  global.fetch = jest.fn().mockResolvedValueOnce({
    ok: true,
    json: async () => ({ hits: [PIXABAY_HIT] }),
  } as unknown as Response);

  const result = await findImageForRecipe(RECIPE, OPTS);
  expect(result?.credit.source).toBe('pixabay');
  expect(result?.imageUrl).toBe(PIXABAY_HIT.webformatURL);
});

test('findImageForRecipe: skips Pixabay result when tags have no food keyword', async () => {
  // Pixabay returns non-food hit → fallthrough to Wikimedia (returns null) → Unsplash (returns null)
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    json: async () => ({ hits: [PIXABAY_NON_FOOD_HIT], query: { search: [] }, results: [] }),
  } as unknown as Response);

  const result = await findImageForRecipe(RECIPE, OPTS);
  expect(result).toBeNull();
});

test('findImageForRecipe: skips excluded source', async () => {
  // Pixabay excluded → first real call is Wikimedia search → returns a food file title
  // File:Pasta dish.jpg — "dish" IS in FOOD_KEYWORDS when split, so it passes the filter
  global.fetch = jest.fn().mockResolvedValueOnce({
    ok: true,
    json: async () => ({ query: { search: [{ title: 'File:Pasta dish.jpg' }] } }),
  } as unknown as Response).mockResolvedValueOnce({
    ok: true,
    json: async () => ({
      query: {
        pages: {
          '1': {
            imageinfo: [{
              url: 'https://upload.wikimedia.org/test.jpg',
              extmetadata: {
                LicenseShortName: { value: 'CC BY-SA 4.0' },
                LicenseUrl: { value: 'https://creativecommons.org/licenses/by-sa/4.0/' },
                Artist: { value: 'Author Name' },
              },
            }],
          },
        },
      },
    }),
  } as unknown as Response);

  const result = await findImageForRecipe(RECIPE, { ...OPTS, excludeSources: ['pixabay'] });
  expect(result?.credit.source).toBe('wikimedia');
  expect(result?.tier).toBe(2);
});

test('findImageForRecipe: returns null when all sources exhausted', async () => {
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    json: async () => ({ hits: [], query: { search: [] }, results: [] }),
  } as unknown as Response);

  const result = await findImageForRecipe(RECIPE, OPTS);
  expect(result).toBeNull();
});

test('findImageForRecipe: tries ingredient fallback when title search fails', async () => {
  // "Easy Stew" → buildIngredientQuery strips "Easy " → fallback = "Stew"
  // Title query URL contains "Easy%20Stew"; fallback URL contains "q=Stew" without "Easy".
  // URL discrimination alone (no callCount) distinguishes title pass from fallback pass.
  global.fetch = jest.fn().mockImplementation(async (url: string) => {
    const isFallback = typeof url === 'string' && url.includes('q=Stew') && !url.includes('Easy');
    return {
      ok: true,
      json: async () =>
        isFallback
          ? { hits: [PIXABAY_HIT] }
          : { hits: [], query: { search: [] }, results: [] },
    };
  });

  const recipe: RecipeLike = { id: 'r2', title: 'Easy Stew' };
  const result = await findImageForRecipe(recipe, OPTS);
  expect(result?.credit.source).toBe('pixabay');
});

test('findImageForRecipe: gracefully handles ok:false fetch response', async () => {
  global.fetch = jest.fn().mockResolvedValue({
    ok: false,
    json: async () => ({}),
  } as unknown as Response);

  const result = await findImageForRecipe(RECIPE, OPTS);
  expect(result).toBeNull(); // pipeline must not throw
});

test('findImageForRecipe: gracefully handles fetch network error', async () => {
  global.fetch = jest.fn().mockRejectedValue(new Error('network'));

  const result = await findImageForRecipe(RECIPE, OPTS);
  expect(result).toBeNull(); // pipeline must not throw
});
