// src/features/profiles/kinds/vport/ui/menu/VportActorMenuConfirmDeleteModal.jsx

import React, { useMemo, useCallback } from "react";

/**
 * UI Modal: Confirm delete (category or item)
 *
 * Contract:
 * - Pure UI
 * - No DAL / no Supabase
 * - Calls `onConfirm()` and `onClose()`
 *
 * Props:
 * - open: boolean
 * - title: string (optional)
 * - description: string (optional)
 * - confirmLabel: string (optional)
 * - cancelLabel: string (optional)
 * - loading: boolean
 * - danger: boolean
 * - onConfirm: async () => Promise<any>
 * - onClose: () => void
 */
export function VportActorMenuConfirmDeleteModal({
  open = false,
  title = "Delete",
  description = "Are you sure you want to delete this? This action cannot be undone.",
  confirmLabel = "Delete",
  cancelLabel = "Cancel",
  loading = false,
  danger = true,
  onConfirm,
  onClose,
  className = "",
} = {}) {
  const confirmText = useMemo(() => confirmLabel ?? "Delete", [confirmLabel]);
  const cancelText = useMemo(() => cancelLabel ?? "Cancel", [cancelLabel]);

  const handleClose = useCallback(() => {
    if (loading) return;
    if (onClose) onClose();
  }, [loading, onClose]);

  const handleConfirm = useCallback(async () => {
    if (!onConfirm) return;
    await onConfirm();
  }, [onConfirm]);

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
          maxWidth: 520,
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
          <div style={{ fontSize: 16, fontWeight: 700 }}>{title}</div>

          <button
            type="button"
            onClick={handleClose}
            disabled={loading}
            style={{
              padding: "6px 10px",
              borderRadius: 10,
            }}
          >
            Close
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: 16 }}>
          <div style={{ fontSize: 13, color: "#374151", lineHeight: "18px" }}>
            {description}
          </div>

          {/* Actions */}
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              gap: 10,
              paddingTop: 16,
            }}
          >
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              style={{ padding: "8px 12px", borderRadius: 12 }}
            >
              {cancelText}
            </button>

            <button
              type="button"
              onClick={handleConfirm}
              disabled={loading}
              style={{
                padding: "8px 12px",
                borderRadius: 12,
                border: danger ? "1px solid #fecaca" : "1px solid #e5e7eb",
                background: danger ? "#fef2f2" : "#fff",
              }}
            >
              {loading ? "Deleting..." : confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default VportActorMenuConfirmDeleteModal;
