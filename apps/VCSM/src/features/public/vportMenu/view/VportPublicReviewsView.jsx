import React from "react";
import { useVportPublicDetails } from "@/features/public/vportMenu/hooks/useVportPublicDetails";
import { VportPublicReviewsPanel } from "@/features/public/vportMenu/components/VportPublicReviewsPanel";
import { useVportPublicReviews } from "@/features/public/vportMenu/hooks/useVportPublicReviews";

export function VportPublicReviewsView({ actorId }) {
  const { details, loading: detailsLoading } = useVportPublicDetails({ actorId });
  const { summary } = useVportPublicReviews({ actorId });

  if (!actorId) return null;

  const name = details?.name ?? details?.displayName ?? null;
  const avatarUrl = details?.avatarUrl ?? null;
  const reviewCount = summary?.reviewCount ?? 0;
  const averageRating = summary?.averageRating ?? null;

  return (
    <div
      style={{
        minHeight: "100vh",
        background:
          "radial-gradient(1100px 700px at 20% 15%, rgba(0,255,240,0.07), transparent 60%), radial-gradient(900px 600px at 85% 20%, rgba(124,58,237,0.09), transparent 55%), radial-gradient(900px 700px at 55% 85%, rgba(0,153,255,0.06), transparent 60%), linear-gradient(180deg, #05060b 0%, #070812 45%, #04040a 100%)",
        color: "#fff",
        paddingBottom: 48,
      }}
    >
      {/* Header */}
      <div
        style={{
          maxWidth: 600,
          margin: "0 auto",
          padding: "28px 20px 0",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 14,
        }}
      >
        {/* Avatar */}
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={name ?? "Business avatar"}
            style={{
              width: 64,
              height: 64,
              borderRadius: 12,
              objectFit: "cover",
              border: "1px solid rgba(255,255,255,0.12)",
              background: "rgba(255,255,255,0.06)",
            }}
            onError={(e) => { e.currentTarget.src = "/avatar.jpg"; }}
          />
        ) : !detailsLoading ? (
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: 12,
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.12)",
            }}
          />
        ) : null}

        {/* Business name */}
        {name ? (
          <div
            style={{
              fontSize: 20,
              fontWeight: 800,
              letterSpacing: 0.3,
              textAlign: "center",
              color: "#fff",
            }}
          >
            {name}
          </div>
        ) : detailsLoading ? (
          <div
            style={{
              width: 140,
              height: 20,
              borderRadius: 8,
              background: "rgba(255,255,255,0.08)",
            }}
          />
        ) : null}

        {/* Rating headline */}
        {reviewCount > 0 && averageRating !== null ? (
          <div
            style={{
              fontSize: 13,
              color: "rgba(255,255,255,0.5)",
              textAlign: "center",
            }}
          >
            {averageRating.toFixed(1)} avg · {reviewCount} {reviewCount === 1 ? "review" : "reviews"}
          </div>
        ) : null}

        <div
          style={{
            width: "100%",
            height: 1,
            background: "rgba(255,255,255,0.07)",
            marginTop: 6,
          }}
        />
      </div>

      {/* Reviews panel */}
      <div
        style={{
          maxWidth: 600,
          margin: "20px auto 0",
          padding: "0 16px",
        }}
      >
        <VportPublicReviewsPanel actorId={actorId} />
      </div>
    </div>
  );
}

export default VportPublicReviewsView;
