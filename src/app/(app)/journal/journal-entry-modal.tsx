"use client";

import { AnimatePresence, motion } from "framer-motion";
import { X, Star } from "lucide-react";
import Link from "next/link";
import { springGentle } from "@/lib/motion";
import { CookLogSheet } from "@/components/cook-log-sheet";
import { useState } from "react";

export interface JournalEntry {
  id: string;
  recipe_id: string | null;
  recipe_title: string;
  cooked_at: string;
  rating: number | null;
  notes: string | null;
  next_time: string | null;
  photo_url: string | null;
}

interface JournalEntryModalProps {
  entry: JournalEntry | null;
  onClose: () => void;
}

function StarRow({ rating }: { rating: number }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          className="w-4 h-4"
          style={{
            color: n <= rating ? "#F4A261" : "rgba(58,36,22,0.4)",
            fill: n <= rating ? "#F4A261" : "transparent",
          }}
        />
      ))}
    </div>
  );
}

export function JournalEntryModal({ entry, onClose }: JournalEntryModalProps) {
  const [editSheetOpen, setEditSheetOpen] = useState(false);

  return (
    <AnimatePresence>
      {entry && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40"
            style={{ background: "rgba(0,0,0,0.8)" }}
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.97 }}
            transition={springGentle}
            className="fixed inset-0 z-50 flex flex-col overflow-y-auto"
            style={{ background: "#0d0d0c" }}
          >
            {/* Top bar */}
            <div className="flex items-center justify-between px-5 py-4 shrink-0">
              <button onClick={onClose} className="p-2 rounded-lg hover:opacity-70 transition-opacity">
                <X className="w-5 h-5" style={{ color: "#C8A882" }} />
              </button>
              <button
                onClick={() => setEditSheetOpen(true)}
                className="text-sm font-semibold hover:opacity-70 transition-opacity"
                style={{ color: "#C85A2F" }}
              >
                Edit
              </button>
            </div>

            {/* Photo */}
            {entry.photo_url && (
              <div className="w-full aspect-video shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={entry.photo_url} alt={entry.recipe_title} className="w-full h-full object-cover" />
              </div>
            )}

            {/* Content */}
            <div className="px-5 py-5 flex-1">
              {entry.recipe_id ? (
                <Link
                  href={`/recipes/${entry.recipe_id}`}
                  className="text-xl font-bold leading-snug hover:opacity-80 transition-opacity block mb-1"
                  style={{ color: "#EFE3CE", fontFamily: "var(--font-fraunces, 'Fraunces', Georgia, serif)" }}
                >
                  {entry.recipe_title}
                </Link>
              ) : (
                <h2
                  className="text-xl font-bold mb-1"
                  style={{ color: "#EFE3CE", fontFamily: "var(--font-fraunces, 'Fraunces', Georgia, serif)" }}
                >
                  {entry.recipe_title}
                </h2>
              )}

              <p className="text-xs mb-3" style={{ color: "#5A3A28" }}>
                {new Date(entry.cooked_at).toLocaleDateString("en", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
              </p>

              {entry.rating && (
                <div className="mb-4">
                  <StarRow rating={entry.rating} />
                </div>
              )}

              {entry.notes && (
                <p className="text-base leading-relaxed mb-5" style={{ color: "#C8A882" }}>
                  {entry.notes}
                </p>
              )}

              {entry.next_time && (
                <div
                  className="rounded-xl p-4"
                  style={{ background: "rgba(58,36,22,0.2)", border: "1px solid rgba(58,36,22,0.4)" }}
                >
                  <p className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: "#5A3A28" }}>
                    Next time
                  </p>
                  <p className="text-sm leading-relaxed" style={{ color: "#C8A882" }}>
                    {entry.next_time}
                  </p>
                </div>
              )}
            </div>

            {editSheetOpen && (
              <CookLogSheet
                logId={entry.id}
                recipeTitle={entry.recipe_title}
                open={editSheetOpen}
                onClose={() => setEditSheetOpen(false)}
              />
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
