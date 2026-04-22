"use client";

import Link from "next/link";
import { CUISINES } from "@/lib/cuisines";

const CUISINE_FILTERS = [
  { value: "all", label: "🌍 All Cuisines", flag: "" },
  ...CUISINES.map((c) => ({ value: c.slug, label: c.name, flag: c.flag })),
];

interface CuisineFilterBarProps {
  active: string;
  onChange: (cuisine: string) => void;
}

export function CuisineFilterBar({ active, onChange }: CuisineFilterBarProps) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
      {CUISINE_FILTERS.map((f) => {
        const on = active === f.value;
        return (
          <button
            key={f.value}
            type="button"
            onClick={() => onChange(f.value)}
            className="px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all shrink-0 border"
            style={{
              borderColor: on ? "#C8522A" : "#3A2416",
              background:   on ? "#C8522A" : "#1C1209",
              color:        on ? "#fff"    : "#8A6A4A",
            }}
          >
            {f.flag && <span className="mr-1">{f.flag}</span>}
            {f.label}
          </button>
        );
      })}
    </div>
  );
}

const FILTERS = [
  { value: "all",         label: "All" },
  { value: "main course", label: "🍽️ Mains" },
  { value: "pasta",       label: "🍝 Pasta" },
  { value: "soup",        label: "🍲 Soups" },
  { value: "salad",       label: "🥬 Salads" },
  { value: "bowl",        label: "🥣 Bowls" },
  { value: "curry",       label: "🍛 Curry" },
  { value: "pizza",       label: "🍕 Pizza" },
  { value: "burger",      label: "🍔 Burgers" },
  { value: "sandwich",    label: "🥪 Sandwiches" },
  { value: "tacos",       label: "🌮 Tacos" },
  { value: "noodles",     label: "🍜 Noodles" },
  { value: "rice",        label: "🍚 Rice" },
  { value: "breakfast",   label: "🍳 Breakfast" },
  { value: "side dish",   label: "🥗 Sides" },
  { value: "dessert",     label: "🍰 Desserts" },
  { value: "cake",        label: "🎂 Cakes" },
  { value: "cookies",     label: "🍪 Cookies" },
  { value: "baking",      label: "🧁 Baking" },
  { value: "snack",       label: "🍿 Snacks" },
  { value: "dip",         label: "🫙 Dips" },
  { value: "sauce",       label: "🥫 Sauces" },
  { value: "bread",       label: "🍞 Bread" },
];

const DIET_FILTERS = [
  { value: "vegetarian",  label: "🌿 Vegetarian" },
  { value: "vegan",       label: "🌱 Vegan" },
  { value: "gluten-free", label: "🌾 Gluten-Free" },
  { value: "high-protein",label: "💪 High-Protein" },
  { value: "dairy-free",  label: "🥛 Dairy-Free" },
  { value: "keto",        label: "⚡ Keto" },
  { value: "halal",       label: "☪️ Halal" },
  { value: "kosher",      label: "✡️ Kosher" },
];

const DIFFICULTY_FILTERS = [
  { value: "easy",   label: "⚡ Easy" },
  { value: "medium", label: "🔥 Medium" },
  { value: "hard",   label: "⛰️ Challenging" },
];

interface DifficultyFilterBarProps {
  active: string | null;
  onChange: (v: string | null) => void;
}

export function DifficultyFilterBar({ active, onChange }: DifficultyFilterBarProps) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
      {DIFFICULTY_FILTERS.map((f) => {
        const on = active === f.value;
        return (
          <button
            key={f.value}
            type="button"
            onClick={() => onChange(on ? null : f.value)}
            className="px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all shrink-0 border"
            style={{
              borderColor: on ? "#C8522A" : "#3A2416",
              background:   on ? "#C8522A" : "#1C1209",
              color:        on ? "#fff"    : "#8A6A4A",
            }}
          >
            {f.label}
          </button>
        );
      })}
    </div>
  );
}

interface FilterBarProps {
  active: string;
  onChange: (filter: string) => void;
  dark?: boolean;
}

interface DietFilterBarProps {
  active: string[];
  onChange: (filters: string[]) => void;
  dark?: boolean;
}

export function FilterBar({ active, onChange }: FilterBarProps) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
      {/* Drinks — links to dedicated page */}
      <Link
        href="/drinks"
        className="px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all shrink-0 border"
        style={{ borderColor: "#3A2416", background: "#1C1209", color: "#8A6A4A" }}
      >
        🥤 Drinks
      </Link>

      {FILTERS.map((f) => {
        const on = active === f.value;
        return (
          <button
            key={f.value}
            type="button"
            onClick={() => onChange(f.value)}
            className="px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all shrink-0 border"
            style={{
              borderColor: on ? "#C8522A" : "#3A2416",
              background:   on ? "#C8522A" : "#1C1209",
              color:        on ? "#fff"    : "#8A6A4A",
            }}
          >
            {f.label}
          </button>
        );
      })}
    </div>
  );
}

export function DietFilterBar({ active, onChange }: DietFilterBarProps) {
  function toggle(val: string) {
    onChange(active.includes(val) ? active.filter((x) => x !== val) : [...active, val]);
  }
  return (
    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
      {DIET_FILTERS.map((f) => {
        const on = active.includes(f.value);
        return (
          <button
            key={f.value}
            type="button"
            onClick={() => toggle(f.value)}
            className="px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all shrink-0 border"
            style={{
              borderColor: on ? "#C8522A" : "#3A2416",
              background:   on ? "#C8522A" : "#1C1209",
              color:        on ? "#fff"    : "#8A6A4A",
            }}
          >
            {f.label}
          </button>
        );
      })}
    </div>
  );
}
