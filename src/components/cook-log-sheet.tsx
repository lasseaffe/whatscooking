"use client";

import { useState, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, Star, Camera, Loader2 } from "lucide-react";
import { springGentle } from "@/lib/motion";

export interface CookLogSheetProps {
  logId: string;
  recipeTitle: string;
  open: boolean;
  onClose: () => void;
}

export function CookLogSheet({ logId, recipeTitle, open, onClose }: CookLogSheetProps) {
  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [notes, setNotes] = useState("");
  const [nextTime, setNextTime] = useState("");
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("logId", logId);
      const res = await fetch("/api/cook-log/upload-photo", { method: "POST", body: form });
      if (res.ok) {
        const { url } = await res.json();
        setPhotoUrl(url);
      }
    } finally {
      setUploading(false);
    }
  }

  async function handleSave() {
    if (!rating) return;
    setSaving(true);
    try {
      const body: Record<string, unknown> = { rating };
      if (notes.trim()) body.notes = notes.trim();
      if (nextTime.trim()) body.next_time = nextTime.trim();
      if (photoUrl) body.photo_url = photoUrl;
      await fetch(`/api/cook-log/${logId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      onClose();
    } finally {
      setSaving(false);
    }
  }

  const displayRating = hovered || rating;

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40"
            style={{ background: "rgba(0,0,0,0.6)" }}
            onClick={onClose}
          />

          {/* Sheet */}
          <motion.div
            initial={{ y: 60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 60, opacity: 0 }}
            transition={springGentle}
            className="fixed bottom-0 left-0 right-0 z-50 rounded-t-2xl overflow-y-auto"
            style={{
              background: "#1C1209",
              borderTop: "1px solid rgba(58,36,22,0.8)",
              maxHeight: "85vh",
            }}
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full" style={{ background: "rgba(58,36,22,0.8)" }} />
            </div>

            <div className="px-5 pb-8 pt-2">
              {/* Header */}
              <div className="flex items-start justify-between mb-5">
                <div>
                  <p className="text-xs font-medium mb-0.5" style={{ color: "#5A3A28" }}>
                    How did it go?
                  </p>
                  <h2
                    className="text-lg font-bold leading-tight"
                    style={{ color: "#EFE3CE", fontFamily: "var(--font-fraunces, 'Fraunces', Georgia, serif)" }}
                  >
                    {recipeTitle}
                  </h2>
                </div>
                <button onClick={onClose} className="mt-1 p-1 rounded-lg hover:opacity-70 transition-opacity">
                  <X className="w-5 h-5" style={{ color: "#5A3A28" }} />
                </button>
              </div>

              {/* Star rating */}
              <div className="mb-5">
                <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: "#C8A882" }}>
                  Rating
                </p>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <motion.button
                      key={n}
                      whileTap={{ scale: 0.88 }}
                      transition={springGentle}
                      onMouseEnter={() => setHovered(n)}
                      onMouseLeave={() => setHovered(0)}
                      onClick={() => setRating(n)}
                      className="p-1"
                      aria-label={`Rate ${n} star${n > 1 ? "s" : ""}`}
                    >
                      <Star
                        className="w-8 h-8 transition-colors"
                        style={{
                          color: n <= displayRating ? "#F4A261" : "rgba(58,36,22,0.6)",
                          fill: n <= displayRating ? "#F4A261" : "transparent",
                        }}
                      />
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div className="mb-4">
                <label className="text-xs font-semibold uppercase tracking-wide mb-2 block" style={{ color: "#C8A882" }}>
                  How did it turn out?
                </label>
                <textarea
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="How did it turn out?"
                  className="w-full rounded-xl px-3 py-2.5 text-sm resize-none outline-none placeholder:opacity-40"
                  style={{
                    background: "rgba(58,36,22,0.3)",
                    border: "1px solid rgba(58,36,22,0.5)",
                    color: "#EFE3CE",
                  }}
                />
              </div>

              {/* Photo upload */}
              <div className="mb-4">
                <label className="text-xs font-semibold uppercase tracking-wide mb-2 block" style={{ color: "#C8A882" }}>
                  Photo (optional)
                </label>
                {photoUrl ? (
                  <div className="relative w-full aspect-video rounded-xl overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={photoUrl} alt="Cook photo" className="w-full h-full object-cover" />
                    <button
                      onClick={() => { setPhotoUrl(null); if (fileRef.current) fileRef.current.value = ""; }}
                      className="absolute top-2 right-2 p-1 rounded-full"
                      style={{ background: "rgba(0,0,0,0.6)" }}
                    >
                      <X className="w-4 h-4 text-white" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => fileRef.current?.click()}
                    disabled={uploading}
                    className="w-full rounded-xl py-6 flex flex-col items-center gap-2 transition-opacity hover:opacity-80"
                    style={{ border: "1.5px dashed rgba(58,36,22,0.6)", background: "rgba(58,36,22,0.15)" }}
                  >
                    {uploading ? (
                      <Loader2 className="w-6 h-6 animate-spin" style={{ color: "#C8A882" }} />
                    ) : (
                      <Camera className="w-6 h-6" style={{ color: "#C8A882" }} />
                    )}
                    <span className="text-xs" style={{ color: "#5A3A28" }}>
                      {uploading ? "Uploading…" : "Add a photo"}
                    </span>
                  </button>
                )}
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handlePhotoChange}
                />
              </div>

              {/* Next time */}
              <div className="mb-6">
                <label className="text-xs font-semibold uppercase tracking-wide mb-2 block" style={{ color: "#C8A882" }}>
                  Next time (optional)
                </label>
                <textarea
                  rows={2}
                  value={nextTime}
                  onChange={(e) => setNextTime(e.target.value)}
                  placeholder="What would you change next time?"
                  className="w-full rounded-xl px-3 py-2.5 text-sm resize-none outline-none placeholder:opacity-40"
                  style={{
                    background: "rgba(58,36,22,0.3)",
                    border: "1px solid rgba(58,36,22,0.5)",
                    color: "#EFE3CE",
                  }}
                />
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className="flex-1 py-3 rounded-xl text-sm font-medium transition-opacity hover:opacity-70"
                  style={{
                    background: "rgba(58,36,22,0.3)",
                    border: "1px solid rgba(58,36,22,0.5)",
                    color: "#C8A882",
                  }}
                >
                  Skip
                </button>
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  transition={springGentle}
                  onClick={handleSave}
                  disabled={!rating || saving}
                  className="flex-[2] py-3 rounded-xl text-sm font-semibold transition-opacity disabled:opacity-40"
                  style={{ background: "#C85A2F", color: "#EFE3CE" }}
                >
                  {saving ? "Saving…" : "Save cook"}
                </motion.button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
