// src/features/profiles/kinds/vport/controller/review/VportReviews.controller.js

/**
 * Controller: Vport Store Reviews (overall + food)
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
  fetchMyCurrentWeekVportReview,
} from "@/features/profiles/kinds/vport/dal/review/vportReviews.read.dal";

import {
  createOrUpdateMyCurrentWeekVportReview,
} from "@/features/profiles/kinds/vport/dal/review/vportReviews.write.dal";

import {
  toVportReview,
  toVportReviewList,
  toVportReviewStats,
} from "@/features/profiles/kinds/vport/model/review/VportReview.model";

/* ============================================================
   LIST REVIEWS (overall | food)
============================================================ */

export async function listVportReviewsController({
  targetActorId,
  reviewType,
  limit = 50,
}) {
  if (!targetActorId) {
    return [];
  }

  if (!reviewType) {
    throw new Error("reviewType is required.");
  }

  const rows = await fetchVportReviewsByActorId(
    targetActorId,
    reviewType,
    { limit }
  );

  return toVportReviewList(rows);
}

/* ============================================================
   GET STATS (overall + food aggregate)
============================================================ */

export async function getVportReviewStatsController({
  targetActorId,
}) {
  if (!targetActorId) {
    return {
      overall: { count: 0, avg: null },
      food: { count: 0, avg: null },
    };
  }

  // DAL already returns domain-shaped stats in the refactor.
  // Model function is now tolerant of both shapes (see updated model below).
  const stats = await fetchVportReviewStatsByActorId(targetActorId);

  return toVportReviewStats(stats);
}

/* ============================================================
   GET MY CURRENT WEEK REVIEW
============================================================ */

export async function getMyCurrentWeekVportReviewController({
  viewerActorId,
  targetActorId,
  reviewType,
}) {
  if (!viewerActorId || !targetActorId || !reviewType) {
    return null;
  }

  const row = await fetchMyCurrentWeekVportReview(
    viewerActorId,
    targetActorId,
    reviewType
  );

  return toVportReview(row);
}

/* ============================================================
   SAVE (create or update)
============================================================ */

export async function saveMyCurrentWeekVportReviewController({
  viewerActorId,
  targetActorId,
  reviewType,
  rating,
  body,
}) {
  if (!viewerActorId) {
    throw new Error("Authentication required.");
  }

  if (!targetActorId) {
    throw new Error("Target actor is required.");
  }

  if (!reviewType) {
    throw new Error("reviewType is required.");
  }

  if (!rating || rating < 1 || rating > 5) {
    throw new Error("Invalid rating.");
  }

  const savedRow =
    await createOrUpdateMyCurrentWeekVportReview({
      viewerActorId,
      targetActorId,
      reviewType,
      rating,
      body: body ?? null,
    });

  return toVportReview(savedRow);
}
