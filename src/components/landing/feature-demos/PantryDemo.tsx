const ITEMS = ["Olive oil","Garlic","Pasta","Tomatoes"];

export function PantryDemo() {
  return (
    <>
      <style>{`
        @keyframes tick-item {
          0%,20% { opacity: 0.3 }
          30%,100% { opacity: 1 }
        }
        @keyframes check-appear {
          0%,20% { transform: scale(0); opacity: 0 }
          30%,100% { transform: scale(1); opacity: 1 }
        }
      `}</style>
      <div className="w-full py-2 space-y-1">
        {ITEMS.map((item, i) => (
          <div
            key={i}
            className="flex items-center gap-2 text-xs px-2 py-0.5"
            style={{
              color: "rgba(239,227,206,0.6)",
              animation: `tick-item 4s ease ${i * 0.5}s infinite`,
            }}
          >
            <span
              style={{
                width: 12, height: 12,
                borderRadius: 3,
                background: "rgba(200,120,42,0.25)",
                border: "1px solid rgba(200,120,42,0.4)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 8, color: "#C8782A",
                animation: `check-appear 4s ease ${i * 0.5}s infinite`,
              }}
            >✓</span>
            {item}
          </div>
        ))}
      </div>
    </>
  );
}
