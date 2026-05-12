"use client";

import { useState, useEffect, useCallback, useContext } from "react";
import { createClient } from "@/lib/supabase/client";
import { ImageControlsContext, type EntityType } from "@/lib/image-controls-context";

const DEFAULT_POS = { x: 50, y: 50 };

function localKey(entityId: string, imageUrl: string) {
  return `wc-img-prefs::${entityId}::${imageUrl}`;
}

function readLocal(entityId: string, imageUrl: string): { x: number; y: number } {
  if (typeof window === "undefined" || !imageUrl) return DEFAULT_POS;
  try {
    const raw = localStorage.getItem(localKey(entityId, imageUrl));
    if (!raw) return DEFAULT_POS;
    const p = JSON.parse(raw);
    return { x: typeof p.x === "number" ? p.x : 50, y: typeof p.y === "number" ? p.y : 50 };
  } catch {
    return DEFAULT_POS;
  }
}

function writeLocal(entityId: string, imageUrl: string, pos: { x: number; y: number }) {
  if (typeof window === "undefined" || !imageUrl) return;
  localStorage.setItem(localKey(entityId, imageUrl), JSON.stringify(pos));
}

export function useImageControls(
  entityId: string,
  entityType: EntityType,
  images: string[]
) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const currentUrl = images[currentIndex] ?? "";
  const [cropPos, setCropPos] = useState(() => readLocal(entityId, currentUrl));
  const { openCropEditor: contextOpen, isAdmin, version } = useContext(ImageControlsContext);

  // Reload crop when image switches OR when modal commits a new value (version bump)
  useEffect(() => {
    if (!currentUrl) return;
    setCropPos(readLocal(entityId, currentUrl));
    let cancelled = false;
    const supabase = createClient();
    supabase
      .from("image_prefs")
      .select("x, y")
      .eq("entity_type", entityType)
      .eq("entity_id", entityId)
      .eq("image_url", currentUrl)
      .maybeSingle()
      .then(({ data }) => {
        if (cancelled || !data) return;
        const pos = { x: data.x, y: data.y };
        setCropPos(pos);
        writeLocal(entityId, currentUrl, pos);
      });
    return () => {
      cancelled = true;
    };
  }, [entityId, entityType, currentUrl, version]);

  // Clamp index if images array shrinks
  useEffect(() => {
    if (currentIndex >= images.length && images.length > 0) {
      setCurrentIndex(0);
    }
  }, [images.length, currentIndex]);

  const goPrev = useCallback(() => {
    if (images.length < 2) return;
    setCurrentIndex((i) => (i - 1 + images.length) % images.length);
  }, [images.length]);

  const goNext = useCallback(() => {
    if (images.length < 2) return;
    setCurrentIndex((i) => (i + 1) % images.length);
  }, [images.length]);

  const openCropEditor = useCallback(() => {
    if (!currentUrl) return;
    contextOpen({ entityId, entityType, imageUrl: currentUrl, images });
  }, [entityId, entityType, currentUrl, images, contextOpen]);

  return { currentIndex, currentUrl, cropPos, goPrev, goNext, openCropEditor, isAdmin };
}
