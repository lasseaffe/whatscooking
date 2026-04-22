"use client";

import { useState, useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight, Clock, Flame, Check } from "lucide-react";
import type { PlanTemplate } from "./plan-templates";
import { useLanguage } from "@/lib/language-context";

const TAG_COLORS: Record<string, { bg: string; color: string }> = {
  "High Protein":   { bg: "#EAF0E0", color: "#3D5030" },
  "Quick Cook":     { bg: "#FEF3D8", color: "#7A5C1E" },
  "Under 30 min":   { bg: "#FEF3D8", color: "#7A5C1E" },
  "Budget":         { bg: "#EEF0E5", color: "#4A5028" },
  "Vegan":          { bg: "#E5EDD8", color: "#3D5030" },
  "Vegetarian":     { bg: "#E5EDD8", color: "#3D5030" },
  "Gluten-Free":    { bg: "#F5EDD8", color: "#7A5C1E" },
  "Meal Prep":      { bg: "#EDE8DC", color: "#5C4A2A" },
  "Batch Cook":     { bg: "#EDE8DC", color: "#5C4A2A" },
  "Mediterranean":  { bg: "#FFF0E0", color: "#7A3520" },
  "Family":         { bg: "#FFF3EC", color: "#8C4A2F" },
  "Make Ahead":     { bg: "#EDE8DC", color: "#5C4A2A" },
  "Comfort":        { bg: "#FFF0E0", color: "#7A3520" },
  "Hearty":         { bg: "#FFF0E0", color: "#7A3520" },
  "Weekend":        { bg: "#F0EDE8", color: "#5C4A3A" },
  "Snack":          { bg: "#F5EDD8", color: "#7A5C1E" },
  "Breakfast":      { bg: "#FFF3EC", color: "#8C4A2F" },
  "Kid-Friendly":   { bg: "#FFF8EE", color: "#A07030" },
  "Heart Healthy":  { bg: "#EAF0E0", color: "#3D5030" },
  "High Fiber":     { bg: "#EAF0E0", color: "#3D5030" },
  "Weeknight":      { bg: "#F0EDE8", color: "#5C4A3A" },
};

function tagStyle(tag: string) {
  return TAG_COLORS[tag] ?? { bg: "#f3f4f6", color: "#374151" };
}

interface TemplateCardProps {
  template: PlanTemplate;
  selected: boolean;
  onSelect: () => void;
}

export function TemplateCard({ template, selected, onSelect }: TemplateCardProps) {
  const { t } = useLanguage();
  const [slide, setSlide] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [paused, setPaused] = useState(false);

  const meals = template.meals;

  function startTimer() {
    timerRef.current = setInterval(() => {
      setSlide((s) => (s + 1) % meals.length);
    }, 3500);
  }

  useEffect(() => {
    if (!paused) startTimer();
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paused, meals.length]);

  function prev() {
    setSlide((s) => (s - 1 + meals.length) % meals.length);
  }
  function next() {
    setSlide((s) => (s + 1) % meals.length);
  }

  const meal = meals[slide];

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={(e) => e.key === "Enter" && onSelect()}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      className="rounded-2xl overflow-hidden border-2 cursor-pointer transition-all relative"
      style={{
        borderColor: selected ? template.accentColor : "transparent",
        boxShadow: selected ? `0 0 0 3px ${template.accentColor}40` : "0 1px 4px rgba(0,0,0,0.08)",
        background: "#1C1209",
      }}
    >
      {/* Selected check */}
      {selected && (
        <div
          className="absolute top-3 right-3 z-20 w-7 h-7 rounded-full flex items-center justify-center"
          style={{ background: template.accentColor }}
        >
          <Check className="w-4 h-4 text-white" strokeWidth={3} />
        </div>
      )}

      {/* Slideshow */}
      <div
        className="relative overflow-hidden"
        style={{ height: 200, background: template.gradient }}
      >
        {/* Image */}
        <img
          key={slide}
          src={meal.image}
          alt={meal.title}
          className="absolute inset-0 w-full h-full object-cover transition-opacity duration-700"
          style={{ opacity: 0.7 }}
          onError={(e) => { (e.target as HTMLImageElement).style.opacity = "0"; }}
        />

        {/* Gradient overlay */}
        <div
          className="absolute inset-0"
          style={{ background: "linear-gradient(to top, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.1) 60%)" }}
        />

        {/* Meal title + tags overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-3">
          <p className="text-white font-semibold text-sm leading-tight mb-1.5">{meal.title}</p>
          <div className="flex items-center gap-1.5 flex-wrap">
            {meal.tags.map((tag) => {
              const s = tagStyle(tag);
              return (
                <span key={tag} className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: s.bg, color: s.color }}>
                  {tag}
                </span>
              );
            })}
            <span className="flex items-center gap-0.5 text-xs text-white/80 ml-auto">
              <Clock className="w-3 h-3" /> {meal.time}
            </span>
            <span className="flex items-center gap-0.5 text-xs text-white/80">
              <Flame className="w-3 h-3" /> {meal.calories}
            </span>
          </div>
        </div>

        {/* Prev/Next arrows */}
        <button
          onClick={(e) => { e.stopPropagation(); prev(); }}
          className="absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full flex items-center justify-center transition-opacity"
          style={{ background: "rgba(0,0,0,0.35)", color: "#fff" }}
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); next(); }}
          className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full flex items-center justify-center transition-opacity"
          style={{ background: "rgba(0,0,0,0.35)", color: "#fff" }}
        >
          <ChevronRight className="w-4 h-4" />
        </button>

        {/* Dot indicators */}
        <div className="absolute top-3 left-0 right-0 flex justify-center gap-1">
          {meals.map((_, i) => (
            <button
              key={i}
              onClick={(e) => { e.stopPropagation(); setSlide(i); }}
              className="rounded-full transition-all"
              style={{
                width: i === slide ? 16 : 5,
                height: 5,
                background: i === slide ? template.accentColor : "rgba(255,255,255,0.5)",
              }}
            />
          ))}
        </div>
      </div>

      {/* Card body */}
      <div className="p-4">
        <div className="flex items-start gap-2 mb-2">
          <span className="text-2xl">{template.emoji}</span>
          <div>
            <h3 className="font-bold text-sm leading-tight" style={{ color: "#EFE3CE" }}>{template.title}</h3>
            <p className="text-xs mt-0.5" style={{ color: "#6B4E36" }}>{template.subtitle}</p>
          </div>
        </div>

        <p className="text-xs leading-relaxed mb-3" style={{ color: "#8A6A4A" }}>{template.description}</p>

        <div className="flex flex-wrap gap-1.5">
          {template.tags.map((tag) => (
            <span key={tag} className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: "#2A1808", color: "#C8522A" }}>
              {tag}
            </span>
          ))}
          <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "#1A1208", color: "#6B4E36", border: "1px solid #3A2416" }}>
            {template.durationDays} {t("plans.days")}
          </span>
          <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "#1A1208", color: "#6B4E36", border: "1px solid #3A2416" }}>
            {template.mealsPerDay} {t("plans.meals")}/day
          </span>
        </div>
      </div>
    </div>
  );
}
