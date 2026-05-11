export function MealSwipeDemo() {
  return (
    <>
      <style>{`
        @keyframes swipe-left {
          0%,30% { transform: translateX(0) rotate(0deg); opacity: 1 }
          45% { transform: translateX(-60px) rotate(-12deg); opacity: 0 }
          50%,80% { transform: translateX(0) rotate(0deg); opacity: 1 }
          95% { transform: translateX(60px) rotate(12deg); opacity: 0 }
          100% { transform: translateX(0) rotate(0deg); opacity: 1 }
        }
        @keyframes icon-left {
          0%,25% { opacity: 0 }
          35%,45% { opacity: 1 }
          50%,100% { opacity: 0 }
        }
        @keyframes icon-right {
          0%,75% { opacity: 0 }
          85%,95% { opacity: 1 }
          100% { opacity: 0 }
        }
      `}</style>
      <div className="relative flex items-center justify-center py-2 h-16">
        <span style={{ position: "absolute", left: "28%", fontSize: 16, animation: "icon-left 4s ease-in-out infinite" }}>✕</span>
        <div
          className="rounded-xl flex items-center justify-center text-xs font-semibold"
          style={{
            width: 70, height: 44,
            background: "rgba(200,120,42,0.18)",
            border: "1px solid rgba(200,120,42,0.3)",
            color: "#C8782A",
            animation: "swipe-left 4s ease-in-out infinite",
          }}
        >
          Recipe
        </div>
        <span style={{ position: "absolute", right: "28%", fontSize: 16, color: "#e74c3c", animation: "icon-right 4s ease-in-out infinite" }}>♥</span>
      </div>
    </>
  );
}
