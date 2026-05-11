export function EventsDemo() {
  const cells = Array.from({ length: 28 }, (_, i) => i);
  const highlighted = new Set([0,8,16,24,4,12,20,2,10,18]);
  return (
    <>
      <style>{`
        @keyframes cal-pulse {
          0%,100% { opacity: 0.2 }
          50% { opacity: 1 }
        }
      `}</style>
      <div className="grid grid-cols-7 gap-1 py-2 px-1">
        {cells.map((i) => (
          <div
            key={i}
            style={{
              height: 10,
              borderRadius: 3,
              background: highlighted.has(i) ? "rgba(200,120,42,0.7)" : "rgba(255,255,255,0.06)",
              animation: highlighted.has(i) ? `cal-pulse 2s ease ${(i % 7) * 120}ms infinite` : "none",
            }}
          />
        ))}
      </div>
    </>
  );
}
