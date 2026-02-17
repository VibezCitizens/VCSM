// src/features/profiles/kinds/vport/ui/menu/VportActorMenuItem.jsx

import React, { useMemo, useCallback } from "react";

/**
 * UI: Render a single Vport Actor Menu Item row/card
 *
 * Domain shape expected (from VportActorMenuItemModel):
 * {
 *   id,
 *   actorId,
 *   categoryId,
 *   key,
 *   name,
 *   description,
 *   sortOrder,
 *   isActive,
 *   createdAt,
 *   updatedAt
 * }
 *
 * Contract:
 * - Pure UI
 * - No DAL / no Supabase
 * - Delegates actions via callbacks
 *
 * Props:
 * - item: item domain object
 * - onEdit: (item) => void
 * - onDelete: ({ itemId }) => Promise<void> | void
 * - disabled: boolean
 * - deleting: boolean
 * - className: string
 */
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
  const description = useMemo(
    () => safeItem?.description ?? null,
    [safeItem]
  );

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
