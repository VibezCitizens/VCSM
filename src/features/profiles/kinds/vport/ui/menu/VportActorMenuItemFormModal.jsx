// src/features/profiles/kinds/vport/ui/menu/VportActorMenuItemFormModal.jsx

import React, { useEffect, useMemo, useState, useCallback } from "react";

/**
 * UI Modal: Create / Edit a Vport Actor Menu Item
 *
 * Contract:
 * - Pure UI + form state
 * - No DAL / no Supabase
 * - Calls `onSave(payload)` and `onClose()`
 *
 * Expected item shape (domain):
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
 * Props:
 * - open: boolean
 * - mode: "create" | "edit" (optional; inferred from item?.id)
 * - item: item object (optional)
 * - categories: Array<{ id, name }> for category select (required for create/edit)
 * - onSave: async function(payload) -> Promise<any>
 * - onClose: function()
 * - saving: boolean
 * - titleOverride: string (optional)
 */
export function VportActorMenuItemFormModal({
  open = false,
  mode = null,
  item = null,
  categories = [],
  onSave,
  onClose,

  saving = false,
  titleOverride = null,

  // optional UI
  disableKey = false,
  lockCategory = false, // if true, category cannot be changed (useful when creating from category)
  className = "",
} = {}) {
  const effectiveMode = useMemo(() => {
    if (mode) return mode;
    return item?.id ? "edit" : "create";
  }, [mode, item]);

  const safeCategories = useMemo(
    () => (Array.isArray(categories) ? categories : []),
    [categories]
  );

  const [categoryIdValue, setCategoryIdValue] = useState("");
  const [keyValue, setKeyValue] = useState("");
  const [nameValue, setNameValue] = useState("");
  const [descriptionValue, setDescriptionValue] = useState("");
  const [sortOrderValue, setSortOrderValue] = useState(0);
  const [isActiveValue, setIsActiveValue] = useState(true);

  const [error, setError] = useState(null);

  useEffect(() => {
    if (!open) return;

    setError(null);

    setCategoryIdValue(item?.categoryId ?? safeCategories?.[0]?.id ?? "");
    setKeyValue(item?.key ?? "");
    setNameValue(item?.name ?? "");
    setDescriptionValue(item?.description ?? "");
    setSortOrderValue(typeof item?.sortOrder === "number" ? item.sortOrder : 0);
    setIsActiveValue(item?.isActive ?? true);
  }, [open, item, safeCategories]);

  const modalTitle = useMemo(() => {
    if (titleOverride) return titleOverride;
    return effectiveMode === "edit" ? "Edit item" : "New item";
  }, [titleOverride, effectiveMode]);

  const canSubmit = useMemo(() => {
    return (
      !!(nameValue ?? "").trim() &&
      !!(categoryIdValue ?? "").trim() &&
      !saving
    );
  }, [nameValue, categoryIdValue, saving]);

  const handleClose = useCallback(() => {
    if (saving) return;
    if (onClose) onClose();
  }, [saving, onClose]);

  const handleSubmit = useCallback(
    async (e) => {
      e?.preventDefault?.();
      if (!onSave) return;

      setError(null);

      const payload = {
        itemId: item?.id ?? null,
        categoryId: (categoryIdValue ?? "").trim(),
        key: (keyValue ?? "").trim() || null,
        name: (nameValue ?? "").trim(),
        description: (descriptionValue ?? "").trim() || null,
        sortOrder: Number.isFinite(Number(sortOrderValue))
          ? Number(sortOrderValue)
          : 0,
        isActive: !!isActiveValue,
      };

      if (!payload.categoryId) {
        setError(new Error("Category is required"));
        return;
      }

      if (!payload.name) {
        setError(new Error("Name is required"));
        return;
      }

      try {
        await onSave(payload);
        handleClose();
      } catch (err) {
        setError(err);
      }
    },
    [
      onSave,
      item,
      categoryIdValue,
      keyValue,
      nameValue,
      descriptionValue,
      sortOrderValue,
      isActiveValue,
      handleClose,
    ]
  );

  if (!open) return null;

  return (
    <div
      className={className}
      role="dialog"
      aria-modal="true"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 60,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
        background: "rgba(0,0,0,0.35)",
      }}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 640,
          borderRadius: 16,
          background: "#fff",
          boxShadow: "0 20px 60px rgba(0,0,0,0.15)",
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "14px 16px",
            borderBottom: "1px solid #e5e7eb",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
          }}
        >
          <div style={{ fontSize: 16, fontWeight: 700 }}>{modalTitle}</div>

          <button
            type="button"
            onClick={handleClose}
            disabled={saving}
            style={{ padding: "6px 10px", borderRadius: 10 }}
          >
            Close
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} style={{ padding: 16 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {/* Category */}
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <label style={{ fontSize: 13, fontWeight: 600 }}>
                Category <span style={{ color: "#ef4444" }}>*</span>
              </label>

              <select
                value={categoryIdValue}
                onChange={(e) => setCategoryIdValue(e.target.value)}
                disabled={saving || lockCategory}
                style={{
                  padding: "10px 12px",
                  borderRadius: 12,
                  border: "1px solid #e5e7eb",
                  background: "#fff",
                }}
              >
                <option value="" disabled>
                  Select a category
                </option>
                {safeCategories.map((c) => (
                  <option key={c?.id ?? Math.random()} value={c?.id ?? ""}>
                    {c?.name ?? c?.id ?? "Category"}
                  </option>
                ))}
              </select>
            </div>

            {/* Key */}
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <label style={{ fontSize: 13, fontWeight: 600 }}>
                Key (optional)
              </label>
              <input
                type="text"
                value={keyValue}
                onChange={(e) => setKeyValue(e.target.value)}
                placeholder="e.g. coca_cola, margherita_pizza"
                disabled={saving || disableKey}
                style={{
                  padding: "10px 12px",
                  borderRadius: 12,
                  border: "1px solid #e5e7eb",
                }}
              />
            </div>

            {/* Name */}
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <label style={{ fontSize: 13, fontWeight: 600 }}>
                Name <span style={{ color: "#ef4444" }}>*</span>
              </label>
              <input
                type="text"
                value={nameValue}
                onChange={(e) => setNameValue(e.target.value)}
                placeholder="Item name"
                disabled={saving}
                style={{
                  padding: "10px 12px",
                  borderRadius: 12,
                  border: "1px solid #e5e7eb",
                }}
              />
            </div>

            {/* Description */}
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <label style={{ fontSize: 13, fontWeight: 600 }}>
                Description (optional)
              </label>
              <textarea
                value={descriptionValue}
                onChange={(e) => setDescriptionValue(e.target.value)}
                placeholder="Short description shown under the item"
                disabled={saving}
                rows={4}
                style={{
                  padding: "10px 12px",
                  borderRadius: 12,
                  border: "1px solid #e5e7eb",
                }}
              />
            </div>

            {/* Sort + Active */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 12,
              }}
            >
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={{ fontSize: 13, fontWeight: 600 }}>
                  Sort order
                </label>
                <input
                  type="number"
                  value={sortOrderValue}
                  onChange={(e) => setSortOrderValue(e.target.value)}
                  disabled={saving}
                  style={{
                    padding: "10px 12px",
                    borderRadius: 12,
                    border: "1px solid #e5e7eb",
                  }}
                />
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <label style={{ fontSize: 13, fontWeight: 600 }}>Status</label>
                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "10px 12px",
                    borderRadius: 12,
                    border: "1px solid #e5e7eb",
                    userSelect: "none",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={!!isActiveValue}
                    onChange={(e) => setIsActiveValue(e.target.checked)}
                    disabled={saving}
                  />
                  <span style={{ fontSize: 13 }}>
                    Active (visible to customers)
                  </span>
                </label>
              </div>
            </div>

            {/* Error */}
            {error ? (
              <div
                style={{
                  padding: 12,
                  borderRadius: 12,
                  background: "#fef2f2",
                  color: "#991b1b",
                  fontSize: 13,
                  border: "1px solid #fecaca",
                }}
              >
                {error?.message ?? "Something went wrong"}
              </div>
            ) : null}

            {/* Actions */}
            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: 10,
                paddingTop: 4,
              }}
            >
              <button
                type="button"
                onClick={handleClose}
                disabled={saving}
                style={{ padding: "8px 12px", borderRadius: 12 }}
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={!canSubmit}
                style={{ padding: "8px 12px", borderRadius: 12 }}
              >
                {saving
                  ? effectiveMode === "edit"
                    ? "Saving..."
                    : "Creating..."
                  : effectiveMode === "edit"
                  ? "Save"
                  : "Create"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

export default VportActorMenuItemFormModal;
