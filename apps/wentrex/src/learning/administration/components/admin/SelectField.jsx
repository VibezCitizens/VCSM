import React from "react";
import { FIELD_BLOCK_STYLE, CONTROL_STYLE } from "./membershipAssignmentPanel.styles";

/**
 * Reusable labeled select dropdown used for role and status fields.
 */
export function SelectField({ label, value, onChange, options }) {
  if (!options?.length) {
    return null;
  }

  return (
    <div style={{ ...FIELD_BLOCK_STYLE, marginBottom: 12 }}>
      <label style={{ display: "block", fontWeight: 600, marginBottom: 6 }}>
        {label}
      </label>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        style={CONTROL_STYLE}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

export default SelectField;
