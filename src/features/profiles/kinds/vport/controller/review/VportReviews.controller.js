// src/features/profiles/kinds/vport/controller/review/VportReviews.controller.js

/**
 * Controller: Vport Store Reviews (dimension-based, config-driven)
 *
 * Owns:
 * - Use-case orchestration
 * - Input validation
 * - Domain-level return values
 *
 * Does NOT:
 * - Import React
 * - Return raw DB rows
 * - Contain UI logic
 */

import {
  fetchVportReviewsByActorId,
  fetchVportReviewStatsByActorId,
} from "@/features/profiles/kinds/vport/dal/review/vportReviews.read.dal";

import {
  createVportReview,
  updateVportReview,
} from "@/features/profiles/kinds/vport/dal/review/vportReviews.write.dal";

import {
  toVportReview,
  toVportReviewList,
} from "@/features/profiles/kinds/vport/model/review/VportReview.model";

/* ============================================================
   LIST REVIEWS (dimension key)
============================================================ */

export async function listVportReviewsController({
  targetActorId,
  reviewType,
  limit = 50,
}) {
  if (!targetActorId) return [];

  if (!reviewType) {
    throw new Error("reviewType is required.");
  }

  if (reviewType === "overall") {
    // overall is computed client-side (weighted avg)
    return [];
  }

  const rows = await fetchVportReviewsByActorId(targetActorId, reviewType, {
    limit,
  });

  return toVportReviewList(rows);
}

/* ============================================================
   GET STATS FOR A SINGLE DIMENSION
   (use this per-dimension; overall is computed in app)
============================================================ */

export async function getVportReviewStatsController({
  targetActorId,
  reviewType,
  limit = 500,
}) {
  if (!targetActorId) return { count: 0, avg: null };

  if (!reviewType) {
    throw new Error("reviewType is required.");
  }

  if (reviewType === "overall") {
    return { count: 0, avg: null };
  }

  return fetchVportReviewStatsByActorId(targetActorId, reviewType, { limit });
}

/* ============================================================
   SAVE (create new review row)
   - unlimited (no 24h, no weekly)
============================================================ */

export async function createVportReviewController({
  viewerActorId,
  targetActorId,
  reviewType,
  rating,
  body,
}) {
  if (!viewerActorId) throw new Error("Authentication required.");
  if (!targetActorId) throw new Error("Target actor is required.");
  if (!reviewType) throw new Error("reviewType is required.");

  if (reviewType === "overall") {
    throw new Error("Overall is computed. Pick a category to review.");
  }

  const r = Number(rating);
  if (!Number.isFinite(r) || r < 1 || r > 5) {
    throw new Error("Invalid rating.");
  }

  const savedRow = await createVportReview({
    viewerActorId,
    targetActorId,
    reviewType,
    rating: r,
    body: body ?? null,
  });

  return toVportReview(savedRow);
}

/* ============================================================
   OPTIONAL: UPDATE EXISTING REVIEW ROW
   (only used if your UI supports editing a specific review)
============================================================ */

export async function updateVportReviewController({
  reviewId,
  rating,
  body,
}) {
  if (!reviewId) throw new Error("reviewId is required.");

  const r = Number(rating);
  if (!Number.isFinite(r) || r < 1 || r > 5) {
    throw new Error("Invalid rating.");
  }

  const savedRow = await updateVportReview({
    reviewId,
    rating: r,
    body: body ?? null,
  });

  return toVportReview(savedRow);
}
