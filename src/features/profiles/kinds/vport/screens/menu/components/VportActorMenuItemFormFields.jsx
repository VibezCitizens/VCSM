// src/features/profiles/kinds/vport/ui/menu/VportActorMenuItemFormFields.jsx

import React from "react";
import {
  labelStyle,
  helperStyle,
  fieldBase,
  fieldBaseDisabled,
  row2,
  selectChevronStyle,
} from "./VportActorMenuItemForm.styles";
import VportActorMenuItemFormPhotoField from "./VportActorMenuItemFormPhotoField";

export function VportActorMenuItemFormFields({
  // data
  safeCategories = [],
  lockCategory = false,
  disableKey = false,

  categoryIdValue,
  keyValue,
  nameValue,
  priceValue,
  descriptionValue,
  sortOrderValue,
  isActiveValue,

  imagePreviewUrl,
  imageUrlValue,

  // setters
  onChangeCategoryId,
  onChangeKey,
  onChangeName,
  onChangePrice,
  onChangeDescription,
  onChangeSortOrder,
  onChangeIsActive,

  // photo handlers
  onPickImage,
  onClearImage,

  // ui state
  uploadingImage = false,
  disabled = false,
} = {}) {
  const lockOrDisabled = disabled || lockCategory;

  return (
    <>
      {/* Category */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <label style={labelStyle}>
          Category <span style={{ color: "#fb7185" }}>*</span>
        </label>

        <select
          value={categoryIdValue}
          onChange={onChangeCategoryId}
          disabled={lockOrDisabled}
          style={{
            ...fieldBase,
            ...selectChevronStyle,
            ...(lockOrDisabled ? fieldBaseDisabled : null),
          }}
        >
          <option value="" disabled>
            Select a category
          </option>
          {safeCategories.map((c) => (
            <option key={c?.id ?? Math.random()} value={c?.id ?? ""}>
              {c?.name ?? c?.id ?? "Category"}
            </option>
          ))}
        </select>

        {lockCategory ? (
          <div style={helperStyle}>
            Category locked for quick add. Edit the item later to move it.
          </div>
        ) : null}
      </div>

      {/* Key */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <label style={labelStyle}>Key (optional)</label>
        <input
          type="text"
          value={keyValue}
          onChange={onChangeKey}
          placeholder="e.g. coca_cola, margherita_pizza"
          disabled={disabled || disableKey}
          style={{
            ...fieldBase,
            ...(disabled || disableKey ? fieldBaseDisabled : null),
          }}
        />
        <div style={helperStyle}>
          Use a stable identifier if you want. You can leave this blank.
        </div>
      </div>

      {/* Name */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <label style={labelStyle}>
          Name <span style={{ color: "#fb7185" }}>*</span>
        </label>
        <input
          type="text"
          value={nameValue}
          onChange={onChangeName}
          placeholder="Item name"
          disabled={disabled}
          style={{
            ...fieldBase,
            ...(disabled ? fieldBaseDisabled : null),
          }}
        />
      </div>

      {/* Photo */}
      <VportActorMenuItemFormPhotoField
        imagePreviewUrl={imagePreviewUrl}
        imageUrlValue={imageUrlValue}
        uploadingImage={uploadingImage}
        disabled={disabled}
        onPickImage={onPickImage}
        onClearImage={onClearImage}
      />

      {/* Price */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <label style={labelStyle}>Price (optional)</label>
        <input
          type="number"
          inputMode="decimal"
          step="0.01"
          min="0"
          value={priceValue}
          onChange={onChangePrice}
          placeholder="e.g. 12.99"
          disabled={disabled}
          style={{
            ...fieldBase,
            ...(disabled ? fieldBaseDisabled : null),
          }}
        />
        <div style={helperStyle}>Shown to customers as $X.XX.</div>
      </div>

      {/* Description */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <label style={labelStyle}>Description (optional)</label>
        <textarea
          value={descriptionValue}
          onChange={onChangeDescription}
          placeholder="Short description shown under the item"
          disabled={disabled}
          rows={4}
          style={{
            ...fieldBase,
            minHeight: 110,
            resize: "vertical",
            ...(disabled ? fieldBaseDisabled : null),
          }}
        />
      </div>

      {/* Sort + Active */}
      <div style={row2}>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <label style={labelStyle}>Sort order</label>
          <input
            type="number"
            value={sortOrderValue}
            onChange={onChangeSortOrder}
            disabled={disabled}
            style={{
              ...fieldBase,
              ...(disabled ? fieldBaseDisabled : null),
            }}
          />
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <label style={labelStyle}>Status</label>

          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "11px 12px",
              borderRadius: 14,
              border: "1px solid rgba(255,255,255,0.10)",
              background: "rgba(255,255,255,0.06)",
              userSelect: "none",
              cursor: disabled ? "not-allowed" : "pointer",
              opacity: disabled ? 0.7 : 1,
              minHeight: 44,
            }}
          >
            <input
              type="checkbox"
              checked={!!isActiveValue}
              onChange={onChangeIsActive}
              disabled={disabled}
              style={{
                appearance: "auto",
                WebkitAppearance: "checkbox",
                width: 16,
                height: 16,
                margin: 0,
                accentColor: "#a855f7",
              }}
            />
            <span style={{ fontSize: 13, color: "rgba(255,255,255,0.88)" }}>
              Active (visible to customers)
            </span>
          </label>
        </div>
      </div>
    </>
  );
}

export default VportActorMenuItemFormFields;
