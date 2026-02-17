// src/features/profiles/kinds/vport/ui/menu/VportActorMenuToolbar.jsx

import React, { useCallback } from "react";

/**
 * UI: Toolbar for Vport Actor Menu management
 *
 * Contract:
 * - Pure UI
 * - No DAL / no Supabase
 *
 * Props:
 * - title?: string
 * - subtitle?: string
 * - loading?: boolean
 * - includeInactive?: boolean
 * - onToggleIncludeInactive?: (nextValue: boolean) => void
 * - onRefresh?: () => void
 * - onAddCategory?: () => void
 * - disabled?: boolean
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
} = {}) {
  const canInteract = !disabled;

  const handleToggle = useCallback(() => {
    if (!onToggleIncludeInactive) return;
    onToggleIncludeInactive(!includeInactive);
  }, [onToggleIncludeInactive, includeInactive]);

  const buttonBase = {
    padding: "8px 12px",
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.12)",
    background: "rgba(255,255,255,0.08)",
    color: "#fff",
    fontSize: 13,
    fontWeight: 600,
    cursor: canInteract && !loading ? "pointer" : "not-allowed",
    opacity: canInteract && !loading ? 1 : 0.6,
  };

  const subtleText = {
    fontSize: 13,
    color: "rgba(255,255,255,0.72)",
    lineHeight: "18px",
  };

  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "space-between",
        gap: 12,
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <div style={{ fontSize: 16, fontWeight: 800, color: "#fff" }}>
          {title}
        </div>
        <div style={subtleText}>{subtitle}</div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        {typeof onToggleIncludeInactive === "function" ? (
          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "8px 10px",
              borderRadius: 12,
              border: "1px solid rgba(255,255,255,0.12)",
              userSelect: "none",
              background: "rgba(255,255,255,0.06)",
              color: "#fff",
              fontSize: 13,
              opacity: canInteract && !loading ? 1 : 0.6,
            }}
          >
            <input
              type="checkbox"
              checked={!!includeInactive}
              onChange={handleToggle}
              disabled={!canInteract || loading}
            />
            <span style={{ fontSize: 13 }}>Include inactive</span>
          </label>
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
