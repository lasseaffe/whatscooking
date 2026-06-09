// World Cup 2026 — canonical TEAM registry (allegiance).
//
// Source of truth for "who can I root for" and "which matchdays are mine".
// Derived from the codes actually seeded into `wc_fixtures`
// (see scripts/seed-wc2026-fixtures.mjs) so every pickable team has real
// matches. Display + cuisine data is reused from the wc2026.ts cuisine
// catalog where the nation exists there, with minimal inline entries for
// teams the catalog doesn't cover.
//
// NOTE: this is intentionally distinct from WC2026_NATIONS in wc2026.ts.
// That list is the *cuisine catalog* powering the passport challenge and
// /cuisines routes (a broader set, keyed by ISO-2 incl. GB-ENG/GB-SCT).
// This list is the *playing field* (48 qualified teams keyed by the exact
// fixture code, where England == "GB"). They overlap but are not identical.

import { WC2026_NATIONS, CONF_COLORS, type WCNation } from "./wc2026";

export interface WCTeam {
  /** Matches wc_fixtures.home_code / away_code exactly (ISO-2; "GB" = England). */
  code: string;
  flag: string;
  name: string;
  /** recipes.cuisine_type used to resolve the team's signature dishes. "" if unknown. */
  cuisine: string;
  /** Slug into /cuisines/world-cup-2026/[country] when the catalog covers it. */
  countrySlug?: string;
  /** Confederation / host bucket for grouping in the picker. */
  confederation: string;
}

// The 48 fixture codes, in group order (A→L). MUST stay in sync with
// scripts/seed-wc2026-fixtures.mjs ISO2 mapping.
const FIXTURE_TEAM_CODES: string[] = [
  "US", "PA", "HN", "JM", // A
  "MX", "EC", "VE", "CD", // B
  "CA", "MA", "HR", "BE", // C
  "BR", "PY", "CR", "AU", // D
  "AR", "CL", "PE", "NZ", // E
  "ES", "EG", "DO", "NC", // F
  "PT", "CZ", "TR", "ID", // G
  "FR", "UY", "UA", "TZ", // H
  "GB", "RS", "NL", "CF", // I (GB = England)
  "DE", "JP", "CO", "IR", // J
  "IT", "SA", "KR", "GH", // K
  "SN", "DZ", "ML", "GN", // L
];

// Teams not present in the wc2026.ts cuisine catalog — minimal display data.
const EXTRA_TEAMS: Record<string, { flag: string; name: string; cuisine: string; confederation: string }> = {
  HN: { flag: "🇭🇳", name: "Honduras", cuisine: "Honduran", confederation: "CONCACAF" },
  VE: { flag: "🇻🇪", name: "Venezuela", cuisine: "Venezuelan", confederation: "CONMEBOL" },
  PE: { flag: "🇵🇪", name: "Peru", cuisine: "Peruvian", confederation: "CONMEBOL" },
  DO: { flag: "🇩🇴", name: "Dominican Republic", cuisine: "Dominican", confederation: "CONCACAF" },
  NC: { flag: "🇳🇨", name: "New Caledonia", cuisine: "French", confederation: "OFC" },
  ID: { flag: "🇮🇩", name: "Indonesia", cuisine: "Indonesian", confederation: "AFC" },
  RS: { flag: "🇷🇸", name: "Serbia", cuisine: "Serbian", confederation: "UEFA" },
  CF: { flag: "🇨🇫", name: "Central African Republic", cuisine: "Central African", confederation: "CAF" },
  GN: { flag: "🇬🇳", name: "Guinea", cuisine: "Guinean", confederation: "CAF" },
};

/** Catalog lookup, remapping England's GB-ENG → fixture code "GB". */
function nationByFixtureCode(code: string): WCNation | undefined {
  if (code === "GB") return WC2026_NATIONS.find((n) => n.iso2 === "GB-ENG");
  return WC2026_NATIONS.find((n) => n.iso2 === code);
}

export const WC_TEAMS: WCTeam[] = FIXTURE_TEAM_CODES.map((code) => {
  const nation = nationByFixtureCode(code);
  if (nation) {
    return {
      code,
      flag: nation.flag,
      name: nation.name,
      cuisine: nation.cuisine,
      countrySlug: nation.countrySlug,
      confederation: nation.group,
    };
  }
  const extra = EXTRA_TEAMS[code];
  return {
    code,
    flag: extra?.flag ?? "🏳️",
    name: extra?.name ?? code,
    cuisine: extra?.cuisine ?? "",
    confederation: extra?.confederation ?? "UEFA",
  };
});

const TEAM_BY_CODE = new Map(WC_TEAMS.map((t) => [t.code, t]));

export function getTeamByCode(code: string): WCTeam | undefined {
  return TEAM_BY_CODE.get(code);
}

/** Confederation accent color (reuses the catalog's palette). */
export function teamColor(team: Pick<WCTeam, "confederation">): string {
  return CONF_COLORS[team.confederation] ?? "#C8522A";
}

/** Display order for confederation sections in the picker. */
export const CONFEDERATION_ORDER = ["Host", "UEFA", "CONMEBOL", "CONCACAF", "CAF", "AFC", "OFC"];

/** flagcdn image URL for a fixture code (mirrors wc-matchday-panel). */
export function teamFlagUrl(code: string, width: 20 | 40 | 80 = 40): string {
  const c = code === "GB-ENG" || code === "GB-SCT" || code === "GB" ? "gb" : code.toLowerCase();
  return `https://flagcdn.com/w${width}/${c}.png`;
}
