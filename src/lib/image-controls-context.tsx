"use client";

import { createContext, useState, useEffect, useRef, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";

export type EntityType = "recipe" | "cookbook" | "chapter";

export type CropEditorTarget = {
  entityId: string;
  entityType: EntityType;
  imageUrl: string;
  images: string[];
};

export type ImageControlsContextValue = {
  openCropEditor: (t: CropEditorTarget) => void;
  closeCropEditor: () => void;
  isAdmin: boolean;
  /** Increments every time a crop is saved; consumers can watch it to re-read storage. */
  version: number;
};

export const ImageControlsContext = createContext<ImageControlsContextValue>({
  openCropEditor: () => {},
  closeCropEditor: () => {},
  isAdmin: false,
  version: 0,
});

const DRAG_DEFAULT = { x: 50, y: 50 };

function CropEditorModal({
  target,
  onClose,
  onSaved,
}: {
  target: CropEditorTarget;
  onClose: () => void;
  onSaved: () => void;
}) {
  const imgRef = useRef<HTMLImageElement>(null);
  const dragOrigin = useRef<{ mouseX: number; mouseY: number; startX: number; startY: number } | null>(null);
  const [pos, setPos] = useState(() => {
    if (typeof window === "undefined") return DRAG_DEFAULT;
    try {
      const raw = localStorage.getItem(`wc-img-prefs::${target.entityId}::${target.imageUrl}`);
      if (!raw) return DRAG_DEFAULT;
      const p = JSON.parse(raw);
      return { x: typeof p.x === "number" ? p.x : 50, y: typeof p.y === "number" ? p.y : 50 };
    } catch {
      return DRAG_DEFAULT;
    }
  });
  const [isDragging, setIsDragging] = useState(false);
  const [hasDragged, setHasDragged] = useState(false);

  const onDrag = useCallback((e: MouseEvent) => {
    if (!dragOrigin.current || !imgRef.current) return;
    const rect = imgRef.current.getBoundingClientRect();
    const dx = ((e.clientX - dragOrigin.current.mouseX) / rect.width) * 100;
    const dy = ((e.clientY - dragOrigin.current.mouseY) / rect.height) * 100;
    setPos({
      x: Math.max(0, Math.min(100, dragOrigin.current.startX - dx)),
      y: Math.max(0, Math.min(100, dragOrigin.current.startY - dy)),
    });
  }, []);

  const stopDrag = useCallback(() => {
    setIsDragging(false);
    dragOrigin.current = null;
    window.removeEventListener("mousemove", onDrag);
    window.removeEventListener("mouseup", stopDrag);
  }, [onDrag]);

  function startDrag(e: React.MouseEvent) {
    e.preventDefault();
    dragOrigin.current = { mouseX: e.clientX, mouseY: e.clientY, startX: pos.x, startY: pos.y };
    setIsDragging(true);
    setHasDragged(true);
    window.addEventListener("mousemove", onDrag);
    window.addEventListener("mouseup", stopDrag);
  }

  useEffect(() => {
    return () => {
      window.removeEventListener("mousemove", onDrag);
      window.removeEventListener("mouseup", stopDrag);
    };
  }, [onDrag, stopDrag]);

  async function handleSave() {
    localStorage.setItem(
      `wc-img-prefs::${target.entityId}::${target.imageUrl}`,
      JSON.stringify(pos)
    );
    fetch("/api/image-prefs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        entityType: target.entityType,
        entityId: target.entityId,
        imageUrl: target.imageUrl,
        x: pos.x,
        y: pos.y,
      }),
    }).catch(() => {
      /* localStorage already written; UI will reconcile on next mount */
    });
    onSaved();
    onClose();
  }

  return (
    <div
      data-testid="crop-editor-modal"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.85)",
        zIndex: 9999,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div style={{ position: "relative", maxWidth: "90vw", maxHeight: "80vh" }}>
        {!hasDragged && (
          <div
            style={{
              position: "absolute",
              top: 12,
              left: "50%",
              transform: "translateX(-50%)",
              zIndex: 1,
              background: "rgba(0,0,0,0.6)",
              color: "#F59E0B",
              padding: "4px 12px",
              borderRadius: 4,
              fontSize: 12,
              fontFamily: "var(--font-geist-mono)",
              letterSpacing: "0.1em",
              pointerEvents: "none",
            }}
          >
            DRAG TO REFRAME
          </div>
        )}
        <img
          ref={imgRef}
          data-testid="crop-editor-image"
          src={target.imageUrl}
          alt="Crop preview"
          onMouseDown={startDrag}
          draggable={false}
          style={{
            display: "block",
            maxWidth: "90vw",
            maxHeight: "80vh",
            objectFit: "cover",
            objectPosition: `${pos.x}% ${pos.y}%`,
            cursor: isDragging ? "grabbing" : "grab",
            border: isDragging ? "2px dashed #F59E0B" : "2px solid transparent",
            userSelect: "none",
          }}
        />
      </div>
      <div style={{ marginTop: 16, display: "flex", gap: 12 }}>
        <button
          data-testid="crop-editor-cancel"
          onClick={onClose}
          style={{
            padding: "8px 24px",
            background: "transparent",
            border: "1px solid rgba(255,255,255,0.3)",
            color: "#fff",
            borderRadius: 6,
            cursor: "pointer",
            fontFamily: "var(--font-geist-mono)",
          }}
        >
          Cancel
        </button>
        <button
          data-testid="crop-editor-save"
          onClick={handleSave}
          style={{
            padding: "8px 24px",
            background: "#F59E0B",
            border: "none",
            color: "#0D0D0D",
            borderRadius: 6,
            cursor: "pointer",
            fontWeight: 600,
            fontFamily: "var(--font-geist-mono)",
          }}
        >
          Save
        </button>
      </div>
    </div>
  );
}

export function ImageControlsProvider({ children }: { children: React.ReactNode }) {
  const [target, setTarget] = useState<CropEditorTarget | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      setIsAdmin(!!user && user.email === process.env.NEXT_PUBLIC_ADMIN_EMAIL);
    });
  }, []);

  const openCropEditor = useCallback((t: CropEditorTarget) => setTarget(t), []);
  const closeCropEditor = useCallback(() => setTarget(null), []);
  const handleSaved = useCallback(() => setVersion((v) => v + 1), []);

  return (
    <ImageControlsContext.Provider value={{ openCropEditor, closeCropEditor, isAdmin, version }}>
      {children}
      {target && <CropEditorModal target={target} onClose={closeCropEditor} onSaved={handleSaved} />}
    </ImageControlsContext.Provider>
  );
}
