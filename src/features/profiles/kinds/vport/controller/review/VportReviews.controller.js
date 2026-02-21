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

// ✅ NEW: author cards (profiles + void fallbacks)
import { dalListActorCardsByActorIds } from "@/features/profiles/kinds/vport/dal/review/vportReviewAuthors.read.dal";

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

/* ============================================================
   Author enrichment helper
   ============================================================ */

function pickAuthorActorId(r) {
  return (
    r?.authorActorId ??
    r?.author_actor_id ??
    r?.author_id ??
    null
  );
}

async function enrichReviewsWithAuthors(reviews) {
  const rows = Array.isArray(reviews) ? reviews : [];
  if (!rows.length) return rows;

  const authorIds = rows.map(pickAuthorActorId).filter(Boolean);
  if (!authorIds.length) return rows;

  const cards = await dalListActorCardsByActorIds(authorIds);
  const byId = new Map((cards ?? []).map((c) => [String(c.actorId), c]));

  return rows.map((r) => {
    const authorActorId = pickAuthorActorId(r);
    const card = authorActorId ? byId.get(String(authorActorId)) : null;

    return {
      ...r,

      // ✅ normalized author id
      authorActorId: authorActorId ? String(authorActorId) : null,

      // ✅ keys your UI already tries to read
      authorDisplayName: card?.displayName ?? r?.authorDisplayName ?? "Anonymous",
      authorUsername: card?.username ?? r?.authorUsername ?? "",
      authorAvatarUrl: card?.avatarUrl ?? r?.authorAvatarUrl ?? "",
    };
  });
}

/* ============================================================
   Controllers
   ============================================================ */

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

  const modeled = modelReviewsWithRatings(reviews, ratings);
  return await enrichReviewsWithAuthors(modeled);
}

export async function ctrlSubmitReview(input) {
  const {
    targetActorId,
    authorActorId,
    body,
    ratings,
    // If you later want to control verified status, keep it controller-owned:
    // for now, default to true (signed-in lane only).
  } = input ?? {};

  assertActorId(targetActorId, "targetActorId");
  assertActorId(authorActorId, "authorActorId");

  // basic actor-rule: prevent reviewing self (actor-first)
  if (targetActorId === authorActorId) {
    throw new Error("[VportReviews] cannot review self");
  }

  // Load config (meaning boundary)
  const configRows = await dalGetVportReviewFormConfig(targetActorId);
  const configDims = (configRows ?? []).map(modelReviewDimensionRow).filter(Boolean);

  const normalizedRatings = normalizeRatingsInput(ratings);

  if (!normalizedRatings.length) {
    throw new Error("[VportReviews] at least one rating is required");
  }

  validateRatingsAgainstConfig(normalizedRatings, configDims);

  // Idempotency: one active review per (target, author)
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
    // Update body if provided (not required)
    if (typeof body !== "undefined") {
      reviewRow = await dalUpdateVportReviewBody(existing.id, body ?? null);
    } else {
      reviewRow = existing;
    }
  }

  await dalUpsertVportReviewRatings(reviewRow.id, normalizedRatings);

  // Read back fresh (overall_rating is trigger-computed)
  const fresh = await dalReadVportReviewById(reviewRow.id);
  const freshRatings = await dalListVportReviewRatingsByReviewIds([reviewRow.id]);

  const modeled = modelReviewsWithRatings([fresh], freshRatings);
  const enriched = await enrichReviewsWithAuthors(modeled);

  return enriched[0] ?? null;
}

/**
 * Get the current user's active review for a given target actor.
 * Supports both call styles:
 *   - ctrlGetMyActiveReview(targetActorId, authorActorId)
 *   - ctrlGetMyActiveReview({ targetActorId, authorActorId })
 */
export async function ctrlGetMyActiveReview(arg1, arg2) {
  const targetActorId =
    typeof arg1 === "object" && arg1 !== null ? arg1.targetActorId : arg1;
  const authorActorId =
    typeof arg1 === "object" && arg1 !== "null" && arg1 !== null ? arg1.authorActorId : arg2;

  assertActorId(targetActorId, "targetActorId");
  assertActorId(authorActorId, "authorActorId");

  const existing = await dalGetActiveReviewByAuthor(targetActorId, authorActorId);
  if (!existing || existing.is_deleted) return null;

  // Ensure we return the same modeled shape as list/submit (with ratings)
  const fresh = await dalReadVportReviewById(existing.id);
  const freshRatings = await dalListVportReviewRatingsByReviewIds([existing.id]);

  const modeled = modelReviewsWithRatings([fresh], freshRatings);
  const enriched = await enrichReviewsWithAuthors(modeled);

  return enriched[0] ?? null;
}

export async function ctrlDeleteMyReview(input) {
  const { reviewId, requesterActorId } = input ?? {};
  assertActorId(reviewId, "reviewId");
  assertActorId(requesterActorId, "requesterActorId");

  const row = await dalReadVportReviewById(reviewId);
  if (!row || row.is_deleted) {
    return null;
  }

  // Ownership rule: only author can delete own review
  if (row.author_actor_id !== requesterActorId) {
    throw new Error("[VportReviews] not allowed");
  }

  const deleted = await dalSoftDeleteVportReview(reviewId);
  return modelVportReviewRow(deleted);
}