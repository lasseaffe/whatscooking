"use client";

import { useEffect, useState } from "react";
import { Baby, CheckCircle2, Circle, Trash2 } from "lucide-react";
import {
  HouseholdMember,
  MilestoneKey,
  AllergenKey,
  MILESTONE_KEYS,
  MILESTONE_LABELS,
  MILESTONE_DESCRIPTIONS,
  ALLERGEN_KEYS,
  ALLERGEN_LABELS,
  ageLabel,
} from "@/lib/family-types";

interface Props {
  member: HouseholdMember;
  onMilestoneToggle: (memberId: string, key: MilestoneKey, confirmed: boolean) => void;
  onAllergenToggle: (memberId: string, key: AllergenKey, introduced: boolean) => void;
  onDelete: (memberId: string) => void;
  onEdit: (memberId: string, name: string, dateOfBirth: string | null) => void;
}

export function FamilyMemberCard({
  member,
  onMilestoneToggle,
  onAllergenToggle,
  onDelete,
  onEdit,
}: Props) {
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState(member.name);
  const [editDob, setEditDob] = useState(member.date_of_birth ?? "");

  // Reset edit inputs when a different member is passed (e.g. optimistic update rollback)
  useEffect(() => {
    setEditName(member.name);
    setEditDob(member.date_of_birth ?? "");
  }, [member.id]);

  const age = ageLabel(member.date_of_birth);

  const confirmedKeys = new Set(
    (member.milestones ?? []).map((m) => m.milestone_key)
  );
  const introducedKeys = new Set(
    (member.allergens ?? []).map((a) => a.allergen_key)
  );

  function handleSave() {
    onEdit(member.id, editName.trim() || member.name, editDob || null);
    setEditing(false);
  }

  function handleCancel() {
    setEditName(member.name);
    setEditDob(member.date_of_birth ?? "");
    setEditing(false);
  }

  function handleDelete() {
    if (window.confirm(`Remove ${member.name} from your household?`)) {
      onDelete(member.id);
    }
  }

  return (
    <div
      style={{
        background: "#1A1008",
        border: "1px solid #3A2416",
        borderRadius: 12,
        padding: "16px",
        position: "relative",
      }}
    >
      {/* Delete button */}
      <button
        onClick={handleDelete}
        aria-label={`Remove ${member.name}`}
        style={{
          position: "absolute",
          top: 12,
          right: 12,
          background: "transparent",
          border: "none",
          cursor: "pointer",
          padding: 4,
          color: "#6B4E36",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Trash2 style={{ width: 16, height: 16 }} />
      </button>

      {/* Header */}
      <div className="flex items-start gap-3" style={{ paddingRight: 28 }}>
        {/* Avatar */}
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: 8,
            background: "linear-gradient(135deg, #B07D56, #5F3E2D)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <Baby style={{ width: 16, height: 16, color: "#fff" }} />
        </div>

        {/* Name / Edit */}
        <div className="flex-1 min-w-0">
          {editing ? (
            <div className="flex flex-col gap-2">
              <input
                aria-label="Member name"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="Name"
                style={{
                  background: "#0D0904",
                  border: "1px solid #3A2416",
                  borderRadius: 6,
                  color: "#EFE3CE",
                  padding: "4px 8px",
                  fontSize: 14,
                  fontFamily: "'Libre Baskerville', Georgia, serif",
                  width: "100%",
                  outline: "none",
                }}
              />
              <input
                aria-label="Date of birth"
                type="date"
                value={editDob}
                onChange={(e) => setEditDob(e.target.value)}
                style={{
                  background: "#0D0904",
                  border: "1px solid #3A2416",
                  borderRadius: 6,
                  color: "#8A6A4A",
                  padding: "4px 8px",
                  fontSize: 13,
                  width: "100%",
                  outline: "none",
                  colorScheme: "dark",
                }}
              />
              <div className="flex gap-2">
                <button
                  onClick={handleSave}
                  style={{
                    background: "#B07D56",
                    border: "none",
                    borderRadius: 6,
                    color: "#1A1008",
                    fontSize: 12,
                    fontWeight: 700,
                    padding: "4px 12px",
                    cursor: "pointer",
                  }}
                >
                  Save
                </button>
                <button
                  onClick={handleCancel}
                  style={{
                    background: "transparent",
                    border: "1px solid #3A2416",
                    borderRadius: 6,
                    color: "#8A6A4A",
                    fontSize: 12,
                    fontWeight: 600,
                    padding: "4px 12px",
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <>
              <button
                onClick={() => setEditing(true)}
                style={{
                  background: "transparent",
                  border: "none",
                  padding: 0,
                  cursor: "pointer",
                  textAlign: "left",
                  display: "block",
                  width: "100%",
                }}
              >
                <span
                  style={{
                    fontFamily: "'Libre Baskerville', Georgia, serif",
                    color: "#EFE3CE",
                    fontSize: 16,
                    fontWeight: 700,
                    display: "block",
                  }}
                >
                  {member.name}
                </span>
              </button>
              {age && (
                <span style={{ color: "#8A6A4A", fontSize: 12, display: "block", marginTop: 2 }}>
                  {age}
                </span>
              )}
            </>
          )}
        </div>
      </div>

      {/* Milestones */}
      <div style={{ marginTop: 16 }}>
        <p
          style={{
            color: "#8A6A4A",
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            marginBottom: 8,
          }}
        >
          Milestones
        </p>
        <div className="flex flex-col gap-2">
          {MILESTONE_KEYS.map((key) => {
            const confirmed = confirmedKeys.has(key);
            const milestone = (member.milestones ?? []).find(
              (m) => m.milestone_key === key
            );
            return (
              <button
                key={key}
                onClick={() => onMilestoneToggle(member.id, key, !confirmed)}
                aria-label={`${MILESTONE_LABELS[key]} — ${confirmed ? "confirmed" : "not yet confirmed"}`}
                aria-pressed={confirmed}
                style={{
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 8,
                  padding: 0,
                  textAlign: "left",
                  width: "100%",
                }}
              >
                {confirmed ? (
                  <CheckCircle2
                    style={{ width: 18, height: 18, color: "#F4A261", flexShrink: 0, marginTop: 1 }}
                  />
                ) : (
                  <Circle
                    style={{ width: 18, height: 18, color: "#3A2416", flexShrink: 0, marginTop: 1 }}
                  />
                )}
                <div className="flex-1 min-w-0">
                  <span
                    style={{
                      color: confirmed ? "#EFE3CE" : "#6B4E36",
                      fontSize: 13,
                      fontWeight: 600,
                      display: "block",
                    }}
                  >
                    {MILESTONE_LABELS[key]}
                  </span>
                  <span style={{ color: "#8A6A4A", fontSize: 11, display: "block" }}>
                    {MILESTONE_DESCRIPTIONS[key]}
                  </span>
                  {confirmed && milestone && (
                    <span style={{ color: "#6B4E36", fontSize: 11, display: "block", marginTop: 2 }}>
                      {new Date(milestone.confirmed_at).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Allergens */}
      <div style={{ marginTop: 16 }}>
        <p
          style={{
            color: "#8A6A4A",
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            marginBottom: 8,
          }}
        >
          Allergens Introduced
        </p>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 6,
          }}
        >
          {ALLERGEN_KEYS.map((key) => {
            const introduced = introducedKeys.has(key);
            return (
              <button
                key={key}
                onClick={() => onAllergenToggle(member.id, key, !introduced)}
                style={{
                  background: introduced ? "rgba(176,125,86,0.15)" : "#1A1008",
                  border: `1px solid ${introduced ? "rgba(176,125,86,0.4)" : "#3A2416"}`,
                  borderRadius: 8,
                  color: introduced ? "#B07D56" : "#6B4E36",
                  fontSize: 12,
                  fontWeight: 600,
                  padding: "6px 10px",
                  cursor: "pointer",
                  textAlign: "left",
                  transition: "background 0.15s, border-color 0.15s",
                }}
              >
                {introduced ? `✓ ${ALLERGEN_LABELS[key]}` : ALLERGEN_LABELS[key]}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
