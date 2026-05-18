import DOMPurify from "isomorphic-dompurify";
import { moodboard } from "../moodboard.config";
import { SectionShell, CARD_STYLE } from "./SectionShell";

const sanitize = (html: string) =>
  DOMPurify.sanitize(html, { USE_PROFILES: { html: true }, ADD_ATTR: ["style"] });

export function DoDont() {
  return (
    <SectionShell id="dodont" number="08" title="Do / Don't" lede="Each pair shows the off-brand pattern and the editorial-correct one.">
      <div className="space-y-5">
        {moodboard.doDont.map((pair) => (
          <article key={pair.topic} className="p-5" style={CARD_STYLE}>
            <h3 className="text-[13px] uppercase tracking-[0.25em] mb-3" style={{ color: "var(--fg-primary)" }}>{pair.topic}</h3>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <p className="text-[10px] uppercase tracking-[0.3em] mb-2" style={{ color: "var(--fg-destructive)" }}>✗ {pair.wrong.label}</p>
                <div className="p-4" style={{ border: "1px solid var(--border-destructive, #e12429)", background: "var(--wc-bg-elevated, #1f1f1e)", borderRadius: "0.5rem" }} dangerouslySetInnerHTML={{ __html: sanitize(pair.wrong.html) }} />
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-[0.3em] mb-2" style={{ color: "var(--fg-positive)" }}>✓ {pair.right.label}</p>
                <div className="p-4" style={{ border: "1px solid var(--border-positive, #338500)", background: "var(--wc-bg-elevated, #1f1f1e)", borderRadius: "0.5rem" }} dangerouslySetInnerHTML={{ __html: sanitize(pair.right.html) }} />
              </div>
            </div>
          </article>
        ))}
      </div>
    </SectionShell>
  );
}
