const CHIPS = ["Pasta","Tacos","Ramen","Salad","Curry","Sushi","Pizza","Stew"];

export function DiscoverDemo() {
  return (
    <>
      <style>{`
        @keyframes scroll-chips {
          0% { transform: translateX(0) }
          100% { transform: translateX(-50%) }
        }
      `}</style>
      <div className="w-full overflow-hidden py-2">
        <div
          style={{
            display: "flex",
            gap: 6,
            width: "max-content",
            animation: "scroll-chips 6s linear infinite",
          }}
        >
          {[...CHIPS, ...CHIPS].map((c, i) => (
            <span
              key={i}
              className="text-xs px-2.5 py-1 rounded-full whitespace-nowrap"
              style={{
                background: i % 3 === 0 ? "rgba(200,120,42,0.18)" : "rgba(255,255,255,0.06)",
                color: i % 3 === 0 ? "#C8782A" : "rgba(239,227,206,0.5)",
                border: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              {c}
            </span>
          ))}
        </div>
      </div>
    </>
  );
}
