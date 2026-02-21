// src/features/profiles/kinds/vport/ui/menu/VportActorMenuItemFormHeader.jsx

import React from "react";
import { headerStyle, titleStyle, iconBtnBase } from "./VportActorMenuItemForm.styles";

export function VportActorMenuItemFormHeader({
  title,
  onClose,
  disabled = false,
} = {}) {
  return (
    <div style={headerStyle}>
      <div style={titleStyle}>{title}</div>

      <button
        type="button"
        onClick={onClose}
        disabled={disabled}
        style={{
          ...iconBtnBase,
          cursor: disabled ? "not-allowed" : "pointer",
          opacity: disabled ? 0.6 : 1,
        }}
      >
        Close
      </button>
    </div>
  );
}

export default VportActorMenuItemFormHeader;
