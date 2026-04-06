// src/features/profiles/kinds/vport/ui/menu/VportActorMenuItemFormPhotoField.jsx

import React from "react";
import {
  labelStyle,
  helperStyle,
  imageCard,
  imageRow,
  imagePreview,
  tinyBtnBase,
  tinyBtnDanger,
} from "./VportActorMenuItemForm.styles";

export function VportActorMenuItemFormPhotoField({
  imagePreviewUrl,
  imageUrlValue,
  uploadingImage = false,
  disabled = false,
  onPickImage,
  onClearImage,
} = {}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <label style={labelStyle}>Photo (optional)</label>

      <div style={imageCard}>
        <div style={imageRow}>
          <div style={imagePreview}>
            {imagePreviewUrl ? (
              <img
                src={imagePreviewUrl}
                alt=""
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                }}
              />
            ) : (
              <span>No photo</span>
            )}
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 6,
              minWidth: 220,
              flex: "1 1 240px",
            }}
          >
            <div
              style={{
                fontSize: 13,
                fontWeight: 800,
                color: "rgba(255,255,255,0.92)",
              }}
            >
              Item photo
            </div>
            <div style={helperStyle}>
              Uploads to Cloudflare R2 and saves the URL on the item.
            </div>

            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <label
                style={{
                  ...tinyBtnBase,
                  cursor: disabled ? "not-allowed" : "pointer",
                  opacity: disabled ? 0.6 : 1,
                }}
              >
                Choose image
                <input
                  type="file"
                  accept="image/*"
                  onChange={onPickImage}
                  disabled={disabled}
                  style={{ display: "none" }}
                />
              </label>

              {imagePreviewUrl ? (
                <button
                  type="button"
                  onClick={onClearImage}
                  disabled={disabled}
                  style={{
                    ...tinyBtnDanger,
                    cursor: disabled ? "not-allowed" : "pointer",
                    opacity: disabled ? 0.6 : 1,
                  }}
                >
                  Remove
                </button>
              ) : null}
            </div>

            {uploadingImage ? (
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.70)" }}>
                Uploading image...
              </div>
            ) : null}
          </div>
        </div>

        {imageUrlValue ? (
          <div
            style={{
              fontSize: 12,
              color: "rgba(255,255,255,0.55)",
              wordBreak: "break-all",
            }}
          >
            {imageUrlValue}
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default VportActorMenuItemFormPhotoField;
