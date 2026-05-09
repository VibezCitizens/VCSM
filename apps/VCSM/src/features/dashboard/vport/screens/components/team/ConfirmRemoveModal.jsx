import React from "react";
import { useActorSummary } from "@hydration";

export function ConfirmRemoveModal({ member, removing, error, onConfirm, onCancel }) {
  const summary = useActorSummary(member?.actor_id);
  const displayName = summary.displayName || member?.actor_id || "this member";

  const overlayStyle = {
    position: "fixed", inset: 0, zIndex: 10001,
    background: "rgba(0,0,0,.7)", display: "flex",
    alignItems: "center", justifyContent: "center", padding: 24,
  };
  const modalStyle = {
    width: "100%", maxWidth: 380,
    background: "rgba(9,13,27,.98)", borderRadius: 20,
    border: "1px solid rgba(239,68,68,.15)",
    padding: 24, display: "grid", gap: 16,
  };

  return (
    <div style={overlayStyle} onClick={(e) => e.target === e.currentTarget && onCancel()}>
      <div style={modalStyle}>
        <div style={{ textAlign: "center", display: "grid", gap: 8 }}>
          <div style={{ fontSize: 28, lineHeight: 1 }}>⚠️</div>
          <div style={{ fontSize: 16, fontWeight: 700, color: "rgba(255,255,255,.9)" }}>
            Remove team member?
          </div>
          <div style={{ fontSize: 13, color: "rgba(148,163,184,.6)", lineHeight: 1.5 }}>
            <span style={{ color: "rgba(255,255,255,.7)", fontWeight: 600 }}>{displayName}</span> will lose
            access to this vport. This cannot be undone without re-adding them.
          </div>
        </div>

        {error && (
          <div style={{
            borderRadius: 8, background: "rgba(239,68,68,.08)",
            border: "1px solid rgba(239,68,68,.2)",
            padding: "8px 12px", fontSize: 12, color: "#fca5a5",
          }}>
            {error}
          </div>
        )}

        <div style={{ display: "flex", gap: 10 }}>
          <button
            type="button"
            onClick={onCancel}
            disabled={removing}
            style={{
              flex: 1, height: 44, borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: "pointer",
              border: "1px solid rgba(255,255,255,.1)", background: "none",
              color: "rgba(148,163,184,.7)", opacity: removing ? 0.5 : 1,
            }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={removing}
            style={{
              flex: 1, height: 44, borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: "pointer",
              border: "none",
              background: removing ? "rgba(239,68,68,.2)" : "rgba(239,68,68,.85)",
              color: removing ? "rgba(252,165,165,.5)" : "#fff",
            }}
          >
            {removing ? "Removing…" : "Remove"}
          </button>
        </div>
      </div>
    </div>
  );
}
