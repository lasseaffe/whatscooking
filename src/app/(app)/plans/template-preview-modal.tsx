"use client";

import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { X, Clock, Flame, Calendar, Utensils } from "lucide-react";
import type { PlanTemplate } from "./new/plan-templates";

interface Props {
  template: PlanTemplate | null;
  onClose: () => void;
}

export function TemplatePreviewModal({ template, onClose }: Props) {
  const router = useRouter();

  const avgCalories = template
    ? Math.round(template.meals.reduce((s, m) => s + m.calories, 0) / template.meals.length)
    : 0;

  function handleCreate() {
    if (!template) return;
    router.push(`/plans/new?template=${template.id}`);
  }

  return (
    <AnimatePresence>
      {template && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50"
            style={{ background: "rgba(0,0,0,0.65)", backdropFilter: "blur(4px)" }}
            onClick={onClose}
          />

          {/* Sheet */}
          <motion.div
            initial={{ opacity: 0, y: 32, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.97 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="fixed inset-x-4 bottom-4 sm:inset-auto sm:left-1/2 sm:top-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:w-full sm:max-w-lg z-50 rounded-2xl overflow-hidden"
            style={{
              background: "var(--bg-primary)",
              border: "1px solid var(--wc-border-subtle, #3A2416)",
              boxShadow: "0 32px 80px rgba(0,0,0,0.7)",
            }}
          >
            {/* Hero image strip */}
            <div className="relative h-40 overflow-hidden">
              {template.meals[0]?.image ? (
                <img
                  src={template.meals[0].image}
                  alt={template.title}
                  className="w-full h-full object-cover"
                  style={{ filter: "brightness(0.65) saturate(0.85)" }}
                />
              ) : (
                <div className="w-full h-full" style={{ background: template.gradient }} />
              )}
              <div className="absolute inset-0" style={{ background: "linear-gradient(to top, var(--bg-primary) 0%, transparent 55%)" }} />
              <div className="absolute bottom-3 left-4 flex items-end gap-2">
                <span style={{ fontSize: "2rem" }}>{template.emoji}</span>
                <div>
                  <h2 className="font-bold text-lg leading-tight" style={{ color: "var(--fg-primary)" }}>{template.title}</h2>
                  <p className="text-xs" style={{ color: "var(--fg-tertiary)" }}>{template.subtitle}</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="absolute top-3 right-3 flex items-center justify-center rounded-full"
                style={{ width: 32, height: 32, background: "rgba(0,0,0,0.5)", color: "var(--fg-secondary)" }}
              >
                <X style={{ width: 16, height: 16 }} />
              </button>
              {/* Accent top bar */}
              <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: template.accentColor }} />
            </div>

            <div className="px-5 py-4">
              {/* Stats row */}
              <div className="flex gap-4 mb-4">
                {[
                  { icon: Calendar, label: `${template.durationDays} days` },
                  { icon: Utensils, label: `${template.mealsPerDay} meals/day` },
                  { icon: Flame, label: `~${avgCalories} kcal avg` },
                ].map(({ icon: Icon, label }) => (
                  <div key={label} className="flex items-center gap-1.5">
                    <Icon style={{ width: 13, height: 13, color: template.accentColor, flexShrink: 0 }} />
                    <span className="text-xs font-medium" style={{ color: "var(--fg-secondary)" }}>{label}</span>
                  </div>
                ))}
              </div>

              {/* Description */}
              <p className="text-sm leading-relaxed mb-4" style={{ color: "var(--fg-tertiary)" }}>
                {template.description}
              </p>

              {/* Sample meals */}
              <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: "var(--fg-tertiary)", opacity: 0.6 }}>
                Sample meals
              </p>
              <div className="flex gap-2 overflow-x-auto pb-1 mb-4" style={{ scrollbarWidth: "none" }}>
                {template.meals.slice(0, 4).map((meal) => (
                  <div key={meal.title} className="shrink-0 rounded-xl overflow-hidden" style={{ width: 96 }}>
                    <img src={meal.image} alt={meal.title} className="w-full object-cover" style={{ height: 64 }} />
                    <div className="px-1.5 py-1" style={{ background: "var(--bg-secondary)" }}>
                      <p className="text-xs font-medium leading-tight line-clamp-2" style={{ color: "var(--fg-primary)", fontSize: 10 }}>{meal.title}</p>
                      <div className="flex items-center gap-1 mt-0.5">
                        <Clock style={{ width: 8, height: 8, color: "var(--fg-tertiary)" }} />
                        <span style={{ color: "var(--fg-tertiary)", fontSize: 9 }}>{meal.time}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Tags */}
              <div className="flex flex-wrap gap-1.5 mb-5">
                {template.tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-xs px-2 py-0.5 rounded-full font-medium"
                    style={{ background: `color-mix(in srgb, ${template.accentColor} 15%, var(--bg-secondary))`, color: template.accentColor }}
                  >
                    {tag}
                  </span>
                ))}
              </div>

              {/* CTA */}
              <button
                onClick={handleCreate}
                className="w-full py-3 rounded-xl font-bold text-sm transition-all btn-primary-glow"
                style={{ background: template.accentColor, color: "#fff" }}
              >
                Create this plan
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
