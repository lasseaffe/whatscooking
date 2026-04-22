"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft, MapPin, Users, Crown, Clock, Repeat, Calendar,
  CheckCircle, XCircle, HelpCircle, Trash2, UserPlus, MessageSquare,
  Send, Loader2, X, UtensilsCrossed, Share2, Copy, Check,
  Plus, ChevronDown, ChevronUp, Wine, Cake, Cookie,
  Palette, Zap, LayoutList, Edit3, ShieldCheck, Eye,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { ConfirmDeleteDialog } from "@/components/confirm-delete-dialog";

// ── Types ────────────────────────────────────────────────────

type ItemCategory = "meal" | "drink" | "dessert" | "snack" | "decoration" | "activity" | "other";

type PartyItem = {
  id: string;
  party_id: string;
  category: ItemCategory;
  title: string;
  description: string | null;
  recipe_id: string | null;
  added_by: string;
  position: number;
  notes: string | null;
  created_at: string;
  recipe?: { id: string; title: string; image_url: string | null; cuisine_type: string | null } | null;
};

type Guest = {
  id: string;
  party_id: string;
  user_id: string | null;
  email: string | null;
  display_name: string | null;
  rsvp: string;
  role: string;
  note: string | null;
  invited_at: string;
  responded_at: string | null;
};

type Comment = {
  id: string;
  party_id: string;
  user_id: string;
  content: string;
  created_at: string;
  profile: { full_name: string | null; id: string } | null;
};

type Party = {
  id: string;
  host_id: string;
  title: string;
  description: string | null;
  scheduled_at: string;
  location: string | null;
  theme: string | null;
  linked_plan_id: string | null;
  max_guests: number | null;
  is_recurring: boolean;
  recurrence_rule: string | null;
  status: string;
  cover_color: string;
  created_at: string;
};

type LinkedPlan = { id: string; title: string; meals_per_day: number | null; duration_days: number | null } | null;

interface Props {
  party: Party;
  guests: Guest[];
  comments: Comment[];
  items: PartyItem[];
  linkedPlan: LinkedPlan;
  isHost: boolean;
  canEdit: boolean;
  myGuest: Guest | null;
  userId: string;
  userName: string;
}

// ── Category config ──────────────────────────────────────────

const CATEGORY_CONFIG: Record<ItemCategory, { label: string; icon: React.ElementType; color: string; bg: string }> = {
  meal:       { label: "Meal",       icon: UtensilsCrossed, color: "#C85A2F", bg: "#FFF0E6" },
  drink:      { label: "Drink",      icon: Wine,            color: "#1D4ED8", bg: "#DBEAFE" },
  dessert:    { label: "Dessert",    icon: Cake,            color: "#9333EA", bg: "#F3E8FF" },
  snack:      { label: "Snack",      icon: Cookie,          color: "#D97706", bg: "#FEF3C7" },
  decoration: { label: "Decoration", icon: Palette,         color: "#DB2777", bg: "#FCE7F3" },
  activity:   { label: "Activity",   icon: Zap,             color: "#059669", bg: "#D1FAE5" },
  other:      { label: "Other",      icon: LayoutList,      color: "#6B5B52", bg: "#F5EDE4" },
};

const RSVP_OPTIONS = [
  { value: "accepted", label: "Accept",  icon: CheckCircle, color: "#4A6830", bg: "#EEF7F2" },
  { value: "maybe",   label: "Maybe",   icon: HelpCircle,  color: "#A69180", bg: "#F5F2EC" },
  { value: "declined",label: "Decline", icon: XCircle,     color: "#C85A2F", bg: "#FFF0EE" },
];

const STATUS_OPTIONS = ["planning", "confirmed", "completed", "cancelled"];

// ── Main Component ───────────────────────────────────────────

export function PartyDetail({ party, guests, comments: initialComments, items: initialItems, linkedPlan, isHost, canEdit, myGuest, userId, userName }: Props) {
  const router = useRouter();
  const color = party.cover_color;
  const date = new Date(party.scheduled_at);

  // RSVP
  const [myRsvp, setMyRsvp] = useState(myGuest?.rsvp ?? null);
  const [rsvpLoading, setRsvpLoading] = useState(false);

  // Guests
  const [guestList, setGuestList] = useState(guests);
  const [newGuestEmail, setNewGuestEmail] = useState("");
  const [newGuestName, setNewGuestName] = useState("");
  const [newGuestRole, setNewGuestRole] = useState<"viewer"|"editor">("viewer");
  const [addingGuest, setAddingGuest] = useState(false);
  const [showAddGuest, setShowAddGuest] = useState(false);

  // Items
  const [items, setItems] = useState<PartyItem[]>(initialItems);
  const [showAddItem, setShowAddItem] = useState(false);
  const [addingItem, setAddingItem] = useState(false);
  const [newItem, setNewItem] = useState<{ category: ItemCategory; title: string; description: string; notes: string }>({
    category: "meal", title: "", description: "", notes: "",
  });
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [deleteItemId, setDeleteItemId] = useState<string | null>(null);

  // Comments
  const [comments, setComments] = useState<Comment[]>(initialComments);
  const [commentText, setCommentText] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);

  // Status
  const [status, setStatus] = useState(party.status);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // Delete party
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [copied, setCopied] = useState(false);

  // ── RSVP ──────────────────────────────────────────────────
  async function updateRsvp(rsvp: string) {
    setRsvpLoading(true);
    await fetch(`/api/dinner-parties/${party.id}/guests`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rsvp }),
    });
    setMyRsvp(rsvp);
    setGuestList((prev) => prev.map((g) => g.user_id === userId ? { ...g, rsvp } : g));
    setRsvpLoading(false);
  }

  // ── Guests ────────────────────────────────────────────────
  async function addGuest() {
    if (!newGuestEmail.trim()) return;
    setAddingGuest(true);
    const res = await fetch(`/api/dinner-parties/${party.id}/guests`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: newGuestEmail.trim(), display_name: newGuestName.trim() || null, role: newGuestRole }),
    });
    if (res.ok) {
      const g = await res.json();
      setGuestList((prev) => [...prev, g]);
      setNewGuestEmail(""); setNewGuestName(""); setNewGuestRole("viewer");
      setShowAddGuest(false);
    }
    setAddingGuest(false);
  }

  async function removeGuest(guestId: string) {
    await fetch(`/api/dinner-parties/${party.id}/guests?guest_id=${guestId}`, { method: "DELETE" });
    setGuestList((prev) => prev.filter((g) => g.id !== guestId));
  }

  async function updateGuestRole(guestId: string, role: "editor" | "viewer") {
    await fetch(`/api/dinner-parties/${party.id}/guests`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ guest_id: guestId, role }),
    });
    setGuestList((prev) => prev.map((g) => g.id === guestId ? { ...g, role } : g));
  }

  // ── Items ─────────────────────────────────────────────────
  async function addItem() {
    if (!newItem.title.trim()) return;
    setAddingItem(true);
    const res = await fetch(`/api/dinner-parties/${party.id}/items`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        category: newItem.category,
        title: newItem.title.trim(),
        description: newItem.description.trim() || null,
        notes: newItem.notes.trim() || null,
        position: items.length,
      }),
    });
    if (res.ok) {
      const item = await res.json();
      setItems((prev) => [...prev, item]);
      setNewItem({ category: "meal", title: "", description: "", notes: "" });
      setShowAddItem(false);
    }
    setAddingItem(false);
  }

  async function deleteItem(itemId: string) {
    await fetch(`/api/dinner-parties/${party.id}/items?item_id=${itemId}`, { method: "DELETE" });
    setItems((prev) => prev.filter((i) => i.id !== itemId));
    setDeleteItemId(null);
  }

  // ── Comments ──────────────────────────────────────────────
  async function postComment() {
    if (!commentText.trim()) return;
    setSubmittingComment(true);
    const res = await fetch(`/api/dinner-parties/${party.id}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: commentText.trim() }),
    });
    if (res.ok) {
      const c = await res.json();
      setComments((prev) => [...prev, { ...c, profile: { full_name: userName, id: userId } }]);
      setCommentText("");
    }
    setSubmittingComment(false);
  }

  async function deleteComment(cId: string) {
    await fetch(`/api/dinner-parties/${party.id}/comments?comment_id=${cId}`, { method: "DELETE" });
    setComments((prev) => prev.filter((c) => c.id !== cId));
  }

  async function updateStatus(s: string) {
    setUpdatingStatus(true);
    await fetch(`/api/dinner-parties/${party.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: s }),
    });
    setStatus(s);
    setUpdatingStatus(false);
  }

  async function deleteParty() {
    await fetch(`/api/dinner-parties/${party.id}`, { method: "DELETE" });
    router.push("/dinner-parties");
  }

  function copyInviteLink() {
    navigator.clipboard.writeText(`${window.location.origin}/dinner-parties/${party.id}`).then(() => {
      setCopied(true); setTimeout(() => setCopied(false), 2000);
    });
  }

  function shareVia(platform: "whatsapp" | "telegram" | "sms") {
    const url = encodeURIComponent(`${window.location.origin}/dinner-parties/${party.id}`);
    const text = encodeURIComponent(`You're invited to "${party.title}"! 🍽️`);
    const links = {
      whatsapp: `https://wa.me/?text=${text}%20${url}`,
      telegram: `https://t.me/share/url?url=${url}&text=${text}`,
      sms:      `sms:?body=${text}%20${url}`,
    };
    window.open(links[platform], "_blank", "noopener");
  }

  // Group items by category
  const itemsByCategory = (Object.keys(CATEGORY_CONFIG) as ItemCategory[]).reduce((acc, cat) => {
    acc[cat] = items.filter((i) => i.category === cat);
    return acc;
  }, {} as Record<ItemCategory, PartyItem[]>);
  const hasItems = items.length > 0;

  const accepted = guestList.filter((g) => g.rsvp === "accepted").length;
  const declined = guestList.filter((g) => g.rsvp === "declined").length;
  const pending  = guestList.filter((g) => g.rsvp === "invited" || g.rsvp === "maybe").length;

  return (
    <div className="px-6 py-8 max-w-3xl mx-auto">
      <ConfirmDeleteDialog
        open={confirmDelete}
        title="Delete dinner party?"
        description="This will permanently delete the party, guest list, and all discussion. This cannot be undone."
        confirmLabel="Delete party"
        onConfirm={deleteParty}
        onCancel={() => setConfirmDelete(false)}
      />
      <ConfirmDeleteDialog
        open={!!deleteItemId}
        title="Remove item?"
        description="This will remove the item from the party itinerary."
        confirmLabel="Remove"
        onConfirm={() => deleteItemId && deleteItem(deleteItemId)}
        onCancel={() => setDeleteItemId(null)}
      />

      <Link href="/dinner-parties" className="flex items-center gap-1.5 text-xs mb-6 hover:underline" style={{ color: "#A69180" }}>
        <ArrowLeft className="w-3.5 h-3.5" /> All parties
      </Link>

      {/* ── HERO ── */}
      <div className="rounded-2xl overflow-hidden mb-8 border" style={{ borderColor: `${color}30` }}>
        <div className="h-3 w-full" style={{ background: color }} />
        <div className="p-6" style={{ background: `${color}08` }}>
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-1 flex-wrap">
                <h1 className="text-2xl font-bold" style={{ color: "var(--wc-pal-darkest)" }}>{party.title}</h1>
                {isHost && <Crown className="w-5 h-5 shrink-0" aria-label="You're hosting" style={{ color: "var(--wc-accent-saffron)" }} />}
                {party.is_recurring && (
                  <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full" style={{ background: "var(--wc-pal-lightest)", color: "var(--wc-pal-accent)" }}>
                    <Repeat className="w-3 h-3" /> {party.recurrence_rule}
                  </span>
                )}
              </div>
              {party.theme && <p className="text-sm font-medium mb-2" style={{ color }}>✨ {party.theme}</p>}
              {party.description && <p className="text-sm leading-relaxed" style={{ color: "#6B5B52" }}>{party.description}</p>}
            </div>
            {isHost ? (
              <select value={status} onChange={(e) => updateStatus(e.target.value)} disabled={updatingStatus}
                className="text-sm px-3 py-1.5 rounded-xl border font-medium focus:outline-none"
                style={{ borderColor: "#E8D4C0", color: "#3D2817" }}>
                {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
              </select>
            ) : (
              <span className="text-sm px-3 py-1.5 rounded-xl font-medium capitalize" style={{ background: "#FFF0E6", color: "#C85A2F" }}>{status}</span>
            )}
          </div>

          <div className="flex flex-wrap gap-4 mt-4">
            <div className="flex items-center gap-2 text-sm" style={{ color: "#6B5B52" }}>
              <Calendar className="w-4 h-4" style={{ color }} />
              {date.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
            </div>
            <div className="flex items-center gap-2 text-sm" style={{ color: "#6B5B52" }}>
              <Clock className="w-4 h-4" style={{ color }} />
              {date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
            </div>
            {party.location && (
              <div className="flex items-center gap-2 text-sm" style={{ color: "#6B5B52" }}>
                <MapPin className="w-4 h-4" style={{ color }} /> {party.location}
              </div>
            )}
            {party.max_guests && (
              <div className="flex items-center gap-2 text-sm" style={{ color: "#6B5B52" }}>
                <Users className="w-4 h-4" style={{ color }} /> Max {party.max_guests} guests
              </div>
            )}
          </div>

          {linkedPlan && (
            <div className="mt-4 flex items-center gap-3 p-3 rounded-xl" style={{ background: "rgba(255,255,255,0.6)", border: `1px solid ${color}20` }}>
              <UtensilsCrossed className="w-4 h-4 shrink-0" style={{ color }} />
              <span className="text-xs font-semibold" style={{ color: "#3D2817" }}>Linked menu: </span>
              <Link href={`/plans/${linkedPlan.id}`} className="text-xs hover:underline font-medium" style={{ color }}>
                {linkedPlan.title}
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* ── MY RSVP ── */}
      {!isHost && myGuest && (
        <div className="rounded-2xl border p-5 mb-6" style={{ borderColor: "#F5E6D3", background: "#FFF8F0" }}>
          <h2 className="font-bold text-sm mb-3" style={{ color: "#3D2817" }}>Your RSVP</h2>
          <div className="flex gap-2 flex-wrap">
            {RSVP_OPTIONS.map(({ value, label, icon: Icon, color: c, bg }) => (
              <button key={value} onClick={() => updateRsvp(value)} disabled={rsvpLoading}
                className="flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-medium transition-all hover:scale-105 disabled:opacity-50"
                style={{ borderColor: myRsvp === value ? c : "#E8D4C0", background: myRsvp === value ? bg : "#fff", color: myRsvp === value ? c : "#6B5B52" }}>
                <Icon className="w-4 h-4" /> {label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── PARTY ITINERARY ── */}
      <div className="rounded-2xl border p-5 mb-6" style={{ borderColor: "#F5E6D3", background: "#fff" }}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <UtensilsCrossed className="w-4 h-4" style={{ color }} />
            <h2 className="font-bold text-sm" style={{ color: "#3D2817" }}>
              Party Itinerary {items.length > 0 && `(${items.length})`}
            </h2>
            {!canEdit && (
              <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full" style={{ background: "#F5F2EC", color: "#A69180" }}>
                <Eye className="w-3 h-3" /> View only
              </span>
            )}
          </div>
          {canEdit && (
            <button onClick={() => setShowAddItem(!showAddItem)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium border transition-all hover:scale-105"
              style={{ borderColor: color, color, background: `${color}10` }}>
              <Plus className="w-3.5 h-3.5" /> Add item
            </button>
          )}
        </div>

        {/* Add item form */}
        {showAddItem && canEdit && (
          <div className="mb-5 p-4 rounded-2xl" style={{ background: "#FFF8F0", border: "1px solid #F5E6D3" }}>
            <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: "#A69180" }}>New Item</p>

            {/* Category picker */}
            <div className="flex flex-wrap gap-2 mb-3">
              {(Object.keys(CATEGORY_CONFIG) as ItemCategory[]).map((cat) => {
                const { label, icon: Icon, color: cc, bg } = CATEGORY_CONFIG[cat];
                return (
                  <button key={cat} onClick={() => setNewItem(p => ({ ...p, category: cat }))}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium border transition-all"
                    style={{
                      borderColor: newItem.category === cat ? cc : "#E8D4C0",
                      background: newItem.category === cat ? bg : "#fff",
                      color: newItem.category === cat ? cc : "#6B5B52",
                    }}>
                    <Icon className="w-3.5 h-3.5" /> {label}
                  </button>
                );
              })}
            </div>

            <input type="text" value={newItem.title} onChange={(e) => setNewItem(p => ({ ...p, title: e.target.value }))}
              placeholder="Title (e.g. Grilled salmon, Mojito bar, Flower arrangements)"
              className="w-full px-3 py-2 rounded-xl border text-sm focus:outline-none mb-2"
              style={{ borderColor: "#E8D4C0" }} />
            <input type="text" value={newItem.description} onChange={(e) => setNewItem(p => ({ ...p, description: e.target.value }))}
              placeholder="Short description (optional)"
              className="w-full px-3 py-2 rounded-xl border text-sm focus:outline-none mb-2"
              style={{ borderColor: "#E8D4C0" }} />
            <input type="text" value={newItem.notes} onChange={(e) => setNewItem(p => ({ ...p, notes: e.target.value }))}
              placeholder="Notes (e.g. dietary info, responsible person)"
              className="w-full px-3 py-2 rounded-xl border text-sm focus:outline-none mb-3"
              style={{ borderColor: "#E8D4C0" }} />

            <div className="flex gap-2">
              <button onClick={addItem} disabled={addingItem || !newItem.title.trim()}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold disabled:opacity-50 transition-all hover:brightness-95"
                style={{ background: color, color: "#fff" }}>
                {addingItem ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                Add to party
              </button>
              <button onClick={() => setShowAddItem(false)} className="px-4 py-2 rounded-xl text-sm" style={{ color: "#6B5B52" }}>
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Items grouped by category */}
        {!hasItems ? (
          <div className="text-center py-8">
            <UtensilsCrossed className="w-8 h-8 mx-auto mb-2 opacity-20" style={{ color }} />
            <p className="text-sm" style={{ color: "#A69180" }}>
              {canEdit ? "Add meals, drinks, decorations and more." : "No items added yet."}
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {(Object.keys(CATEGORY_CONFIG) as ItemCategory[]).map((cat) => {
              const catItems = itemsByCategory[cat];
              if (catItems.length === 0) return null;
              const { label, icon: CatIcon, color: cc, bg } = CATEGORY_CONFIG[cat];
              return (
                <div key={cat}>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: bg }}>
                      <CatIcon className="w-3.5 h-3.5" style={{ color: cc }} />
                    </div>
                    <span className="text-xs font-bold uppercase tracking-wider" style={{ color: cc }}>{label}s</span>
                  </div>
                  <div className="flex flex-col gap-2 pl-8">
                    {catItems.map((item) => (
                      <div key={item.id}
                        className="flex items-start gap-3 p-3 rounded-xl group"
                        style={{ background: "#FAF7F2", border: "1px solid #F0E8DC" }}>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="text-sm font-semibold" style={{ color: "#3D2817" }}>{item.title}</span>
                            {item.recipe && (
                              <Link href={`/recipes/${item.recipe.id}`}
                                className="text-xs px-2 py-0.5 rounded-full hover:underline"
                                style={{ background: bg, color: cc }}>
                                See recipe →
                              </Link>
                            )}
                          </div>
                          {item.description && (
                            <p className="text-xs leading-relaxed" style={{ color: "#6B5B52" }}>{item.description}</p>
                          )}
                          {item.notes && (
                            <p className="text-xs mt-1 italic" style={{ color: "#A69180" }}>📝 {item.notes}</p>
                          )}
                        </div>
                        {canEdit && (
                          <button onClick={() => setDeleteItemId(item.id)}
                            className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-50 transition-all shrink-0">
                            <Trash2 className="w-3.5 h-3.5" style={{ color: "#C85A2F" }} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── GUEST LIST ── */}
      <div className="rounded-2xl border p-5 mb-6" style={{ borderColor: "#F5E6D3", background: "#fff" }}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-bold text-sm" style={{ color: "#3D2817" }}>Guests {guestList.length > 0 && `(${guestList.length})`}</h2>
            {guestList.length > 0 && (
              <p className="text-xs mt-0.5" style={{ color: "#A69180" }}>
                {accepted} accepted · {declined} declined · {pending} pending
              </p>
            )}
          </div>
          {isHost && (
            <button onClick={() => setShowAddGuest(!showAddGuest)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium border transition-all"
              style={{ borderColor: "#E8D4C0", color: "#6B5B52" }}>
              <UserPlus className="w-3.5 h-3.5" /> Invite
            </button>
          )}
        </div>

        {showAddGuest && isHost && (
          <div className="mb-4 p-3 rounded-xl" style={{ background: "#FFF8F0", border: "1px solid #F5E6D3" }}>
            <div className="flex gap-2 mb-2">
              <input type="text" value={newGuestName} onChange={(e) => setNewGuestName(e.target.value)}
                placeholder="Name" className="flex-1 px-3 py-2 rounded-lg border text-sm focus:outline-none" style={{ borderColor: "#E8D4C0" }} />
              <input type="email" value={newGuestEmail} onChange={(e) => setNewGuestEmail(e.target.value)}
                placeholder="Email" className="flex-[2] px-3 py-2 rounded-lg border text-sm focus:outline-none" style={{ borderColor: "#E8D4C0" }} />
            </div>
            {/* Role picker */}
            <div className="flex gap-2 mb-3">
              <button onClick={() => setNewGuestRole("viewer")}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-all"
                style={{ borderColor: newGuestRole === "viewer" ? "#A69180" : "#E8D4C0", background: newGuestRole === "viewer" ? "#F5F2EC" : "#fff", color: newGuestRole === "viewer" ? "#6B5B52" : "#A69180" }}>
                <Eye className="w-3.5 h-3.5" /> Viewer
              </button>
              <button onClick={() => setNewGuestRole("editor")}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-all"
                style={{ borderColor: newGuestRole === "editor" ? color : "#E8D4C0", background: newGuestRole === "editor" ? `${color}10` : "#fff", color: newGuestRole === "editor" ? color : "#A69180" }}>
                <Edit3 className="w-3.5 h-3.5" /> Editor
              </button>
              <span className="text-xs self-center" style={{ color: "#A69180" }}>
                {newGuestRole === "editor" ? "Can add & edit items" : "Can view only"}
              </span>
            </div>
            <div className="flex gap-2">
              <button onClick={addGuest} disabled={addingGuest || !newGuestEmail.trim()}
                className="px-4 py-1.5 rounded-lg text-xs font-semibold disabled:opacity-50" style={{ background: color, color: "#fff" }}>
                {addingGuest ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Send invite"}
              </button>
              <button onClick={() => setShowAddGuest(false)} className="px-4 py-1.5 rounded-lg text-xs" style={{ color: "#6B5B52" }}>Cancel</button>
            </div>
          </div>
        )}

        {guestList.length === 0 ? (
          <p className="text-xs text-center py-4" style={{ color: "#A69180" }}>No guests invited yet.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {guestList.map((g) => {
              const rsvpConfig = RSVP_OPTIONS.find((o) => o.value === g.rsvp);
              const RsvpIcon = rsvpConfig?.icon ?? HelpCircle;
              return (
                <div key={g.id} className="flex items-center gap-3 px-3 py-2.5 rounded-xl" style={{ background: "#FAF7F2" }}>
                  <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm"
                    style={{ background: `${color}20`, color }}>
                    {(g.display_name ?? g.email ?? "?").charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: "#3D2817" }}>{g.display_name ?? g.email}</p>
                    {g.display_name && g.email && <p className="text-xs truncate" style={{ color: "#A69180" }}>{g.email}</p>}
                  </div>
                  {/* Role badge (host can toggle) */}
                  {isHost && g.user_id !== userId ? (
                    <button onClick={() => updateGuestRole(g.id, g.role === "editor" ? "viewer" : "editor")}
                      className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border transition-all hover:scale-105"
                      style={{
                        borderColor: g.role === "editor" ? color : "#E8D4C0",
                        background: g.role === "editor" ? `${color}10` : "#F5F2EC",
                        color: g.role === "editor" ? color : "#A69180",
                      }}
                      title="Click to toggle role">
                      {g.role === "editor" ? <Edit3 className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                      {g.role ?? "viewer"}
                    </button>
                  ) : (
                    <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full" style={{ background: "#F5F2EC", color: "#A69180" }}>
                      {g.user_id === userId ? <ShieldCheck className="w-3 h-3" style={{ color }} /> : <Eye className="w-3 h-3" />}
                      {g.user_id === userId ? "host" : (g.role ?? "viewer")}
                    </span>
                  )}
                  <div className="flex items-center gap-1.5 text-xs shrink-0" style={{ color: rsvpConfig?.color ?? "#A69180" }}>
                    <RsvpIcon className="w-3.5 h-3.5" />
                    <span className="capitalize">{g.rsvp}</span>
                  </div>
                  {isHost && (
                    <button onClick={() => removeGuest(g.id)} className="p-1 rounded hover:bg-red-50 transition-colors">
                      <X className="w-3 h-3" style={{ color: "#A69180" }} />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── DISCUSSION ── */}
      <div className="rounded-2xl border p-5 mb-6" style={{ borderColor: "#F5E6D3", background: "#fff" }}>
        <div className="flex items-center gap-2 mb-4">
          <MessageSquare className="w-4 h-4" style={{ color }} />
          <h2 className="font-bold text-sm" style={{ color: "#3D2817" }}>Discussion {comments.length > 0 && `(${comments.length})`}</h2>
        </div>
        <div className="flex gap-2 mb-5">
          <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shrink-0" style={{ background: `${color}20`, color }}>
            {userName.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 flex gap-2">
            <input type="text" value={commentText} onChange={(e) => setCommentText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && postComment()}
              placeholder="Write a message to your guests…"
              className="flex-1 px-4 py-2 rounded-xl border text-sm focus:outline-none" style={{ borderColor: "#E8D4C0" }} />
            <button onClick={postComment} disabled={submittingComment || !commentText.trim()}
              className="px-3 py-2 rounded-xl disabled:opacity-50 transition-all hover:brightness-95" style={{ background: color, color: "#fff" }}>
              {submittingComment ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </button>
          </div>
        </div>
        <div className="flex flex-col gap-3">
          {comments.length === 0 && <p className="text-xs text-center py-4" style={{ color: "#A69180" }}>No messages yet. Break the ice!</p>}
          {comments.map((c) => {
            const isOwn = c.user_id === userId;
            return (
              <div key={c.id} className="flex gap-3">
                <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0" style={{ background: "#F5EDE4", color: "#C85A2F" }}>
                  {(c.profile?.full_name ?? "?").charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-xs font-semibold" style={{ color: "#3D2817" }}>{c.profile?.full_name ?? "Guest"}</span>
                    <span className="text-xs" style={{ color: "#A69180" }}>
                      {new Date(c.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </span>
                    {isOwn && (
                      <button onClick={() => deleteComment(c.id)} className="ml-auto hover:opacity-70">
                        <Trash2 className="w-3 h-3" style={{ color: "#A69180" }} />
                      </button>
                    )}
                  </div>
                  <p className="text-sm leading-relaxed" style={{ color: "#3D2817" }}>{c.content}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── SHARE / INVITE ── */}
      <div className="rounded-2xl border p-5 mb-6" style={{ borderColor: "#F5E6D3", background: "#fff" }}>
        <div className="flex items-center gap-2 mb-3">
          <Share2 className="w-4 h-4" style={{ color }} />
          <h2 className="font-bold text-sm" style={{ color: "#3D2817" }}>Invite via</h2>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => shareVia("whatsapp")} className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border transition-all hover:scale-105" style={{ borderColor: "#25D366", color: "#25D366", background: "#F0FFF4" }}>
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
            WhatsApp
          </button>
          <button onClick={() => shareVia("telegram")} className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border transition-all hover:scale-105" style={{ borderColor: "#2AABEE", color: "#2AABEE", background: "#EFF8FF" }}>
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.96 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>
            Telegram
          </button>
          <button onClick={() => shareVia("sms")} className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border transition-all hover:scale-105" style={{ borderColor: "#6B7280", color: "#6B7280", background: "#F9FAFB" }}>
            <MessageSquare className="w-4 h-4" /> SMS
          </button>
          <button onClick={copyInviteLink} className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border transition-all hover:scale-105"
            style={{ borderColor: copied ? "#16A34A" : "#E8D4C0", color: copied ? "#16A34A" : "#6B5B52", background: copied ? "#F0FFF4" : "#fff" }}>
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            {copied ? "Copied!" : "Copy link"}
          </button>
        </div>
      </div>

      {/* ── HOST ACTIONS ── */}
      {isHost && (
        <div className="flex items-center gap-3 flex-wrap">
          <button onClick={() => setConfirmDelete(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border hover:bg-red-50 transition-colors"
            style={{ borderColor: "#FCA5A5", color: "#DC2626" }}>
            <Trash2 className="w-4 h-4" /> Delete party
          </button>
        </div>
      )}
    </div>
  );
}
