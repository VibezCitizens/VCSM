import React, { useMemo } from "react";
import { useVportPublicDetails } from "@/features/public/vportMenu/hooks/useVportPublicDetails";
import { VportPublicReviewsPanel } from "@/features/public/vportMenu/components/VportPublicReviewsPanel";
import { useVportPublicReviews } from "@/features/public/vportMenu/hooks/useVportPublicReviews";

export function VportPublicReviewsView({ actorId }) {
  const { details } = useVportPublicDetails({ actorId });
  const { summary } = useVportPublicReviews({ actorId });

  // Same derivation pattern as VportPublicMenuView — single source of truth is
  // useVportPublicDetails → mapVportPublicDetailsRpcResult.
  const profile = useMemo(
    () => ({
      displayName: details?.displayName || details?.username || "Business",
      username: details?.username || "",
      bannerUrl: details?.bannerUrl || "",
      avatarUrl: details?.avatarUrl || "",
    }),
    [details]
  );

  const reviewCount = summary?.reviewCount ?? 0;
  const averageRating = summary?.averageRating ?? null;

  if (!actorId) return null;

  return (
    <div
      style={{
        minHeight: "100vh",
        background:
          "radial-gradient(900px 500px at 15% 10%, var(--vc-gradient-a, rgba(108,77,246,0.15)), transparent 60%), " +
          "radial-gradient(800px 420px at 85% 90%, var(--vc-gradient-b, rgba(59,130,246,0.10)), transparent 60%), " +
          "var(--vc-bg-0, #0b0b0f)",
        color: "#fff",
      }}
    >
      <div style={{ width: "100%", maxWidth: 600, margin: "0 auto", padding: 18, paddingBottom: 56 }}>
        {/* Banner + card stacking — same layout pattern as VportPublicMenuView */}
        <div style={{ position: "relative" }}>
          {/* Banner */}
          {profile.bannerUrl ? (
            <div
              style={{
                height: 140,
                borderRadius: "20px 20px 0 0",
                overflow: "hidden",
                background: `url(${profile.bannerUrl}) center/cover no-repeat`,
              }}
            />
          ) : (
            <div
              style={{
                height: 140,
                borderRadius: "20px 20px 0 0",
                background: "linear-gradient(135deg, rgba(139,92,246,0.2), rgba(59,130,246,0.15))",
              }}
            />
          )}

          {/* Content card — overlaps banner */}
          <div
            style={{
              position: "relative",
              marginTop: -40,
              borderRadius: 20,
              border: "1px solid var(--vc-border, rgba(139,92,246,0.18))",
              background: "var(--vc-card-bg, linear-gradient(180deg, rgba(20,20,26,0.98), rgba(20,20,26,0.90)))",
              boxShadow: "var(--vc-shadow-elevated, 0 24px 45px rgba(0,0,0,0.36))",
              zIndex: 2,
              padding: "14px 16px 16px",
            }}
          >
            {/* Page label */}
            <div
              style={{
                textAlign: "center",
                fontWeight: 700,
                fontSize: 12,
                letterSpacing: 1.2,
                color: "rgba(255,255,255,0.5)",
                textTransform: "uppercase",
                marginBottom: 14,
              }}
            >
              Reviews
            </div>

            {/* Profile row — same structure as menu view */}
            <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
              {/* Avatar — square with rounded corners per platform avatar rules */}
              <div
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: 16,
                  flexShrink: 0,
                  backgroundColor: "#0b0b0f",
                  backgroundImage: profile.avatarUrl ? `url(${profile.avatarUrl})` : "none",
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                  border: "1px solid rgba(255,255,255,0.1)",
                  boxShadow: "0 12px 30px rgba(0,0,0,0.5)",
                  display: "grid",
                  placeItems: "center",
                  color: "rgba(255,255,255,0.5)",
                  fontWeight: 700,
                  fontSize: 14,
                }}
              >
                {!profile.avatarUrl ? "VC" : null}
              </div>

              {/* Name + username + rating summary */}
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: 0.3 }}>
                  {profile.displayName}
                </div>
                {profile.username ? (
                  <div style={{ marginTop: 4, fontSize: 12, color: "rgba(255,255,255,0.5)" }}>
                    @{profile.username}
                  </div>
                ) : null}
                <div style={{ marginTop: 6, display: "flex", alignItems: "center", gap: 5 }}>
                  {reviewCount > 0 && averageRating !== null ? (
                    <>
                      <span style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>
                        {Number(averageRating).toFixed(1)}
                      </span>
                      <span style={{ display: "flex", gap: 1 }}>
                        {Array.from({ length: 5 }, (_, i) => {
                          const filled = i < Math.round(averageRating);
                          return (
                            <span
                              key={i}
                              style={{ fontSize: 11, color: filled ? "#f59e0b" : "rgba(255,255,255,0.2)" }}
                            >
                              ★
                            </span>
                          );
                        })}
                      </span>
                      <span style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>
                        ({reviewCount})
                      </span>
                    </>
                  ) : (
                    <span style={{ fontSize: 11, color: "rgba(255,255,255,0.35)" }}>No reviews yet</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Reviews panel */}
        <div style={{ marginTop: 14 }}>
          <VportPublicReviewsPanel actorId={actorId} />
        </div>
      </div>
    </div>
  );
}

export default VportPublicReviewsView;
