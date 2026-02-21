// src/features/profiles/kinds/vport/ui/menu/VportActorMenuItemFormActions.jsx

import React, { useMemo } from "react";
import {
  footerStyle,
  secondaryBtnBase,
  primaryBtnBase,
} from "./VportActorMenuItemForm.styles";

export function VportActorMenuItemFormActions({
  canSubmit = false,
  saving = false,
  uploadingImage = false,
  effectiveMode = "create",
  onCancel,
} = {}) {
  const disabled = saving || uploadingImage;

  const primaryLabel = useMemo(() => {
    if (uploadingImage) return "Uploading...";
    if (saving) return effectiveMode === "edit" ? "Saving..." : "Creating...";
    return effectiveMode === "edit" ? "Save" : "Create";
  }, [uploadingImage, saving, effectiveMode]);

  const primaryBtn = {
    ...primaryBtnBase,
    background:
      !canSubmit || saving || uploadingImage
        ? "rgba(168, 85, 247, 0.18)"
        : "linear-gradient(135deg, rgba(168,85,247,0.95), rgba(236,72,153,0.92))",
    cursor: !canSubmit || disabled ? "not-allowed" : "pointer",
    opacity: !canSubmit || disabled ? 0.6 : 1,
  };

  const secondaryBtn = {
    ...secondaryBtnBase,
    cursor: disabled ? "not-allowed" : "pointer",
    opacity: disabled ? 0.65 : 1,
  };

  return (
    <div style={footerStyle}>
      <button
        type="button"
        onClick={onCancel}
        disabled={disabled}
        style={secondaryBtn}
      >
        Cancel
      </button>

      <button type="submit" disabled={!canSubmit} style={primaryBtn}>
        {primaryLabel}
      </button>
    </div>
  );
}

export default VportActorMenuItemFormActions;
