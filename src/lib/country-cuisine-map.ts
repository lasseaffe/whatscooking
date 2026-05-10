/**
 * Maps cuisine slugs to world-atlas ISO numeric country codes.
 * Used by the world map to color pinned countries.
 * Numeric codes = ISO 3166-1 numeric (matches topojson world-atlas data).
 */

export interface CountryInfo {
  isoNumeric: string; // zero-padded ISO numeric, e.g. "250"
  name: string;
  flag: string;
  cuisineSlug: string;
}

export const CUISINE_COUNTRIES: CountryInfo[] = [
  { isoNumeric: "250", name: "France",       flag: "🇫🇷", cuisineSlug: "french"     },
  { isoNumeric: "380", name: "Italy",         flag: "🇮🇹", cuisineSlug: "italian"    },
  { isoNumeric: "724", name: "Spain",         flag: "🇪🇸", cuisineSlug: "spanish"    },
  { isoNumeric: "620", name: "Portugal",      flag: "🇵🇹", cuisineSlug: "portuguese" },
  { isoNumeric: "300", name: "Greece",        flag: "🇬🇷", cuisineSlug: "greek"      },
  { isoNumeric: "484", name: "Mexico",        flag: "🇲🇽", cuisineSlug: "mexican"    },
  { isoNumeric: "840", name: "United States", flag: "🇺🇸", cuisineSlug: "tex-mex"    },
  { isoNumeric: "392", name: "Japan",         flag: "🇯🇵", cuisineSlug: "japanese"   },
  { isoNumeric: "704", name: "Vietnam",       flag: "🇻🇳", cuisineSlug: "vietnamese" },
  { isoNumeric: "156", name: "China",         flag: "🇨🇳", cuisineSlug: "chinese"    },
  { isoNumeric: "410", name: "South Korea",   flag: "🇰🇷", cuisineSlug: "korean"     },
  { isoNumeric: "764", name: "Thailand",      flag: "🇹🇭", cuisineSlug: "thai"       },
  { isoNumeric: "356", name: "India",         flag: "🇮🇳", cuisineSlug: "indian"     },
  { isoNumeric: "504", name: "Morocco",       flag: "🇲🇦", cuisineSlug: "moroccan"   },
  { isoNumeric: "788", name: "Tunisia",       flag: "🇹🇳", cuisineSlug: "tunisian"   },
  { isoNumeric: "422", name: "Lebanon",       flag: "🇱🇧", cuisineSlug: "lebanese"   },
  { isoNumeric: "818", name: "Egypt",         flag: "🇪🇬", cuisineSlug: "egyptian"      },
  { isoNumeric: "566", name: "Nigeria",       flag: "🇳🇬", cuisineSlug: "nigerian"      },
  { isoNumeric: "288", name: "Ghana",         flag: "🇬🇭", cuisineSlug: "ghanaian"      },
  { isoNumeric: "231", name: "Ethiopia",      flag: "🇪🇹", cuisineSlug: "ethiopian"     },
  { isoNumeric: "686", name: "Senegal",       flag: "🇸🇳", cuisineSlug: "senegalese"    },
  { isoNumeric: "710", name: "South Africa",  flag: "🇿🇦", cuisineSlug: "south-african" },
  { isoNumeric: "404", name: "Kenya",         flag: "🇰🇪", cuisineSlug: "kenyan"        },
  { isoNumeric: "384", name: "Côte d'Ivoire", flag: "🇨🇮", cuisineSlug: "ivorian"       },
];

/** slug → CountryInfo */
export const CUISINE_SLUG_TO_COUNTRY = Object.fromEntries(
  CUISINE_COUNTRIES.map((c) => [c.cuisineSlug, c])
);

/** ISO numeric string → CountryInfo */
export const ISO_TO_COUNTRY = Object.fromEntries(
  CUISINE_COUNTRIES.map((c) => [c.isoNumeric, c])
);

/** Set of all known ISO numeric strings */
export const KNOWN_ISO_SET = new Set(CUISINE_COUNTRIES.map((c) => c.isoNumeric));
