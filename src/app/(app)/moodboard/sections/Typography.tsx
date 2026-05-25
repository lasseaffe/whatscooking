import { moodboard } from "../moodboard.config";
import { SectionShell, CARD_STYLE } from "./SectionShell";

export function Typography() {
  return (
    <SectionShell
      id="typography"
      number="03"
      title="Typography"
      lede="Each face rendered in its actual loaded font. Recipe headings in Fraunces; cooking prose in Libre Baskerville; quantities in mono."
    >
      <div className="space-y-6">
        {moodboard.fonts.map((f) => (
          <article key={f.cssVar} className="p-5" style={CARD_STYLE}>
            <header className="flex flex-wrap items-baseline gap-3 mb-3">
              <h3 className="text-xl" style={{ fontFamily: `var(${f.cssVar})`, color: "var(--fg-primary)" }}>{f.role}</h3>
              <code className="text-[11px]" style={{ color: "var(--wc-pal-accent, #B07D56)", fontFamily: "var(--font-mono)" }}>{f.cssVar}</code>
            </header>
            <p className="text-[12px] italic mb-4" style={{ color: "var(--fg-tertiary)" }}>{f.note}</p>
            <div style={{ fontFamily: `var(${f.cssVar})`, color: "var(--fg-primary)" }}>
              <p style={{ fontSize: 64, lineHeight: 1, marginBottom: 8 }}>Aa</p>
              <p style={{ fontSize: 36, lineHeight: 1.18, fontWeight: 600, marginBottom: 8 }}>{f.specimen}</p>
              <p style={{ fontSize: 17, lineHeight: 1.6 }}>{f.specimen}</p>
              <p style={{ fontSize: 12, color: "var(--fg-tertiary)" }}>The quick brown fox jumps over the lazy dog · 0123456789 · ½ ⅓ ¼ ⅛ · °C °F</p>
            </div>
          </article>
        ))}
      </div>
    </SectionShell>
  );
}
