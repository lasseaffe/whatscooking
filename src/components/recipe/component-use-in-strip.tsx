import Link from "next/link";

interface ParentRecipe {
  id: string;
  title: string;
  image_url: string | null;
}

interface Props {
  parents: ParentRecipe[];
}

export function ComponentUseInStrip({ parents }: Props) {
  if (!parents.length) return null;

  return (
    <div className="mt-8">
      <p className="text-xs uppercase tracking-widest mb-3" style={{ color: "#888" }}>
        Use this in
      </p>
      <div className="flex gap-3 overflow-x-auto pb-2">
        {parents.map((r) => (
          <Link
            key={r.id}
            href={`/recipes/${r.id}`}
            className="flex-shrink-0 rounded-xl p-3 text-center transition-opacity hover:opacity-80"
            style={{ background: "#2d1e14", border: "1px solid #3a2a22", minWidth: "100px" }}
          >
            {r.image_url ? (
              <img
                src={r.image_url}
                alt={r.title}
                className="w-12 h-12 rounded-lg object-cover mx-auto mb-2"
              />
            ) : (
              <div
                className="w-12 h-12 rounded-lg mx-auto mb-2 flex items-center justify-center text-2xl"
                style={{ background: "#3a2a22" }}
              >
                🍽️
              </div>
            )}
            <p className="text-xs leading-tight" style={{ color: "#ddd" }}>
              {r.title}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
