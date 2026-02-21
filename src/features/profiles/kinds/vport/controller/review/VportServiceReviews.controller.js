// C:\Users\trest\OneDrive\Desktop\VCSM\src\features\profiles\kinds\vport\controller\review\VportReviews.controller.js
import {
  dalGetActiveReviewByAuthor,
  dalGetVportOfficialStats,
  dalGetVportReviewFormConfig,
  dalListVportReviewRatingsByReviewIds,
  dalListVportReviews,
  dalReadVportReviewById,
} from "@/features/profiles/kinds/vport/dal/review/vportReviews.read.dal";

import {
  dalInsertVportReviewRow,
  dalSoftDeleteVportReview,
  dalUpsertVportReviewRatings,
  dalUpdateVportReviewBody,
} from "@/features/profiles/kinds/vport/dal/review/vportReviews.write.dal";

import {
  modelOfficialStatsRow,
  modelReviewDimensionRow,
  modelReviewsWithRatings,
  modelVportReviewRow,
} from "@/features/profiles/kinds/vport/model/review/VportReview.model";

/* ============================================================
   CONTROLLER (business meaning + orchestration)
   ============================================================ */

function assertActorId(id, label) {
  if (!id || typeof id !== "string") {
    throw new Error(`[VportReviews] missing ${label}`);
  }
}

function normalizeRatingsInput(ratings) {
  const out = [];
  for (const r of ratings ?? []) {
    if (!r) continue;
    const dimensionKey = String(r.dimensionKey ?? "").trim();
    const rating = Number(r.rating);
    out.push({ dimensionKey, rating });
  }
  return out;
}

function validateRatingsAgainstConfig(ratings, configDims) {
  const activeKeys = new Set((configDims ?? []).map((d) => d.dimensionKey));
  const errors = [];

  for (const r of ratings) {
    if (!r.dimensionKey) errors.push("missing_dimension_key");
    if (!activeKeys.has(r.dimensionKey)) errors.push(`unknown_dimension:${r.dimensionKey}`);
    if (!Number.isFinite(r.rating) || r.rating < 1 || r.rating > 5) {
      errors.push(`invalid_rating:${r.dimensionKey}`);
    }
  }

  if (errors.length) {
    throw new Error(`[VportReviews] ratings invalid: ${errors.join(",")}`);
  }
}

export async function ctrlGetReviewFormConfig(targetActorId) {
  assertActorId(targetActorId, "targetActorId");

  const rows = await dalGetVportReviewFormConfig(targetActorId);
  return (rows ?? []).map(modelReviewDimensionRow).filter(Boolean);
}

export async function ctrlGetOfficialStats(targetActorId) {
  assertActorId(targetActorId, "targetActorId");

  const row = await dalGetVportOfficialStats(targetActorId);
  return modelOfficialStatsRow(row);
}

export async function ctrlListReviews(targetActorId, limit = 25) {
  assertActorId(targetActorId, "targetActorId");

  const reviews = await dalListVportReviews(targetActorId, limit);
  const ids = (reviews ?? []).map((r) => r.id);
  const ratings = await dalListVportReviewRatingsByReviewIds(ids);

  return modelReviewsWithRatings(reviews, ratings);
}

// ✅ NEW: fast "my review" read (prevents fetching 200+ rows just to find mine)
export async function ctrlGetMyActiveReview(targetActorId, authorActorId) {
  assertActorId(targetActorId, "targetActorId");
  assertActorId(authorActorId, "authorActorId");

  const row = await dalGetActiveReviewByAuthor(targetActorId, authorActorId);
  if (!row) return null;

  const ratings = await dalListVportReviewRatingsByReviewIds([row.id]);
  const modeled = modelReviewsWithRatings([row], ratings);
  return modeled[0] ?? null;
}

export async function ctrlSubmitReview(input) {
  const { targetActorId, authorActorId, body, ratings } = input ?? {};

  assertActorId(targetActorId, "targetActorId");
  assertActorId(authorActorId, "authorActorId");

  if (targetActorId === authorActorId) {
    throw new Error("[VportReviews] cannot review self");
  }

  const configRows = await dalGetVportReviewFormConfig(targetActorId);
  const configDims = (configRows ?? []).map(modelReviewDimensionRow).filter(Boolean);

  const normalizedRatings = normalizeRatingsInput(ratings);

  if (!normalizedRatings.length) {
    throw new Error("[VportReviews] at least one rating is required");
  }

  validateRatingsAgainstConfig(normalizedRatings, configDims);

  let existing = await dalGetActiveReviewByAuthor(targetActorId, authorActorId);

  let reviewRow;
  if (!existing) {
    reviewRow = await dalInsertVportReviewRow({
      targetActorId,
      authorActorId,
      isVerified: true,
      body: body ?? null,
    });
  } else {
    if (typeof body !== "undefined") {
      reviewRow = await dalUpdateVportReviewBody(existing.id, body ?? null);
    } else {
      reviewRow = existing;
    }
  }

  await dalUpsertVportReviewRatings(reviewRow.id, normalizedRatings);

  const fresh = await dalReadVportReviewById(reviewRow.id);
  const freshRatings = await dalListVportReviewRatingsByReviewIds([reviewRow.id]);

  const modeled = modelReviewsWithRatings([fresh], freshRatings);
  return modeled[0] ?? null;
}

export async function ctrlDeleteMyReview(input) {
  const { reviewId, requesterActorId } = input ?? {};
  assertActorId(reviewId, "reviewId");
  assertActorId(requesterActorId, "requesterActorId");

  const row = await dalReadVportReviewById(reviewId);
  if (!row || row.is_deleted) {
    return null;
  }

  if (row.author_actor_id !== requesterActorId) {
    throw new Error("[VportReviews] not allowed");
  }

  const deleted = await dalSoftDeleteVportReview(reviewId);
  return modelVportReviewRow(deleted);
}