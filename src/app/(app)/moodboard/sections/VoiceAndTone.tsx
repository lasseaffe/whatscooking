import { moodboard } from "../moodboard.config";
import { SectionShell, CARD_STYLE } from "./SectionShell";

export function VoiceAndTone() {
  const { voice } = moodboard;
  return (
    <SectionShell id="voice" number="07" title="Voice & Tone" lede="WC speaks like a working cookbook — specific, editorial, never feedy.">
      <div className="p-5 mb-5" style={CARD_STYLE}>
        <h3 className="text-[11px] uppercase tracking-[0.25em] mb-3" style={{ color: "var(--wc-pal-accent, #B07D56)" }}>Pillars</h3>
        <ul className="space-y-2 list-none">
          {voice.pillars.map((p) => (
            <li key={p} className="flex items-baseline gap-3 text-[15px]" style={{ color: "var(--fg-primary)", fontFamily: "var(--font-libre-baskerville, Georgia, serif)" }}>
              <span style={{ color: "var(--wc-pal-accent, #B07D56)" }}>◆</span>{p}
            </li>
          ))}
        </ul>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div className="p-5" style={CARD_STYLE}>
          <h3 className="text-[11px] uppercase tracking-[0.25em] mb-3" style={{ color: "var(--fg-positive)" }}>Do</h3>
          <ul className="space-y-2">
            {voice.do.map((d) => <li key={d} style={{ fontFamily: "var(--font-libre-baskerville, Georgia, serif)", color: "var(--fg-primary)" }}>{d}</li>)}
          </ul>
        </div>
        <div className="p-5" style={CARD_STYLE}>
          <h3 className="text-[11px] uppercase tracking-[0.25em] mb-3" style={{ color: "var(--fg-destructive)" }}>Don&apos;t</h3>
          <ul className="space-y-2">
            {voice.dont.map((d) => <li key={d} className="line-through" style={{ color: "var(--fg-tertiary)" }}>{d}</li>)}
          </ul>
        </div>
      </div>
    </SectionShell>
  );
}
