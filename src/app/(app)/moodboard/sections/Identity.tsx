import { moodboard } from "../moodboard.config";
import { SectionShell, CARD_STYLE } from "./SectionShell";

export function Identity() {
  const { identity } = moodboard;
  return (
    <SectionShell id="identity" number="01" title="Identity" lede={identity.tagline}>
      <div className="p-6 max-w-3xl" style={CARD_STYLE}>
        <p style={{ fontFamily: "var(--font-libre-baskerville, Georgia, serif)", fontSize: 17, lineHeight: 1.7, color: "var(--fg-primary, #fff)" }}>
          {identity.philosophy}
        </p>
        <hr className="my-5" style={{ border: "none", borderTop: "1px solid var(--wc-border-default)" }} />
        <ul className="space-y-2 list-none">
          {identity.pillars.map((p) => (
            <li key={p} className="flex items-baseline gap-3 text-[15px]" style={{ color: "var(--fg-primary)" }}>
              <span style={{ color: "var(--wc-pal-accent, #B07D56)" }}>◆</span>
              <span style={{ fontFamily: "var(--font-libre-baskerville, Georgia, serif)" }}>{p}</span>
            </li>
          ))}
        </ul>
      </div>
    </SectionShell>
  );
}
