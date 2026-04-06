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
        borderRadius: 16,
        padding: 16,
        border: "1px solid rgba(255,255,255,0.10)",
        background:
          "linear-gradient(180deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.03) 100%)",
        boxShadow: "0 12px 30px rgba(0,0,0,0.35)",
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 16, fontWeight: 800, color: "#fff", lineHeight: "20px" }}>
            {title}
          </div>

          <div
            style={{
              marginTop: 6,
              fontSize: 13,
              color: "rgba(255,255,255,0.70)",
              lineHeight: "18px",
              maxWidth: 520,
            }}
          >
            {subtitle}
          </div>

          {/* subtle helper line like your other tabs */}
          <div style={{ marginTop: 10, fontSize: 12, color: "rgba(255,255,255,0.45)" }}>
            Customers will only see active entries.
          </div>
        </div>

        {/* small icon chip to break up whitespace */}
        <div
          aria-hidden="true"
          style={{
            flexShrink: 0,
            width: 38,
            height: 38,
            borderRadius: 14,
            border: "1px solid rgba(255,255,255,0.10)",
            background: "rgba(255,255,255,0.06)",
            display: "grid",
            placeItems: "center",
            color: "rgba(255,255,255,0.75)",
            fontSize: 18,
          }}
          title=""
        >
          🍽️
        </div>
      </div>

      {onAction ? (
        <div style={{ marginTop: 14 }}>
          <button
            type="button"
            onClick={onAction}
            disabled={disabled}
            style={{
              padding: "10px 12px",
              borderRadius: 12,
              border: "1px solid rgba(255,255,255,0.14)",
              background: "rgba(255,255,255,0.08)",
              color: "#fff",
              fontSize: 13,
              fontWeight: 700,
              cursor: disabled ? "not-allowed" : "pointer",
              opacity: disabled ? 0.6 : 1,
              whiteSpace: "nowrap",
            }}
          >
            {actionLabel}
          </button>
        </div>
      ) : null}
    </div>
  );
}

export default VportActorMenuEmptyState;
