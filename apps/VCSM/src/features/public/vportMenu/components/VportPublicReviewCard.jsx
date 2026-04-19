import React from "react";

function StarRow({ rating }) {
  const filled = Math.round(Math.max(0, Math.min(5, rating ?? 0)));
  return (
    <span style={{ display: "inline-flex", gap: 1 }}>
      {[1, 2, 3, 4, 5].map((n) => (
        <span
          key={n}
          style={{ fontSize: 12, color: n <= filled ? "#f59e0b" : "rgba(255,255,255,0.18)", lineHeight: 1 }}
        >
          ★
        </span>
      ))}
    </span>
  );
}

function timeAgo(dateStr) {
  if (!dateStr) return "";
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days < 1) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  return `${Math.floor(months / 12)}y ago`;
}

export function VportPublicReviewCard({ review }) {
  if (!review) return null;

  const {
    authorDisplayName,
    authorUsername,
    authorAvatarUrl,
    overallRating,
    body,
    verificationStatus,
    reviewActivityAt,
  } = review;

  const initials = (authorDisplayName || "A").charAt(0).toUpperCase();
  const isVerified = verificationStatus === "verified" || verificationStatus === "transaction_verified";

  return (
    <div
      style={{
        borderRadius: 16,
        border: "1px solid rgba(148,163,184,0.14)",
        background: "rgba(148,163,184,0.06)",
        padding: "14px 16px",
      }}
    >
      {/* Author row */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            background: authorAvatarUrl ? `url(${authorAvatarUrl}) center/cover no-repeat` : "rgba(139,92,246,0.3)",
            border: "1px solid rgba(255,255,255,0.1)",
            display: "grid",
            placeItems: "center",
            flexShrink: 0,
            color: "rgba(255,255,255,0.75)",
            fontWeight: 700,
            fontSize: 14,
          }}
        >
          {!authorAvatarUrl ? initials : null}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: "rgba(255,255,255,0.9)" }}>
              {authorDisplayName}
            </span>
            {isVerified ? (
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  color: "#34d399",
                  background: "rgba(52,211,153,0.12)",
                  borderRadius: 6,
                  padding: "1px 6px",
                  letterSpacing: 0.3,
                }}
              >
                Verified
              </span>
            ) : null}
          </div>
          {authorUsername ? (
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginTop: 1 }}>
              @{authorUsername}
            </div>
          ) : null}
        </div>

        <div style={{ textAlign: "right", flexShrink: 0 }}>
          <StarRow rating={overallRating} />
          {reviewActivityAt ? (
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", marginTop: 3 }}>
              {timeAgo(reviewActivityAt)}
            </div>
          ) : null}
        </div>
      </div>

      {/* Body */}
      {body ? (
        <div style={{ fontSize: 14, color: "rgba(255,255,255,0.75)", lineHeight: "20px" }}>
          {body}
        </div>
      ) : (
        <div style={{ fontSize: 13, color: "rgba(255,255,255,0.35)", fontStyle: "italic" }}>
          No written review.
        </div>
      )}
    </div>
  );
}

export default VportPublicReviewCard;
