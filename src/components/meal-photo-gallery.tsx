// src/components/meal-photo-gallery.tsx
"use client";

import { useState } from "react";
import Image from "next/image";
import { Camera, Star, Flag } from "lucide-react";
import type { CookbookMealPhoto } from "@/lib/cookbook-types";

interface MealPhotoGalleryProps {
  cookbookSlug: string;
  recipeId: string;
  photos: CookbookMealPhoto[];
  isOwner: boolean;
  currentUserId: string;
}

export function MealPhotoGallery({ cookbookSlug, recipeId, photos, isOwner, currentUserId }: MealPhotoGalleryProps) {
  const [localPhotos, setLocalPhotos] = useState<CookbookMealPhoto[]>(photos);
  const [uploading, setUploading] = useState(false);
  const [caption, setCaption] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!photoUrl) return;
    setUploading(true);
    const res = await fetch(`/api/cookbooks/${cookbookSlug}/meal-photos`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ recipe_id: recipeId, photo_url: photoUrl, caption }),
    });
    if (res.ok) {
      const newPhoto = await res.json();
      setLocalPhotos((prev) => [newPhoto, ...prev]);
      setPhotoUrl("");
      setCaption("");
    }
    setUploading(false);
  }

  async function handleFeature(photoId: string) {
    await fetch(`/api/cookbooks/${cookbookSlug}/meal-photos/${photoId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_featured: true }),
    });
    setLocalPhotos((prev) => prev.map((p) => ({ ...p, is_featured: p.id === photoId })));
  }

  async function handleFlag(photoId: string) {
    await fetch(`/api/cookbooks/${cookbookSlug}/meal-photos/${photoId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_flagged: true, reported_at: new Date().toISOString() }),
    });
    setLocalPhotos((prev) => prev.filter((p) => p.id !== photoId));
  }

  return (
    <div className="px-4 pb-4">
      <p className="text-xs font-semibold mb-2 flex items-center gap-1" style={{ color: "#C85A2F" }}>
        <Camera className="w-3.5 h-3.5" /> Made it?
      </p>

      {localPhotos.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-2 mb-3">
          {localPhotos.map((photo) => (
            <div key={photo.id} className="relative flex-shrink-0 w-20 h-20 rounded-xl overflow-hidden group">
              <Image src={photo.photo_url} alt={photo.caption ?? "meal photo"} fill className="object-cover" />
              {photo.is_featured && <Star className="absolute top-1 right-1 w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                {isOwner && !photo.is_featured && (
                  <button onClick={() => handleFeature(photo.id)} title="Feature">
                    <Star className="w-4 h-4 text-yellow-300" />
                  </button>
                )}
                {photo.user_id !== currentUserId && (
                  <button onClick={() => handleFlag(photo.id)} title="Report">
                    <Flag className="w-4 h-4 text-red-300" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          value={photoUrl}
          onChange={(e) => setPhotoUrl(e.target.value)}
          placeholder="Paste image URL of your attempt…"
          className="flex-1 text-xs rounded-lg px-3 py-1.5 border"
          style={{ borderColor: "#F5E6D3", color: "#3D2817" }}
        />
        <button type="submit" disabled={uploading || !photoUrl}
          className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white disabled:opacity-50"
          style={{ background: "#C85A2F" }}>
          {uploading ? "…" : "Share"}
        </button>
      </form>
    </div>
  );
}
