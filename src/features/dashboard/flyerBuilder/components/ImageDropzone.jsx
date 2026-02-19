import React, { useRef, useCallback } from "react";

export default function ImageDropzone({
  label,
  value,
  onPickFile,
  onClear,
  height = 110,
} = {}) {
  const inputRef = useRef(null);

  const open = useCallback(() => {
    inputRef.current?.click();
  }, []);

  return (
    <div style={{ display: "grid", gap: 8 }}>
      <div style={{ fontSize: 12, fontWeight: 900, opacity: 0.8 }}>{label}</div>

      <div
        onClick={open}
        style={{
          height,
          borderRadius: 14,
          border: "1px solid rgba(255,255,255,0.14)",
          background: "rgba(255,255,255,0.06)",
          cursor: "pointer",
          overflow: "hidden",
          display: "grid",
          placeItems: "center",
          position: "relative",
        }}
      >
        {value ? (
          <img
            src={value}
            alt={label}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        ) : (
          <div style={{ fontSize: 12, opacity: 0.7, fontWeight: 800 }}>
            Click to upload
          </div>
        )}
      </div>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <button
          type="button"
          onClick={open}
          style={{
            padding: "10px 12px",
            borderRadius: 12,
            border: "1px solid rgba(255,255,255,0.14)",
            background: "rgba(255,255,255,0.06)",
            color: "#fff",
            fontWeight: 900,
            fontSize: 12,
            cursor: "pointer",
          }}
        >
          Upload
        </button>

        {value ? (
          <button
            type="button"
            onClick={onClear}
            style={{
              padding: "10px 12px",
              borderRadius: 12,
              border: "1px solid rgba(255,255,255,0.10)",
              background: "rgba(255,255,255,0.03)",
              color: "rgba(255,255,255,0.75)",
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
