import Link from "next/link";
import { ChevronLeft, FileText } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Impressum — What's Cooking",
  description: "Impressum / Anbieterkennzeichnung gemäß § 5 TMG für What's Cooking.",
};

export default function ImpressumPage() {
  return (
    <div style={{ minHeight: "100vh", background: "var(--wc-floor, #1F1B19)", color: "var(--fg-primary, #EFE3CE)" }}>
      <div style={{ maxWidth: 680, margin: "0 auto", padding: "2rem 1.5rem 4rem" }}>

        {/* Back nav */}
        <Link href="/settings"
          className="inline-flex items-center gap-1.5 text-sm font-medium hover:opacity-80 transition-opacity mb-8"
          style={{ color: "var(--wc-pal-accent, #B07D56)" }}>
          <ChevronLeft style={{ width: 16, height: 16 }} /> Zurück zu Einstellungen
        </Link>

        {/* Header */}
        <div className="flex items-start gap-4 mb-8">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
            style={{ background: "rgba(42,24,8,0.8)", border: "1px solid rgba(90,50,20,0.4)" }}>
            <FileText style={{ width: 22, height: 22, color: "var(--wc-pal-accent, #B07D56)" }} />
          </div>
          <div>
            <h1 style={{ fontFamily: "'Libre Baskerville', Georgia, serif", fontSize: "1.75rem", fontWeight: 800, lineHeight: 1.2, marginBottom: "0.4rem" }}>
              Impressum
            </h1>
            <p style={{ color: "rgba(239,227,206,0.5)", fontSize: "0.85rem" }}>
              Anbieterkennzeichnung gemäß § 5 TMG
            </p>
          </div>
        </div>

        <ImpressumSection title="Angaben gemäß § 5 TMG">
          <p><strong>What&apos;s Cooking</strong></p>
          <p style={{ marginTop: "0.5rem", color: "rgba(239,227,206,0.55)", fontSize: "0.8rem" }}>
            [Vollständige Anschrift des Betreibers hier eintragen — gesetzlich vorgeschrieben]
          </p>
        </ImpressumSection>

        <ImpressumSection title="Kontakt">
          <p>E-Mail: <a href="mailto:kontakt@whatscooking.app" style={{ color: "var(--wc-pal-accent, #B07D56)" }}>kontakt@whatscooking.app</a></p>
        </ImpressumSection>

        <ImpressumSection title="Verantwortlich für den Inhalt nach § 18 Abs. 2 MStV">
          <p style={{ color: "rgba(239,227,206,0.55)", fontSize: "0.8rem" }}>
            [Name und Anschrift der verantwortlichen Person hier eintragen]
          </p>
        </ImpressumSection>

        <ImpressumSection title="Datenschutz">
          <p>
            Informationen zum Datenschutz finden Sie in unserer{" "}
            <Link href="/datenschutz" style={{ color: "var(--wc-pal-accent, #B07D56)" }}>
              Datenschutzerklärung
            </Link>.
          </p>
        </ImpressumSection>

        <ImpressumSection title="Haftung für Inhalte">
          <p>
            Als Diensteanbieter sind wir gemäß § 7 Abs. 1 TMG für eigene Inhalte auf diesen Seiten nach den allgemeinen
            Gesetzen verantwortlich. Nach §§ 8 bis 10 TMG sind wir als Diensteanbieter jedoch nicht unter der Verpflichtung,
            übermittelte oder gespeicherte fremde Informationen zu überwachen oder nach Umständen zu forschen, die auf eine
            rechtswidrige Tätigkeit hinweisen.
          </p>
          <p style={{ marginTop: "0.75rem" }}>
            Verpflichtungen zur Entfernung oder Sperrung der Nutzung von Informationen nach den allgemeinen Gesetzen
            bleiben hiervon unberührt. Eine diesbezügliche Haftung ist jedoch erst ab dem Zeitpunkt der Kenntnis einer
            konkreten Rechtsverletzung möglich.
          </p>
        </ImpressumSection>

        <ImpressumSection title="Haftung für Links">
          <p>
            Unser Angebot enthält Links zu externen Websites Dritter, auf deren Inhalte wir keinen Einfluss haben.
            Deshalb können wir für diese fremden Inhalte auch keine Gewähr übernehmen. Für die Inhalte der verlinkten
            Seiten ist stets der jeweilige Anbieter oder Betreiber der Seiten verantwortlich.
          </p>
        </ImpressumSection>

        <ImpressumSection title="Urheberrecht">
          <p>
            Die durch die Seitenbetreiber erstellten Inhalte und Werke auf diesen Seiten unterliegen dem deutschen
            Urheberrecht. Die Vervielfältigung, Bearbeitung, Verbreitung und jede Art der Verwertung außerhalb der
            Grenzen des Urheberrechtes bedürfen der schriftlichen Zustimmung des jeweiligen Autors bzw. Erstellers.
          </p>
          <p style={{ marginTop: "0.75rem" }}>
            Soweit die Inhalte auf dieser Seite nicht vom Betreiber erstellt wurden, werden die Urheberrechte Dritter
            beachtet. Insbesondere werden Inhalte Dritter als solche gekennzeichnet. Sollten Sie trotzdem auf eine
            Urheberrechtsverletzung aufmerksam werden, bitten wir um einen entsprechenden Hinweis. Bei Bekanntwerden
            von Rechtsverletzungen werden wir derartige Inhalte umgehend entfernen.
          </p>
        </ImpressumSection>

        <ImpressumSection title="Streitschlichtung">
          <p>
            Die Europäische Kommission stellt eine Plattform zur Online-Streitbeilegung (OS) bereit:{" "}
            <a href="https://ec.europa.eu/consumers/odr" target="_blank" rel="noopener noreferrer"
              style={{ color: "var(--wc-pal-accent, #B07D56)" }}>
              https://ec.europa.eu/consumers/odr
            </a>.
            Unsere E-Mail-Adresse finden Sie oben im Impressum.
          </p>
          <p style={{ marginTop: "0.75rem" }}>
            Wir sind nicht bereit oder verpflichtet, an Streitbeilegungsverfahren vor einer
            Verbraucherschlichtungsstelle teilzunehmen.
          </p>
        </ImpressumSection>

        <div style={{ marginTop: "3rem", padding: "1rem 1.5rem", borderRadius: "12px", background: "rgba(42,24,8,0.4)", border: "1px solid rgba(58,36,22,0.4)", fontSize: "0.78rem", color: "rgba(239,227,206,0.4)" }}>
          What&apos;s Cooking · <a href="mailto:kontakt@whatscooking.app" style={{ color: "rgba(176,125,86,0.6)" }}>kontakt@whatscooking.app</a>
        </div>
      </div>
    </div>
  );
}

function ImpressumSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: "2rem" }}>
      <h2 style={{
        fontFamily: "'Libre Baskerville', Georgia, serif",
        fontSize: "1rem",
        fontWeight: 700,
        color: "var(--wc-pal-accent, #B07D56)",
        marginBottom: "0.75rem",
        paddingBottom: "0.5rem",
        borderBottom: "1px solid rgba(58,36,22,0.5)",
      }}>
        {title}
      </h2>
      <div style={{ fontSize: "0.875rem", lineHeight: 1.75, color: "rgba(239,227,206,0.75)" }}>
        {children}
      </div>
    </section>
  );
}
