function formatRating(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return "--";
  }

  return numeric.toFixed(1);
}

function formatReviewCount(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric <= 0) {
    return "0";
  }

  return new Intl.NumberFormat("en-US").format(Math.round(numeric));
}

function buildBreakdownLabel(summary) {
  if (!Array.isArray(summary?.ratingBreakdown) || !summary.ratingBreakdown.length) {
    return null;
  }

  return summary.ratingBreakdown
    .slice(0, 3)
    .map((entry) => {
      const stars = entry.stars ?? "?";
      const percent = Number.isFinite(entry.percent) ? `${entry.percent}%` : `${entry.count ?? 0}`;
      return `${stars}★ ${percent}`;
    })
    .join(" · ");
}

export function ReviewTrustSummary({ summary, compact = false }) {
  if (!summary) {
    return null;
  }

  const hasRating = Number.isFinite(Number(summary.averageRating));
  const hasReviews = Number(summary.reviewCount) > 0;

  if (!hasRating && !hasReviews) {
    return null;
  }

  const breakdownLabel = buildBreakdownLabel(summary);
  const chips = (
    <>
      <span className="pill">★ {formatRating(summary.averageRating)}</span>
      <span className="pill">{formatReviewCount(summary.reviewCount)} reviews</span>
      {summary.trustBadge ? <span className="pill pill--ok">{summary.trustBadge}</span> : null}
    </>
  );

  if (compact) {
    return chips;
  }

  return (
    <div className="stack-grid">
      <div className="row-wrap">{chips}</div>

      {!compact && breakdownLabel ? (
        <p className="text-xs text-muted">{breakdownLabel}</p>
      ) : null}
    </div>
  );
}
