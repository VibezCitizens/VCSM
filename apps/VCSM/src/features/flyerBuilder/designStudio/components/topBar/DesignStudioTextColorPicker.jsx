import React from "react";

export default function DesignStudioTextColorPicker({ value, onChange, buttonStyle }) {
  const hostRef = React.useRef(null);
  const [open, setOpen] = React.useState(false);
  const [draft, setDraft] = React.useState(toSafeHex(value));

  React.useEffect(() => {
    setDraft(toSafeHex(value));
  }, [value]);

  React.useEffect(() => {
    if (!open) return undefined;

    const onPointerDown = (event) => {
      if (!hostRef.current?.contains(event.target)) {
        setOpen(false);
      }
    };

    window.addEventListener("pointerdown", onPointerDown);
    return () => window.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  return (
    <div ref={hostRef} style={{ position: "relative" }}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        style={buttonStyle}
        title="Text color"
      >
        <span
          style={{
            width: 24,
            height: 24,
            borderRadius: 8,
            border: "1px solid rgba(255,255,255,0.35)",
            background: toSafeHex(value),
            display: "block",
          }}
        />
      </button>

      {open ? (
        <div style={colorPopover}>
          <div style={swatchesWrap}>
            {MODERN_SWATCHES.map((hex) => (
              <button
                key={hex}
                type="button"
                onClick={() => {
                  onChange?.(hex);
                  setDraft(hex);
                }}
                style={{
                  ...swatchBtn,
                  background: hex,
                  boxShadow: toSafeHex(value) === hex ? "0 0 0 2px rgba(0,255,240,0.45)" : "none",
                }}
                title={hex}
              />
            ))}
          </div>

          <div style={hexRow}>
            <input
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  const next = toSafeHex(draft);
                  setDraft(next);
                  onChange?.(next);
                  setOpen(false);
                }
              }}
              style={hexInput}
              aria-label="Hex color"
            />
            <button
              type="button"
              onClick={() => {
                const next = toSafeHex(draft);
                setDraft(next);
                onChange?.(next);
                setOpen(false);
              }}
              style={applyBtn}
            >
              Apply
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

const colorPopover = {
  position: "absolute",
  top: "calc(100% + 8px)",
  left: "50%",
  transform: "translateX(-50%)",
  width: "min(324px, calc(100vw - 24px))",
  borderRadius: 14,
  border: "1px solid rgba(255,255,255,0.18)",
  background: "linear-gradient(180deg, rgba(15,22,38,0.98), rgba(8,11,23,0.98))",
  boxShadow: "0 18px 44px rgba(0,0,0,0.55)",
  padding: 10,
  zIndex: 20,
};

const swatchesWrap = {
  display: "grid",
  gridTemplateColumns: "repeat(10, minmax(0, 1fr))",
  gap: 6,
};

const swatchBtn = {
  width: "100%",
  aspectRatio: "1 / 1",
  borderRadius: 6,
  border: "1px solid rgba(255,255,255,0.24)",
  cursor: "pointer",
};

const hexRow = {
  marginTop: 10,
  display: "grid",
  gridTemplateColumns: "1fr auto",
  gap: 6,
};

const hexInput = {
  height: 34,
  borderRadius: 10,
  border: "1px solid rgba(255,255,255,0.2)",
  background: "rgba(255,255,255,0.06)",
  color: "#fff",
  padding: "0 10px",
  fontSize: 12,
  fontWeight: 700,
};

const applyBtn = {
  height: 34,
  borderRadius: 10,
  border: "1px solid rgba(0,255,240,0.28)",
  background: "linear-gradient(135deg, rgba(0,255,240,0.16), rgba(124,58,237,0.14))",
  color: "#fff",
  fontSize: 12,
  fontWeight: 800,
  padding: "0 10px",
  cursor: "pointer",
};

const MODERN_SWATCHES = [
  "#ffffff", "#f9fafb", "#f3f4f6", "#e5e7eb", "#d1d5db", "#9ca3af", "#6b7280", "#4b5563", "#374151", "#111827",
  "#eff6ff", "#dbeafe", "#bfdbfe", "#93c5fd", "#60a5fa", "#3b82f6", "#2563eb", "#1d4ed8", "#22d3ee", "#06b6d4",
  "#ecfdf5", "#d1fae5", "#a7f3d0", "#6ee7b7", "#34d399", "#10b981", "#22c55e", "#84cc16", "#a3e635", "#facc15",
  "#fde68a", "#f59e0b", "#f97316", "#fb7185", "#f43f5e", "#ef4444", "#dc2626", "#f472b6", "#ec4899", "#db2777",
  "#ede9fe", "#d8b4fe", "#c084fc", "#a855f7", "#9333ea", "#818cf8", "#6366f1", "#4f46e5", "#312e81", "#000000",
];

function toSafeHex(input) {
  const value = String(input || "").trim();
  const six = /^#?[0-9a-fA-F]{6}$/.test(value)
    ? `#${value.replace("#", "").toLowerCase()}`
    : null;
  if (six) return six;

  const three = /^#?[0-9a-fA-F]{3}$/.test(value)
    ? value
        .replace("#", "")
        .toLowerCase()
        .split("")
        .map((char) => `${char}${char}`)
        .join("")
    : null;

  return three ? `#${three}` : "#ffffff";
}
