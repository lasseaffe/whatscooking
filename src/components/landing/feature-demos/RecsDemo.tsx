export function RecsDemo() {
  return (
    <>
      <style>{`
        @keyframes star-fill {
          0%,100% { color: rgba(239,227,206,0.15) }
          50% { color: #F2C94C }
        }
      `}</style>
      <div className="flex items-center justify-center gap-1.5 py-4">
        {[0,1,2,3,4].map((i) => (
          <span
            key={i}
            style={{
              fontSize: 18,
              animation: `star-fill 2.5s ease ${i * 200}ms infinite`,
            }}
          >
            ★
          </span>
        ))}
      </div>
    </>
  );
}
