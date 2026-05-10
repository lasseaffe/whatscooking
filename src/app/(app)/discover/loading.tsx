export default function DiscoverLoading() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero skeleton */}
      <div className="px-6 sm:px-10 py-14 max-w-5xl mx-auto w-full">
        <div className="skeleton h-5 w-64 rounded-full mb-4" />
        <div className="skeleton h-12 w-80 rounded-xl mb-2" />
        <div className="skeleton h-8 w-56 rounded-xl mb-6" />
        <div className="skeleton h-4 w-96 rounded mb-1" />
        <div className="skeleton h-4 w-72 rounded mb-8" />
        <div className="skeleton h-14 w-full max-w-2xl rounded-2xl" />
      </div>

      {/* Recipe grid skeleton */}
      <div className="px-6 sm:px-10 py-10 max-w-5xl mx-auto w-full">
        <div className="skeleton h-6 w-36 rounded mb-2" />
        <div className="skeleton h-4 w-24 rounded mb-6" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="flex flex-col gap-2" style={{ aspectRatio: "3/4" }}>
              <div className="skeleton rounded-2xl flex-1" />
              <div className="skeleton h-4 w-3/4 rounded" />
              <div className="skeleton h-3 w-1/2 rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
