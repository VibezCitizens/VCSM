import React from "react";

/**
 * GasUnitToggleBar
 *
 * Liter / Gallon toggle for gas station price unit selection.
 * Extracted from VportDashboardGasScreen to keep that screen clean.
 *
 * Layer: Component — presentational only.
 * No hooks, no data fetching, no business logic.
 *
 * @param {string}       value     — current unit key: "liter" | "gallon"
 * @param {function}     onChange  — called with the new unit key
 * @param {boolean}      disabled  — true while a save is in progress
 * @param {string|null}  unitError — optional error message to display
 */

const UNITS = [
  { key: "liter", label: "Liter" },
  { key: "gallon", label: "Gallon" },
];

const WRAP_STYLE = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: "12px 16px",
  borderRadius: 14,
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(255,255,255,0.08)",
};

const LABEL_STYLE = {
  fontSize: 13,
  fontWeight: 600,
  color: "rgba(255,255,255,0.85)",
};

const SUBLABEL_STYLE = {
  fontSize: 11,
  color: "rgba(255,255,255,0.40)",
  marginTop: 2,
};

const ERROR_STYLE = {
  fontSize: 11,
  color: "rgba(239,68,68,0.9)",
  marginTop: 4,
};

export function GasUnitToggleBar({ value, onChange, disabled = false, unitError = null }) {
  return (
    <div style={WRAP_STYLE}>
      <div>
        <div style={LABEL_STYLE}>Price unit</div>
        <div style={SUBLABEL_STYLE}>Applies to all fuel types</div>
        {unitError && <div style={ERROR_STYLE}>{unitError}</div>}
      </div>

      <div
        style={{ display: "flex", gap: 6 }}
        role="group"
        aria-label="Select fuel price unit"
      >
        {UNITS.map(({ key, label }) => {
          const active = value === key;
          return (
            <button
              key={key}
              type="button"
              disabled={disabled || active}
              onClick={() => onChange?.(key)}
              aria-label={`Set price unit to ${label}`}
              aria-pressed={active}
              style={{
                padding: "6px 14px",
                borderRadius: 8,
                fontSize: 12,
                fontWeight: 600,
                border: active
                  ? "1px solid rgba(251,146,60,0.50)"
                  : "1px solid rgba(255,255,255,0.12)",
                background: active
                  ? "rgba(251,146,60,0.18)"
                  : "rgba(255,255,255,0.05)",
                color: active
                  ? "rgba(251,146,60,1)"
                  : "rgba(255,255,255,0.55)",
                cursor: active || disabled ? "default" : "pointer",
                transition: "all 0.15s",
                opacity: disabled ? 0.6 : 1,
              }}
            >
              {label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default GasUnitToggleBar;
