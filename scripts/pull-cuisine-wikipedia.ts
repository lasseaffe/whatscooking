/**
 * pull-cuisine-wikipedia.ts
 * Fetches Wikipedia intro extracts for cuisines that have a `wikiTitle` field
 * and writes them to src/lib/cuisine-wikipedia-cache.ts
 *
 * Usage: npx tsx scripts/pull-cuisine-wikipedia.ts
 */

import { fileURLToPath } from "url";
import path from "path";
import fs from "fs";
import { CUISINES } from "../src/lib/cuisines.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const OUTPUT_PATH = path.join(
  __dirname,
  "..",
  "src",
  "lib",
  "cuisine-wikipedia-cache.ts"
);

interface WikiEntry {
  extract: string;
  source: string;
}

async function fetchWikiExtract(title: string): Promise<WikiEntry | null> {
  const encoded = encodeURIComponent(title);
  const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${encoded}`;

  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "WhatsCooking/1.0 (lasse.kusch@gmail.com)" },
    });

    if (!res.ok) {
      console.warn(`  Wikipedia returned ${res.status} for "${title}"`);
      return null;
    }

    const data = (await res.json()) as {
      extract?: string;
      content_urls?: { desktop?: { page?: string } };
    };

    const extract = data.extract ?? "";
    const source =
      data.content_urls?.desktop?.page ??
      `https://en.wikipedia.org/wiki/${encoded}`;

    return { extract, source };
  } catch (err) {
    console.error(`  Fetch error for "${title}":`, err);
    return null;
  }
}

async function main() {
  const cuisinesWithWiki = CUISINES.filter((c) => c.wikiTitle);

  if (cuisinesWithWiki.length === 0) {
    console.log("No cuisines have a wikiTitle set. Nothing to do.");
    return;
  }

  console.log(
    `Fetching Wikipedia extracts for ${cuisinesWithWiki.length} cuisine(s)…`
  );

  const cache: Record<string, WikiEntry> = {};

  for (const cuisine of cuisinesWithWiki) {
    console.log(`  → ${cuisine.slug} ("${cuisine.wikiTitle}")`);
    const entry = await fetchWikiExtract(cuisine.wikiTitle!);
    if (entry) {
      cache[cuisine.slug] = entry;
      console.log(`     ✓ ${entry.extract.slice(0, 80)}…`);
    } else {
      console.log(`     ✗ skipped`);
    }
  }

  const lines: string[] = [
    "// AUTO-GENERATED — do not edit by hand.",
    "// Run: npx tsx scripts/pull-cuisine-wikipedia.ts",
    "",
    "export interface WikiCacheEntry {",
    "  extract: string;",
    "  source: string;",
    "}",
    "",
    "export const CUISINE_WIKI_CACHE: Record<string, WikiCacheEntry> = {",
  ];

  for (const [slug, { extract, source }] of Object.entries(cache)) {
    const safeExtract = extract.replace(/`/g, "'").replace(/\\/g, "\\\\");
    const safeSource = source.replace(/`/g, "'");
    lines.push(`  ${slug}: {`);
    lines.push(`    extract: \`${safeExtract}\`,`);
    lines.push(`    source: \`${safeSource}\`,`);
    lines.push(`  },`);
  }

  lines.push("};");
  lines.push("");

  fs.writeFileSync(OUTPUT_PATH, lines.join("\n"), "utf8");
  console.log(`\nWrote ${Object.keys(cache).length} entry/entries to:`);
  console.log(`  ${OUTPUT_PATH}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
