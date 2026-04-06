import React from "react";
import { FIELD_BLOCK_STYLE, CONTROL_STYLE } from "./membershipAssignmentPanel.styles";

/**
 * Inline form for creating a new member when no existing member was found.
 * Collects display name and email.
 */
export function CreateMemberForm({
  createDisplayName,
  onChangeDisplayName,
  createEmail,
  onChangeEmail,
  createHelperText,
  createDisplayNameLabel,
  createEmailLabel,
}) {
  return (
    <div
      style={{
        ...FIELD_BLOCK_STYLE,
        marginBottom: 12,
        padding: 14,
        borderRadius: 10,
        border: "1px solid #d0d7de",
        boxSizing: "border-box",
        background: "#f8fbff",
        display: "grid",
        gap: 12,
      }}
    >
      <div>
        <div style={{ fontWeight: 700, color: "#08111b", marginBottom: 4 }}>
          Create new member access
        </div>
        <div style={{ fontSize: 13, color: "#5f6f82" }}>
          {createHelperText || "No existing member matched. Create a new account and assign this organization role."}
        </div>
      </div>

      <div>
        <label style={{ display: "block", fontWeight: 600, marginBottom: 6 }}>
          {createDisplayNameLabel}
        </label>
        <input
          value={createDisplayName}
          onChange={(event) => onChangeDisplayName(event.target.value)}
          placeholder="Enter full name"
          style={CONTROL_STYLE}
        />
      </div>

      <div>
        <label style={{ display: "block", fontWeight: 600, marginBottom: 6 }}>
          {createEmailLabel}
        </label>
        <input
          value={createEmail}
          onChange={(event) => onChangeEmail(event.target.value)}
          placeholder="member@example.com"
          style={CONTROL_STYLE}
        />
      </div>
    </div>
  );
}

export default CreateMemberForm;
