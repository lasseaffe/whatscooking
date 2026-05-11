export function MealPlannerDemo() {
  const days = ["M","T","W","T","F","S","S"];
  const lunch =  [0.3,0.6,0.2,0.8,0.0,0.5,0.7];
  const dinner = [0.7,0.9,0.5,1.0,0.6,0.3,0.0];
  return (
    <>
      <style>{`
        @keyframes cell-fill {
          0%,100% { opacity: 0.15 }
          50% { opacity: 1 }
        }
      `}</style>
      <div className="w-full px-1 py-2">
        <div className="grid grid-cols-7 gap-1 mb-1">
          {days.map((d,i) => (
            <div key={i} className="text-center font-mono" style={{ fontSize: "7px", color: "rgba(239,227,206,0.35)" }}>{d}</div>
          ))}
        </div>
        {[lunch, dinner].map((row, ri) => (
          <div key={ri} className="grid grid-cols-7 gap-1 mb-1">
            {row.map((op, ci) => (
              <div
                key={ci}
                style={{
                  height: 7,
                  borderRadius: 2,
                  background: op ? `rgba(200,120,42,${op})` : "transparent",
                  border: op ? "none" : "1px solid rgba(200,120,42,0.15)",
                  animation: op ? `cell-fill 2s ease-in-out ${ci * 80}ms infinite` : "none",
                }}
              />
            ))}
          </div>
        ))}
      </div>
    </>
  );
}
