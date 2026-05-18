"use client";

import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { useMotionValue, useTransform, animate } from "framer-motion";
import { springBounce } from "@/lib/motion";

export type { SwipeRecipe, SwipeFilters } from "./use-swipe-session";
import type { SwipeRecipe, SwipeFilters } from "./use-swipe-session";

const SWIPE_THRESHOLD = 100;

export function useSwipeFm(
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
  const [isAnimating, setIsAnimating] = useState(false);

  const motionX = useMotionValue(0);
  const motionY = useMotionValue(0);

  const cardRotate = useTransform(motionX, [-200, 0, 200], [-25, 0, 25]);
  const likeOpacity = useTransform(motionX, [0, 80], [0, 1]);
  const nopeOpacity = useTransform(motionX, [-80, 0], [1, 0]);
  const nextCardScale = useTransform(motionX, [-100, 0, 100], [1, 0.96, 1]);

  useEffect(() => {
    const next = filteredRef.current.length > 0 ? filteredRef.current : recipes;
    setDeck([...next].sort(() => Math.random() - 0.5));
    setLiked([]);
    setSkipped([]);
    setDone(false);
    motionX.set(0);
    motionY.set(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.restrictions.join(","), filters.customAvoid.join(","), filters.difficultyFilter]);

  const currentCard = deck[deck.length - 1];
  const nextCard = deck[deck.length - 2];

  const commitSwipe = useCallback(async (dir: "left" | "right") => {
    if (!currentCard || isAnimating) return;
    setIsAnimating(true);

    if (dir === "right") {
      window.dispatchEvent(new CustomEvent("onboarding:action", { detail: { id: "swipe-right" } }));
    }

    const targetX = dir === "right" ? 600 : -600;
    await animate(motionX, targetX, springBounce);
    await animate(motionY, -80, { duration: 0.1 });

    if (dir === "right") setLiked((prev) => [currentCard, ...prev]);
    else setSkipped((prev) => [currentCard, ...prev]);

    const isLast = deck.length === 1;
    setDeck((prev) => prev.slice(0, -1));

    motionX.set(0);
    motionY.set(0);
    setIsAnimating(false);
    if (isLast) setDone(true);
  }, [currentCard, deck.length, isAnimating, motionX, motionY]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (previewRecipe) { if (e.key === "Escape") setPreviewRecipe(null); return; }
      if (e.key === "ArrowRight") commitSwipe("right");
      if (e.key === "ArrowLeft") commitSwipe("left");
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [commitSwipe, previewRecipe]);

  const handleDragEnd = useCallback((_e: unknown, info: { offset: { x: number } }) => {
    if (Math.abs(info.offset.x) > SWIPE_THRESHOLD) {
      commitSwipe(info.offset.x > 0 ? "right" : "left");
    } else {
      animate(motionX, 0, springBounce);
      animate(motionY, 0, { duration: 0.2 });
    }
  }, [commitSwipe, motionX, motionY]);

  const handleTap = useCallback(() => {
    if (currentCard) setPreviewRecipe(currentCard);
  }, [currentCard]);

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
    setIsAnimating(false);
    motionX.set(0);
    motionY.set(0);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [recipes, motionX, motionY]);

  const undo = useCallback(() => {
    if (skipped.length === 0 || isAnimating) return;
    const last = skipped[0];
    setSkipped((prev) => prev.slice(1));
    setDeck((prev) => [...prev, last]);
    setDone(false);
  }, [skipped, isAnimating]);

  return {
    deck,
    liked,
    skipped,
    done,
    savedIds,
    previewRecipe,
    setPreviewRecipe,
    isAnimating,
    currentCard,
    nextCard,
    motionX,
    motionY,
    cardRotate,
    likeOpacity,
    nopeOpacity,
    nextCardScale,
    commitSwipe,
    handleDragEnd,
    handleTap,
    handleRestart,
    toggleSave,
    undo,
    filteredRecipes,
    filteredOut: recipes.length - filteredRecipes.length,
  };
}
