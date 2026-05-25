"use client";

import { useState } from "react";
import { detectCulture, type DrinkCulture } from "@/lib/drinks";
import type { CafeMeta, BarMeta, WineMeta, WellnessMeta, ZeroProofMeta } from "@/lib/drinks";

interface Props {
  dishTypes: string[];
  drinkMeta: Record<string, unknown>;
}

const PANEL_TITLES: Record<DrinkCulture, string> = {
  cafe: "Brew Sheet",
  bar: "Cocktail Spec",
  wine: "Sommelier Notes",
  wellness: "Nutrition & Benefits",
  "zero-proof": "Drink Spec",
};

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  if (!value) return null;
  return (
    <div className="drink-pro-row">
      <span className="drink-pro-row__label">{label}</span>
      <span className="drink-pro-row__value">{value}</span>
    </div>
  );
}

function PanelFields({
  culture,
  meta,
}: {
  culture: DrinkCulture;
  meta: Record<string, unknown>;
}) {
  switch (culture) {
    case "cafe": {
      const m = meta as CafeMeta;
      return (
        <>
          <Row label="Method" value={m.method} />
          <Row label="Dose" value={m.dose_g ? `${m.dose_g}g` : undefined} />
          <Row label="Yield" value={m.yield_g ? `${m.yield_g}g` : undefined} />
          <Row label="Water temp" value={m.temp_c ? `${m.temp_c}°C` : undefined} />
          <Row label="Time" value={m.time_s ? `${m.time_s}s` : undefined} />
          <Row label="Ratio" value={m.ratio} />
          <Row label="Grind" value={m.grind} />
          <Row label="Origin" value={m.origin} />
          <Row label="Roast" value={m.roast} />
        </>
      );
    }
    case "bar": {
      const m = meta as BarMeta;
      return (
        <>
          <Row label="Technique" value={m.technique} />
          <Row label="Glassware" value={m.glassware} />
          <Row label="ABV" value={m.abv_pct ? `~${m.abv_pct}%` : undefined} />
          <Row label="Base spirit" value={m.base_spirit} />
          <Row label="Garnish" value={m.garnish} />
          <Row label="Ice" value={m.ice} />
        </>
      );
    }
    case "wine": {
      const m = meta as WineMeta;
      return (
        <>
          <Row label="Varietal" value={m.varietal} />
          <Row label="Region" value={m.region} />
          <Row label="Vintage" value={m.vintage} />
          <Row label="Body" value={m.body} />
          <Row label="Tannins" value={m.tannins} />
          <Row label="Acidity" value={m.acidity} />
          <Row label="Sweetness" value={m.sweetness} />
          <Row
            label="Serving temp"
            value={m.serving_temp_c ? `${m.serving_temp_c}°C` : undefined}
          />
          <Row label="Pairings" value={m.pairings?.join(", ")} />
          {m.tasting_notes && (
            <div className="drink-pro-notes">{m.tasting_notes}</div>
          )}
        </>
      );
    }
    case "wellness": {
      const m = meta as WellnessMeta;
      return (
        <>
          <Row label="Benefits" value={m.benefits?.join(" · ")} />
          <Row label="Superfoods" value={m.superfoods?.join(", ")} />
          <Row label="Raw" value={m.is_raw ? "Yes" : undefined} />
        </>
      );
    }
    case "zero-proof": {
      const m = meta as ZeroProofMeta;
      return (
        <>
          <Row label="Style" value={m.style} />
          <Row label="Carbonation" value={m.carbonation} />
          <Row label="Occasion" value={m.occasion?.join(", ")} />
        </>
      );
    }
    default:
      return null;
  }
}

export function DrinkProPanel({ dishTypes, drinkMeta }: Props) {
  const culture = detectCulture(dishTypes);
  const [open, setOpen] = useState(false);

  if (!culture) return null;

  return (
    <div className="drink-pro-panel">
      <button
        className="drink-pro-panel__toggle"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <span>{PANEL_TITLES[culture]}</span>
        <span className="drink-pro-panel__chevron">{open ? "▲" : "▼"}</span>
      </button>
      {open && (
        <div className="drink-pro-panel__body">
          <PanelFields culture={culture} meta={drinkMeta} />
        </div>
      )}
    </div>
  );
}
