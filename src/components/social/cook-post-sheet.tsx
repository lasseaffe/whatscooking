// src/components/social/cook-post-sheet.tsx
"use client";

import { useState, useRef } from "react";
import { X, Camera, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";

interface Props {
  recipeId: string;
  recipeTitle: string;
  recipeImageUrl?: string | null;
  onClose: () => void;
  onSuccess?: () => void;
}

export function CookPostSheet({ recipeId, recipeTitle, recipeImageUrl, onClose, onSuccess }: Props) {
  const [note, setNote] = useState("");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  }

  async function uploadPhoto(file: File): Promise<string | null> {
    const supabase = createClient();
    const ext = file.name.split(".").pop() ?? "jpg";
    const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const { error: uploadError } = await supabase.storage.from("cook-photos").upload(path, file);
    if (uploadError) return null;
    const { data } = supabase.storage.from("cook-photos").getPublicUrl(path);
    return data.publicUrl;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      let photo_url: string | null = null;
      if (photoFile) {
        // Photo upload failure is non-blocking — post goes through without photo
        photo_url = await uploadPhoto(photoFile);
      }

      const res = await fetch("/api/cook-posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipe_id: recipeId,
          note: note.trim() || null,
          photo_url,
        }),
      });

      if (!res.ok) throw new Error("Failed to share");
      onSuccess?.();
      onClose();
    } catch {
      setError("Something went wrong. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-end" style={{ background: "rgba(0,0,0,0.6)" }} onClick={onClose}>
        <motion.div
          className="w-full rounded-t-3xl overflow-hidden"
          style={{ background: "#1A100A", border: "1px solid rgba(180,120,60,0.3)", borderBottom: "none" }}
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ type: "spring", damping: 30, stiffness: 300 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Handle */}
          <div className="flex justify-center pt-3 pb-1">
            <div className="w-10 h-1 rounded-full" style={{ background: "rgba(180,120,60,0.3)" }} />
          </div>

          <div className="px-6 pb-8 pt-2">
            {/* Header */}
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold" style={{ fontFamily: "var(--font-fraunces, 'Fraunces', Georgia, serif)", color: "#EFE3CE" }}>
                Share your cook
              </h2>
              <button type="button" onClick={onClose} style={{ color: "#5A3A24" }}>
                <X style={{ width: 20, height: 20 }} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Recipe chip */}
              <div className="flex items-center gap-3 rounded-xl p-3" style={{ background: "#2A1808" }}>
                {recipeImageUrl ? (
                  <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={recipeImageUrl} alt={recipeTitle} className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div className="w-10 h-10 rounded-lg flex-shrink-0 flex items-center justify-center text-xl" style={{ background: "#3A2010" }}>
                    🍳
                  </div>
                )}
                <span className="text-sm font-semibold flex-1 truncate" style={{ color: "#EFE3CE" }}>{recipeTitle}</span>
                <span className="text-xs" style={{ color: "#5A3A24" }}>✓</span>
              </div>

              {/* Photo + note row */}
              <div className="flex gap-3">
                {/* Photo slot */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-16 h-16 rounded-xl flex-shrink-0 flex items-center justify-center overflow-hidden transition-opacity hover:opacity-80"
                  style={{ border: "2px dashed rgba(180,120,60,0.3)", background: "#221208" }}
                >
                  {photoPreview ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={photoPreview} alt="preview" className="w-full h-full object-cover" />
                  ) : (
                    <Camera style={{ width: 20, height: 20, color: "#5A3A24" }} />
                  )}
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handlePhotoChange}
                />

                {/* Note */}
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Add a note… (optional)"
                  maxLength={280}
                  rows={3}
                  className="flex-1 rounded-xl px-3 py-2 text-sm resize-none outline-none leading-relaxed"
                  style={{ background: "#221208", color: "#EFE3CE", border: "1px solid rgba(180,120,60,0.15)" }}
                />
              </div>
              {note.length > 240 && (
                <p className="text-xs text-right" style={{ color: "#8A6A4A" }}>{280 - note.length} left</p>
              )}

              {error && <p className="text-xs" style={{ color: "#E05A2B" }}>{error}</p>}

              {/* CTA */}
              <button
                type="submit"
                disabled={submitting}
                className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl font-bold text-base transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-50"
                style={{ background: "#C8956C", color: "#1A0E04" }}
              >
                {submitting ? (
                  <><Loader2 style={{ width: 18, height: 18 }} className="animate-spin" /> Sharing…</>
                ) : (
                  "Share with followers"
                )}
              </button>
            </form>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
