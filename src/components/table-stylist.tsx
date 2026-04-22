"use client";

import { useState } from "react";

type Occasion = "casual" | "intimate" | "festive";

interface PlatingGuide {
  plate: string;
  garnish: string;
  layout: string;
  drink: string;
  tip: string;
}

const GUIDES: Record<Occasion, PlatingGuide> = {
  casual: {
    plate: "Wide rimmed bowls or rustic stoneware — imperfection is charming",
    garnish: "Fresh herbs torn by hand, a crack of black pepper, a drizzle of olive oil",
    layout: "Generous heap in the centre. No fuss — let the food speak",
    drink: "House wine, craft beer, or sparkling water with lemon",
    tip: "Warm your plates in the oven for 2 minutes. Cold plates kill the vibe.",
  },
  intimate: {
    plate: "White porcelain or matte black — clean lines draw the eye to the food",
    garnish: "Micro herbs, edible flowers, paper-thin radish or citrus zest curls",
    layout: "Off-centre plating — place protein at 6 o'clock, sauce swooped left, veg at 11",
    drink: "A wine pairing that complements the dish — ask a sommelier or use Vivino",
    tip: "Less is more. Three elements max on the plate. Negative space looks expensive.",
  },
  festive: {
    plate: "Large sharing platters or boards — abundance is the point",
    garnish: "Pomegranate seeds, toasted nuts, fresh citrus slices, edible gold if you're feeling it",
    layout: "Layer colours and heights — pile high, scatter garnish, add sauce in small bowls on the side",
    drink: "Champagne, Aperol Spritz, or a festive punch bowl for the table",
    tip: "Set the table first. Candles + linen napkins transform any meal into an event.",
  },
};

function detectOccasion(title: string, dietaryTags: string[]): Occasion {
  const lower = title.toLowerCase();
  if (lower.match(/christmas|holiday|thanksgiving|feast|celebration|party|wedding|gala|banquet/)) return "festive";
  if (lower.match(/date|romantic|valentines|anniversary|special|surprise|intimate/)) return "intimate";
  return "casual";
}

const OCCASION_LABELS: { id: Occasion; label: string; icon: string }[] = [
  { id: "casual",   label: "Casual",   icon: "🍽️" },
  { id: "intimate", label: "Intimate", icon: "🕯️" },
  { id: "festive",  label: "Festive",  icon: "🥂" },
];

interface Props {
  title: string;
  dietaryTags?: string[];
}

export function TableStylist({ title, dietaryTags = [] }: Props) {
  const [occasion, setOccasion] = useState<Occasion>(detectOccasion(title, dietaryTags));
  const guide = GUIDES[occasion];

  return (
    <div className="mt-8">
      <div className="flex items-center gap-2 mb-4">
        <h2 className="text-lg font-bold" style={{ color: "#3D2817", fontFamily: "'Libre Baskerville', Georgia, serif" }}>
          Phase IV: Table Styling
        </h2>
        <span className="text-xs px-2 py-0.5 rounded-full font-medium ml-auto" style={{ background: "#C85A2F15", color: "#C85A2F" }}>
          Occasion-based
        </span>
      </div>

      {/* Occasion toggle */}
      <div className="flex rounded-xl overflow-hidden border mb-4" style={{ borderColor: "#DDD5C8" }}>
        {OCCASION_LABELS.map(({ id, label, icon }) => (
          <button
            key={id}
            onClick={() => setOccasion(id)}
            className="flex-1 py-2.5 text-xs font-semibold transition-all flex items-center justify-center gap-1.5"
            style={{
              background: occasion === id ? "#5D4037" : "#fff",
              color: occasion === id ? "#fff" : "#6B5B52",
            }}
          >
            {icon} {label}
          </button>
        ))}
      </div>

      {/* Guide cards */}
      <div className="rounded-2xl border p-5 space-y-3" style={{ borderColor: "#DDD5C8", background: "#F7F4EE" }}>
        {[
          { icon: "🫙", label: "Serve on", value: guide.plate },
          { icon: "🌿", label: "Garnish", value: guide.garnish },
          { icon: "📐", label: "Layout", value: guide.layout },
          { icon: "🍷", label: "Drink pairing", value: guide.drink },
        ].map(({ icon, label, value }) => (
          <div key={label} className="flex gap-3">
            <span className="text-base shrink-0 mt-0.5">{icon}</span>
            <div>
              <p className="text-xs font-bold mb-0.5" style={{ color: "#A69180" }}>{label}</p>
              <p className="text-sm" style={{ color: "#3D2817" }}>{value}</p>
            </div>
          </div>
        ))}

        {/* Pro tip */}
        <div className="mt-3 pt-3 flex gap-3" style={{ borderTop: "1px solid #DDD5C8" }}>
          <span className="text-base shrink-0">💡</span>
          <p className="text-xs italic" style={{ color: "#828E6F" }}>{guide.tip}</p>
        </div>
      </div>
    </div>
  );
}
