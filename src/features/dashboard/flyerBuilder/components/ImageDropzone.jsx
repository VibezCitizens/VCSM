import React, { useRef, useCallback } from "react";

export default function ImageDropzone({
  label,
  value,
  onPickFile,
  onClear,
  height = 130,
} = {}) {
  const inputRef = useRef(null);
  const hasImage = Boolean(String(value || "").trim());

  const open = useCallback(() => {
    inputRef.current?.click();
  }, []);

  return (
    <div style={{ display: "grid", gap: 10 }}>
      <div
        style={{
          fontSize: 11,
          fontWeight: 900,
          letterSpacing: 1,
          textTransform: "uppercase",
          color: "rgba(255,255,255,0.72)",
        }}
      >
        {label}
      </div>

      <div
        role="button"
        tabIndex={0}
        onClick={open}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            open();
          }
        }}
        style={{
          height,
          borderRadius: 16,
          border: hasImage
            ? "1px solid rgba(255,255,255,0.18)"
            : "1px dashed rgba(0,255,240,0.35)",
          background: hasImage
            ? "rgba(255,255,255,0.04)"
            : "linear-gradient(160deg, rgba(0,255,240,0.08), rgba(124,58,237,0.08), rgba(255,255,255,0.03))",
          cursor: "pointer",
          overflow: "hidden",
          display: "grid",
          placeItems: "center",
          position: "relative",
          boxShadow: "inset 0 1px 0 rgba(255,255,255,0.08), 0 12px 34px rgba(0,0,0,0.3)",
        }}
      >
        {hasImage ? (
          <>
            <img
              src={value}
              alt={label}
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
            <div
              style={{
                position: "absolute",
                inset: 0,
                background:
                  "linear-gradient(180deg, rgba(0,0,0,0.08) 0%, rgba(0,0,0,0.44) 100%)",
              }}
            />
            <div
              style={{
                position: "absolute",
                bottom: 8,
                right: 10,
                fontSize: 11,
                fontWeight: 900,
                letterSpacing: 0.5,
                color: "rgba(255,255,255,0.95)",
                textShadow: "0 2px 10px rgba(0,0,0,0.6)",
              }}
            >
              Replace
            </div>
          </>
        ) : (
          <div style={{ textAlign: "center", padding: "0 16px" }}>
            <div style={{ fontSize: 20, lineHeight: 1, opacity: 0.95 }}>+</div>
            <div
              style={{
                marginTop: 6,
                fontSize: 12,
                fontWeight: 800,
                color: "rgba(255,255,255,0.82)",
              }}
            >
              Drop or click to upload
            </div>
            <div style={{ marginTop: 4, fontSize: 11, color: "rgba(255,255,255,0.55)" }}>
              JPG, PNG, WEBP
            </div>
          </div>
        )}
      </div>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <button
          type="button"
          onClick={open}
          style={{
            padding: "9px 12px",
            borderRadius: 12,
            border: "1px solid rgba(0,255,240,0.25)",
            background:
              "linear-gradient(135deg, rgba(0,255,240,0.16), rgba(124,58,237,0.14), rgba(0,153,255,0.14))",
            color: "#fff",
            fontWeight: 900,
            fontSize: 12,
            cursor: "pointer",
          }}
        >
          Upload
        </button>

        {hasImage ? (
          <button
            type="button"
            onClick={onClear}
            style={{
              padding: "9px 12px",
              borderRadius: 12,
              border: "1px solid rgba(255,255,255,0.12)",
              background: "rgba(255,255,255,0.05)",
              color: "rgba(255,255,255,0.8)",
              fontWeight: 900,
              fontSize: 12,
              cursor: "pointer",
            }}
          >
            Clear
          </button>
        ) : null}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        style={{ display: "none" }}
        onChange={(e) => {
          const f = e.target.files?.[0] || null;
          if (!f) return;
          onPickFile?.(f);
          e.target.value = "";
        }}
      />
    </div>
  );
}
