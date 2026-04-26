import Link from "next/link";

export function WcBadge({ nationCode }: { nationCode: string }) {
  return (
    <Link
      href={`/world-cup-2026#${nationCode}`}
      onClick={(e) => e.stopPropagation()}
      style={{
        position: "absolute",
        top: 40,
        right: 8,
        zIndex: 10,
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        padding: "3px 8px",
        borderRadius: 999,
        background: "rgba(10,6,3,0.85)",
        border: "1px solid rgba(244,162,97,0.4)",
        color: "#F4A261",
        fontSize: "0.6rem",
        fontWeight: 800,
        textDecoration: "none",
        letterSpacing: "0.05em",
        backdropFilter: "blur(8px)",
      }}
    >
      ⚽ WC2026
    </Link>
  );
}
