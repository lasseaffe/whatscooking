"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Plus, X, ChefHat, Upload, Clock, Sparkles, Info, Camera } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const DIETARY_TAGS = ["vegetarian","vegan","gluten-free","dairy-free","high-protein","keto","paleo","low-carb"];
const DISH_TYPES = ["main course","side dish","breakfast","soup","salad","dessert","snack","baking","drink"];

type Ingredient = { name: string; amount: string; unit: string };

interface Nutrients {
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  fiber_g: number;
  sugar_g: number;
  sodium_mg: number;
}

const MACRO_COLORS: Record<string, string> = {
  protein_g: "#2258A8",
  carbs_g:   "#E8724A",
  fat_g:     "#F59E0B",
  fiber_g:   "#2D7A4F",
};

export default function NewRecipePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isExtracted = searchParams.get("extracted") === "1";

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [cuisineType, setCuisineType] = useState("");
  const [dishTypes, setDishTypes] = useState<string[]>([]);
  const [dietaryTags, setDietaryTags] = useState<string[]>([]);
  const [prepTime, setPrepTime] = useState("");
  const [cookTime, setCookTime] = useState("");
  const [servings, setServings] = useState("4");
  const [ingredients, setIngredients] = useState<Ingredient[]>([{ name: "", amount: "", unit: "" }]);
  const [instructions, setInstructions] = useState<string[]>([""]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Pre-fill from photo extraction
  useEffect(() => {
    const data = searchParams.get("data");
    if (!data) return;
    try {
      const decoded = JSON.parse(decodeURIComponent(atob(data)));
      if (decoded.title) setTitle(decoded.title);
      if (decoded.description) setDescription(decoded.description);
      if (decoded.cuisine_type) setCuisineType(decoded.cuisine_type);
      if (decoded.prep_time_minutes) setPrepTime(String(decoded.prep_time_minutes));
      if (decoded.cook_time_minutes) setCookTime(String(decoded.cook_time_minutes));
      if (decoded.servings) setServings(String(decoded.servings));
      if (decoded.dish_types?.length) setDishTypes(decoded.dish_types);
      if (decoded.dietary_tags?.length) setDietaryTags(decoded.dietary_tags);
      if (decoded.ingredients?.length) {
        setIngredients(decoded.ingredients.map((i: { name: string; amount?: string | number; unit?: string }) => ({
          name: i.name || "",
          amount: i.amount ? String(i.amount) : "",
          unit: i.unit || "",
        })));
      }
      if (decoded.instructions?.length) {
        setInstructions(decoded.instructions.filter(Boolean));
      }
    } catch {
      // silently ignore malformed data
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Nutrient auto-calculation
  const [nutrients, setNutrients] = useState<Nutrients | null>(null);
  const [calculating, setCalculating] = useState(false);
  const [calcNote, setCalcNote] = useState("");
  const [calcIngredients, setCalcIngredients] = useState<{ name: string; found: boolean }[]>([]);

  function addIngredient() { setIngredients((p) => [...p, { name: "", amount: "", unit: "" }]); }
  function removeIngredient(i: number) { setIngredients((p) => p.filter((_, j) => j !== i)); }
  function updateIngredient(i: number, field: keyof Ingredient, value: string) {
    setIngredients((p) => p.map((ing, j) => j === i ? { ...ing, [field]: value } : ing));
  }

  function addStep() { setInstructions((p) => [...p, ""]); }
  function removeStep(i: number) { setInstructions((p) => p.filter((_, j) => j !== i)); }
  function updateStep(i: number, value: string) { setInstructions((p) => p.map((s, j) => j === i ? value : s)); }

  function toggleTag<T extends string>(arr: T[], val: T, set: (v: T[]) => void) {
    set(arr.includes(val) ? arr.filter((t) => t !== val) : [...arr, val]);
  }

  const calculateNutrients = useCallback(async () => {
    const valid = ingredients.filter((i) => i.name.trim());
    if (valid.length === 0) { setError("Add at least one ingredient first."); return; }
    setCalculating(true);
    setCalcNote("");
    setNutrients(null);

    try {
      const res = await fetch("/api/nutrients/calculate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ingredients: valid.map((i) => ({
            name: i.name.trim(),
            amount: i.amount ? parseFloat(i.amount) : undefined,
            unit: i.unit.trim() || undefined,
          })),
          servings: servings ? parseInt(servings) : 1,
        }),
      });
      const data = await res.json();
      if (data.perServing) {
        setNutrients(data.perServing);
        setCalcNote(data.note ?? "");
        setCalcIngredients(data.ingredients ?? []);
      } else {
        setCalcNote("Could not calculate nutrients. Try adding amounts to your ingredients.");
      }
    } catch {
      setCalcNote("Calculation failed. Please try again.");
    } finally {
      setCalculating(false);
    }
  }, [ingredients, servings]);

  async function save(publish: boolean) {
    if (!title.trim()) { setError("Recipe title is required."); return; }
    setSaving(true); setError("");

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setError("Not logged in."); setSaving(false); return; }

    const { data, error: insertError } = await supabase
      .from("recipes")
      .insert({
        source: "user",
        created_by: user.id,
        is_published: publish,
        title: title.trim(),
        description: description.trim() || null,
        image_url: imageUrl.trim() || null,
        cuisine_type: cuisineType.trim() || null,
        dish_types: dishTypes,
        dietary_tags: dietaryTags,
        prep_time_minutes: prepTime ? parseInt(prepTime) : null,
        cook_time_minutes: cookTime ? parseInt(cookTime) : null,
        servings: servings ? parseInt(servings) : null,
        // Auto-calculated nutrients (or null if not calculated)
        calories:   nutrients?.calories   ?? null,
        protein_g:  nutrients?.protein_g  ?? null,
        carbs_g:    nutrients?.carbs_g    ?? null,
        fat_g:      nutrients?.fat_g      ?? null,
        fiber_g:    nutrients?.fiber_g    ?? null,
        sugar_g:    nutrients?.sugar_g    ?? null,
        sodium_mg:  nutrients?.sodium_mg  ?? null,
        ingredients: ingredients.filter((i) => i.name.trim()).map((i) => ({
          name: i.name.trim(),
          amount: i.amount ? parseFloat(i.amount) : undefined,
          unit: i.unit.trim() || undefined,
        })),
        instructions: instructions.filter((s) => s.trim()),
      })
      .select("id")
      .single();

    if (insertError || !data) {
      setError("Failed to save recipe. Please try again.");
      setSaving(false);
      return;
    }

    router.push(`/recipes/${data.id}`);
  }

  return (
    <div className="px-4 sm:px-6 py-8 max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2" style={{ color: "#EFE3CE", fontFamily: "'Libre Baskerville', Georgia, serif" }}>
          <ChefHat className="w-6 h-6" style={{ color: "#C8522A" }} />
          {isExtracted ? "Recipe from Photo" : "New Recipe"}
        </h1>
        <p className="text-sm mt-1" style={{ color: "#8A6A4A" }}>
          Create your recipe. Nutrients are auto-calculated from your ingredients.
        </p>
      </div>

      {isExtracted && (
        <div
          className="mb-5 flex items-start gap-3 px-4 py-3 rounded-xl"
          style={{ background: "#1A2018", border: "1px solid #3A4A3A" }}
        >
          <Camera className="w-4 h-4 mt-0.5 shrink-0" style={{ color: "#828E6F" }} />
          <div>
            <p className="text-sm font-semibold" style={{ color: "#828E6F" }}>Recipe extracted from photo</p>
            <p className="text-xs mt-0.5" style={{ color: "#6B7A5A" }}>
              Review and correct any mistakes before saving — the AI may have missed details.
            </p>
          </div>
        </div>
      )}

      <div className="space-y-6">
        {/* Basics */}
        <section className="rounded-2xl border p-5 space-y-4" style={{ borderColor: "#F5E6D3" }}>
          <h2 className="font-semibold" style={{ color: "#3D2817" }}>Basics</h2>
          <div>
            <label className="text-xs font-medium block mb-1" style={{ color: "#6B5B52" }}>Recipe title *</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Grandma's Lasagna"
              className="w-full px-3 py-2 rounded-xl border text-sm focus:outline-none"
              style={{ borderColor: "#E8D4C0", background: "#FAF7F2", color: "#3D2817" }} />
          </div>
          <div>
            <label className="text-xs font-medium block mb-1" style={{ color: "#6B5B52" }}>Description</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)}
              placeholder="What makes this recipe special?"
              rows={3} className="w-full px-3 py-2 rounded-xl border text-sm resize-none focus:outline-none"
              style={{ borderColor: "#E8D4C0", background: "#FAF7F2", color: "#3D2817" }} />
          </div>
          <div>
            <label className="text-xs font-medium block mb-1" style={{ color: "#6B5B52" }}>
              <Upload className="w-3.5 h-3.5 inline mr-1" />Image URL (optional)
            </label>
            <input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://…"
              className="w-full px-3 py-2 rounded-xl border text-sm focus:outline-none"
              style={{ borderColor: "#E8D4C0", background: "#FAF7F2", color: "#3D2817" }} />
          </div>
        </section>

        {/* Details */}
        <section className="rounded-2xl border p-5 space-y-4" style={{ borderColor: "#F5E6D3" }}>
          <h2 className="font-semibold" style={{ color: "#3D2817" }}>Details</h2>
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Prep time (min)", value: prepTime, set: setPrepTime, icon: Clock },
              { label: "Cook time (min)", value: cookTime, set: setCookTime, icon: Clock },
              { label: "Servings",        value: servings, set: setServings },
            ].map(({ label, value, set }) => (
              <div key={label}>
                <label className="text-xs font-medium block mb-1" style={{ color: "#6B5B52" }}>{label}</label>
                <input type="number" value={value} onChange={(e) => set(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border text-sm focus:outline-none"
                  style={{ borderColor: "#E8D4C0", background: "#FAF7F2", color: "#3D2817" }} />
              </div>
            ))}
          </div>
          <div>
            <label className="text-xs font-medium block mb-1" style={{ color: "#6B5B52" }}>Cuisine</label>
            <input value={cuisineType} onChange={(e) => setCuisineType(e.target.value)}
              placeholder="e.g. Italian, Mexican, Asian…"
              className="w-full px-3 py-2 rounded-xl border text-sm focus:outline-none"
              style={{ borderColor: "#E8D4C0", background: "#FAF7F2", color: "#3D2817" }} />
          </div>
          <div>
            <label className="text-xs font-medium block mb-2" style={{ color: "#6B5B52" }}>Dish type</label>
            <div className="flex flex-wrap gap-2">
              {DISH_TYPES.map((t) => (
                <button key={t} type="button" onClick={() => toggleTag(dishTypes, t, setDishTypes)}
                  className="text-xs px-3 py-1.5 rounded-full border transition-all"
                  style={{ borderColor: dishTypes.includes(t) ? "#C85A2F" : "#E8D4C0", background: dishTypes.includes(t) ? "#FFF0E6" : "#fff", color: dishTypes.includes(t) ? "#C85A2F" : "#6B5B52" }}>
                  {t}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs font-medium block mb-2" style={{ color: "#6B5B52" }}>Dietary tags</label>
            <div className="flex flex-wrap gap-2">
              {DIETARY_TAGS.map((t) => (
                <button key={t} type="button" onClick={() => toggleTag(dietaryTags, t, setDietaryTags)}
                  className="text-xs px-3 py-1.5 rounded-full border transition-all"
                  style={{ borderColor: dietaryTags.includes(t) ? "#2D7A4F" : "#E8D4C0", background: dietaryTags.includes(t) ? "#F0FAF4" : "#fff", color: dietaryTags.includes(t) ? "#2D7A4F" : "#6B5B52" }}>
                  {t}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Ingredients */}
        <section className="rounded-2xl border p-5 space-y-3" style={{ borderColor: "#F5E6D3" }}>
          <h2 className="font-semibold" style={{ color: "#3D2817" }}>Ingredients</h2>
          <p className="text-xs" style={{ color: "#A69180" }}>
            Add amounts and units to get accurate nutrient calculations (e.g. 200g chicken, 1 cup rice).
          </p>
          {ingredients.map((ing, i) => (
            <div key={i} className="flex gap-2 items-center">
              <input value={ing.name} onChange={(e) => updateIngredient(i, "name", e.target.value)}
                placeholder="Ingredient"
                className="flex-1 px-3 py-2 rounded-xl border text-sm focus:outline-none"
                style={{ borderColor: "#E8D4C0", background: "#FAF7F2", color: "#3D2817" }} />
              <input value={ing.amount} onChange={(e) => updateIngredient(i, "amount", e.target.value)}
                placeholder="Amount" type="number"
                className="w-20 px-3 py-2 rounded-xl border text-sm focus:outline-none"
                style={{ borderColor: "#E8D4C0", background: "#FAF7F2", color: "#3D2817" }} />
              <input value={ing.unit} onChange={(e) => updateIngredient(i, "unit", e.target.value)}
                placeholder="Unit"
                className="w-20 px-3 py-2 rounded-xl border text-sm focus:outline-none"
                style={{ borderColor: "#E8D4C0", background: "#FAF7F2", color: "#3D2817" }} />
              <button onClick={() => removeIngredient(i)} disabled={ingredients.length === 1}>
                <X className="w-4 h-4" style={{ color: "#A69180" }} />
              </button>
            </div>
          ))}
          <button onClick={addIngredient} className="flex items-center gap-1.5 text-sm font-medium" style={{ color: "#C85A2F" }}>
            <Plus className="w-4 h-4" /> Add ingredient
          </button>

          {/* Calculate nutrients button */}
          <div className="pt-2 border-t" style={{ borderColor: "#F5E6D3" }}>
            <button
              type="button"
              onClick={calculateNutrients}
              disabled={calculating}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold disabled:opacity-50"
              style={{ background: "#F0FAF4", color: "#2D7A4F", border: "1px solid #86EFAC" }}
            >
              <Sparkles className="w-4 h-4" />
              {calculating ? "Calculating nutrients…" : "Auto-calculate nutrients"}
            </button>

            {/* Nutrient results */}
            {nutrients && (
              <div className="mt-3 rounded-xl border p-4 space-y-3" style={{ borderColor: "#86EFAC", background: "#F0FAF4" }}>
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold" style={{ color: "#2D7A4F" }}>
                    Per serving ({servings || 1} servings total)
                  </p>
                  <span className="text-xs font-bold px-2.5 py-1 rounded-full" style={{ background: "#fff", color: "#C85A2F" }}>
                    {nutrients.calories} kcal
                  </span>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {(["protein_g", "carbs_g", "fat_g", "fiber_g"] as const).map((key) => (
                    <div key={key} className="text-center rounded-lg p-2" style={{ background: "#fff" }}>
                      <p className="text-sm font-bold" style={{ color: MACRO_COLORS[key] }}>
                        {nutrients[key]}g
                      </p>
                      <p className="text-[10px]" style={{ color: "#6B5B52" }}>
                        {key === "protein_g" ? "Protein" : key === "carbs_g" ? "Carbs" : key === "fat_g" ? "Fat" : "Fiber"}
                      </p>
                    </div>
                  ))}
                </div>
                {nutrients.sugar_g > 0 && (
                  <p className="text-xs" style={{ color: "#6B5B52" }}>
                    Sugar: {nutrients.sugar_g}g · Sodium: {nutrients.sodium_mg}mg
                  </p>
                )}
                {calcIngredients.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {calcIngredients.map((ci, i) => (
                      <span key={i} className="text-[10px] px-2 py-0.5 rounded-full"
                        style={{ background: ci.found ? "#E5EDD8" : "#FEE2E2", color: ci.found ? "#3D5030" : "#991B1B" }}>
                        {ci.found ? "✓" : "✗"} {ci.name}
                      </span>
                    ))}
                  </div>
                )}
                {calcNote && (
                  <p className="text-[10px] flex items-center gap-1" style={{ color: "#6B5B52" }}>
                    <Info className="w-3 h-3" /> {calcNote}
                  </p>
                )}
                <p className="text-[10px]" style={{ color: "#A69180" }}>
                  These values are estimates based on Open Food Facts data and will be saved with your recipe.
                </p>
              </div>
            )}

            {calcNote && !nutrients && (
              <p className="text-xs mt-2" style={{ color: "#A69180" }}>{calcNote}</p>
            )}
          </div>
        </section>

        {/* Instructions */}
        <section className="rounded-2xl border p-5 space-y-3" style={{ borderColor: "#F5E6D3" }}>
          <h2 className="font-semibold" style={{ color: "#3D2817" }}>Instructions</h2>
          {instructions.map((step, i) => (
            <div key={i} className="flex gap-3 items-start">
              <span className="shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold mt-2"
                style={{ background: "#FFF0E6", color: "#C85A2F" }}>{i + 1}</span>
              <textarea value={step} onChange={(e) => updateStep(i, e.target.value)}
                placeholder={`Step ${i + 1}…`} rows={2}
                className="flex-1 px-3 py-2 rounded-xl border text-sm resize-none focus:outline-none"
                style={{ borderColor: "#E8D4C0", background: "#FAF7F2", color: "#3D2817" }} />
              <button onClick={() => removeStep(i)} disabled={instructions.length === 1} className="mt-2">
                <X className="w-4 h-4" style={{ color: "#A69180" }} />
              </button>
            </div>
          ))}
          <button onClick={addStep} className="flex items-center gap-1.5 text-sm font-medium" style={{ color: "#C85A2F" }}>
            <Plus className="w-4 h-4" /> Add step
          </button>
        </section>

        {error && <p className="text-sm" style={{ color: "#DC2626" }}>{error}</p>}

        {/* Save buttons */}
        <div className="flex gap-3">
          <button onClick={() => save(false)} disabled={saving}
            className="flex-1 py-3 rounded-xl border font-semibold text-sm disabled:opacity-50"
            style={{ borderColor: "#E8D4C0", color: "#6B5B52" }}>
            {saving ? "Saving…" : "Save as private"}
          </button>
          <button onClick={() => save(true)} disabled={saving}
            className="flex-1 py-3 rounded-xl font-semibold text-sm disabled:opacity-50"
            style={{ background: "#C85A2F", color: "#fff" }}>
            {saving ? "Publishing…" : "🚀 Publish recipe"}
          </button>
        </div>
      </div>
    </div>
  );
}
