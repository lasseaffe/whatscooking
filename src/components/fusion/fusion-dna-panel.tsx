"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown, ChevronUp, FlaskConical, Globe, Pencil, ArrowRight } from "lucide-react";
import { FusionDish, FUSION_DISHES } from "@/lib/fusion-foods";

interface FusionDNAPanelProps {
  dish: FusionDish;
  accentColor: string;
}

export function FusionDNAPanel({ dish, accentColor }: FusionDNAPanelProps) {
  const hasContent = dish.flavorBridge?.length || dish.heritage || dish.substitutions?.length;
  if (!hasContent) return null;

  const [open, setOpen] = useState(true);

  const relatedDishes = FUSION_DISHES
    .filter((d) => d.id !== dish.id && d.category === dish.category)
    .slice(0, 3);

  return (
    <div
      className="rounded-2xl border mb-6 overflow-hidden"
      style={{ borderColor: `${accentColor}30`, background: "#FBF6EE" }}
    >
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-5 py-4"
        style={{ color: accentColor }}
      >
        <span className="text-sm font-bold flex items-center gap-2">
          <FlaskConical className="w-4 h-4" />
          Fusion DNA
        </span>
        {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </button>

      {open && (
        <div className="px-5 pb-5 flex flex-col gap-5">
          {/* Flavor Bridge */}
          {dish.flavorBridge && dish.flavorBridge.length > 0 && (
            <section>
              <h3
                className="text-xs font-bold mb-2 flex items-center gap-1.5"
                style={{ color: accentColor }}
              >
                <FlaskConical className="w-3 h-3" /> Flavor Bridge
              </h3>
              <ul className="flex flex-col gap-1">
                {dish.flavorBridge.map((pair, i) => (
                  <li key={i} className="text-sm" style={{ color: "#3D2817" }}>
                    · {pair}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Culinary Heritage */}
          {dish.heritage && (
            <section>
              <h3
                className="text-xs font-bold mb-2 flex items-center gap-1.5"
                style={{ color: accentColor }}
              >
                <Globe className="w-3 h-3" /> Culinary Heritage
              </h3>
              <div className="flex gap-2">
                {dish.heritage.map((place) => (
                  <span
                    key={place}
                    className="text-xs font-semibold px-3 py-1 rounded-full"
                    style={{ background: `${accentColor}18`, color: accentColor }}
                  >
                    {place}
                  </span>
                ))}
              </div>
            </section>
          )}

          {/* Make It Your Own */}
          {dish.substitutions && dish.substitutions.length > 0 && (
            <section>
              <h3
                className="text-xs font-bold mb-2 flex items-center gap-1.5"
                style={{ color: accentColor }}
              >
                <Pencil className="w-3 h-3" /> Make It Your Own
              </h3>
              <div className="flex flex-wrap gap-2">
                {dish.substitutions.map((sub, i) => (
                  <span
                    key={i}
                    className="text-xs px-3 py-1.5 rounded-full border"
                    style={{ borderColor: `${accentColor}40`, color: "#6B5B52", background: "#fff" }}
                  >
                    swap <strong style={{ color: accentColor }}>{sub.swap}</strong> for {sub.for}
                  </span>
                ))}
              </div>
            </section>
          )}

          {/* Try Next */}
          {relatedDishes.length > 0 && (
            <section>
              <h3
                className="text-xs font-bold mb-2 flex items-center gap-1.5"
                style={{ color: accentColor }}
              >
                <ArrowRight className="w-3 h-3" /> Try Next
              </h3>
              <div className="grid grid-cols-3 gap-2">
                {relatedDishes.map((related) => (
                  <Link
                    key={related.id}
                    href={`/cuisines/fusion/${related.id}`}
                    className="block rounded-xl overflow-hidden group"
                  >
                    <div className="relative h-20">
                      <img
                        src={related.image}
                        alt={related.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                      />
                      <div
                        className="absolute inset-0"
                        style={{ background: "linear-gradient(to top, rgba(20,10,4,0.7) 0%, transparent 50%)" }}
                      />
                      <p className="absolute bottom-1.5 left-2 right-2 text-white text-xs font-medium leading-tight">
                        {related.name}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
