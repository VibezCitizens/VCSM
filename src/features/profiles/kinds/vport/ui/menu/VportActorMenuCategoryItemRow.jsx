// src/features/profiles/kinds/vport/ui/menu/VportActorMenuCategoryItemRow.jsx

import React from "react";

export function VportActorMenuCategoryItemRow({
  item,
  itemRowStyle,
  thumbWrapStyle,
  pillStyle,
  codePillStyle,
  btnStyle,
  btnDangerStyle,

  canInteract,
  isDeleting,
  isSaving,

  priceLabel,

  onEditItem,
  onDeleteItem,
} = {}) {
  const safeItem = item ?? null;
  if (!safeItem) return null;

  const imageUrl = safeItem?.imageUrl ?? safeItem?.image_url ?? null;

  return (
    <li style={itemRowStyle}>
      <div style={{ display: "flex", gap: 10, minWidth: 0, flex: 1 }}>
        {imageUrl ? (
          <div style={thumbWrapStyle}>
            <img
              src={imageUrl}
              alt=""
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                display: "block",
              }}
              loading="lazy"
              onError={(e) => {
                e.currentTarget.style.display = "none";
              }}
            />
          </div>
        ) : null}

        <div style={{ minWidth: 0, flex: 1 }}>
          <div
            style={{
              display: "flex",
              alignItems: "baseline",
              justifyContent: "space-between",
              gap: 10,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                flexWrap: "wrap",
                minWidth: 0,
              }}
            >
              <div
                style={{
                  fontSize: 14,
                  fontWeight: 800,
                  lineHeight: "18px",
                  color: "#fff",
                }}
              >
                {safeItem?.name || "Untitled item"}
              </div>

              {safeItem?.isActive === false ? <span style={pillStyle}>Inactive</span> : null}
              {safeItem?.key ? <span style={codePillStyle}>{safeItem.key}</span> : null}
            </div>

            {priceLabel ? (
              <div
                style={{
                  flexShrink: 0,
                  fontSize: 13,
                  fontWeight: 900,
                  color: "rgba(255,255,255,0.92)",
                }}
              >
                {priceLabel}
              </div>
            ) : null}
          </div>

          {safeItem?.description ? (
            <div style={{ marginTop: 6, fontSize: 13, lineHeight: "18px", color: "rgba(255,255,255,0.72)" }}>
              {safeItem.description}
            </div>
          ) : null}
        </div>
      </div>

      <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
        {onEditItem ? (
          <button
            type="button"
            onClick={() => onEditItem?.(safeItem)}
            disabled={!canInteract || isSaving || isDeleting}
            style={{
              ...btnStyle,
              opacity: !canInteract || isSaving || isDeleting ? 0.6 : 1,
            }}
          >
            Edit
          </button>
        ) : null}

        {onDeleteItem ? (
          <button
            type="button"
            onClick={() => onDeleteItem?.(safeItem)}
            disabled={!canInteract || isDeleting}
            style={{
              ...btnDangerStyle,
              opacity: !canInteract || isDeleting ? 0.6 : 1,
            }}
          >
            {isDeleting ? "Deleting..." : "Delete"}
          </button>
        ) : null}
      </div>
    </li>
  );
}

export default VportActorMenuCategoryItemRow;
