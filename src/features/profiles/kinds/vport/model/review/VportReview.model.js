// C:\Users\trest\OneDrive\Desktop\VCSM\src\features\profiles\kinds\vport\model\review\VportReview.model.js

/* ============================================================
   MODEL (pure mapping)
   - no supabase
   - no I/O
   - domain-safe shapes
   ============================================================ */

export function modelReviewDimensionRow(row) {
  if (!row) return null;

  return {
    vportType: row.vport_type ?? null,
    dimensionKey: row.dimension_key ?? null,
    label: row.label ?? null,
    weight: row.weight ?? 1,
    sortOrder: row.sort_order ?? 0,
  };
}

export function modelReviewRatingRow(row) {
  if (!row) return null;

  return {
    reviewId: row.review_id ?? null,
    dimensionKey: row.dimension_key ?? null,
    rating: row.rating ?? null,
  };
}

export function modelVportReviewRow(row) {
  if (!row) return null;

  return {
    id: row.id,
    targetActorId: row.target_actor_id,
    authorActorId: row.author_actor_id,
    isVerified: row.is_verified ?? false,
    ratingScale: row.rating_scale ?? 5,
    overallRating: row.overall_rating ?? null,
    body: row.body ?? null,
    createdAt: row.created_at ?? null,
    updatedAt: row.updated_at ?? null,
    isDeleted: row.is_deleted ?? false,
    deletedAt: row.deleted_at ?? null,
  };
}

export function modelOfficialStatsRow(row) {
  if (!row) return null;

  return {
    targetActorId: row.target_actor_id ?? null,
    verifiedReviewCount: row.verified_review_count ?? 0,
    officialOverallAvg: row.official_overall_avg ?? null,
    officialOverallP50: row.official_overall_p50 ?? null,
    officialOverallP90: row.official_overall_p90 ?? null,
  };
}

export function modelReviewsWithRatings(reviewRows, ratingRows) {
  const ratingsByReviewId = new Map();

  for (const rr of ratingRows ?? []) {
    const reviewId = rr.review_id;
    if (!ratingsByReviewId.has(reviewId)) ratingsByReviewId.set(reviewId, []);
    ratingsByReviewId.get(reviewId).push(modelReviewRatingRow(rr));
  }

  return (reviewRows ?? []).map((r) => {
    const base = modelVportReviewRow(r);
    return {
      ...base,
      ratings: ratingsByReviewId.get(r.id) ?? [],
    };
  });
}