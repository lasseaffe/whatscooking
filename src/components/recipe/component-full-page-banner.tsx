import Link from "next/link";
import type { ComponentType } from "@/lib/types";
import { COMPONENT_TYPE_LABELS } from "@/lib/component-types";

interface Props {
  isComponent: boolean;
  componentType: ComponentType | null | undefined;
  parentRecipeCount: number;
  firstParentTitle: string | null;
  firstParentId: string | null;
}

export function ComponentFullPageBanner({
  isComponent,
  componentType,
  parentRecipeCount,
  firstParentTitle,
  firstParentId,
}: Props) {
  if (!isComponent) return null;

  const typeLabel = componentType ? COMPONENT_TYPE_LABELS[componentType] : "Component";
  const othersCount = parentRecipeCount - 1;

  return (
    <div
      className="flex items-center gap-3 px-4 py-3 mb-4 rounded-xl"
      style={{ background: "#2d1e14", border: "1px solid #c0521a" }}
    >
      <span className="text-xl">🧩</span>
      <div>
        <p className="text-xs font-bold uppercase tracking-wide" style={{ color: "#e87c3e" }}>
          Building Block · {typeLabel}
        </p>
        <p className="text-xs" style={{ color: "#aaa" }}>
          {firstParentTitle && firstParentId ? (
            <>
              Found in{" "}
              <Link href={`/recipes/${firstParentId}`} className="underline" style={{ color: "#e87c3e" }}>
                {firstParentTitle}
              </Link>
              {othersCount > 0 && ` and ${othersCount} other${othersCount !== 1 ? "s" : ""}`}
            </>
          ) : (
            "Standalone building block"
          )}
        </p>
      </div>
    </div>
  );
}
