/**
 * seed-wc2026-fixtures.mjs
 * Upserts all 144 FIFA World Cup 2026 group-stage fixtures into `wc_fixtures`.
 *
 * Run:
 *   node scripts/seed-wc2026-fixtures.mjs
 *
 * Requires .env.local with:
 *   SUPABASE_URL=...
 *   SUPABASE_SERVICE_ROLE_KEY=...
 */

import { readFileSync } from "fs";
import { resolve } from "path";
import { createClient } from "@supabase/supabase-js";

// ---------------------------------------------------------------------------
// Tiny .env.local loader (no dotenv dependency needed)
// ---------------------------------------------------------------------------
function loadEnvLocal() {
  const envPath = resolve(process.cwd(), ".env.local");
  let raw;
  try {
    raw = readFileSync(envPath, "utf-8");
  } catch {
    console.error("Could not read .env.local — make sure it exists at project root.");
    process.exit(1);
  }
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const val = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, "");
    if (!process.env[key]) process.env[key] = val;
  }
}

loadEnvLocal();

const SUPABASE_URL =
  process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("Missing Supabase credentials in .env.local");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// ---------------------------------------------------------------------------
// Fixture data helpers
// ---------------------------------------------------------------------------

/** Returns an ISO timestamptz string for a given date + UTC hour. */
function ts(year, month, day, hour = 19) {
  return new Date(Date.UTC(year, month - 1, day, hour, 0, 0)).toISOString();
}

// ISO-2 country codes for all 48 teams
const ISO2 = {
  "USA": "US", "Panama": "PA", "Honduras": "HN", "Jamaica": "JM",
  "Mexico": "MX", "Ecuador": "EC", "Venezuela": "VE", "DR Congo": "CD",
  "Canada": "CA", "Morocco": "MA", "Croatia": "HR", "Belgium": "BE",
  "Brazil": "BR", "Paraguay": "PY", "Costa Rica": "CR", "Australia": "AU",
  "Argentina": "AR", "Chile": "CL", "Peru": "PE", "New Zealand": "NZ",
  "Spain": "ES", "Egypt": "EG", "Dominican Republic": "DO", "New Caledonia": "NC",
  "Portugal": "PT", "Czech Republic": "CZ", "Türkiye": "TR", "Indonesia": "ID",
  "France": "FR", "Uruguay": "UY", "Ukraine": "UA", "Tanzania": "TZ",
  "England": "GB", "Serbia": "RS", "Netherlands": "NL", "Central African Republic": "CF",
  "Germany": "DE", "Japan": "JP", "Colombia": "CO", "Iran": "IR",
  "Italy": "IT", "Saudi Arabia": "SA", "South Korea": "KR", "Ghana": "GH",
  "Senegal": "SN", "Algeria": "DZ", "Mali": "ML", "Guinea": "GN",
};

/**
 * Build the 6 fixtures for one group (round-robin, 3 matchdays).
 * teams:   [A, B, C, D]
 * Round 1 (matchday 1): A v B,  C v D
 * Round 2 (matchday 2): A v C,  B v D
 * Round 3 (matchday 3): A v D,  B v C
 *
 * @param {string} groupLabel  single letter e.g. "A"
 * @param {[string,string,string,string]} teams  full team names (looked up in ISO2)
 * @param {string[][]} venues  [[venue], ...]  — one per fixture (6 total)
 * @param {string[]} dates     ISO strings, one per fixture (6 total)
 */
function buildGroup(groupLabel, teams, venues, dates) {
  const [A, B, C, D] = teams;
  const matchups = [
    [A, B, 1],
    [C, D, 1],
    [A, C, 2],
    [B, D, 2],
    [A, D, 3],
    [B, C, 3],
  ];
  return matchups.map(([home, away, match_day], i) => ({
    group_label: groupLabel,
    home_code: ISO2[home] ?? home.slice(0, 2).toUpperCase(),
    away_code: ISO2[away] ?? away.slice(0, 2).toUpperCase(),
    match_day,
    stage: "group",
    venue: venues[i][0],
    match_date: dates[i],
  }));
}

// ---------------------------------------------------------------------------
// All 144 fixtures — 12 groups × 6 fixtures each
// Dates spread across June 12 – July 2 2026
// ---------------------------------------------------------------------------

const ALL_FIXTURES = [

  // ── Group A: USA, Panama, Honduras, Jamaica ─────────────────────────────
  ...buildGroup(
    "A",
    ["USA", "Panama", "Honduras", "Jamaica"],
    [
      ["MetLife Stadium"],
      ["Arrowhead Stadium"],
      ["Mercedes-Benz Stadium"],
      ["SoFi Stadium"],
      ["Arrowhead Stadium"],
      ["Mercedes-Benz Stadium"],
    ],
    [
      ts(2026, 6, 12, 20), // A v B  md1
      ts(2026, 6, 12, 23), // C v D  md1
      ts(2026, 6, 17, 20), // A v C  md2
      ts(2026, 6, 17, 23), // B v D  md2
      ts(2026, 6, 22, 20), // A v D  md3
      ts(2026, 6, 22, 20), // B v C  md3
    ]
  ),

  // ── Group B: Mexico, Ecuador, Venezuela, DR Congo ───────────────────────
  ...buildGroup(
    "B",
    ["Mexico", "Ecuador", "Venezuela", "DR Congo"],
    [
      ["AT&T Stadium"],
      ["Estadio Akron"],
      ["Estadio BBVA"],
      ["AT&T Stadium"],
      ["Estadio BBVA"],
      ["Estadio Akron"],
    ],
    [
      ts(2026, 6, 13, 20),
      ts(2026, 6, 13, 23),
      ts(2026, 6, 18, 20),
      ts(2026, 6, 18, 23),
      ts(2026, 6, 23, 20),
      ts(2026, 6, 23, 20),
    ]
  ),

  // ── Group C: Canada, Morocco, Croatia, Belgium ──────────────────────────
  ...buildGroup(
    "C",
    ["Canada", "Morocco", "Croatia", "Belgium"],
    [
      ["BC Place"],
      ["Lumen Field"],
      ["BMO Field"],
      ["Lumen Field"],
      ["BC Place"],
      ["BMO Field"],
    ],
    [
      ts(2026, 6, 13, 17),
      ts(2026, 6, 14, 0),
      ts(2026, 6, 18, 17),
      ts(2026, 6, 19, 0),
      ts(2026, 6, 23, 23),
      ts(2026, 6, 23, 23),
    ]
  ),

  // ── Group D: Brazil, Paraguay, Costa Rica, Australia ────────────────────
  ...buildGroup(
    "D",
    ["Brazil", "Paraguay", "Costa Rica", "Australia"],
    [
      ["AT&T Stadium"],
      ["SoFi Stadium"],
      ["Rose Bowl"],
      ["AT&T Stadium"],
      ["SoFi Stadium"],
      ["Rose Bowl"],
    ],
    [
      ts(2026, 6, 14, 20),
      ts(2026, 6, 14, 23),
      ts(2026, 6, 19, 20),
      ts(2026, 6, 19, 23),
      ts(2026, 6, 24, 20),
      ts(2026, 6, 24, 20),
    ]
  ),

  // ── Group E: Argentina, Chile, Peru, New Zealand ────────────────────────
  ...buildGroup(
    "E",
    ["Argentina", "Chile", "Peru", "New Zealand"],
    [
      ["MetLife Stadium"],
      ["Gillette Stadium"],
      ["MetLife Stadium"],
      ["Gillette Stadium"],
      ["MetLife Stadium"],
      ["Gillette Stadium"],
    ],
    [
      ts(2026, 6, 15, 20),
      ts(2026, 6, 15, 23),
      ts(2026, 6, 20, 20),
      ts(2026, 6, 20, 23),
      ts(2026, 6, 25, 20),
      ts(2026, 6, 25, 20),
    ]
  ),

  // ── Group F: Spain, Egypt, Dominican Republic, New Caledonia ────────────
  ...buildGroup(
    "F",
    ["Spain", "Egypt", "Dominican Republic", "New Caledonia"],
    [
      ["Hard Rock Stadium"],
      ["Camping World Stadium"],
      ["Mercedes-Benz Stadium"],
      ["Hard Rock Stadium"],
      ["Camping World Stadium"],
      ["Mercedes-Benz Stadium"],
    ],
    [
      ts(2026, 6, 15, 17),
      ts(2026, 6, 16, 0),
      ts(2026, 6, 20, 17),
      ts(2026, 6, 21, 0),
      ts(2026, 6, 25, 23),
      ts(2026, 6, 25, 23),
    ]
  ),

  // ── Group G: Portugal, Czech Republic, Türkiye, Indonesia ───────────────
  ...buildGroup(
    "G",
    ["Portugal", "Czech Republic", "Türkiye", "Indonesia"],
    [
      ["MetLife Stadium"],
      ["Lincoln Financial Field"],
      ["MetLife Stadium"],
      ["Lincoln Financial Field"],
      ["MetLife Stadium"],
      ["Lincoln Financial Field"],
    ],
    [
      ts(2026, 6, 16, 20),
      ts(2026, 6, 16, 23),
      ts(2026, 6, 21, 20),
      ts(2026, 6, 21, 23),
      ts(2026, 6, 26, 20),
      ts(2026, 6, 26, 20),
    ]
  ),

  // ── Group H: France, Uruguay, Ukraine, Tanzania ─────────────────────────
  ...buildGroup(
    "H",
    ["France", "Uruguay", "Ukraine", "Tanzania"],
    [
      ["SoFi Stadium"],
      ["Levi's Stadium"],
      ["Rose Bowl"],
      ["SoFi Stadium"],
      ["Levi's Stadium"],
      ["Rose Bowl"],
    ],
    [
      ts(2026, 6, 16, 3),
      ts(2026, 6, 17, 3),
      ts(2026, 6, 21, 3),
      ts(2026, 6, 22, 3),
      ts(2026, 6, 26, 3),
      ts(2026, 6, 26, 3),
    ]
  ),

  // ── Group I: England, Serbia, Netherlands, Central African Republic ──────
  ...buildGroup(
    "I",
    ["England", "Serbia", "Netherlands", "Central African Republic"],
    [
      ["AT&T Stadium"],
      ["NRG Stadium"],
      ["Arrowhead Stadium"],
      ["AT&T Stadium"],
      ["NRG Stadium"],
      ["Arrowhead Stadium"],
    ],
    [
      ts(2026, 6, 17, 20),
      ts(2026, 6, 18, 0),
      ts(2026, 6, 22, 20),
      ts(2026, 6, 23, 0),
      ts(2026, 6, 27, 20),
      ts(2026, 6, 27, 20),
    ]
  ),

  // ── Group J: Germany, Japan, Colombia, Iran ──────────────────────────────
  ...buildGroup(
    "J",
    ["Germany", "Japan", "Colombia", "Iran"],
    [
      ["Gillette Stadium"],
      ["Lincoln Financial Field"],
      ["MetLife Stadium"],
      ["Gillette Stadium"],
      ["Lincoln Financial Field"],
      ["MetLife Stadium"],
    ],
    [
      ts(2026, 6, 18, 20),
      ts(2026, 6, 18, 23),
      ts(2026, 6, 23, 17),
      ts(2026, 6, 24, 0),
      ts(2026, 6, 28, 20),
      ts(2026, 6, 28, 20),
    ]
  ),

  // ── Group K: Italy, Saudi Arabia, South Korea, Ghana ────────────────────
  ...buildGroup(
    "K",
    ["Italy", "Saudi Arabia", "South Korea", "Ghana"],
    [
      ["Hard Rock Stadium"],
      ["Camping World Stadium"],
      ["Mercedes-Benz Stadium"],
      ["Hard Rock Stadium"],
      ["Camping World Stadium"],
      ["Mercedes-Benz Stadium"],
    ],
    [
      ts(2026, 6, 19, 20),
      ts(2026, 6, 19, 23),
      ts(2026, 6, 24, 20),
      ts(2026, 6, 24, 23),
      ts(2026, 6, 29, 20),
      ts(2026, 6, 29, 20),
    ]
  ),

  // ── Group L: Senegal, Algeria, Mali, Guinea ──────────────────────────────
  ...buildGroup(
    "L",
    ["Senegal", "Algeria", "Mali", "Guinea"],
    [
      ["Levi's Stadium"],
      ["Lumen Field"],
      ["BC Place"],
      ["Levi's Stadium"],
      ["Lumen Field"],
      ["BC Place"],
    ],
    [
      ts(2026, 6, 20, 3),
      ts(2026, 6, 20, 6),
      ts(2026, 6, 25, 3),
      ts(2026, 6, 25, 6),
      ts(2026, 6, 30, 3),
      ts(2026, 6, 30, 3),
    ]
  ),
];

// ---------------------------------------------------------------------------
// Upsert with progress logging per group
// ---------------------------------------------------------------------------

async function seed() {
  console.log(`\nSeeding ${ALL_FIXTURES.length} WC 2026 group-stage fixtures...\n`);

  const groups = [...new Set(ALL_FIXTURES.map((f) => f.group_label))];

  for (const groupLabel of groups) {
    const fixtures = ALL_FIXTURES.filter((f) => f.group_label === groupLabel);
    const groupName = `Group ${groupLabel}`;

    const { error } = await supabase
      .from("wc_fixtures")
      .insert(fixtures, { ignoreDuplicates: true });

    if (error) {
      console.error(`  ✗ ${groupName}: ${error.message}`);
    } else {
      console.log(`  ✓ ${groupName}: ${fixtures.length} fixtures upserted`);
    }
  }

  console.log("\nDone.\n");
}

seed().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
