// src/features/profiles/kinds/vport/ui/menu/VportActorMenuItem.jsx

import React, { useMemo, useCallback } from "react";

export function VportActorMenuItem({
  item,
  onEdit,
  onDelete,
  disabled = false,
  deleting = false,
  className = "",
} = {}) {
  const safeItem = item ?? null;

  const title = useMemo(() => safeItem?.name ?? "Untitled item", [safeItem]);
  const description = useMemo(() => safeItem?.description ?? null, [safeItem]);
  const imageUrl = useMemo(() => safeItem?.imageUrl ?? null, [safeItem]);

  const canInteract = !disabled;

  const handleEdit = useCallback(() => {
    if (!safeItem?.id) return;
    if (!onEdit) return;
    onEdit(safeItem);
  }, [safeItem, onEdit]);

  const handleDelete = useCallback(async () => {
    if (!safeItem?.id) return;
    if (!onDelete) return;
    await onDelete({ itemId: safeItem.id });
  }, [safeItem, onDelete]);

  if (!safeItem) return null;

  return (
    <div
      className={className}
      style={{
        border: "1px solid #e5e7eb",
        borderRadius: 14,
        padding: 10,
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "space-between",
        gap: 12,
      }}
    >
      <div style={{ display: "flex", gap: 10, minWidth: 0, flex: 1 }}>
        {/* ✅ NEW: image thumb */}
        {imageUrl ? (
          <div
            style={{
              width: 54,
              height: 54,
              borderRadius: 12,
              overflow: "hidden",
              flexShrink: 0,
              border: "1px solid rgba(0,0,0,0.08)",
              background: "#111827",
            }}
          >
            <img
              src={imageUrl}
              alt=""
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
              loading="lazy"
            />
          </div>
        ) : null}

        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <div style={{ fontSize: 14, fontWeight: 700, lineHeight: "18px" }}>
              {title}
            </div>

            {safeItem.isActive === false ? (
              <span
                style={{
                  fontSize: 12,
                  padding: "2px 8px",
                  borderRadius: 999,
                  background: "#f3f4f6",
                }}
              >
                Inactive
              </span>
            ) : null}

            {safeItem.key ? (
              <code
                style={{
                  fontSize: 12,
                  padding: "2px 6px",
                  borderRadius: 6,
                  background: "#f3f4f6",
                }}
              >
                {safeItem.key}
              </code>
            ) : null}
          </div>

          {description ? (
            <div style={{ marginTop: 4, fontSize: 13, color: "#4b5563", lineHeight: "18px" }}>
              {description}
            </div>
          ) : null}
        </div>
      </div>

      <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
        {onEdit ? (
          <button
            type="button"
            onClick={handleEdit}
            disabled={!canInteract || deleting}
            style={{ padding: "6px 10px", borderRadius: 10 }}
          >
            Edit
          </button>
        ) : null}

        {onDelete ? (
          <button
            type="button"
            onClick={handleDelete}
            disabled={!canInteract || deleting}
            style={{ padding: "6px 10px", borderRadius: 10 }}
          >
            {deleting ? "Deleting..." : "Delete"}
          </button>
        ) : null}
      </div>
    </div>
  );
}

export default VportActorMenuItem;
