"use client";

import { useImageControls } from "@/lib/hooks/use-image-controls";
import type { EntityType } from "@/lib/image-controls-context";

type Size = "full" | "card" | "small";

interface Props {
  images: string[];
  entityId: string;
  entityType: EntityType;
  size: Size;
  className?: string;
  children: (currentUrl: string, cropStyle: React.CSSProperties) => React.ReactNode;
}

export function ImageWithControls({
  images,
  entityId,
  entityType,
  size,
  className,
  children,
}: Props) {
  const { currentIndex, currentUrl, cropPos, goPrev, goNext, openCropEditor, isAdmin } =
    useImageControls(entityId, entityType, images);

  const cropStyle: React.CSSProperties = currentUrl
    ? { objectPosition: `${cropPos.x}% ${cropPos.y}%` }
    : {};

  const showChevrons = images.length > 1;
  const showDots = images.length > 1 && size !== "small";
  const showCropButton = isAdmin && size !== "small" && !!currentUrl;

  return (
    <div className={`group relative w-full h-full ${className ?? ""}`}>
      {children(currentUrl, cropStyle)}

      {showChevrons && (
        <>
          <button
            type="button"
            data-testid="image-chevron-prev"
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              goPrev();
            }}
            aria-label="Previous image"
            className="absolute top-1/2 -translate-y-1/2 left-1 z-20 opacity-0 group-hover:opacity-100 transition-opacity"
            style={{
              width: 32,
              height: 32,
              borderRadius: "50%",
              background: "rgba(0,0,0,0.55)",
              color: "#fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: "none",
              cursor: "pointer",
            }}
          >
            ‹
          </button>
          <button
            type="button"
            data-testid="image-chevron-next"
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              goNext();
            }}
            aria-label="Next image"
            className="absolute top-1/2 -translate-y-1/2 right-1 z-20 opacity-0 group-hover:opacity-100 transition-opacity"
            style={{
              width: 32,
              height: 32,
              borderRadius: "50%",
              background: "rgba(0,0,0,0.55)",
              color: "#fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: "none",
              cursor: "pointer",
            }}
          >
            ›
          </button>
        </>
      )}

      {showDots && (
        <div
          data-testid="image-dots"
          className="absolute bottom-2 left-1/2 -translate-x-1/2 z-20 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          {images.map((_, i) => (
            <span
              key={i}
              style={{
                width: i === currentIndex ? 12 : 6,
                height: 6,
                borderRadius: 3,
                background: i === currentIndex ? "#fff" : "rgba(255,255,255,0.5)",
                transition: "width 150ms",
              }}
            />
          ))}
        </div>
      )}

      {showCropButton && (
        <button
          type="button"
          data-testid="image-crop-button"
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            openCropEditor();
          }}
          aria-label="Edit image crop"
          className="absolute top-1 right-1 z-20 opacity-0 group-hover:opacity-100 transition-opacity"
          style={{
            width: 32,
            height: 32,
            borderRadius: 6,
            background: "rgba(0,0,0,0.55)",
            color: "#F59E0B",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            border: "none",
            cursor: "pointer",
            fontSize: 16,
          }}
        >
          ✂
        </button>
      )}
    </div>
  );
}
