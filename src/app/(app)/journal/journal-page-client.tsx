"use client";

import { useState } from "react";
import { Star } from "lucide-react";
import { type JournalEntry, JournalEntryModal } from "./journal-entry-modal";

function StarRow({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          className="w-3 h-3"
          style={{
            color: n <= rating ? "#F4A261" : "rgba(58,36,22,0.3)",
            fill: n <= rating ? "#F4A261" : "transparent",
          }}
        />
      ))}
    </div>
  );
}

function groupByMonth(entries: JournalEntry[]): { label: string; entries: JournalEntry[] }[] {
  const map = new Map<string, JournalEntry[]>();
  for (const e of entries) {
    const label = new Date(e.cooked_at).toLocaleDateString("en", { month: "long", year: "numeric" });
    if (!map.has(label)) map.set(label, []);
    map.get(label)!.push(e);
  }
  return Array.from(map.entries()).map(([label, entries]) => ({ label, entries }));
}

interface JournalPageClientProps {
  entries: JournalEntry[];
}

export function JournalPageClient({ entries }: JournalPageClientProps) {
  const [selected, setSelected] = useState<JournalEntry | null>(null);
  const groups = groupByMonth(entries);

  if (entries.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-4xl mb-4">📓</p>
        <p className="text-lg font-semibold mb-2" style={{ color: "#EFE3CE" }}>No cooks logged yet</p>
        <p className="text-sm" style={{ color: "#5A3A28" }}>Mark meals as cooked from your plan or recipe pages and they'll appear here.</p>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col gap-8">
        {groups.map((group) => (
          <section key={group.label}>
            {/* Sticky month header */}
            <div
              className="sticky top-0 z-10 py-2 mb-3"
              style={{ background: "rgba(6,5,4,0.9)", backdropFilter: "blur(8px)" }}
            >
              <h2
                className="text-xs font-bold uppercase tracking-widest"
                style={{ color: "#5A3A28" }}
              >
                {group.label}
              </h2>
            </div>

            <div className="flex flex-col gap-3">
              {group.entries.map((entry) => (
                <button
                  key={entry.id}
                  onClick={() => setSelected(entry)}
                  className="w-full text-left rounded-2xl overflow-hidden transition-opacity hover:opacity-90"
                  style={{ background: "rgba(28,18,9,0.8)", border: "1px solid rgba(58,36,22,0.4)" }}
                >
                  {entry.photo_url && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={entry.photo_url}
                      alt={entry.recipe_title}
                      className="w-full aspect-video object-cover"
                    />
                  )}
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h3 className="font-semibold leading-snug" style={{ color: "#EFE3CE", fontFamily: "var(--font-fraunces, 'Fraunces', Georgia, serif)" }}>
                        {entry.recipe_title}
                      </h3>
                      {entry.rating && <StarRow rating={entry.rating} />}
                    </div>
                    <p className="text-xs mb-2" style={{ color: "#5A3A28" }}>
                      {new Date(entry.cooked_at).toLocaleDateString("en", { month: "short", day: "numeric" })}
                    </p>
                    {entry.notes && (
                      <p className="text-sm leading-snug" style={{ color: "#C8A882" }}>
                        {entry.notes.length > 100 ? entry.notes.slice(0, 100) + "…" : entry.notes}
                      </p>
                    )}
                    {entry.next_time && (
                      <p className="text-xs mt-2 font-medium" style={{ color: "#5A3A28" }}>
                        Next time: {entry.next_time.length > 60 ? entry.next_time.slice(0, 60) + "…" : entry.next_time}
                      </p>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </section>
        ))}
      </div>

      <JournalEntryModal entry={selected} onClose={() => setSelected(null)} />
    </>
  );
}
