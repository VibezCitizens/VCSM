// src/features/profiles/kinds/vport/controller/review/VportServiceReviews.controller.js

/**
 * Controller: Vport Service Reviews (unlimited)
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
  fetchServiceReviewStatsByServiceId,
} from "@/features/profiles/kinds/vport/dal/services/vportServiceReviews.read.dal";

import {
  createServiceReview,
  updateServiceReview,
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
  if (!targetActorId) return [];

  const rows = await fetchVportServicesByActorId(targetActorId, { limit });
  return Array.isArray(rows) ? rows : [];
}

/* ============================================================
   LIST REVIEWS (service level)
============================================================ */

export async function listServiceReviewsController({
  serviceId,
  limit = 50,
}) {
  if (!serviceId) return [];

  const rows = await fetchServiceReviewsByServiceId(serviceId, { limit });
  return toVportServiceReviewList(rows);
}

/* ============================================================
   GET STATS (service level)
============================================================ */

export async function getServiceReviewStatsController({
  serviceId,
}) {
  if (!serviceId) return { count: 0, avg: null };

  const row = await fetchServiceReviewStatsByServiceId(serviceId);
  return toVportServiceReviewStats(row);
}

/* ============================================================
   CREATE REVIEW (unlimited)
============================================================ */

export async function createServiceReviewController({
  viewerActorId,
  serviceId,
  rating,
  body,
}) {
  if (!viewerActorId) throw new Error("Authentication required.");
  if (!serviceId) throw new Error("Service is required.");

  const r = Number(rating);
  if (!Number.isFinite(r) || r < 1 || r > 5) {
    throw new Error("Invalid rating.");
  }

  const savedRow = await createServiceReview({
    viewerActorId,
    serviceId,
    rating: r,
    body: body ?? null,
  });

  return toVportServiceReview(savedRow);
}

/* ============================================================
   OPTIONAL: UPDATE REVIEW (if UI supports editing by id)
============================================================ */

export async function updateServiceReviewController({
  reviewId,
  rating,
  body,
}) {
  if (!reviewId) throw new Error("reviewId is required.");

  const r = Number(rating);
  if (!Number.isFinite(r) || r < 1 || r > 5) {
    throw new Error("Invalid rating.");
  }

  const savedRow = await updateServiceReview({
    reviewId,
    rating: r,
    body: body ?? null,
  });

  return toVportServiceReview(savedRow);
}
