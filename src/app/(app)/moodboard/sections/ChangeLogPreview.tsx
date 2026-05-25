import { parseMoodboardLog } from "../lib/parseMoodboardLog";
import { SectionShell, CARD_STYLE } from "./SectionShell";

export function ChangeLogPreview() {
  const entries = parseMoodboardLog(5);
  return (
    <SectionShell id="changelog" number="11" title="Change Log" lede="Latest entries from docs/moodboard.log.md. Each entry pairs what changed with what to revisit.">
      {entries.length === 0 ? (
        <div className="p-5 text-[14px] italic" style={{ ...CARD_STYLE, color: "var(--fg-tertiary)" }}>
          No entries yet. Add the first one in <code style={{ fontFamily: "var(--font-mono)", color: "var(--wc-pal-accent)" }}>docs/moodboard.log.md</code>.
        </div>
      ) : (
        <div className="space-y-4">
          {entries.map((e, i) => (
            <article key={`${e.date}-${i}`} className="p-5" style={CARD_STYLE}>
              <header className="flex items-baseline justify-between mb-3 gap-3">
                <h3 className="text-[15px] font-semibold" style={{ color: "var(--fg-primary)" }}>{e.title}</h3>
                <code className="text-[11px] shrink-0" style={{ color: "var(--wc-pal-accent, #B07D56)", fontFamily: "var(--font-mono)" }}>{e.date}</code>
              </header>
              {e.changed.length > 0 && (
                <div className="mb-3">
                  <p className="text-[10px] uppercase tracking-[0.3em] mb-1" style={{ color: "var(--fg-positive)" }}>Changed</p>
                  <ul className="space-y-1">
                    {e.changed.map((c, j) => <li key={j} className="text-[14px]" style={{ color: "var(--fg-primary)", fontFamily: "var(--font-libre-baskerville, Georgia, serif)" }}>· {c}</li>)}
                  </ul>
                </div>
              )}
              {e.ideas.length > 0 && (
                <div>
                  <p className="text-[10px] uppercase tracking-[0.3em] mb-1" style={{ color: "var(--fg-attention)" }}>Ideas / next steps</p>
                  <ul className="space-y-1">
                    {e.ideas.map((c, j) => <li key={j} className="text-[14px] italic" style={{ color: "var(--fg-tertiary)", fontFamily: "var(--font-libre-baskerville, Georgia, serif)" }}>· {c}</li>)}
                  </ul>
                </div>
              )}
            </article>
          ))}
        </div>
      )}
    </SectionShell>
  );
}
