"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Plus, X, ChefHat, Clock, Sparkles, Info, Camera, ImageIcon, Link2, Loader2 } from "lucide-react";
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

// ── Live preview — mirrors the real recipe page layout ────────────────────
interface PreviewProps {
  title: string;
  description: string;
  imageUrl: string;
  cuisineType: string;
  dishTypes: string[];
  dietaryTags: string[];
  prepTime: string;
  cookTime: string;
  servings: string;
  ingredients: Ingredient[];
  instructions: string[];
  nutrients: Nutrients | null;
}

function RecipePreview({
  title, description, imageUrl, cuisineType,
  dietaryTags, prepTime, cookTime, servings,
  ingredients, instructions, nutrients,
}: PreviewProps) {
  const BG     = "#0d0a07";
  const CARD   = "#1A0F07";
  const BORDER = "#2A1808";
  const TEXT   = "#EFE3CE";
  const MUTED  = "#8A6A4A";
  const ACCENT = "#F4A261";
  const EMBER  = "#C85A2F";

  const totalTime = (parseInt(prepTime) || 0) + (parseInt(cookTime) || 0);
  const filledIngredients = ingredients.filter((i) => i.name.trim());
  const filledSteps = instructions.filter((s) => s.trim());
  const hasContent = filledIngredients.length > 0 || filledSteps.length > 0 || title;

  return (
    <div
      className="rounded-2xl overflow-hidden border text-[13px]"
      style={{ background: BG, borderColor: BORDER }}
    >
      {/* ── ZONE 1: Editorial header (title left · image right) ── */}
      <div
        className="p-4"
        style={{ borderBottom: `1px solid ${BORDER}` }}
      >
        <div className="flex gap-4 items-start">

          {/* Left: cuisine label + title + meta */}
          <div className="flex-1 flex flex-col gap-2 min-w-0">
            {cuisineType && (
              <p
                className="text-[10px] font-bold uppercase tracking-widest"
                style={{ color: EMBER }}
              >
                {cuisineType}
              </p>
            )}

            <h2
              style={{
                color: title ? TEXT : MUTED,
                fontFamily: "'Libre Baskerville', Georgia, serif",
                fontSize: "clamp(1.1rem, 3vw, 1.5rem)",
                lineHeight: 1.15,
                fontWeight: 700,
                opacity: title ? 1 : 0.35,
              }}
            >
              {title || "Your recipe title"}
            </h2>

            {description && (
              <p className="text-xs italic leading-relaxed line-clamp-2" style={{ color: MUTED }}>
                {description}
              </p>
            )}

            {/* Metrics row */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs" style={{ color: MUTED }}>
              {totalTime > 0 && (
                <span className="flex items-center gap-1">
                  <Clock style={{ width: 11, height: 11 }} /> {totalTime} min
                </span>
              )}
              {servings && (
                <span className="flex items-center gap-1">
                  <ChefHat style={{ width: 11, height: 11 }} /> {servings} serves
                </span>
              )}
              {nutrients?.calories && (
                <span>{nutrients.calories} kcal</span>
              )}
            </div>

            {/* Dietary tags */}
            {dietaryTags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {dietaryTags.map((t) => (
                  <span
                    key={t}
                    className="text-[10px] px-2 py-0.5 rounded-full"
                    style={{ background: "rgba(42,24,8,0.5)", color: MUTED, border: `1px solid ${BORDER}` }}
                  >
                    {t}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Right: hero image panel */}
          <div
            className="shrink-0 rounded-xl overflow-hidden"
            style={{ width: "42%", aspectRatio: "4/3", background: "rgba(255,255,255,0.04)", border: `1px solid ${BORDER}` }}
          >
            {imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={imageUrl} alt={title || "Recipe"} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center gap-1.5">
                <ImageIcon style={{ width: 20, height: 20, color: MUTED, opacity: 0.3 }} />
                <p className="text-[10px] text-center px-2" style={{ color: MUTED, opacity: 0.35 }}>Add a photo</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── ZONE 2: Ingredients + Instructions columns ── */}
      {hasContent ? (
        <div className="flex gap-0" style={{ borderBottom: `1px solid ${BORDER}` }}>

          {/* Ingredients column */}
          <div
            className="p-4 space-y-2.5"
            style={{ width: "38%", borderRight: `1px solid ${BORDER}` }}
          >
            <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: ACCENT, opacity: 0.65 }}>
              Ingredients
            </p>
            {filledIngredients.length > 0 ? (
              <ul className="space-y-1.5">
                {filledIngredients.map((ing, i) => (
                  <li key={i} className="flex items-start gap-1.5 leading-snug" style={{ color: TEXT }}>
                    <span style={{ color: EMBER, lineHeight: "1.4" }}>·</span>
                    <span className="text-xs">
                      {ing.amount && (
                        <span className="font-semibold">{ing.amount}{ing.unit ? ` ${ing.unit}` : ""} </span>
                      )}
                      {ing.name}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs" style={{ color: MUTED, opacity: 0.4 }}>Add ingredients…</p>
            )}
          </div>

          {/* Instructions column */}
          <div className="flex-1 p-4 space-y-2.5">
            <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: ACCENT, opacity: 0.65 }}>
              Instructions
            </p>
            {filledSteps.length > 0 ? (
              <ol className="space-y-3">
                {filledSteps.map((step, i) => (
                  <li key={i} className="flex gap-2.5 items-start">
                    <span
                      className="shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold mt-0.5"
                      style={{ background: "rgba(200,90,47,0.2)", color: ACCENT }}
                    >
                      {i + 1}
                    </span>
                    <p className="text-xs leading-relaxed" style={{ color: TEXT }}>{step}</p>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="text-xs" style={{ color: MUTED, opacity: 0.4 }}>Add steps…</p>
            )}
          </div>
        </div>
      ) : (
        <div className="py-8 flex items-center justify-center">
          <p className="text-xs text-center" style={{ color: MUTED, opacity: 0.4 }}>
            Fill in the form to see your recipe here
          </p>
        </div>
      )}

      {/* ── ZONE 3: Mini interactions bar (mirrors the bottom section) ── */}
      <div
        className="px-4 py-2.5 flex items-center gap-3"
        style={{ background: CARD }}
      >
        <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: MUTED, opacity: 0.5 }}>
          Preview
        </span>
        <div className="flex-1 h-px" style={{ background: BORDER }} />
        <span className="text-[10px]" style={{ color: MUTED, opacity: 0.4 }}>
          This is how your recipe will look when published
        </span>
      </div>
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────
export default function NewRecipePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isExtracted = searchParams.get("extracted") === "1";

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [imageTab, setImageTab] = useState<"upload" | "url">("upload");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

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
  const [isComponent, setIsComponent] = useState(false);
  const [componentType, setComponentType] = useState<import("@/lib/types").ComponentType>("sauce");

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

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setUploadError("");
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setUploadError("Not logged in."); return; }
      const ext = file.name.split(".").pop() ?? "jpg";
      const path = `user-uploads/${user.id}/${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("recipe-images")
        .upload(path, file, { upsert: true });
      if (upErr) { setUploadError("Upload failed — try pasting a URL instead."); return; }
      const { data: { publicUrl } } = supabase.storage.from("recipe-images").getPublicUrl(path);
      setImageUrl(publicUrl);
    } catch {
      setUploadError("Upload failed — try pasting a URL instead.");
    } finally {
      setUploading(false);
    }
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
        is_component: isComponent,
        component_type: isComponent ? componentType : null,
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

  // Palette
  const BG      = "#140D06";
  const CARD    = "#2A1B0E";
  const BORDER  = "#4A3020";
  const INPUT   = "#321A0A";
  const TEXT    = "#EFE3CE";
  const MUTED   = "#8A6A4A";
  const ACCENT  = "#F4A261";
  const EMBER   = "#C85A2F";

  return (
    <div className="min-h-screen" style={{ background: BG }}>
      <div className="px-4 sm:px-6 py-8 max-w-7xl mx-auto">
        {/* Page header */}
        <div className="mb-7">
          <div className="flex items-center gap-3 mb-1">
            <div
              className="flex items-center justify-center rounded-xl"
              style={{ width: 40, height: 40, background: `linear-gradient(135deg, ${EMBER}, #8B3A1A)` }}
            >
              <ChefHat className="w-5 h-5" style={{ color: "#fff" }} />
            </div>
            <h1 className="text-2xl font-bold" style={{ color: TEXT, fontFamily: "'Libre Baskerville', Georgia, serif" }}>
              {isExtracted ? "Recipe from Photo" : "New Recipe"}
            </h1>
          </div>
          <p className="text-sm pl-[52px]" style={{ color: MUTED }}>
            Fill in the form — watch your recipe take shape on the right.
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

        {/* Two-column layout: form left, preview right */}
        <div className="flex flex-col lg:flex-row gap-8 items-start">

          {/* ── LEFT: Form ── */}
          <div className="w-full lg:w-1/2 space-y-5">

            {/* Basics */}
            <section className="rounded-2xl border p-5 space-y-4" style={{ borderColor: BORDER, background: CARD }}>
              <h2 className="text-xs font-bold tracking-widest uppercase" style={{ color: ACCENT, opacity: 0.7 }}>Basics</h2>
              <div>
                <label className="text-xs font-medium block mb-1.5" style={{ color: MUTED }}>Recipe title *</label>
                <input value={title} onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Grandma's Lasagna"
                  className="w-full px-3 py-2.5 rounded-xl border text-sm focus:outline-none"
                  style={{ borderColor: BORDER, background: INPUT, color: TEXT, caretColor: ACCENT }} />
              </div>
              <div>
                <label className="text-xs font-medium block mb-1.5" style={{ color: MUTED }}>Description</label>
                <textarea value={description} onChange={(e) => setDescription(e.target.value)}
                  placeholder="What makes this recipe special?"
                  rows={3} className="w-full px-3 py-2.5 rounded-xl border text-sm resize-none focus:outline-none"
                  style={{ borderColor: BORDER, background: INPUT, color: TEXT, caretColor: ACCENT }} />
              </div>

              {/* Image: upload or URL */}
              <div>
                <label className="text-xs font-medium block mb-2" style={{ color: MUTED }}>Photo (optional)</label>

                {/* Tab switcher */}
                <div className="flex mb-3 rounded-xl overflow-hidden border" style={{ borderColor: BORDER }}>
                  {(["upload", "url"] as const).map((tab) => (
                    <button
                      key={tab}
                      type="button"
                      onClick={() => setImageTab(tab)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium transition-colors"
                      style={{
                        background: imageTab === tab ? EMBER : INPUT,
                        color: imageTab === tab ? "#fff" : MUTED,
                      }}
                    >
                      {tab === "upload" ? <><ImageIcon className="w-3.5 h-3.5" /> Upload file</> : <><Link2 className="w-3.5 h-3.5" /> Paste URL</>}
                    </button>
                  ))}
                </div>

                {imageTab === "upload" ? (
                  <div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleFileUpload}
                    />
                    {imageUrl && imageTab === "upload" ? (
                      <div className="flex items-center gap-3">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={imageUrl} alt="Preview" className="w-16 h-16 rounded-xl object-cover" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium truncate" style={{ color: TEXT }}>Image uploaded</p>
                          <button
                            type="button"
                            onClick={() => { setImageUrl(""); if (fileInputRef.current) fileInputRef.current.value = ""; }}
                            className="text-xs mt-1"
                            style={{ color: MUTED }}
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                        className="w-full flex flex-col items-center justify-center gap-2 py-6 rounded-xl border-2 border-dashed transition-colors"
                        style={{ borderColor: BORDER, color: MUTED }}
                      >
                        {uploading
                          ? <Loader2 className="w-5 h-5 animate-spin" />
                          : <ImageIcon className="w-5 h-5" style={{ opacity: 0.5 }} />
                        }
                        <span className="text-xs">{uploading ? "Uploading…" : "Click to choose a photo"}</span>
                      </button>
                    )}
                    {uploadError && <p className="text-xs mt-1.5" style={{ color: "#F87171" }}>{uploadError}</p>}
                  </div>
                ) : (
                  <input
                    value={imageTab === "url" ? imageUrl : ""}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="https://…"
                    className="w-full px-3 py-2.5 rounded-xl border text-sm focus:outline-none"
                    style={{ borderColor: BORDER, background: INPUT, color: TEXT, caretColor: ACCENT }}
                  />
                )}
              </div>
            </section>

            {/* Details */}
            <section className="rounded-2xl border p-5 space-y-4" style={{ borderColor: BORDER, background: CARD }}>
              <h2 className="text-xs font-bold tracking-widest uppercase" style={{ color: ACCENT, opacity: 0.7 }}>Details</h2>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: "Prep time (min)", value: prepTime, set: setPrepTime },
                  { label: "Cook time (min)", value: cookTime, set: setCookTime },
                  { label: "Servings",        value: servings, set: setServings },
                ].map(({ label, value, set }) => (
                  <div key={label}>
                    <label className="text-xs font-medium block mb-1.5" style={{ color: MUTED }}>{label}</label>
                    <input type="number" value={value} onChange={(e) => set(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border text-sm focus:outline-none"
                      style={{ borderColor: BORDER, background: INPUT, color: TEXT }} />
                  </div>
                ))}
              </div>
              <div>
                <label className="text-xs font-medium block mb-1.5" style={{ color: MUTED }}>Cuisine</label>
                <input value={cuisineType} onChange={(e) => setCuisineType(e.target.value)}
                  placeholder="e.g. Italian, Mexican, Asian…"
                  className="w-full px-3 py-2.5 rounded-xl border text-sm focus:outline-none"
                  style={{ borderColor: BORDER, background: INPUT, color: TEXT, caretColor: ACCENT }} />
              </div>
              <div>
                <label className="text-xs font-medium block mb-2" style={{ color: MUTED }}>Dish type</label>
                <div className="flex flex-wrap gap-2">
                  {DISH_TYPES.map((t) => (
                    <button key={t} type="button" onClick={() => toggleTag(dishTypes, t, setDishTypes)}
                      className="text-xs px-3 py-1.5 rounded-full border transition-all"
                      style={{
                        borderColor: dishTypes.includes(t) ? EMBER : BORDER,
                        background: dishTypes.includes(t) ? "rgba(200,90,47,0.18)" : "transparent",
                        color: dishTypes.includes(t) ? ACCENT : MUTED,
                      }}>
                      {t}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs font-medium block mb-2" style={{ color: MUTED }}>Dietary tags</label>
                <div className="flex flex-wrap gap-2">
                  {DIETARY_TAGS.map((t) => (
                    <button key={t} type="button" onClick={() => toggleTag(dietaryTags, t, setDietaryTags)}
                      className="text-xs px-3 py-1.5 rounded-full border transition-all"
                      style={{
                        borderColor: dietaryTags.includes(t) ? "#2D7A4F" : BORDER,
                        background: dietaryTags.includes(t) ? "rgba(45,122,79,0.18)" : "transparent",
                        color: dietaryTags.includes(t) ? "#6FCF97" : MUTED,
                      }}>
                      {t}
                    </button>
                  ))}
                </div>
              </div>
            </section>

            {/* Building block toggle */}
            <section className="rounded-2xl border p-5" style={{ borderColor: BORDER, background: CARD }}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium" style={{ color: TEXT }}>🧩 This is a building block</p>
                  <p className="text-xs mt-0.5" style={{ color: MUTED }}>A sauce, dressing, marinade, or other reusable component</p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsComponent((v) => !v)}
                  className="relative w-11 h-6 rounded-full transition-colors flex-shrink-0"
                  style={{ background: isComponent ? "#C85A2F" : "#3A2416" }}
                  role="switch"
                  aria-checked={isComponent}
                >
                  <span
                    className="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform"
                    style={{ transform: isComponent ? "translateX(20px)" : "translateX(0)" }}
                  />
                </button>
              </div>
              {isComponent && (
                <div className="mt-4">
                  <p className="text-xs font-medium mb-2" style={{ color: MUTED }}>Component type</p>
                  <div className="flex flex-wrap gap-2">
                    {(["sauce","dressing","marinade","base","paste","spice_blend","condiment","batter"] as import("@/lib/types").ComponentType[]).map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setComponentType(t)}
                        className="px-3 py-1.5 rounded-full text-xs font-medium transition-colors"
                        style={{
                          background: componentType === t ? "#C85A2F" : "transparent",
                          color: componentType === t ? "#fff" : MUTED,
                          border: `1px solid ${componentType === t ? "#C85A2F" : BORDER}`,
                        }}
                      >
                        {t.replace("_", " ")}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </section>

            {/* Ingredients */}
            <section className="rounded-2xl border p-5 space-y-3" style={{ borderColor: BORDER, background: CARD }}>
              <h2 className="text-xs font-bold tracking-widest uppercase" style={{ color: ACCENT, opacity: 0.7 }}>Ingredients</h2>
              <p className="text-xs" style={{ color: MUTED }}>
                Add amounts and units for accurate nutrient calculations (e.g. 200g chicken, 1 cup rice).
              </p>
              {ingredients.map((ing, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <input value={ing.name} onChange={(e) => updateIngredient(i, "name", e.target.value)}
                    placeholder="Ingredient"
                    className="flex-1 px-3 py-2 rounded-xl border text-sm focus:outline-none"
                    style={{ borderColor: BORDER, background: INPUT, color: TEXT }} />
                  <input value={ing.amount} onChange={(e) => updateIngredient(i, "amount", e.target.value)}
                    placeholder="Amt" type="number"
                    className="w-20 px-3 py-2 rounded-xl border text-sm focus:outline-none"
                    style={{ borderColor: BORDER, background: INPUT, color: TEXT }} />
                  <input value={ing.unit} onChange={(e) => updateIngredient(i, "unit", e.target.value)}
                    placeholder="Unit"
                    className="w-20 px-3 py-2 rounded-xl border text-sm focus:outline-none"
                    style={{ borderColor: BORDER, background: INPUT, color: TEXT }} />
                  <button onClick={() => removeIngredient(i)} disabled={ingredients.length === 1}>
                    <X className="w-4 h-4" style={{ color: MUTED }} />
                  </button>
                </div>
              ))}
              <button onClick={addIngredient} className="flex items-center gap-1.5 text-sm font-medium" style={{ color: EMBER }}>
                <Plus className="w-4 h-4" /> Add ingredient
              </button>

              {/* Calculate nutrients */}
              <div className="pt-2 border-t" style={{ borderColor: BORDER }}>
                <button
                  type="button"
                  onClick={calculateNutrients}
                  disabled={calculating}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold disabled:opacity-50"
                  style={{ background: "rgba(45,122,79,0.15)", color: "#6FCF97", border: "1px solid rgba(45,122,79,0.35)" }}
                >
                  <Sparkles className="w-4 h-4" />
                  {calculating ? "Calculating nutrients…" : "Auto-calculate nutrients"}
                </button>

                {nutrients && (
                  <div className="mt-3 rounded-xl border p-4 space-y-3" style={{ borderColor: "rgba(45,122,79,0.35)", background: "rgba(45,122,79,0.1)" }}>
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold" style={{ color: "#6FCF97" }}>
                        Per serving ({servings || 1} servings total)
                      </p>
                      <span className="text-xs font-bold px-2.5 py-1 rounded-full" style={{ background: "rgba(200,90,47,0.2)", color: ACCENT }}>
                        {nutrients.calories} kcal
                      </span>
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                      {(["protein_g", "carbs_g", "fat_g", "fiber_g"] as const).map((key) => (
                        <div key={key} className="text-center rounded-lg p-2" style={{ background: "rgba(255,255,255,0.05)" }}>
                          <p className="text-sm font-bold" style={{ color: MACRO_COLORS[key] }}>
                            {nutrients[key]}g
                          </p>
                          <p className="text-[10px]" style={{ color: MUTED }}>
                            {key === "protein_g" ? "Protein" : key === "carbs_g" ? "Carbs" : key === "fat_g" ? "Fat" : "Fiber"}
                          </p>
                        </div>
                      ))}
                    </div>
                    {nutrients.sugar_g > 0 && (
                      <p className="text-xs" style={{ color: MUTED }}>
                        Sugar: {nutrients.sugar_g}g · Sodium: {nutrients.sodium_mg}mg
                      </p>
                    )}
                    {calcIngredients.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {calcIngredients.map((ci, idx) => (
                          <span key={idx} className="text-[10px] px-2 py-0.5 rounded-full"
                            style={{ background: ci.found ? "rgba(45,122,79,0.25)" : "rgba(220,38,38,0.2)", color: ci.found ? "#6FCF97" : "#F87171" }}>
                            {ci.found ? "✓" : "✗"} {ci.name}
                          </span>
                        ))}
                      </div>
                    )}
                    {calcNote && (
                      <p className="text-[10px] flex items-center gap-1" style={{ color: MUTED }}>
                        <Info className="w-3 h-3" /> {calcNote}
                      </p>
                    )}
                    <p className="text-[10px]" style={{ color: "#5A3A28" }}>
                      Estimates from Open Food Facts — saved with your recipe.
                    </p>
                  </div>
                )}

                {calcNote && !nutrients && (
                  <p className="text-xs mt-2" style={{ color: MUTED }}>{calcNote}</p>
                )}
              </div>
            </section>

            {/* Instructions */}
            <section className="rounded-2xl border p-5 space-y-3" style={{ borderColor: BORDER, background: CARD }}>
              <h2 className="text-xs font-bold tracking-widest uppercase" style={{ color: ACCENT, opacity: 0.7 }}>Instructions</h2>
              {instructions.map((step, i) => (
                <div key={i} className="flex gap-3 items-start">
                  <span className="shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold mt-2"
                    style={{ background: "rgba(200,90,47,0.2)", color: ACCENT }}>{i + 1}</span>
                  <textarea value={step} onChange={(e) => updateStep(i, e.target.value)}
                    placeholder={`Step ${i + 1}…`} rows={2}
                    className="flex-1 px-3 py-2.5 rounded-xl border text-sm resize-none focus:outline-none"
                    style={{ borderColor: BORDER, background: INPUT, color: TEXT }} />
                  <button onClick={() => removeStep(i)} disabled={instructions.length === 1} className="mt-2">
                    <X className="w-4 h-4" style={{ color: MUTED }} />
                  </button>
                </div>
              ))}
              <button onClick={addStep} className="flex items-center gap-1.5 text-sm font-medium" style={{ color: EMBER }}>
                <Plus className="w-4 h-4" /> Add step
              </button>
            </section>

            {error && <p className="text-sm" style={{ color: "#F87171" }}>{error}</p>}

            {/* Save buttons */}
            <div className="flex gap-3 pb-8">
              <button onClick={() => save(false)} disabled={saving}
                className="flex-1 py-3 rounded-xl border font-semibold text-sm disabled:opacity-50 transition-colors"
                style={{ borderColor: BORDER, color: MUTED, background: CARD }}>
                {saving ? "Saving…" : "Save as private"}
              </button>
              <button onClick={() => save(true)} disabled={saving}
                className="flex-1 py-3 rounded-xl font-semibold text-sm disabled:opacity-50 transition-colors"
                style={{ background: EMBER, color: "#fff" }}>
                {saving ? "Publishing…" : "Publish recipe"}
              </button>
            </div>
          </div>

          {/* ── RIGHT: Live Preview ── */}
          <div className="w-full lg:w-1/2 lg:sticky lg:top-6">
            <p className="text-xs font-bold tracking-widest uppercase mb-3" style={{ color: MUTED }}>
              Live Preview
            </p>
            <RecipePreview
              title={title}
              description={description}
              imageUrl={imageUrl}
              cuisineType={cuisineType}
              dishTypes={dishTypes}
              dietaryTags={dietaryTags}
              prepTime={prepTime}
              cookTime={cookTime}
              servings={servings}
              ingredients={ingredients}
              instructions={instructions}
              nutrients={nutrients}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
