// src/features/profiles/kinds/vport/ui/menu/VportActorMenuConfirmDeleteModal.jsx

import React, { useMemo, useCallback, useEffect, useRef, useState } from "react";
import {
  ACTIONS_STYLE,
  BODY_STYLE,
  CANCEL_BTN_STYLE,
  CLOSE_BTN_STYLE,
  createConfirmBtnStyle,
  DESCRIPTION_STYLE,
  ERROR_STYLE,
  HEADER_STYLE,
  MODAL_STYLE,
  OVERLAY_STYLE,
} from "@/features/profiles/kinds/vport/screens/menu/model/vportActorMenuConfirmDeleteModal.styles";

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
      console.log(`[${debugLabel}]`, ...args);
    },
    [debug, debugLabel]
  );

  const warn = useCallback(
    (...args) => {
      if (!debug) return;
      console.warn(`[${debugLabel}]`, ...args);
    },
    [debug, debugLabel]
  );

  const errLog = useCallback(
    (...args) => {
      if (!debug) return;
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
      style={OVERLAY_STYLE}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) {
          log("overlay click -> close");
          handleClose();
        }
      }}
    >
      <div style={MODAL_STYLE}>
        {/* Header */}
        <div style={HEADER_STYLE}>
          <div style={{ fontSize: 16, fontWeight: 700 }}>{title}</div>

          <button
            type="button"
            onClick={handleClose}
            disabled={loading}
            style={CLOSE_BTN_STYLE}
          >
            Close
          </button>
        </div>

        {/* Body */}
        <div style={BODY_STYLE}>
          <div style={DESCRIPTION_STYLE}>{description}</div>

          {/* ✅ Debug Error UI */}
          {showErrorUI && localError ? (
            <div style={ERROR_STYLE}>
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
          <div style={ACTIONS_STYLE}>
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              style={CANCEL_BTN_STYLE}
            >
              {cancelText}
            </button>

            <button
              type="button"
              onClick={handleConfirm}
              disabled={loading}
              style={createConfirmBtnStyle(danger)}
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
