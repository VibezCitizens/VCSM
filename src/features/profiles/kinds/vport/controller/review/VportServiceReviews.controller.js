// src/features/profiles/kinds/vport/controller/review/VportServiceReviews.controller.js

/**
 * Controller: Vport Service Reviews
 *
 * Owns:
 * - Orchestration
 * - Domain meaning
 * - Use-case boundaries
 *
 * Does NOT:
 * - Touch React
 * - Return raw DB rows
 */

import {
  fetchVportServicesByActorId,
} from "@/features/profiles/kinds/vport/dal/services/vportServices.read.dal";

import {
  fetchServiceReviewsByServiceId,
  fetchMyCurrentWeekServiceReview,
  fetchServiceReviewStatsByServiceId,
} from "@/features/profiles/kinds/vport/dal/services/vportServiceReviews.read.dal";

import {
  createOrUpdateMyCurrentWeekServiceReview,
} from "@/features/profiles/kinds/vport/dal/services/vportServiceReviews.write.dal";

import {
  toVportServiceReview,
  toVportServiceReviewList,
  toVportServiceReviewStats,
} from "@/features/profiles/kinds/vport/model/review/VportServiceReview.model";



/* ============================================================
   LIST SERVICES (catalog)
============================================================ */

export async function listVportServicesController({
  targetActorId,
  limit = 200,
}) {
  if (!targetActorId) {
    return [];
  }

  const rows = await fetchVportServicesByActorId(targetActorId, { limit });

  // No model yet for services — returning raw rows intentionally
  // (services model can be added later)
  return Array.isArray(rows) ? rows : [];
}



/* ============================================================
   LIST REVIEWS (service level)
============================================================ */

export async function listServiceReviewsController({
  serviceId,
  limit = 50,
}) {
  if (!serviceId) {
    return [];
  }

  const rows = await fetchServiceReviewsByServiceId(serviceId, { limit });

  return toVportServiceReviewList(rows);
}



/* ============================================================
   GET STATS (service level)
============================================================ */

export async function getServiceReviewStatsController({
  serviceId,
}) {
  if (!serviceId) {
    return { count: 0, avg: null };
  }

  const row = await fetchServiceReviewStatsByServiceId(serviceId);

  return toVportServiceReviewStats(row);
}



/* ============================================================
   GET MY CURRENT WEEK REVIEW
============================================================ */

export async function getMyCurrentWeekServiceReviewController({
  viewerActorId,
  serviceId,
}) {
  if (!viewerActorId || !serviceId) {
    return null;
  }

  const row = await fetchMyCurrentWeekServiceReview(
    viewerActorId,
    serviceId
  );

  return toVportServiceReview(row);
}



/* ============================================================
   SAVE (create or update)
============================================================ */

export async function saveMyCurrentWeekServiceReviewController({
  viewerActorId,
  serviceId,
  rating,
  body,
}) {
  if (!viewerActorId) {
    throw new Error("Authentication required.");
  }

  if (!serviceId) {
    throw new Error("Service is required.");
  }

  if (!rating || rating < 1 || rating > 5) {
    throw new Error("Invalid rating.");
  }

  const savedRow =
    await createOrUpdateMyCurrentWeekServiceReview({
      viewerActorId,
      serviceId,
      rating,
      body: body ?? null,
    });

  const saved = toVportServiceReview(savedRow);

  // Return authoritative domain result
  return saved;
}
