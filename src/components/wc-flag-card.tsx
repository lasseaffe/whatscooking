// src/components/wc-flag-card.tsx
import Link from "next/link";

interface WcFlagCardProps {
  code: string;        // ISO-2 or subdivision code e.g. "FR", "GB-ENG"
  name: string;
  cuisineSlug: string;
  cookedCount: number;
  threshold: number;
  confColor: string;
  index: number;
}

export function WcFlagCard({
  code,
  name,
  cuisineSlug,
  cookedCount,
  threshold,
  confColor,
  index,
}: WcFlagCardProps) {
  const stamped = cookedCount >= threshold;
  const started = cookedCount > 0 && !stamped;
  const isoLower = code.toLowerCase();

  const statusBg = stamped
    ? "rgba(20,80,10,0.75)"
    : started
    ? "rgba(80,50,5,0.75)"
    : "rgba(5,3,1,0.65)";

  const borderColor = stamped
    ? "rgba(100,200,60,0.4)"
    : started
    ? "rgba(200,140,30,0.35)"
    : "rgba(42,24,8,0.5)";

  return (
    <Link
      id={code}
      href={`/cuisines/${cuisineSlug}`}
      title={name}
      className="wc-card group"
      style={
        {
          "--delay": `${index * 30}ms`,
          "--conf-color": confColor,
          border: `1px solid ${borderColor}`,
        } as React.CSSProperties
      }
    >
      <img
        src={`https://flagcdn.com/w80/${isoLower}.png`}
        alt={`${name} flag`}
        width={80}
        height={54}
        loading="lazy"
        className="wc-card__flag"
      />

      <div className="wc-card__overlay" style={{ background: statusBg }} />

      <span className="wc-card__code">{code.length > 2 ? code.slice(-3) : code}</span>

      <div className="wc-card__status">
        {stamped ? (
          <span style={{ color: "#F4A261", fontSize: "0.6rem" }}>✦</span>
        ) : started ? (
          <span style={{ color: "#C8882A", fontSize: "0.55rem", fontWeight: 700 }}>
            {cookedCount}/{threshold}
          </span>
        ) : null}
      </div>

      {stamped && <div className="wc-card__shimmer" />}

      <style>{`
        .wc-card {
          position: relative;
          width: 96px;
          height: 72px;
          border-radius: 10px;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-decoration: none;
          animation: wc-card-in 0.35s ease both;
          animation-delay: var(--delay, 0ms);
          transition: transform 150ms ease, filter 150ms ease;
        }
        .wc-card:hover {
          transform: translateY(-3px);
          filter: brightness(1.1);
        }
        @keyframes wc-card-in {
          from { opacity: 0; transform: scale(0.82); }
          to   { opacity: 1; transform: scale(1); }
        }
        .wc-card__flag {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .wc-card__overlay {
          position: absolute;
          inset: 0;
        }
        .wc-card__code {
          position: relative;
          z-index: 2;
          font-size: 0.95rem;
          font-weight: 900;
          color: #fff;
          letter-spacing: 0.04em;
          text-shadow: 0 1px 6px rgba(0,0,0,0.9), 0 0 12px rgba(0,0,0,0.6);
        }
        .wc-card__status {
          position: absolute;
          bottom: 4px;
          z-index: 2;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .wc-card__shimmer {
          position: absolute;
          inset: 0;
          z-index: 3;
          pointer-events: none;
          animation: wc-shimmer 0.8s ease both;
          animation-delay: calc(var(--delay, 0ms) + 200ms);
          background: linear-gradient(
            105deg,
            transparent 40%,
            rgba(244,162,97,0.35) 50%,
            transparent 60%
          );
          background-size: 200% 100%;
        }
        @keyframes wc-shimmer {
          from { background-position: 200% 0; opacity: 0; }
          30%  { opacity: 1; }
          to   { background-position: -200% 0; opacity: 0; }
        }
      `}</style>
    </Link>
  );
}
