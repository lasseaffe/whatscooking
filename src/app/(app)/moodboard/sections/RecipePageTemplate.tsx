"use client";

import { SectionShell } from "./SectionShell";
import { Clock, Users, Dumbbell, ChevronLeft, Star, Heart, MessageCircle } from "lucide-react";

// ── Annotation label ──────────────────────────────────────────────────────────
function Zone({ label, children, accent = false }: { label: string; children: React.ReactNode; accent?: boolean }) {
  return (
    <div className="relative">
      <div
        className="absolute -top-2.5 left-3 z-10 text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full"
        style={{
          background: accent ? "var(--wc-pal-accent, #B07D56)" : "rgba(255,255,255,0.07)",
          color: accent ? "#1A0E04" : "var(--wc-pal-accent, #B07D56)",
          border: accent ? "none" : "1px solid var(--wc-pal-accent, #B07D56)",
        }}
      >
        {label}
      </div>
      <div
        className="rounded-xl overflow-hidden"
        style={{ border: `1px dashed var(--wc-pal-accent, #B07D56)`, opacity: 0.95 }}
      >
        {children}
      </div>
    </div>
  );
}

// ── Fake hero image placeholder ───────────────────────────────────────────────
function HeroPlaceholder({ label }: { label: string }) {
  return (
    <div
      className="w-full h-full flex items-center justify-center"
      style={{
        background: "linear-gradient(135deg, #2A1808 0%, #1A0E05 60%, #3A2210 100%)",
      }}
    >
      <div className="text-center">
        <div
          className="text-[11px] font-bold uppercase tracking-widest"
          style={{ color: "var(--wc-pal-accent, #B07D56)", opacity: 0.5 }}
        >
          {label}
        </div>
      </div>
    </div>
  );
}

// ── Fake ingredient row ───────────────────────────────────────────────────────
function IngredientRow({ qty, unit, name, inPantry }: { qty: string; unit: string; name: string; inPantry?: boolean }) {
  return (
    <li className="flex items-start gap-2 py-1.5" style={{ borderBottom: "1px solid rgba(42,24,8,0.4)" }}>
      <input type="checkbox" readOnly className="mt-0.5 shrink-0 accent-amber-600" />
      <span className="flex-1 text-[12px]" style={{ color: "var(--fg-primary)" }}>
        <span style={{ fontFamily: "var(--font-geist-mono, monospace)", fontSize: 11, color: "var(--fg-tertiary)" }}>
          {qty} {unit}{" "}
        </span>
        {name}
      </span>
      {inPantry && (
        <span className="text-[9px] px-1.5 py-0.5 rounded-full shrink-0" style={{ background: "rgba(51,133,0,0.2)", color: "#6FCF97" }}>
          ✓ pantry
        </span>
      )}
    </li>
  );
}

// ── Fake step card ─────────────────────────────────────────────────────────────
function StepCard({ n, title, body, active }: { n: number; title: string; body: string; active?: boolean }) {
  return (
    <div
      className="rounded-xl p-3"
      style={{
        background: active ? "rgba(244,162,97,0.08)" : "rgba(255,255,255,0.02)",
        border: `1px solid ${active ? "rgba(244,162,97,0.3)" : "rgba(42,24,8,0.5)"}`,
      }}
    >
      <div className="flex items-center gap-2 mb-1">
        <span
          className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0"
          style={{ background: active ? "var(--wc-pal-accent, #B07D56)" : "rgba(200,90,47,0.2)", color: active ? "#1A0E04" : "var(--wc-pal-accent, #B07D56)" }}
        >
          {n}
        </span>
        <p className="text-[12px] font-semibold" style={{ color: "var(--fg-primary)" }}>{title}</p>
      </div>
      <p className="text-[11px] leading-relaxed pl-7" style={{ color: "var(--fg-tertiary)" }}>{body}</p>
    </div>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────
export function RecipePageTemplate() {
  return (
    <SectionShell
      id="recipe-template"
      number="12"
      title="Recipe Page Template"
      lede="Spatial contract for every recipe detail page — three zones, two columns, editorial hierarchy. All elements are live tokens."
    >
      {/* Outer frame — simulates the browser viewport */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{
          background: "var(--bg-base, #0d0a07)",
          border: "1px solid var(--wc-border-default, #292927)",
          fontSize: "0.8rem",
        }}
      >

        {/* ── ZONE 1: Editorial header ─────────────────────────────────── */}
        <div className="mt-4 mx-4">
          <Zone label="Zone 1 — Editorial header (image-left F-shape · ingredients right · title below)">
            <div style={{ background: "var(--bg-base, #0d0a07)", padding: "16px" }}>
              {/* Back nav */}
              <a
                className="inline-flex items-center gap-1 text-[11px] font-medium mb-4"
                style={{ color: "var(--wc-pal-accent, #B07D56)" }}
              >
                <ChevronLeft style={{ width: 12, height: 12 }} /> Back to recipes
              </a>

              {/* Top row: image + Cook CTA (LEFT anchor, F-shape) · ingredients (RIGHT) */}
              <div className="flex flex-col sm:flex-row gap-6 items-start">
                {/* Left: hero image + Cooking Mode CTA — the F-shape anchor */}
                <div className="w-full sm:w-[44%] shrink-0 flex flex-col gap-3" style={{ maxWidth: 440 }}>
                  <div
                    className="rounded-xl overflow-hidden"
                    style={{ height: "clamp(160px, 28vw, 280px)" }}
                  >
                    <HeroPlaceholder label="Recipe photo 4:3 — object-cover" />
                  </div>
                  <button
                    className="w-full py-2.5 rounded-xl font-semibold text-[12px] flex items-center justify-center gap-2"
                    style={{
                      background: "linear-gradient(135deg, var(--wc-pal-accent, #B07D56), #8B5A2F)",
                      color: "#1A0E04",
                    }}
                  >
                    🍳 Start Cooking Mode
                  </button>
                </div>

                {/* Right: ingredients fill the freed space */}
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: "var(--wc-pal-accent, #B07D56)" }}>
                    Phase II · Ingredients
                  </p>
                  <ul className="space-y-0.5">
                    <IngredientRow qty="1.5" unit="kg" name="lamb shoulder, bone-in" />
                    <IngredientRow qty="6" unit="cloves" name="garlic" inPantry />
                    <IngredientRow qty="2" unit="tbsp" name="rosemary, chopped" />
                    <IngredientRow qty="200" unit="ml" name="white wine" inPantry />
                  </ul>
                </div>
              </div>

              {/* Title + meta — full width BELOW the image/ingredients row */}
              <div className="mt-5 flex flex-col gap-2.5">
                <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "#C8522A" }}>
                  Mediterranean
                </p>
                <h1
                  style={{
                    fontFamily: "var(--font-fraunces, 'Fraunces', Georgia, serif)",
                    fontSize: "clamp(1.6rem, 4vw, 2.4rem)",
                    fontWeight: 700,
                    color: "var(--fg-primary)",
                    lineHeight: 1.1,
                    letterSpacing: "-0.01em",
                  }}
                >
                  Slow-Roasted Lamb Shoulder
                </h1>
                <p
                  className="text-[12px] italic leading-relaxed"
                  style={{ color: "var(--fg-tertiary)", fontFamily: "var(--font-libre-baskerville, Georgia, serif)", maxWidth: "40ch" }}
                >
                  Herb-rubbed and slow-cooked until it falls from the bone — this is a Sunday centrepiece.
                </p>

                {/* Metrics row */}
                <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 text-[11px]" style={{ color: "var(--fg-tertiary)" }}>
                  <span className="flex items-center gap-1.5 font-semibold" style={{ color: "var(--fg-secondary)" }}>
                    <Star style={{ width: 11, height: 11, fill: "#C8522A", color: "#C8522A" }} /> 4.8
                    <span style={{ color: "var(--fg-quaternary)", fontWeight: 400 }}>(34)</span>
                  </span>
                  <span className="flex items-center gap-1"><Clock style={{ width: 11, height: 11 }} /> 3 h 20 min</span>
                  <span className="flex items-center gap-1"><Users style={{ width: 11, height: 11 }} /> 6 serves</span>
                  <span className="flex items-center gap-1"><Dumbbell style={{ width: 11, height: 11 }} /> 540 kcal</span>
                </div>

                {/* Time breakdown bar */}
                <div className="flex items-center gap-1 w-full max-w-xs">
                  <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(42,24,8,0.5)" }}>
                    <div
                      className="h-full rounded-full"
                      style={{ width: "15%", background: "var(--wc-accent-saffron, #F4A261)" }}
                    />
                  </div>
                  <span className="text-[9px]" style={{ color: "var(--fg-quaternary)", fontFamily: "var(--font-geist-mono, monospace)" }}>
                    20m prep · 3h cook
                  </span>
                </div>

                {/* Dietary tags */}
                <div className="flex flex-wrap gap-1.5">
                  {["gluten-free", "high-protein", "dairy-free"].map((t) => (
                    <span
                      key={t}
                      className="text-[10px] px-2.5 py-0.5 rounded-full font-medium"
                      style={{ background: "rgba(42,24,8,0.5)", color: "var(--fg-tertiary)", border: "1px solid rgba(58,36,22,0.5)" }}
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </Zone>
        </div>

        {/* ── ZONE 2: Ingredients + Instructions ──────────────────────── */}
        <div className="mt-6 mx-4">
          <Zone label="Zone 2 — Recipe columns">
            <div
              className="flex flex-col sm:flex-row"
              style={{ background: "var(--bg-base, #0d0a07)" }}
            >
              {/* Ingredients column */}
              <div
                className="p-4 space-y-3"
                style={{
                  width: "100%",
                  flex: "0 0 auto",
                  borderBottom: "1px solid rgba(42,24,8,0.5)",
                }}
              >
                {/* On sm+ the divider is vertical */}
                <style>{`@media(min-width:640px){.ing-col{border-right:1px solid rgba(42,24,8,0.5)!important;border-bottom:none!important;width:38%!important}}`}</style>
                <div className="ing-col" style={{ borderBottom: "1px solid rgba(42,24,8,0.5)" }}>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "var(--wc-pal-accent, #B07D56)" }}>
                      Ingredients · Phase II
                    </p>
                    <div className="flex items-center gap-1.5 text-[10px]" style={{ color: "var(--fg-tertiary)" }}>
                      <span style={{ fontFamily: "var(--font-geist-mono, monospace)" }}>— 6 +</span>
                    </div>
                  </div>

                  {/* Metric/Imperial toggle */}
                  <div
                    className="flex rounded-lg overflow-hidden mb-3"
                    style={{ border: "1px solid rgba(42,24,8,0.5)", width: "fit-content" }}
                  >
                    {["Metric", "Imperial"].map((v, i) => (
                      <button
                        key={v}
                        className="px-3 py-1 text-[10px] font-semibold"
                        style={{
                          background: i === 0 ? "var(--wc-accent-saffron, #F4A261)" : "transparent",
                          color: i === 0 ? "#1A0E04" : "var(--fg-tertiary)",
                        }}
                      >
                        {v}
                      </button>
                    ))}
                  </div>

                  <ul className="space-y-0">
                    <IngredientRow qty="1.5" unit="kg" name="lamb shoulder" inPantry />
                    <IngredientRow qty="4" unit="cloves" name="garlic" inPantry />
                    <IngredientRow qty="2" unit="tbsp" name="olive oil" inPantry />
                    <IngredientRow qty="1" unit="tbsp" name="fresh rosemary" />
                    <IngredientRow qty="1" unit="tbsp" name="fresh thyme" />
                    <IngredientRow qty="200" unit="ml" name="white wine" />
                  </ul>

                  <div className="flex gap-2 mt-3">
                    <button
                      className="flex-1 py-1.5 rounded-lg text-[10px] font-semibold"
                      style={{ background: "rgba(42,24,8,0.5)", color: "var(--fg-tertiary)", border: "1px solid rgba(42,24,8,0.5)" }}
                    >
                      Add missing to list
                    </button>
                  </div>
                </div>
              </div>

              {/* Instructions column */}
              <div className="flex-1 p-4 space-y-3">
                {/* Phase stepper */}
                <div className="flex items-center gap-2 mb-3">
                  {[
                    { roman: "III", label: "Cook", active: true },
                    { roman: "IV", label: "Serve", active: false },
                    { roman: "V", label: "Restore", active: false },
                  ].map((step) => (
                    <div
                      key={step.label}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full"
                      style={{
                        background: step.active ? "rgba(244,162,97,0.12)" : "transparent",
                        border: `1px solid ${step.active ? "rgba(244,162,97,0.35)" : "transparent"}`,
                      }}
                    >
                      <span
                        className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold"
                        style={{
                          background: step.active ? "var(--wc-pal-accent, #B07D56)" : "transparent",
                          color: step.active ? "#1A0E04" : "var(--fg-quaternary)",
                          border: step.active ? "none" : "1.5px solid rgba(168,132,94,0.4)",
                        }}
                      >
                        {step.roman}
                      </span>
                      <span className="text-[11px] font-semibold" style={{ color: step.active ? "var(--fg-primary)" : "var(--fg-quaternary)" }}>
                        {step.label}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="space-y-2.5">
                  <StepCard n={1} title="Preheat oven" body="Heat oven to 160 °C / 320 °F (fan). Score the lamb all over." />
                  <StepCard n={2} title="Rub the lamb" body="Blitz garlic, rosemary, thyme, oil and salt into a paste. Rub into the cuts." active />
                  <StepCard n={3} title="Roast low & slow" body="Place in roasting tin, add wine. Cover tightly with foil. Roast 3 hrs." />
                </div>

                {/* Next button */}
                <button
                  className="w-full py-2.5 rounded-xl text-[11px] font-bold"
                  style={{ background: "var(--wc-pal-accent, #B07D56)", color: "#1A0E04" }}
                >
                  All Done →
                </button>
              </div>
            </div>
          </Zone>
        </div>

        {/* ── ZONE 3: Interactions + social ────────────────────────────── */}
        <div className="mt-6 mx-4 mb-4">
          <Zone label="Zone 3 — Interactions & ratings">
            <div className="p-4 space-y-4" style={{ background: "var(--bg-base, #0d0a07)" }}>
              {/* Save / rate row */}
              <div className="flex items-center gap-3">
                <button
                  className="flex items-center gap-2 px-3 py-2 rounded-xl text-[11px] font-semibold"
                  style={{ background: "rgba(42,24,8,0.5)", color: "var(--fg-secondary)", border: "1px solid rgba(42,24,8,0.5)" }}
                >
                  <Heart style={{ width: 13, height: 13 }} /> Save
                </button>
                <button
                  className="flex items-center gap-2 px-3 py-2 rounded-xl text-[11px] font-semibold"
                  style={{ background: "rgba(42,24,8,0.5)", color: "var(--fg-secondary)", border: "1px solid rgba(42,24,8,0.5)" }}
                >
                  <MessageCircle style={{ width: 13, height: 13 }} /> 3 comments
                </button>
                {/* Star rating */}
                <div className="flex gap-0.5 ml-auto">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star
                      key={s}
                      style={{
                        width: 14, height: 14,
                        fill: s <= 4 ? "#C8522A" : "transparent",
                        color: "#C8522A",
                      }}
                    />
                  ))}
                </div>
              </div>

              {/* Comment thread preview */}
              <div className="space-y-2.5">
                {[
                  { user: "Anna M.", text: "Made this for Sunday lunch — fell off the bone perfectly!", time: "2d" },
                  { user: "James R.", text: "Added a splash of pomegranate juice to the roasting tin. Game changer.", time: "5d" },
                ].map((c) => (
                  <div key={c.user} className="flex gap-2.5">
                    <div
                      className="w-6 h-6 rounded-full shrink-0 flex items-center justify-center text-[9px] font-bold"
                      style={{ background: "rgba(200,90,47,0.2)", color: "var(--wc-pal-accent, #B07D56)" }}
                    >
                      {c.user[0]}
                    </div>
                    <div>
                      <p className="text-[11px] font-semibold" style={{ color: "var(--fg-secondary)" }}>
                        {c.user} <span className="font-normal" style={{ color: "var(--fg-quaternary)" }}>· {c.time}</span>
                      </p>
                      <p className="text-[11px]" style={{ color: "var(--fg-tertiary)" }}>{c.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Zone>
        </div>

        {/* ── Annotation legend ─────────────────────────────────────────── */}
        <div
          className="mx-4 mb-4 p-4 rounded-xl grid sm:grid-cols-3 gap-3"
          style={{ background: "rgba(42,24,8,0.3)", border: "1px solid rgba(42,24,8,0.5)" }}
        >
          {[
            { zone: "Zone 1", title: "Editorial header", items: ["Cuisine label + big serif title", "Description in Libre Baskerville italic", "Metrics row (rating / time / serves / kcal)", "Time breakdown bar", "Dietary tags", "Hero image 4:3 + Cooking Mode CTA"] },
            { zone: "Zone 2", title: "Recipe columns", items: ["Ingredients (38%) — checkboxes + pantry badges", "Metric/Imperial toggle", "Phase stepper (Cook → Serve → Restore)", "Step cards — active step highlighted in saffron", "Prev/Next nav + All Done button"] },
            { zone: "Zone 3", title: "Interactions", items: ["Save + Comment buttons", "Star rating (per-user)", "Comment thread", "Admin: Feature Tag input"] },
          ].map((z) => (
            <div key={z.zone}>
              <p
                className="text-[9px] font-bold uppercase tracking-widest mb-1"
                style={{ color: "var(--wc-pal-accent, #B07D56)" }}
              >
                {z.zone} — {z.title}
              </p>
              <ul className="space-y-0.5">
                {z.items.map((item) => (
                  <li key={item} className="text-[10px] flex items-start gap-1.5" style={{ color: "var(--fg-tertiary)" }}>
                    <span style={{ color: "#C8522A" }}>·</span> {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </SectionShell>
  );
}
