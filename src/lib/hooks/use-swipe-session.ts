"use client";

import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { useMotionValue } from "framer-motion";

export type SwipeRecipe = {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  image_urls: string[] | null;
  cuisine_type: string | null;
  dietary_tags: string[] | null;
  calories: number | null;
  prep_time_minutes: number | null;
  cook_time_minutes: number | null;
  dish_types: string[] | null;
  ingredients: { name: string; amount?: number | null; unit?: string | null }[] | null;
  instructions: string[] | null;
  servings: number | null;
  protein_g: number | null;
  carbs_g: number | null;
  fat_g: number | null;
  difficulty_level: "easy" | "medium" | "hard" | null;
};

export interface SwipeFilters {
  restrictions: string[];
  customAvoid: string[];
  difficultyFilter: "all" | "easy" | "medium" | "hard";
}

const SWIPE_THRESHOLD = 100;
const ROTATION_FACTOR = 0.08;
const TAP_THRESHOLD = 8;

export function useSwipeSession(
  recipes: SwipeRecipe[],
  initialSavedIds: string[] = [],
  filters: SwipeFilters = { restrictions: [], customAvoid: [], difficultyFilter: "all" }
) {
  const filteredRecipes = useMemo(() => {
    return recipes.filter((r) => {
      if (filters.restrictions.length > 0) {
        const tags = r.dietary_tags ?? [];
        if (!filters.restrictions.every((d) => tags.includes(d))) return false;
      }
      if (filters.customAvoid.length > 0) {
        const ingNames = (r.ingredients ?? []).map((i) => i.name.toLowerCase());
        if (filters.customAvoid.some((avoid) => ingNames.some((ing) => ing.includes(avoid)))) return false;
      }
      if (filters.difficultyFilter !== "all" && r.difficulty_level !== filters.difficultyFilter) return false;
      return true;
    });
  }, [recipes, filters.restrictions, filters.customAvoid, filters.difficultyFilter]);

  const filteredRef = useRef(filteredRecipes);
  filteredRef.current = filteredRecipes;

  const [deck, setDeck] = useState(() => [...filteredRecipes].sort(() => Math.random() - 0.5));
  const [liked, setLiked] = useState<SwipeRecipe[]>([]);
  const [skipped, setSkipped] = useState<SwipeRecipe[]>([]);
  const [done, setDone] = useState(false);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set(initialSavedIds));
  const [previewRecipe, setPreviewRecipe] = useState<SwipeRecipe | null>(null);

  useEffect(() => {
    const next = filteredRef.current.length > 0 ? filteredRef.current : recipes;
    setDeck([...next].sort(() => Math.random() - 0.5));
    setLiked([]);
    setSkipped([]);
    setDone(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.restrictions.join(","), filters.customAvoid.join(","), filters.difficultyFilter]);

  const [dragging, setDragging] = useState(false);
  const [dragX, setDragX] = useState(0);
  const [dragY, setDragY] = useState(0);
  const startX = useRef(0);
  const startY = useRef(0);
  const moved = useRef(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const [exiting, setExiting] = useState<"left" | "right" | null>(null);

  const currentCard = deck[deck.length - 1];
  const nextCard = deck[deck.length - 2];

  const commitSwipe = useCallback((dir: "left" | "right") => {
    if (!currentCard || exiting) return;
    setExiting(dir);
    if (dir === "right") {
      window.dispatchEvent(new CustomEvent('onboarding:action', { detail: { id: 'swipe-right' } }));
    }
    setTimeout(() => {
      if (dir === "right") setLiked((prev) => [currentCard, ...prev]);
      else setSkipped((prev) => [currentCard, ...prev]);
      setDeck((prev) => prev.slice(0, -1));
      setExiting(null);
      setDragX(0);
      setDragY(0);
      if (deck.length === 1) setDone(true);
    }, 350);
  }, [currentCard, deck.length, exiting]);

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    if (exiting) return;
    setDragging(true);
    moved.current = false;
    startX.current = e.clientX;
    startY.current = e.clientY;
    cardRef.current?.setPointerCapture(e.pointerId);
  }, [exiting]);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragging) return;
    const dx = e.clientX - startX.current;
    const dy = e.clientY - startY.current;
    if (Math.abs(dx) > TAP_THRESHOLD || Math.abs(dy) > TAP_THRESHOLD) moved.current = true;
    setDragX(dx);
    setDragY(dy);
  }, [dragging]);

  const onPointerUp = useCallback(() => {
    if (!dragging) return;
    setDragging(false);
    if (!moved.current && currentCard) {
      setPreviewRecipe(currentCard);
      setDragX(0);
      setDragY(0);
      return;
    }
    if (dragX > SWIPE_THRESHOLD) commitSwipe("right");
    else if (dragX < -SWIPE_THRESHOLD) commitSwipe("left");
    else { setDragX(0); setDragY(0); }
  }, [dragging, currentCard, dragX, commitSwipe]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (previewRecipe) { if (e.key === "Escape") setPreviewRecipe(null); return; }
      if (e.key === "ArrowRight") commitSwipe("right");
      if (e.key === "ArrowLeft") commitSwipe("left");
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [commitSwipe, previewRecipe]);

  const cardStyle = useCallback((isTop: boolean): React.CSSProperties => {
    if (!isTop) return { transform: "scale(0.96) translateY(10px)", opacity: 0.85, zIndex: 1 };
    let tx = dragX, ty = dragY * 0.3, rotate = dragX * ROTATION_FACTOR;
    if (exiting === "right") { tx = 600; ty = -80; rotate = 20; }
    if (exiting === "left") { tx = -600; ty = -80; rotate = -20; }
    return {
      transform: `translate(${tx}px, ${ty}px) rotate(${rotate}deg)`,
      transition: dragging ? "none" : exiting ? "transform 0.35s cubic-bezier(0.4,0,0.2,1)" : "transform 0.25s ease-out",
      zIndex: 2,
      cursor: dragging ? "grabbing" : "grab",
      userSelect: "none",
    };
  }, [dragX, dragY, exiting, dragging]);

  const toggleSave = useCallback(async (recipe: SwipeRecipe) => {
    const alreadySaved = savedIds.has(recipe.id);
    setSavedIds((prev) => {
      const next = new Set(prev);
      alreadySaved ? next.delete(recipe.id) : next.add(recipe.id);
      return next;
    });
    if (alreadySaved) {
      await fetch(`/api/swipe/like?recipe_id=${recipe.id}`, { method: "DELETE" });
    } else {
      await fetch("/api/swipe/like", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipe_id: recipe.id }),
      });
    }
  }, [savedIds]);

  const handleRestart = useCallback(() => {
    const source = filteredRef.current.length > 0 ? filteredRef.current : recipes;
    setDeck([...source].sort(() => Math.random() - 0.5));
    setLiked([]);
    setSkipped([]);
    setDone(false);
    setExiting(null);
    setDragX(0);
    setDragY(0);
    setDragging(false);
  }, [recipes]);

  const undo = useCallback(() => {
    if (skipped.length === 0 || exiting) return;
    const last = skipped[0];
    setSkipped((prev) => prev.slice(1));
    setDeck((prev) => [...prev, last]);
    setDone(false);
  }, [skipped, exiting]);

  const likeOpacity = Math.max(0, Math.min(1, (dragX - 20) / 80));
  const nopeOpacity = Math.max(0, Math.min(1, (-dragX - 20) / 80));
  const filteredOut = recipes.length - filteredRecipes.length;

  const motionX = useMotionValue(dragX);
  useEffect(() => { motionX.set(dragX); }, [dragX, motionX]);

  return {
    deck,
    liked,
    skipped,
    done,
    savedIds,
    previewRecipe,
    setPreviewRecipe,
    dragging,
    dragX,
    dragY,
    exiting,
    currentCard,
    nextCard,
    likeOpacity,
    nopeOpacity,
    motionX,
    filteredRecipes,
    filteredOut,
    commitSwipe,
    onPointerDown,
    onPointerMove,
    onPointerUp,
    handleRestart,
    toggleSave,
    cardStyle,
    cardRef,
    undo,
  };
}
