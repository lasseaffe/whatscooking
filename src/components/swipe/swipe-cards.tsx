"use client";

import { useState } from "react";
import { motion, useTransform } from "framer-motion";
import type { MotionValue } from "framer-motion";
import Link from "next/link";
import {
  Heart, X, Clock, Flame, ExternalLink, Bookmark, BookmarkCheck,
  ChevronDown, ChevronUp, Zap, Mountain,
} from "lucide-react";
import type { SwipeRecipe } from "@/lib/hooks/use-swipe-session";
import { ImageWithControls } from "@/components/image-with-controls";

export const DIFFICULTY_CONFIG = {
  easy:   { label: "Easy",        Icon: Zap,      color: "#16A34A", bg: "#DCFCE7" },
  medium: { label: "Medium",      Icon: Flame,    color: "#D97706", bg: "#FEF3C7" },
  hard:   { label: "Challenging", Icon: Mountain, color: "#DC2626", bg: "#FEE2E2" },
} as const;

// ── Recipe Card ────────────────────────────────────────────────

export function RecipeCard({
  recipe, motionX, saved, onToggleSave, onInfo,
}: {
  recipe: SwipeRecipe;
  motionX: MotionValue<number>;
  saved: boolean;
  onToggleSave: () => void;
  onInfo: () => void;
}) {
  const likeOpacity = useTransform(motionX, [0, 80], [0, 1]);
  const nopeOpacity = useTransform(motionX, [-80, 0], [1, 0]);
  const totalTime = (recipe.prep_time_minutes ?? 0) + (recipe.cook_time_minutes ?? 0);
  const diff = recipe.difficulty_level ? DIFFICULTY_CONFIG[recipe.difficulty_level] : null;

  return (
    <div className="relative w-full h-full select-none" style={{ background: "#fff" }}>
      <div className="absolute inset-0">
        <ImageWithControls
          images={
            recipe.image_urls && recipe.image_urls.length > 0
              ? recipe.image_urls
              : ([recipe.image_url].filter(Boolean) as string[])
          }
          entityId={recipe.id}
          entityType="recipe"
          size="card"
        >
          {(currentUrl, cropStyle) =>
            currentUrl ? (
              <img
                key={currentUrl}
                src={currentUrl}
                alt={recipe.title}
                className="w-full h-full object-cover"
                style={cropStyle}
                draggable={false}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-6xl" style={{ background: "#FFF0E6" }}>🍽️</div>
            )
          }
        </ImageWithControls>
        <div className="absolute inset-0 pointer-events-none" style={{ background: "linear-gradient(to top, rgba(30,12,4,0.93) 0%, rgba(0,0,0,0.25) 55%, transparent 100%)" }} />
      </div>

      {/* LIKE stamp */}
      <motion.div className="absolute top-8 left-6 px-4 py-2 rounded-xl border-4 rotate-[-20deg] pointer-events-none"
        style={{ borderColor: "#4CAF50", opacity: likeOpacity }}>
        <span className="text-2xl font-black tracking-widest" style={{ color: "#4CAF50" }}>LIKE</span>
      </motion.div>

      {/* NOPE stamp */}
      <motion.div className="absolute top-8 right-6 px-4 py-2 rounded-xl border-4 rotate-[20deg] pointer-events-none"
        style={{ borderColor: "#C85A2F", opacity: nopeOpacity }}>
        <span className="text-2xl font-black tracking-widest" style={{ color: "#C85A2F" }}>NOPE</span>
      </motion.div>

      {/* Top-right action buttons */}
      <div className="absolute top-4 right-4 flex flex-col gap-2">
        <button
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => { e.stopPropagation(); onInfo(); }}
          className="w-9 h-9 rounded-full flex items-center justify-center hover:opacity-80"
          style={{ background: "rgba(0,0,0,0.35)" }}
          aria-label="View details"
        >
          <ExternalLink className="w-4 h-4 text-white" />
        </button>
        <button
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => { e.stopPropagation(); onToggleSave(); }}
          className="w-9 h-9 rounded-full flex items-center justify-center hover:opacity-80"
          style={{ background: saved ? "rgba(44,74,140,0.8)" : "rgba(0,0,0,0.35)" }}
          aria-label="Save"
        >
          {saved ? <BookmarkCheck className="w-4 h-4 text-white" /> : <Bookmark className="w-4 h-4 text-white" />}
        </button>
      </div>

      {/* Difficulty badge */}
      {diff && (
        <div className="absolute top-4 left-4">
          <span className="text-xs font-bold px-2.5 py-1 rounded-full"
            style={{ background: diff.bg, color: diff.color }}>
            {diff.label}
          </span>
        </div>
      )}

      {/* Bottom info */}
      <div className="absolute bottom-0 left-0 right-0 p-5">
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          {recipe.cuisine_type && (
            <span className="text-xs px-2.5 py-1 rounded-full font-semibold"
              style={{ background: "rgba(255,255,255,0.2)", color: "#fff", backdropFilter: "blur(4px)" }}>
              {recipe.cuisine_type}
            </span>
          )}
          {(recipe.dietary_tags ?? []).slice(0, 2).map((tag) => (
            <span key={tag} className="text-xs px-2.5 py-1 rounded-full"
              style={{ background: "rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.8)" }}>
              {tag}
            </span>
          ))}
        </div>
        <h2 className="text-2xl font-bold text-white leading-tight mb-2 drop-shadow-md">{recipe.title}</h2>
        {recipe.description && (
          <p className="text-sm text-white/70 leading-relaxed line-clamp-2 mb-3">{recipe.description}</p>
        )}
        <div className="flex items-center gap-4">
          {totalTime > 0 && (
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-white/60" />
              <span className="text-xs text-white/80 font-medium">{totalTime} min</span>
            </div>
          )}
          {recipe.calories && (
            <div className="flex items-center gap-1.5">
              <Flame className="w-3.5 h-3.5 text-white/60" />
              <span className="text-xs text-white/80 font-medium">{recipe.calories} kcal</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Recipe Preview Sheet ───────────────────────────────────────

export function RecipePreviewSheet({
  recipe, saved, onToggleSave, onClose, onLike, onSkip,
}: {
  recipe: SwipeRecipe;
  saved: boolean;
  onToggleSave: () => void;
  onClose: () => void;
  onLike: () => void;
  onSkip: () => void;
}) {
  const [showIngredients, setShowIngredients] = useState(true);
  const [showInstructions, setShowInstructions] = useState(false);
  const totalTime = (recipe.prep_time_minutes ?? 0) + (recipe.cook_time_minutes ?? 0);
  const diff = recipe.difficulty_level ? DIFFICULTY_CONFIG[recipe.difficulty_level] : null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col" style={{ background: "rgba(0,0,0,0.6)" }} onClick={onClose}>
      <div className="mt-auto max-h-[92vh] overflow-y-auto rounded-t-3xl"
        style={{ background: "#FFFBF7" }}
        onClick={(e) => e.stopPropagation()}>

        <div className="relative h-56 overflow-hidden rounded-t-3xl">
          <ImageWithControls
            images={
              recipe.image_urls && recipe.image_urls.length > 0
                ? recipe.image_urls
                : ([recipe.image_url].filter(Boolean) as string[])
            }
            entityId={recipe.id}
            entityType="recipe"
            size="card"
          >
            {(currentUrl, cropStyle) =>
              currentUrl ? (
                <img
                  key={currentUrl}
                  src={currentUrl}
                  alt={recipe.title}
                  className="w-full h-full object-cover"
                  style={cropStyle}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-5xl" style={{ background: "#FFF0E6" }}>🍽️</div>
              )
            }
          </ImageWithControls>
          <div className="absolute inset-0 pointer-events-none" style={{ background: "linear-gradient(to top, rgba(20,8,2,0.85) 0%, transparent 60%)" }} />
          <div className="absolute top-3 left-1/2 -translate-x-1/2 w-10 h-1 rounded-full opacity-60" style={{ background: "#fff" }} />
          <div className="absolute bottom-4 left-5 right-5">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              {recipe.cuisine_type && (
                <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
                  style={{ background: "rgba(255,255,255,0.2)", color: "#fff", backdropFilter: "blur(4px)" }}>
                  {recipe.cuisine_type}
                </span>
              )}
              {diff && (
                <span className="text-xs px-2 py-0.5 rounded-full font-bold"
                  style={{ background: diff.bg, color: diff.color }}>
                  {diff.label}
                </span>
              )}
            </div>
            <h2 className="text-xl font-bold text-white leading-snug drop-shadow">{recipe.title}</h2>
          </div>
        </div>

        <div className="px-5 py-4">
          <div className="flex items-center gap-4 mb-4 flex-wrap">
            {totalTime > 0 && (
              <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl" style={{ background: "#F5EDE4" }}>
                <Clock className="w-4 h-4" style={{ color: "#C85A2F" }} />
                <span className="text-sm font-semibold" style={{ color: "#3D2817" }}>{totalTime} min</span>
              </div>
            )}
            {recipe.calories && (
              <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl" style={{ background: "#F5EDE4" }}>
                <Flame className="w-4 h-4" style={{ color: "#C85A2F" }} />
                <span className="text-sm font-semibold" style={{ color: "#3D2817" }}>{recipe.calories} kcal</span>
              </div>
            )}
            {recipe.servings && (
              <div className="flex items-center gap-1 px-3 py-2 rounded-xl" style={{ background: "#F5EDE4" }}>
                <span className="text-sm font-semibold" style={{ color: "#3D2817" }}>Serves {recipe.servings}</span>
              </div>
            )}
          </div>

          {recipe.description && (
            <p className="text-sm leading-relaxed mb-4" style={{ color: "#6B5B52" }}>{recipe.description}</p>
          )}

          {(recipe.protein_g || recipe.carbs_g || recipe.fat_g) && (
            <div className="flex gap-2 mb-4 flex-wrap">
              {recipe.protein_g && (
                <span className="text-xs px-2.5 py-1 rounded-full font-semibold" style={{ background: "#DBEAFE", color: "#1D4ED8" }}>
                  Protein {Math.round(recipe.protein_g)}g
                </span>
              )}
              {recipe.carbs_g && (
                <span className="text-xs px-2.5 py-1 rounded-full font-semibold" style={{ background: "#FEF3C7", color: "#92400E" }}>
                  Carbs {Math.round(recipe.carbs_g)}g
                </span>
              )}
              {recipe.fat_g && (
                <span className="text-xs px-2.5 py-1 rounded-full font-semibold" style={{ background: "#F3E8FF", color: "#7C3AED" }}>
                  Fat {Math.round(recipe.fat_g)}g
                </span>
              )}
            </div>
          )}

          {(recipe.dietary_tags ?? []).length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-4">
              {(recipe.dietary_tags ?? []).map((tag) => (
                <span key={tag} className="text-xs px-2.5 py-1 rounded-full"
                  style={{ background: "#DCFCE7", color: "#16A34A" }}>
                  {tag}
                </span>
              ))}
            </div>
          )}

          {(recipe.ingredients ?? []).length > 0 && (
            <div className="mb-3 rounded-2xl overflow-hidden" style={{ border: "1.5px solid #F0E8DC" }}>
              <button onClick={() => setShowIngredients((s) => !s)}
                className="w-full flex items-center justify-between px-4 py-3"
                style={{ background: "#FAF7F2" }}>
                <span className="font-semibold text-sm" style={{ color: "#3D2817" }}>
                  Ingredients ({recipe.ingredients?.length ?? 0})
                </span>
                {showIngredients ? <ChevronUp className="w-4 h-4" style={{ color: "#A69180" }} /> : <ChevronDown className="w-4 h-4" style={{ color: "#A69180" }} />}
              </button>
              {showIngredients && (
                <div className="px-4 py-3 flex flex-col gap-1.5">
                  {(recipe.ingredients ?? []).map((ing, i) => (
                    <div key={i} className="flex items-center justify-between text-sm">
                      <span style={{ color: "#3D2817" }}>{ing.name}</span>
                      {(ing.amount || ing.unit) && (
                        <span className="text-xs font-medium" style={{ color: "#A69180" }}>
                          {ing.amount != null ? ing.amount : ""} {ing.unit ?? ""}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {(recipe.instructions ?? []).length > 0 && (
            <div className="mb-5 rounded-2xl overflow-hidden" style={{ border: "1.5px solid #F0E8DC" }}>
              <button onClick={() => setShowInstructions((s) => !s)}
                className="w-full flex items-center justify-between px-4 py-3"
                style={{ background: "#FAF7F2" }}>
                <span className="font-semibold text-sm" style={{ color: "#3D2817" }}>
                  Instructions ({recipe.instructions?.length ?? 0} steps)
                </span>
                {showInstructions ? <ChevronUp className="w-4 h-4" style={{ color: "#A69180" }} /> : <ChevronDown className="w-4 h-4" style={{ color: "#A69180" }} />}
              </button>
              {showInstructions && (
                <div className="px-4 py-3 flex flex-col gap-3">
                  {(recipe.instructions ?? []).map((step, i) => (
                    <div key={i} className="flex gap-3">
                      <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5"
                        style={{ background: "#FFF0E6", color: "#C85A2F" }}>{i + 1}</span>
                      <p className="text-sm leading-relaxed flex-1" style={{ color: "#6B5B52" }}>{step}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <Link href={`/recipes/${recipe.id}`}
            className="flex items-center justify-center gap-2 w-full py-3 rounded-xl text-sm font-semibold mb-4 hover:opacity-80"
            style={{ background: "#EEF2FA", color: "#2C4A8C" }}>
            <ExternalLink className="w-4 h-4" /> Full Recipe Page
          </Link>

          <div className="flex gap-3">
            <button type="button" onClick={onSkip}
              className="flex-1 py-3.5 rounded-2xl font-semibold text-sm hover:opacity-80 flex items-center justify-center gap-2"
              style={{ background: "#F5EDE4", color: "#6B5B52" }}>
              <X className="w-4 h-4" /> Skip
            </button>
            <button type="button" onClick={onToggleSave}
              className="flex items-center justify-center gap-1.5 px-4 py-3.5 rounded-2xl font-semibold text-sm hover:opacity-80"
              style={{ background: saved ? "#EEF2FA" : "#F5EDE4", color: saved ? "#2C4A8C" : "#6B5B52" }}>
              {saved ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
              {saved ? "Saved" : "Save"}
            </button>
            <button type="button" onClick={onLike}
              className="flex-1 py-3.5 rounded-2xl font-semibold text-sm text-white hover:opacity-90 flex items-center justify-center gap-2"
              style={{ background: "linear-gradient(135deg, #C85A2F, #E8834A)" }}>
              <Heart className="w-4 h-4 fill-white" /> Like
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Match Screen ───────────────────────────────────────────────

export function MatchScreen({
  liked, savedIds, onToggleSave, onRestart,
}: {
  liked: SwipeRecipe[];
  savedIds: Set<string>;
  onToggleSave: (r: SwipeRecipe) => void;
  onRestart: () => void;
}) {
  return (
    <div className="px-4 py-8 max-w-lg mx-auto w-full min-h-screen" style={{ color: "#EFE3CE", background: "#1C1209" }}>
      <div className="text-center mb-8">
        <div className="text-5xl mb-3">🎉</div>
        <h1 className="text-2xl font-bold mb-1" style={{ color: "#EFE3CE" }}>Your Matches</h1>
        {liked.length === 0 ? (
          <p className="text-sm" style={{ color: "#8A6A4A" }}>You didn&apos;t like any meals this time.</p>
        ) : (
          <p className="text-sm" style={{ color: "#8A6A4A" }}>
            You liked {liked.length} meal{liked.length !== 1 ? "s" : ""}. Save your favourites!
          </p>
        )}
      </div>

      {liked.length > 0 && (
        <div className="flex flex-col gap-3 mb-8">
          {liked.map((recipe) => {
            const totalTime = (recipe.prep_time_minutes ?? 0) + (recipe.cook_time_minutes ?? 0);
            const isSaved = savedIds.has(recipe.id);
            const diff = recipe.difficulty_level ? DIFFICULTY_CONFIG[recipe.difficulty_level] : null;
            return (
              <div key={recipe.id}
                className="flex items-center gap-3 rounded-2xl overflow-hidden shadow-sm"
                style={{ background: "#2A1804", border: "1px solid #3A2416" }}>
                <Link href={`/recipes/${recipe.id}`} className="w-20 h-20 shrink-0 overflow-hidden">
                  {recipe.image_url
                    ? <img src={recipe.image_url} alt={recipe.title} className="w-full h-full object-cover" />
                    : <div className="w-full h-full flex items-center justify-center text-2xl" style={{ background: "#3D2010" }}>🍽️</div>}
                </Link>
                <div className="flex-1 min-w-0 py-2">
                  <Link href={`/recipes/${recipe.id}`}>
                    <div className="font-semibold text-sm leading-tight mb-1 truncate pr-2" style={{ color: "#EFE3CE" }}>{recipe.title}</div>
                  </Link>
                  <div className="flex items-center gap-2 flex-wrap">
                    {recipe.cuisine_type && (
                      <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "#3D2010", color: "#C85A2F" }}>
                        {recipe.cuisine_type}
                      </span>
                    )}
                    {diff && (
                      <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                        style={{ background: diff.bg, color: diff.color }}>
                        {diff.label}
                      </span>
                    )}
                    {totalTime > 0 && (
                      <span className="text-xs flex items-center gap-0.5" style={{ color: "#8A6A4A" }}>
                        <Clock className="w-3 h-3" />{totalTime}m
                      </span>
                    )}
                  </div>
                </div>
                <div className="pr-3 flex items-center gap-2 shrink-0">
                  <button onClick={() => onToggleSave(recipe)}
                    className="w-9 h-9 rounded-xl flex items-center justify-center hover:opacity-80"
                    style={{ background: isSaved ? "#1C3060" : "#3D2010" }}>
                    {isSaved ? <BookmarkCheck className="w-4 h-4" style={{ color: "#7B9FD4" }} /> : <Bookmark className="w-4 h-4" style={{ color: "#8A6A4A" }} />}
                  </button>
                  <Link href={`/recipes/${recipe.id}`}
                    className="w-9 h-9 rounded-xl flex items-center justify-center"
                    style={{ background: "#3D2010" }}>
                    <ExternalLink className="w-4 h-4" style={{ color: "#8A6A4A" }} />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <button type="button" onClick={onRestart}
        className="w-full py-3.5 rounded-2xl font-semibold text-white hover:opacity-90 mb-3"
        style={{ background: "linear-gradient(135deg, #C85A2F, #E8834A)" }}>
        Swipe Again
      </button>
      <Link href="/discover"
        className="block w-full py-3.5 rounded-2xl font-semibold text-center"
        style={{ background: "#2A1804", color: "#8A6A4A" }}>
        Back to Discover
      </Link>
    </div>
  );
}
