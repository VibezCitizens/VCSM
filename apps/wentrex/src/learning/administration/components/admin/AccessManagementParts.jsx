import React, { useState } from "react";

export function formatDate(value) {
  if (!value) return "-";
  return new Date(value).toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function StatusBadge({ canAccess }) {
  return (
    <span
      style={{
        padding: "2px 10px",
        borderRadius: 12,
        fontSize: 12,
        fontWeight: 600,
        background: canAccess ? "#dcfce7" : "#fee2e2",
        color: canAccess ? "#166534" : "#991b1b",
      }}
    >
      {canAccess ? "Granted" : "Revoked"}
    </span>
  );
}

export function AccessRow({ record, isSaving, onGrant, onRevoke }) {
  return (
    <tr style={{ borderBottom: "1px solid #e5e7eb" }}>
      <td style={{ padding: "10px 12px", fontFamily: "monospace", fontSize: 12 }}>
        {record.actorId}
      </td>
      <td style={{ padding: "10px 12px" }}>
        <StatusBadge canAccess={record.canAccessLearningCenter} />
      </td>
      <td style={{ padding: "10px 12px", fontSize: 13, color: "#6b7280" }}>
        {formatDate(record.grantedAt)}
      </td>
      <td style={{ padding: "10px 12px", fontSize: 13, color: "#6b7280" }}>
        {formatDate(record.revokedAt)}
      </td>
      <td style={{ padding: "10px 12px", fontSize: 13 }}>
        {record.notes || "-"}
      </td>
      <td style={{ padding: "10px 12px" }}>
        {record.canAccessLearningCenter ? (
          <button
            type="button"
            disabled={isSaving}
            onClick={() => onRevoke({ targetActorId: record.actorId })}
            style={{
              padding: "6px 12px",
              borderRadius: 6,
              border: "1px solid #fca5a5",
              background: "#fff",
              color: "#dc2626",
              cursor: isSaving ? "not-allowed" : "pointer",
              fontSize: 13,
            }}
          >
            Revoke
          </button>
        ) : (
          <button
            type="button"
            disabled={isSaving}
            onClick={() => onGrant({ targetActorId: record.actorId })}
            style={{
              padding: "6px 12px",
              borderRadius: 6,
              border: "1px solid #86efac",
              background: "#fff",
              color: "#16a34a",
              cursor: isSaving ? "not-allowed" : "pointer",
              fontSize: 13,
            }}
          >
            Grant
          </button>
        )}
      </td>
    </tr>
  );
}

export function GrantForm({ isSaving, onGrant }) {
  const [targetActorId, setTargetActorId] = useState("");
  const [notes, setNotes] = useState("");

  function handleSubmit(e) {
    e.preventDefault();
    if (!targetActorId.trim()) return;
    onGrant({ targetActorId: targetActorId.trim(), notes }).then((result) => {
      if (result?.ok) {
        setTargetActorId("");
        setNotes("");
      }
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        background: "#f9fafb",
        border: "1px solid #e5e7eb",
        borderRadius: 10,
        padding: 20,
        marginBottom: 24,
      }}
    >
      <h4 style={{ margin: "0 0 14px", fontSize: 15, fontWeight: 700 }}>
        Grant Access to Actor
      </h4>

      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "flex-end" }}>
        <div style={{ flex: 2, minWidth: 220 }}>
          <label
            style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 4 }}
          >
            Actor ID *
          </label>
          <input
            value={targetActorId}
            onChange={(e) => setTargetActorId(e.target.value)}
            placeholder="Learning actor UUID"
            required
            style={{
              width: "100%",
              padding: "8px 10px",
              borderRadius: 6,
              border: "1px solid #d1d5db",
              fontSize: 14,
              boxSizing: "border-box",
              fontFamily: "monospace",
            }}
          />
        </div>

        <div style={{ flex: 2, minWidth: 180 }}>
          <label
            style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 4 }}
          >
            Notes
          </label>
          <input
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Optional reason"
            style={{
              width: "100%",
              padding: "8px 10px",
              borderRadius: 6,
              border: "1px solid #d1d5db",
              fontSize: 14,
              boxSizing: "border-box",
            }}
          />
        </div>

        <button
          type="submit"
          disabled={isSaving || !targetActorId.trim()}
          style={{
            padding: "8px 18px",
            borderRadius: 6,
            border: "none",
            background: isSaving || !targetActorId.trim() ? "#9ca3af" : "#16a34a",
            color: "#fff",
            cursor: isSaving || !targetActorId.trim() ? "not-allowed" : "pointer",
            fontSize: 14,
            fontWeight: 600,
            whiteSpace: "nowrap",
          }}
        >
          {isSaving ? "Saving..." : "Grant Access"}
        </button>
      </div>
    </form>
  );
}
