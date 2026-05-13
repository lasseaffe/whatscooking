import { moodboard } from "../moodboard.config";
import { SectionShell, CARD_STYLE } from "./SectionShell";

export function SpacingRadii() {
  return (
    <SectionShell id="spacing" number="04" title="Spacing & Radii" lede="Generous radii. Cards round, chips pill, dividers sharp.">
      <div className="grid md:grid-cols-2 gap-6">
        <div className="p-5" style={CARD_STYLE}>
          <h3 className="text-[11px] uppercase tracking-[0.25em] mb-3" style={{ color: "var(--wc-pal-accent, #B07D56)" }}>Spacing scale (px)</h3>
          <div className="space-y-2">
            {moodboard.spacing.scale.map((px) => (
              <div key={px} className="flex items-center gap-3 text-[13px]" style={{ color: "var(--fg-primary)" }}>
                <span className="w-10 text-right" style={{ color: "var(--fg-tertiary)", fontFamily: "var(--font-mono)" }}>{px}px</span>
                <span className="block h-3" style={{ width: Math.max(px, 1), background: "var(--wc-pal-accent, #B07D56)" }} />
              </div>
            ))}
          </div>
        </div>

        <div className="p-5" style={CARD_STYLE}>
          <h3 className="text-[11px] uppercase tracking-[0.25em] mb-3" style={{ color: "var(--wc-pal-accent, #B07D56)" }}>Radii</h3>
          <div className="space-y-3">
            {moodboard.spacing.radii.map((r) => (
              <div key={r.name} className="flex items-center gap-4">
                <span className="block w-16 h-16 shrink-0" style={{ background: "var(--wc-bg-elevated, #1f1f1e)", border: "1px solid var(--wc-border-default)", borderRadius: r.value }} />
                <div>
                  <p className="text-[13px] font-semibold" style={{ color: "var(--fg-primary)" }}>{r.name} · {r.value}</p>
                  <p className="text-[11px] italic" style={{ color: "var(--fg-tertiary)" }}>{r.note}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </SectionShell>
  );
}
