import React from "react";

export function VportPublicReviewEmptyState({ onWriteReview }) {
  return (
    <div
      style={{
        borderRadius: 16,
        border: "1px solid var(--vc-border, rgba(139,92,246,0.18))",
        background: "var(--vc-card-bg, rgba(20,20,26,0.92))",
        padding: "36px 24px",
        textAlign: "center",
      }}
    >
      <div style={{ fontSize: 32, marginBottom: 12 }}>⭐</div>
      <div style={{ fontSize: 16, fontWeight: 700, color: "rgba(255,255,255,0.85)", marginBottom: 8 }}>
        No reviews yet
      </div>
      <div style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", lineHeight: "20px", maxWidth: 260, margin: "0 auto" }}>
        Be the first to share your experience with this business.
      </div>
      {onWriteReview ? (
        <button
          type="button"
          onClick={onWriteReview}
          style={{
            marginTop: 20,
            borderRadius: 12,
            padding: "10px 22px",
            border: "1px solid rgba(139,92,246,0.45)",
            background: "rgba(139,92,246,0.16)",
            color: "rgba(255,255,255,0.9)",
            fontSize: 13,
            fontWeight: 700,
            cursor: "pointer",
            letterSpacing: 0.3,
          }}
        >
          Write a Review
        </button>
      ) : null}
    </div>
  );
}

export default VportPublicReviewEmptyState;
