import React from "react";

function DimensionBar({ rating }) {
  const pct = Math.max(0, Math.min(100, ((rating ?? 0) / 5) * 100));
  return (
    <div
      style={{
        flex: 1,
        height: 4,
        borderRadius: 4,
        background: "rgba(255,255,255,0.1)",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          width: `${pct}%`,
          height: "100%",
          borderRadius: 4,
          background: "linear-gradient(90deg, #8b5cf6, #6366f1)",
          transition: "width 0.4s ease",
        }}
      />
    </div>
  );
}

export function VportPublicReviewDimensions({ dimensions }) {
  if (!Array.isArray(dimensions) || dimensions.length === 0) return null;

  return (
    <div
      style={{
        borderRadius: 16,
        border: "1px solid var(--vc-border, rgba(139,92,246,0.18))",
        background: "var(--vc-card-bg, rgba(20,20,26,0.92))",
        padding: "14px 18px",
        display: "flex",
        flexDirection: "column",
        gap: 10,
      }}
    >
      <div style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.45)", letterSpacing: 0.8, textTransform: "uppercase" }}>
        Breakdown
      </div>

      {dimensions.map((dim) => (
        <div key={dim.id} style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ minWidth: 110, fontSize: 13, color: "rgba(255,255,255,0.75)", fontWeight: 500 }}>
            {dim.label}
          </div>
          <DimensionBar rating={dim.averageRating} />
          <div style={{ minWidth: 28, fontSize: 13, fontWeight: 700, color: "rgba(255,255,255,0.85)", textAlign: "right" }}>
            {typeof dim.averageRating === "number" ? dim.averageRating.toFixed(1) : "—"}
          </div>
        </div>
      ))}
    </div>
  );
}

export default VportPublicReviewDimensions;
