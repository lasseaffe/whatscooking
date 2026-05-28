import { ReactNode } from "react";

export function SectionShell({
  id, number, title, lede, children,
}: { id: string; number: string; title: string; lede?: string; children: ReactNode }) {
  return (
    <section id={id} className="scroll-mt-24 py-10 border-t" style={{ borderColor: "var(--wc-border-default, #292927)" }}>
      <header className="mb-6">
        <p className="text-[10px] uppercase tracking-[0.3em]" style={{ color: "var(--wc-pal-accent, #B07D56)" }}>
          §{number}
        </p>
        <h2 className="mt-1" style={{ fontFamily: "var(--font-fraunces, 'Fraunces', Georgia, serif)", fontSize: 32, fontWeight: 600, letterSpacing: "-0.01em", color: "var(--fg-primary, #fff)" }}>
          {title}
        </h2>
        {lede && (
          <p className="mt-2 max-w-2xl text-[15px] leading-relaxed" style={{ color: "var(--fg-secondary, #e7e7e6)" }}>
            {lede}
          </p>
        )}
      </header>
      {children}
    </section>
  );
}

export const CARD_STYLE: React.CSSProperties = {
  background: "var(--wc-bg-card, #121211)",
  border: "1px solid var(--wc-border-default, #292927)",
  borderRadius: "0.75rem",
};
