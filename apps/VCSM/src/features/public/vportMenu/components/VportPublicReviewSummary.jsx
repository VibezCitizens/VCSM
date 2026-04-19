import React from "react";

function StarDisplay({ rating, size = 16 }) {
  const filled = Math.round(Math.max(0, Math.min(5, rating ?? 0)));
  return (
    <span style={{ display: "inline-flex", gap: 2 }} aria-label={`${rating} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <span
          key={n}
          style={{
            fontSize: size,
            color: n <= filled ? "#f59e0b" : "rgba(255,255,255,0.18)",
            lineHeight: 1,
          }}
        >
          ★
        </span>
      ))}
    </span>
  );
}

export function VportPublicReviewSummary({ summary }) {
  if (!summary || summary.reviewCount === 0) return null;

  const { reviewCount, averageRating } = summary;
  const displayRating = typeof averageRating === "number" ? averageRating.toFixed(1) : null;

  return (
    <div
      style={{
        borderRadius: 16,
        border: "1px solid var(--vc-border, rgba(139,92,246,0.18))",
        background: "var(--vc-card-bg, rgba(20,20,26,0.92))",
        padding: "16px 18px",
        display: "flex",
        alignItems: "center",
        gap: 16,
      }}
    >
      {displayRating ? (
        <div style={{ textAlign: "center", minWidth: 56 }}>
          <div style={{ fontSize: 32, fontWeight: 800, letterSpacing: -1, color: "#fff", lineHeight: 1 }}>
            {displayRating}
          </div>
          <div style={{ marginTop: 6 }}>
            <StarDisplay rating={averageRating} size={14} />
          </div>
        </div>
      ) : null}

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: "rgba(255,255,255,0.85)" }}>
          {reviewCount === 1 ? "1 review" : `${reviewCount} reviews`}
        </div>
        {displayRating ? (
          <div style={{ marginTop: 2, fontSize: 12, color: "rgba(255,255,255,0.45)" }}>
            Average overall rating
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default VportPublicReviewSummary;
