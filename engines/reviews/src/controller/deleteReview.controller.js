// ============================================================
// Reviews Engine — Delete Review Controller
// ============================================================

import { isActorOwner } from '../config.js'
import { dalGetReviewById } from '../dal/reviews.read.dal.js'
import { dalSoftDeleteReview } from '../dal/reviews.write.dal.js'
import { ReviewModel } from '../model/Review.model.js'
import { emit, EVENTS } from '../events.js'

/**
 * Soft-delete a review. Only the author can delete their own review.
 *
 * @param {Object} params
 * @param {string} params.reviewId
 * @param {string} params.authorActorId
 * @returns {Promise<import('../types/index.js').DomainReview>}
 */
export async function deleteReview({ reviewId, authorActorId }) {
  if (!reviewId || !authorActorId) {
    throw new Error('[deleteReview] reviewId and authorActorId are required')
  }

  const existing = await dalGetReviewById({ reviewId })
  if (!existing) {
    throw new Error('[deleteReview] review not found')
  }

  if (existing.author_actor_id !== authorActorId) {
    throw new Error('[deleteReview] not authorized to delete this review')
  }

  const ownerCheck = await isActorOwner(authorActorId)
  if (!ownerCheck) {
    throw new Error('[deleteReview] not authorized as this actor')
  }

  if (existing.is_deleted) {
    return ReviewModel(existing)
  }

  const row = await dalSoftDeleteReview({ reviewId, authorActorId })

  emit(EVENTS.REVIEW_DELETED, {
    reviewId,
    targetActorId: existing.target_actor_id,
    authorActorId,
  })

  return ReviewModel(row)
}
