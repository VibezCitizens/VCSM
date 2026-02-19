// src/features/profiles/kinds/vport/ui/menu/VportActorMenuToolbar.jsx

import React, { useCallback } from "react";

/**
 * UI: Toolbar for Vport Actor Menu management
 *
 * Contract:
 * - Pure UI
 * - No DAL / no Supabase
 */
export function VportActorMenuToolbar({
  title = "Menu",
  subtitle = "Manage categories and items.",
  loading = false,
  includeInactive = false,
  onToggleIncludeInactive,
  onRefresh,
  onAddCategory,
  disabled = false,

  // ✅ NEW: hide title/subtitle area completely
  hideHeader = false,
} = {}) {
  const canInteract = !disabled;

  const handleToggle = useCallback(() => {
    if (!onToggleIncludeInactive) return;
    onToggleIncludeInactive(!includeInactive);
  }, [onToggleIncludeInactive, includeInactive]);

  const buttonBase = {
    padding: "8px 12px",
    borderRadius: 999,
    border: "1px solid rgba(255,255,255,0.12)",
    background: "rgba(255,255,255,0.08)",
    color: "#fff",
    fontSize: 12,
    fontWeight: 800,
    cursor: canInteract && !loading ? "pointer" : "not-allowed",
    opacity: canInteract && !loading ? 1 : 0.6,
    whiteSpace: "nowrap",
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    lineHeight: 1,
  };

  const subtleText = {
    fontSize: 13,
    color: "rgba(255,255,255,0.72)",
    lineHeight: "18px",
  };

  const inactivePill = (active) => ({
    padding: "8px 12px",
    borderRadius: 999,
    border: active
      ? "1px solid rgba(168,85,247,0.38)"
      : "1px solid rgba(255,255,255,0.12)",
    background: active ? "rgba(168,85,247,0.14)" : "rgba(255,255,255,0.08)",
    color: active ? "rgba(216,180,254,0.95)" : "rgba(255,255,255,0.88)",
    fontSize: 12,
    fontWeight: 900,
    cursor: canInteract && !loading ? "pointer" : "not-allowed",
    opacity: canInteract && !loading ? 1 : 0.6,
    whiteSpace: "nowrap",
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    lineHeight: 1,
    userSelect: "none",
  });

  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "space-between",
        gap: 12,
        flexWrap: "wrap",
      }}
    >
      {/* ✅ LEFT HEADER (OPTIONAL) */}
      {!hideHeader ? (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 2,
            minWidth: 0,
            flex: "1 1 240px",
          }}
        >
          <div style={{ fontSize: 16, fontWeight: 900, color: "#fff" }}>
            {title}
          </div>
          <div style={subtleText}>{subtitle}</div>
        </div>
      ) : (
        // spacer to keep right controls aligned when header is hidden
        <div style={{ flex: "1 1 0px" }} />
      )}

      {/* RIGHT CONTROLS */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          flexWrap: "wrap",
          justifyContent: "flex-end",
          flex: "0 1 auto",
          maxWidth: "100%",
        }}
      >
        {typeof onToggleIncludeInactive === "function" ? (
          <button
            type="button"
            onClick={handleToggle}
            disabled={!canInteract || loading}
            aria-pressed={!!includeInactive}
            style={inactivePill(!!includeInactive)}
            title="Toggle inactive menu entries"
          >
            <span
              aria-hidden
              style={{
                width: 6,
                height: 6,
                borderRadius: 999,
                background: includeInactive
                  ? "rgba(168,85,247,1)"
                  : "rgba(255,255,255,0.35)",
              }}
            />
            Inactive
          </button>
        ) : null}

        {onRefresh ? (
          <button
            type="button"
            onClick={onRefresh}
            disabled={!canInteract || loading}
            style={buttonBase}
          >
            {loading ? "Loading..." : "Refresh"}
          </button>
        ) : null}

        {onAddCategory ? (
          <button
            type="button"
            onClick={onAddCategory}
            disabled={!canInteract || loading}
            style={buttonBase}
          >
            Add category
          </button>
        ) : null}
      </div>
    </div>
  );
}

export default VportActorMenuToolbar;
