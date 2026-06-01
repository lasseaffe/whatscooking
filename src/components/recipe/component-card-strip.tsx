import type { RecipeComponentWithRecipe } from "@/lib/types";
import { COMPONENT_TYPE_EMOJI, COMPONENT_TYPE_LABELS } from "@/lib/component-types";

interface Props {
  links: RecipeComponentWithRecipe[];
  onView: (componentId: string) => void;
}

export function ComponentCardStrip({ links, onView }: Props) {
  if (!links.length) return null;

  return (
    <div className="mt-8">
      <p
        className="text-xs uppercase tracking-widest mb-3"
        style={{ color: "#888" }}
      >
        Building Blocks in this Recipe
      </p>
      <div className="flex flex-col gap-3">
        {links
          .sort((a, b) => a.display_order - b.display_order)
          .map((link) => {
            const { component } = link;
            const type = component.component_type ?? "sauce";
            const minutes = component.cook_time_minutes ?? component.prep_time_minutes;
            return (
              <button
                key={link.id}
                onClick={() => onView(component.id)}
                className="flex items-start gap-3 rounded-xl p-4 text-left w-full transition-opacity hover:opacity-80"
                style={{ background: "#2d1e14", border: "1px solid #3a2a22" }}
              >
                <span className="text-3xl leading-none">
                  {COMPONENT_TYPE_EMOJI[type]}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm" style={{ color: "#e87c3e" }}>
                    {component.title}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: "#888" }}>
                    {COMPONENT_TYPE_LABELS[type]}{minutes ? ` · ${minutes} min` : ""}
                  </p>
                  {component.description && (
                    <p
                      className="text-xs mt-1 line-clamp-2"
                      style={{ color: "#aaa" }}
                    >
                      {component.description}
                    </p>
                  )}
                </div>
              </button>
            );
          })}
      </div>
    </div>
  );
}
