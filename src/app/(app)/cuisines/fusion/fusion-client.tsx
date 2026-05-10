"use client";
import { useState } from "react";
import Link from "next/link";
import { X, BookOpen, Globe2, ShoppingBasket } from "lucide-react";
import type { FusionDish, FusionCategory } from "@/lib/fusion-foods";
import { FUSION_CATEGORIES, CULINARY_BRIDGES } from "@/lib/fusion-foods";

interface Props {
  dishes: FusionDish[];
}

export function FusionClient({ dishes }: Props) {
  const [activeCategory, setActiveCategory] = useState<FusionCategory | "All">("All");
  const [selected, setSelected] = useState<FusionDish | null>(null);

  const filtered = activeCategory === "All"
    ? dishes
    : dishes.filter((d) => d.category === activeCategory);

  return (
    <>
      {/* ── Category filter pills ── */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-8 scrollbar-none">
        {(["All", ...FUSION_CATEGORIES] as const).map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat as FusionCategory | "All")}
            className="shrink-0 px-4 py-1.5 rounded-full text-xs font-semibold transition-all"
            style={{
              background: activeCategory === cat ? "#C8522A" : "rgba(200,82,42,0.12)",
              color: activeCategory === cat ? "#fff" : "#E07050",
              border: `1px solid ${activeCategory === cat ? "#C8522A" : "rgba(200,82,42,0.25)"}`,
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* ── Recipe grid ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-14">
        {filtered.map((dish) => (
          <FusionCard key={dish.id} dish={dish} onOpen={() => setSelected(dish)} />
        ))}
      </div>

      {/* ── Culinary Bridges ── */}
      <div className="mb-10">
        <h2
          className="text-lg font-bold mb-4"
          style={{ color: "#EFE3CE", fontFamily: "'Libre Baskerville', Georgia, serif" }}
        >
          The Great Culinary Crossroads
        </h2>
        <div className="flex gap-4 overflow-x-auto pb-3 scrollbar-none">
          {CULINARY_BRIDGES.map((b) => (
            <div
              key={b.location}
              className="shrink-0 rounded-2xl p-4"
              style={{
                width: 220,
                background: "rgba(200,82,42,0.08)",
                border: "1px solid rgba(200,82,42,0.2)",
              }}
            >
              <div className="flex items-center gap-1.5 mb-1">
                <Globe2 className="w-3 h-3" style={{ color: "#E07050" }} />
                <span className="text-xs font-bold" style={{ color: "#F4A261" }}>{b.location}</span>
              </div>
              <p className="text-xs font-semibold mb-1" style={{ color: "rgba(239,227,206,0.6)" }}>
                {b.bridge}
              </p>
              <p className="text-xs font-bold mb-2" style={{ color: "#F4A261" }}>{b.dish}</p>
              <p className="text-xs leading-relaxed" style={{ color: "rgba(239,227,206,0.5)" }}>
                {b.description}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Recipe modal ── */}
      {selected && (
        <RecipeModal dish={selected} onClose={() => setSelected(null)} />
      )}
    </>
  );
}

function FusionCard({ dish, onOpen }: { dish: FusionDish; onOpen: () => void }) {
  const originFlags: Record<string, string> = {
    "Asian-Latin Fusion": "🇯🇵 × 🌮",
    "New American Staples": "🇺🇸",
    "European-Asian Fusion": "🇪🇺 × 🌏",
    "Indian-Western Fusion": "🇮🇳 × 🌍",
    "Middle Eastern & Global Fusion": "🌙 × 🌐",
  };

  return (
    <div
      className="rounded-2xl overflow-hidden group"
      style={{ background: "rgba(10,6,2,0.85)", border: "1px solid rgba(200,82,42,0.15)" }}
    >
      <Link href={`/cuisines/fusion/${dish.id}`} className="block">
        <div className="relative h-40 overflow-hidden">
          <img
            src={dish.image}
            alt={dish.name}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
          <div
            className="absolute inset-0"
            style={{ background: "linear-gradient(to top, rgba(10,6,2,0.7) 0%, transparent 60%)" }}
          />
          <span
            className="absolute bottom-2 left-3 text-xs font-bold px-2 py-0.5 rounded-full"
            style={{ background: "#C8522A", color: "#fff" }}
          >
            {dish.category}
          </span>
        </div>
        <div className="p-4">
          <div className="flex items-start justify-between gap-2 mb-1">
            <h3 className="font-bold text-sm leading-tight" style={{ color: "#EFE3CE" }}>
              {dish.name}
            </h3>
            <span className="text-base shrink-0">{originFlags[dish.category]}</span>
          </div>
          <p className="text-xs mb-3 line-clamp-2" style={{ color: "rgba(239,227,206,0.55)" }}>
            {dish.originStory}
          </p>
          <div className="flex items-center justify-between">
            <span className="text-xs" style={{ color: "#E07050" }}>
              {dish.ingredients.length} ingredients
            </span>
            <span
              className="text-xs font-semibold flex items-center gap-1 px-3 py-1 rounded-lg"
              style={{ background: "rgba(200,82,42,0.15)", color: "#F4A261" }}
            >
              <BookOpen className="w-3 h-3" />
              View Recipe
            </span>
          </div>
        </div>
      </Link>
    </div>
  );
}

function RecipeModal({ dish, onClose }: { dish: FusionDish; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      style={{ background: "rgba(0,0,0,0.7)" }}
      onClick={onClose}
    >
      <div
        className="w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl overflow-hidden max-h-[90vh] overflow-y-auto"
        style={{ background: "#0F0A06", border: "1px solid rgba(200,82,42,0.2)" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header image */}
        <div className="relative h-48">
          <img src={dish.image} alt={dish.name} className="w-full h-full object-cover" />
          <div className="absolute inset-0" style={{ background: "linear-gradient(to top, #0F0A06 0%, transparent 50%)" }} />
          <button
            onClick={onClose}
            className="absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center"
            style={{ background: "rgba(0,0,0,0.6)" }}
          >
            <X className="w-4 h-4 text-white" />
          </button>
        </div>

        <div className="px-5 pb-8 -mt-4 relative">
          <span
            className="inline-block text-xs font-semibold px-2.5 py-1 rounded-full mb-2"
            style={{ background: "rgba(200,82,42,0.2)", color: "#F4A261" }}
          >
            {dish.category}
          </span>
          <h2
            className="text-xl font-bold mb-2"
            style={{ color: "#EFE3CE", fontFamily: "'Libre Baskerville', Georgia, serif" }}
          >
            {dish.name}
          </h2>
          <p className="text-sm leading-relaxed mb-5" style={{ color: "rgba(239,227,206,0.6)" }}>
            {dish.originStory}
          </p>

          {/* Ingredients */}
          <div className="mb-5">
            <h3 className="text-sm font-bold mb-2 flex items-center gap-2" style={{ color: "#F4A261" }}>
              <ShoppingBasket className="w-4 h-4" />
              Ingredients
            </h3>
            <ul className="grid grid-cols-2 gap-1">
              {dish.ingredients.map((ing) => (
                <li key={ing} className="text-xs flex items-center gap-1.5" style={{ color: "rgba(239,227,206,0.7)" }}>
                  <span className="w-1 h-1 rounded-full shrink-0" style={{ background: "#C8522A" }} />
                  {ing}
                </li>
              ))}
            </ul>
          </div>

          {/* Instructions */}
          <div className="mb-5">
            <h3 className="text-sm font-bold mb-3 flex items-center gap-2" style={{ color: "#F4A261" }}>
              <BookOpen className="w-4 h-4" />
              Instructions
            </h3>
            <ol className="space-y-2">
              {dish.instructions.map((step, i) => (
                <li key={i} className="flex gap-3 text-xs leading-relaxed" style={{ color: "rgba(239,227,206,0.7)" }}>
                  <span
                    className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 font-bold text-[10px]"
                    style={{ background: "rgba(200,82,42,0.2)", color: "#F4A261" }}
                  >
                    {i + 1}
                  </span>
                  {step}
                </li>
              ))}
            </ol>
          </div>

          {/* Source */}
          <a
            href={dish.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs underline"
            style={{ color: "rgba(239,227,206,0.3)" }}
          >
            Original source
          </a>
        </div>
      </div>
    </div>
  );
}
