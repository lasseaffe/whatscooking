"use client";

import { useState, useRef, useCallback } from "react";
import { RecipeImage } from "@/components/recipe-image";

interface Props {
  recipeId: string;
  imageUrl?: string | null;
  title: string;
  cuisine?: string | null;
  dietaryTags?: string[] | null;
  initialFocalX?: number | null;
  initialFocalY?: number | null;
  /** Extra class applied to the outer container */
  className?: string;
  /** Inner children rendered on top (e.g. vignette, source badge) */
  children?: React.ReactNode;
}

export function FocalPointEditor({
  recipeId,
  imageUrl,
  title,
  cuisine,
  dietaryTags,
  initialFocalX,
  initialFocalY,
  className = "",
  children,
}: Props) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [focalX, setFocalX] = useState(initialFocalX ?? 50);
  const [focalY, setFocalY] = useState(initialFocalY ?? 50);
  const containerRef = useRef<HTMLDivElement>(null);

  const coordsFromEvent = useCallback((e: React.PointerEvent) => {
    const rect = containerRef.current!.getBoundingClientRect();
    const x = Math.round(Math.min(100, Math.max(0, ((e.clientX - rect.left) / rect.width) * 100)));
    const y = Math.round(Math.min(100, Math.max(0, ((e.clientY - rect.top) / rect.height) * 100)));
    return { x, y };
  }, []);

  function handlePointerDown(e: React.PointerEvent) {
    if (!editing) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    const { x, y } = coordsFromEvent(e);
    setFocalX(x);
    setFocalY(y);
  }

  function handlePointerMove(e: React.PointerEvent) {
    if (!editing || !(e.buttons & 1)) return;
    const { x, y } = coordsFromEvent(e);
    setFocalX(x);
    setFocalY(y);
  }

  async function save() {
    setSaving(true);
    try {
      const res = await fetch(`/api/recipes/${recipeId}/focal-point`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ focal_x: focalX, focal_y: focalY }),
      });
      if (!res.ok) throw new Error("save failed");
      setEditing(false);
    } catch {
      // keep editing open on failure
    } finally {
      setSaving(false);
    }
  }

  function cancel() {
    setFocalX(initialFocalX ?? 50);
    setFocalY(initialFocalY ?? 50);
    setEditing(false);
  }

  return (
    <div ref={containerRef} className={`relative overflow-hidden w-full h-full ${className}`}>
      <RecipeImage
        recipeId={recipeId}
        imageUrl={imageUrl}
        title={title}
        cuisine={cuisine}
        dietaryTags={dietaryTags}
        className="w-full h-full object-cover"
        focal_x={focalX}
        focal_y={focalY}
      />

      {/* Pass-through children (vignette, source badge, etc.) */}
      {children}

      {/* Editing overlay */}
      {editing && (
        <div
          className="absolute inset-0"
          style={{ cursor: "crosshair", touchAction: "none" }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Dim */}
          <div
            className="absolute inset-0"
            style={{ background: "rgba(0,0,0,0.35)" }}
          />

          {/* Grid lines */}
          <svg className="absolute inset-0 w-full h-full" aria-hidden="true">
            {/* thirds */}
            {[33.3, 66.6].map((p) => (
              <g key={p}>
                <line x1={`${p}%`} y1="0" x2={`${p}%`} y2="100%" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
                <line x1="0" y1={`${p}%`} x2="100%" y2={`${p}%`} stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
              </g>
            ))}
          </svg>

          {/* Focal crosshair */}
          <div
            className="absolute pointer-events-none"
            style={{
              left: `${focalX}%`,
              top: `${focalY}%`,
              transform: "translate(-50%, -50%)",
            }}
          >
            {/* Outer ring */}
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: "50%",
                border: "2px solid #C8522A",
                background: "rgba(200,82,42,0.15)",
                boxShadow: "0 0 0 1px rgba(0,0,0,0.5)",
              }}
            />
            {/* Center dot */}
            <div
              style={{
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: "translate(-50%,-50%)",
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: "#C8522A",
              }}
            />
          </div>

          {/* Instruction label */}
          <div
            className="absolute top-3 left-0 right-0 flex justify-center pointer-events-none"
          >
            <span
              className="text-xs font-medium px-3 py-1 rounded-full"
              style={{ background: "rgba(13,9,7,0.8)", color: "#EFE3CE", backdropFilter: "blur(4px)" }}
            >
              Click or drag to set focal point
            </span>
          </div>

          {/* Coords badge */}
          <div
            className="absolute bottom-12 left-0 right-0 flex justify-center pointer-events-none"
          >
            <span
              className="text-xs font-mono px-2 py-0.5 rounded"
              style={{ background: "rgba(13,9,7,0.7)", color: "#8A6A4A" }}
            >
              {focalX}% · {focalY}%
            </span>
          </div>
        </div>
      )}

      {/* Edit / Save / Cancel buttons */}
      <div
        className="absolute bottom-3 right-3 flex items-center gap-2"
        style={{ zIndex: 10 }}
        onClick={(e) => e.stopPropagation()}
      >
        {editing ? (
          <>
            <button
              onClick={cancel}
              disabled={saving}
              className="text-xs px-3 py-1.5 rounded-lg font-medium transition-opacity hover:opacity-80"
              style={{ background: "rgba(13,9,7,0.8)", color: "#8A6A4A", border: "1px solid rgba(58,36,22,0.6)", backdropFilter: "blur(4px)" }}
            >
              Cancel
            </button>
            <button
              onClick={save}
              disabled={saving}
              className="text-xs px-3 py-1.5 rounded-lg font-semibold transition-opacity hover:opacity-80"
              style={{ background: "#C8522A", color: "#FFF5E6" }}
            >
              {saving ? "Saving…" : "Save crop"}
            </button>
          </>
        ) : (
          <button
            onClick={() => setEditing(true)}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-medium transition-opacity hover:opacity-80"
            style={{ background: "rgba(13,9,7,0.75)", color: "#8A6A4A", border: "1px solid rgba(58,36,22,0.5)", backdropFilter: "blur(4px)" }}
            title="Adjust image crop"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Adjust crop
          </button>
        )}
      </div>
    </div>
  );
}
