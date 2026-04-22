/**
 * generate-pdf.mjs
 *
 * Generates a print-quality PDF from public/feature-overview.html
 * using Playwright (already installed for the scraper).
 *
 * Usage (from project root):
 *   node scripts/generate-pdf.mjs
 *
 * Output: public/feature-overview.pdf
 */

import { chromium } from "playwright";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const htmlPath = path.join(__dirname, "..", "public", "feature-overview.html");
const pdfPath  = path.join(__dirname, "..", "public", "feature-overview.pdf");

if (!fs.existsSync(htmlPath)) {
  console.error("❌  feature-overview.html not found at", htmlPath);
  process.exit(1);
}

console.log("🖨  Launching browser…");
const browser = await chromium.launch();
const page    = await browser.newPage();

await page.goto(`file:///${htmlPath.replace(/\\/g, "/")}`, { waitUntil: "networkidle" });

// Wait for Google Fonts to load (they're @import'd in the HTML)
await page.waitForTimeout(2000);

console.log("📄  Rendering PDF…");
await page.pdf({
  path: pdfPath,
  format: "A4",
  printBackground: true,
  margin: { top: "0mm", right: "0mm", bottom: "0mm", left: "0mm" },
});

await browser.close();
console.log(`✅  PDF saved to: ${pdfPath}`);
