// src/features/profiles/kinds/vport/ui/menu/VportActorMenuCategoryFormModal.jsx

import React, { useEffect, useMemo, useState, useCallback } from "react";

export function VportActorMenuCategoryFormModal({
  open = false,
  mode = null,
  category = null,
  onSave,
  onClose,

  saving = false,
  titleOverride = null,

  // optional UI
  disableKey = false,
  className = "",
} = {}) {
  const effectiveMode = useMemo(() => {
    if (mode) return mode;
    return category?.id ? "edit" : "create";
  }, [mode, category]);

  const [keyValue, setKeyValue] = useState("");
  const [nameValue, setNameValue] = useState("");
  const [descriptionValue, setDescriptionValue] = useState("");
  const [sortOrderValue, setSortOrderValue] = useState(0);
  const [isActiveValue, setIsActiveValue] = useState(true);

  const [error, setError] = useState(null);

  useEffect(() => {
    if (!open) return;

    setError(null);

    setKeyValue(category?.key ?? "");
    setNameValue(category?.name ?? "");
    setDescriptionValue(category?.description ?? "");
    setSortOrderValue(
      typeof category?.sortOrder === "number" ? category.sortOrder : 0
    );
    setIsActiveValue(category?.isActive ?? true);
  }, [open, category]);

  const canSubmit = useMemo(() => {
    return !!(nameValue ?? "").trim() && !saving;
  }, [nameValue, saving]);

  const modalTitle = useMemo(() => {
    if (titleOverride) return titleOverride;
    return effectiveMode === "edit" ? "Edit category" : "New category";
  }, [titleOverride, effectiveMode]);

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
        categoryId: category?.id ?? null,
        key: (keyValue ?? "").trim() || null,
        name: (nameValue ?? "").trim(),
        description: (descriptionValue ?? "").trim() || null,
        sortOrder: Number.isFinite(Number(sortOrderValue))
          ? Number(sortOrderValue)
          : 0,
        isActive: !!isActiveValue,
      };

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
      category,
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
        zIndex: 50,
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
          maxWidth: 560,
          borderRadius: 16,
          background: "#fff",
          boxShadow: "0 20px 60px rgba(0,0,0,0.15)",
          overflow: "hidden",
        }}
      >
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

        <form onSubmit={handleSubmit} style={{ padding: 16 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <label style={{ fontSize: 13, fontWeight: 600 }}>
                Key (optional)
              </label>
              <input
                type="text"
                value={keyValue}
                onChange={(e) => setKeyValue(e.target.value)}
                placeholder="e.g. drinks, starters, desserts"
                disabled={saving || disableKey}
                style={{
                  padding: "10px 12px",
                  borderRadius: 12,
                  border: "1px solid #e5e7eb",
                }}
              />
              <div style={{ fontSize: 12, color: "#6b7280" }}>
                Used for stable identifiers. You can leave this blank.
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <label style={{ fontSize: 13, fontWeight: 600 }}>
                Name <span style={{ color: "#ef4444" }}>*</span>
              </label>
              <input
                type="text"
                value={nameValue}
                onChange={(e) => setNameValue(e.target.value)}
                placeholder="Category name"
                disabled={saving}
                style={{
                  padding: "10px 12px",
                  borderRadius: 12,
                  border: "1px solid #e5e7eb",
                }}
              />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <label style={{ fontSize: 13, fontWeight: 600 }}>
                Description (optional)
              </label>
              <textarea
                value={descriptionValue}
                onChange={(e) => setDescriptionValue(e.target.value)}
                placeholder="Short description shown under the category"
                disabled={saving}
                rows={3}
                style={{
                  padding: "10px 12px",
                  borderRadius: 12,
                  border: "1px solid #e5e7eb",
                }}
              />
            </div>

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
                    // ✅ force visibility even if global CSS resets checkbox styling
                    style={{
                      appearance: "auto",
                      WebkitAppearance: "checkbox",
                      width: 16,
                      height: 16,
                      margin: 0,
                      accentColor: "#111827",
                    }}
                  />
                  <span style={{ fontSize: 13 }}>
                    Active (visible to customers)
                  </span>
                </label>
              </div>
            </div>

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

export default VportActorMenuCategoryFormModal;
