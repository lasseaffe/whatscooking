import { test, expect } from "@playwright/test";

const RECIPE_ID = "00000000-0000-0000-0000-00000000e2e1";
const URL1 = "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600";
const URL2 = "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600";

test.describe("Image controls", () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      Object.keys(localStorage)
        .filter((k) => k.startsWith("wc-img-prefs::"))
        .forEach((k) => localStorage.removeItem(k));
    });
  });

  test("chevron cycles through image_urls", async ({ page }) => {
    await page.goto(`/recipes/${RECIPE_ID}`);
    const hero = page.locator(".group").first();
    await hero.hover();

    const img = hero.locator("img").first();
    await expect(img).toHaveAttribute("src", URL1);

    await page.getByTestId("image-chevron-next").first().click();
    await expect(img).toHaveAttribute("src", URL2);

    await page.getByTestId("image-chevron-prev").first().click();
    await expect(img).toHaveAttribute("src", URL1);
  });

  test("crop modal opens and cancels without saving", async ({ page }) => {
    await page.goto(`/recipes/${RECIPE_ID}`);
    const hero = page.locator(".group").first();
    await hero.hover();

    const cropBtn = page.getByTestId("image-crop-button").first();
    await expect(cropBtn).toBeVisible();
    await cropBtn.click();

    await expect(page.getByTestId("crop-editor-modal")).toBeVisible();
    await page.getByTestId("crop-editor-cancel").click();
    await expect(page.getByTestId("crop-editor-modal")).toHaveCount(0);
  });

  test("drag + save persists to localStorage and fires POST", async ({ page }) => {
    let postFired = false;
    await page.route("**/api/image-prefs", (route) => {
      if (route.request().method() === "POST") postFired = true;
      route.continue();
    });

    await page.goto(`/recipes/${RECIPE_ID}`);
    const hero = page.locator(".group").first();
    await hero.hover();
    await page.getByTestId("image-crop-button").first().click();

    const modalImg = page.getByTestId("crop-editor-image");
    const box = await modalImg.boundingBox();
    if (!box) throw new Error("modal image not measured");

    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width / 2 + 80, box.y + box.height / 2 + 40, { steps: 10 });
    await page.mouse.up();

    await page.getByTestId("crop-editor-save").click();
    await expect(page.getByTestId("crop-editor-modal")).toHaveCount(0);

    const stored = await page.evaluate(
      (key) => localStorage.getItem(key),
      `wc-img-prefs::${RECIPE_ID}::${URL1}`
    );
    expect(stored).not.toBeNull();
    const pos = JSON.parse(stored!);
    expect(pos.x).toBeGreaterThan(0);
    expect(pos.y).toBeGreaterThan(0);
    expect(pos.x).not.toBe(50);
    expect(postFired).toBe(true);
  });

  test("crop persists after reload", async ({ page }) => {
    await page.addInitScript(
      ([key, val]) => localStorage.setItem(key, val),
      [`wc-img-prefs::${RECIPE_ID}::${URL1}`, JSON.stringify({ x: 20, y: 80 })]
    );
    await page.goto(`/recipes/${RECIPE_ID}`);
    const img = page.locator(".group").first().locator("img").first();
    await expect(img).toHaveCSS("object-position", /20%\s+80%/);
  });

  test("non-admin sees chevrons but no crop button", async ({ page, context }) => {
    await context.clearCookies();
    await page.goto(`/recipes/${RECIPE_ID}`);
    const hero = page.locator(".group").first();
    await hero.hover();
    await expect(page.getByTestId("image-chevron-next").first()).toBeVisible();
    await expect(page.getByTestId("image-crop-button")).toHaveCount(0);
  });
});
