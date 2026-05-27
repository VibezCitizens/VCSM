// ============================================================
// VCSM — Vport Reviews Controller (Engine-Backed)
// ============================================================
// Delegates to engines/reviews for all DB operations.
// Maps engine shapes to the hook contract.
// ctrlAssertReviewTargetActor stays app-local (queries vc.actors).
// ============================================================

import {
  getReviewFormConfig,
  getTargetStats,
  listReviews as engineListReviews,
  submitReview as engineSubmitReview,
  deleteReview as engineDeleteReview,
  getMyActiveReview as engineGetMyActiveReview,
} from '@reviews'

import { dalReadReviewTargetActor } from '@/features/profiles/kinds/vport/dal/review/reviewTarget.read.dal'
import { readVportTypeByActorId } from '@/features/profiles/kinds/vport/dal/services/readVportTypeByActorId.dal'
import { publishVcsmNotification } from '@/features/notifications/adapters/notifications.adapter'
import {
  assertActorId,
  mapDimension,
  mapStats,
  mapRating,
  mapReview,
} from '@/features/profiles/kinds/vport/controller/review/vportReviews.mappers'

/* ============================================================
   Controllers
   ============================================================ */

/**
 * Get review dimensions for a target actor.
 * Returns legacy shape: [{ vportType, dimensionKey, label, weight, sortOrder }]
 */
export async function ctrlGetReviewFormConfig(targetActorId) {
  assertActorId(targetActorId, 'targetActorId')

  // Resolve target subtype from vc.actors
  const actor = await dalReadReviewTargetActor(targetActorId)
  if (!actor || actor.is_void || actor.kind !== 'vport') {
    return []
  }

  // Get vport_type for subtype resolution
  const actorTypeRow = await readVportTypeByActorId({ actorId: targetActorId })
  const targetSubtype = String(actorTypeRow?.vport_type ?? '').trim().toLowerCase() || null

  if (!targetSubtype) return []

  const dims = await getReviewFormConfig({ targetKind: 'vport', targetSubtype })
  return dims.map(mapDimension).filter(Boolean)
}

/**
 * Validate target actor is an active vport. App-local (queries vc.actors).
 */
export async function ctrlAssertReviewTargetActor(targetActorId) {
  assertActorId(targetActorId, 'targetActorId')

  const actor = await dalReadReviewTargetActor(targetActorId)
  if (!actor) {
    throw new Error(`[VportReviews] targetActorId not found: ${targetActorId}`)
  }

  if (actor.is_void) {
    throw new Error(`[VportReviews] target actor is void: ${targetActorId}`)
  }

  if (String(actor.kind) !== 'vport' || !actor.vport_id) {
    throw new Error(
      `[VportReviews] targetActorId must be a vport actor (kind=vport). got kind=${actor.kind}`
    )
  }

  return actor
}

/**
 * Get official stats for a target actor.
 * Returns legacy shape: { totalReviews, overallAverage, ... }
 */
export async function ctrlGetOfficialStats(targetActorId) {
  assertActorId(targetActorId, 'targetActorId')

  const stats = await getTargetStats({ targetActorId })
  return mapStats(stats)
}

/**
 * List reviews for a target actor with pagination.
 * Returns legacy shape: { reviews, hasMore, nextCursor }
 */
export async function ctrlListReviews(targetActorId, { limit = 25, cursor = null } = {}) {
  assertActorId(targetActorId, 'targetActorId')

  const result = await engineListReviews({ targetActorId, cursor, limit })

  const reviews = (result.reviews ?? []).map(mapReview).filter(Boolean)
  const hasMore = reviews.length >= limit
  const nextCursor = result.nextCursor ?? null

  return { reviews, hasMore, nextCursor }
}

/**
 * Submit or update a neutral review.
 * Maps incoming dimensionKey-based ratings to dimensionId-based for the engine.
 */
export async function ctrlSubmitReview(input) {
  const { targetActorId, authorActorId, body, ratings } = input ?? {}

  assertActorId(targetActorId, 'targetActorId')
  assertActorId(authorActorId, 'authorActorId')

  if (targetActorId === authorActorId) {
    throw new Error('[VportReviews] cannot review self')
  }

  // Fetch author and target actors in parallel — one round trip each
  const [authorActor, targetActor] = await Promise.all([
    dalReadReviewTargetActor(authorActorId),
    dalReadReviewTargetActor(targetActorId),
  ])

  // Citizen-only guard: only user actors can submit reviews
  if (!authorActor || authorActor.is_void) {
    throw new Error('[VportReviews] author actor not found or void')
  }
  if (authorActor.kind !== 'user') {
    throw new Error('Only citizens can submit reviews.')
  }

  // Target must be an active vport
  if (!targetActor || targetActor.is_void || String(targetActor.kind) !== 'vport') {
    throw new Error('[VportReviews] review dimensions unavailable for this target')
  }

  // Resolve vport type → target subtype (single call, static import)
  const actorTypeRow = await readVportTypeByActorId({ actorId: targetActorId })
  const targetSubtype = String(actorTypeRow?.vport_type ?? '').trim().toLowerCase() || null

  if (!targetSubtype) {
    throw new Error('[VportReviews] review dimensions unavailable for this target')
  }

  // Fetch engine dims once — used for both validation and dimensionKey → dimensionId mapping.
  // Previously ctrlGetReviewFormConfig was called (strips id), then getReviewFormConfig again
  // (to recover id). This single call replaces both.
  const engineDims = await getReviewFormConfig({ targetKind: 'vport', targetSubtype })
  if (!engineDims.length) {
    throw new Error('[VportReviews] review dimensions unavailable for this target')
  }

  const keyToId = new Map()
  for (const d of engineDims) {
    if (d.key && d.id) keyToId.set(d.key, d.id)
  }

  // Normalize and map ratings from dimensionKey to dimensionId
  const normalizedRatings = (ratings ?? [])
    .filter((r) => r?.dimensionKey && r?.rating != null)
    .map((r) => {
      const dimensionKey = String(r.dimensionKey).trim()
      const dimensionId = keyToId.get(dimensionKey)
      if (!dimensionId) {
        throw new Error(`[VportReviews] unknown dimension key: ${dimensionKey}`)
      }
      const rating = Number(r.rating)
      if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
        throw new Error(`[VportReviews] invalid rating for ${dimensionKey}: ${r.rating}`)
      }
      return { dimensionId, rating }
    })

  if (!normalizedRatings.length) {
    throw new Error('[VportReviews] at least one rating is required')
  }

  const normalizedBody = typeof body === 'string' ? body.trim() : ''

  const result = await engineSubmitReview({
    targetActorId,
    authorActorId,
    body: normalizedBody,
    ratings: normalizedRatings,
  })

  const mapped = mapReview(result.review)

  // Notify vport owner that they received a review
  if (mapped?.id && String(authorActorId) !== String(targetActorId)) {
    publishVcsmNotification({
      recipientActorId: targetActorId,
      actorId: authorActorId,
      kind: 'review_created',
      objectType: 'review',
      objectId: mapped.id,
      linkPath: `/actor/${targetActorId}/dashboard/reviews`,
      context: {
        overallRating: mapped.overallRating ?? null,
        body: (normalizedBody ?? '').slice(0, 120) || null,
      },
    })
  }

  return mapped
}

/**
 * Get the current user's active review for a given target actor.
 * Supports both call styles:
 *   - ctrlGetMyActiveReview(targetActorId, authorActorId)
 *   - ctrlGetMyActiveReview({ targetActorId, authorActorId })
 */
export async function ctrlGetMyActiveReview(arg1, arg2) {
  const targetActorId =
    typeof arg1 === 'object' && arg1 !== null ? arg1.targetActorId : arg1
  const authorActorId =
    typeof arg1 === 'object' && arg1 !== null ? arg1.authorActorId : arg2

  assertActorId(targetActorId, 'targetActorId')
  assertActorId(authorActorId, 'authorActorId')

  const result = await engineGetMyActiveReview({ targetActorId, authorActorId })
  if (!result) return null

  return mapReview(result.review)
}

/**
 * Soft-delete a review. Supports both call styles:
 *   - ctrlDeleteMyReview({ reviewId, requesterActorId })
 *   - ctrlDeleteMyReview(reviewId, authorActorId)
 */
export async function ctrlDeleteMyReview(arg1, arg2) {
  const reviewId =
    typeof arg1 === 'object' && arg1 !== null ? arg1.reviewId : arg1
  const authorActorId =
    typeof arg1 === 'object' && arg1 !== null ? (arg1.requesterActorId ?? arg1.authorActorId) : arg2

  assertActorId(reviewId, 'reviewId')
  assertActorId(authorActorId, 'authorActorId')

  const result = await engineDeleteReview({ reviewId, authorActorId })
  return mapReview(result)
}
