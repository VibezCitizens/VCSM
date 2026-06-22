"use client";

import { useTrafficLanguage } from "@/lib/language";
import ProviderReviewList from "@/features/providers/components/ProviderReviewList";
import { ReviewTrustSummary } from "@/features/reviews/adapters/reviews.adapter";

export function ProviderTrustSection({ reviewSummary, visibleReviews, hasVisibleReviews, hasVisibleReviewSignals }) {
  const { t } = useTrafficLanguage();

  return (
    <section
      className="card card--subtle pro-trust"
      aria-label={t("providerProfile.reviewsTrust")}
    >
      {hasVisibleReviews ? (
        <>
          <h2 className="pro-section-title">{t("common.reviews")}</h2>
          {reviewSummary ? (
            <ReviewTrustSummary summary={reviewSummary} />
          ) : null}

          {visibleReviews.length > 0 ? (
            <ProviderReviewList reviews={visibleReviews} />
          ) : hasVisibleReviewSignals ? (
            <p className="pro-review-meta-note">
              {t("trust.ratingNoComments")}
            </p>
          ) : null}
        </>
      ) : (
        <div className="pro-trust-empty">
          <p className="pro-trust-empty-text">
            {t("trust.newProvider")}
          </p>
        </div>
      )}
    </section>
  );
}
