"use client";

import { useEffect, useState } from "react";
import { Baby, Loader2 } from "lucide-react";
import { FamilyMemberCard } from "@/components/family-member-card";
import type {
  HouseholdMember,
  MemberType,
  MilestoneKey,
  AllergenKey,
  MemberMilestone,
  MemberAllergen,
} from "@/lib/family-types";

// ── State ────────────────────────────────────────────────────

export default function FamilyMembersPage() {
  const [members, setMembers] = useState<HouseholdMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [formName, setFormName] = useState("");
  const [formDob, setFormDob] = useState("");
  const [formType, setFormType] = useState<MemberType>("baby");
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [opError, setOpError] = useState<string | null>(null);
  // Keys currently in-flight (memberId:key) to prevent double-toggle races
  const [pendingToggles, setPendingToggles] = useState<Set<string>>(new Set());

  // ── Fetch on mount ───────────────────────────────────────────

  async function fetchMembers() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/family/members");
      if (!res.ok) throw new Error(`Failed to load members (${res.status})`);
      const data = await res.json();
      setMembers(data.members ?? []);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Could not load family members.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchMembers();
  }, []);

  // ── Add member ───────────────────────────────────────────────

  async function handleAddMember(e: React.FormEvent) {
    e.preventDefault();
    if (!formName.trim()) {
      setFormError("Name is required.");
      return;
    }
    setFormError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/family/members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formName.trim(),
          date_of_birth: formDob || null,
          member_type: formType,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? `Error ${res.status}`);
      }
      const newMember: HouseholdMember = await res.json();
      setMembers((prev) => [...prev, newMember]);
      setFormName("");
      setFormDob("");
      setFormType("baby");
    } catch (e: unknown) {
      setFormError(e instanceof Error ? e.message : "Could not add member.");
    } finally {
      setSubmitting(false);
    }
  }

  // ── Edit member ──────────────────────────────────────────────

  async function handleEdit(id: string, name: string, dob: string | null) {
    setOpError(null);
    try {
      const res = await fetch(`/api/family/members/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, date_of_birth: dob }),
      });
      if (!res.ok) throw new Error(`Could not save changes (${res.status})`);
      const updated: HouseholdMember = await res.json();
      setMembers((prev) =>
        prev.map((m) => (m.id === id ? { ...m, ...updated } : m))
      );
    } catch (e: unknown) {
      setOpError(e instanceof Error ? e.message : "Could not save changes.");
    }
  }

  // ── Delete member ────────────────────────────────────────────

  async function handleDelete(id: string) {
    setOpError(null);
    try {
      const res = await fetch(`/api/family/members/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error(`Could not remove member (${res.status})`);
      setMembers((prev) => prev.filter((m) => m.id !== id));
    } catch (e: unknown) {
      setOpError(e instanceof Error ? e.message : "Could not remove member.");
    }
  }

  // ── Milestone toggle ─────────────────────────────────────────

  async function handleMilestoneToggle(
    id: string,
    key: MilestoneKey,
    confirmed: boolean
  ) {
    const toggleKey = `${id}:${key}`;
    if (pendingToggles.has(toggleKey)) return;
    setPendingToggles((s) => new Set(s).add(toggleKey));
    // Optimistic update
    setMembers((prev) =>
      prev.map((m) => {
        if (m.id !== id) return m;
        const existing = m.milestones ?? [];
        const updated: MemberMilestone[] = confirmed
          ? [
              ...existing,
              {
                id: crypto.randomUUID(),
                member_id: id,
                milestone_key: key,
                confirmed_at: new Date().toISOString(),
                confirmed_by: "",
              },
            ]
          : existing.filter((ms) => ms.milestone_key !== key);
        return { ...m, milestones: updated };
      })
    );

    try {
      if (confirmed) {
        const res = await fetch("/api/family/milestones", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ member_id: id, milestone_key: key }),
        });
        if (!res.ok) throw new Error(`Error ${res.status}`);
      } else {
        const res = await fetch(
          `/api/family/milestones?member_id=${id}&milestone_key=${key}`,
          { method: "DELETE" }
        );
        if (!res.ok) throw new Error(`Error ${res.status}`);
      }
    } catch {
      // Rollback
      setMembers((prev) =>
        prev.map((m) => {
          if (m.id !== id) return m;
          const existing = m.milestones ?? [];
          const rolledBack: MemberMilestone[] = confirmed
            ? existing.filter((ms) => ms.milestone_key !== key)
            : [
                ...existing,
                {
                  id: crypto.randomUUID(),
                  member_id: id,
                  milestone_key: key,
                  confirmed_at: new Date().toISOString(),
                  confirmed_by: "",
                },
              ];
          return { ...m, milestones: rolledBack };
        })
      );
    } finally {
      setPendingToggles((s) => { const n = new Set(s); n.delete(toggleKey); return n; });
    }
  }

  // ── Allergen toggle ──────────────────────────────────────────

  async function handleAllergenToggle(
    id: string,
    key: AllergenKey,
    introduced: boolean
  ) {
    const toggleKey = `${id}:${key}`;
    if (pendingToggles.has(toggleKey)) return;
    setPendingToggles((s) => new Set(s).add(toggleKey));
    // Optimistic update
    setMembers((prev) =>
      prev.map((m) => {
        if (m.id !== id) return m;
        const existing = m.allergens ?? [];
        const updated: MemberAllergen[] = introduced
          ? [
              ...existing,
              {
                id: crypto.randomUUID(),
                member_id: id,
                allergen_key: key,
                introduced_at: new Date().toISOString(),
                introduced_by: "",
              },
            ]
          : existing.filter((a) => a.allergen_key !== key);
        return { ...m, allergens: updated };
      })
    );

    try {
      if (introduced) {
        const res = await fetch("/api/family/allergens", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ member_id: id, allergen_key: key }),
        });
        if (!res.ok) throw new Error(`Error ${res.status}`);
      } else {
        const res = await fetch(
          `/api/family/allergens?member_id=${id}&allergen_key=${key}`,
          { method: "DELETE" }
        );
        if (!res.ok) throw new Error(`Error ${res.status}`);
      }
    } catch {
      // Rollback
      setMembers((prev) =>
        prev.map((m) => {
          if (m.id !== id) return m;
          const existing = m.allergens ?? [];
          const rolledBack: MemberAllergen[] = introduced
            ? existing.filter((a) => a.allergen_key !== key)
            : [
                ...existing,
                {
                  id: crypto.randomUUID(),
                  member_id: id,
                  allergen_key: key,
                  introduced_at: new Date().toISOString(),
                  introduced_by: "",
                },
              ];
          return { ...m, allergens: rolledBack };
        })
      );
    } finally {
      setPendingToggles((s) => { const n = new Set(s); n.delete(toggleKey); return n; });
    }
  }

  // ── Shared input style ───────────────────────────────────────

  const inputStyle: React.CSSProperties = {
    background: "#0D0904",
    border: "1px solid #3A2416",
    borderRadius: 6,
    color: "#EFE3CE",
    padding: "8px 12px",
    fontSize: 14,
    width: "100%",
    outline: "none",
    colorScheme: "dark" as React.CSSProperties["colorScheme"],
  };

  const labelStyle: React.CSSProperties = {
    color: "#8A6A4A",
    fontSize: 12,
    fontWeight: 600,
    display: "block",
    marginBottom: 4,
  };

  // ── Render ───────────────────────────────────────────────────

  return (
    <div style={{ maxWidth: 640, margin: "0 auto", padding: "24px 16px 48px" }}>
      {/* Page header */}
      <div style={{ marginBottom: 24 }}>
        <h1
          style={{
            fontFamily: "'Libre Baskerville', Georgia, serif",
            color: "#EFE3CE",
            fontSize: 28,
            fontWeight: 700,
            margin: 0,
          }}
        >
          Family Members
        </h1>
        <p style={{ color: "#8A6A4A", fontSize: 14, margin: "6px 0 0" }}>
          Track your little ones&apos; milestones and allergen introductions
        </p>
      </div>

      {/* Add member form */}
      <form
        onSubmit={handleAddMember}
        style={{
          background: "#1A1008",
          border: "1px solid #3A2416",
          borderRadius: 12,
          padding: 16,
          marginBottom: 24,
          display: "flex",
          flexDirection: "column",
          gap: 12,
        }}
      >
        <p
          style={{
            color: "#EFE3CE",
            fontSize: 14,
            fontWeight: 700,
            margin: 0,
            fontFamily: "'Libre Baskerville', Georgia, serif",
          }}
        >
          Add a Family Member
        </p>

        <div>
          <label htmlFor="fm-name" style={labelStyle}>
            Name *
          </label>
          <input
            id="fm-name"
            type="text"
            value={formName}
            onChange={(e) => setFormName(e.target.value)}
            placeholder="e.g. Ella"
            required
            style={inputStyle}
          />
        </div>

        <div>
          <label htmlFor="fm-dob" style={labelStyle}>
            Date of Birth (optional)
          </label>
          <input
            id="fm-dob"
            type="date"
            value={formDob}
            onChange={(e) => setFormDob(e.target.value)}
            style={inputStyle}
          />
        </div>

        <div>
          <label htmlFor="fm-type" style={labelStyle}>
            Member Type
          </label>
          <select
            id="fm-type"
            value={formType}
            onChange={(e) => setFormType(e.target.value as MemberType)}
            style={inputStyle}
          >
            <option value="baby">Baby</option>
            <option value="toddler">Toddler</option>
            <option value="child">Child</option>
            <option value="adult">Adult</option>
          </select>
        </div>

        {formError && (
          <p style={{ color: "#C0392B", fontSize: 13, margin: 0 }}>{formError}</p>
        )}

        <button
          type="submit"
          disabled={submitting}
          style={{
            background: "#B07D56",
            border: "none",
            borderRadius: 8,
            color: "#1A1008",
            fontSize: 14,
            fontWeight: 700,
            padding: "10px 20px",
            cursor: submitting ? "not-allowed" : "pointer",
            opacity: submitting ? 0.7 : 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
            alignSelf: "flex-start",
          }}
        >
          {submitting ? (
            <Loader2 style={{ width: 14, height: 14, animation: "spin 1s linear infinite" }} />
          ) : null}
          {submitting ? "Adding…" : "Add Member"}
        </button>
      </form>

      {/* Loading state */}
      {loading && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 10,
            padding: "32px 0",
            color: "#8A6A4A",
            fontSize: 14,
          }}
        >
          <Loader2
            style={{ width: 18, height: 18, animation: "spin 1s linear infinite" }}
          />
          Loading family members…
        </div>
      )}

      {/* Error state */}
      {!loading && error && (
        <div
          style={{
            background: "#1A1008",
            border: "1px solid #5F3E2D",
            borderRadius: 12,
            padding: 20,
            textAlign: "center",
          }}
        >
          <p style={{ color: "#C0392B", fontSize: 14, margin: "0 0 12px" }}>{error}</p>
          <button
            onClick={fetchMembers}
            style={{
              background: "#B07D56",
              border: "none",
              borderRadius: 8,
              color: "#1A1008",
              fontSize: 13,
              fontWeight: 700,
              padding: "8px 16px",
              cursor: "pointer",
            }}
          >
            Retry
          </button>
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && members.length === 0 && (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 12,
            padding: "40px 16px",
            textAlign: "center",
          }}
        >
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 12,
              background: "linear-gradient(135deg, #B07D56, #5F3E2D)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Baby style={{ width: 24, height: 24, color: "#fff" }} />
          </div>
          <p
            style={{
              fontFamily: "'Libre Baskerville', Georgia, serif",
              color: "#EFE3CE",
              fontSize: 18,
              fontWeight: 700,
              margin: 0,
            }}
          >
            No family members yet
          </p>
          <p style={{ color: "#8A6A4A", fontSize: 14, margin: 0 }}>
            Add your first family member above
          </p>
        </div>
      )}

      {/* Operation error (edit/delete failures) */}
      {opError && (
        <div
          style={{
            background: "#1A1008",
            border: "1px solid #5F3E2D",
            borderRadius: 8,
            padding: "10px 14px",
            marginBottom: 16,
            color: "#C0392B",
            fontSize: 13,
          }}
        >
          {opError}
        </div>
      )}

      {/* Member list */}
      {!loading && !error && members.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {members.map((member) => (
            <FamilyMemberCard
              key={member.id}
              member={member}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onMilestoneToggle={handleMilestoneToggle}
              onAllergenToggle={handleAllergenToggle}
            />
          ))}
        </div>
      )}

      {/* Keyframe for spinner */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
