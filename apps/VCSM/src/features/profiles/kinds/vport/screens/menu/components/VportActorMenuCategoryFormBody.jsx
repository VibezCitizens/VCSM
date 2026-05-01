import {
  labelStyle,
  helperStyle,
  fieldBase,
  getButtonBase,
  getPrimaryButton,
} from "@/features/profiles/kinds/vport/screens/menu/components/vportActorMenuCategoryForm.styles";

export function VportActorMenuCategoryFormBody({
  keyValue,
  setKeyValue,
  nameValue,
  setNameValue,
  descriptionValue,
  setDescriptionValue,
  sortOrderValue,
  setSortOrderValue,
  isActiveValue,
  setIsActiveValue,
  saving,
  disableKey,
  canSubmit,
  effectiveMode,
  error,
  handleClose,
}) {
  const buttonBase = getButtonBase(saving);
  const primaryButton = getPrimaryButton(saving);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
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
        <div style={helperStyle}>Used for stable identifiers. You can leave this blank.</div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <label style={labelStyle}>Name <span style={{ color: "#fb7185" }}>*</span></label>
        <input
          type="text"
          value={nameValue}
          onChange={(e) => setNameValue(e.target.value)}
          placeholder="Category name"
          disabled={saving}
          style={fieldBase}
        />
      </div>

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

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
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
          <label style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 12, border: "1px solid rgba(148,163,184,0.28)", background: "rgba(8,13,30,0.96)", userSelect: "none" }}>
            <input
              type="checkbox"
              checked={!!isActiveValue}
              onChange={(e) => setIsActiveValue(e.target.checked)}
              disabled={saving}
              style={{ appearance: "auto", WebkitAppearance: "checkbox", width: 16, height: 16, margin: 0, accentColor: "#a78bfa" }}
            />
            <span style={{ fontSize: 13, color: "rgba(255,255,255,0.88)" }}>
              Active (visible to customers)
            </span>
          </label>
        </div>
      </div>

      {error ? (
        <div style={{ padding: 12, borderRadius: 12, background: "rgba(239,68,68,0.12)", color: "#fecaca", fontSize: 13, border: "1px solid rgba(239,68,68,0.30)" }}>
          {error?.message ?? "Something went wrong"}
        </div>
      ) : null}

      <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, paddingTop: 4 }}>
        <button type="button" onClick={handleClose} disabled={saving} style={buttonBase}>
          Cancel
        </button>
        <button
          type="submit"
          disabled={!canSubmit}
          style={{ ...primaryButton, opacity: !canSubmit ? 0.5 : primaryButton.opacity, cursor: !canSubmit ? "not-allowed" : primaryButton.cursor }}
        >
          {saving
            ? effectiveMode === "edit" ? "Saving..." : "Creating..."
            : effectiveMode === "edit" ? "Save" : "Create"}
        </button>
      </div>
    </div>
  );
}
