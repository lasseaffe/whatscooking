interface CategoryBadgeProps {
  name: string;
  emoji?: string;
  color?: string;
  size?: "sm" | "md";
}

export function CategoryBadge({ name, emoji, color = "#6b7280", size = "sm" }: CategoryBadgeProps) {
  const bg = color + "18"; // ~10% opacity
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full font-medium ${size === "sm" ? "text-xs px-2 py-0.5" : "text-sm px-3 py-1"}`}
      style={{ background: bg, color }}
    >
      {emoji && <span>{emoji}</span>}
      {name}
    </span>
  );
}
