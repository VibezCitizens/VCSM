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

  // =========================
  // Vibez theme styles (dark)
  // =========================
  const overlayStyle = {
    position: "fixed",
    inset: 0,
    zIndex: 9999, // ✅ FIX: was 60, could be behind bottom nav / other fixed layers
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    background: "rgba(0,0,0,0.65)",
    backdropFilter: "blur(8px)",
    WebkitBackdropFilter: "blur(8px)",
    pointerEvents: "auto", // ✅ ensure overlay receives clicks
  };

  const cardStyle = {
    width: "100%",
    maxWidth: 560,
    borderRadius: 18,
    background: "rgba(12,12,12,0.92)",
    border: "1px solid rgba(255,255,255,0.10)",
    boxShadow: "0 20px 60px rgba(0,0,0,0.55)",
    overflow: "hidden",
    color: "#fff",
  };

  const headerStyle = {
    padding: "14px 16px",
    borderBottom: "1px solid rgba(255,255,255,0.10)",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  };

  const titleStyle = { fontSize: 16, fontWeight: 800, letterSpacing: 0.2 };

  const labelStyle = {
    fontSize: 13,
    fontWeight: 700,
    color: "rgba(255,255,255,0.92)",
  };
  const helperStyle = {
    fontSize: 12,
    color: "rgba(255,255,255,0.55)",
    lineHeight: "16px",
  };

  const fieldBase = {
    padding: "10px 12px",
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.14)",
    background: "rgba(255,255,255,0.06)",
    color: "#fff",
    outline: "none",
  };

  const buttonBase = {
    padding: "8px 12px",
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.14)",
    background: "rgba(255,255,255,0.08)",
    color: "#fff",
    fontWeight: 700,
    cursor: saving ? "not-allowed" : "pointer",
    opacity: saving ? 0.6 : 1,
    whiteSpace: "nowrap",
  };

  const primaryButton = {
    ...buttonBase,
    border: "1px solid rgba(255,255,255,0.18)",
    background: "rgba(255,255,255,0.16)",
  };

  return (
    <div
      className={className}
      role="dialog"
      aria-modal="true"
      style={overlayStyle}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
    >
      <div style={cardStyle}>
        {/* Header */}
        <div style={headerStyle}>
          <div style={titleStyle}>{modalTitle}</div>

          <button
            type="button"
            onClick={handleClose}
            disabled={saving}
            style={buttonBase}
          >
            Close
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: 16 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {/* Key */}
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <label style={labelStyle}>Key (optional)</label>
              <input
                type="text"
                value={keyValue}
                onChange={(e) => setKeyValue(e.target.value)}
                placeholder="e.g. drinks, starters, desserts"
                disabled={saving || disableKey}
                style={fieldBase}
              />
              <div style={helperStyle}>
                Used for stable identifiers. You can leave this blank.
              </div>
            </div>

            {/* Name */}
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <label style={labelStyle}>
                Name <span style={{ color: "#fb7185" }}>*</span>
              </label>
              <input
                type="text"
                value={nameValue}
                onChange={(e) => setNameValue(e.target.value)}
                placeholder="Category name"
                disabled={saving}
                style={fieldBase}
              />
            </div>

            {/* Description */}
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <label style={labelStyle}>Description (optional)</label>
              <textarea
                value={descriptionValue}
                onChange={(e) => setDescriptionValue(e.target.value)}
                placeholder="Short description shown under the category"
                disabled={saving}
                rows={3}
                style={{ ...fieldBase, resize: "vertical" }}
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
                <label style={labelStyle}>Sort order</label>
                <input
                  type="number"
                  value={sortOrderValue}
                  onChange={(e) => setSortOrderValue(e.target.value)}
                  disabled={saving}
                  style={fieldBase}
                />
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <label style={labelStyle}>Status</label>

                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "10px 12px",
                    borderRadius: 12,
                    border: "1px solid rgba(255,255,255,0.14)",
                    background: "rgba(255,255,255,0.05)",
                    userSelect: "none",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={!!isActiveValue}
                    onChange={(e) => setIsActiveValue(e.target.checked)}
                    disabled={saving}
                    style={{
                      appearance: "auto",
                      WebkitAppearance: "checkbox",
                      width: 16,
                      height: 16,
                      margin: 0,
                      accentColor: "#a78bfa",
                    }}
                  />
                  <span style={{ fontSize: 13, color: "rgba(255,255,255,0.88)" }}>
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
                  background: "rgba(239,68,68,0.12)",
                  color: "#fecaca",
                  fontSize: 13,
                  border: "1px solid rgba(239,68,68,0.30)",
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
                style={buttonBase}
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={!canSubmit}
                style={{
                  ...primaryButton,
                  opacity: !canSubmit ? 0.5 : primaryButton.opacity,
                  cursor: !canSubmit ? "not-allowed" : primaryButton.cursor,
                }}
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
