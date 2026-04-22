"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Users, Crown, MapPin, Repeat, CheckCircle, Clock, XCircle, HelpCircle, CalendarDays, LayoutGrid } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

type Party = {
  id: string;
  title: string;
  scheduled_at: string;
  location: string | null;
  theme: string | null;
  status: string;
  cover_color: string;
  is_recurring: boolean;
  recurrence_rule: string | null;
  max_guests: number | null;
  dinner_party_guests: { id: string; rsvp: string; display_name: string | null; user_id: string | null; email: string | null }[];
  role: "host" | "guest";
  myRsvp?: string;
};

const RSVP_ICONS: Record<string, React.ReactNode> = {
  accepted: <CheckCircle className="w-3.5 h-3.5" style={{ color: "#4A6830" }} />,
  declined:  <XCircle    className="w-3.5 h-3.5" style={{ color: "#C85A2F" }} />,
  maybe:     <HelpCircle className="w-3.5 h-3.5" style={{ color: "#A69180" }} />,
  invited:   <Clock      className="w-3.5 h-3.5" style={{ color: "#C8A830" }} />,
};

const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  planning:   { bg: "#FFF8F0", color: "#C85A2F" },
  confirmed:  { bg: "#EEF7F2", color: "#4A6830" },
  completed:  { bg: "#F5F2EC", color: "#6B5B52" },
  cancelled:  { bg: "#FFF0EE", color: "#8C1A1A" },
};

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();
}

/* ── Reduced-motion hook ──────────────────────────────────────── */
function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);
  return reduced;
}

/* ── Cover Card View ──────────────────────────────────────────── */
function CoverCardView({ parties, userId }: { parties: Party[]; userId: string }) {
  const today = new Date();
  const reduced = usePrefersReducedMotion();
  const upcoming = useMemo(
    () => parties.filter((p) => new Date(p.scheduled_at) >= today)
      .sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime()),
    [parties]
  );
  const past = useMemo(
    () => parties.filter((p) => new Date(p.scheduled_at) < today)
      .sort((a, b) => new Date(b.scheduled_at).getTime() - new Date(a.scheduled_at).getTime()),
    [parties]
  );

  const heroParty = upcoming[0];
  const restUpcoming = upcoming.slice(1);

  return (
    <div className="space-y-8">
      {/* Hero — next upcoming party */}
      {heroParty && (
        <motion.div
          initial={reduced ? false : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
        >
        <Link href={`/dinner-parties/${heroParty.id}`}>
          <div
            className="relative rounded-2xl overflow-hidden cursor-pointer group"
            style={{
              minHeight: 260,
              background: `linear-gradient(135deg, ${heroParty.cover_color}22, ${heroParty.cover_color}44)`,
              border: `1px solid ${heroParty.cover_color}55`,
              transition: "transform 0.2s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.2s cubic-bezier(0.34,1.56,0.64,1)",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.transform = "scale(1.01) translateY(-3px)";
              (e.currentTarget as HTMLElement).style.boxShadow = "0 16px 48px rgba(0,0,0,0.35)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.transform = "";
              (e.currentTarget as HTMLElement).style.boxShadow = "";
            }}
          >
            {/* Accent top border */}
            <div className="absolute top-0 left-0 right-0 h-1" style={{ background: heroParty.cover_color }} />

            <div className="p-7 pt-8">
              {/* Up next label */}
              <div className="flex items-center gap-2 mb-4">
                <span className="text-xs font-bold uppercase tracking-[0.15em]"
                  style={{ color: heroParty.cover_color }}>
                  Up Next
                </span>
                <div className="flex-1 h-px" style={{ background: `${heroParty.cover_color}40` }} />
                {heroParty.role === "host" && (
                  <span className="flex items-center gap-1 text-xs font-medium"
                    style={{ color: heroParty.cover_color }}>
                    <Crown className="w-3.5 h-3.5" /> Hosting
                  </span>
                )}
              </div>

              <h2 className="text-2xl font-bold mb-2" style={{ color: "var(--fg-primary, #fff)" }}>
                {heroParty.title}
              </h2>
              {heroParty.theme && (
                <p className="text-sm mb-3 italic" style={{ color: "var(--fg-tertiary)" }}>{heroParty.theme}</p>
              )}

              <div className="flex flex-wrap gap-4 mt-4">
                <div className="flex flex-col">
                  <span className="text-xs uppercase tracking-wider mb-0.5" style={{ color: "var(--fg-quaternary)" }}>Date</span>
                  <span className="font-semibold text-sm" style={{ color: "var(--fg-primary)" }}>
                    {new Date(heroParty.scheduled_at).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
                  </span>
                  <span className="text-xs" style={{ color: "var(--fg-tertiary)" }}>
                    {new Date(heroParty.scheduled_at).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                  </span>
                </div>
                {heroParty.location && (
                  <div className="flex flex-col">
                    <span className="text-xs uppercase tracking-wider mb-0.5" style={{ color: "var(--fg-quaternary)" }}>Location</span>
                    <span className="font-semibold text-sm flex items-center gap-1" style={{ color: "var(--fg-primary)" }}>
                      <MapPin className="w-3.5 h-3.5" style={{ color: heroParty.cover_color }} />
                      {heroParty.location}
                    </span>
                  </div>
                )}
                <div className="flex flex-col">
                  <span className="text-xs uppercase tracking-wider mb-0.5" style={{ color: "var(--fg-quaternary)" }}>Guests</span>
                  <span className="font-semibold text-sm flex items-center gap-1" style={{ color: "var(--fg-primary)" }}>
                    <Users className="w-3.5 h-3.5" style={{ color: heroParty.cover_color }} />
                    {heroParty.dinner_party_guests.filter((g) => g.rsvp === "accepted").length}/{heroParty.dinner_party_guests.length} accepted
                  </span>
                  {/* Guest avatar row */}
                  <div className="flex mt-1 -space-x-1.5">
                    {heroParty.dinner_party_guests.slice(0, 5).map((g, i) => (
                      <div key={g.id}
                        className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold border border-black/20"
                        style={{
                          background: `hsl(${(i * 60 + 20) % 360} 55% 45%)`,
                          color: "#fff",
                          zIndex: 10 - i,
                        }}>
                        {(g.display_name ?? g.email ?? "?")[0].toUpperCase()}
                      </div>
                    ))}
                    {heroParty.dinner_party_guests.length > 5 && (
                      <div className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold border border-black/20"
                        style={{ background: "var(--bg-quaternary)", color: "var(--fg-tertiary)" }}>
                        +{heroParty.dinner_party_guests.length - 5}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* RSVP button for guests */}
              {heroParty.role === "guest" && heroParty.myRsvp && (
                <div className="mt-4 flex items-center gap-2">
                  <span className="text-xs" style={{ color: "var(--fg-quaternary)" }}>Your RSVP:</span>
                  {RSVP_ICONS[heroParty.myRsvp]}
                  <span className="text-xs capitalize font-medium" style={{ color: "var(--fg-secondary)" }}>{heroParty.myRsvp}</span>
                </div>
              )}
            </div>
          </div>
        </Link>
        </motion.div>
      )}

      {/* Rest of upcoming — card grid */}
      {restUpcoming.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-[0.13em] mb-4"
            style={{ color: "var(--fg-quaternary)" }}>
            More Coming Up
          </h3>
          <div className="grid gap-4 sm:grid-cols-2">
            {restUpcoming.map((p, i) => (
              <motion.div
                key={p.id}
                initial={reduced ? false : { opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: i * 0.06, ease: [0.22, 1, 0.36, 1] }}
              >
                <PartyCard party={p} userId={userId} />
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Past parties */}
      {past.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-[0.13em] mb-4"
            style={{ color: "var(--fg-quaternary)" }}>
            Past Gatherings
          </h3>
          <div className="flex flex-col gap-3 opacity-60">
            {past.map((p, i) => (
              <motion.div
                key={p.id}
                initial={reduced ? false : { opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.32, delay: i * 0.06, ease: [0.22, 1, 0.36, 1] }}
              >
                <PartyCard party={p} userId={userId} />
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function DinnerPartyCalendar({ parties, userId }: { parties: Party[]; userId: string }) {
  const today = new Date();
  const [viewMode, setViewMode] = useState<"cards" | "calendar">("cards");
  const [viewDate, setViewDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  // Build calendar grid
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (Date | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => new Date(year, month, i + 1)),
  ];
  // Pad to full weeks
  while (cells.length % 7 !== 0) cells.push(null);

  function getPartiesForDay(date: Date) {
    return parties.filter((p) => isSameDay(new Date(p.scheduled_at), date));
  }

  const selectedParties = selectedDay ? getPartiesForDay(selectedDay) : [];

  // Upcoming parties (next 90 days)
  const upcomingParties = useMemo(() => {
    const now = new Date();
    const limit = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);
    return parties.filter((p) => {
      const d = new Date(p.scheduled_at);
      return d >= now && d <= limit;
    });
  }, [parties]);

  function prevMonth() { setViewDate(new Date(year, month - 1, 1)); setSelectedDay(null); }
  function nextMonth() { setViewDate(new Date(year, month + 1, 1)); setSelectedDay(null); }

  return (
    <div className="space-y-6">
      {/* ── View toggle ── */}
      <div className="flex items-center justify-end gap-2">
        <button
          onClick={() => setViewMode("cards")}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
          style={{
            background: viewMode === "cards" ? "var(--wc-accent-saffron, #F4A261)" : "var(--bg-secondary)",
            color: viewMode === "cards" ? "#fff" : "var(--fg-tertiary)",
          }}
        >
          <LayoutGrid className="w-3.5 h-3.5" /> Cards
        </button>
        <button
          onClick={() => setViewMode("calendar")}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
          style={{
            background: viewMode === "calendar" ? "var(--wc-accent-saffron, #F4A261)" : "var(--bg-secondary)",
            color: viewMode === "calendar" ? "#fff" : "var(--fg-tertiary)",
          }}
        >
          <CalendarDays className="w-3.5 h-3.5" /> Calendar
        </button>
      </div>

      {/* ── Cover card view (default) ── */}
      {viewMode === "cards" && <CoverCardView parties={parties} userId={userId} />}

      {/* ── CALENDAR (secondary view) ── */}
      {viewMode === "calendar" && <>
      <div className="rounded-2xl border overflow-hidden" style={{ borderColor: "#F5E6D3" }}>
        {/* Month header */}
        <div className="flex items-center justify-between px-5 py-4"
          style={{ background: "linear-gradient(135deg, #FFF8F0, #FFF0E0)" }}>
          <button onClick={prevMonth} className="p-1.5 rounded-lg hover:bg-white/60 transition-colors">
            <ChevronLeft className="w-4 h-4" style={{ color: "#3D2817" }} />
          </button>
          <h2 className="font-bold text-base" style={{ color: "#3D2817" }}>
            {MONTHS[month]} {year}
          </h2>
          <button onClick={nextMonth} className="p-1.5 rounded-lg hover:bg-white/60 transition-colors">
            <ChevronRight className="w-4 h-4" style={{ color: "#3D2817" }} />
          </button>
        </div>

        {/* Day names */}
        <div className="grid grid-cols-7 border-b" style={{ borderColor: "#F5E6D3" }}>
          {DAYS.map((d) => (
            <div key={d} className="text-center py-2 text-xs font-semibold" style={{ color: "#A69180" }}>
              {d}
            </div>
          ))}
        </div>

        {/* Calendar cells */}
        <div className="grid grid-cols-7">
          {cells.map((date, i) => {
            if (!date) return <div key={`empty-${i}`} className="h-16 border-b border-r" style={{ borderColor: "#F5F0E8" }} />;
            const dayParties = getPartiesForDay(date);
            const isToday = isSameDay(date, today);
            const isSelected = selectedDay && isSameDay(date, selectedDay);
            const isPast = date < today && !isToday;
            return (
              <button
                key={date.toISOString()}
                onClick={() => setSelectedDay(isSelected ? null : date)}
                className="h-16 p-1.5 text-left border-b border-r flex flex-col gap-0.5 transition-colors hover:bg-orange-50"
                style={{
                  borderColor: "#F5F0E8",
                  background: isSelected ? "#FFF0E6" : "transparent",
                }}
              >
                <span className={`text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full ${isToday ? "text-white" : ""}`}
                  style={{
                    background: isToday ? "#C85A2F" : "transparent",
                    color: isToday ? "#fff" : isPast ? "#C8B8A8" : "#3D2817",
                  }}>
                  {date.getDate()}
                </span>
                <div className="flex flex-col gap-0.5 overflow-hidden">
                  {dayParties.slice(0, 2).map((p) => (
                    <div key={p.id} className="w-full h-1.5 rounded-full"
                      style={{ background: p.cover_color }} />
                  ))}
                  {dayParties.length > 2 && (
                    <span className="text-xs" style={{ color: "#A69180", fontSize: "9px" }}>+{dayParties.length - 2}</span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected day panel */}
      {selectedDay && (
        <div className="rounded-2xl border p-5" style={{ borderColor: "#F5E6D3", background: "#FFF8F0" }}>
          <h3 className="font-bold text-sm mb-3" style={{ color: "#3D2817" }}>
            {selectedDay.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
          </h3>
          {selectedParties.length === 0 ? (
            <div className="flex items-center gap-3">
              <p className="text-xs" style={{ color: "#A69180" }}>No parties on this day.</p>
              <Link href={`/dinner-parties/new?date=${selectedDay.toISOString().slice(0, 10)}`}
                className="text-xs px-3 py-1 rounded-lg font-medium"
                style={{ background: "#C85A2F", color: "#fff" }}>
                Plan one →
              </Link>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {selectedParties.map((p) => <PartyCard key={p.id} party={p} userId={userId} />)}
            </div>
          )}
        </div>
      )}

      {/* Upcoming parties list */}
      {upcomingParties.length > 0 && (
        <div>
          <h2 className="text-base font-bold mb-3" style={{ color: "#3D2817" }}>
            Upcoming ({upcomingParties.length})
          </h2>
          <div className="flex flex-col gap-3">
            {upcomingParties.map((p) => <PartyCard key={p.id} party={p} userId={userId} />)}
          </div>
        </div>
      )}

      {/* Past parties */}
      {(() => {
        const past = parties.filter((p) => new Date(p.scheduled_at) < today);
        if (past.length === 0) return null;
        return (
          <div>
            <h2 className="text-base font-bold mb-3" style={{ color: "#A69180" }}>
              Past parties ({past.length})
            </h2>
            <div className="flex flex-col gap-3 opacity-70">
              {past.slice().reverse().map((p) => <PartyCard key={p.id} party={p} userId={userId} />)}
            </div>
          </div>
        );
      })()}
      </>}
    </div>
  );
}

function PartyCard({ party: p, userId }: { party: Party; userId: string }) {
  const date = new Date(p.scheduled_at);
  const accepted = p.dinner_party_guests.filter((g) => g.rsvp === "accepted").length;
  const total = p.dinner_party_guests.length;
  const statusStyle = STATUS_COLORS[p.status] ?? STATUS_COLORS.planning;

  return (
    <Link href={`/dinner-parties/${p.id}`}>
      <div className="rounded-xl border overflow-hidden flex wc-card-hover cursor-pointer"
        style={{ borderColor: "var(--border-tertiary)", background: "var(--bg-primary)" }}>
        {/* Color strip */}
        <div className="w-1.5 shrink-0" style={{ background: p.cover_color }} />

        <div className="flex-1 p-4">
          <div className="flex items-start gap-3">
            {/* Date block */}
            <div className="shrink-0 text-center rounded-xl p-2 min-w-[48px]"
              style={{ background: `${p.cover_color}15` }}>
              <div className="text-xs font-bold uppercase" style={{ color: p.cover_color }}>
                {date.toLocaleDateString("en-US", { month: "short" })}
              </div>
              <div className="text-xl font-extrabold leading-none" style={{ color: "#3D2817" }}>
                {date.getDate()}
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-bold text-sm" style={{ color: "#3D2817" }}>{p.title}</h3>
                {p.role === "host" && (
                  <span title="You're hosting"><Crown className="w-3.5 h-3.5 shrink-0" style={{ color: "#C8A030" }} /></span>
                )}
                {p.role === "guest" && p.myRsvp && (
                  <span title={`Your RSVP: ${p.myRsvp}`}>{RSVP_ICONS[p.myRsvp]}</span>
                )}
                {p.is_recurring && (
                  <span title={`Recurring: ${p.recurrence_rule}`}><Repeat className="w-3 h-3 shrink-0" style={{ color: "#A69180" }} /></span>
                )}
              </div>

              <div className="flex items-center gap-3 mt-1 flex-wrap">
                <span className="text-xs" style={{ color: "#A69180" }}>
                  {date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                </span>
                {p.location && (
                  <span className="flex items-center gap-1 text-xs" style={{ color: "#A69180" }}>
                    <MapPin className="w-3 h-3" />{p.location}
                  </span>
                )}
                {total > 0 && (
                  <span className="flex items-center gap-1 text-xs" style={{ color: "#A69180" }}>
                    <Users className="w-3 h-3" />{accepted}/{total} accepted
                  </span>
                )}
                {p.theme && (
                  <span className="text-xs px-2 py-0.5 rounded-full"
                    style={{ background: "#FFF0E6", color: "#C85A2F" }}>
                    {p.theme}
                  </span>
                )}
              </div>
            </div>

            <span className="shrink-0 text-xs px-2 py-0.5 rounded-full font-medium capitalize"
              style={statusStyle}>
              {p.status}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
