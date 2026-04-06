import React from "react";
import { FIELD_BLOCK_STYLE } from "./membershipAssignmentPanel.styles";

/**
 * Displays the currently selected member with their name, username, and email.
 * Provides a "Clear" button to deselect.
 */
export function SelectedMemberCard({ selectedResult, onClear }) {
  const selectedLabel =
    selectedResult?.displayName ??
    selectedResult?.username ??
    selectedResult?.email ??
    "";

  return (
    <div
      style={{
        ...FIELD_BLOCK_STYLE,
        border: "1px solid #d0d7de",
        borderRadius: 10,
        padding: 12,
        boxSizing: "border-box",
        background: "#f8fbff",
        display: "flex",
        justifyContent: "space-between",
        gap: 12,
        alignItems: "flex-start",
      }}
    >
      <div>
        <div style={{ fontWeight: 700, color: "#08111b" }}>
          {selectedLabel}
        </div>
        <div style={{ fontSize: 13, color: "#5f6f82", marginTop: 4 }}>
          {selectedResult?.username ? `@${selectedResult.username}` : "-"}
        </div>
        <div style={{ fontSize: 13, color: "#5f6f82", marginTop: 2 }}>
          {selectedResult?.email ?? "-"}
        </div>
      </div>

      <button
        type="button"
        onClick={onClear}
        style={{
          padding: "8px 10px",
          borderRadius: 8,
          border: "1px solid #d0d7de",
          background: "#fff",
          color: "#222",
          cursor: "pointer",
        }}
      >
        Clear
      </button>
    </div>
  );
}

export default SelectedMemberCard;
