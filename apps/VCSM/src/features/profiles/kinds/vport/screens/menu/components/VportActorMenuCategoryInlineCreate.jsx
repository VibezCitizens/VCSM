// src/features/profiles/kinds/vport/ui/menu/VportActorMenuCategoryInlineCreate.jsx

import React from "react";

export function VportActorMenuCategoryInlineCreate({
  canInteract,
  wrapStyle,
  btnStyle,
  inputStyle,

  name,
  price,
  description,

  setName,
  setPrice,
  setDescription,

  onCancel,
  onSubmit,
} = {}) {
  // User locked input class
  const inputClassName = `
    w-full px-4 py-2 pr-10
    rounded-2xl bg-neutral-900 text-white
    border border-purple-700
    focus:ring-2 focus:ring-purple-500
  `.trim();

  return (
    <div style={wrapStyle}>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <input
          className={inputClassName}
          type="text"
          value={name}
          onChange={(e) => setName?.(e.target.value)}
          placeholder="Item name"
          disabled={!canInteract}
          style={inputStyle}
        />

        <input
          className={inputClassName}
          type="number"
          inputMode="decimal"
          step="0.01"
          min="0"
          value={price}
          onChange={(e) => setPrice?.(e.target.value)}
          placeholder="Price (optional) e.g. 12.99"
          disabled={!canInteract}
          style={inputStyle}
        />

        <textarea
          className={inputClassName}
          value={description}
          onChange={(e) => setDescription?.(e.target.value)}
          placeholder="Description (optional)"
          disabled={!canInteract}
          rows={3}
          style={{ ...inputStyle, resize: "vertical" }}
        />

        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <button
            type="button"
            onClick={onCancel}
            disabled={!canInteract}
            style={{ ...btnStyle, background: "rgba(255,255,255,0.04)" }}
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={onSubmit}
            disabled={!canInteract || !(name ?? "").trim()}
            style={{
              ...btnStyle,
              border: "1px solid rgba(168,85,247,0.35)",
              background: "rgba(168,85,247,0.18)",
              opacity: !canInteract || !(name ?? "").trim() ? 0.6 : 1,
            }}
          >
            Create
          </button>
        </div>
      </div>
    </div>
  );
}

export default VportActorMenuCategoryInlineCreate;
