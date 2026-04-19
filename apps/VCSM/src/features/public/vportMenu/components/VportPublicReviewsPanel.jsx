import React, { useEffect, useState } from "react";
import { supabase } from "@/services/supabase/supabaseClient";
import { useVportPublicReviews } from "@/features/public/vportMenu/hooks/useVportPublicReviews";
import VportPublicReviewSummary from "@/features/public/vportMenu/components/VportPublicReviewSummary";
import VportPublicReviewDimensions from "@/features/public/vportMenu/components/VportPublicReviewDimensions";
import VportPublicReviewCard from "@/features/public/vportMenu/components/VportPublicReviewCard";
import VportPublicReviewEmptyState from "@/features/public/vportMenu/components/VportPublicReviewEmptyState";

const PANEL_STYLE = {
  borderRadius: 20,
  border: "1px solid var(--vc-border, rgba(139,92,246,0.18))",
  background: "var(--vc-card-bg, linear-gradient(180deg, rgba(20,20,26,0.98), rgba(20,20,26,0.90)))",
  padding: "16px 16px 20px",
  display: "flex",
  flexDirection: "column",
  gap: 12,
};

const loadMoreBtnStyle = {
  borderRadius: 12,
  padding: "10px 18px",
  border: "1px solid rgba(255,255,255,0.1)",
  background: "rgba(255,255,255,0.05)",
  color: "rgba(255,255,255,0.7)",
  fontSize: 13,
  fontWeight: 600,
  cursor: "pointer",
  width: "100%",
  textAlign: "center",
};

const writeBtnStyle = {
  borderRadius: 12,
  padding: "11px 18px",
  border: "1px solid rgba(139,92,246,0.45)",
  background: "rgba(139,92,246,0.16)",
  color: "rgba(255,255,255,0.9)",
  fontSize: 13,
  fontWeight: 700,
  cursor: "pointer",
  letterSpacing: 0.3,
  width: "100%",
  textAlign: "center",
};

export function VportPublicReviewsPanel({ actorId }) {
  const { summary, reviews, dimensions, hasMore, loading, loadingMore, error, loadMore } =
    useVportPublicReviews({ actorId });
  const [isAuthed, setIsAuthed] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setIsAuthed(!!data?.session?.user);
    });
  }, []);

  const handleWriteReview = () => {
    if (!isAuthed) {
      window.location.href = "/login";
      return;
    }
    // Write review route not yet implemented — auth-gated CTA is present.
    // Future: navigate to review submission flow for targetActorId.
  };

  if (loading) {
    return (
      <div style={PANEL_STYLE}>
        <div style={{ color: "rgba(255,255,255,0.9)", fontWeight: 700 }}>Reviews</div>
        <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 13 }}>Loading reviews...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ ...PANEL_STYLE, border: "1px solid rgba(239,68,68,0.3)", background: "rgba(127,29,29,0.2)" }}>
        <div style={{ color: "rgba(255,255,255,0.9)", fontWeight: 700 }}>Reviews</div>
        <div style={{ color: "rgba(255,255,255,0.65)", fontSize: 13 }}>
          Reviews are temporarily unavailable.
        </div>
      </div>
    );
  }

  const isEmpty = !reviews.length;

  return (
    <div style={PANEL_STYLE}>
      <div style={{ fontWeight: 800, fontSize: 16, color: "rgba(255,255,255,0.92)" }}>Reviews</div>

      <VportPublicReviewSummary summary={summary} />
      <VportPublicReviewDimensions dimensions={dimensions} />

      {isEmpty ? (
        <VportPublicReviewEmptyState onWriteReview={handleWriteReview} />
      ) : (
        <>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {reviews.map((review) => (
              <VportPublicReviewCard key={review.id} review={review} />
            ))}
          </div>

          {hasMore ? (
            <button
              type="button"
              onClick={loadMore}
              disabled={loadingMore}
              style={{ ...loadMoreBtnStyle, opacity: loadingMore ? 0.5 : 1 }}
            >
              {loadingMore ? "Loading..." : "Load more reviews"}
            </button>
          ) : null}

          <button type="button" onClick={handleWriteReview} style={writeBtnStyle}>
            {isAuthed ? "Write a Review" : "Sign in to Write a Review"}
          </button>
        </>
      )}
    </div>
  );
}

export default VportPublicReviewsPanel;
