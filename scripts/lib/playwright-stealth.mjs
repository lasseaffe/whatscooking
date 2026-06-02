/**
 * playwright-stealth.mjs
 *
 * Shared stealth browser launcher for image-fixing scripts.
 * Uses playwright-extra + puppeteer-extra-plugin-stealth to evade
 * bot detection on DuckDuckGo and food blog sites.
 *
 * Falls back to plain Playwright chromium if stealth plugin isn't installed.
 */

import { chromium } from "playwright";

const STEALTH_UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
  "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

let _stealthChromium = null;

async function getStealthChromium() {
  if (_stealthChromium) return _stealthChromium;

  try {
    // Try playwright-extra with stealth plugin (must be installed separately)
    const { chromium: extraChromium } = await import("playwright-extra");
    const { default: StealthPlugin } = await import("puppeteer-extra-plugin-stealth");
    extraChromium.use(StealthPlugin());
    _stealthChromium = extraChromium;
    return _stealthChromium;
  } catch {
    // Fall back to standard playwright chromium
    _stealthChromium = { launch: chromium.launch.bind(chromium) };
    return _stealthChromium;
  }
}

/**
 * Launch a stealth browser instance.
 * @returns {{ browser, newStealthPage }}
 */
export async function launchStealthBrowser() {
  const stealthChromium = await getStealthChromium();

  const browser = await stealthChromium.launch({
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-blink-features=AutomationControlled",
      "--disable-infobars",
      "--window-size=1280,800",
    ],
  });

  async function newStealthPage() {
    const context = await browser.newContext({
      viewport: { width: 1280, height: 800 },
      userAgent: STEALTH_UA,
      locale: "en-US",
      extraHTTPHeaders: {
        "Accept-Language": "en-US,en;q=0.9",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Encoding": "gzip, deflate, br",
        "Cache-Control": "no-cache",
        "Pragma": "no-cache",
        "Sec-Fetch-Dest": "document",
        "Sec-Fetch-Mode": "navigate",
        "Sec-Fetch-Site": "none",
        "Sec-Fetch-User": "?1",
        "Upgrade-Insecure-Requests": "1",
      },
    });

    const page = await context.newPage();

    // Override webdriver detection
    await page.addInitScript(() => {
      Object.defineProperty(navigator, "webdriver", { get: () => false });
      Object.defineProperty(navigator, "plugins", { get: () => [1, 2, 3, 4, 5] });
      Object.defineProperty(navigator, "languages", { get: () => ["en-US", "en"] });
      window.chrome = { runtime: {} };
    });

    return page;
  }

  return { browser, newStealthPage };
}

/**
 * Close all contexts and the browser.
 */
export async function closeBrowser(browser) {
  try {
    for (const ctx of browser.contexts()) {
      await ctx.close().catch(() => {});
    }
    await browser.close().catch(() => {});
  } catch {}
}
