import type { Metadata } from "next";
import { Identity } from "./sections/Identity";
import { ColorPalette } from "./sections/ColorPalette";
import { Typography } from "./sections/Typography";
import { SpacingRadii } from "./sections/SpacingRadii";
import { ComponentSamples } from "./sections/ComponentSamples";
import { PatternsAndModes } from "./sections/PatternsAndModes";
import { VoiceAndTone } from "./sections/VoiceAndTone";
import { DoDont } from "./sections/DoDont";
import { Iconography } from "./sections/Iconography";
import { Motion } from "./sections/Motion";
import { ChangeLogPreview } from "./sections/ChangeLogPreview";
import { RecipePageTemplate } from "./sections/RecipePageTemplate";

export const metadata: Metadata = {
  title: "Moodboard — What's Cooking",
  description: "Living design spec for What's Cooking — Culinary Parchment palette, typography, components, voice, motion.",
};

const TOC = [
  { id: "identity",   label: "Identity" },
  { id: "color",      label: "Color" },
  { id: "typography", label: "Typography" },
  { id: "spacing",    label: "Spacing & Radii" },
  { id: "components", label: "Components" },
  { id: "modes",      label: "Patterns & Modes" },
  { id: "voice",      label: "Voice & Tone" },
  { id: "dodont",     label: "Do / Don't" },
  { id: "icons",      label: "Iconography" },
  { id: "motion",     label: "Motion" },
  { id: "recipe-template", label: "Recipe Page Template" },
  { id: "changelog",  label: "Change Log" },
];

export default function MoodboardPage() {
  return (
    <div className="max-w-6xl mx-auto px-4 lg:px-8 py-10" style={{ background: "var(--bg-base)" }}>
      <header className="mb-10">
        <p className="text-[10px] uppercase tracking-[0.3em]" style={{ color: "var(--wc-pal-accent, #B07D56)" }}>What&apos;s Cooking · Living Design Spec</p>
        <h1
          style={{
            fontFamily: "var(--font-fraunces, 'Fraunces', Georgia, serif)",
            fontSize: "clamp(2.5rem, 6vw, 4rem)",
            fontWeight: 600,
            letterSpacing: "-0.02em",
            color: "var(--fg-primary)",
            marginTop: 8,
            lineHeight: 1.05,
          }}
        >
          Culinary Parchment
        </h1>
        <p className="mt-3 max-w-2xl text-[16px] leading-[1.7]" style={{ color: "var(--fg-secondary)", fontFamily: "var(--font-libre-baskerville, Georgia, serif)" }}>
          Reads from the same CSS variables, fonts, and components the rest of the app uses. If something here looks wrong, the live design system is wrong — fix it there, and this page updates.
        </p>
      </header>

      <div className="lg:grid lg:grid-cols-[200px_1fr] lg:gap-10">
        <nav className="hidden lg:block sticky top-24 self-start">
          <p className="text-[10px] uppercase tracking-[0.3em] mb-3" style={{ color: "var(--wc-pal-accent, #B07D56)" }}>Contents</p>
          <ul className="space-y-1">
            {TOC.map((t, i) => (
              <li key={t.id}>
                <a href={`#${t.id}`} className="text-[13px] hover:underline" style={{ color: "var(--fg-primary)" }}>
                  <span className="mr-2" style={{ color: "var(--wc-pal-accent, #B07D56)", fontFamily: "var(--font-mono)", fontSize: 11 }}>§{String(i + 1).padStart(2, "0")}</span>
                  {t.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div>
          <Identity />
          <ColorPalette />
          <Typography />
          <SpacingRadii />
          <ComponentSamples />
          <PatternsAndModes />
          <VoiceAndTone />
          <DoDont />
          <Iconography />
          <Motion />
          <RecipePageTemplate />
          <ChangeLogPreview />
        </div>
      </div>
    </div>
  );
}
