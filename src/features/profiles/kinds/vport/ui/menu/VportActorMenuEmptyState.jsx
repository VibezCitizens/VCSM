// src/features/profiles/kinds/vport/ui/menu/VportActorMenuEmptyState.jsx

import React from "react";

/**
 * UI: Empty state for Vport Actor Menu
 *
 * Contract:
 * - Pure UI
 * - No DAL / no Supabase
 *
 * Props:
 * - title?: string
 * - subtitle?: string
 * - actionLabel?: string
 * - onAction?: () => void
 * - disabled?: boolean
 * - className?: string
 */
export function VportActorMenuEmptyState({
  title = "No menu yet",
  subtitle = "Create your first category to start building your menu.",
  actionLabel = "Add category",
  onAction,
  disabled = false,
  className = "",
} = {}) {
  return (
    <div
      className={className}
      style={{
        border: "1px dashed #d1d5db",
        borderRadius: 16,
        padding: 16,
        background: "#fafafa",
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <div style={{ fontSize: 16, fontWeight: 700 }}>{title}</div>

        <div style={{ fontSize: 13, color: "#6b7280", lineHeight: "18px" }}>
          {subtitle}
        </div>

        {onAction ? (
          <div style={{ paddingTop: 6 }}>
            <button
              type="button"
              onClick={onAction}
              disabled={disabled}
              style={{
                padding: "8px 12px",
                borderRadius: 12,
              }}
            >
              {actionLabel}
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default VportActorMenuEmptyState;
