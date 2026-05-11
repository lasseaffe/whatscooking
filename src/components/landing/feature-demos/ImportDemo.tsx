const URL_TEXT = "instagram.com/p/abc123";
const INGREDIENTS = ["200g pasta","2 cloves garlic","olive oil"];

export function ImportDemo() {
  return (
    <>
      <style>{`
        @keyframes type-url {
          0% { width: 0 }
          40%,100% { width: 100% }
        }
        @keyframes fade-in-row {
          0%,50% { opacity: 0; transform: translateY(4px) }
          70%,100% { opacity: 1; transform: translateY(0) }
        }
      `}</style>
      <div className="w-full py-2 space-y-1.5">
        <div
          className="text-xs rounded-lg px-2 py-1 overflow-hidden whitespace-nowrap"
          style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(200,120,42,0.2)", color: "rgba(239,227,206,0.6)" }}
        >
          <span style={{ display: "inline-block", overflow: "hidden", animation: "type-url 3s steps(22,end) infinite" }}>
            {URL_TEXT}
          </span>
        </div>
        {INGREDIENTS.map((ing, i) => (
          <div
            key={i}
            className="text-xs px-2 py-0.5 rounded"
            style={{
              color: "rgba(239,227,206,0.55)",
              background: "rgba(255,255,255,0.03)",
              animation: `fade-in-row 3s ease ${i * 0.4 + 1.2}s infinite`,
            }}
          >
            {ing}
          </div>
        ))}
      </div>
    </>
  );
}
