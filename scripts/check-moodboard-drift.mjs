#!/usr/bin/env node
// Moodboard drift check — warns when CSS tokens and moodboard.config.ts diverge.
// Warning-only: exits 0 always. Run on demand: `npm run moodboard:check`.

import fs from "node:fs";
import path from "node:path";
import url from "node:url";

const root = path.resolve(path.dirname(url.fileURLToPath(import.meta.url)), "..");
const CSS_FILE = path.join(root, "src/app/globals.css");
const CONFIG_FILE = path.join(root, "src/app/(app)/moodboard/moodboard.config.ts");

function read(file) {
  if (!fs.existsSync(file)) {
    console.error(`✗ Missing: ${path.relative(root, file)}`);
    return null;
  }
  return fs.readFileSync(file, "utf-8");
}

const css = read(CSS_FILE);
const config = read(CONFIG_FILE);
if (!css || !config) process.exit(0);

const cssVars = new Set();
for (const match of css.matchAll(/(?<![\w-])(--[a-zA-Z0-9-]+)\s*:/g)) {
  cssVars.add(match[1]);
}

const configVars = new Set();
for (const match of config.matchAll(/cssVar:\s*["'](--[a-zA-Z0-9-]+)["']/g)) {
  configVars.add(match[1]);
}

const inCssOnly = [...cssVars].filter((v) => !configVars.has(v)).sort();
const inConfigOnly = [...configVars].filter((v) => !cssVars.has(v)).sort();

// WC has *a lot* of low-level tokens (glow, gradient, shadow, button shadows).
// The moodboard intentionally surfaces only the semantic + WC namespace tokens;
// these prefixes are pure mechanics and don't belong on the moodboard.
const ignoredPrefixes = [
  "--color-", "--font-", "--radius-",
  "--glow-", "--gradient-", "--shadow-",
  "--bg-translucent", "--bg-inverse",
  "--bg-accent-translucent", "--bg-special-translucent",
  "--bg-destructive-translucent", "--bg-positive-translucent", "--bg-attention-translucent",
  "--border-default", "--border-depth", "--border-base", "--border-primary",
  "--border-secondary", "--border-tertiary", "--border-quaternary",
  "--border-translucent", "--border-accent", "--border-destructive",
  "--border-special", "--border-positive", "--border-attention",
  "--fg-emphasis", "--fg-inverse", "--fg-accent", "--fg-destructive",
  "--fg-special", "--fg-positive", "--fg-attention",
  "--bg-depth",
  "--sidebar", "--card", "--popover", "--primary", "--secondary",
  "--muted", "--accent", "--destructive", "--input", "--ring", "--chart",
  "--background", "--foreground", "--radius",
  "--wc-bg-", "--wc-border-", "--wc-text", "--wc-primary", "--wc-secondary",
  "--wc-terracotta", "--wc-sage", "--wc-gold", "--wc-walnut",
  "--wc-linen", "--wc-coffee", "--wc-toffee", "--wc-band-",
  // Recipe-card scoped tokens — internal to RC component, not design-system surface
  "--rc-",
  // Palette internals (--wc-pal-dark/mid/lightest/darkest) — derivatives of --wc-pal-accent
  "--wc-pal-dark", "--wc-pal-mid", "--wc-pal-light", "--wc-pal-lightest", "--wc-pal-darkest",
  // Light-mode mirror tokens — same intent as the dark equivalents
  "--wc-light-",
  // WC accent variants beyond the curated saffron/persimmon
  "--wc-accent-primary", "--wc-floor",
  // Mechanical aliases
  "--bg-quaternary", "--border",
  // Radius scale — covered by config.spacing.radii, not by cssVar
  "--wc-radius-",
  // Sage palette accent variant
  "--wc-pal-sage",
  // Font CSS variables — declared by Next.js's next/font system, not in :root
  "--font-fraunces", "--font-libre-baskerville", "--font-plus-jakarta-sans", "--font-geist-mono",
  // Surface elevations & space scale — mechanical, covered by config.spacing
  "--wc-surface-", "--wc-space-",
];
const ignored = (v) => ignoredPrefixes.some((p) => v === p || v.startsWith(p));
const drifted = inCssOnly.filter((v) => !ignored(v));
const driftedConfig = inConfigOnly.filter((v) => !ignored(v));

if (drifted.length === 0 && driftedConfig.length === 0) {
  console.log("✓ No moodboard drift — every surfaced CSS token is documented in moodboard.config.ts and vice versa.");
  process.exit(0);
}

console.log("⚠ Moodboard drift detected:\n");
if (drifted.length) {
  console.log(`  ${drifted.length} CSS token(s) not yet in moodboard.config.ts:`);
  drifted.forEach((v) => console.log(`    · ${v}`));
}
if (driftedConfig.length) {
  console.log(`\n  ${driftedConfig.length} config token(s) not found in CSS (may be stale):`);
  driftedConfig.forEach((v) => console.log(`    · ${v}`));
}
console.log("\n  Update moodboard.config.ts and log the change in docs/moodboard.log.md.");
process.exit(0);
