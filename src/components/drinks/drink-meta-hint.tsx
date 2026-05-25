import { detectCulture, type DrinkCulture } from "@/lib/drinks";

interface Props {
  dishTypes: string[];
  drinkMeta: Record<string, unknown>;
}

function buildHints(culture: DrinkCulture | null, meta: Record<string, unknown>): string[] {
  if (!culture) return [];
  switch (culture) {
    case "cafe": {
      const hints: string[] = [];
      if (meta.dose_g && meta.yield_g) hints.push(`${meta.dose_g}g · ${meta.yield_g}g`);
      if (meta.temp_c) hints.push(`${meta.temp_c}°C`);
      if (meta.ratio) hints.push(String(meta.ratio));
      if (meta.origin) hints.push(String(meta.origin));
      return hints.slice(0, 3);
    }
    case "bar": {
      const hints: string[] = [];
      if (meta.technique) hints.push(String(meta.technique));
      if (meta.abv_pct) hints.push(`~${meta.abv_pct}% ABV`);
      if (meta.base_spirit) hints.push(String(meta.base_spirit));
      return hints.slice(0, 3);
    }
    case "wine": {
      const hints: string[] = [];
      if (meta.body) hints.push(`${String(meta.body)} body`);
      if (meta.tannins) hints.push(`${String(meta.tannins)} tannins`);
      if (meta.varietal) hints.push(String(meta.varietal));
      return hints.slice(0, 3);
    }
    case "wellness": {
      const hints: string[] = [];
      if (Array.isArray(meta.benefits) && meta.benefits.length)
        hints.push(`⚡ ${meta.benefits[0]}`);
      if (Array.isArray(meta.superfoods) && meta.superfoods.length)
        hints.push(String(meta.superfoods[0]));
      if (meta.is_raw) hints.push("Raw");
      return hints.slice(0, 3);
    }
    case "zero-proof": {
      const hints: string[] = [];
      if (meta.style) hints.push(String(meta.style));
      hints.push("No-ABV");
      if (meta.carbonation) hints.push(String(meta.carbonation));
      return hints.slice(0, 3);
    }
    default:
      return [];
  }
}

export function DrinkMetaHint({ dishTypes, drinkMeta }: Props) {
  const culture = detectCulture(dishTypes);
  const hints = buildHints(culture, drinkMeta);
  if (!hints.length) return null;

  return (
    <div className="drink-meta-hint">
      {hints.map((hint) => (
        <span key={hint} className="drink-meta-hint__tag">
          {hint}
        </span>
      ))}
    </div>
  );
}
