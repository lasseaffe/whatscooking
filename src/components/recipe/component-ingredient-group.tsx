import type { RecipeComponentWithRecipe } from "@/lib/types";

interface Props {
  link: RecipeComponentWithRecipe;
  onView: (componentId: string) => void;
}

export function ComponentIngredientGroup({ link, onView }: Props) {
  const { component, ingredient_group_label } = link;

  function formatIngredient(ing: { name: string; amount?: number; unit?: string }) {
    if (!ing.amount) return `• ${ing.name}`;
    const amt = Number.isInteger(ing.amount) ? ing.amount : ing.amount.toFixed(1);
    return `• ${amt}${ing.unit ?? ""} ${ing.name}`.trim();
  }

  return (
    <div className="rounded-lg p-3 mb-4" style={{ background: "#c0521a" }}>
      <div className="flex items-center justify-between mb-2">
        <span
          className="text-xs font-bold uppercase tracking-wide"
          style={{ color: "#ffe0cc" }}
        >
          ♥ {ingredient_group_label.toUpperCase()}
        </span>
        <button
          onClick={() => onView(component.id)}
          className="text-xs rounded-full px-2 py-0.5 transition-opacity hover:opacity-80"
          style={{
            color: "#ffe0cc",
            border: "1px solid rgba(255,224,204,0.4)",
          }}
        >
          View →
        </button>
      </div>
      {component.ingredients.map((ing, i) => (
        <p key={i} className="text-sm" style={{ color: "#ffe0cc" }}>
          {formatIngredient(ing)}
        </p>
      ))}
    </div>
  );
}
