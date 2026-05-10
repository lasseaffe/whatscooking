export default function PlansLoading() {
  return (
    <div className="px-6 py-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="skeleton h-8 w-40 rounded-xl" />
        <div className="skeleton h-9 w-28 rounded-xl" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-2xl overflow-hidden" style={{ border: "1px solid var(--wc-border-subtle, #3A2416)" }}>
            <div className="skeleton h-32 w-full" />
            <div className="p-4 flex flex-col gap-2" style={{ background: "var(--bg-secondary)" }}>
              <div className="skeleton h-4 w-3/4 rounded" />
              <div className="skeleton h-3 w-1/2 rounded" />
            </div>
          </div>
        ))}
      </div>
      <div className="skeleton h-px w-full mb-8" />
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-2xl overflow-hidden" style={{ border: "1px solid var(--wc-border-subtle, #3A2416)" }}>
            <div className="skeleton h-20 w-full" />
            <div className="p-3 flex flex-col gap-2" style={{ background: "var(--bg-secondary)" }}>
              <div className="skeleton h-3 w-full rounded" />
              <div className="skeleton h-3 w-2/3 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
