"use client";

import {
  ChefHat, Utensils, Soup, ShoppingCart, Refrigerator, CalendarDays,
  Flame, Heart, Search, Settings, Palette,
} from "lucide-react";
import { moodboard } from "../moodboard.config";
import { SectionShell, CARD_STYLE } from "./SectionShell";

const ICONS: Record<string, typeof ChefHat> = {
  ChefHat, Utensils, Soup, ShoppingCart, Refrigerator, CalendarDays,
  Flame, Heart, Search, Settings, Palette,
};

export function Iconography() {
  return (
    <SectionShell id="icons" number="09" title="Iconography" lede={`${moodboard.iconLibrary} — ${moodboard.iconNote}`}>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {moodboard.icons.map((i) => {
          const Icon = ICONS[i.name];
          return (
            <div key={i.name} className="p-4 flex items-center gap-3" style={CARD_STYLE}>
              {Icon ? <Icon size={20} style={{ color: "var(--wc-pal-accent, #B07D56)" }} /> : <span style={{ color: "var(--fg-destructive)" }}>?</span>}
              <div className="min-w-0">
                <p className="text-[12px] truncate" style={{ color: "var(--fg-primary)", fontFamily: "var(--font-mono)" }}>{i.name}</p>
                <p className="text-[11px] italic truncate" style={{ color: "var(--fg-tertiary)" }}>{i.usage}</p>
              </div>
            </div>
          );
        })}
      </div>
    </SectionShell>
  );
}
