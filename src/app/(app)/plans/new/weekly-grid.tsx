"use client";
import React, { useState } from "react";
import { X, Coffee, UtensilsCrossed, Soup, Cookie } from "lucide-react";
import type { DraggableRecipe } from "./recipe-search-panel";

export type MealType = "breakfast" | "lunch" | "dinner" | "snack";

export interface GridSlot {
  day: number;
  mealType: MealType;
  recipe: DraggableRecipe | null;
}

const MEAL_TYPES: { type: MealType; label: string; Icon: React.ElementType; color: string }[] = [
  { type: "breakfast", label: "Breakfast", Icon: Coffee,           color: "#7A5C1E" },
  { type: "lunch",     label: "Lunch",     Icon: UtensilsCrossed,  color: "#4A5C2A" },
  { type: "dinner",    label: "Dinner",    Icon: Soup,             color: "#7A3520" },
  { type: "snack",     label: "Snack",     Icon: Cookie,           color: "#5C4A2A" },
];

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

interface Props {
  durationDays: number;
  slots: GridSlot[];
  draggedRecipe: DraggableRecipe | null;
  onSlotDrop: (day: number, mealType: MealType) => void;
  onSlotClear: (day: number, mealType: MealType) => void;
}

export function WeeklyGrid({ durationDays, slots, draggedRecipe, onSlotDrop, onSlotClear }: Props) {
  const [hoveredSlot, setHoveredSlot] = useState<string | null>(null);

  function slotKey(day: number, mt: MealType) { return `${day}-${mt}`; }

  function getSlot(day: number, mt: MealType): GridSlot | undefined {
    return slots.find((s) => s.day === day && s.mealType === mt);
  }

  return (
    <div className="overflow-x-auto">
      <div style={{ minWidth: durationDays * 120 }}>
        {/* Header row */}
        <div className="grid mb-2" style={{ gridTemplateColumns: `80px repeat(${durationDays}, minmax(110px, 1fr))` }}>
          <div />
          {Array.from({ length: durationDays }, (_, i) => (
            <div key={i} className="text-center text-xs font-semibold py-1" style={{ color: "#EFE3CE" }}>
              {DAY_LABELS[i % 7]}
              <span className="block text-xs font-normal" style={{ color: "#6B4E36" }}>Day {i + 1}</span>
            </div>
          ))}
        </div>

        {/* Meal type rows */}
        {MEAL_TYPES.map(({ type, label, Icon, color }) => (
          <div key={type} className="grid mb-2" style={{ gridTemplateColumns: `80px repeat(${durationDays}, minmax(110px, 1fr))` }}>
            {/* Row label */}
            <div className="flex items-center gap-1.5 pr-2">
              <Icon className="w-3.5 h-3.5 shrink-0" style={{ color }} />
              <span className="text-xs font-medium" style={{ color: "#8A6A4A" }}>{label}</span>
            </div>

            {/* Slots */}
            {Array.from({ length: durationDays }, (_, dayIdx) => {
              const day = dayIdx + 1;
              const key = slotKey(day, type);
              const slot = getSlot(day, type);
              const isHovered = hoveredSlot === key && !!draggedRecipe;

              return (
                <div
                  key={day}
                  className="mx-1 rounded-xl transition-all border"
                  style={{
                    minHeight: 64,
                    borderColor: isHovered ? "#C8522A" : slot?.recipe ? "#3A2416" : "#2A1808",
                    background: isHovered ? "#2A1008" : slot?.recipe ? "#1C1209" : "#130C05",
                    borderStyle: slot?.recipe ? "solid" : "dashed",
                  }}
                  onDragOver={(e) => {
                    if (!draggedRecipe) return;
                    e.preventDefault();
                    setHoveredSlot(key);
                  }}
                  onDragLeave={() => setHoveredSlot(null)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setHoveredSlot(null);
                    onSlotDrop(day, type);
                  }}
                >
                  {slot?.recipe ? (
                    <div className="p-1.5 h-full flex flex-col relative group">
                      {slot.recipe.image && (
                        <img
                          src={slot.recipe.image}
                          alt={slot.recipe.title}
                          className="w-full h-8 object-cover rounded-lg mb-1"
                        />
                      )}
                      <p className="text-xs leading-snug line-clamp-2 flex-1" style={{ color: "#EFE3CE" }}>
                        {slot.recipe.title}
                      </p>
                      <button
                        onClick={() => onSlotClear(day, type)}
                        className="absolute top-1 right-1 w-5 h-5 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity border-none cursor-pointer"
                        style={{ background: "#C8522A" }}
                        aria-label="Remove meal"
                      >
                        <X className="w-3 h-3 text-white" />
                      </button>
                    </div>
                  ) : (
                    <div className="h-full flex items-center justify-center text-xs" style={{ color: "#3A2416", minHeight: 64 }}>
                      {isHovered ? "Drop here" : "+"}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
