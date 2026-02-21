// src/features/profiles/kinds/vport/ui/menu/VportActorMenuConfirmDeleteModal.jsx

import React, { useMemo, useCallback, useEffect, useRef, useState } from "react";

/**
 * UI Modal: Confirm delete (category or item)
 *
 * Contract:
 * - Pure UI
 * - No DAL / no Supabase
 * - Calls `onConfirm()` and `onClose()`
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

  // ✅ Debug controls (optional)
  debug = true,          // set false to silence logs
  debugLabel = "ConfirmDeleteModal", // label prefix in console
  showErrorUI = true,    // show error message in modal body
} = {}) {
  const confirmText = useMemo(() => confirmLabel ?? "Delete", [confirmLabel]);
  const cancelText = useMemo(() => cancelLabel ?? "Cancel", [cancelLabel]);

  const [localError, setLocalError] = useState(null);

  const openRef = useRef(open);
  const confirmClicksRef = useRef(0);

  const log = useCallback(
    (...args) => {
      if (!debug) return;
      // eslint-disable-next-line no-console
      console.log(`[${debugLabel}]`, ...args);
    },
    [debug, debugLabel]
  );

  const warn = useCallback(
    (...args) => {
      if (!debug) return;
      // eslint-disable-next-line no-console
      console.warn(`[${debugLabel}]`, ...args);
    },
    [debug, debugLabel]
  );

  const errLog = useCallback(
    (...args) => {
      if (!debug) return;
      // eslint-disable-next-line no-console
      console.error(`[${debugLabel}]`, ...args);
    },
    [debug, debugLabel]
  );

  useEffect(() => {
    // Only react to transitions
    if (openRef.current === open) return;
    openRef.current = open;

    setLocalError(null);

    if (open) {
      log("opened", { title, danger, loading, hasOnConfirm: !!onConfirm, hasOnClose: !!onClose });
    } else {
      log("closed");
    }
  }, [open, title, danger, loading, onConfirm, onClose, log]);

  const handleClose = useCallback(() => {
    if (loading) {
      log("close ignored (loading=true)");
      return;
    }
    log("close clicked");
    if (onClose) onClose();
  }, [loading, onClose, log]);

  const handleConfirm = useCallback(async () => {
    confirmClicksRef.current += 1;
    const clickNo = confirmClicksRef.current;

    if (loading) {
      log("confirm ignored (loading=true)", { clickNo });
      return;
    }

    if (!onConfirm) {
      warn("confirm clicked but onConfirm is missing", { clickNo });
      return;
    }

    setLocalError(null);

    log("confirm clicked", { clickNo });

    try {
      const result = await onConfirm();

      // Log return value (some handlers return {data,error}, etc.)
      log("onConfirm resolved", { clickNo, result });

      return result;
    } catch (e) {
      // Supabase errors often look like: { message, code, details, hint }
      const normalized = {
        name: e?.name,
        message: e?.message,
        code: e?.code,
        details: e?.details,
        hint: e?.hint,
        stack: e?.stack,
        raw: e,
      };

      errLog("onConfirm rejected", { clickNo, error: normalized });

      // Surface in UI if requested
      setLocalError(e);

      // Re-throw so parent can still handle if it wants
      throw e;
    }
  }, [onConfirm, loading, log, warn, errLog]);

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
        if (e.target === e.currentTarget) {
          log("overlay click -> close");
          handleClose();
        }
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

          {/* ✅ Debug Error UI */}
          {showErrorUI && localError ? (
            <div
              style={{
                marginTop: 12,
                padding: 12,
                borderRadius: 12,
                background: "#fef2f2",
                border: "1px solid #fecaca",
                color: "#991b1b",
                fontSize: 12,
                lineHeight: "16px",
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
              }}
            >
              <div style={{ fontWeight: 700, marginBottom: 6 }}>Delete failed</div>
              <div>
                {localError?.message ?? String(localError)}
                {localError?.code ? `\ncode: ${localError.code}` : ""}
                {localError?.details ? `\ndetails: ${localError.details}` : ""}
                {localError?.hint ? `\nhint: ${localError.hint}` : ""}
              </div>
            </div>
          ) : null}

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
