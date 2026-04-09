// ============================================================
// Reviews Engine — Review Model
// ============================================================

/**
 * @param {Object} raw - reviews row
 * @returns {import('../types/index.js').DomainReview}
 */
export function ReviewModel(raw) {
  if (!raw) return null
  return {
    id:                         raw.id,
    targetActorId:              raw.target_actor_id,
    authorActorId:              raw.author_actor_id,
    targetKind:                 raw.target_kind ?? 'vport',
    targetSubtype:              raw.target_subtype ?? null,
    reviewMode:                 raw.review_mode ?? 'neutral',
    verificationStatus:         raw.verification_status ?? 'unverified',
    transactionRef:             raw.transaction_ref ?? null,
    transactionOccurredAt:      raw.transaction_occurred_at ?? null,
    ratingScale:                raw.rating_scale ?? 5,
    overallRating:              raw.overall_rating != null ? parseFloat(raw.overall_rating) : null,
    body:                       raw.body ?? '',
    activeCard:                 raw.active_card ?? true,
    authorDisplayNameSnapshot:  raw.author_display_name_snapshot ?? null,
    authorUsernameSnapshot:     raw.author_username_snapshot ?? null,
    authorAvatarUrlSnapshot:    raw.author_avatar_url_snapshot ?? null,
    targetDisplayNameSnapshot:  raw.target_display_name_snapshot ?? null,
    targetUsernameSnapshot:     raw.target_username_snapshot ?? null,
    targetAvatarUrlSnapshot:    raw.target_avatar_url_snapshot ?? null,
    createdAt:                  raw.created_at,
    updatedAt:                  raw.updated_at,
    reviewActivityAt:           raw.review_activity_at,
    isDeleted:                  raw.is_deleted ?? false,
    deletedAt:                  raw.deleted_at ?? null,
    ratings:                    raw.ratings ?? [],
  }
}
