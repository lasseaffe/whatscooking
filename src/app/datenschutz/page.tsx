import Link from "next/link";
import { ChevronLeft, Shield } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Datenschutzerklärung — What's Cooking",
  description: "Datenschutzerklärung gemäß DSGVO und BDSG für What's Cooking.",
};

export default function DatenschutzPage() {
  const effectiveDate = "21. April 2026";
  const controllerEmail = "datenschutz@whatscooking.app";

  return (
    <div style={{ minHeight: "100vh", background: "var(--wc-floor, #1F1B19)", color: "var(--fg-primary, #EFE3CE)" }}>
      <div style={{ maxWidth: 760, margin: "0 auto", padding: "2rem 1.5rem 4rem" }}>

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
            <Shield style={{ width: 22, height: 22, color: "var(--wc-pal-accent, #B07D56)" }} />
          </div>
          <div>
            <h1 style={{ fontFamily: "'Libre Baskerville', Georgia, serif", fontSize: "1.75rem", fontWeight: 800, lineHeight: 1.2, marginBottom: "0.4rem" }}>
              Datenschutzerklärung
            </h1>
            <p style={{ color: "rgba(239,227,206,0.5)", fontSize: "0.85rem" }}>
              Zuletzt aktualisiert: {effectiveDate} · Gemäß Art. 13/14 DSGVO
            </p>
          </div>
        </div>

        <LegalSection title="1. Verantwortlicher (Art. 13 Abs. 1 lit. a DSGVO)">
          <p>Verantwortlicher im Sinne der Datenschutz-Grundverordnung (DSGVO) ist:</p>
          <div style={{ marginTop: "0.75rem", padding: "1rem", borderRadius: "12px", background: "rgba(42,24,8,0.5)", border: "1px solid rgba(58,36,22,0.5)" }}>
            <p><strong>What&apos;s Cooking</strong></p>
            <p>E-Mail: <a href={`mailto:${controllerEmail}`} style={{ color: "var(--wc-pal-accent, #B07D56)" }}>{controllerEmail}</a></p>
          </div>
        </LegalSection>

        <LegalSection title="2. Erhobene personenbezogene Daten">
          <p>Wir verarbeiten folgende Kategorien personenbezogener Daten:</p>
          <ul>
            <li><strong>Kontodaten:</strong> E-Mail-Adresse, Anmeldezeitpunkt (verwaltet durch Supabase Auth)</li>
            <li><strong>Nutzungsdaten:</strong> Gespeicherte Rezepte, Bewertungen, Kommentare, Wischgesten (Swipe-Verlauf)</li>
            <li><strong>Vorratskammer:</strong> Zutaten, Mengen, Ablaufdaten (keine Gesundheitsdaten)</li>
            <li><strong>Mahlzeitenpläne:</strong> Geplante Mahlzeiten, Wochenpläne</li>
            <li>
              <strong>Gesundheitsdaten (Art. 9 DSGVO — besondere Kategorien):</strong> Kalorieneinträge, Gewichtsdaten.
              Diese Daten werden nur mit Ihrer ausdrücklichen Einwilligung (Art. 9 Abs. 2 lit. a DSGVO) gespeichert.
            </li>
            <li><strong>Eigene Rezepte:</strong> Von Ihnen erstellte Rezeptinhalte inkl. Quell-URLs</li>
            <li><strong>Dinner-Party-Daten:</strong> Veranstaltungsort (Freitext), Datum, Gästelisten</li>
          </ul>
        </LegalSection>

        <LegalSection title="3. Rechtsgrundlagen der Verarbeitung (Art. 6 DSGVO)">
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.82rem" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(58,36,22,0.6)" }}>
                <Th>Verarbeitung</Th>
                <Th>Rechtsgrundlage</Th>
              </tr>
            </thead>
            <tbody>
              <TableRow a="Bereitstellung der Kernfunktionen (Rezepte, Vorratskammer, Planung)" b="Art. 6 Abs. 1 lit. b DSGVO — Vertragserfüllung" />
              <TableRow a="Gesundheitsdaten (Kalorien, Gewicht)" b="Art. 9 Abs. 2 lit. a DSGVO — ausdrückliche Einwilligung" />
              <TableRow a="Nutzungsanalyse / Swipe-Verlauf" b="Art. 6 Abs. 1 lit. f DSGVO — berechtigtes Interesse (Produktverbesserung)" />
              <TableRow a="Nutzer-Feedback" b="Art. 6 Abs. 1 lit. f DSGVO — berechtigtes Interesse" />
              <TableRow a="Kommunikation per E-Mail" b="Art. 6 Abs. 1 lit. b DSGVO — Vertragserfüllung" />
            </tbody>
          </table>
        </LegalSection>

        <LegalSection title="4. Weitergabe an Dritte / Auftragsverarbeiter">
          <p>Wir übermitteln personenbezogene Daten an folgende Dienstleister (Art. 28 DSGVO — Auftragsverarbeitung):</p>
          <ul>
            <li>
              <strong>Supabase Inc.</strong> (Datenbankhosting, Authentifizierung) — Serverstandort: EU (Frankfurt).
              Rechtsgrundlage: Standardvertragsklauseln (Art. 46 DSGVO) soweit anwendbar.
            </li>
            <li>
              <strong>Anthropic PBC</strong> (KI-Verarbeitung: Rezeptextraktion, Foto-Analyse, SOS-Hilfe) —
              Es werden keine direkt identifizierenden Daten (Name, E-Mail, Nutzer-ID) an Anthropic übermittelt.
              Fotos zur Zutaten-Erkennung werden nicht dauerhaft gespeichert. Hinweis wird in der App angezeigt.
            </li>
            <li>
              <strong>OpenAI OpCo, LLC</strong> (KI-gestützte Rezeptgenerierung) —
              Keine Nutzer-IDs werden in Prompts übermittelt.
            </li>
            <li>
              <strong>Spoonacular</strong> (Rezeptdatenbank, Nährwertdaten) —
              Es werden ausschließlich Suchbegriffe übermittelt, keine personenbezogenen Daten.
            </li>
            <li>
              <strong>Unsplash</strong> (Bildsuche) — Nur Küchenbegriffe, keine personenbezogenen Daten.
            </li>
          </ul>
        </LegalSection>

        <LegalSection title="5. Speicherdauer (Art. 5 Abs. 1 lit. e DSGVO)">
          <ul>
            <li>Kontodaten: Bis zur Löschung des Kontos</li>
            <li>Kalorieneinträge / Gewichtsdaten: Bis zur Kontolöschung oder auf Wunsch früher löschbar</li>
            <li>Swipe-Verlauf: Automatische Löschung nach 12 Monaten</li>
            <li>Kommentare: Werden bei Kontolöschung anonymisiert (kein Name, keine Nutzer-ID)</li>
            <li>Eigene Rezepte: Werden bei Kontolöschung anonymisiert (Inhalt bleibt, Identität entfernt)</li>
            <li>Nach Kontolöschung: Vollständige Löschung aller personenbezogenen Daten innerhalb von 30 Tagen</li>
          </ul>
        </LegalSection>

        <LegalSection title="6. Ihre Rechte (Art. 15–22 DSGVO)">
          <p>Sie haben folgende Rechte bezüglich Ihrer personenbezogenen Daten:</p>
          <ul>
            <li><strong>Auskunftsrecht (Art. 15 DSGVO):</strong> Sie können Auskunft über Ihre gespeicherten Daten verlangen.</li>
            <li><strong>Berichtigungsrecht (Art. 16 DSGVO):</strong> Unrichtige Daten können korrigiert werden.</li>
            <li><strong>Löschungsrecht / „Recht auf Vergessenwerden" (Art. 17 DSGVO):</strong> Sie können die Löschung aller Ihrer personenbezogenen Daten beantragen. Dies ist direkt in der App unter <em>Einstellungen → Konto löschen</em> möglich.</li>
            <li><strong>Recht auf Einschränkung (Art. 18 DSGVO):</strong> Verarbeitung kann unter bestimmten Umständen eingeschränkt werden.</li>
            <li><strong>Datenübertragbarkeit (Art. 20 DSGVO):</strong> Auf Anfrage stellen wir Ihre Daten in maschinenlesbarem Format bereit.</li>
            <li><strong>Widerspruchsrecht (Art. 21 DSGVO):</strong> Sie können der Verarbeitung auf Basis berechtigter Interessen widersprechen.</li>
            <li><strong>Widerruf der Einwilligung (Art. 7 Abs. 3 DSGVO):</strong> Eine erteilte Einwilligung (z. B. für Gesundheitsdaten) kann jederzeit widerrufen werden.</li>
          </ul>
          <p style={{ marginTop: "0.75rem" }}>
            Zur Ausübung Ihrer Rechte wenden Sie sich an: <a href={`mailto:${controllerEmail}`} style={{ color: "var(--wc-pal-accent, #B07D56)" }}>{controllerEmail}</a>
          </p>
          <p style={{ marginTop: "0.5rem" }}>
            Sie haben außerdem das Recht, sich bei der zuständigen Datenschutzbehörde zu beschweren.
            Zuständige Behörde in Deutschland: <a href="https://www.bfdi.bund.de" target="_blank" rel="noopener noreferrer" style={{ color: "var(--wc-pal-accent, #B07D56)" }}>Bundesbeauftragter für den Datenschutz und die Informationsfreiheit (BfDI)</a>.
          </p>
        </LegalSection>

        <LegalSection title="7. Cookies und Tracking">
          <p>
            What&apos;s Cooking verwendet ausschließlich technisch notwendige Cookies für die Authentifizierung (Supabase-Session).
            Es werden keine Tracking- oder Analyse-Cookies ohne Ihre ausdrückliche Einwilligung gesetzt.
            Tracking-Tools Dritter (z. B. Google Analytics) werden nicht verwendet.
          </p>
        </LegalSection>

        <LegalSection title="8. Datensicherheit (Art. 32 DSGVO)">
          <p>
            Alle Verbindungen sind TLS-verschlüsselt. Datenbankzugriffe werden durch Row Level Security (RLS)
            auf Supabase abgesichert — jeder Nutzer kann ausschließlich seine eigenen Daten lesen und schreiben.
            Der Service-Role-Schlüssel wird ausschließlich serverseitig verwendet und nie an den Client übertragen.
          </p>
        </LegalSection>

        <LegalSection title="9. Änderungen dieser Datenschutzerklärung">
          <p>
            Diese Datenschutzerklärung kann aktualisiert werden. Bei wesentlichen Änderungen werden Sie per
            E-Mail oder In-App-Benachrichtigung informiert. Das Datum der letzten Aktualisierung steht
            oben auf dieser Seite.
          </p>
        </LegalSection>

        <div style={{ marginTop: "3rem", padding: "1rem 1.5rem", borderRadius: "12px", background: "rgba(42,24,8,0.4)", border: "1px solid rgba(58,36,22,0.4)", fontSize: "0.78rem", color: "rgba(239,227,206,0.4)" }}>
          Stand: {effectiveDate} · What&apos;s Cooking · <a href={`mailto:${controllerEmail}`} style={{ color: "rgba(176,125,86,0.6)" }}>{controllerEmail}</a>
        </div>
      </div>
    </div>
  );
}

function LegalSection({ title, children }: { title: string; children: React.ReactNode }) {
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

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th style={{ textAlign: "left", padding: "0.4rem 0.6rem", color: "rgba(239,227,206,0.5)", fontWeight: 600, fontSize: "0.75rem" }}>
      {children}
    </th>
  );
}

function TableRow({ a, b }: { a: string; b: string }) {
  return (
    <tr style={{ borderBottom: "1px solid rgba(58,36,22,0.3)" }}>
      <td style={{ padding: "0.6rem 0.6rem 0.6rem 0", verticalAlign: "top", color: "rgba(239,227,206,0.7)" }}>{a}</td>
      <td style={{ padding: "0.6rem", verticalAlign: "top", color: "rgba(176,125,86,0.85)" }}>{b}</td>
    </tr>
  );
}
