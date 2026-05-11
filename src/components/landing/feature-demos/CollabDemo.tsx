export function CollabDemo() {
  return (
    <>
      <style>{`
        @keyframes cursor-a {
          0% { left: 8px }
          60%,100% { left: 50% }
        }
        @keyframes cursor-b {
          0% { right: 8px }
          60%,100% { right: 50% }
        }
      `}</style>
      <div className="relative flex items-center justify-center py-2 h-16">
        <div
          className="rounded-xl flex items-center justify-center text-xs"
          style={{
            width: 60, height: 36,
            background: "rgba(200,120,42,0.12)",
            border: "1px solid rgba(200,120,42,0.3)",
            color: "rgba(239,227,206,0.5)",
            position: "relative", zIndex: 1,
          }}
        >
          Menu
        </div>
        <div
          style={{
            position: "absolute", top: "38%",
            width: 10, height: 10, borderRadius: "50%",
            background: "#C8782A",
            animation: "cursor-a 3s ease-in-out infinite",
            zIndex: 2,
          }}
        />
        <div
          style={{
            position: "absolute", top: "55%",
            width: 10, height: 10, borderRadius: "50%",
            background: "#F4A261",
            animation: "cursor-b 3s ease-in-out infinite",
            zIndex: 2,
          }}
        />
      </div>
    </>
  );
}
