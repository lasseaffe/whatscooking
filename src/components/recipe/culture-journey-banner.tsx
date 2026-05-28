import type { CulturalJourney } from "@/lib/types";

interface Props {
  journey: CulturalJourney | null | undefined;
}

export default function CultureJourneyBanner({ journey }: Props) {
  if (!journey) return null;

  return (
    <div
      style={{ background: "#0d0b1e", borderRadius: "0.75rem", padding: "1.25rem 1.5rem" }}
      aria-label="Cultural Journey"
    >
      {/* Header */}
      <div style={{ display: "flex", alignItems: "baseline", gap: "0.75rem", marginBottom: "1.25rem" }}>
        <span
          style={{
            fontSize: "0.625rem",
            fontWeight: 700,
            letterSpacing: "0.12em",
            color: "#a78bfa",
            textTransform: "uppercase",
          }}
        >
          CULTURAL JOURNEY
        </span>
        <span style={{ fontSize: "0.8125rem", color: "#c4b5fd", fontStyle: "italic" }}>
          {journey.period}
        </span>
      </div>

      {/* Stops */}
      <ol style={{ listStyle: "none", margin: 0, padding: 0 }}>
        {journey.stops.map((stop, idx) => (
          <li key={idx}>
            <div style={{ display: "flex", gap: "0.75rem", alignItems: "flex-start" }}>
              <span style={{ fontSize: "1.25rem", lineHeight: 1 }} aria-hidden="true">
                {stop.emoji}
              </span>
              <div>
                <p style={{ margin: 0, fontWeight: 600, color: "#ede9fe", fontSize: "0.9375rem" }}>
                  {stop.name}
                </p>
                <p style={{ margin: "0.125rem 0 0", color: "#8b7eaf", fontSize: "0.8125rem" }}>
                  {stop.note}
                </p>
              </div>
            </div>
            {/* Connector between stops */}
            {idx < journey.stops.length - 1 && (
              <div
                aria-hidden="true"
                style={{
                  marginLeft: "0.625rem",
                  paddingLeft: "0.625rem",
                  borderLeft: "1px solid #3b2e6e",
                  height: "1rem",
                  marginTop: "0.25rem",
                  marginBottom: "0.25rem",
                }}
              />
            )}
          </li>
        ))}
      </ol>
    </div>
  );
}
