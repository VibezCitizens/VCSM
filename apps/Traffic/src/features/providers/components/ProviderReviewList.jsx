"use client";

import { useMemo, useState } from "react";
import { useTrafficLanguage } from "@/lib/language";

const REVIEW_BATCH_SIZE = 5;

function formatReviewRating(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric <= 0) {
    return null;
  }

  return numeric.toFixed(1);
}

export default function ProviderReviewList({ reviews = [] }) {
  const { t } = useTrafficLanguage();
  const safeReviews = Array.isArray(reviews) ? reviews : [];
  const [visibleCount, setVisibleCount] = useState(
    Math.min(REVIEW_BATCH_SIZE, safeReviews.length)
  );

  const visibleReviews = useMemo(
    () => safeReviews.slice(0, visibleCount),
    [safeReviews, visibleCount]
  );

  const nextVisibleCount = Math.min(safeReviews.length, visibleCount + REVIEW_BATCH_SIZE);
  const nextBatchCount = Math.max(0, nextVisibleCount - visibleCount);
  const canLoadMore = nextBatchCount > 0;

  return (
    <>
      <div className="pro-review-list">
        {visibleReviews.map((review) => {
          const rating = formatReviewRating(review.rating);

          return (
            <article className="pro-review-item" key={review.id}>
              <div className="pro-review-head">
                <span className="pro-review-author">{review.authorName}</span>
                {rating ? <span className="pro-review-rating">&#9733; {rating}</span> : null}
              </div>
              {review.body ? <p className="pro-review-body">{review.body}</p> : null}
            </article>
          );
        })}
      </div>

      {canLoadMore ? (
        <button
          type="button"
          className="btn btn--ghost pro-review-load-btn"
          onClick={() => setVisibleCount(nextVisibleCount)}
        >
          {t("providerProfile.loadMore", { count: nextBatchCount })}
        </button>
      ) : null}
    </>
  );
}
