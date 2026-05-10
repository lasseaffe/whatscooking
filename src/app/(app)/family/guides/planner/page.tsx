import Link from "next/link";

export default function GuidePlannerPage() {
  const steps = [
    "Add any adult recipe to your weekly plan",
    "The baby track shows a suggested variant based on your baby's current milestone",
    "Override or accept the suggestion, then generate your shopping list — baby items included",
  ];

  return (
    <>
      <style>{`
        .back-link {
          color: #8A6A4A;
          text-decoration: none;
          font-size: 13px;
          transition: color 0.2s;
        }
        .back-link:hover {
          color: #B07D56;
        }
        .step-card {
          background: #1A1008;
          border: 1px solid #3A2416;
          border-radius: 10px;
          padding: 16px;
          display: flex;
          gap: 14px;
          align-items: flex-start;
        }
        .planner-cta {
          display: inline-block;
          background: #B07D56;
          color: #1A1008;
          font-weight: 700;
          font-size: 15px;
          padding: 12px 24px;
          border-radius: 10px;
          text-decoration: none;
          transition: background 0.2s;
        }
        .planner-cta:hover {
          background: #C9935E;
        }
      `}</style>

      <div style={{ maxWidth: 640, margin: "0 auto", padding: "24px 16px 48px" }}>
        {/* Back */}
        <Link href="/family/guides" className="back-link">
          ← Back to Guides
        </Link>

        {/* Header */}
        <div style={{ marginTop: 16, marginBottom: 24 }}>
          <h1
            style={{
              fontFamily: "'Libre Baskerville', Georgia, serif",
              color: "#EFE3CE",
              fontSize: 26,
              fontWeight: 700,
              margin: 0,
              lineHeight: 1.25,
            }}
          >
            Baby Track in Meal Planner
          </h1>
          <p style={{ color: "#C4A882", fontSize: 15, lineHeight: 1.7, marginTop: 12, marginBottom: 0 }}>
            When you add a meal to your family plan, What&apos;s Cooking can automatically suggest
            a baby-safe variant for your little one — adjusted for their current feeding stage.
          </p>
        </div>

        {/* How it works */}
        <h2
          style={{
            fontFamily: "'Libre Baskerville', Georgia, serif",
            color: "#EFE3CE",
            fontSize: 17,
            fontWeight: 700,
            marginBottom: 14,
            marginTop: 0,
          }}
        >
          How it works
        </h2>

        <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 32 }}>
          {steps.map((step, i) => (
            <div key={i} className="step-card">
              {/* Step number */}
              <div
                style={{
                  flexShrink: 0,
                  width: 28,
                  height: 28,
                  borderRadius: "50%",
                  background: "linear-gradient(135deg, #B07D56, #5F3E2D)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 700,
                  fontSize: 13,
                  color: "#FFFFFF",
                }}
              >
                {i + 1}
              </div>
              <p style={{ color: "#C4A882", fontSize: 15, lineHeight: 1.6, margin: 0 }}>
                {step}
              </p>
            </div>
          ))}
        </div>

        {/* CTA */}
        <Link href="/plans" className="planner-cta">
          Go to Meal Planner →
        </Link>
      </div>
    </>
  );
}
