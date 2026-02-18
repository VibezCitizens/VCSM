// src/features/profiles/kinds/vport/ui/menu/VportActorMenuCategoryHeader.jsx

import React from "react";

export function VportActorMenuCategoryHeader({
  category,
  canInteract,
  pillStyle,
  codePillStyle,
  btnStyle,
  btnDangerStyle,
  deletingCategory = false,
  savingCategory = false,
  onEditCategory,
  onDeleteCategory,
} = {}) {
  const safeCategory = category ?? null;
  if (!safeCategory) return null;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "space-between",
        gap: 12,
      }}
    >
      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <h3
            style={{
              margin: 0,
              fontSize: 16,
              lineHeight: "20px",
              fontWeight: 800,
              color: "#fff",
            }}
          >
            {safeCategory.name || "Untitled Category"}
          </h3>

          {safeCategory.isActive === false ? <span style={pillStyle}>Inactive</span> : null}
          {safeCategory.key ? <span style={codePillStyle}>{safeCategory.key}</span> : null}
        </div>

        {safeCategory.description ? (
          <div style={{ marginTop: 6, fontSize: 13, lineHeight: "18px", color: "rgba(255,255,255,0.72)" }}>
            {safeCategory.description}
          </div>
        ) : null}
      </div>

      <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
        {onEditCategory ? (
          <button
            type="button"
            onClick={onEditCategory}
            disabled={!canInteract || savingCategory || deletingCategory}
            style={{
              ...btnStyle,
              opacity: !canInteract || savingCategory || deletingCategory ? 0.6 : 1,
            }}
          >
            Edit
          </button>
        ) : null}

        {onDeleteCategory ? (
          <button
            type="button"
            onClick={onDeleteCategory}
            disabled={!canInteract || deletingCategory}
            style={{
              ...btnDangerStyle,
              opacity: !canInteract || deletingCategory ? 0.6 : 1,
            }}
          >
            {deletingCategory ? "Deleting..." : "Delete"}
          </button>
        ) : null}
      </div>
    </div>
  );
}

export default VportActorMenuCategoryHeader;
