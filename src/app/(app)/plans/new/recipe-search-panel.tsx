"use client";
import { useState, useRef } from "react";
import { Search, Loader2, GripVertical, Clock, Flame } from "lucide-react";
import { motion } from "framer-motion";
import { MealCarousel, type CarouselMeal } from "./meal-carousel";

export interface DraggableRecipe {
  id: string | null;
  title: string;
  image: string | null;
  tags: string[];
  time: string;
  calories: number | null;
  protein_g: number | null;
  description: string | null;
}

interface Props {
  templateMeals: CarouselMeal[];
  onDragStart: (recipe: DraggableRecipe) => void;
  onDragEnd: () => void;
}

export function RecipeSearchPanel({ templateMeals, onDragStart, onDragEnd }: Props) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<DraggableRecipe[]>([]);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function handleQueryChange(value: string) {
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!value.trim()) { setResults([]); return; }
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/recipes/by-title?q=${encodeURIComponent(value.trim())}`);
        if (res.ok) {
          const data = await res.json();
          const arr = Array.isArray(data) ? data : [data];
          setResults(arr.map((r) => ({
            id: r.id ?? null,
            title: r.title ?? value,
            image: r.image_url ?? null,
            tags: r.dietary_tags ?? [],
            time: r.prep_time_minutes != null ? `${(r.prep_time_minutes ?? 0) + (r.cook_time_minutes ?? 0)} min` : "",
            calories: r.calories ?? null,
            protein_g: r.protein_g ?? null,
            description: r.description ?? null,
          })));
        } else {
          setResults([]);
        }
      } finally {
        setLoading(false);
      }
    }, 400);
  }

  return (
    <div className="flex flex-col gap-5 h-full">
      {/* Carousel */}
      <div>
        <p className="text-xs font-semibold mb-3 uppercase tracking-wide" style={{ color: "#6B4E36" }}>Template Meals</p>
        <MealCarousel meals={templateMeals} />
      </div>

      {/* Divider */}
      <div className="flex items-center gap-2">
        <div className="flex-1 h-px" style={{ background: "#2A1A0C" }} />
        <span className="text-xs" style={{ color: "#6B4E36" }}>Add from recipes</span>
        <div className="flex-1 h-px" style={{ background: "#2A1A0C" }} />
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "#6B4E36" }} />
        <input
          value={query}
          onChange={(e) => handleQueryChange(e.target.value)}
          placeholder="Search recipes…"
          className="w-full pl-9 pr-3 py-2.5 rounded-xl border text-sm focus:outline-none"
          style={{ borderColor: "#3A2416", background: "#130C05", color: "#EFE3CE" }}
        />
        {loading && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin" style={{ color: "#C8522A" }} />}
      </div>

      {/* Results */}
      <div className="flex flex-col gap-2 overflow-y-auto" style={{ maxHeight: 320 }}>
        {results.map((recipe) => (
          <DraggableRecipeCard
            key={recipe.id ?? recipe.title}
            recipe={recipe}
            onDragStart={onDragStart}
            onDragEnd={onDragEnd}
          />
        ))}
      </div>
    </div>
  );
}

function DraggableRecipeCard({
  recipe,
  onDragStart,
  onDragEnd,
}: {
  recipe: DraggableRecipe;
  onDragStart: (r: DraggableRecipe) => void;
  onDragEnd: () => void;
}) {
  return (
    <motion.div
      draggable
      onDragStart={() => onDragStart(recipe)}
      onDragEnd={onDragEnd}
      whileHover={{ scale: 1.02 }}
      whileDrag={{ scale: 1.05, opacity: 0.85 }}
      className="flex items-center gap-3 rounded-xl border p-2.5 cursor-grab active:cursor-grabbing select-none"
      style={{ borderColor: "#3A2416", background: "#1C1209" }}
    >
      {recipe.image ? (
        <img src={recipe.image} alt={recipe.title} className="w-12 h-12 rounded-lg object-cover shrink-0" />
      ) : (
        <div className="w-12 h-12 rounded-lg shrink-0 flex items-center justify-center text-xl" style={{ background: "#2A1808" }}>🍽️</div>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold truncate" style={{ color: "#EFE3CE" }}>{recipe.title}</p>
        <div className="flex items-center gap-2 mt-0.5">
          {recipe.time && (
            <span className="text-xs flex items-center gap-0.5" style={{ color: "#6B4E36" }}>
              <Clock className="w-3 h-3" />{recipe.time}
            </span>
          )}
          {recipe.calories && (
            <span className="text-xs flex items-center gap-0.5" style={{ color: "#6B4E36" }}>
              <Flame className="w-3 h-3" />{recipe.calories}
            </span>
          )}
        </div>
      </div>
      <GripVertical className="w-4 h-4 shrink-0" style={{ color: "#3A2416" }} />
    </motion.div>
  );
}
