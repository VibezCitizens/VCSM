// ============================================================
// Reviews Engine — Review Service
// ============================================================

import { dalGetReviewById } from '../dal/reviews.read.dal.js'
import { dalGetActiveReviewByAuthor } from '../dal/reviews.read.dal.js'
import { ReviewModel } from '../model/Review.model.js'

/**
 * Check if a review exists and is active (not deleted).
 *
 * @param {string} reviewId
 * @returns {Promise<boolean>}
 */
export async function reviewExists(reviewId) {
  const row = await dalGetReviewById({ reviewId })
  return !!(row && !row.is_deleted)
}

/**
 * Check if an author already has an active neutral review for a target.
 *
 * @param {string} targetActorId
 * @param {string} authorActorId
 * @returns {Promise<boolean>}
 */
export async function authorHasActiveReview(targetActorId, authorActorId) {
  const row = await dalGetActiveReviewByAuthor({ targetActorId, authorActorId })
  return !!row
}

/**
 * Resolve a review by ID as a domain object.
 *
 * @param {string} reviewId
 * @returns {Promise<import('../types/index.js').DomainReview|null>}
 */
export async function resolveReview(reviewId) {
  const row = await dalGetReviewById({ reviewId })
  return ReviewModel(row)
}
